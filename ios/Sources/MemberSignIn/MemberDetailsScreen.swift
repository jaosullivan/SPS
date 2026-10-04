/// What the iPhone member app shows for a signed-in member's own details.
/// A projection of that member's account. It does not add CRM admin areas of its own.
public struct MemberDetailsScreen: Equatable, Sendable {
    public var account: MemberAccount?
    public var showsAdminTools: Bool
    public var visibleSections: [String]
    public var update: MemberDetailsUpdate?

    public init(
        account: MemberAccount?,
        showsAdminTools: Bool,
        visibleSections: [String],
        update: MemberDetailsUpdate? = nil
    ) {
        self.account = account
        self.showsAdminTools = showsAdminTools
        self.visibleSections = visibleSections
        self.update = update
    }

    public static func showing(_ session: MemberSession) -> MemberDetailsScreen {
        MemberDetailsScreen(
            account: session.account,
            showsAdminTools: session.showsAdminTools,
            visibleSections: session.surfaces.map(\.title).sorted()
        )
    }

    public func applying(_ update: MemberDetailsUpdate) -> MemberDetailsScreen {
        switch update {
        case .updated(let session):
            var screen = MemberDetailsScreen.showing(session)
            screen.update = update
            return screen
        case .denied:
            var screen = self
            screen.update = update
            return screen
        }
    }
}
