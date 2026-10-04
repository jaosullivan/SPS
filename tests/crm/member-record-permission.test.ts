import assert from "node:assert/strict";
import test from "node:test";
import {
  CRM_MANAGEMENT,
  type MemberAccount,
  type MemberRecordChanges,
  type MembersActor,
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

function adminActor(): MembersActor {
  const result = clubDirectory().signIn(
    "admin@stpatrickshk.com",
    adminFixturePassword,
  );
  if (result.outcome !== "signedIn") {
    throw new Error(`Expected an admin session, got ${result.outcome}`);
  }
  return { role: "admin", session: result.session };
}

function changesFor(
  account: MemberAccount,
  overrides: Partial<MemberRecordChanges> = {},
): MemberRecordChanges {
  return {
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    phone: account.phone,
    companyName: account.companyName,
    status: account.status,
    greenCardNumber: account.greenCardNumber,
    ...overrides,
  };
}

function snapshot(access: ReturnType<typeof clubDirectory>) {
  return access.members.map((member) => ({
    ...member.account,
    password: member.password,
  }));
}

test("admin members screen lists club records and not John", () => {
  const access = clubDirectory();
  const screen = access.openMembersScreen(adminActor());
  assert.equal(
    screen.phase,
    "open",
    `Expected the members screen to open for the admin, got ${screen.phase}`,
  );
  assert.equal(screen.showsCrmManagement, true);
  assert.deepEqual(new Set(screen.visibleSections), new Set(managementNames));

  const aoifeOnScreen = screen.members.find((member) => member.email === aoife.email);
  const liamOnScreen = screen.members.find((member) => member.email === liam.email);
  assert.ok(aoifeOnScreen, "Aoife is missing from the members screen");
  assert.ok(liamOnScreen, "Liam is missing from the members screen");
  assert.equal(`${aoifeOnScreen.firstName} ${aoifeOnScreen.lastName}`, "Aoife Murphy");
  assert.equal(aoifeOnScreen.phone, "+852 5550 1001");
  assert.equal(aoifeOnScreen.companyName, "Independent");
  assert.equal(aoifeOnScreen.status, "active");
  assert.equal(aoifeOnScreen.greenCardNumber, "GC-1001");
  assert.equal(aoifeOnScreen.isAdmin, false);
  assert.equal(liamOnScreen.phone, null);
  assert.equal(liamOnScreen.companyName, null);
  assert.equal(liamOnScreen.status, "active");
  assert.equal(liamOnScreen.greenCardNumber, "GC-1002");
  assert.equal(
    screen.members.some((member) => member.email === "admin@stpatrickshk.com"),
    false,
  );
  assert.equal(
    screen.members.some(
      (member) => `${member.firstName} ${member.lastName}` === "John Alan O'Sullivan",
    ),
    false,
  );
  for (const member of screen.members) {
    assert.equal("password" in member, false);
    assert.equal(member.isAdmin, false);
  }
});

test("a member session cannot open the members screen or see CRM management", () => {
  const access = clubDirectory();
  const screen = access.openMembersScreen({
    role: "member",
    account: { ...aoife, isAdmin: true },
  });
  assert.notEqual(
    screen.phase,
    "notImplemented",
    "expected the members screen to stay closed, got notImplemented",
  );
  assert.equal(screen.phase, "closed", "Members cannot open this screen.");
  assert.equal(screen.members.length, 0);
  assert.equal(
    screen.showsCrmManagement,
    false,
    "A member session must not show CRM management.",
  );
  for (const area of CRM_MANAGEMENT) {
    assert.equal(
      screen.visibleSections.includes(area),
      false,
      `A member session showed CRM management ${area}`,
    );
  }
});

test("an anonymous visitor cannot open the members screen", () => {
  const screen = clubDirectory().openMembersScreen({ role: "anonymous" });
  assert.equal(screen.phase, "closed");
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual([...screen.members], []);
  assert.deepEqual([...screen.visibleSections], []);
});

test("admin can update phone company status and green card", () => {
  const access = clubDirectory();
  const beforeLiam = snapshot(access).find((member) => member.email === liam.email);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, {
      phone: "  +852 5550 1999  ",
      companyName: "  Harbour Office  ",
      status: "lapsed",
      greenCardNumber: " GC-1001A ",
    }),
  );
  assert.equal(
    result.outcome,
    "updated",
    `Expected the member record to be saved, got ${result.outcome}`,
  );
  if (result.outcome !== "updated") {
    return;
  }
  assert.equal(result.member.phone, "+852 5550 1999");
  assert.equal(result.member.companyName, "Harbour Office");
  assert.equal(result.member.status, "lapsed");
  assert.equal(result.member.greenCardNumber, "GC-1001A");
  assert.equal(result.member.email, aoife.email);
  assert.equal(result.member.firstName, "Aoife");
  assert.equal(result.member.lastName, "Murphy");
  assert.equal(result.member.isAdmin, false);
  assert.equal(result.member.id, aoife.id);

  const saved = access.members.find((member) => member.account.id === aoife.id);
  assert.equal(saved?.account.phone, "+852 5550 1999");
  assert.equal(saved?.password, memberFixturePassword);
  assert.deepEqual(
    access.members.find((member) => member.account.id === liam.id)?.account,
    beforeLiam && {
      id: beforeLiam.id,
      firstName: beforeLiam.firstName,
      lastName: beforeLiam.lastName,
      email: beforeLiam.email,
      phone: beforeLiam.phone,
      companyName: beforeLiam.companyName,
      status: beforeLiam.status,
      greenCardNumber: beforeLiam.greenCardNumber,
      isAdmin: beforeLiam.isAdmin,
    },
  );
});

