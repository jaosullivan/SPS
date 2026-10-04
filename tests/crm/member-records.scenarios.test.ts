import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CrmAccess,
  type MemberRecordChanges,
  type MemberUpdateResult,
  type MembersActor,
  type MembersScreen,
} from "../../src/lib/crm/access";
import {
  adminFixturePassword,
  knownMember,
} from "../../src/lib/crm/fixtures";

const CRM_MANAGEMENT = [
  "Members",
  "Sponsors",
  "Companies",
  "Deals",
  "Dashboard",
];

const featurePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../features/admin_updates_member_records.feature",
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
  actor: MembersActor = { role: "anonymous" };
  screen: MembersScreen | null = null;
  draft: MemberRecordChanges | null = null;
  draftId: number | null = null;
  update: MemberUpdateResult | null = null;
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

function fullName(member: { firstName: string; lastName: string }) {
  return `${member.firstName} ${member.lastName}`;
}

function requireScreen(world: World, phase: MembersScreen["phase"]) {
  if (!world.screen) {
    throw new StepFailure("expected a members screen, got no screen");
  }
  if (world.screen.phase === "notImplemented" && phase !== "notImplemented") {
    throw new StepFailure(`expected the members screen to be ${phase}, got notImplemented`);
  }
  if (world.screen.phase !== phase) {
    throw new StepFailure(
      `expected the members screen to be ${phase}, got ${world.screen.phase}`,
    );
  }
  return world.screen;
}

