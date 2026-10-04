/**
 * Privileged CRM access on the public website.
 *
 * The older CRM signs in with email and password, then keeps a user token in
 * the browser. Members are a separate record and cannot use that login.
 * This site keeps the same split: John Alan O'Sullivan is the only admin,
 * members stay members, and the privileged area is an httpOnly cookie scoped
 * to `/crm`. The cookie names John. It does not carry a permission flag the
 * browser can raise.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const CRM_MANAGEMENT = [
  "Dashboard",
  "Members",
  "Sponsors",
  "Companies",
  "Deals",
] as const;

export type CrmManagementArea = (typeof CRM_MANAGEMENT)[number];

export const ADMIN_SESSION_COOKIE = "sps_crm_admin";

/** Website member session. Separate from the CRM admin cookie. */
export const MEMBER_SESSION_COOKIE = "sps_member";

/** Scenario secret for the admin account. Same development password as the older CRM. */
export const adminFixturePassword = "changeme";

/** Scenario secret for club members. Not a production credential. */
export const memberFixturePassword = "green-card-fixture";

/**
 * Signs the admin cookie for this slice. Deploy is out of scope, so this is a
 * local fixture rather than a production secret.
 */
const SESSION_SECRET = "sps-crm-admin-session-fixture";

export type MembershipStatus = "active" | "lapsed" | "complimentary";

/** Club member record shared with the iPhone app and the older CRM. */
export type MemberAccount = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: MembershipStatus;
  greenCardNumber: string | null;
  isAdmin: boolean;
};

export type KnownMember = {
  account: MemberAccount;
  password: string;
};

export type AdminHolder = {
  fullName: string;
  email: string;
  isAdmin: true;
};

/** The only person who may see CRM management on the website. */
export type AdminSession = {
  holder: AdminHolder;
  management: readonly CrmManagementArea[];
};

export type CrmSignInResult =
  | { outcome: "signedIn"; session: AdminSession }
  | { outcome: "rejected" }
  | { outcome: "notImplemented" };

export type PrivilegedArea = {
  phase: "managing" | "signedOut" | "notImplemented";
  holderName: string | null;
  holderEmail: string | null;
  isAdmin: boolean;
  showsCrmManagement: boolean;
  visibleSections: readonly string[];
};

export type CrmNavLink = {
  href: string;
  label: CrmManagementArea;
};

/** Who is asking to open or change club member records. */
export type MembersActor =
  | { role: "admin"; session: AdminSession }
  | { role: "member"; account: MemberAccount }
  | { role: "anonymous" };

export type MemberRecordChanges = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: string;
  greenCardNumber: string | null;
};

export type MemberUpdateResult =
  | { outcome: "updated"; member: MemberAccount }
  | { outcome: "denied" }
  | { outcome: "notImplemented" };

export type MembersScreen = {
  phase: "open" | "closed" | "notImplemented";
  showsCrmManagement: boolean;
  visibleSections: readonly string[];
  members: readonly MemberAccount[];
};

/** Website session for a club member. The only surface is their own account. */
export type MemberSession = {
  account: MemberAccount;
  surfaces: readonly ["Account"];
};

export type MemberSignInResult =
  | { outcome: "signedIn"; session: MemberSession }
  | { outcome: "signedOut" }
  | { outcome: "notImplemented" };

export type MemberAccountScreen = {
  phase: "account" | "signedOut" | "notImplemented";
  holderName: string | null;
  holderEmail: string | null;
  greenCardNumber: string | null;
  isAdmin: boolean;
  showsCrmManagement: boolean;
  visibleSections: readonly string[];
};

export const ADMIN: AdminHolder = {
  fullName: "John Alan O'Sullivan",
  email: "admin@stpatrickshk.com",
  isAdmin: true,
};

