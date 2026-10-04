/**
 * Privileged CRM access for the public website.
 *
 * The old CRM signs in with email and password and keeps members off that
 * login. This module is the same rule for the website. Sign-in behaviour is
 * not implemented yet: callers receive `notImplemented` until the admin
 * session exists.
 */

export const CRM_MANAGEMENT = [
  "Dashboard",
  "Members",
  "Sponsors",
  "Companies",
  "Deals",
] as const;

export type CrmManagementArea = (typeof CRM_MANAGEMENT)[number];

export const ADMIN_SESSION_COOKIE = "sps_crm_admin";

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

export const ADMIN: AdminHolder = {
  fullName: "John Alan O'Sullivan",
  email: "admin@stpatrickshk.com",
  isAdmin: true,
};

const NOT_IMPLEMENTED_AREA: PrivilegedArea = {
  phase: "notImplemented",
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
    this.members.push(member);
  }

  signIn(email: string, password: string): CrmSignInResult {
    void email;
    void password;
    return { outcome: "notImplemented" };
  }
}

export function privilegedCrmArea(result: CrmSignInResult): PrivilegedArea {
  void result;
  return NOT_IMPLEMENTED_AREA;
}

export function crmNavigation(session: AdminSession | null): CrmNavLink[] {
  void session;
  return [];
}

export function sealAdminSession(session: AdminSession): string {
  void session;
  return "not-implemented";
}

export function openAdminSession(
  token: string | null | undefined,
): AdminSession | null {
  void token;
  return null;
}
