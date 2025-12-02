// Firebase Authentication Service
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

const disabledResponse = (operation) => ({
  success: false,
  error: `${operation} unavailable: Firebase disabled or missing config`
});

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const createAccount = async (email, password, displayName) => {
  if (!firebaseEnabled || !auth) return disabledResponse('Account creation');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    await updateProfile(user, {
      displayName: displayName || `Fisher${Math.floor(Math.random() * 10000)}`
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInUser = async (email, password) => {
  if (!firebaseEnabled || !auth) return disabledResponse('Sign in');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  if (!firebaseEnabled || !auth) return disabledResponse('Google sign-in');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  if (!firebaseEnabled || !auth) return disabledResponse('Sign out');
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  if (!firebaseEnabled || !auth) return disabledResponse('Password reset');
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthChange = (callback) => {
  if (!firebaseEnabled || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  if (!firebaseEnabled || !auth) return null;
  return auth.currentUser;
};
