import XCTest
@testable import MemberSignIn

final class MemberDetailsScenarios: XCTestCase {
    func testFeatureDeclaresMemberDetailsScenarios() throws {
        let feature = try loadMemberDetailsFeature()
        XCTAssertEqual(feature.name, "Member updates their details on iPhone")
        XCTAssertEqual(
            feature.scenarios.map(\.title),
            [
                "Signed-in member sees their own phone and contact details",
                "Signed-in member changes their own phone",
                "Signed-in member changes their own contact details",
                "Member cannot edit another member",
            ]
        )
    }

    func testMemberDetailsScenarios() throws {
        let feature = try loadMemberDetailsFeature()
        XCTAssertFalse(feature.background.isEmpty, "Background should sign in a known member")

        for scenario in feature.scenarios {
            XCTAssertFalse(scenario.steps.isEmpty, "Scenario \"\(scenario.title)\" has no steps")
            let world = DetailsWorld()
            for step in feature.background + scenario.steps {
                do {
                    try execute(step, world: world)
                } catch {
                    XCTFail("Scenario \"\(scenario.title)\" — \(step.keyword) \(step.text): \(error)")
                    break
                }
            }
        }
    }
}

private struct DetailsStepFailure: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}

private struct DetailsFeature {
    var name: String
    var background: [DetailsStep]
    var scenarios: [DetailsScenario]
}

private struct DetailsScenario {
    var title: String
    var steps: [DetailsStep]
}

private struct DetailsStep {
    var keyword: String
    var text: String
}

private final class DetailsWorld {
    var directory = ClubDirectory(members: [], admin: ClubFixtures.john)
    var result: SignInResult?
    var update: MemberDetailsUpdate?
}

private func loadMemberDetailsFeature() throws -> DetailsFeature {
    let url = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .appendingPathComponent("Features/member_updates_own_details.feature")
    let source = try String(contentsOf: url, encoding: .utf8)
    let feature = parseDetailsFeature(source)
    if feature.scenarios.isEmpty {
        throw DetailsStepFailure("No scenarios parsed from \(url.path)")
    }
    return feature
}

private func parseDetailsFeature(_ source: String) -> DetailsFeature {
    var name = ""
    var background: [DetailsStep] = []
    var scenarios: [DetailsScenario] = []
    var inBackground = false
    var current: DetailsScenario?

    func flushScenario() {
        if let scenario = current {
            scenarios.append(scenario)
            current = nil
        }
    }

    for rawLine in source.split(separator: "\n", omittingEmptySubsequences: false) {
        let line = rawLine.trimmingCharacters(in: .whitespaces)
        if line.isEmpty || line.hasPrefix("#") {
            continue
        }
        if line.hasPrefix("Feature:") {
            name = String(line.dropFirst("Feature:".count)).trimmingCharacters(in: .whitespaces)
            continue
        }
        if line.hasPrefix("Background:") {
            flushScenario()
            inBackground = true
            continue
        }
        if line.hasPrefix("Scenario:") {
            flushScenario()
            inBackground = false
            current = DetailsScenario(
                title: String(line.dropFirst("Scenario:".count)).trimmingCharacters(in: .whitespaces),
                steps: []
            )
            continue
        }
        guard let keyword = detailsStepKeyword(in: line) else {
            continue
        }
        let text = String(line.dropFirst(keyword.count)).trimmingCharacters(in: .whitespaces)
        let step = DetailsStep(keyword: keyword, text: text)
        if inBackground {
            background.append(step)
        } else if var scenario = current {
            scenario.steps.append(step)
            current = scenario
        }
    }
    flushScenario()
    return DetailsFeature(name: name, background: background, scenarios: scenarios)
}

private func detailsStepKeyword(in line: String) -> String? {
    for keyword in ["Given", "When", "Then", "And", "But"] {
        if line == keyword || line.hasPrefix(keyword + " ") {
            return keyword
        }
    }
    return nil
}

private func detailsQuotedStrings(in text: String) -> [String] {
    var values: [String] = []
    var current = ""
    var inside = false
    for character in text {
        if character == "\"" {
            if inside {
                values.append(current)
                current = ""
            }
            inside.toggle()
        } else if inside {
            current.append(character)
        }
    }
    return values
}

