import XCTest
@testable import MemberSignIn

final class SignInRulesTests: XCTestCase {
    func testKnownMemberWithValidDetailsSeesOwnAccount() {
        let result = ClubFixtures.directory.signIn(
            email: "aoife.murphy@example.com",
            password: ClubFixtures.memberPassword
        )

        guard case .signedIn(let session) = result else {
            return XCTFail("Expected a signed-in member session, got \(result)")
        }

        XCTAssertEqual(session.account.fullName, "Aoife Murphy")
        XCTAssertEqual(session.account.email, "aoife.murphy@example.com")
        XCTAssertEqual(session.account.phone, "+852 5550 1001")
        XCTAssertEqual(session.account.companyName, "Independent")
        XCTAssertEqual(session.account.status, .active)
        XCTAssertEqual(session.account.greenCardNumber, "GC-1001")
        XCTAssertNotEqual(session.account.greenCardNumber, ClubFixtures.liam.greenCardNumber)
        XCTAssertNotEqual(session.account.fullName, ClubFixtures.liam.fullName)
        XCTAssertFalse(session.account.isAdmin)
        XCTAssertFalse(session.showsAdminTools)
        XCTAssertEqual(session.surfaces, Set([ClubSurface.ownAccount]))
    }

    func testEmailMatchIsTrimmedAndCaseInsensitive() {
        let result = ClubFixtures.directory.signIn(
            email: "  Aoife.Murphy@Example.com  ",
            password: ClubFixtures.memberPassword
        )

        guard case .signedIn(let session) = result else {
            return XCTFail("Expected a signed-in member session, got \(result)")
        }
        XCTAssertEqual(session.account.email, "aoife.murphy@example.com")
    }

    func testWrongPasswordStaysSignedOut() {
        let result = ClubFixtures.directory.signIn(
            email: "aoife.murphy@example.com",
            password: "wrong-password"
        )
        XCTAssertEqual(result, .signedOut)
    }

    func testUnknownEmailStaysSignedOut() {
        let result = ClubFixtures.directory.signIn(
            email: "stranger@example.com",
            password: ClubFixtures.memberPassword
        )
        XCTAssertEqual(result, .signedOut)
    }

    func testBlankPasswordStaysSignedOut() {
        let result = ClubFixtures.directory.signIn(
            email: "aoife.murphy@example.com",
            password: "   "
        )
        XCTAssertEqual(result, .signedOut)
    }

    func testJohnIsTheOnlyAdminAndStaysSignedOut() {
        let directory = ClubFixtures.directory
        XCTAssertEqual(directory.admin.fullName, "John Alan O'Sullivan")
        XCTAssertTrue(directory.admin.isAdmin)
        XCTAssertFalse(
            directory.members.contains {
                $0.account.email.caseInsensitiveCompare(directory.admin.email) == .orderedSame
            }
        )

        let result = directory.signIn(
            email: "admin@stpatrickshk.com",
            password: "not-a-member-password"
        )
        XCTAssertEqual(result, .signedOut, "John's admin identity is not a member session")
    }
}
