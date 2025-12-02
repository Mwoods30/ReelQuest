// User Provider for Authentication State Management
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserContext } from './UserContext.js';
import { onAuthChange } from '../firebase/auth.js';

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
  playerName: firebaseUser?.displayName || `Fisher${Math.floor(Math.random() * 10000)}`,
  gamesPlayed: 0,
  totalPlayTime: 0,
  email: firebaseUser?.email || null,
  id: firebaseUser?.uid
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateUserProfileCache = useCallback((updates) => {
    setUserProfile((prev) => {
      if (!updates) {
        return prev;
      }

      if (!prev) {
        return { ...updates };
      }
      return { ...prev, ...updates };
    });
  }, []);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
          const fallbackProfile = buildFallbackProfile(firebaseUser);

          const handleProfileStreamError = (streamError) => {
            console.error('Realtime profile error:', streamError);

            if (streamError?.code === 'permission-denied') {
              setError('Cloud save is unavailable due to Firestore permissions. Using local progress only.');
            } else {
              setError('Failed to sync profile data. Using local progress only.');
            }

            setUserProfile((prev) => prev ?? fallbackProfile);
          };
          
          const { getUserProfile, createUserProfile, subscribeToUserProfile } = await import('../firebase/database.js');

          // Get or create user profile
          const profileResult = await getUserProfile(firebaseUser.uid);
          
          if (profileResult.success) {
            setUserProfile(profileResult.data);
            // Profile exists, subscribe to updates
            unsubscribeProfile = subscribeToUserProfile(
              firebaseUser.uid, 
              setUserProfile,
              handleProfileStreamError
            );
            return;
          } else {
            if (profileResult.errorCode === 'permission-denied') {
              setError('Cloud save access denied. Playing with local progress only.');
              setUserProfile(fallbackProfile);
              return;
            }

            if (profileResult.errorCode !== 'not-found') {
              setError(profileResult.error || 'Failed to load user profile. Using local progress only.');
              setUserProfile(fallbackProfile);
              return;
            }

            // Create new profile
            const newProfileData = {
              playerName: fallbackProfile.playerName,
              email: firebaseUser.email
            };
            
            const createResult = await createUserProfile(firebaseUser.uid, newProfileData);
            
            if (createResult.success) {
              setUserProfile(createResult.data);
              unsubscribeProfile = subscribeToUserProfile(
                firebaseUser.uid, 
                setUserProfile,
                handleProfileStreamError
              );
            } else {
              if (createResult.errorCode === 'permission-denied') {
                setError('Cannot create profile due to Firestore permissions. Using local progress only.');
                setUserProfile(fallbackProfile);
              } else {
                setError(createResult.error || 'Failed to create user profile');
                setUserProfile(fallbackProfile);
              }
            }
          }
        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
        }
      } catch (err) {
        setError('Authentication error occurred');
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user && !!userProfile,
    updateUserProfileCache
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired
};