function storedMember(world: World, email: string) {
  const found = world.access.members.find(
    (member) => member.account.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found) {
    throw new StepFailure(`No stored member ${email}`);
  }
  return found.account;
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

  if (text === "the admin is signed in to the CRM") {
    const result = world.access.signIn(
      world.access.admin.email,
      adminFixturePassword,
    );
    if (result.outcome !== "signedIn") {
      throw new StepFailure(`Expected the admin to be signed in, got ${result.outcome}`);
    }
    world.actor = { role: "admin", session: result.session };
    return;
  }

  if (text.startsWith("a member session for ")) {
    const email = quotes[0];
    const member = email ? knownMember(email) : undefined;
    if (!member) {
      throw new StepFailure(`No known member for ${text}`);
    }
    world.actor = {
      role: "member",
      account: { ...member.account, isAdmin: false },
    };
    world.screen = null;
    return;
  }

  if (text === "they open the members screen") {
    world.screen = world.access.openMembersScreen(world.actor);
    return;
  }

  if (text.startsWith("they update member ")) {
    const email = quotes[0];
    if (!email) {
      throw new StepFailure("Missing member email");
    }
    const account = storedMember(world, email);
    world.draftId = account.id;
    world.draft = {
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      companyName: account.companyName,
      status: account.status,
      greenCardNumber: account.greenCardNumber,
    };
    return;
  }

  if (text.startsWith("they set the ")) {
    if (!world.draft) {
      throw new StepFailure("No member is selected");
    }
    const value = quotes[0];
    if (value === undefined) {
      throw new StepFailure(`Missing value in ${text}`);
    }
    if (text.startsWith("they set the phone to ")) {
      world.draft.phone = value;
    } else if (text.startsWith("they set the company to ")) {
      world.draft.companyName = value;
    } else if (text.startsWith("they set the status to ")) {
      world.draft.status = value;
    } else if (text.startsWith("they set the green card to ")) {
      world.draft.greenCardNumber = value;
    } else if (text.startsWith("they set the first name to ")) {
      world.draft.firstName = value;
    } else if (text.startsWith("they set the last name to ")) {
      world.draft.lastName = value;
    } else if (text.startsWith("they set the email to ")) {
      world.draft.email = value;
    } else {
      throw new StepFailure(`undefined step: ${text}`);
    }
    return;
  }

  if (text === "they save the member record") {
    if (!world.draft || world.draftId === null) {
      throw new StepFailure("No member draft to save");
    }
    world.update = world.access.updateMember(world.actor, world.draftId, world.draft);
    world.screen = world.access.openMembersScreen(world.actor);
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

  if (text === "the members screen stays closed") {
    const screen = requireScreen(world, "closed");
    if (screen.members.length > 0) {
      throw new StepFailure("closed screen listed members");
    }
    return;
  }

  if (text === "the member session does not show CRM management") {
    const screen = world.screen ?? world.access.openMembersScreen(world.actor);
    if (screen.phase === "notImplemented") {
      throw new StepFailure(
        "expected CRM management to stay hidden, got notImplemented",
      );
    }
    if (world.actor.role === "member" && world.actor.account.isAdmin) {
      throw new StepFailure("A member session is admin");
    }
    if (screen.showsCrmManagement) {
      throw new StepFailure("A member session must not show CRM management.");
    }
    for (const area of CRM_MANAGEMENT) {
      if (screen.visibleSections.includes(area)) {
        throw new StepFailure(`A member session showed CRM management ${area}`);
      }
    }
    return;
  }

  if (text.startsWith("they see member ") || text.startsWith("they do not see a member ") || text.startsWith("they do not see member ")) {
    const screen = requireScreen(
      world,
      text.startsWith("they see member ") ? "open" : world.screen?.phase === "closed" ? "closed" : "open",
    );
    const name = quotes[0];
    const visible = screen.members.some((member) => fullName(member) === name);
    if (text.startsWith("they see member ")) {
      if (!visible) {
        throw new StepFailure(`members screen did not show ${name ?? ""}`);
      }
    } else if (visible) {
      throw new StepFailure(`members screen showed ${name ?? ""}`);
    }
    return;
  }

  if (text.startsWith("they see email ")) {
    const screen = requireScreen(world, "open");
    const email = quotes[0];
    if (!screen.members.some((member) => member.email === email)) {
      throw new StepFailure(`members screen did not show ${email ?? ""}`);
    }
    return;
  }

  if (text.startsWith("they see phone ")) {
    const screen = requireScreen(world, "open");
    const phone = quotes[0];
    if (!screen.members.some((member) => member.phone === phone)) {
      throw new StepFailure(`members screen did not show ${phone ?? ""}`);
    }
    return;
  }

  if (text.startsWith("they see company ")) {
    const screen = requireScreen(world, "open");
    const company = quotes[0];
    if (!screen.members.some((member) => member.companyName === company)) {
      throw new StepFailure(`members screen did not show ${company ?? ""}`);
    }
    return;
  }

  if (text.startsWith("they see status ")) {
    const screen = requireScreen(world, "open");
    const status = quotes[0];
    if (!screen.members.some((member) => member.status === status)) {
      throw new StepFailure(`members screen did not show status ${status ?? ""}`);
    }
    return;
  }

  if (text.startsWith("they see green card ")) {
    const screen = requireScreen(world, "open");
    const card = quotes[0];
    if (!screen.members.some((member) => member.greenCardNumber === card)) {
      throw new StepFailure(`members screen did not show ${card ?? ""}`);
    }
    return;
  }

  if (text.includes(" is no longer listed")) {
    const email = quotes[0];
    if (!email) {
      throw new StepFailure("Missing email");
    }
    const stillThere = world.access.members.some(
      (member) => member.account.email.toLowerCase() === email.toLowerCase(),
    );
    if (stillThere) {
      throw new StepFailure(`${email} is still listed`);
    }
    return;
  }

  if (text.includes(" has no phone")) {
    const email = quotes[0];
    if (!email) {
      throw new StepFailure("Missing email");
    }
    const account = storedMember(world, email);
    if (account.phone !== null) {
      throw new StepFailure(`${email} phone is ${account.phone}`);
    }
    return;
  }

  if (text.includes(" has phone ")) {
    const email = quotes[0];
    const phone = quotes[1];
    if (!email || phone === undefined) {
      throw new StepFailure(`Missing phone details in ${text}`);
    }
    const account = storedMember(world, email);
    if (account.phone !== phone) {
      throw new StepFailure(`${email} phone is ${account.phone ?? "empty"}, expected ${phone}`);
    }
    return;
  }

  if (text.includes(" has company ")) {
    const email = quotes[0];
    const company = quotes[1];
    const account = storedMember(world, email ?? "");
    if (account.companyName !== company) {
      throw new StepFailure(
        `${email} company is ${account.companyName ?? "empty"}, expected ${company ?? ""}`,
      );
    }
    return;
  }

  if (text.includes(" has status ")) {
    const email = quotes[0];
    const status = quotes[1];
    const account = storedMember(world, email ?? "");
    if (account.status !== status) {
      throw new StepFailure(`${email} status is ${account.status}, expected ${status ?? ""}`);
    }
    return;
  }

  if (text.includes(" has green card ")) {
    const email = quotes[0];
    const card = quotes[1];
    const account = storedMember(world, email ?? "");
    if (account.greenCardNumber !== card) {
      throw new StepFailure(
        `${email} green card is ${account.greenCardNumber ?? "empty"}, expected ${card ?? ""}`,
      );
    }
    return;
  }

  if (text.includes(" has email ")) {
    const email = quotes[0];
    const expected = quotes[1];
    const account = storedMember(world, email ?? "");
    if (account.email !== expected) {
      throw new StepFailure(`${email} email is ${account.email}, expected ${expected ?? ""}`);
    }
    return;
  }

  throw new StepFailure(`undefined step: ${text}`);
}

test("feature declares admin member record scenarios", () => {
  const feature = loadFeature();
  assert.equal(feature.name, "Admin views and updates member records");
  assert.deepEqual(
    feature.scenarios.map((scenario) => scenario.title),
    [
      "Admin sees club members",
      "Admin updates a member record",
      "Admin changes a member's name and email",
      "Member cannot open the members screen",
      "Member cannot update a club record",
    ],
  );
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