private func execute(_ step: DetailsStep, world: DetailsWorld) throws {
    let text = step.text
    let quotes = detailsQuotedStrings(in: text)

    if text.hasPrefix("the club knows member ") {
        guard let email = quotes.first, let member = ClubFixtures.knownMember(email: email) else {
            throw DetailsStepFailure("No known member for \(text)")
        }
        world.directory.register(member)
        return
    }

    if text.hasPrefix("the only admin is ") {
        guard let name = quotes.first else {
            throw DetailsStepFailure("Admin name missing in \(text)")
        }
        guard world.directory.admin.fullName == name else {
            throw DetailsStepFailure("Only admin is \(world.directory.admin.fullName), not \(name)")
        }
        return
    }

    if text.contains("signs in with password ") {
        guard quotes.count == 2 else {
            throw DetailsStepFailure("Expected email and password in \(text)")
        }
        world.result = world.directory.signIn(email: quotes[0], password: quotes[1])
        world.update = nil
        return
    }

    if text.hasPrefix("they change their own phone to ") {
        let session = try requireSession(world)
        guard let phone = quotes.first else {
            throw DetailsStepFailure("Phone missing in \(text)")
        }
        try applyUpdate(
            world,
            memberID: session.account.id,
            phone: phone,
            email: session.account.email,
            companyName: session.account.companyName
        )
        return
    }

    if text.hasPrefix("they change their own email to ") {
        let session = try requireSession(world)
        guard let email = quotes.first else {
            throw DetailsStepFailure("Email missing in \(text)")
        }
        try applyUpdate(
            world,
            memberID: session.account.id,
            phone: session.account.phone,
            email: email,
            companyName: session.account.companyName
        )
        return
    }

    if text.hasPrefix("they change their own company to ") {
        let session = try requireSession(world)
        guard let company = quotes.first else {
            throw DetailsStepFailure("Company missing in \(text)")
        }
        try applyUpdate(
            world,
            memberID: session.account.id,
            phone: session.account.phone,
            email: session.account.email,
            companyName: company
        )
        return
    }

    if text.hasPrefix("they try to change the phone of ") {
        let session = try requireSession(world)
        guard quotes.count == 2 else {
            throw DetailsStepFailure("Expected member email and phone in \(text)")
        }
        guard let target = world.directory.members.first(where: {
            $0.account.email.lowercased() == quotes[0].lowercased()
        }) else {
            throw DetailsStepFailure("No member \(quotes[0])")
        }
        guard target.account.id != session.account.id else {
            throw DetailsStepFailure("\(quotes[0]) is the signed-in member")
        }
        try applyUpdate(
            world,
            memberID: target.account.id,
            phone: quotes[1],
            email: target.account.email,
            companyName: target.account.companyName
        )
        return
    }

    if text.hasPrefix("member ") && text.contains(" has no phone") {
        guard let email = quotes.first else {
            throw DetailsStepFailure("Member email missing in \(text)")
        }
        guard let member = world.directory.members.first(where: {
            $0.account.email.lowercased() == email.lowercased()
        }) else {
            throw DetailsStepFailure("No member \(email)")
        }
        guard member.account.phone == nil else {
            throw DetailsStepFailure("\(email) has phone \(member.account.phone ?? "")")
        }
        return
    }

    switch text {
    case "the change is saved":
        guard case .updated = world.update else {
            throw DetailsStepFailure("expected the change to be saved, got \(world.update?.description ?? "no result")")
        }
    case "the change is denied":
        guard world.update == .denied else {
            throw DetailsStepFailure("expected the change to be denied, got \(world.update?.description ?? "no result")")
        }
    case "they are not an admin":
        let session = try requireSession(world)
        let screen = MemberDetailsScreen.showing(session)
        guard session.account.isAdmin == false else {
            throw DetailsStepFailure("member session is admin")
        }
        guard screen.account?.isAdmin != true else {
            throw DetailsStepFailure("details screen shows an admin")
        }
    case "John is the only admin":
        guard world.directory.admin.fullName == "John Alan O'Sullivan" else {
            throw DetailsStepFailure("expected John Alan O'Sullivan, got \(world.directory.admin.fullName)")
        }
        guard world.directory.members.allSatisfy({ $0.account.isAdmin == false }) else {
            throw DetailsStepFailure("a known member is marked admin")
        }
        if case .signedIn(let session) = world.result {
            guard session.account.isAdmin == false else {
                throw DetailsStepFailure("signed-in member is admin")
            }
            guard session.account.fullName != world.directory.admin.fullName else {
                throw DetailsStepFailure("admin identity opened a member session")
            }
        }
    case "the member session does not show CRM admin tools":
        let session = try requireSession(world)
        let screen = MemberDetailsScreen.showing(session)
        guard session.showsAdminTools == false, screen.showsAdminTools == false else {
            throw DetailsStepFailure("CRM admin tools are visible")
        }
        let adminTitles = Set(ClubSurface.crmAdminTools.map(\.title))
        guard Set(screen.visibleSections).isDisjoint(with: adminTitles) else {
            throw DetailsStepFailure("screen sections \(screen.visibleSections) include CRM admin tools")
        }
    default:
        if text.hasPrefix("they see their own account ") {
            try assertOwnDetail(world, quotes: quotes) { $0.fullName }
            return
        }
        if text.hasPrefix("they see their own email ") || text.hasPrefix("their email is ") {
            try assertOwnDetail(world, quotes: quotes) { $0.email }
            return
        }
        if text.hasPrefix("they see their own phone ") || text.hasPrefix("their phone is ") {
            try assertOwnDetail(world, quotes: quotes) { $0.phone }
            return
        }
        if text.hasPrefix("they see their own company ") || text.hasPrefix("their company is ") {
            try assertOwnDetail(world, quotes: quotes) { $0.companyName }
            return
        }
        if text.hasPrefix("they see their own green card ") || text.hasPrefix("their green card is ") {
            try assertOwnDetail(world, quotes: quotes) { $0.greenCardNumber }
            return
        }
        if text.hasPrefix("their name is ") {
            try assertOwnDetail(world, quotes: quotes) { $0.fullName }
            return
        }
        if text.hasPrefix("they do not see ") {
            let screen = try detailsScreen(world)
            guard let account = screen.account else {
                throw DetailsStepFailure("details screen has no account")
            }
            guard let banned = quotes.first else {
                throw DetailsStepFailure("missing quoted name")
            }
            let visible = [
                account.fullName,
                account.email,
                account.phone ?? "",
                account.companyName ?? "",
                account.greenCardNumber ?? "",
            ].joined(separator: " ")
            guard !visible.contains(banned) else {
                throw DetailsStepFailure("account showed \(banned)")
            }
            return
        }
        throw DetailsStepFailure("undefined step")
    }
}

