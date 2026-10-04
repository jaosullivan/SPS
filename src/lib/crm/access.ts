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
    void actor;
    return {
      phase: "notImplemented",
      showsCrmManagement: false,
      visibleSections: [],
      members: [],
    };
  }

  updateMember(
    actor: MembersActor,
    memberId: number,
    changes: MemberRecordChanges,
  ): MemberUpdateResult {
    void actor;
    void memberId;
    void changes;
    return { outcome: "notImplemented" };
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
