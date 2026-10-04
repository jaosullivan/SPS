import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN,
  ADMIN_SESSION_COOKIE,
  CRM_MANAGEMENT,
  CrmAccess,
  MEMBER_SESSION_COOKIE,
  memberAccountScreen,
  openAdminSession,
  openMemberSession,
  sealAdminSession,
  sealMemberSession,
  type AdminSession,
} from "../../src/lib/crm/access";
import {
  adminFixturePassword,
  aoife,
  clubDirectory,
  liam,
  memberFixturePassword,
} from "../../src/lib/crm/fixtures";

const managementNames = [
  "Members",
  "Sponsors",
  "Companies",
  "Deals",
  "Dashboard",
];

function adminSession(): AdminSession {
  return {
    holder: ADMIN,
    management: CRM_MANAGEMENT,
  };
}

test("member website sign-in uses the password stored on the member record", () => {
  const access = new CrmAccess();
  access.registerMember({
    account: aoife,
    password: memberFixturePassword,
  });

  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  assert.equal(
    access.signInAsMember(aoife.email, adminFixturePassword).outcome,
    "signedOut",
    "The admin password is not a second member credential",
  );

  assert.equal(access.members.length, 1);
  access.members[0]!.password = "harbour-pass";
  assert.equal(access.signInAsMember(aoife.email, memberFixturePassword).outcome, "signedOut");
  const changed = access.signInAsMember(aoife.email, "harbour-pass");
  assert.equal(changed.outcome, "signedIn");
  if (changed.outcome === "signedIn") {
    assert.equal(changed.session.account.email, aoife.email);
    assert.equal(changed.session.account.id, aoife.id);
  }
});

test("an admin email change is the same member account", () => {
  const access = clubDirectory();
  const admin = access.signIn(access.admin.email, adminFixturePassword);
  assert.equal(admin.outcome, "signedIn");
  if (admin.outcome !== "signedIn") {
    return;
  }

  const updated = access.updateMember(
    { role: "admin", session: admin.session },
    aoife.id,
    {
      firstName: aoife.firstName,
      lastName: aoife.lastName,
      email: "aoife@harbour.example",
      phone: aoife.phone,
      companyName: aoife.companyName,
      status: aoife.status,
      greenCardNumber: aoife.greenCardNumber,
    },
  );
  assert.equal(updated.outcome, "updated");
  assert.equal(access.members.length, 2);

  const signedIn = access.signInAsMember("aoife@harbour.example", memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome === "signedIn") {
    assert.equal(signedIn.session.account.email, "aoife@harbour.example");
    assert.equal(signedIn.session.account.id, aoife.id);
    assert.equal(signedIn.session.account.isAdmin, false);
  }
  assert.equal(
    access.signInAsMember(aoife.email, memberFixturePassword).outcome,
    "signedOut",
  );
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.password,
    memberFixturePassword,
  );
});

test("member website sign-in matches the stored email ignoring case and surrounding space", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(
    "  Aoife.Murphy@Example.com  ",
    `  ${memberFixturePassword}  `,
  );
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  assert.equal(signedIn.session.account.email, aoife.email);
  assert.equal(signedIn.session.account.isAdmin, false);
  assert.deepEqual(signedIn.session.surfaces, ["Account"]);
});

test("a member flagged as admin still signs in as a member", () => {
  const access = new CrmAccess();
  access.registerMember({
    account: { ...aoife, isAdmin: true },
    password: memberFixturePassword,
  });
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  assert.equal(signedIn.session.account.isAdmin, false);
  assert.deepEqual(signedIn.session.surfaces, ["Account"]);
});

test("a blank member password stays signed out", () => {
  const access = clubDirectory();
  assert.equal(access.signInAsMember(aoife.email, "   ").outcome, "signedOut");
  assert.equal(access.signInAsMember("   ", memberFixturePassword).outcome, "signedOut");
});

test("a member account shows Account and hides CRM management", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  const screen = memberAccountScreen(signedIn);
  assert.equal(screen.phase, "account");
  assert.equal(screen.holderName, "Aoife Murphy");
  assert.equal(screen.holderEmail, aoife.email);
  assert.equal(screen.greenCardNumber, aoife.greenCardNumber);
  assert.equal(screen.isAdmin, false);
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(screen.visibleSections, ["Account"]);
  for (const area of managementNames) {
    assert.equal(screen.visibleSections.includes(area), false);
  }
  assert.equal(screen.holderName === "Liam Byrne", false);
});

test("the admin password does not open a member session", () => {
  const access = clubDirectory();
  assert.equal(
    access.signInAsMember(ADMIN.email, adminFixturePassword).outcome,
    "signedOut",
  );
  assert.equal(
    access.signIn(aoife.email, memberFixturePassword).outcome,
    "rejected",
    "A member password still does not open the CRM",
  );
});

test("a member session cannot open CRM member records", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(liam.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  const screen = access.openMembersScreen({
    role: "member",
    account: signedIn.session.account,
  });
  assert.equal(screen.phase, "closed");
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(screen.members, []);
  assert.deepEqual(screen.visibleSections, []);
});

test("a member session cookie is not an admin session", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }

  assert.equal(MEMBER_SESSION_COOKIE === ADMIN_SESSION_COOKIE, false);
  const token = sealMemberSession(signedIn.session);
  const opened = openMemberSession(token, access);
  assert.equal(opened?.account.id, aoife.id);
  assert.equal(opened?.account.email, aoife.email);
  assert.equal(opened?.account.isAdmin, false);
  assert.deepEqual(opened?.surfaces, ["Account"]);

  assert.equal(openMemberSession(`${token}x`, access), null);
  assert.equal(openAdminSession(token), null);

  const adminToken = sealAdminSession(adminSession());
  assert.equal(openMemberSession(adminToken, access), null);
  assert.equal(openAdminSession(adminToken)?.holder.fullName, ADMIN.fullName);
});

test("a member cookie follows the same record after the admin changes the email", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  const token = sealMemberSession(signedIn.session);
  const admin = access.signIn(access.admin.email, adminFixturePassword);
  assert.equal(admin.outcome, "signedIn");
  if (admin.outcome !== "signedIn") {
    return;
  }
  const updated = access.updateMember(
    { role: "admin", session: admin.session },
    aoife.id,
    {
      firstName: "Aoife",
      lastName: "Murphy",
      email: "aoife@harbour.example",
      phone: aoife.phone,
      companyName: "Harbour Office",
      status: "lapsed",
      greenCardNumber: "GC-1001A",
    },
  );
  assert.equal(updated.outcome, "updated");

  const opened = openMemberSession(token, access);
  assert.equal(opened?.account.email, "aoife@harbour.example");
  assert.equal(opened?.account.companyName, "Harbour Office");
  assert.equal(opened?.account.greenCardNumber, "GC-1001A");
  assert.equal(opened?.account.status, "lapsed");
  assert.equal(opened?.account.isAdmin, false);
  assert.equal(access.members.length, 2);
});
