# ReelQuest – Web Fishing Game

ReelQuest is a modern browser-based fishing adventure built with React, Vite, and Firebase. Cast, compete, and climb the leaderboard while your progress stays synced in the cloud.

## 🎮 Core Features

- Fast, reactive gameplay with streaks, XP, levels, and unlockable environments
- Firebase Authentication, Firestore persistence, and live leaderboard support
- Guest fallback with local storage for offline play
- Responsive UI and fullscreen support for desktop and mobile

## 🧰 Development Workflow

| Command | Purpose |
| ------- | ------- |
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server on `http://localhost:5173` |
| `npm run build` | Produce production bundle in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run firebase:emulators` | Start Auth, Firestore, Hosting emulators |
| `npm run firebase:serve` | Build then launch Hosting emulator |
| `npm run firebase:deploy` | Build and deploy Hosting & Firestore |
| `npm run firebase:deploy:hosting` | Build and deploy Hosting only |
| `npm run firebase:deploy:rules` | Deploy Firestore security rules only |

### Prerequisites
- Node.js 18+
- npm 9+
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

### Environment Variables

Copy `.env.example` to the appropriate environment file (development uses `.env.local` or `.env.development`) and populate with Firebase credentials. **Never commit populated `.env*` files.**

```
cp .env.example .env.local
```

Required keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional for Analytics)

## 🚀 Firebase Deployment

1. **Authenticate & select project**
   ```bash
   firebase login
   firebase use <project-id>
   ```

2. **Build and deploy Hosting + Firestore**
   ```bash
   npm run firebase:deploy
   ```

3. **Deploy only security rules (fast iteration)**
   ```bash
   npm run firebase:deploy:rules
   ```

4. **Verify security headers** – Firebase Hosting now enforces HSTS, X-Frame-Options, nosniff, referrer, and permissions policies. After deployment:
   ```bash
   curl -I https://<your-domain>
   ```

5. **Smoke test mobile web** – Open the site on mobile Safari/Chrome, verify scrolling, touch controls, and fullscreen toggle.

6. **Rotate credentials if leaked** – If any `.env` values or build artifacts were exposed, generate new Firebase API keys and update secrets before redeploying.

### Firestore Rules

Firestore rules live at `firestore.rules`. They enforce:
- Owners-only access to `/users/{uid}` documents
- Strict validation on leaderboard and session entries
- Denial of writes to unknown collections

Run the Firestore emulator (`npm run firebase:emulators`) to test rules locally.

## 📦 Project Structure

```
src/
  components/    # Auth, game, and profile UI
  contexts/      # React context providers (e.g., UserContext)
  firebase/      # Firebase SDK wrappers (auth, config, database)
  hooks/         # Reusable React hooks
public/
  _redirects     # SPA fallback (compatible with Firebase Hosting)
scripts/
  backfillUsers.js  # Admin tool for sanitizing legacy user docs
firebase.json    # Hosting config with security headers
firestore.rules  # Firestore security rules
```

## 🔐 Security Checklist

- `.gitignore` excludes `.env*` files; keep secrets in local env or CI vaults
- Firebase Hosting adds HSTS, X-Frame-Options, nosniff, referrer, and permissions headers
- Firestore rules limit reads/writes to authenticated owners and validated payloads
- Run `npm audit --omit=dev` regularly (current status: 0 vulnerabilities)

## 👥 Development Team

- Matthew Woods
- Ryan McKearnin
- Tyler Klimczak
- Willow Iloka

## 📄 License

This project is private and proprietary.
