import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN,
  ADMIN_SESSION_COOKIE,
  CRM_MANAGEMENT,
  CrmAccess,
  crmNavigation,
  openAdminSession,
  privilegedCrmArea,
  sealAdminSession,
  type AdminSession,
} from "../../src/lib/crm/access";
import {
  adminFixturePassword,
  aoife,
  clubDirectory,
  liam,
  memberFixturePassword,
} from "../../src/lib/crm/fixtures";
import { nav } from "../../src/lib/site";

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

test("CRM management areas are the old CRM tools", () => {
  assert.deepEqual(new Set(CRM_MANAGEMENT), new Set(managementNames));
});

test("the public website does not list CRM management", () => {
  const labels = nav.map((item) => item.label);
  for (const area of managementNames) {
    assert.equal(
      labels.includes(area),
      false,
      `Public navigation lists CRM management area ${area}`,
    );
  }
});

test("John is the only admin identity", () => {
  const access = clubDirectory();
  assert.equal(access.admin.fullName, "John Alan O'Sullivan");
  assert.equal(access.admin.email, "admin@stpatrickshk.com");
  assert.equal(access.admin.isAdmin, true);
  assert.equal(
    access.members.some(
      (member) =>
        member.account.email.toLowerCase() === access.admin.email.toLowerCase(),
    ),
    false,
    "The admin mailbox is not a member login",
  );
});

test("a member marked admin still cannot open the CRM", () => {
  const access = new CrmAccess();
  access.registerMember({
    account: { ...aoife, isAdmin: true },
    password: memberFixturePassword,
  });

  assert.equal(
    access.members[0]?.account.isAdmin,
    false,
    "A member is not an admin. John is the only admin.",
  );

  const result = access.signIn(aoife.email, memberFixturePassword);
  assert.equal(
    result.outcome,
    "rejected",
    `Expected the member login to be rejected, got ${result.outcome}`,
  );
  const area = privilegedCrmArea(result);
  assert.equal(area.showsCrmManagement, false);
  assert.deepEqual(area.visibleSections, []);
});

test("admin email and password open a privileged session", () => {
  const result = clubDirectory().signIn(
    "admin@stpatrickshk.com",
    adminFixturePassword,
  );
  assert.equal(
    result.outcome,
    "signedIn",
    `Expected a privileged admin session, got ${result.outcome}`,
  );
  if (result.outcome !== "signedIn") {
    return;
  }
  assert.equal(result.session.holder.fullName, "John Alan O'Sullivan");
  assert.equal(result.session.holder.email, "admin@stpatrickshk.com");
  assert.equal(result.session.holder.isAdmin, true);
  assert.deepEqual(new Set(result.session.management), new Set(managementNames));

  const area = privilegedCrmArea(result);
  assert.equal(area.phase, "managing");
  assert.equal(area.holderName, "John Alan O'Sullivan");
  assert.equal(area.holderEmail, "admin@stpatrickshk.com");
  assert.equal(area.isAdmin, true);
  assert.equal(area.showsCrmManagement, true);
  for (const name of managementNames) {
    assert.equal(area.visibleSections.includes(name), true, name);
  }
});

test("admin email match is trimmed and case insensitive", () => {
  const result = clubDirectory().signIn(
    "  Admin@StPatricksHK.com  ",
    adminFixturePassword,
  );
  assert.equal(
    result.outcome,
    "signedIn",
    `Expected a privileged admin session, got ${result.outcome}`,
  );
  if (result.outcome !== "signedIn") {
    return;
  }
  assert.equal(result.session.holder.email, "admin@stpatrickshk.com");
});

test("a known member password is rejected from the CRM", () => {
  const access = clubDirectory();
  assert.equal(
    access.members.some(
      (member) =>
        member.account.email === aoife.email &&
        member.password === memberFixturePassword &&
        member.account.isAdmin === false,
    ),
    true,
  );

  const result = access.signIn(aoife.email, memberFixturePassword);
  assert.equal(
    result.outcome,
    "rejected",
    `Expected the member login to be rejected, got ${result.outcome}`,
  );
  const area = privilegedCrmArea(result);
  assert.equal(area.phase, "signedOut");
  assert.equal(area.showsCrmManagement, false);
  assert.equal(area.holderName, null);
  for (const name of managementNames) {
    assert.equal(area.visibleSections.includes(name), false, name);
  }
});

