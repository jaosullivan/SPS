# iPhone member sign-in

First slice of the club member app (KAN-14), inside this website repo. Members sign in and see their own account. This is not the CRM admin app: John Alan O'Sullivan is the only admin, and a member session never shows CRM admin tools (members, sponsors, companies, deals, dashboard).

Member fields follow the SPS CRM member record: name, email, phone, company, membership status, and green card number. Sample members Aoife Murphy and Liam Byrne are the CRM seed fixtures. Their password `green-card-fixture` exists only so these scenarios can run. The admin mailbox `admin@stpatrickshk.com` is not a member login.

## Scenarios

`Features/member_signs_in.feature`

- Known member with valid details sees their own account
- Wrong password stays signed out
- Unknown email stays signed out
- A member session never shows CRM admin tools

The scenario file is the behaviour spec. Unit tests in `Tests/MemberSignInTests/` cover the same rules (who gets in, who stays out, members are not admins, no CRM admin UI).

## Run

Swift 6 or newer:

```bash
cd ios
swift test
```

On a Mac with Xcode, the same package can be opened and tested for an iOS destination. The package has no separate admin target.
