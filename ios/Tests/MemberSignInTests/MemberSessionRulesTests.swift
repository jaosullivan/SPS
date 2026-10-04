import XCTest
@testable import MemberSignIn

final class MemberSessionRulesTests: XCTestCase {
    func testCrmAdminToolsAreTheOldCrmAreas() {
        XCTAssertEqual(
            Set(ClubSurface.crmAdminTools.map(\.title)),
            ["Members", "Sponsors", "Companies", "Deals", "Dashboard"]
        )
    }

    func testMemberSessionIsNeverAdminAndHidesCrmTools() {
        var flagged = ClubFixtures.aoife
        flagged.isAdmin = true

        let session = MemberSession.forMember(flagged)

        XCTAssertFalse(
            session.account.isAdmin,
            "A member is not an admin. John is the only admin."
        )
        XCTAssertFalse(
            session.showsAdminTools,
            "A member session must not show CRM admin tools."
        )
        XCTAssertEqual(session.surfaces, Set([ClubSurface.ownAccount]))
        XCTAssertTrue(session.surfaces.isDisjoint(with: ClubSurface.crmAdminTools))
    }

    func testMemberScreenShowsOwnAccountWithoutCrmAdminTools() {
        var flagged = ClubFixtures.aoife
        flagged.isAdmin = true
        let session = MemberSession.forMember(flagged)
        let screen = MemberSignInScreen.after(.signedIn(session))

        XCTAssertEqual(screen.account?.fullName, "Aoife Murphy")
        XCTAssertEqual(screen.account?.email, "aoife.murphy@example.com")
        XCTAssertFalse(screen.account?.isAdmin ?? true)
        XCTAssertFalse(screen.showsAdminTools, "A member session must not show CRM admin tools.")
        XCTAssertEqual(screen.visibleSections, ["Account"])
        for tool in ClubSurface.crmAdminTools.map(\.title) {
            XCTAssertFalse(
                screen.visibleSections.contains(tool),
                "Member screen listed CRM admin tool \(tool)"
            )
        }
    }

    func testWrongDetailsScreenStaysSignedOut() {
        let result = ClubFixtures.directory.signIn(
            email: "aoife.murphy@example.com",
            password: "wrong-password"
        )
        XCTAssertEqual(result, .signedOut)

        let screen = MemberSignInScreen.after(result)
        XCTAssertNil(screen.account)
        XCTAssertFalse(screen.showsAdminTools)
        XCTAssertEqual(screen.visibleSections, [])
    }
}
