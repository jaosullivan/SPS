#if canImport(SwiftUI)
import SwiftUI

/// iPhone sign-in screen. A signed-in member sees their own account and can
/// change their own phone and contact details. CRM admin tools are not shown.
public struct MemberSignInView: View {
    @State private var directory: ClubDirectory

    @State private var email = ""
    @State private var password = ""
    @State private var screen = MemberSignInScreen(phase: .signedOut)
    @State private var attempted = false
    @State private var emailDraft = ""
    @State private var phoneDraft = ""
    @State private var companyDraft = ""
    @State private var detailsMessage = ""

    public init(directory: ClubDirectory) {
        _directory = State(initialValue: directory)
    }

    public var body: some View {
        switch screen.phase {
        case .signedOut:
            signInForm
        case .showingAccount(let session):
            accountView(session)
        }
    }

    private var signInForm: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("St. Patrick's Society")
                .font(.title2)
            Text("Sign in to your membership")
                .foregroundStyle(.secondary)
            TextField("Email", text: $email)
                .textContentType(.username)
                .autocorrectionDisabled()
            SecureField("Password", text: $password)
                .textContentType(.password)
            Button("Sign in") {
                attempted = true
                let result = directory.signIn(email: email, password: password)
                screen = MemberSignInScreen.after(result)
                if case .signedIn(let session) = result {
                    showDrafts(for: session.account)
                    detailsMessage = ""
                }
            }
            if attempted, screen.account == nil {
                Text("Those details don't match a member account.")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }

    private func accountView(_ session: MemberSession) -> some View {
        let account = session.account
        return VStack(alignment: .leading, spacing: 12) {
            Text(account.fullName)
                .font(.title2)
            TextField("Email", text: $emailDraft)
                .textContentType(.emailAddress)
                .autocorrectionDisabled()
            TextField("Phone", text: $phoneDraft)
                .textContentType(.telephoneNumber)
            TextField("Company", text: $companyDraft)
            Text(account.status.rawValue.capitalized)
            if let greenCard = account.greenCardNumber {
                Text("Green Card \(greenCard)")
            }
            Button("Save details") {
                saveDetails(session)
            }
            if !detailsMessage.isEmpty {
                Text(detailsMessage)
                    .foregroundStyle(.secondary)
            }
            Button("Sign out") {
                attempted = false
                email = ""
                password = ""
                emailDraft = ""
                phoneDraft = ""
                companyDraft = ""
                detailsMessage = ""
                screen = MemberSignInScreen(phase: .signedOut)
            }
        }
        .padding()
    }

    private func saveDetails(_ session: MemberSession) {
        var club = directory
        let update = club.updateOwnContactDetails(
            actor: session,
            memberID: session.account.id,
            phone: phoneDraft,
            email: emailDraft,
            companyName: companyDraft
        )
        directory = club
        let details = MemberDetailsScreen.showing(session).applying(update)
        switch update {
        case .updated(let updated):
            screen = MemberSignInScreen(phase: .showingAccount(updated))
            if let account = details.account {
                showDrafts(for: account)
            }
            detailsMessage = "Details saved"
        case .denied:
            detailsMessage = "Those details can't be saved."
        }
    }

    private func showDrafts(for account: MemberAccount) {
        emailDraft = account.email
        phoneDraft = account.phone ?? ""
        companyDraft = account.companyName ?? ""
    }
}
#endif
