// Custom hook for consuming UserContext safely
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext.js';

export const useUser = () => {
  const value = useContext(UserContext);

  if (!value) {
    throw new Error(
      'useUser() must be used inside a <UserProvider>. ' +
      'The context is undefined because no provider is wrapping this component.'
    );
  }

  return value; // { user, userProfile, setUser, setUserProfile, ... }
};
