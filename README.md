# 🎣 ReelQuest – Web Fishing Game

ReelQuest is an interactive, browser-based fishing adventure built with React, Vite, and Firebase. Cast your line, reel in unique fish, unlock new environments, and climb the global leaderboard — all while your progress syncs seamlessly across devices.

This project was created for a Software Engineering Final Project and demonstrates requirements gathering, architecture design, implementation, testing, and cloud deployment.

## 🚀 Live Demo & Project Links
- **Production App:** https://mwoods30.github.io/ReelQuest/
- **Repository:** https://github.com/Mwoods30/ReelQuest
- **Trello Board (User Stories + Acceptance Criteria):** _Add link here_
- **CI/CD & Deployment Documentation:** Included in final submission package

## 🎮 Core Gameplay Features
- **Dynamic Fishing Engine:** streak bonuses, XP, leveling, biome-specific fish
- **Progression System:** unlock new lakes, rods, and upgrades
- **Authentication:** Google Sign-In + guest fallback
- **Cloud Save Support:** progress, inventory, and stats synced through Firestore
- **Live Leaderboard:** global rankings updated in real time
- **Offline Mode:** localStorage fallback when Firebase is unavailable
- **Responsive Design:** optimized for desktop, tablet, mobile, and fullscreen

## 🧱 System Architecture Overview
### Frontend
- React + Vite single-page application
- Modular structure: game UI, inventory, shop, HUD, profile
- Custom React hooks for inventory management, game engine logic, authentication state, and environment rendering
- Global `UserContext` manages sync between cloud and offline modes

### Backend (Firebase)
- Firestore: user profiles, leaderboard, session logs
- Firebase Auth: Google and anonymous login
- Firebase Hosting: production build deployment
- Security rules enforce user-only document access, strict schema validation on leaderboard entries, and rejection of unknown collections

### Game Flow (High-Level)
1. Player loads the game → profile + environment fetch
2. Player casts line → weighted fish RNG logic
3. Catch event triggers XP gain, streak calculations, rewards
4. Inventory updates and persists (cloud or offline fallback)
5. Leaderboard updates for authenticated players

For detailed diagrams, see `docs/architecture/reelquest-architecture.md`.

## 🧪 Testing Artifacts
### Test Coverage Includes
- Unit tests: fish generation, streak logic, inventory operations
- Integration tests: authentication → profile load → Firestore writes
- UI tests: mobile responsiveness, button interactions, fullscreen
- Security testing: Firebase rules via Emulator Suite

### Sample Test Cases
| Test Case | Steps | Expected Result |
| --- | --- | --- |
| Catch Fish | Click "Cast" → reel in | Fish added to inventory, XP updated |
| Sell Fish | Select fish → tap Sell | Currency increases, inventory updates |
| Offline Mode | Disable network → reload | Game loads fallback profile, no crash |
| Login Flow | Click "Sign In with Google" | Firebase returns user, profile loads |
| Rules Check | Attempt invalid write | Firestore blocks operation |

The full plan lives in `docs/testing/test-plan.md`.

## 🧰 Development Workflow
| Command | Description |
| ------- | ----------- |
| `npm install` | Install dependencies |
| `npm run dev` | Run Vite dev server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run firebase:emulators` | Start local Auth + Firestore + Hosting |
| `npm run firebase:serve` | Build & serve via emulator |
| `npm run firebase:deploy` | Deploy Hosting + Firestore |
| `npm run firebase:deploy:hosting` | Deploy Hosting only |
| `npm run firebase:deploy:rules` | Deploy updated Firestore rules |

### Environment Variables
Copy `.env.example` into a local environment file:

```bash
cp .env.example .env.local
```

Populate with Firebase credentials (never commit secrets):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=  # optional
```

## 📁 Project Structure
```
src/
   components/        # Game UI, Auth, Profile
   contexts/          # UserContext, GameContext
   firebase/          # Config + Firestore wrappers
   hooks/             # useInventory, useUser, useGameEngine
public/
   _redirects         # SPA fallback (Firebase-compatible)
scripts/
   backfillUsers.js   # Admin user migration tool
firebase.json        # Hosting + security headers
firestore.rules      # Firestore security rules
```

## 🔐 Security Checklist
- `.gitignore` excludes all `.env*` files
- Firestore rules restrict read/write access by user
- Hosting enforces HSTS, X-Frame-Options, nosniff, strict referrer, and permissions policies
- No known vulnerabilities: `npm audit --omit=dev` shows 0

## 👥 Development Team
- Matthew Woods
- Ryan McKearnin
- Tyler Klimczak
- Willow Iloka
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

