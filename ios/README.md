# iPhone member app

Club member sign-in (KAN-14) and own-details updates (KAN-15), inside this website repo. Members sign in and see their own account. A signed-in member can change their own phone and contact details, and cannot edit another member. This is not the CRM admin app: John Alan O'Sullivan is the only admin, and a member session never shows CRM admin tools (members, sponsors, companies, deals, dashboard).

Member fields follow the SPS CRM member record: name, email, phone, company, membership status, and green card number. Sample members Aoife Murphy and Liam Byrne are the CRM seed fixtures. Their password `green-card-fixture` exists only so these scenarios can run. The admin mailbox `admin@stpatrickshk.com` is not a member login.

## Scenarios

`Features/member_signs_in.feature`

- Known member with valid details sees their own account
- Wrong password stays signed out
- Unknown email stays signed out
- A member session never shows CRM admin tools

The scenario file is the behaviour spec. Unit tests in `Tests/MemberSignInTests/` cover the same rules (who gets in, who stays out, members are not admins, no CRM admin UI).

## Own details

`Features/member_updates_own_details.feature`

Phone and contact details are the CRM fields a member may change: phone, email, and company. Name, membership status, and green card stay on the member record and are not rewritten by this update. A member cannot save another member's record, or take another member's email.

- Signed-in member sees their own phone and contact details
- Signed-in member changes their own phone
- Signed-in member changes their own contact details
- Member cannot edit another member

Permission tests in `Tests/MemberSignInTests/MemberDetailsRulesTests.swift` cover the same rule before the screen: own phone and contact details can change, another member cannot, blank email is refused, John stays the only admin, and the details screen lists Account only.

## Run

Swift 6 or newer:

```bash
cd ios
swift test
```

On a Mac with Xcode, the same package can be opened and tested for an iOS destination. The package has no separate admin target.
