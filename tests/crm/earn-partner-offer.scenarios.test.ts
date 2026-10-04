import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRM_MANAGEMENT,
  CrmAccess,
  type MemberSignInResult,
} from "../../src/lib/crm/access";
import { OfferEarnings, type EarnOfferResult } from "../../src/lib/crm/earnings";
import { knownMember } from "../../src/lib/crm/fixtures";
import { samplePartner } from "../../src/lib/crm/partners";

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/member_earns_partner_offer.feature",
);

type ParsedStep = { keyword: string; text: string };
type ParsedScenario = { title: string; steps: ParsedStep[] };
type ParsedFeature = {
  name: string;
  background: ParsedStep[];
  scenarios: ParsedScenario[];
};

class StepFailure extends Error {}

class World {
  access = new CrmAccess();
  earnings = new OfferEarnings();
  result: MemberSignInResult | null = null;
  earn: EarnOfferResult | null = null;
}

function loadFeature(): ParsedFeature {
  const feature = parseFeature(readFileSync(featurePath, "utf8"));
  if (feature.scenarios.length === 0) {
    throw new StepFailure(`No scenarios parsed from ${featurePath}`);
  }
  return feature;
}

function parseFeature(source: string): ParsedFeature {
  let name = "";
  const background: ParsedStep[] = [];
  const scenarios: ParsedScenario[] = [];
  let inBackground = false;
  let current: ParsedScenario | null = null;

  const flush = () => {
    if (current) {
      scenarios.push(current);
      current = null;
    }
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }
    if (line.startsWith("Feature:")) {
      name = line.slice("Feature:".length).trim();
      continue;
    }
    if (line.startsWith("Background:")) {
      flush();
      inBackground = true;
      continue;
    }
    if (line.startsWith("Scenario:")) {
      flush();
      inBackground = false;
      current = { title: line.slice("Scenario:".length).trim(), steps: [] };
      continue;
    }
    const keyword = stepKeyword(line);
    if (!keyword) {
      continue;
    }
    const step = { keyword, text: line.slice(keyword.length).trim() };
    if (inBackground) {
      background.push(step);
    } else if (current) {
      current.steps.push(step);
    }
  }
  flush();
  return { name, background, scenarios };
}

function stepKeyword(line: string): string | undefined {
  for (const keyword of ["Given", "When", "Then", "And", "But"]) {
    if (line === keyword || line.startsWith(`${keyword} `)) {
      return keyword;
    }
  }
  return undefined;
}

function quotedStrings(text: string): string[] {
  const values: string[] = [];
  let current = "";
  let inside = false;
  for (const character of text) {
    if (character === '"') {
      if (inside) {
        values.push(current);
        current = "";
      }
      inside = !inside;
    } else if (inside) {
      current += character;
    }
  }
  return values;
}

function memberByEmail(world: World, email: string) {
  return world.access.members.find(
    (member) => member.account.email.toLowerCase() === email.toLowerCase(),
  );
}

