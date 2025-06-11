
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Simple SVG Icon for Google
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 381.7 512 244 512 113.3 512 0 398.7 0 261.8S113.3 11.6 244 11.6C304.8 11.6 356.8 33.5 397.6 68.8L341.6 124.8C316.8 102.4 283.2 89.6 244 89.6 169.6 89.6 109.6 149.6 109.6 224C109.6 298.4 169.6 358.4 244 358.4c52 0 87.2-20.8 106.4-40L376 318.4c-17.6 15.2-42.4 32-70.4 32-60.8 0-109.6-46.4-109.6-107.2 0-60.8 48.8-107.2 109.6-107.2 27.2 0 52.8 9.6 70.4 27.2l42.4-42.4C380.8 113.6 341.6 96 302.4 96 172 96 64 183.2 64 300c0 115.2 108 204 238.4 204 76.8 0 133.6-26.4 177.6-70.4 5.6-5.6 8.8-13.6 8.8-22.4 0-12.8-4-20.8-12.8-28.8zM488 261.8L488 261.8z"></path>
  </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        router.replace('/dashboard'); 
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      router.push('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Login Failed',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <motion.h1 
              className="font-headline text-3xl font-bold text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              HealthTrack AI
            </motion.h1>
            <CardDescription className="text-muted-foreground">
              Sign in to access your clinical dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Sign in with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground px-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