private func applyUpdate(
    _ world: DetailsWorld,
    memberID: Int,
    phone: String?,
    email: String,
    companyName: String?
) throws {
    let session = try requireSession(world)
    let update = world.directory.updateOwnContactDetails(
        actor: session,
        memberID: memberID,
        phone: phone,
        email: email,
        companyName: companyName
    )
    world.update = update
    if case .updated(let updated) = update {
        world.result = .signedIn(updated)
    }
}

private func requireSession(_ world: DetailsWorld) throws -> MemberSession {
    guard case .signedIn(let session) = world.result else {
        throw DetailsStepFailure("expected a member session, got \(world.result?.description ?? "no result")")
    }
    return session
}

private func detailsScreen(_ world: DetailsWorld) throws -> MemberDetailsScreen {
    MemberDetailsScreen.showing(try requireSession(world))
}

private func assertOwnDetail(
    _ world: DetailsWorld,
    quotes: [String],
    field: (MemberAccount) -> String?
) throws {
    let session = try requireSession(world)
    let screen = MemberDetailsScreen.showing(session)
    guard let expected = quotes.first else {
        throw DetailsStepFailure("missing expected value")
    }
    guard let account = screen.account else {
        throw DetailsStepFailure("details screen has no account, expected \(expected)")
    }
    guard field(account) == expected else {
        throw DetailsStepFailure("details screen showed \(field(account) ?? "none"), expected \(expected)")
    }
    guard let stored = world.directory.members.first(where: { $0.account.id == session.account.id }) else {
        throw DetailsStepFailure("signed-in member missing from the directory")
    }
    guard field(stored.account) == expected else {
        throw DetailsStepFailure("directory showed \(field(stored.account) ?? "none"), expected \(expected)")
    }
}
