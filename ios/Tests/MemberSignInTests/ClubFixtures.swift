import MemberSignIn

enum ClubFixtures {
    /// Local fixture secret for scenarios. Not a production credential.
    static let memberPassword = "green-card-fixture"

    static let aoife = MemberAccount(
        id: 1,
        firstName: "Aoife",
        lastName: "Murphy",
        email: "aoife.murphy@example.com",
        phone: "+852 5550 1001",
        companyName: "Independent",
        status: .active,
        greenCardNumber: "GC-1001"
    )

    static let liam = MemberAccount(
        id: 2,
        firstName: "Liam",
        lastName: "Byrne",
        email: "liam.byrne@example.com",
        phone: nil,
        companyName: nil,
        status: .active,
        greenCardNumber: "GC-1002"
    )

    /// Public club president, and the only admin. Same admin mailbox as the CRM
    /// user record. He is not a member account on the iPhone app.
    static let john = AdminAccount(
        fullName: "John Alan O'Sullivan",
        email: "admin@stpatrickshk.com"
    )

    static let sampleAccounts = [aoife, liam]

    static func knownMember(email: String) -> KnownMember? {
        sampleAccounts
            .first { $0.email.lowercased() == email.lowercased() }
            .map { KnownMember(account: $0, password: memberPassword) }
    }

    static var directory: ClubDirectory {
        ClubDirectory(
            members: sampleAccounts.map { KnownMember(account: $0, password: memberPassword) },
            admin: john
        )
    }
}
