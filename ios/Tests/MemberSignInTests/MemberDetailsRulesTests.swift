import XCTest
@testable import MemberSignIn

final class MemberDetailsRulesTests: XCTestCase {
    func testDetailsScreenShowsOwnPhoneAndContactDetailsWithoutCrmTools() throws {
        let session = try signedInAoife()
        let screen = MemberDetailsScreen.showing(session)

        XCTAssertEqual(screen.account?.fullName, "Aoife Murphy")
        XCTAssertEqual(screen.account?.email, "aoife.murphy@example.com")
        XCTAssertEqual(screen.account?.phone, "+852 5550 1001")
        XCTAssertEqual(screen.account?.companyName, "Independent")
        XCTAssertEqual(screen.account?.status, .active)
        XCTAssertEqual(screen.account?.greenCardNumber, "GC-1001")
        XCTAssertFalse(screen.account?.isAdmin ?? true)
        XCTAssertFalse(screen.showsAdminTools, "A member session must not show CRM admin tools.")
        XCTAssertEqual(screen.visibleSections, ["Account"])
        for tool in ClubSurface.crmAdminTools.map(\.title) {
            XCTAssertFalse(
                screen.visibleSections.contains(tool),
                "Details screen listed CRM admin tool \(tool)"
            )
        }
    }

