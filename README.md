🎣 ReelQuest – Web Fishing Game

ReelQuest is an interactive, browser-based fishing adventure built with React, Vite, and Firebase. Cast your line, reel in unique fish, unlock new environments, and climb the global leaderboard — all while your progress syncs seamlessly across devices.

This project was created for a Software Engineering Final Project and demonstrates requirements gathering, architecture design, implementation, testing, and cloud deployment.

🚀 Live Demo & Project Links

Production App: https://mwoods30.github.io/ReelQuest/

Repository: https://github.com/Mwoods30/ReelQuest

Trello Board (User Stories + Acceptance Criteria): Add link here

CI/CD / Deployment Documentation: Included in final submission package

🎮 Core Gameplay Features

Dynamic Fishing Engine: streak bonuses, XP, leveling, biome-specific fish

Progression System: unlock new lakes, rods, and upgrades

Authentication: Google Sign-In + guest fallback

Cloud Save Support: progress, inventory, and stats synced through Firestore

Live Leaderboard: global rankings updated in real time

Offline Mode: localStorage fallback when Firebase is unavailable

Responsive Design: optimized for desktop, tablet, mobile, and fullscreen

🧱 System Architecture Overview
Frontend

React + Vite single-page application

Modular structure: Game UI, Inventory, Shop, HUD, Profile

Custom React Hooks for:

inventory management

game engine logic

authentication state

environment rendering

Global UserContext manages sync between cloud and offline modes

Backend (Firebase)

Firestore: user profiles, leaderboard, session logs

Firebase Auth: Google and anonymous login

Firebase Hosting: production build deployment

Security Rules enforce:

user-only access to their documents

strict schema validation on leaderboard entries

rejection of unknown collections

Game Flow (High-Level)

Player loads game → profile + environment load

Player casts line → weighted fish RNG logic

Catch event triggers XP, streaks, rewards

Inventory updates and persists (cloud or offline fallback)

Leaderboard updates for authenticated players

🧪 Testing Artifacts
Test Coverage Includes

Unit tests: fish generation, streak logic, inventory operations

Integration tests: Auth → load user → write to Firestore

UI tests: mobile responsiveness, button interactions, fullscreen

Security testing: Firebase rules via Emulator Suite

Sample Test Cases
Test Case	Steps	Expected Result
Catch Fish	Click "Cast" → reel in	Fish added to inventory, XP updated
Sell Fish	Select fish → tap Sell	Currency increases, inventory updates
Offline Mode	Disable network → reload	Game loads fallback profile, no crash
Login Flow	Click "Sign In with Google"	Firebase returns user, profile loads
Rules Check	Attempt invalid write	Firestore blocks operation
🧰 Development Workflow
Available Commands
Command	Description
npm install	Install dependencies
npm run dev	Run Vite dev server
npm run build	Create production build
npm run preview	Preview production build
npm run firebase:emulators	Start local auth + Firestore + hosting
npm run firebase:serve	Build & serve via emulator
npm run firebase:deploy	Deploy Hosting + Firestore
npm run firebase:deploy:hosting	Deploy Hosting only
npm run firebase:deploy:rules	Deploy updated Firestore rules
🔑 Environment Variables

Copy .env.example into a local environment file:

cp .env.example .env.local


Fill with Firebase credentials:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=   # optional


Never commit .env* files.

📁 Project Structure
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

🔐 Security Checklist

.gitignore excludes all .env* files

Firestore rules restrict read/write access by user

Hosting enforces:

HSTS

X-Frame-Options

nosniff

strict referrer policies

permissions policies

No known vulnerabilities: npm audit --omit=dev shows 0

👥 Development Team

Matthew Woods

Ryan McKearnin

Tyler Klimczak

Willow Iloka
