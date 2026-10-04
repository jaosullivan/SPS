import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRM_MANAGEMENT,
  CrmAccess,
  memberAccountScreen,
  type MemberAccount,
  type MemberSignInResult,
  type OwnDetailsUpdate,
} from "../../src/lib/crm/access";
import { knownMember } from "../../src/lib/crm/fixtures";

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/member_updates_own_details_on_the_website.feature",
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
  update: OwnDetailsUpdate | null = null;
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

function requireSession(world: World) {
  if (world.result?.outcome !== "signedIn") {
    throw new StepFailure(
      `expected a member session, got ${world.result?.outcome ?? "no result"}`,
    );
  }
  if (world.result.session.account.isAdmin) {
    throw new StepFailure("A member session is admin");
  }
  return world.result.session;
}

function applyUpdate(
  world: World,
  memberId: number,
  phone: string | null,
  email: string,
  companyName: string | null,
) {
  const session = requireSession(world);
  const update = world.access.updateOwnDetails(session, memberId, {
    phone,
    email,
    companyName,
  });
  world.update = update;
  if (update.outcome === "updated") {
    world.result = { outcome: "signedIn", session: update.session };
  }
}

function ownAccount(world: World): MemberAccount {
  const session = requireSession(world);
  const screen = memberAccountScreen({ outcome: "signedIn", session });
  if (screen.phase !== "account") {
    throw new StepFailure(`expected an account screen, got ${screen.phase}`);
  }
  const stored = world.access.members.find(
    (member) => member.account.id === session.account.id,
  );
  if (!stored) {
    throw new StepFailure("signed-in member missing from the club");
  }
  return stored.account;
}

function assertField(world: World, expected: string | undefined, actual: string | null) {
  if (expected === undefined) {
    throw new StepFailure("missing expected value");
  }
  if (actual !== expected) {
    throw new StepFailure(`showed ${actual ?? "none"}, expected ${expected}`);
  }
}