    func testSignedInMemberCanChangeOwnPhone() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: "  +852 5550 1999  ",
            email: session.account.email,
            companyName: session.account.companyName
        )

        guard case .updated(let updated) = update else {
            return XCTFail("Expected own phone to be saved, got \(update)")
        }

        XCTAssertEqual(updated.account.phone, "+852 5550 1999")
        XCTAssertEqual(updated.account.email, "aoife.murphy@example.com")
        XCTAssertEqual(updated.account.companyName, "Independent")
        XCTAssertEqual(member(&directory, id: ClubFixtures.aoife.id).phone, "+852 5550 1999")
        XCTAssertNil(member(&directory, id: ClubFixtures.liam.id).phone)
        XCTAssertFalse(updated.account.isAdmin)
        XCTAssertFalse(updated.showsAdminTools)
        XCTAssertEqual(updated.surfaces, Set([ClubSurface.ownAccount]))

        let screen = MemberDetailsScreen.showing(session).applying(update)
        XCTAssertEqual(screen.account?.phone, "+852 5550 1999")
        XCTAssertFalse(screen.showsAdminTools, "A member session must not show CRM admin tools.")
        XCTAssertEqual(screen.visibleSections, ["Account"])
    }

    func testSignedInMemberCanChangeOwnContactDetails() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: session.account.phone,
            email: "  aoife@harbour.example  ",
            companyName: "  Harbour Office  "
        )

        guard case .updated(let updated) = update else {
            return XCTFail("Expected own contact details to be saved, got \(update)")
        }

        XCTAssertEqual(updated.account.email, "aoife@harbour.example")
        XCTAssertEqual(updated.account.companyName, "Harbour Office")
        XCTAssertEqual(updated.account.phone, "+852 5550 1001")
        XCTAssertEqual(updated.account.fullName, "Aoife Murphy")
        XCTAssertEqual(updated.account.status, .active)
        XCTAssertEqual(updated.account.greenCardNumber, "GC-1001")
        XCTAssertEqual(updated.account.id, ClubFixtures.aoife.id)
        XCTAssertFalse(updated.account.isAdmin)
        XCTAssertFalse(updated.showsAdminTools)
        XCTAssertEqual(updated.surfaces, Set([ClubSurface.ownAccount]))

        let again = directory.signIn(
            email: "aoife@harbour.example",
            password: ClubFixtures.memberPassword
        )
        guard case .signedIn(let resigned) = again else {
            return XCTFail("Updated email should sign the same member in, got \(again)")
        }
        XCTAssertEqual(resigned.account.id, ClubFixtures.aoife.id)
        XCTAssertEqual(resigned.account.fullName, "Aoife Murphy")
        XCTAssertFalse(resigned.showsAdminTools)

        let oldEmail = directory.signIn(
            email: "aoife.murphy@example.com",
            password: ClubFixtures.memberPassword
        )
        XCTAssertEqual(oldEmail, .signedOut)
    }

    func testMemberCannotEditAnotherMember() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let before = directory

        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: ClubFixtures.liam.id,
            phone: "+852 5550 2002",
            email: "liam.byrne@stolen.example",
            companyName: "Stolen Co"
        )

        XCTAssertEqual(update, .denied)
        XCTAssertEqual(directory, before, "Another member's record must stay unchanged")

        let screen = MemberDetailsScreen.showing(session).applying(update)
        XCTAssertEqual(screen.update, .denied)
        XCTAssertEqual(screen.account?.fullName, "Aoife Murphy")
        XCTAssertEqual(screen.account?.phone, "+852 5550 1001")
        XCTAssertFalse(screen.showsAdminTools, "A member session must not show CRM admin tools.")
        XCTAssertEqual(screen.visibleSections, ["Account"])
    }

    func testBlankEmailIsDeniedAndLeavesDetailsUnchanged() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let before = directory
        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: "+852 5550 1999",
            email: "   ",
            companyName: "Harbour Office"
        )

        XCTAssertEqual(update, .denied)
        XCTAssertEqual(directory, before)
    }

    func testMemberCannotTakeAnotherMembersEmail() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let before = directory
        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: session.account.phone,
            email: "  Liam.Byrne@Example.com  ",
            companyName: session.account.companyName
        )

        XCTAssertEqual(update, .denied)
        XCTAssertEqual(directory, before, "Taking another member's email must be denied")
    }

    func testBlankPhoneAndCompanyClearThoseFieldsOnly() throws {
        var directory = ClubFixtures.directory
        let session = try signedInAoife(directory)
        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: "   ",
            email: session.account.email,
            companyName: "  "
        )

        guard case .updated(let updated) = update else {
            return XCTFail("Expected blank phone and company to clear, got \(update)")
        }

        XCTAssertNil(updated.account.phone)
        XCTAssertNil(updated.account.companyName)
        XCTAssertEqual(updated.account.email, "aoife.murphy@example.com")
        XCTAssertEqual(updated.account.fullName, "Aoife Murphy")
        XCTAssertEqual(updated.account.status, .active)
        XCTAssertEqual(updated.account.greenCardNumber, "GC-1001")
        XCTAssertFalse(updated.account.isAdmin)
        XCTAssertFalse(updated.showsAdminTools)
    }

    func testJohnRemainsTheOnlyAdminAfterOwnDetailsChange() throws {
        var flagged = ClubFixtures.aoife
        flagged.isAdmin = true
        var directory = ClubDirectory(
            members: [
                KnownMember(account: flagged, password: ClubFixtures.memberPassword),
                KnownMember(account: ClubFixtures.liam, password: ClubFixtures.memberPassword),
            ],
            admin: ClubFixtures.john
        )
        let session = try signedInAoife(directory)
        XCTAssertFalse(session.account.isAdmin, "A member is not an admin. John is the only admin.")

        let update = directory.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: "+852 5550 1999",
            email: session.account.email,
            companyName: session.account.companyName
        )

        guard case .updated(let updated) = update else {
            return XCTFail("Expected own details to be saved, got \(update)")
        }

        XCTAssertEqual(directory.admin.fullName, "John Alan O'Sullivan")
        XCTAssertTrue(directory.admin.isAdmin)
        XCTAssertFalse(updated.account.isAdmin)
        XCTAssertFalse(updated.showsAdminTools, "A member session must not show CRM admin tools.")
        XCTAssertEqual(updated.surfaces, Set([ClubSurface.ownAccount]))
        XCTAssertTrue(directory.members.allSatisfy { $0.account.isAdmin == false })
        XCTAssertFalse(
            directory.members.contains {
                $0.account.email.caseInsensitiveCompare(directory.admin.email) == .orderedSame
            }
        )
        XCTAssertEqual(member(&directory, id: ClubFixtures.aoife.id).phone, "+852 5550 1999")
        XCTAssertEqual(member(&directory, id: ClubFixtures.aoife.id).greenCardNumber, "GC-1001")
        XCTAssertNil(member(&directory, id: ClubFixtures.liam.id).phone)
    }
}

private func signedInAoife(_ directory: ClubDirectory = ClubFixtures.directory) throws -> MemberSession {
    let result = directory.signIn(
        email: "aoife.murphy@example.com",
        password: ClubFixtures.memberPassword
    )
    guard case .signedIn(let session) = result else {
        XCTFail("Expected Aoife to be signed in, got \(result)")
        throw DetailsTestError.notSignedIn
    }
    return session
}

private enum DetailsTestError: Error {
    case notSignedIn
}

private func member(_ directory: inout ClubDirectory, id: Int) -> MemberAccount {
    directory.members.first { $0.account.id == id }!.account
}
