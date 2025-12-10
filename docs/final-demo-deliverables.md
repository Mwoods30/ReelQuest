# Final Demo Deliverables Checklist

Use this checklist to align your sprint board, proposal, and demo materials with the final evaluation rubric. Replace the instructional placeholders with your project-specific details before submission.

---

## 1. Trello (or Equivalent) Board Updates

**Goal:** Show a clear, current view of remaining and completed work for the final sprint.

1. **Board Columns**
   - Backlog (future work)
   - Sprint Backlog (committed for this sprint)
   - In Progress
   - In Review / QA
   - Done (link to demo or commit when possible)

2. **User Story Cards** (ensure each card contains)
   - Title with feature outcome (e.g., `Guest mode saves progress locally`).
   - Description paragraph following the format: `As a [role], I want [action], so that [value].`
   - Acceptance Criteria as a mini checklist (Gherkin or bullet form). Example:
     - `[ ]` Catching a fish updates local inventory immediately.
     - `[ ]` Offline players see a warning that cloud sync is disabled.
   - Links/Evidence: screenshot, PR link, or commit hash.
   - Team assignments and due dates that match your sprint window.

3. **Sprint Review Note**
   - Add a card (or checklist item) summarizing sprint outcomes: completed stories, items moved to next sprint, blockers.
   - Attach the latest build link (`https://reelquest-fishing.web.app`) so reviewers can trace working software from the board.

> **Tip:** Take a screenshot of the full board (or export to PDF) after updates; you will need it for the proposal addendum.

---

## 2. Updated Project Proposal (Assignment 1 Revision)

Embed (or append) the following sections in your original proposal document. Replace the placeholders within brackets.

### 2.1 Executive Summary Refresh
- One paragraph describing the current state of ReelQuest, the major UI overhaul, and Firestore hardening completed this sprint.

### 2.2 Completed Features Since Assignment 1
- Bullet list (3–5 items) noting achievements such as:
  - "Responsive fullscreen layout with mobile-first controls."
  - "Firestore security rules synchronized with new progression fields (`skillPoints`, `skills`, `prestigeLevel`)."

### 2.3 Remaining Stretch Goals (if any)
- State whether the stretch goal was achieved. If not, explain its status and rationale (e.g., descoped due to security focus).

### 2.4 Risks & Mitigations (Updated)
- Example entries:
  - **Risk:** Firestore writes denied for new schema fields.
    **Mitigation:** Deployed relaxed ruleset and client-side field allowlist to prevent schema drift.

### 2.5 Demo Readiness Statement
- A short paragraph confirming the MVP and any stretch goal components that will appear in the demo.

---

## 3. Working Software Demo Script

Structure a 6–8 minute walkthrough. Rehearse using this outline so reviewers see every rubric item.

1. **Introduction (30s)**
   - Team introduction and project mission.

2. **Authentication & Profile (1m)**
   - Show sign-in flow.
   - Demonstrate profile data loading (level, achievements).

3. **Gameplay Loop (2m)**
   - Start a run, catch a fish, highlight XP/streak mechanics.
   - Sell a fish to show currency updates and Firestore sync.

4. **Progression Systems (1.5m)**
   - Unlock or equip an environment.
   - Spend skill points (if available).

5. **Live Leaderboard & Offline Handling (1m)**
   - Show leaderboard update or offline warning for guests.

6. **Wrap-up (30s)**
   - Mention stretch goals achieved (e.g., quests/contracts) and invite questions.

> Record a backup Loom/Zoom video in case live demo time is cut short.

---

## 4. Links & Artifacts Section (Add to Proposal Appendix)

Append the following table to the end of your proposal. Replace bracketed text with actual URLs or file paths.

| Artifact | Link / Location |
| -------- | --------------- |
| Trello Board (Sprint Backlog) | [https://trello.com/b/your-board-id](https://trello.com/b/your-board-id) |
| Production App URL | https://reelquest-fishing.web.app |
| Source Repository | https://github.com/Mwoods30/ReelQuest |
| Repository Structure Screenshot | `docs/screenshots/repo-structure.png` |
| Deployment Pipeline Screenshot | `docs/screenshots/deployment-pipeline.png` |
| Architecture Diagram | `docs/architecture/reelquest-architecture.pdf` |
| Test Plan / Cases | `docs/testing/test-plan.md` |

**Screenshot Guidance**
- *Repo Structure:* Capture VS Code file tree or `tree` output.
- *Deployment Pipeline:* Show Firebase deploy output or CI/CD dashboard.

**Testing Artifacts**
- Add a markdown or PDF summarizing manual/automated tests. Include:
  - Test scope (gameplay loop, auth, persistence).
  - Step-by-step cases with expected/actual results.
  - Date and tester initials.

---

## 5. Final Submission Checklist

- [ ] Trello board reflects final sprint status with acceptance criteria checked off.
- [ ] Proposal document updated with new sections and appendix table.
- [ ] Demo script rehearsed; optional recording created.
- [ ] Screenshots and diagrams stored in `docs/` and linked from proposal.
- [ ] Working build verified at `https://reelquest-fishing.web.app` after latest deploy.

Complete every checkbox, then export the proposal to PDF for submission along with the Trello board snapshot.
