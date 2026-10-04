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

    /// A signed-in member may change only their own phone and contact details
    /// (email and company). Another member's record is left untouched.
    /// Name, membership status, and green card stay as they are.
    public mutating func updateOwnContactDetails(
        actor: MemberSession,
        memberID: Int,
        phone: String?,
        email: String,
        companyName: String?
    ) -> MemberDetailsUpdate {
        guard actor.account.id == memberID,
              let index = members.firstIndex(where: { $0.account.id == memberID }) else {
            return .denied
        }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty else {
            return .denied
        }

        let emailTaken = members.contains { member in
            member.account.id != memberID
                && member.account.email.lowercased() == trimmedEmail.lowercased()
        }
        guard !emailTaken else {
            return .denied
        }

        var account = members[index].account
        account.phone = blankToNil(phone)
        account.email = trimmedEmail
        account.companyName = blankToNil(companyName)
        account.isAdmin = false
        members[index].account = account
        return .updated(MemberSession.forMember(account))
    }

    private func blankToNil(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }
}
