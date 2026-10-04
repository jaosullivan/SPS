import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN, CRM_MANAGEMENT } from "../../src/lib/crm/access";
import { OfferEarnings } from "../../src/lib/crm/earnings";
import {
  adminFixturePassword,
  aoife,
  clubDirectory,
  liam,
  memberFixturePassword,
} from "../../src/lib/crm/fixtures";
import { SAMPLE_PARTNER_PLACES, samplePartner } from "../../src/lib/crm/partners";

const harbour = "Sample Harbour Bar";
const lantern = "Sample Lantern Restaurant";

function signedIn(access = clubDirectory(), email = aoife.email) {
  const result = access.signInAsMember(email, memberFixturePassword);
  assert.equal(result.outcome, "signedIn");
  if (result.outcome !== "signedIn") {
    throw new Error("member is not signed in");
  }
  return { access, session: result.session };
}

test("the earned Harbour Bar reward is that place's existing offer", () => {
  const place = samplePartner(harbour);
  assert.ok(place);
  assert.equal(place.offer, "Sample offer: 10% off food and drink for Green Card holders.");
  assert.equal(place.sample, true);
  const { access, session } = signedIn();
  const earnings = new OfferEarnings();
  const earned = earnings.earn(
    access,
    { role: "member", account: session.account },
    session.account.id,
    harbour,
  );
  assert.equal(earned.outcome, "earned");
  if (earned.outcome !== "earned") {
    return;
  }
  assert.equal(earned.reward.memberId, aoife.id);
  assert.equal(earned.reward.placeName, harbour);
  assert.equal(earned.reward.offer, place.offer);
  assert.equal(earned.reward.sample, true);
  assert.equal(earned.showsPointsBalance, false);
  assert.equal(earned.showsCrmManagement, false);
  assert.equal(earnings.forMember(aoife.id).length, 1);
  assert.equal(
    earnings.forMember(aoife.id).some((reward) => reward.placeName === lantern),
    false,
  );
});

test("a member without a green card does not earn the Harbour Bar offer", () => {
  const access = clubDirectory();
  const liamRecord = access.members.find((member) => member.account.id === liam.id);
  assert.ok(liamRecord);
  liamRecord.account.greenCardNumber = null;
  const { session } = signedIn(access, liam.email);
  assert.equal(session.account.greenCardNumber, null);
  const earnings = new OfferEarnings();
  const earned = earnings.earn(
    access,
    { role: "member", account: session.account },
    session.account.id,
    harbour,
  );
  assert.equal(earned.outcome, "denied");
  assert.equal(earnings.forMember(liam.id).length, 0);
  if (earned.outcome === "denied") {
    assert.equal(earned.showsPointsBalance, false);
  }
});

test("a blank green card does not qualify for the Harbour Bar offer", () => {
  const access = clubDirectory();
  const aoifeRecord = access.members.find((member) => member.account.id === aoife.id);
  assert.ok(aoifeRecord);
  aoifeRecord.account.greenCardNumber = "   ";
  const signed = access.signInAsMember(aoife.email, memberFixturePassword);
  assert.equal(signed.outcome, "signedIn");
  if (signed.outcome !== "signedIn") {
    return;
  }
  const earnings = new OfferEarnings();
  assert.equal(
    earnings.earn(
      access,
      { role: "member", account: signed.session.account },
      signed.session.account.id,
      harbour,
    ).outcome,
    "denied",
  );
  assert.equal(earnings.forMember(aoife.id).length, 0);
});

test("the Lantern Restaurant offer does not require a green card", () => {
  const place = samplePartner(lantern);
  assert.ok(place);
  assert.equal(place.offer, "Sample offer: a complimentary soft drink with a main course.");
  assert.equal(place.offer.toLowerCase().includes("green card"), false);
  const access = clubDirectory();
  const liamRecord = access.members.find((member) => member.account.id === liam.id);
  assert.ok(liamRecord);
  liamRecord.account.greenCardNumber = null;
  const { session } = signedIn(access, liam.email);
  const earnings = new OfferEarnings();
  const earned = earnings.earn(
    access,
    { role: "member", account: session.account },
    session.account.id,
    lantern,
  );
  assert.equal(earned.outcome, "earned");
  if (earned.outcome !== "earned") {
    return;
  }
  assert.equal(earned.reward.offer, place.offer);
  assert.equal(earned.reward.placeName, lantern);
  assert.equal(earned.showsPointsBalance, false);
  assert.equal(
    earnings.forMember(liam.id).some((reward) => reward.placeName === harbour),
    false,
  );
});

test("a signed-out visitor cannot earn either offer", () => {
  const access = clubDirectory();
  const earnings = new OfferEarnings();
  for (const place of [harbour, lantern]) {
    const earned = earnings.earn(access, { role: "anonymous" }, aoife.id, place);
    assert.equal(earned.outcome, "denied");
  }
  assert.equal(earnings.forMember(aoife.id).length, 0);
  assert.equal(earnings.forMember(liam.id).length, 0);
});

test("a member cannot earn an offer for another member", () => {
  const { access, session } = signedIn();
  const earnings = new OfferEarnings();
  const earned = earnings.earn(
    access,
    { role: "member", account: session.account },
    liam.id,
    harbour,
  );
  assert.equal(earned.outcome, "denied");
  assert.equal(earnings.forMember(liam.id).length, 0);
  assert.equal(earnings.forMember(aoife.id).length, 0);
});

test("earning the same offer twice does not create a points balance", () => {
  const { access, session } = signedIn();
  const earnings = new OfferEarnings();
  const actor = { role: "member" as const, account: session.account };
  assert.equal(earnings.earn(access, actor, aoife.id, harbour).outcome, "earned");
  assert.equal(earnings.earn(access, actor, aoife.id, harbour).outcome, "earned");
  assert.equal(earnings.forMember(aoife.id).length, 1);
  const places = new Set(SAMPLE_PARTNER_PLACES.map((place) => place.name));
  assert.equal(places.has(harbour), true);
  assert.equal(earnings.forMember(aoife.id)[0]?.placeName, harbour);
});

test("earning an offer does not open CRM management", () => {
  const { access, session } = signedIn();
  const earnings = new OfferEarnings();
  const earned = earnings.earn(
    access,
    { role: "member", account: session.account },
    session.account.id,
    lantern,
  );
  assert.equal(earned.outcome, "earned");
  if (earned.outcome === "earned") {
    assert.equal(earned.showsCrmManagement, false);
    assert.equal(earned.showsPointsBalance, false);
  }
  const members = access.openMembersScreen({ role: "member", account: session.account });
  assert.equal(members.phase, "closed");
  assert.equal(members.showsCrmManagement, false);
  for (const area of CRM_MANAGEMENT) {
    assert.equal(members.visibleSections.includes(area), false);
  }
  assert.equal(access.admin.fullName, "John Alan O'Sullivan");
  assert.equal(access.admin.isAdmin, true);
  const admin = access.signIn(ADMIN.email, adminFixturePassword);
  assert.equal(admin.outcome, "signedIn");
  assert.equal(access.signIn(aoife.email, memberFixturePassword).outcome, "rejected");
});
