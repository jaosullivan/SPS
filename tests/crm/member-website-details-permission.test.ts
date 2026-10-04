import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN,
  CRM_MANAGEMENT,
  memberAccountScreen,
  openMemberSession,
  sealMemberSession,
} from "../../src/lib/crm/access";
import {
  adminFixturePassword,
  aoife,
  clubDirectory,
  liam,
  memberFixturePassword,
} from "../../src/lib/crm/fixtures";

function signedInAoife(access = clubDirectory()) {
  const result = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(result.outcome, "signedIn");
  if (result.outcome !== "signedIn") {
    throw new Error("Aoife is not signed in");
  }
  return { access, session: result.session };
}

test("a signed-in member can change their own phone on the same record", () => {
  const { access, session } = signedInAoife();
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: "  +852 5550 1999  ",
    email: aoife.email,
    companyName: aoife.companyName,
  });
  assert.equal(updated.outcome, "updated");
  if (updated.outcome !== "updated") {
    return;
  }
  assert.equal(updated.session.account.phone, "+852 5550 1999");
  assert.equal(updated.session.account.email, aoife.email);
  assert.equal(updated.session.account.companyName, "Independent");
  assert.equal(updated.session.account.isAdmin, false);
  assert.deepEqual(updated.session.surfaces, ["Account"]);
  assert.equal(access.members.length, 2);
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.account.phone,
    "+852 5550 1999",
  );
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.password,
    memberFixturePassword,
  );
  assert.equal(
    access.members.find((member) => member.account.id === liam.id)?.account.phone,
    null,
  );
});

test("a signed-in member can change their own email and company", () => {
  const { access, session } = signedInAoife();
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: aoife.phone,
    email: "  aoife@harbour.example  ",
    companyName: "  Harbour Office  ",
  });
  assert.equal(updated.outcome, "updated");
  if (updated.outcome !== "updated") {
    return;
  }
  assert.equal(updated.session.account.email, "aoife@harbour.example");
  assert.equal(updated.session.account.companyName, "Harbour Office");
  assert.equal(updated.session.account.phone, aoife.phone);
  assert.equal(updated.session.account.firstName, "Aoife");
  assert.equal(updated.session.account.lastName, "Murphy");
  assert.equal(updated.session.account.status, "active");
  assert.equal(updated.session.account.greenCardNumber, "GC-1001");
  assert.equal(updated.session.account.isAdmin, false);
  assert.deepEqual(updated.session.surfaces, ["Account"]);
  assert.equal(access.members.length, 2);
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.password,
    memberFixturePassword,
  );

  const again = access.signInAsMember("aoife@harbour.example", memberFixturePassword);
  assert.equal(again.outcome, "signedIn");
  if (again.outcome === "signedIn") {
    assert.equal(again.session.account.id, aoife.id);
    assert.equal(again.session.account.isAdmin, false);
  }
  assert.equal(
    access.signInAsMember(aoife.email, memberFixturePassword).outcome,
    "signedOut",
  );
  const screen = memberAccountScreen(again);
  assert.equal(screen.phase, "account");
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(screen.visibleSections, ["Account"]);
  for (const area of CRM_MANAGEMENT) {
    assert.equal(screen.visibleSections.includes(area), false);
  }
});

test("a member cannot edit another member", () => {
  const { access, session } = signedInAoife();
  const before = access.members.map((member) => ({
    ...member,
    account: { ...member.account },
  }));
  const updated = access.updateOwnDetails(session, liam.id, {
    phone: "+852 5550 2002",
    email: "liam.byrne@stolen.example",
    companyName: "Stolen Co",
  });
  assert.equal(updated.outcome, "denied");
  assert.deepEqual(
    access.members.map((member) => member.account),
    before.map((member) => member.account),
  );
  assert.equal(
    access.members.find((member) => member.account.id === liam.id)?.password,
    memberFixturePassword,
  );
});

