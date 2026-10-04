import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRM_MANAGEMENT,
  CrmAccess,
  memberAccountScreen,
  type MemberAccountScreen,
  type MemberSignInResult,
  type MembersScreen,
} from "../../src/lib/crm/access";
import { knownMember } from "../../src/lib/crm/fixtures";

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/member_signs_in_on_the_website.feature",
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
  access!: CrmAccess;
  result: MemberSignInResult | null = null;
  screen: MemberAccountScreen | null = null;
  membersScreen: MembersScreen | null = null;
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

function requireResult(world: World): MemberSignInResult {
  if (!world.result) {
    throw new StepFailure("expected a member sign-in result, got no result");
  }
  return world.result;
}

function requireAccountScreen(world: World, phase: MemberAccountScreen["phase"]) {
  if (!world.screen) {
    throw new StepFailure("expected an account screen, got no screen");
  }
  if (world.screen.phase === "notImplemented" && phase !== "notImplemented") {
    throw new StepFailure(
      `expected the account screen to be ${phase}, got notImplemented`,
    );
  }
  if (world.screen.phase !== phase) {
    throw new StepFailure(
      `expected the account screen to be ${phase}, got ${world.screen.phase}`,
    );
  }
  return world.screen;
}

function assertNoCrmManagement(screen: {
  phase: string;
  showsCrmManagement: boolean;
  visibleSections: readonly string[];
}) {
  if (screen.phase === "notImplemented") {
    throw new StepFailure(
      "expected CRM management to stay hidden, got notImplemented",
    );
  }
  if (screen.showsCrmManagement) {
    throw new StepFailure("A member session must not show CRM management.");
  }
  for (const area of CRM_MANAGEMENT) {
    if (screen.visibleSections.includes(area)) {
      throw new StepFailure(`A member session showed CRM management ${area}`);
    }
  }
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
    world.screen = memberAccountScreen(world.result);
    world.membersScreen = null;
    return;
  }

  if (text === "they are signed in on the website") {
    const result = requireResult(world);
    if (result.outcome !== "signedIn") {
      throw new StepFailure(`expected signed in on the website, got ${result.outcome}`);
    }
    if (result.session.account.isAdmin) {
      throw new StepFailure("A member session is admin");
    }
    return;
  }

  if (text === "they stay signed out") {
    const result = requireResult(world);
    if (result.outcome !== "signedOut") {
      throw new StepFailure(`expected signed out, got ${result.outcome}`);
    }
    return;
  }

  if (text.startsWith("they see their own account ")) {
    const screen = requireAccountScreen(world, "account");
    const name = quotes[0];
    if (!name || screen.holderName !== name) {
      throw new StepFailure(
        `saw ${screen.holderName ?? "nobody"}, expected ${name ?? ""}`,
      );
    }
    return;
  }

  if (text.startsWith("they see their own email ")) {
    const screen = requireAccountScreen(world, "account");
    const email = quotes[0];
    if (!email || screen.holderEmail !== email) {
      throw new StepFailure(
        `saw ${screen.holderEmail ?? "no email"}, expected ${email ?? ""}`,
      );
    }
    return;
  }

  if (text.startsWith("they see their own green card ")) {
    const screen = requireAccountScreen(world, "account");
    const greenCard = quotes[0];
    if (!greenCard || screen.greenCardNumber !== greenCard) {
      throw new StepFailure(
        `saw ${screen.greenCardNumber ?? "no green card"}, expected ${greenCard ?? ""}`,
      );
    }
    return;
  }

  if (text.startsWith("they do not see ")) {
    const screen = requireAccountScreen(world, "account");
    const name = quotes[0];
    if (name && screen.holderName === name) {
      throw new StepFailure(`account screen showed ${name}`);
    }
    return;
  }

  if (text === "they do not see an account") {
    const screen = requireAccountScreen(world, "signedOut");
    if (screen.holderName || screen.holderEmail || screen.greenCardNumber) {
      throw new StepFailure("signed-out screen showed an account");
    }
    return;
  }

  if (text === "they are not an admin") {
    const result = requireResult(world);
    const screen = requireAccountScreen(world, "account");
    if (result.outcome !== "signedIn" || result.session.account.isAdmin || screen.isAdmin) {
      throw new StepFailure("A member session is admin");
    }
    return;
  }

  if (text === "John is the only admin") {
    if (
      world.access.admin.fullName !== "John Alan O'Sullivan" ||
      !world.access.admin.isAdmin
    ) {
      throw new StepFailure("John is not the only admin");
    }
    if (
      world.access.members.some(
        (member) =>
          member.account.isAdmin ||
          member.account.email.toLowerCase() === world.access.admin.email.toLowerCase(),
      )
    ) {
      throw new StepFailure("A member record is an admin");
    }
    return;
  }

  if (text === "they open the members screen") {
    const result = requireResult(world);
    if (result.outcome !== "signedIn") {
      throw new StepFailure(
        `expected a member session before opening members, got ${result.outcome}`,
      );
    }
    world.membersScreen = world.access.openMembersScreen({
      role: "member",
      account: result.session.account,
    });
    return;
  }

  if (text === "the members screen stays closed") {
    if (!world.membersScreen) {
      throw new StepFailure("expected a members screen, got no screen");
    }
    if (world.membersScreen.phase === "notImplemented") {
      throw new StepFailure("expected the members screen to be closed, got notImplemented");
    }
    if (world.membersScreen.phase !== "closed" || world.membersScreen.members.length > 0) {
      throw new StepFailure("the members screen opened for a member session");
    }
    return;
  }

  if (text === "the member session does not show CRM management") {
    const result = requireResult(world);
    if (result.outcome === "signedIn") {
      const account = result.session.account;
      if (
        result.session.surfaces.some((surface) =>
          (CRM_MANAGEMENT as readonly string[]).includes(surface),
        )
      ) {
        throw new StepFailure(
          `member surfaces include CRM management: ${result.session.surfaces.join(", ")}`,
        );
      }
      if (account.isAdmin) {
        throw new StepFailure("A member session is admin");
      }
    }
    if (world.screen) {
      assertNoCrmManagement(world.screen);
    }
    if (world.membersScreen) {
      assertNoCrmManagement(world.membersScreen);
    }
    if (world.screen?.phase === "account") {
      if (!world.screen.visibleSections.includes("Account")) {
        throw new StepFailure("A signed-in member did not see their account");
      }
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares member website sign-in scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Member signs in on the website");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Known member with valid details sees their own account",
      "Wrong password stays signed out",
      "Unknown email stays signed out",
      "The admin account is not a member session",
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
    world.access = new CrmAccess();
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
