#if canImport(SwiftUI)
import SwiftUI

/// iPhone sign-in screen. Shows the member's own account and no CRM admin tools.
public struct MemberSignInView: View {
    private let directory: ClubDirectory

    @State private var email = ""
    @State private var password = ""
    @State private var screen = MemberSignInScreen(phase: .signedOut)
    @State private var attempted = false

    public init(directory: ClubDirectory) {
        self.directory = directory
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
                screen = MemberSignInScreen.after(
                    directory.signIn(email: email, password: password)
                )
            }
            if attempted {
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
            Text(account.email)
            if let phone = account.phone {
                Text(phone)
            }
            if let company = account.companyName {
                Text(company)
            }
            Text(account.status.rawValue.capitalized)
            if let greenCard = account.greenCardNumber {
                Text("Green Card \(greenCard)")
            }
            Button("Sign out") {
                attempted = false
                email = ""
                password = ""
                screen = MemberSignInScreen(phase: .signedOut)
            }
        }
        .padding()
    }
}
#endif
