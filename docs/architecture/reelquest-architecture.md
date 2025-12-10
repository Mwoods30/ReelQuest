# ReelQuest Architecture Overview

## 1. High-Level System Context

```
+-------------------------+      HTTPS      +-------------------------+
|  Player Browser (Vite)  | <-------------> |  Firebase Services      |
|  React SPA + UI Layers  |                 |  Auth / Firestore / RTDB|
+------------+------------+                 +------------+------------+
             |                                           |
             |                                           |
             v                                           v
    +--------+--------+                        +---------+---------+
    |  UI Components  |  React Context / Hooks |  Firestore (DB)   |
    |  (App, screens) |----------------------->|  authProfiles,    |
    +--------+--------+        state sync      |  progress docs    |
             |                                 +---------+---------+
             v                                           |
    +--------+--------+                                  v
    |  Firebase SDK   |                          Cloud Storage (assets)
    |  modular import |                          (static game art)
    +-----------------+
```

- **Client Application** – React (Vite) single-page app. Core UI lives in `src/components/**` and `src/App.jsx`.
- **State Orchestration** – `UserContext` exposes authentication + profile data, consumed via `useUser()` hook.
- **Backend Services** – Firebase Authentication (Google + email/password) and Firestore for persistence. Hosting/CDN serves the bundle.
- **Static Assets** – `public/` and optional Firebase Storage host game art/logo.

## 2. Core Modules & Responsibilities

| Layer           | Files / Modules                    | Responsibilities                                                                  |
| ----------------|----------------------------------- | --------------------------------------------------------------------------------- |
| Presentation    | `src/App.jsx`, `src/components/**` | Render UI, handle user interaction, open overlays (shop, leaderboard, auth modal). |
| State & Context | `src/contexts/UserContext.jsx`, `src/hooks/useUser.js` | Manage Firebase auth state, subscribe to profile document,   
 expose helper actions to components. |
| Data Access | `src/firebase/auth.js`, `src/firebase/database.js`, `src/firebase/config.js` | Wrap Firebase SDK calls (sign-in, Firestore CRUD, leaderboard updates). |
| Domain Logic | `src/components/fishing/useInventory.js`, `FishingGame.jsx` | Gameplay loop, inventory updates, XP/level calculations, persistence dispatch. |

## 3. Authentication & Profile Flow

1. **Bootstrap:** `UserProvider` mounts, attaches `onAuthChange` listener.
2. **User Signs In:** Firebase Auth returns a `firebaseUser`.
3. **Profile Fetch:** `getUserProfile` loads Firestore doc. If missing, `createUserProfile` seeds defaults.
4. **Live Sync:** `subscribeToUserProfile` streams document changes to `UserContext`, updating `userProfile` state.
5. **Consumer Access:** Components call `useUser()` to read `user`/`userProfile`, toggle UI (guest vs authenticated).

## 4. Gameplay Persistence Flow

```
[FishingGame.jsx]
      |
      | persistProgress({ level, xp, currency, ... })
      v
[src/firebase/database.js]
  saveGameProgress(uid, payload)
      |
      v
[Firestore] authProfiles/{uid}
```

- Authenticated users: progress is sanitized and written via `saveGameProgress`, `addToLeaderboard`, `logGameSession`.
- Guests / offline: data stays in local state; leaderboard updates use local utilities (`addToGlobalLeaderboard`).

## 5. Deployment & Environments

- **Development:** `npm run dev` (Vite) + Firebase Emulator optional. Env vars in `.env.development` / `.env.local`.
- **Production:** Firebase Hosting (`firebase deploy`). Uses `firestore.rules` / `firestore.indexes.json` for security and indexing.

## 6. Extension Points

- **Additional Services:** Cloud Functions (future) for advanced leaderboards.
- **Analytics:** `src/firebase/analytics.js` integrates Firebase Analytics when enabled.
- **Theming:** CSS modules (`App.css`, component .css files) control styling, easily swapped or themed.
