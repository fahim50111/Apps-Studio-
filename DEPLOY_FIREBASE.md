# Firebase Deploy — Apps Studio

**Project:** `apps-studio-1f1c0` (`.firebaserc`)

**After deploy:**
- https://apps-studio-1f1c0.web.app
- https://apps-studio-1f1c0.firebaseapp.com

---

## Quick deploy (recommended)

```bash
npm install
npx firebase login
npx firebase use apps-studio-1f1c0

# Build + Hosting + Rules + Indexes (everything)
npm run firebase:deploy:all
```

### Or step by step

```bash
npm run build                 # must succeed
npm run firebase:deploy       # hosting only (dist/)
npm run firebase:rules        # firestore.rules + indexes  ← required for Request board
```

---

## One-time setup

```bash
npm install
npx firebase login
npx firebase use apps-studio-1f1c0
npx firebase projects:list    # confirm you see apps-studio-1f1c0
```

---

## What gets deployed

| File | Role |
|------|------|
| `dist/` | Production SPA (`firebase.json` → hosting.public) |
| `firebase.json` | SPA rewrite, cache, security headers |
| `firestore.rules` | Public read/request + admin writes |
| `firestore.indexes.json` | category + downloads composites |
| `.firebaserc` | default project id |

---

## Firestore rules (summary)

| Collection | Public | Signed-in |
|------------|--------|-----------|
| `apps` | read + downloads+1 | create/update/delete |
| `banners` | read | write |
| `news` | read | write |
| `requests` | **read + write** | write |
| `update_reports` | write | read |
| `visitors` | write | read |
| `admins` | — | read/write |

**Request document shape** (from website):

```
date: string        // YYYY-MM-DD
name: string
status: string      // "pending"
text: string
timestamp: number   // Date.now() ms
```

---

## Pre-flight checklist

- [x] `npm run build` — TypeScript + Vite OK  
- [x] `npm run lint` — clean  
- [x] `dist/` has `index.html`, assets, logo, favicon  
- [x] Google site verification meta in `index.html`  
- [x] SPA rewrite `** → /index.html`  
- [x] Project id matches client config (`apps-studio-1f1c0`)  
- [ ] `firebase login` on your machine  
- [ ] `npm run firebase:deploy:all`  

---

## Local preview

```bash
npm run build && npm run preview
# or
npm run firebase:serve
```

---

## Custom domain (optional)

Firebase Console → Hosting → Add custom domain → DNS records.

After custom domain, update `public/robots.txt` + `public/sitemap.xml` base URL, rebuild, redeploy.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Request list empty / permission error | `npm run firebase:rules` |
| Blank page on refresh of `/app/...` | Confirm hosting rewrite in `firebase.json` |
| Wrong project | `npx firebase use apps-studio-1f1c0` |
| Not logged in | `npx firebase login` |
