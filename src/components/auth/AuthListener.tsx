'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// This component should be placed in your root layout to monitor auth state globally.
export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      const isAuthPage = pathname === '/login';
      
      if (user && isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage) {
        // Allow access to public pages if any are defined, otherwise redirect to login for protected routes.
        // For this app, all non-login pages are protected.
        // You might want to define a list of public paths if your app has them.
        // const publicPaths = ['/some-public-page'];
        // if (!publicPaths.includes(pathname)) {
        //   router.push('/login');
        // }
        // Simplified: if not on login and no user, go to login
        if (pathname !== '/') { // Allow root to decide, or make root login itself.
            // router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router, toast]);

  return null; // This component does not render anything.
}
