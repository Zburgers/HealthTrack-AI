'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({ user, loading: false, error: null });
      },
      (error) => {
        setAuthState({ user: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, []);

  return authState;
}
