/// What the iPhone member app shows after a sign-in attempt.
/// A projection of the session: it does not add CRM admin areas of its own.
public struct MemberSignInScreen: Equatable, Sendable {
    public enum Phase: Equatable, Sendable {
        case signedOut
        case showingAccount(MemberSession)
    }

    public var phase: Phase

    public init(phase: Phase) {
        self.phase = phase
    }

    public static func after(_ result: SignInResult) -> MemberSignInScreen {
        switch result {
        case .signedIn(let session):
            MemberSignInScreen(phase: .showingAccount(session))
        case .signedOut:
            MemberSignInScreen(phase: .signedOut)
        }
    }

    public var account: MemberAccount? {
        if case .showingAccount(let session) = phase {
            return session.account
        }
        return nil
    }

    public var showsAdminTools: Bool {
        if case .showingAccount(let session) = phase {
            return session.showsAdminTools
        }
        return false
    }

    public var visibleSections: [String] {
        if case .showingAccount(let session) = phase {
            return session.surfaces.map(\.title).sorted()
        }
        return []
    }
}
