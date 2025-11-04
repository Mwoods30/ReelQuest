import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, firebaseMissingKeys, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const missingConfigMessage = !isFirebaseConfigured
    ? `Firebase Auth is not configured. Add the missing environment variables: ${firebaseMissingKeys.join(', ')}`
    : null;

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [actionLoading, setActionLoading] = useState(false);
  const [authError, setAuthError] = useState(missingConfigMessage ? new Error(missingConfigMessage) : null);

  const latestAction = useRef(null);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const runAuthAction = async (label, callback) => {
    if (!auth) {
      const error =
        missingConfigMessage
          ? new Error(missingConfigMessage)
          : new Error('Authentication is not available. Configure Firebase credentials first.');
      setAuthError(error);
      return Promise.reject(error);
    }

    setActionLoading(true);
    setAuthError(null);
    latestAction.current = label;
    try {
      const result = await callback();
      return result;
    } catch (error) {
      setAuthError(error);
      throw error;
    } finally {
      setActionLoading(false);
      latestAction.current = null;
    }
  };

  const register = async ({ email, password, displayName }) =>
    runAuthAction('register', async () => {
      const { user: createdUser } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(createdUser, { displayName });
      }
      setUser({ ...createdUser });
      return createdUser;
    });

  const login = async ({ email, password }) =>
    runAuthAction('login', async () => {
      const { user: loggedInUser } = await signInWithEmailAndPassword(auth, email, password);
      setUser({ ...loggedInUser });
      return loggedInUser;
    });

  const loginWithGoogle = async () =>
    runAuthAction('google', async () => {
      const { user: googleUser } = await signInWithPopup(auth, googleProvider);
      setUser({ ...googleUser });
      return googleUser;
    });

  const logout = async () =>
    runAuthAction('logout', async () => {
      await signOut(auth);
      setUser(null);
    });

  const value = useMemo(
    () => ({
      user,
      authLoading,
      actionLoading,
      authError,
      latestAction: latestAction.current,
      register,
      login,
      loginWithGoogle,
      logout,
      clearError: () => setAuthError(null)
    }),
    [user, authLoading, actionLoading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