test("a blank email is denied and leaves the member unchanged", () => {
  const { access, session } = signedInAoife();
  const before = access.members.map((member) => ({ ...member.account }));
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: "+852 5550 1999",
    email: "   ",
    companyName: "Harbour Office",
  });
  assert.equal(updated.outcome, "denied");
  assert.deepEqual(
    access.members.map((member) => member.account),
    before,
  );
});

test("a member cannot take another member's email", () => {
  const { access, session } = signedInAoife();
  const before = access.members.map((member) => ({ ...member.account }));
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: aoife.phone,
    email: "  Liam.Byrne@Example.com  ",
    companyName: aoife.companyName,
  });
  assert.equal(updated.outcome, "denied");
  assert.deepEqual(
    access.members.map((member) => member.account),
    before,
  );
});

test("a member cannot use the admin mailbox", () => {
  const { access, session } = signedInAoife();
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: aoife.phone,
    email: `  ${ADMIN.email}  `,
    companyName: aoife.companyName,
  });
  assert.equal(updated.outcome, "denied");
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.account.email,
    aoife.email,
  );
});

test("blank phone and company clear only those fields", () => {
  const { access, session } = signedInAoife();
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: "   ",
    email: aoife.email,
    companyName: "  ",
  });
  assert.equal(updated.outcome, "updated");
  if (updated.outcome !== "updated") {
    return;
  }
  assert.equal(updated.session.account.phone, null);
  assert.equal(updated.session.account.companyName, null);
  assert.equal(updated.session.account.email, aoife.email);
  assert.equal(updated.session.account.firstName, "Aoife");
  assert.equal(updated.session.account.lastName, "Murphy");
  assert.equal(updated.session.account.status, "active");
  assert.equal(updated.session.account.greenCardNumber, "GC-1001");
  assert.equal(updated.session.account.isAdmin, false);
  assert.equal(
    access.members.find((member) => member.account.id === liam.id)?.account.email,
    liam.email,
  );
});

test("John remains the only admin after a member updates their own details", () => {
  const { access, session } = signedInAoife();
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: "+852 5550 1999",
    email: aoife.email,
    companyName: aoife.companyName,
  });
  assert.equal(updated.outcome, "updated");
  if (updated.outcome !== "updated") {
    return;
  }
  assert.equal(access.admin.fullName, "John Alan O'Sullivan");
  assert.equal(access.admin.isAdmin, true);
  assert.equal(updated.session.account.isAdmin, false);
  assert.deepEqual(updated.session.surfaces, ["Account"]);
  assert.equal(
    access.members.some((member) => member.account.isAdmin),
    false,
  );
  assert.equal(
    access.members.some(
      (member) => member.account.email.toLowerCase() === ADMIN.email.toLowerCase(),
    ),
    false,
  );
  const screen = access.openMembersScreen({
    role: "member",
    account: updated.session.account,
  });
  assert.equal(screen.phase, "closed");
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(screen.visibleSections, []);
  const admin = access.signIn(ADMIN.email, adminFixturePassword);
  assert.equal(admin.outcome, "signedIn");
  assert.equal(
    access.signIn(aoife.email, memberFixturePassword).outcome,
    "rejected",
  );
});

test("a member cookie reads the same record after the member changes their phone", () => {
  const { access, session } = signedInAoife();
  const token = sealMemberSession(session);
  const updated = access.updateOwnDetails(session, aoife.id, {
    phone: "+852 5550 1999",
    email: "aoife@harbour.example",
    companyName: "Harbour Office",
  });
  assert.equal(updated.outcome, "updated");
  const opened = openMemberSession(token, access);
  assert.equal(opened?.account.id, aoife.id);
  assert.equal(opened?.account.email, "aoife@harbour.example");
  assert.equal(opened?.account.phone, "+852 5550 1999");
  assert.equal(opened?.account.companyName, "Harbour Office");
  assert.equal(opened?.account.greenCardNumber, "GC-1001");
  assert.equal(opened?.account.status, "active");
  assert.equal(opened?.account.isAdmin, false);
  assert.deepEqual(opened?.surfaces, ["Account"]);
  assert.equal(access.members.length, 2);
});
