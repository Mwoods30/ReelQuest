// User Provider for Authentication State Management
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserContext } from './UserContext.js';
import { onAuthChange } from '../firebase/auth.js';
import { firebaseEnabled } from '../firebase/config.js';

const buildFallbackProfile = (firebaseUser) => ({
  level: 1,
  xp: 0,
  currency: 0,
  inventory: [],
  achievements: [],
  totalCatches: 0,
  totalFishSold: 0,
  ownedEnvironments: ['crystal_lake'],
  ownedUpgrades: [],
  currentEnvironment: 'crystal_lake',
  totalPurchases: 0,
  gamesPlayed: 0,
  totalPlayTime: 0,
  playerName:
    firebaseUser?.displayName ||
    `Fisher${Math.floor(Math.random() * 10000)}`,
  email: firebaseUser?.email ?? null,
  id: firebaseUser?.uid
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** ------------------------------
   *  Merge partial updates into profile
   * ------------------------------ */
  const updateUserProfileCache = useCallback((updates) => {
    if (!updates) return;

    setUserProfile((prev) =>
      prev ? { ...prev, ...updates } : { ...updates }
    );
  }, []);

  /** ------------------------------
   *  Profile subscription error handler
   * ------------------------------ */
  const handleProfileStreamError = (streamError, fallback) => {
    console.error('Realtime profile error:', streamError);

    if (streamError?.code === 'permission-denied') {
      setError(
        'Cloud save is unavailable due to Firestore permissions. Using local progress only.'
      );
    } else {
      setError('Failed to sync profile data. Using local progress only.');
    }

    setUserProfile((prev) => prev ?? fallback);
  };

  /** ------------------------------
   *  Main Auth Effect
   * ------------------------------ */
  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      setLoading(true);

      try {
        if (!firebaseUser) {
          // Signed OUT
          setUser(null);
          setUserProfile(null);

          unsubscribeProfile?.();
          unsubscribeProfile = null;

          setLoading(false);
          return;
        }

        // Signed IN
        setUser(firebaseUser);
        const fallback = buildFallbackProfile(firebaseUser);

        const {
          getUserProfile,
          createUserProfile,
          subscribeToUserProfile
        } = await import('../firebase/database.js');

        /** ------------------------------
         * Try to load profile
         * ------------------------------ */
        const profileResult = await getUserProfile(firebaseUser.uid);

        if (profileResult.success) {
          // start stream first
          unsubscribeProfile = subscribeToUserProfile(
            firebaseUser.uid,
            setUserProfile,
            (err) => handleProfileStreamError(err, fallback)
          );

          setUserProfile(profileResult.data);
          setLoading(false);
          return;
        }

        /** ------------------------------
         * If Firestore denies access
         * ------------------------------ */
        if (profileResult.errorCode === 'permission-denied') {
          setError('Cloud save access denied. Playing with local progress only.');
          setUserProfile(fallback);
          setLoading(false);
          return;
        }

        /** ------------------------------
         * If profile not found → create it
         * ------------------------------ */
        if (profileResult.errorCode === 'not-found') {
          const newProfile = {
            playerName: fallback.playerName,
            email: firebaseUser.email
          };

          const createResult = await createUserProfile(firebaseUser.uid, newProfile);

          if (createResult.success) {
            unsubscribeProfile = subscribeToUserProfile(
              firebaseUser.uid,
              setUserProfile,
              (err) => handleProfileStreamError(err, fallback)
            );

            setUserProfile(createResult.data);
            setLoading(false);
            return;
          }

          if (createResult.errorCode === 'permission-denied') {
            setError(
              'Cannot create profile due to Firestore permissions. Using local progress only.'
            );
            setUserProfile(fallback);
            setLoading(false);
            return;
          }

          // Some other creation error
          setError(createResult.error || 'Failed to create user profile');
          setUserProfile(fallback);
          setLoading(false);
          return;
        }

        /** ------------------------------
         * Unknown profile load error
         * ------------------------------ */
        setError(profileResult.error || 'Failed to load user profile');
        setUserProfile(fallback);
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication error occurred');
      }

      setLoading(false);
    });

    /** ------------------------------
     * Cleanup on unmount
     * ------------------------------ */
    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  /** ------------------------------
   * Context value
   * ------------------------------ */
  const value = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user && !!userProfile,
    updateUserProfileCache
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired
};
