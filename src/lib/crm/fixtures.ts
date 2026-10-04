import {
  CrmAccess,
  adminFixturePassword,
  memberFixturePassword,
  type KnownMember,
  type MemberAccount,
} from "./access";

export { adminFixturePassword, memberFixturePassword };

export const aoife: MemberAccount = {
  id: 1,
  firstName: "Aoife",
  lastName: "Murphy",
  email: "aoife.murphy@example.com",
  phone: "+852 5550 1001",
  companyName: "Independent",
  status: "active",
  greenCardNumber: "GC-1001",
  isAdmin: false,
};

export const liam: MemberAccount = {
  id: 2,
  firstName: "Liam",
  lastName: "Byrne",
  email: "liam.byrne@example.com",
  phone: null,
  companyName: null,
  status: "active",
  greenCardNumber: "GC-1002",
  isAdmin: false,
};

const sampleMembers = [aoife, liam];

export function knownMember(email: string): KnownMember | undefined {
  const account = sampleMembers.find(
    (member) => member.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account) {
    return undefined;
  }
  return { account, password: memberFixturePassword };
}

export function clubDirectory(): CrmAccess {
  const access = new CrmAccess();
  for (const account of sampleMembers) {
    access.registerMember({ account, password: memberFixturePassword });
  }
  return access;
}

const clubStore = globalThis as typeof globalThis & {
  __spsWebsiteClub?: CrmAccess;
};

/** In-memory club records for the running website. Tests use clubDirectory() instead. */
export function websiteClub(): CrmAccess {
  if (!clubStore.__spsWebsiteClub) {
    clubStore.__spsWebsiteClub = clubDirectory();
  }
  return clubStore.__spsWebsiteClub;
}
