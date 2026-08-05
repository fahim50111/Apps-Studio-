# Apps Studio

**Apps Studio** — Free premium apps, mod games & useful tools download platform.

Modern React + TypeScript + Vite + Tailwind CSS + Firebase website.

## Live

- Firebase: https://apps-studio-1f1c0.web.app
- (Also configured for Vercel)

## Features

- Browse apps by category (Social, Games, Tools, Entertainment, Education, Productivity)
- Top charts / most downloaded
- Search
- App detail pages with multiple download links
- Request new apps
- Theme (Light / Dark / System) + monthly light themes
- Notifications for new apps
- Firebase Firestore catalog + secure rules
- SEO ready (dynamic meta + sitemap)

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Firebase (Firestore + Hosting)
- Framer Motion, Lucide icons, Swiper
- React Router 7

## Development

```bash
npm install
npm run dev
```

## Build & Deploy (Firebase)

```bash
npm run firebase:deploy
```

Or:

```bash
npm run build
firebase deploy --only hosting
```

Also deploy rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Project structure

- `src/pages/` — route pages
- `src/components/` — UI components
- `src/lib/` — Firebase, SEO, security, theme, utils
- `public/` — static assets, robots, sitemap
- `firestore.rules` — least-privilege security rules

## License

Private project.
