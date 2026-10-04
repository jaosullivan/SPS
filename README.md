# St. Patrick's Society Hong Kong

Public website for the St. Patrick's Society of Hong Kong — the Irish community society in the city since 1931.

This Next.js app is intended to **replace the current Wix site at [stpatrickshk.com](https://www.stpatrickshk.com/)**.

## Local run

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## What’s included

- Home, About, Events, Gala/gallery, and Contact
- New official crest as logo, favicon, Apple touch icon, and Open Graph image
- Upcoming events driven by `src/lib/events.ts` (empty array shows a polished empty state)
- Green Card membership details on Contact (enquiries via `info@stpatrickshk.com`)
- Privileged CRM sign-in at `/crm/login` for the admin account holder

No API keys or secrets are required.

## iPhone member app

Club member sign-in and own-details updates for the iPhone app live in `ios/` (KAN-14, KAN-15). They use the CRM member fields and do not include CRM admin tools. John is the only admin. A signed-in member can change their own phone and contact details, and cannot edit another member.

```bash
cd ios
swift test
```

Scenarios: `ios/Features/member_signs_in.feature` and `ios/Features/member_updates_own_details.feature`. See `ios/README.md`.

## CRM sign-in

John Alan O'Sullivan (`admin@stpatrickshk.com`) is the only admin. He signs in at `/crm/login` with email and password, the same idea as the older CRM login. The privileged area then shows Dashboard, Members, Sponsors, Companies, and Deals.

A member login is rejected. Aoife Murphy and Liam Byrne are the existing member fixtures, and their password does not open the CRM. The public navigation does not list those management areas.

The admin session is an httpOnly cookie scoped to `/crm`. It names John and is checked on the server. It is not the older CRM's browser token, and it is not a member session. The scenario password `changeme` is the CRM development fixture, not a production credential.

```bash
npm test
```

Scenarios: `features/admin_signs_in.feature`.

On Members, the signed-in admin can see Aoife Murphy and Liam Byrne and update their name, email, phone, company, status, and green card. A member session cannot open that screen or see CRM management. Records stay in the website process for this slice. There is no separate member database.

Scenarios: `features/admin_updates_member_records.feature`.

## Member sign-in

A club member signs in at `/account` with the email and password already stored on their member record, the same account the iPhone app uses. Aoife Murphy and Liam Byrne sign in with the member fixture password. That session shows their own account and does not grant CRM admin access.

John Alan O'Sullivan remains the only admin. His CRM password does not open a member session, and a member password still does not open `/crm`. A member session does not show Dashboard, Members, Sponsors, Companies, or Deals.

The member session is a separate httpOnly cookie. It names the member id and is read back from the same club records the admin updates. Changing a member's email in the CRM changes the account they use to sign in.

On `/account`, a signed-in member can update their own phone, email, and company. Name, membership status, and green card stay as they are. They cannot edit another member, and the session still does not show CRM management. John remains the only admin.

Scenarios: `features/member_updates_own_details_on_the_website.feature`.

```bash
npm test
```

Scenarios: `features/member_signs_in_on_the_website.feature`.

## Partner places

A signed-in member can open `/account/partners` and see which bars and restaurants are in the rewards program, and what each place offers. This is a list of places, not a points balance. A signed-out visitor is sent back to account sign-in and does not see the list. A member session still does not open CRM management.

On that page a signed-in member can earn the offer the place already states. Sample Harbour Bar is 10% off food and drink for Green Card holders, so only a member with a green card earns it. Sample Lantern Restaurant is a complimentary soft drink with a main course, and a signed-in member can earn that without an extra qualification. The earned offer stays tied to that member and that place. It does not create a points balance, and it does not grant the other place's offer. A signed-out visitor cannot earn either offer. A member cannot earn an offer for another member. Redeeming at the venue is out of scope.

Scenarios: `features/member_earns_partner_offer.feature`.

Neither this website nor the older CRM (`sps-crm`) names real partner venues. The older CRM seeds a gala sponsor, Avolon, which is not a rewards bar or restaurant. The list uses clearly marked sample fixtures: Sample Harbour Bar and Sample Lantern Restaurant.

Scenarios: `features/member_sees_partner_places.feature`.

## Brand assets

Crest files live in `public/`:

| File | Use |
| --- | --- |
| `crest.webp` | Primary logo |
| `og.jpg` | Social share image |
| `favicon-32.png` / `icon-192.png` | Favicons |
| `apple-touch-icon.png` | iOS home screen |

`src/app/icon.png`, `apple-icon.png`, and `opengraph-image.png` are Next.js metadata copies of the same mark.
