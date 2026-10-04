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

## iPhone member sign-in

Club member sign-in for the iPhone app lives in `ios/` (KAN-14). It uses the CRM member fields and does not include CRM admin tools. John is the only admin.

```bash
cd ios
swift test
```

Scenarios: `ios/Features/member_signs_in.feature`. See `ios/README.md`.

## CRM sign-in

John Alan O'Sullivan (`admin@stpatrickshk.com`) is the only admin. He signs in at `/crm/login` with email and password, the same idea as the older CRM login. The privileged area then shows Dashboard, Members, Sponsors, Companies, and Deals.

A member login is rejected. Aoife Murphy and Liam Byrne are the existing member fixtures, and their password does not open the CRM. The public navigation does not list those management areas.

The admin session is an httpOnly cookie scoped to `/crm`. It names John and is checked on the server. It is not the older CRM's browser token, and it is not a member session. The scenario password `changeme` is the CRM development fixture, not a production credential.

```bash
npm test
```

Scenarios: `features/admin_signs_in.feature`.

## Brand assets

Crest files live in `public/`:

| File | Use |
| --- | --- |
| `crest.webp` | Primary logo |
| `og.jpg` | Social share image |
| `favicon-32.png` / `icon-192.png` | Favicons |
| `apple-touch-icon.png` | iOS home screen |

`src/app/icon.png`, `apple-icon.png`, and `opengraph-image.png` are Next.js metadata copies of the same mark.
