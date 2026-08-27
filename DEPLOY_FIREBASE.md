# Firebase Deploy — Apps Studio

**Project:** `apps-studio-1f1c0` (`.firebaserc`)

**After deploy:**
- https://apps-studio-1f1c0.web.app
- https://apps-studio-1f1c0.firebaseapp.com

## Quick deploy

```bash
npm install
npx firebase-tools login
npx firebase-tools use apps-studio-1f1c0
npm run firebase:deploy:all
```

### Step by step

```bash
npm run build
npm run firebase:deploy       # hosting (dist/)
npm run firebase:rules        # firestore.rules + indexes
```

## What gets deployed

| File | Role |
|------|------|
| `dist/` | Production SPA |
| `firebase.json` | SPA rewrite, cache, security headers |
| `firestore.rules` | Public read/request + admin writes |
| `firestore.indexes.json` | category + downloads composites |
| `.firebaserc` | default project id |

## Pre-flight

- [x] `npm run build` succeeds
- [x] SPA rewrite `** → /index.html`
- [x] Project id matches client config (`apps-studio-1f1c0`)
- [x] robots.txt + sitemap.xml point at `apps-studio-1f1c0.web.app`
- [ ] `npx firebase-tools login` on your machine
- [ ] `npm run firebase:deploy:all`

## Custom domain

Firebase Console → Hosting → Add custom domain.  
Then update `public/robots.txt` + `public/sitemap.xml` base URL, rebuild, redeploy.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Request list empty / permission error | `npm run firebase:rules` |
| Blank page on refresh of `/app/...` | Confirm hosting rewrite in `firebase.json` |
| Wrong project | `npx firebase-tools use apps-studio-1f1c0` |
| Not logged in | `npx firebase-tools login` |
