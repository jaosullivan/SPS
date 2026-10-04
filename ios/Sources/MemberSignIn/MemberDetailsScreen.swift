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

    /// Own-details behaviour is intentionally absent. The screen does not yet
    /// show the member's phone and contact details, and it still lists CRM admin tools.
    public static func showing(_ session: MemberSession) -> MemberDetailsScreen {
        _ = session
        return MemberDetailsScreen(
            account: nil,
            showsAdminTools: true,
            visibleSections: ClubSurface.crmAdminTools.map(\.title).sorted()
        )
    }

    public func applying(_ update: MemberDetailsUpdate) -> MemberDetailsScreen {
        _ = update
        return self
    }
}
