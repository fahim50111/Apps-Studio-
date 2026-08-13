# Apps Studio

Free premium apps, mod games & tools download platform.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Firebase (Firestore + Hosting)

## Live

- Firebase: https://apps-studio-1f1c0.web.app
- Firebase alt: https://apps-studio-1f1c0.firebaseapp.com

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Firebase

Full guide: [`DEPLOY_FIREBASE.md`](./DEPLOY_FIREBASE.md)

```bash
# one-time
npm install
npx firebase login

# hosting
npm run firebase:deploy

# rules + indexes (after rule changes)
npm run firebase:rules

# everything
npm run firebase:deploy:all
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run lint` | ESLint |
| `npm run firebase:deploy` | Build + deploy Hosting |
| `npm run firebase:rules` | Deploy Firestore rules & indexes |
| `npm run firebase:deploy:all` | Build + deploy hosting + firestore |
| `npm run firebase:serve` | Hosting emulator with production build |

## Project layout

- `src/pages/` — routes (lazy-loaded)
- `src/components/` — UI
- `src/lib/` — Firebase, SEO, theme, ads helpers
- `public/` — static assets, robots, sitemap, logo
- `firebase.json` — Hosting + Firestore config
- `firestore.rules` — least-privilege security rules

## License

Private project.
