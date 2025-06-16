'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const authInstance = getFirebaseAuth(); // Initialize Firebase Auth only on the client-side after mount
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (user) => {
        setAuthState({ user, loading: false, error: null });
      },
      (error) => {
        setAuthState({ user: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  return authState;
}