function assertNoCrm(world: World) {
  if (world.update?.outcome === "notImplemented") {
    throw new StepFailure("expected CRM management to stay hidden, got notImplemented");
  }
  const session = requireSession(world);
  if (
    session.surfaces.some((surface) =>
      (CRM_MANAGEMENT as readonly string[]).includes(surface),
    )
  ) {
    throw new StepFailure(`member surfaces include CRM management: ${session.surfaces.join(", ")}`);
  }
  const screen = memberAccountScreen({ outcome: "signedIn", session });
  if (screen.phase === "notImplemented") {
    throw new StepFailure("expected CRM management to stay hidden, got notImplemented");
  }
  if (screen.showsCrmManagement || screen.isAdmin || session.account.isAdmin) {
    throw new StepFailure("A member session must not show CRM management.");
  }
  for (const area of CRM_MANAGEMENT) {
    if (screen.visibleSections.includes(area)) {
      throw new StepFailure(`A member session showed CRM management ${area}`);
    }
  }
  const membersScreen = world.access.openMembersScreen({
    role: "member",
    account: session.account,
  });
  if (membersScreen.phase !== "closed" || membersScreen.showsCrmManagement) {
    throw new StepFailure("A member session opened CRM management");
  }
  for (const area of CRM_MANAGEMENT) {
    if (membersScreen.visibleSections.includes(area)) {
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
    world.update = null;
    return;
  }

  if (text.startsWith("they change their own phone to ")) {
    const session = requireSession(world);
    const phone = quotes[0];
    if (phone === undefined) {
      throw new StepFailure(`Phone missing in ${text}`);
    }
    applyUpdate(world, session.account.id, phone, session.account.email, session.account.companyName);
    return;
  }

  if (text.startsWith("they change their own email to ")) {
    const session = requireSession(world);
    const email = quotes[0];
    if (!email) {
      throw new StepFailure(`Email missing in ${text}`);
    }
    applyUpdate(world, session.account.id, session.account.phone, email, session.account.companyName);
    return;
  }

  if (text.startsWith("they change their own company to ")) {
    const session = requireSession(world);
    const company = quotes[0];
    if (company === undefined) {
      throw new StepFailure(`Company missing in ${text}`);
    }
    applyUpdate(world, session.account.id, session.account.phone, session.account.email, company);
    return;
  }

  if (text.startsWith("they try to change the phone of ")) {
    const session = requireSession(world);
    const email = quotes[0];
    const phone = quotes[1];
    if (!email || phone === undefined) {
      throw new StepFailure(`Expected member email and phone in ${text}`);
    }
    const target = world.access.members.find(
      (member) => member.account.email.toLowerCase() === email.toLowerCase(),
    );
    if (!target) {
      throw new StepFailure(`No member ${email}`);
    }
    if (target.account.id === session.account.id) {
      throw new StepFailure(`${email} is the signed-in member`);
    }
    applyUpdate(
      world,
      target.account.id,
      phone,
      target.account.email,
      target.account.companyName,
    );
    return;
  }

  if (text.startsWith("member ") && text.includes(" has no phone")) {
    const email = quotes[0];
    if (!email) {
      throw new StepFailure(`Member email missing in ${text}`);
    }
    const member = world.access.members.find(
      (entry) => entry.account.email.toLowerCase() === email.toLowerCase(),
    );
    if (!member) {
      throw new StepFailure(`No member ${email}`);
    }
    if (member.account.phone !== null) {
      throw new StepFailure(`${email} has phone ${member.account.phone}`);
    }
    return;
  }

  if (text === "the change is saved") {
    if (world.update?.outcome !== "updated") {
      throw new StepFailure(
        `expected the change to be saved, got ${world.update?.outcome ?? "no result"}`,
      );
    }
    return;
  }

  if (text === "the change is denied") {
    if (world.update?.outcome !== "denied") {
      throw new StepFailure(
        `expected the change to be denied, got ${world.update?.outcome ?? "no result"}`,
      );
    }
    return;
  }

  if (text === "they are not an admin") {
    const session = requireSession(world);
    const screen = memberAccountScreen({ outcome: "signedIn", session });
    if (session.account.isAdmin || screen.isAdmin) {
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
    if (world.access.members.some((member) => member.account.isAdmin)) {
      throw new StepFailure("A member record is an admin");
    }
    if (world.result?.outcome === "signedIn" && world.result.session.account.isAdmin) {
      throw new StepFailure("signed-in member is admin");
    }
    return;
  }

  if (text === "the member session does not show CRM management") {
    assertNoCrm(world);
    return;
  }

  if (
    text.startsWith("they see their own account ") ||
    text.startsWith("their name is ")
  ) {
    const account = ownAccount(world);
    assertField(world, quotes[0], `${account.firstName} ${account.lastName}`);
    return;
  }

  if (text.startsWith("they see their own email ") || text.startsWith("their email is ")) {
    assertField(world, quotes[0], ownAccount(world).email);
    return;
  }

  if (text.startsWith("they see their own phone ") || text.startsWith("their phone is ")) {
    assertField(world, quotes[0], ownAccount(world).phone);
    return;
  }

  if (
    text.startsWith("they see their own company ") ||
    text.startsWith("their company is ")
  ) {
    assertField(world, quotes[0], ownAccount(world).companyName);
    return;
  }

  if (
    text.startsWith("they see their own green card ") ||
    text.startsWith("their green card is ")
  ) {
    assertField(world, quotes[0], ownAccount(world).greenCardNumber);
    return;
  }

  if (text.startsWith("they do not see ")) {
    const account = ownAccount(world);
    const name = quotes[0];
    const visible = `${account.firstName} ${account.lastName}`;
    if (name && visible === name) {
      throw new StepFailure(`account showed ${name}`);
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares member website own-details scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Member updates their own details on the website");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Signed-in member sees their own phone and contact details",
      "Signed-in member changes their own phone",
      "Signed-in member changes their own contact details",
      "Member cannot edit another member",
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