test("admin can change a member name and email", () => {
  const access = clubDirectory();
  const result = access.updateMember(
    adminActor(),
    liam.id,
    changesFor(liam, {
      firstName: " William ",
      lastName: " Byrne ",
      email: " William.Byrne@Example.com ",
    }),
  );
  assert.equal(result.outcome, "updated");
  if (result.outcome !== "updated") {
    return;
  }
  assert.equal(result.member.firstName, "William");
  assert.equal(result.member.lastName, "Byrne");
  assert.equal(result.member.email, "William.Byrne@Example.com");
  assert.equal(result.member.greenCardNumber, "GC-1002");
  assert.equal(result.member.isAdmin, false);
  assert.equal(
    access.members.some((member) => member.account.email === liam.email),
    false,
  );
  assert.equal(
    access.members.find((member) => member.account.id === aoife.id)?.account.email,
    aoife.email,
  );
});

test("blank email is denied and leaves the record unchanged", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, { email: "   ", phone: "+852 5550 1999" }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("blank name is denied and leaves the record unchanged", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, { firstName: " ", lastName: "Murphy" }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("a member cannot take another member's email", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, { email: "  Liam.Byrne@Example.com " }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("a member record cannot use the admin mailbox", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, { email: " Admin@StPatricksHK.com " }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("an unknown status is denied", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, { status: "visitor" }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("blank phone company and green card clear only those fields", () => {
  const access = clubDirectory();
  const result = access.updateMember(
    adminActor(),
    aoife.id,
    changesFor(aoife, {
      phone: "   ",
      companyName: " ",
      greenCardNumber: "",
    }),
  );
  assert.equal(result.outcome, "updated");
  if (result.outcome !== "updated") {
    return;
  }
  assert.equal(result.member.phone, null);
  assert.equal(result.member.companyName, null);
  assert.equal(result.member.greenCardNumber, null);
  assert.equal(result.member.email, aoife.email);
  assert.equal(result.member.status, "active");
  assert.equal(`${result.member.firstName} ${result.member.lastName}`, "Aoife Murphy");
  assert.equal(result.member.isAdmin, false);
});

test("a member cannot update a club record", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    { role: "member", account: { ...aoife, isAdmin: true } },
    liam.id,
    changesFor(liam, { phone: "+852 5550 2002", companyName: "Stolen Co" }),
  );
  assert.equal(
    result.outcome,
    "denied",
    `Expected the member update to be denied, got ${result.outcome}`,
  );
  assert.deepEqual(snapshot(access), before);
  const screen = access.openMembersScreen({
    role: "member",
    account: { ...aoife, isAdmin: true },
  });
  assert.equal(screen.showsCrmManagement, false);
  for (const area of managementNames) {
    assert.equal(screen.visibleSections.includes(area), false, area);
  }
});

test("an anonymous visitor cannot update a member record", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(
    { role: "anonymous" },
    aoife.id,
    changesFor(aoife, { phone: "+852 5550 1999" }),
  );
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});

test("an unknown member cannot be updated", () => {
  const access = clubDirectory();
  const before = snapshot(access);
  const result = access.updateMember(adminActor(), 999, changesFor(aoife));
  assert.equal(result.outcome, "denied");
  assert.deepEqual(snapshot(access), before);
});
