import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CrmAccess,
  privilegedCrmArea,
  type CrmSignInResult,
} from "../../src/lib/crm/access";
import { knownMember } from "../../src/lib/crm/fixtures";

const CRM_MANAGEMENT = [
  "Members",
  "Sponsors",
  "Companies",
  "Deals",
  "Dashboard",
] as const;

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/admin_signs_in.feature",
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
  result: CrmSignInResult | null = null;
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

function requireResult(world: World): CrmSignInResult {
  if (!world.result) {
    throw new StepFailure("expected a sign-in result, got no result");
  }
  return world.result;
}

function execute(step: ParsedStep, world: World) {
  const { text } = step;
  const quotes = quotedStrings(text);

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
    if (world.access.admin.fullName !== name) {
      throw new StepFailure(
        `Only admin is ${world.access.admin.fullName}, not ${name ?? ""}`,
      );
    }
    if (!world.access.admin.isAdmin) {
      throw new StepFailure("The only admin is not marked admin");
    }
    return;
  }

  if (text.includes("signs in to the CRM with password ")) {
    if (quotes.length !== 2) {
      throw new StepFailure(`Expected email and password in ${text}`);
    }
    world.result = world.access.signIn(quotes[0], quotes[1]);
    return;
  }

  if (text === "they are signed in as the admin") {
    const result = requireResult(world);
    if (result.outcome !== "signedIn") {
      throw new StepFailure(
        `Expected a signed-in admin session, got ${result.outcome}`,
      );
    }
    if (result.session.holder.fullName !== "John Alan O'Sullivan") {
      throw new StepFailure(
        `Expected John Alan O'Sullivan, got ${result.session.holder.fullName}`,
      );
    }
    if (result.session.holder.email !== "admin@stpatrickshk.com") {
      throw new StepFailure(
        `Expected admin@stpatrickshk.com, got ${result.session.holder.email}`,
      );
    }
    if (!result.session.holder.isAdmin) {
      throw new StepFailure("Signed-in holder is not the admin");
    }
    return;
  }

  if (text === "they stay signed out") {
    const result = requireResult(world);
    if (result.outcome !== "rejected") {
      throw new StepFailure(`expected rejected, got ${result.outcome}`);
    }
    return;
  }

  if (text === "they see CRM management") {
    const result = requireResult(world);
    const area = privilegedCrmArea(result);
    if (result.outcome === "notImplemented" || area.phase === "notImplemented") {
      throw new StepFailure("expected CRM management, got notImplemented");
    }
    if (result.outcome !== "signedIn" || !area.showsCrmManagement) {
      throw new StepFailure("CRM management is not visible");
    }
    for (const name of CRM_MANAGEMENT) {
      if (!area.visibleSections.includes(name)) {
        throw new StepFailure(`CRM management is missing ${name}`);
      }
    }
    return;
  }

  if (text === "they do not see CRM management") {
    const result = requireResult(world);
    const area = privilegedCrmArea(result);
    if (result.outcome === "notImplemented" || area.phase === "notImplemented") {
      throw new StepFailure(
        "expected CRM management to stay hidden, got notImplemented",
      );
    }
    if (area.showsCrmManagement) {
      throw new StepFailure("CRM management is visible");
    }
    for (const name of CRM_MANAGEMENT) {
      if (area.visibleSections.includes(name)) {
        throw new StepFailure(`CRM management showed ${name}`);
      }
    }
    return;
  }

  if (text === "John is the only admin") {
    if (world.access.admin.fullName !== "John Alan O'Sullivan") {
      throw new StepFailure(
        `expected John Alan O'Sullivan, got ${world.access.admin.fullName}`,
      );
    }
    if (world.access.members.some((member) => member.account.isAdmin)) {
      throw new StepFailure("a known member is marked admin");
    }
    const result = requireResult(world);
    if (result.outcome === "notImplemented") {
      throw new StepFailure(
        "expected the member to be refused, got notImplemented",
      );
    }
    if (result.outcome === "signedIn") {
      if (result.session.holder.fullName !== world.access.admin.fullName) {
        throw new StepFailure("a member opened the admin session");
      }
      if (result.session.holder.email !== world.access.admin.email) {
        throw new StepFailure("admin session email is not John's");
      }
    }
    return;
  }

  if (text.startsWith("they see ")) {
    const result = requireResult(world);
    const area = privilegedCrmArea(result);
    const expected = quotes[0];
    if (result.outcome === "notImplemented" || area.phase === "notImplemented") {
      throw new StepFailure(
        `expected to see ${expected ?? "the admin"}, got notImplemented`,
      );
    }
    if (!expected || area.holderName !== expected) {
      throw new StepFailure(
        `saw ${area.holderName ?? "nobody"}, expected ${expected ?? ""}`,
      );
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares admin CRM sign-in scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Admin signs in to the CRM website");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Admin signs in and sees CRM management",
      "Member login is rejected from the CRM",
      "Wrong password stays signed out",
      "Member password does not open the admin account",
      "A member is not the admin",
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
