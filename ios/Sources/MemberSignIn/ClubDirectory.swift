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
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let secret = password.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedEmail.isEmpty, !secret.isEmpty else {
            return .signedOut
        }

        // John is the only admin. His identity is not a member session.
        let adminEmail = admin.email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard normalizedEmail != adminEmail else {
            return .signedOut
        }

        guard let known = members.first(where: {
            $0.account.email.lowercased() == normalizedEmail && $0.password == secret
        }) else {
            return .signedOut
        }

        return .signedIn(MemberSession.forMember(known.account))
    }
}