const CRM_LINKS: readonly CrmNavLink[] = [
  { href: "/crm", label: "Dashboard" },
  { href: "/crm/members", label: "Members" },
  { href: "/crm/sponsors", label: "Sponsors" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/deals", label: "Deals" },
];

const CLOSED_MEMBERS_SCREEN: MembersScreen = {
  phase: "closed",
  showsCrmManagement: false,
  visibleSections: [],
  members: [],
};

const SIGNED_OUT: PrivilegedArea = {
  phase: "signedOut",
  holderName: null,
  holderEmail: null,
  isAdmin: false,
  showsCrmManagement: false,
  visibleSections: [],
};

export class CrmAccess {
  readonly admin: AdminHolder = ADMIN;
  readonly members: KnownMember[] = [];

  registerMember(member: KnownMember) {
    const email = member.account.email.trim().toLowerCase();
    if (email.length === 0 || email === this.admin.email.toLowerCase()) {
      return;
    }

    const account: MemberAccount = {
      ...member.account,
      email: member.account.email.trim(),
      isAdmin: false,
    };
    const known: KnownMember = { account, password: member.password };
    const existing = this.members.findIndex(
      (entry) => entry.account.email.toLowerCase() === email,
    );
    if (existing >= 0) {
      this.members[existing] = known;
      return;
    }
    this.members.push(known);
  }

  signIn(email: string, password: string): CrmSignInResult {
    const normalizedEmail = email.trim().toLowerCase();
    const secret = password.trim();
    if (normalizedEmail.length === 0 || secret.length === 0) {
      return { outcome: "rejected" };
    }

    if (normalizedEmail === this.admin.email.toLowerCase()) {
      if (!sameSecret(secret, adminFixturePassword)) {
        return { outcome: "rejected" };
      }
      return { outcome: "signedIn", session: createAdminSession() };
    }

    // Member emails, including a correct member password, are not this area.
    return { outcome: "rejected" };
  }

  openMembersScreen(actor: MembersActor): MembersScreen {
    if (!isAdminActor(actor)) {
      return CLOSED_MEMBERS_SCREEN;
    }
    return {
      phase: "open",
      showsCrmManagement: true,
      visibleSections: CRM_MANAGEMENT,
      members: this.members.map((known) => ({ ...known.account, isAdmin: false })),
    };
  }

  updateMember(
    actor: MembersActor,
    memberId: number,
    changes: MemberRecordChanges,
  ): MemberUpdateResult {
    if (!isAdminActor(actor)) {
      return { outcome: "denied" };
    }
    const index = this.members.findIndex((known) => known.account.id === memberId);
    if (index < 0) {
      return { outcome: "denied" };
    }

    const firstName = changes.firstName.trim();
    const lastName = changes.lastName.trim();
    const email = changes.email.trim();
    const status = changes.status.trim();
    if (firstName.length === 0 || lastName.length === 0 || email.length === 0) {
      return { outcome: "denied" };
    }
    if (email.toLowerCase() === this.admin.email.toLowerCase()) {
      return { outcome: "denied" };
    }
    if (!isMembershipStatus(status)) {
      return { outcome: "denied" };
    }
    const emailTaken = this.members.some(
      (known) =>
        known.account.id !== memberId &&
        known.account.email.toLowerCase() === email.toLowerCase(),
    );
    if (emailTaken) {
      return { outcome: "denied" };
    }

    const account: MemberAccount = {
      ...this.members[index].account,
      firstName,
      lastName,
      email,
      phone: blankToNil(changes.phone),
      companyName: blankToNil(changes.companyName),
      status,
      greenCardNumber: blankToNil(changes.greenCardNumber),
      isAdmin: false,
    };
    this.members[index] = { ...this.members[index], account };
    return { outcome: "updated", member: { ...account } };
  }

  /**
   * Website sign-in for a club member. Uses the email and password already
   * stored on the member record (the same account as the iPhone app).
   * This never opens the CRM admin session.
   */
  signInAsMember(email: string, password: string): MemberSignInResult {
    const normalizedEmail = email.trim().toLowerCase();
    const secret = password.trim();
    if (normalizedEmail.length === 0 || secret.length === 0) {
      return { outcome: "signedOut" };
    }
    if (normalizedEmail === this.admin.email.toLowerCase()) {
      return { outcome: "signedOut" };
    }

    const known = this.members.find(
      (entry) => entry.account.email.toLowerCase() === normalizedEmail,
    );
    if (!known || !sameSecret(secret, known.password)) {
      return { outcome: "signedOut" };
    }
    return { outcome: "signedIn", session: memberSession(known.account) };
  }
}

export function privilegedCrmArea(result: CrmSignInResult): PrivilegedArea {
  if (!isAdminSession(result)) {
    return SIGNED_OUT;
  }

  return {
    phase: "managing",
    holderName: result.session.holder.fullName,
    holderEmail: result.session.holder.email,
    isAdmin: true,
    showsCrmManagement: true,
    visibleSections: CRM_MANAGEMENT,
  };
}

export function crmNavigation(session: AdminSession | null): CrmNavLink[] {
  if (!session || !sameAdmin(session.holder)) {
    return [];
  }
  return [...CRM_LINKS];
}

export function sealAdminSession(session: AdminSession): string {
  if (!sameAdmin(session.holder)) {
    throw new Error("Only the admin session can be sealed");
  }
  const payload = Buffer.from(
    JSON.stringify({
      email: ADMIN.email,
      fullName: ADMIN.fullName,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

const MEMBER_ACCOUNT_NOT_IMPLEMENTED: MemberAccountScreen = {
  phase: "notImplemented",
  holderName: null,
  holderEmail: null,
  greenCardNumber: null,
  isAdmin: false,
  showsCrmManagement: false,
  visibleSections: [],
};

const SIGNED_OUT_ACCOUNT: MemberAccountScreen = {
  phase: "signedOut",
  holderName: null,
  holderEmail: null,
  greenCardNumber: null,
  isAdmin: false,
  showsCrmManagement: false,
  visibleSections: [],
};

export function memberAccountScreen(
  result: MemberSignInResult,
): MemberAccountScreen {
  if (result.outcome === "notImplemented") {
    return MEMBER_ACCOUNT_NOT_IMPLEMENTED;
  }
  if (result.outcome !== "signedIn" || result.session.account.isAdmin) {
    return SIGNED_OUT_ACCOUNT;
  }

  const account = result.session.account;
  return {
    phase: "account",
    holderName: `${account.firstName} ${account.lastName}`,
    holderEmail: account.email,
    greenCardNumber: account.greenCardNumber,
    isAdmin: false,
    showsCrmManagement: false,
    visibleSections: ["Account"],
  };
}

export function sealMemberSession(session: MemberSession): string {
  if (session.account.isAdmin) {
    throw new Error("A member session is not an admin session");
  }
  const payload = Buffer.from(
    JSON.stringify({
      kind: "member",
      id: session.account.id,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function openMemberSession(
  token: string | null | undefined,
  access: CrmAccess,
): MemberSession | null {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [payload, signature] = parts;
  if (!payload || !signature || !signaturesMatch(signature, sign(payload))) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isMemberPayload(parsed)) {
    return null;
  }
  const known = access.members.find((entry) => entry.account.id === parsed.id);
  if (!known) {
    return null;
  }
  return memberSession(known.account);
}

export function openAdminSession(
  token: string | null | undefined,
): AdminSession | null {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [payload, signature] = parts;
  if (!payload || !signature || !signaturesMatch(signature, sign(payload))) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isAdminPayload(parsed)) {
    return null;
  }
  return createAdminSession();
}

function isAdminActor(
  actor: MembersActor,
): actor is { role: "admin"; session: AdminSession } {
  return actor.role === "admin" && sameAdmin(actor.session.holder);
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return value === "active" || value === "lapsed" || value === "complimentary";
}

function blankToNil(value: string | null) {
  const trimmed = (value ?? "").trim();
  return trimmed.length === 0 ? null : trimmed;
}

function memberSession(account: MemberAccount): MemberSession {
  return {
    account: { ...account, isAdmin: false },
    surfaces: ["Account"],
  };
}

function isMemberPayload(
  value: unknown,
): value is { kind: "member"; id: number } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as { kind?: unknown; id?: unknown };
  return record.kind === "member" && typeof record.id === "number";
}

function createAdminSession(): AdminSession {
  return {
    holder: { ...ADMIN },
    management: CRM_MANAGEMENT,
  };
}

function isAdminSession(
  result: CrmSignInResult,
): result is { outcome: "signedIn"; session: AdminSession } {
  return result.outcome === "signedIn" && sameAdmin(result.session.holder);
}

function sameAdmin(holder: { fullName: string; email: string; isAdmin: boolean }) {
  return (
    holder.isAdmin &&
    holder.fullName === ADMIN.fullName &&
    holder.email.toLowerCase() === ADMIN.email.toLowerCase()
  );
}

function isAdminPayload(
  value: unknown,
): value is { email: string; fullName: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as { email?: unknown; fullName?: unknown };
  return record.email === ADMIN.email && record.fullName === ADMIN.fullName;
}

function sameSecret(supplied: string, expected: string) {
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function sign(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function signaturesMatch(supplied: string, expected: string) {
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
