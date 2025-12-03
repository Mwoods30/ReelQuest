// Firebase Configuration (Optimized + SSR Safe)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --------------------------------------
// Required Environment Variables
// --------------------------------------
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Detect missing env vars
const missingEnvVars = REQUIRED_ENV_VARS.filter(
  (key) => !import.meta.env[key]
);

// Boolean flag your entire app can rely on
export const firebaseEnabled = missingEnvVars.length === 0;

if (!firebaseEnabled) {
  console.warn(
    `⚠️ Firebase disabled — missing env variables: ${missingEnvVars.join(', ')}`
  );
} else if (import.meta.env.DEV) {
  console.log('🔥 Firebase environment loaded:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'present' : 'missing',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'present' : 'missing',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'present' : 'missing'
  });
}

// --------------------------------------
// Build Firebase Config Object
// Only builds if Firebase is enabled
// --------------------------------------
const firebaseConfig = firebaseEnabled
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    }
  : null;

// --------------------------------------
// Initialize Firebase Safely
// --------------------------------------
let app = null;
let authInstance = null;
let dbInstance = null;

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  } catch (err) {
    console.error('🔥 Firebase initialization error:', err);
  }
} else {
  console.warn('⚠️ Running ReelQuest in offline / guest mode.');
}

// --------------------------------------
// Exports
// --------------------------------------
export const auth = authInstance;
export const db = dbInstance;
export default app;
