import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRM_MANAGEMENT,
  CrmAccess,
  type MemberSignInResult,
  type MembersScreen,
} from "../../src/lib/crm/access";
import { knownMember } from "../../src/lib/crm/fixtures";
import {
  openPartnerPlaces,
  samplePartner,
  type PartnerPlace,
  type PartnerPlacesScreen,
} from "../../src/lib/crm/partners";

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/member_sees_partner_places.feature",
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
  result: MemberSignInResult | null = null;
  screen: PartnerPlacesScreen | null = null;
  membersScreen: MembersScreen | null = null;
  currentPlace: PartnerPlace | null = null;
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
      current = {
        title: line.slice("Scenario:".length).trim(),
        steps: [],
      };
      continue;
    }
    const keyword = stepKeyword(line);
    if (!keyword) {
      continue;
    }
    const step = {
      keyword,
      text: line.slice(keyword.length).trim(),
    };
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

function requireScreen(world: World, phase: PartnerPlacesScreen["phase"]) {
  if (!world.screen) {
    throw new StepFailure("expected a partner list, got no list");
  }
  if (world.screen.phase === "notImplemented" && phase !== "notImplemented") {
    throw new StepFailure(`expected the partner list to be ${phase}, got notImplemented`);
  }
  if (world.screen.phase !== phase) {
    throw new StepFailure(
      `expected the partner list to be ${phase}, got ${world.screen.phase}`,
    );
  }
  return world.screen;
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
      throw new StepFailure(
        `Only admin is ${world.access.admin.fullName}, not ${name ?? ""}`,
      );
    }
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

  if (text === "they open the partner places") {
    const actor =
      world.result?.outcome === "signedIn"
        ? { role: "member" as const, account: world.result.session.account }
        : { role: "anonymous" as const };
    world.screen = openPartnerPlaces(actor);
    world.currentPlace = null;
    return;
  }

  if (text.startsWith("they see partner ")) {
    const screen = requireScreen(world, "open");
    const name = quotes[0];
    const place = screen.places.find((entry) => entry.name === name);
    if (!place) {
      throw new StepFailure(`partner list did not show ${name ?? ""}`);
    }
    world.currentPlace = place;
    return;
  }

  if (text.startsWith("they do not see partner ")) {
    const screen = world.screen;
    if (!screen || screen.phase === "notImplemented") {
      throw new StepFailure("expected the partner list to stay hidden, got notImplemented");
    }
    const name = quotes[0];
    if (name && screen.places.some((place) => place.name === name)) {
      throw new StepFailure(`partner list showed ${name}`);
    }
    return;
  }

  if (text.startsWith("that place is a ")) {
    const kind = quotes[0];
    if (!world.currentPlace || world.currentPlace.kind !== kind) {
      throw new StepFailure(
        `place is ${world.currentPlace?.kind ?? "missing"}, expected ${kind ?? ""}`,
      );
    }
    return;
  }

  if (text.startsWith("they see the offer ")) {
    const offer = quotes[0];
    if (!world.currentPlace || world.currentPlace.offer !== offer) {
      throw new StepFailure(
        `offer was ${world.currentPlace?.offer ?? "missing"}, expected ${offer ?? ""}`,
      );
    }
    return;
  }

  if (text === "they do not see a points balance") {
    const screen = world.screen;
    if (!screen || screen.phase === "notImplemented") {
      throw new StepFailure("expected no points balance, got notImplemented");
    }
    if (screen.showsPointsBalance) {
      throw new StepFailure("the partner list showed a points balance");
    }
    return;
  }

  if (text === "every place is marked as a sample") {
    const screen = requireScreen(world, "open");
    if (screen.places.length === 0) {
      throw new StepFailure("the partner list was empty");
    }
    for (const place of screen.places) {
      if (!place.sample || !place.name.startsWith("Sample ")) {
        throw new StepFailure(`${place.name} is not marked as a sample`);
      }
    }
    return;
  }

  if (text === "the partner list stays closed") {
    const screen = requireScreen(world, "closed");
    if (screen.places.length > 0 || screen.showsCrmManagement || screen.showsPointsBalance) {
      throw new StepFailure("the closed partner list showed places");
    }
    return;
  }

  if (text === "they are not an admin") {
    if (world.result?.outcome !== "signedIn" || world.result.session.account.isAdmin) {
      throw new StepFailure("A member session is admin");
    }
    return;
  }

  if (text === "they open the members screen") {
    if (world.result?.outcome !== "signedIn") {
      throw new StepFailure("expected a member session");
    }
    world.membersScreen = world.access.openMembersScreen({
      role: "member",
      account: world.result.session.account,
    });
    return;
  }

  if (text === "the members screen stays closed") {
    if (!world.membersScreen || world.membersScreen.phase !== "closed") {
      throw new StepFailure(
        `expected the members screen to be closed, got ${world.membersScreen?.phase ?? "no screen"}`,
      );
    }
    if (world.membersScreen.members.length > 0 || world.membersScreen.showsCrmManagement) {
      throw new StepFailure("the members screen opened for a member session");
    }
    return;
  }

  if (text === "the member session does not show CRM management") {
    const screen = world.screen;
    if (!screen || screen.phase === "notImplemented") {
      throw new StepFailure("expected CRM management to stay hidden, got notImplemented");
    }
    if (screen.showsCrmManagement) {
      throw new StepFailure("A member session must not show CRM management.");
    }
    for (const area of CRM_MANAGEMENT) {
      if (screen.visibleSections.includes(area)) {
        throw new StepFailure(`A member session showed CRM management ${area}`);
      }
    }
    if (world.membersScreen) {
      if (world.membersScreen.phase !== "closed" || world.membersScreen.showsCrmManagement) {
        throw new StepFailure("A member session opened CRM management");
      }
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares partner place scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Member sees partner places");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Signed-in member sees each place and its offer",
      "A signed-out visitor does not see partner places",
      "A member session does not open the CRM",
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
