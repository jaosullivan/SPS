import XCTest
@testable import MemberSignIn

final class MemberSignInScenarios: XCTestCase {
    func testFeatureDeclaresMemberSignInScenarios() throws {
        let feature = try loadMemberSignInFeature()
        XCTAssertEqual(feature.name, "Member signs in on iPhone")
        XCTAssertEqual(
            feature.scenarios.map(\.title),
            [
                "Known member with valid details sees their own account",
                "Wrong password stays signed out",
                "Unknown email stays signed out",
                "A member session never shows CRM admin tools",
            ]
        )
    }

    func testMemberSignInScenarios() throws {
        let feature = try loadMemberSignInFeature()
        XCTAssertFalse(feature.background.isEmpty, "Background should register the known members")

        for scenario in feature.scenarios {
            XCTAssertFalse(scenario.steps.isEmpty, "Scenario \"\(scenario.title)\" has no steps")
            let world = SignInWorld()
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

private struct StepFailure: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}

private struct ParsedFeature {
    var name: String
    var background: [ParsedStep]
    var scenarios: [ParsedScenario]
}

private struct ParsedScenario {
    var title: String
    var steps: [ParsedStep]
}

private struct ParsedStep {
    var keyword: String
    var text: String
}

private final class SignInWorld {
    var directory = ClubDirectory(members: [], admin: ClubFixtures.john)
    var result: SignInResult?
}

private func loadMemberSignInFeature() throws -> ParsedFeature {
    let url = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .appendingPathComponent("Features/member_signs_in.feature")
    let source = try String(contentsOf: url, encoding: .utf8)
    let feature = parseFeature(source)
    if feature.scenarios.isEmpty {
        throw StepFailure("No scenarios parsed from \(url.path)")
    }
    return feature
}

private func parseFeature(_ source: String) -> ParsedFeature {
    var name = ""
    var background: [ParsedStep] = []
    var scenarios: [ParsedScenario] = []
    var inBackground = false
    var current: ParsedScenario?

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
            current = ParsedScenario(
                title: String(line.dropFirst("Scenario:".count)).trimmingCharacters(in: .whitespaces),
                steps: []
            )
            continue
        }
        guard let keyword = stepKeyword(in: line) else {
            continue
        }
        let text = String(line.dropFirst(keyword.count)).trimmingCharacters(in: .whitespaces)
        let step = ParsedStep(keyword: keyword, text: text)
        if inBackground {
            background.append(step)
        } else if var scenario = current {
            scenario.steps.append(step)
            current = scenario
        }
    }
    flushScenario()
    return ParsedFeature(name: name, background: background, scenarios: scenarios)
}

private func stepKeyword(in line: String) -> String? {
    for keyword in ["Given", "When", "Then", "And", "But"] {
        if line == keyword || line.hasPrefix(keyword + " ") {
            return keyword
        }
    }
    return nil
}

private func quotedStrings(in text: String) -> [String] {
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

private func execute(_ step: ParsedStep, world: SignInWorld) throws {
    let text = step.text
    let quotes = quotedStrings(in: text)

    if text.hasPrefix("the club knows member ") {
        guard let email = quotes.first, let member = ClubFixtures.knownMember(email: email) else {
            throw StepFailure("No known member for \(text)")
        }
        world.directory.register(member)
        return
    }

    if text.hasPrefix("the only admin is ") {
        guard let name = quotes.first else {
            throw StepFailure("Admin name missing in \(text)")
        }
        guard world.directory.admin.fullName == name else {
            throw StepFailure("Only admin is \(world.directory.admin.fullName), not \(name)")
        }
        return
    }

    if text.contains("signs in with password ") {
        guard quotes.count == 2 else {
            throw StepFailure("Expected email and password in \(text)")
        }
        world.result = world.directory.signIn(email: quotes[0], password: quotes[1])
        return
    }

    switch text {
    case "they are signed in":
        guard case .signedIn = world.result else {
            throw StepFailure("expected signed in, got \(world.result?.description ?? "no result")")
        }
    case "they stay signed out":
        guard world.result == .signedOut else {
            throw StepFailure("expected signedOut, got \(world.result?.description ?? "no result")")
        }
    case "they do not see an account":
        let screen = MemberSignInScreen.after(world.result ?? .signedOut)
        guard screen.account == nil else {
            throw StepFailure("expected no account, saw \(screen.account?.fullName ?? "")")
        }
    case "they are not an admin":
        let session = try requireSession(world)
        guard session.account.isAdmin == false else {
            throw StepFailure("member session is admin")
        }
    case "John is the only admin":
        guard world.directory.admin.fullName == "John Alan O'Sullivan" else {
            throw StepFailure("expected John Alan O'Sullivan, got \(world.directory.admin.fullName)")
        }
        guard world.directory.members.allSatisfy({ $0.account.isAdmin == false }) else {
            throw StepFailure("a known member is marked admin")
        }
        if case .signedIn(let session) = world.result {
            guard session.account.isAdmin == false else {
                throw StepFailure("signed-in member is admin")
            }
            guard session.account.fullName != world.directory.admin.fullName else {
                throw StepFailure("admin identity opened a member session")
            }
        }
    case "the member session does not show CRM admin tools":
        let session = try requireSession(world)
        let screen = MemberSignInScreen.after(.signedIn(session))
        guard session.showsAdminTools == false, screen.showsAdminTools == false else {
            throw StepFailure("CRM admin tools are visible")
        }
        let adminTitles = Set(ClubSurface.crmAdminTools.map(\.title))
        guard Set(screen.visibleSections).isDisjoint(with: adminTitles) else {
            throw StepFailure("screen sections \(screen.visibleSections) include CRM admin tools")
        }
    default:
        if text.hasPrefix("they see their own account ") {
            let session = try requireSession(world)
            guard let expected = quotes.first, session.account.fullName == expected else {
                throw StepFailure("saw \(session.account.fullName), expected \(quotes.first ?? "")")
            }
            return
        }
        if text.hasPrefix("they see their own email ") {
            let session = try requireSession(world)
            guard let expected = quotes.first, session.account.email == expected else {
                throw StepFailure("saw \(session.account.email), expected \(quotes.first ?? "")")
            }
            return
        }
        if text.hasPrefix("they see their own green card ") {
            let session = try requireSession(world)
            guard let expected = quotes.first, session.account.greenCardNumber == expected else {
                throw StepFailure("saw \(session.account.greenCardNumber ?? "none"), expected \(quotes.first ?? "")")
            }
            return
        }
        if text.hasPrefix("they do not see ") {
            let session = try requireSession(world)
            guard let banned = quotes.first else {
                throw StepFailure("missing quoted name")
            }
            let visible = [
                session.account.fullName,
                session.account.email,
                session.account.phone ?? "",
                session.account.companyName ?? "",
                session.account.greenCardNumber ?? "",
            ].joined(separator: " ")
            guard !visible.contains(banned) else {
                throw StepFailure("account showed \(banned)")
            }
            return
        }
        throw StepFailure("undefined step")
    }
}

private func requireSession(_ world: SignInWorld) throws -> MemberSession {
    guard case .signedIn(let session) = world.result else {
        throw StepFailure("expected a member session, got \(world.result?.description ?? "no result")")
    }
    return session
}
