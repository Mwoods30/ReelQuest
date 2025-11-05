// User Provider for Authentication State Management
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserContext } from './UserContext.js';
import { onAuthChange } from '../firebase/auth.js';
import { 
  getUserProfile, 
  createUserProfile, 
  subscribeToUserProfile 
} from '../firebase/database.js';

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
          
          // Get or create user profile
          const profileResult = await getUserProfile(firebaseUser.uid);
          
          if (profileResult.success) {
            // Profile exists, subscribe to updates
            unsubscribeProfile = subscribeToUserProfile(
              firebaseUser.uid, 
              setUserProfile
            );
          } else {
            // Create new profile
            const newProfileData = {
              playerName: firebaseUser.displayName || `Fisher${Math.floor(Math.random() * 10000)}`,
              email: firebaseUser.email
            };
            
            const createResult = await createUserProfile(firebaseUser.uid, newProfileData);
            
            if (createResult.success) {
              unsubscribeProfile = subscribeToUserProfile(
                firebaseUser.uid, 
                setUserProfile
              );
            } else {
              setError('Failed to create user profile');
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
    isAuthenticated: !!user && !!userProfile
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