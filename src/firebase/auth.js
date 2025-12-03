// Firebase Authentication Service (Optimized + SSR Safe)

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, firebaseEnabled } from './config.js';

// -------------------------------------
// Helpers
// -------------------------------------

const disabled = (operation) => ({
  success: false,
  error: `${operation} unavailable: Firebase disabled or missing config`
});

const formatError = (error) => ({
  success: false,
  error: error?.message || 'Unknown authentication error'
});

// Local storage cleanup for logout
const clearLocalProgress = () => {
  if (typeof window === 'undefined') return;

  const keys = [
    'reelquest:fishing:best-score',
    'reelquest:player:data',
    'reelquest:global:leaderboard',
    'reelquest:player:stats'
  ];

  keys.forEach((key) => localStorage.removeItem(key));
};

// Google provider (safe to define)
const googleProvider =
  typeof window !== 'undefined' ? new GoogleAuthProvider() : null;

// -------------------------------------
// Authentication API
// -------------------------------------

export const createAccount = async (email, password, displayName) => {
  if (!firebaseEnabled || !auth) return disabled('Account creation');

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Apply display name if provided
    await updateProfile(user, {
      displayName: displayName || `Fisher${Math.floor(Math.random() * 10000)}`
    });

    return { success: true, user };
  } catch (error) {
    return formatError(error);
  }
};

export const signInUser = async (email, password) => {
  if (!firebaseEnabled || !auth) return disabled('Sign in');

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    return formatError(error);
  }
};

export const signInWithGoogle = async () => {
  if (!firebaseEnabled || !auth || !googleProvider)
    return disabled('Google sign-in');

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return formatError(error);
  }
};

export const signOutUser = async () => {
  if (!firebaseEnabled || !auth) return disabled('Sign out');

  try {
    await signOut(auth);
    clearLocalProgress();
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
};

export const resetPassword = async (email) => {
  if (!firebaseEnabled || !auth) return disabled('Password reset');

  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
};

// -------------------------------------
// Auth State Listener
// -------------------------------------

export const onAuthChange = (callback) => {
  if (!firebaseEnabled || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// -------------------------------------
// Get current user
// -------------------------------------

export const getCurrentUser = () => {
  if (!firebaseEnabled || !auth) return null;
  return auth.currentUser;
};
