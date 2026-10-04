import Foundation

/// Membership standing, matching the SPS CRM member record.
public enum MembershipStatus: String, Equatable, Sendable {
    case active
    case lapsed
    case complimentary
}

/// A club member's own account. Fields follow the CRM member model
/// (name, email, phone, company, status, green card). Members are not admins.
public struct MemberAccount: Equatable, Sendable {
    public var id: Int
    public var firstName: String
    public var lastName: String
    public var email: String
    public var phone: String?
    public var companyName: String?
    public var status: MembershipStatus
    public var greenCardNumber: String?
    public var isAdmin: Bool

    public init(
        id: Int,
        firstName: String,
        lastName: String,
        email: String,
        phone: String? = nil,
        companyName: String? = nil,
        status: MembershipStatus,
        greenCardNumber: String? = nil,
        isAdmin: Bool = false
    ) {
        self.id = id
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phone = phone
        self.companyName = companyName
        self.status = status
        self.greenCardNumber = greenCardNumber
        self.isAdmin = isAdmin
    }

    public var fullName: String {
        "\(firstName) \(lastName)"
    }
}

/// John is the only admin. This identity is not a member sign-in.
public struct AdminAccount: Equatable, Sendable {
    public var fullName: String
    public var email: String
    public var isAdmin: Bool { true }

    public init(fullName: String, email: String) {
        self.fullName = fullName
        self.email = email
    }
}

/// Surfaces a signed-in person can be shown.
/// CRM admin tools are the old CRM areas: members, sponsors, companies, deals, dashboard.
public enum ClubSurface: String, CaseIterable, Equatable, Sendable {
    case ownAccount
    case crmMembers
    case sponsors
    case companies
    case deals
    case dashboard

    public static let crmAdminTools: Set<ClubSurface> = [
        .crmMembers,
        .sponsors,
        .companies,
        .deals,
        .dashboard,
    ]

    public var title: String {
        switch self {
        case .ownAccount: "Account"
        case .crmMembers: "Members"
        case .sponsors: "Sponsors"
        case .companies: "Companies"
        case .deals: "Deals"
        case .dashboard: "Dashboard"
        }
    }
}

public struct KnownMember: Equatable, Sendable {
    public var account: MemberAccount
    public var password: String

    public init(account: MemberAccount, password: String) {
        self.account = account
        self.password = password
    }
}

public struct MemberSession: Equatable, Sendable {
    public let account: MemberAccount
    public let surfaces: Set<ClubSurface>

    public init(account: MemberAccount, surfaces: Set<ClubSurface>) {
        self.account = account
        self.surfaces = surfaces
    }

    public var showsAdminTools: Bool {
        !surfaces.isDisjoint(with: ClubSurface.crmAdminTools)
    }

    /// Members are not admins, and the only surface they see is their own account.
    public static func forMember(_ account: MemberAccount) -> MemberSession {
        var member = account
        member.isAdmin = false
        return MemberSession(account: member, surfaces: [.ownAccount])
    }
}

public enum SignInResult: Equatable, Sendable, CustomStringConvertible {
    case signedIn(MemberSession)
    case signedOut

    public var description: String {
        switch self {
        case .signedIn(let session):
            "signedIn(\(session.account.fullName))"
        case .signedOut:
            "signedOut"
        }
    }
}

/// Result of a signed-in member changing phone and contact details.
public enum MemberDetailsUpdate: Equatable, Sendable, CustomStringConvertible {
    case updated(MemberSession)
    case denied
    /// Update behaviour is intentionally absent until the scenarios have been seen to fail.
    case notImplemented

    public var description: String {
        switch self {
        case .updated(let session):
            "updated(\(session.account.fullName))"
        case .denied:
            "denied"
        case .notImplemented:
            "notImplemented"
        }
    }
}
