'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';

interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  imageUrl?: string;
  orgId?: string | null;
  orgRole?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  isSignedIn: boolean;
}

export function useAuth(): AuthState {
  const { user, isLoaded } = useUser();
  const { isSignedIn, orgId, orgRole } = useClerkAuth();

  if (!isLoaded) {
    return { user: null, loading: true, error: null, isSignedIn: false };
  }

  if (!isSignedIn || !user) {
    return { user: null, loading: false, error: null, isSignedIn: false };
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;

  const authUser: AuthUser = {
    id: user.id,
    email: primaryEmail,
    name: user.fullName || user.firstName || undefined,
    imageUrl: user.imageUrl,
    orgId: orgId || null,
    orgRole: orgRole || null,
  };

  return { user: authUser, loading: false, error: null, isSignedIn: true };
}
