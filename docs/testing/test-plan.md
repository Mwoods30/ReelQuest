# ReelQuest Test Plan

## 1. Objectives
- Verify core gameplay loop, authentication, and Firestore persistence behave as designed.
- Validate guest/offline pathways so players never encounter blocking errors.
- Confirm demo-critical features (leaderboard, inventory, environment unlocks) remain stable after each release.

## 2. Scope
- **In Scope:** React UI flows, Firebase Auth (email/password + Google), Firestore profile sync, leaderboard updates, inventory/shop logic, guest mode persistence.
- **Out of Scope:** Load/performance testing, mobile-native builds (Expo), advanced analytics dashboards.

## 3. Test Strategy
- **Manual Functional Testing:** Primary validation using curated scenarios (Section 5).
- **Smoke Suite (Optional Automation):** Cypress/Playwright candidate covering login + start game + sell fish (not yet implemented).
- **Regression Checklist:** Run high-impact manual tests before deploys (Section 6).

## 4. Test Environment
- **Frontend:** `npm run dev` (Vite) on Chrome 120+. Mobile view via Chrome devtools responsive mode.
- **Backend:** Firebase project `reelquest-fishing` with Firestore indexes deployed. Use demo user accounts for write access.
- **Data Setup:** Seed Firestore with baseline profile doc for test user (`test.angler@example.com`). Clear leaderboard entries after each run when validating ranking logic.

## 5. Manual Test Cases

| TC ID | Area | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| TC-AUTH-01 | Auth | Email/password login success | 1. Open app 2. Click "Sign In" 3. Enter valid credentials 4. Submit | Modal closes, header shows user name, `userProfile` populated, no console errors. |
| TC-AUTH-02 | Auth | Invalid password handling | 1. Trigger sign-in modal 2. Enter known email with wrong password 3. Submit | Error banner "Authentication failed" displayed, no Firestore calls attempted. |
| TC-AUTH-03 | Auth | Google sign-in | 1. Click "Continue with Google" 2. Choose authorized account | User logged in, profile sync commences, modal closes. |
| TC-PROF-01 | Profile | Profile seed on first login | 1. Delete test user's profile doc 2. Sign in 3. Observe Firestore | `authProfiles/{uid}` created with default fields, UI displays level 1. |
| TC-PROF-02 | Profile | Permission denied fallback | 1. Temporarily tighten Firestore rules to deny writes 2. Sign in 3. Start gameplay | App shows warning "Cloud save access denied", gameplay uses local state, no crashes. |
| TC-GAME-01 | Gameplay | Catch + sell fish | 1. Start run 2. Catch fish 3. Sell via shop | Currency increases, inventory updates, streak increments. |
| TC-GAME-02 | Gameplay | Level up flow | 1. Use debug button or catch until XP threshold 2. Observe UI | Level badge updates, difficulty scaling logs to console (DEV only). |
| TC-INV-01 | Inventory | Purchase item | 1. Earn enough currency 2. Buy rod upgrade 3. Re-open shop | Item marked as owned, currency deducted, Firestore payload includes `ownedUpgrades`. |
| TC-INV-02 | Inventory | Equip environment | 1. Unlock second environment 2. Equip from inventory | Background art changes, `currentEnvironment` saved. |
| TC-LB-01 | Leaderboard | Authenticated run posts score | 1. Finish game with score 2. View leaderboard overlay | Entry appears with correct rank/time stamp. |
| TC-LB-02 | Leaderboard | Guest run uses local board | 1. Log out 2. Finish game 3. Open leaderboard | Local leaderboard stores score; no Firestore writes recorded. |
| TC-OFF-01 | Offline mode | Disable network mid-game | 1. Sign in 2. Start game 3. Toggle browser offline 4. Finish | Status message shows offline warning, no unhandled exceptions, gameplay data retained locally. |

## 6. Regression Checklist (Pre-Deploy)
- Smoke load homepage (no console errors).
- Auth modal renders and both login methods succeed.
- Start + finish a 60s game; verify score, currency, XP update.
- Shop purchase persists after refresh for signed-in user.
- Leaderboard updates for authenticated user; guest play unaffected.
- Firestore security rules pass simulator for key write/read paths.

## 7. Defect Tracking
- Use GitHub Issues with labels: `bug`, `priority-{high|medium|low}`, `area-{auth|gameplay|ui|infra}`.
- Include reproduction steps, screenshots, console logs, and impacted environment.

## 8. Approval
- Test plan owner: Product/QA lead.
- Sign-off required from engineering lead before final demo freeze.
