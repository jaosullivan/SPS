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

No API keys or secrets are required.

## Brand assets

Crest files live in `public/`:

| File | Use |
| --- | --- |
| `crest.webp` | Primary logo |
| `og.jpg` | Social share image |
| `favicon-32.png` / `icon-192.png` | Favicons |
| `apple-touch-icon.png` | iOS home screen |

`src/app/icon.png`, `apple-icon.png`, and `opengraph-image.png` are Next.js metadata copies of the same mark.
