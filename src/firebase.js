import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `Firebase configuration incomplete. Missing environment variables: ${missingKeys.join(', ')}`
  );
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : isFirebaseConfigured
      ? initializeApp(firebaseConfig)
      : undefined;

const auth = app ? getAuth(app) : null;
const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export {
  app,
  auth,
  googleProvider,
  firebaseConfig,
  isFirebaseConfigured,
  missingKeys as firebaseMissingKeys
};
