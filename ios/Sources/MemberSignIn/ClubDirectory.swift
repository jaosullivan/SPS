import Foundation

/// In-memory club directory for member sign-in.
/// Members sign in with email and password. The admin identity cannot.
public struct ClubDirectory: Equatable, Sendable {
    public private(set) var members: [KnownMember]
    public let admin: AdminAccount

    public init(members: [KnownMember] = [], admin: AdminAccount) {
        self.members = members
        self.admin = admin
    }

    public mutating func register(_ member: KnownMember) {
        members.removeAll { $0.account.email.lowercased() == member.account.email.lowercased() }
        members.append(member)
    }

    public func signIn(email: String, password: String) -> SignInResult {
        // Scenarios and unit tests are in place before this behaviour.
        _ = email
        _ = password
        _ = members
        _ = admin
        return .notImplemented
    }
}