function execute(step: ParsedStep, world: World) {
  const { text } = step;
  const quotes = quotedStrings(text);

  if (text.startsWith("the rewards program lists sample partner ")) {
    const name = quotes[0];
    const place = name ? samplePartner(name) : undefined;
    if (!place || !place.sample || !place.name.startsWith("Sample ")) {
      throw new StepFailure(`No sample partner for ${text}`);
    }
    return;
  }

  if (text.startsWith("the club knows member ")) {
    const email = quotes[0];
    const member = email ? knownMember(email) : undefined;
    if (!member) {
      throw new StepFailure(`No known member for ${text}`);
    }
    world.access.registerMember(member);
    return;
  }

  if (text.startsWith("the only admin is ")) {
    const name = quotes[0];
    if (world.access.admin.fullName !== name || !world.access.admin.isAdmin) {
      throw new StepFailure(`Only admin is ${world.access.admin.fullName}, not ${name ?? ""}`);
    }
    return;
  }

  if (text.startsWith("member ") && text.includes(" has no green card")) {
    const email = quotes[0];
    const known = email ? memberByEmail(world, email) : undefined;
    if (!known) {
      throw new StepFailure(`No member ${email ?? ""}`);
    }
    known.account.greenCardNumber = null;
    return;
  }

  if (text.includes(" signs in on the website with password ")) {
    const email = quotes[0];
    const password = quotes[1];
    if (!email || password === undefined) {
      throw new StepFailure(`Missing email or password in ${text}`);
    }
    world.result = world.access.signInAsMember(email, password);
    if (world.result.outcome !== "signedIn") {
      throw new StepFailure(`expected signed in, got ${world.result.outcome}`);
    }
    return;
  }

  if (text.startsWith("they try to earn the offer at ")) {
    if (world.result?.outcome !== "signedIn") {
      throw new StepFailure("expected a member session");
    }
    const placeName = quotes[0];
    const email = quotes[1];
    if (!placeName || !email) {
      throw new StepFailure(`Missing place or member in ${text}`);
    }
    const target = memberByEmail(world, email);
    if (!target) {
      throw new StepFailure(`No member ${email}`);
    }
    if (target.account.id === world.result.session.account.id) {
      throw new StepFailure(`${email} is the signed-in member`);
    }
    world.earn = world.earnings.earn(
      world.access,
      { role: "member", account: world.result.session.account },
      target.account.id,
      placeName,
    );
    return;
  }

  if (text.startsWith("they earn the offer at ")) {
    const placeName = quotes[0];
    if (!placeName) {
      throw new StepFailure(`Missing place in ${text}`);
    }
    if (world.result?.outcome === "signedIn") {
      world.earn = world.earnings.earn(
        world.access,
        { role: "member", account: world.result.session.account },
        world.result.session.account.id,
        placeName,
      );
      return;
    }
    world.earn = world.earnings.earn(world.access, { role: "anonymous" }, 0, placeName);
    return;
  }

  if (text === "the offer is earned") {
    if (world.earn?.outcome !== "earned") {
      throw new StepFailure(`expected the offer to be earned, got ${world.earn?.outcome ?? "no result"}`);
    }
    return;
  }

  if (text === "the offer is denied") {
    if (world.earn?.outcome !== "denied") {
      throw new StepFailure(`expected the offer to be denied, got ${world.earn?.outcome ?? "no result"}`);
    }
    return;
  }

  if (text.startsWith("they have earned ")) {
    if (world.result?.outcome !== "signedIn") {
      throw new StepFailure("expected a member session");
    }
    if (world.earn?.outcome === "notImplemented") {
      throw new StepFailure("expected an earned offer, got notImplemented");
    }
    const offer = quotes[0];
    const placeName = quotes[1];
    const reward = world.earnings
      .forMember(world.result.session.account.id)
      .find((entry) => entry.placeName === placeName);
    if (!reward || reward.offer !== offer || !reward.sample) {
      throw new StepFailure(
        `earned ${reward?.offer ?? "nothing"} at ${reward?.placeName ?? "nowhere"}`,
      );
    }
    if (reward.memberId !== world.result.session.account.id) {
      throw new StepFailure("the offer is not tied to the signed-in member");
    }
    return;
  }

  if (text.startsWith("they have not earned an offer at ")) {
    const placeName = quotes[0];
    if (world.earn?.outcome === "notImplemented") {
      throw new StepFailure("expected no earned offer, got notImplemented");
    }
    const memberId =
      world.result?.outcome === "signedIn" ? world.result.session.account.id : 0;
    const reward = world.earnings
      .forMember(memberId)
      .find((entry) => entry.placeName === placeName);
    if (reward) {
      throw new StepFailure(`the member earned ${placeName ?? ""}`);
    }
    return;
  }

  if (text.startsWith("member ") && text.includes(" has not earned an offer at ")) {
    const email = quotes[0];
    const placeName = quotes[1];
    const known = email ? memberByEmail(world, email) : undefined;
    if (!known || !placeName) {
      throw new StepFailure(`Missing member or place in ${text}`);
    }
    if (world.earn?.outcome === "notImplemented") {
      throw new StepFailure("expected no earned offer, got notImplemented");
    }
    const reward = world.earnings
      .forMember(known.account.id)
      .find((entry) => entry.placeName === placeName);
    if (reward) {
      throw new StepFailure(`${email} earned ${placeName}`);
    }
    return;
  }

  if (text === "they do not see a points balance") {
    if (!world.earn || world.earn.outcome === "notImplemented") {
      throw new StepFailure("expected no points balance, got notImplemented");
    }
    if (world.earn.showsPointsBalance) {
      throw new StepFailure("earning showed a points balance");
    }
    return;
  }

  if (text === "they are not an admin") {
    if (world.result?.outcome !== "signedIn" || world.result.session.account.isAdmin) {
      throw new StepFailure("A member session is admin");
    }
    return;
  }

  if (text === "John is the only admin") {
    if (world.access.admin.fullName !== "John Alan O'Sullivan" || !world.access.admin.isAdmin) {
      throw new StepFailure("John is not the only admin");
    }
    if (world.access.members.some((member) => member.account.isAdmin)) {
      throw new StepFailure("A member record is an admin");
    }
    return;
  }

  if (text === "the member session does not show CRM management") {
    if (!world.earn || world.earn.outcome === "notImplemented") {
      throw new StepFailure("expected CRM management to stay hidden, got notImplemented");
    }
    if (world.earn.showsCrmManagement) {
      throw new StepFailure("A member session must not show CRM management.");
    }
    if (world.result?.outcome === "signedIn") {
      const screen = world.access.openMembersScreen({
        role: "member",
        account: world.result.session.account,
      });
      if (screen.phase !== "closed" || screen.showsCrmManagement) {
        throw new StepFailure("A member session opened CRM management");
      }
      for (const area of CRM_MANAGEMENT) {
        if (screen.visibleSections.includes(area)) {
          throw new StepFailure(`A member session showed CRM management ${area}`);
        }
      }
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares earn partner offer scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Member earns a partner offer");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Green Card holder earns the Harbour Bar offer",
      "Member without a green card does not earn the Harbour Bar offer",
      "Signed-in member earns the Lantern Restaurant offer",
      "A signed-out visitor cannot earn an offer",
      "A member cannot earn an offer for another member",
    ],
  );
  assert.ok(feature.background.length > 0);
  for (const scenario of feature.scenarios) {
    assert.ok(scenario.steps.length > 0, `${scenario.title} has no steps`);
  }
});

const feature = loadFeature();
for (const scenario of feature.scenarios) {
  test(scenario.title, () => {
    const world = new World();
    for (const step of [...feature.background, ...scenario.steps]) {
      try {
        execute(step, world);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        assert.fail(`${step.keyword} ${step.text}: ${message}`);
      }
    }
  });
}