test("the other known member is also rejected", () => {
  const result = clubDirectory().signIn(liam.email, memberFixturePassword);
  assert.equal(result.outcome, "rejected");
  assert.equal(privilegedCrmArea(result).showsCrmManagement, false);
});

test("wrong admin password stays signed out", () => {
  const result = clubDirectory().signIn(
    "admin@stpatrickshk.com",
    "wrong-password",
  );
  assert.equal(result.outcome, "rejected");
  assert.equal(privilegedCrmArea(result).visibleSections.length, 0);
});

test("member password does not open the admin account", () => {
  const result = clubDirectory().signIn(
    "admin@stpatrickshk.com",
    memberFixturePassword,
  );
  assert.equal(result.outcome, "rejected");
  assert.equal(privilegedCrmArea(result).showsCrmManagement, false);
});

test("admin password does not open a member", () => {
  const result = clubDirectory().signIn(aoife.email, adminFixturePassword);
  assert.equal(result.outcome, "rejected");
  assert.equal(privilegedCrmArea(result).showsCrmManagement, false);
});

test("unknown email stays signed out", () => {
  const result = clubDirectory().signIn(
    "stranger@example.com",
    adminFixturePassword,
  );
  assert.equal(result.outcome, "rejected");
});

test("blank password stays signed out", () => {
  const result = clubDirectory().signIn("admin@stpatrickshk.com", "   ");
  assert.equal(result.outcome, "rejected");
});

test("privileged area shows CRM management only for an admin session", () => {
  const area = privilegedCrmArea({
    outcome: "signedIn",
    session: adminSession(),
  });
  assert.equal(area.phase, "managing");
  assert.equal(area.holderName, "John Alan O'Sullivan");
  assert.equal(area.showsCrmManagement, true);
  assert.deepEqual(new Set(area.visibleSections), new Set(managementNames));
});

test("a rejected sign-in shows no CRM management", () => {
  const area = privilegedCrmArea({ outcome: "rejected" });
  assert.equal(area.phase, "signedOut");
  assert.equal(area.showsCrmManagement, false);
  assert.deepEqual([...area.visibleSections], []);
});

test("admin session navigation is the CRM management areas", () => {
  const links = crmNavigation(adminSession());
  assert.deepEqual(
    links.map((link) => link.label),
    ["Dashboard", "Members", "Sponsors", "Companies", "Deals"],
  );
  assert.deepEqual(
    links.map((link) => link.href),
    [
      "/crm",
      "/crm/members",
      "/crm/sponsors",
      "/crm/companies",
      "/crm/deals",
    ],
  );
});

test("missing session has no CRM navigation", () => {
  assert.deepEqual(crmNavigation(null), []);
});

test("admin session cookie is sealed and opens only for John", () => {
  assert.equal(ADMIN_SESSION_COOKIE, "sps_crm_admin");
  const token = sealAdminSession(adminSession());
  assert.notEqual(token, "not-implemented", "admin session seal is missing");
  const opened = openAdminSession(token);
  assert.ok(opened, "Expected the sealed admin session to open");
  assert.equal(opened.holder.fullName, "John Alan O'Sullivan");
  assert.equal(opened.holder.email, "admin@stpatrickshk.com");
  assert.equal(opened.holder.isAdmin, true);
  assert.deepEqual(new Set(opened.management), new Set(managementNames));
});

test("a tampered admin cookie does not open a session", () => {
  const token = sealAdminSession(adminSession());
  assert.equal(token.split(".").length, 2, "admin session seal is missing");
  assert.equal(openAdminSession(`${token}x`), null);
  assert.equal(openAdminSession(undefined), null);
  assert.equal(openAdminSession(""), null);
});

test("a cookie that names a member does not open an admin session", () => {
  const token = sealAdminSession(adminSession());
  const [payload, signature] = token.split(".");
  assert.ok(payload && signature, "admin session seal is missing");
  const memberPayload = Buffer.from(
    JSON.stringify({
      email: aoife.email,
      fullName: `${aoife.firstName} ${aoife.lastName}`,
    }),
  ).toString("base64url");
  assert.notEqual(memberPayload, payload);
  assert.equal(openAdminSession(`${memberPayload}.${signature}`), null);
});
