// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = REQUIRED_ENV_VARS.filter((envVar) => !import.meta.env[envVar]);

if (missingEnvVars.length > 0) {
  const message = `Missing Firebase environment variables: ${missingEnvVars.join(', ')}`;
  if (import.meta.env.PROD) {
    throw new Error(message);
  }
  console.warn(message);
}

if (import.meta.env.DEV) {
  console.log('Loaded Firebase env flags:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'present' : 'missing',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'present' : 'missing',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'present' : 'missing'
  });
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;