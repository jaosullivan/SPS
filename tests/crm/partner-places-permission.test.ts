import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN, CRM_MANAGEMENT } from "../../src/lib/crm/access";
import {
  adminFixturePassword,
  aoife,
  clubDirectory,
  memberFixturePassword,
} from "../../src/lib/crm/fixtures";
import { SAMPLE_PARTNER_PLACES, openPartnerPlaces } from "../../src/lib/crm/partners";

const managementNames = ["Members", "Sponsors", "Companies", "Deals", "Dashboard"];

test("sample partner places are fixtures, not named businesses from the CRM", () => {
  assert.equal(SAMPLE_PARTNER_PLACES.length >= 2, true);
  const kinds = new Set(SAMPLE_PARTNER_PLACES.map((place) => place.kind));
  assert.equal(kinds.has("bar"), true);
  assert.equal(kinds.has("restaurant"), true);
  for (const place of SAMPLE_PARTNER_PLACES) {
    assert.equal(place.sample, true);
    assert.equal(place.name.startsWith("Sample "), true);
    assert.equal(place.offer.startsWith("Sample offer:"), true);
    assert.equal(place.offer.toLowerCase().includes("points"), false);
  }
});

test("a signed-in member sees each sample place and its offer", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  const screen = openPartnerPlaces({ role: "member", account: signedIn.session.account });
  assert.equal(screen.phase, "open");
  assert.equal(screen.showsPointsBalance, false);
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(
    screen.places.map((place) => place.name),
    SAMPLE_PARTNER_PLACES.map((place) => place.name),
  );
  assert.deepEqual(
    screen.places.map((place) => place.offer),
    SAMPLE_PARTNER_PLACES.map((place) => place.offer),
  );
  for (const area of managementNames) {
    assert.equal(screen.visibleSections.includes(area), false);
  }
  assert.equal(signedIn.session.account.isAdmin, false);
});

test("a signed-out visitor does not see partner places", () => {
  const screen = openPartnerPlaces({ role: "anonymous" });
  assert.equal(screen.phase, "closed");
  assert.deepEqual(screen.places, []);
  assert.equal(screen.showsPointsBalance, false);
  assert.equal(screen.showsCrmManagement, false);
  assert.deepEqual(screen.visibleSections, []);
});

test("the admin session does not open the partner list as CRM management", () => {
  const access = clubDirectory();
  const admin = access.signIn(ADMIN.email, adminFixturePassword);
  assert.equal(admin.outcome, "signedIn");
  if (admin.outcome !== "signedIn") {
    return;
  }
  const screen = openPartnerPlaces({ role: "admin", session: admin.session });
  assert.equal(screen.phase, "closed");
  assert.deepEqual(screen.places, []);
  assert.equal(screen.showsCrmManagement, false);
  for (const area of CRM_MANAGEMENT) {
    assert.equal(screen.visibleSections.includes(area), false);
  }
  assert.equal(access.admin.fullName, "John Alan O'Sullivan");
  assert.equal(access.admin.isAdmin, true);
});

test("a member session still cannot open CRM member records", () => {
  const access = clubDirectory();
  const signedIn = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signedIn.outcome, "signedIn");
  if (signedIn.outcome !== "signedIn") {
    return;
  }
  const partners = openPartnerPlaces({
    role: "member",
    account: signedIn.session.account,
  });
  assert.equal(partners.phase, "open");
  const members = access.openMembersScreen({
    role: "member",
    account: signedIn.session.account,
  });
  assert.equal(members.phase, "closed");
  assert.equal(members.showsCrmManagement, false);
  assert.deepEqual(members.members, []);
  assert.equal(
    access.signIn(aoife.email, memberFixturePassword).outcome,
    "rejected",
  );
});
