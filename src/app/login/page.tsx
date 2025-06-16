'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
// Import the getter functions, not the instances directly
import { getFirebaseAuth, getGoogleAuthProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ShieldCheck, Users, Activity, Zap, BarChart3, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Google Icon
const GoogleIcon = () => (
  <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 381.7 512 244 512 113.3 512 0 398.7 0 261.8S113.3 11.6 244 11.6C304.8 11.6 356.8 33.5 397.6 68.8L341.6 124.8C316.8 102.4 283.2 89.6 244 89.6 169.6 89.6 109.6 149.6 109.6 224C109.6 298.4 169.6 358.4 244 358.4c52 0 87.2-20.8 106.4-40L376 318.4c-17.6 15.2-42.4 32-70.4 32-60.8 0-109.6-46.4-109.6-107.2 0-60.8 48.8-107.2 109.6-107.2 27.2 0 52.8 9.6 70.4 27.2l42.4-42.4C380.8 113.6 341.6 96 302.4 96 172 96 64 183.2 64 300c0 115.2 108 204 238.4 204 76.8 0 133.6-26.4 177.6-70.4 5.6-5.6 8.8-13.6 8.8-22.4 0-12.8-4-20.8-12.8-28.8zM488 261.8L488 261.8z"></path>
  </svg>
);

// Feature highlights
const features = [
  {
    icon: Brain,
    title: "AI-Driven Insights",
    description: "Unlock deep clinical understanding with our cutting-edge AI analysis."
  },
  {
    icon: Zap,
    title: "Rapid ICD-10 Coding",
    description: "Automate and accelerate your coding process with unparalleled accuracy."
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Interactive charts and dashboards for comprehensive patient overview."
  },
  {
    icon: ShieldCheck,
    title: "Fortified Security",
    description: "HIPAA-compliant platform ensuring utmost data privacy and protection."
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Get Firebase auth instance here, inside useEffect
    const authInstance = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user: FirebaseUser | null) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]); // router is a dependency

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Get Firebase instances here, inside the event handler
    const authInstance = getFirebaseAuth();
    const googleProviderInstance = getGoogleAuthProvider();
    try {
      await signInWithPopup(authInstance, googleProviderInstance);
      toast({
        title: 'Welcome to HealthTrack AI',
        description: 'Login successful! Preparing your intelligent dashboard...',
        duration: 5000,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Authentication Error',
        description: (error as Error).message || 'Sign-in failed. Please try again or contact support.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
          className="text-center space-y-6 p-8 bg-slate-700/30 rounded-xl shadow-2xl"
        >
          <motion.div
            animate={{ rotateY: [0, 360, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <Activity className="h-16 w-16 text-sky-400 mx-auto" />
          </motion.div>
          <motion.p 
            className="text-xl font-semibold text-sky-300"
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            transition={{ delay: 0.3, duration: 0.5}}
          >
            Authenticating your session...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated background shapes */}
      <motion.div 
        className="absolute top-0 left-0 w-72 h-72 bg-sky-500/30 rounded-full filter blur-3xl opacity-70 animate-pulse-slow"
        initial={{ x: -100, y: -100, scale: 0.8}}
        animate={{ x: Math.random() * 200 - 100, y: Math.random() * 200 - 100, scale: [0.8, 1.2, 0.8]}}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror"}}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full filter blur-3xl opacity-60 animate-pulse-slower"
        initial={{ x: 100, y: 100, scale: 0.9}}
        animate={{ x: Math.random() * 200 - 100, y: Math.random() * 200 - 100, scale: [0.9, 1.1, 0.9]}}
        transition={{ duration: 25, repeat: Infinity, repeatType: "mirror"}}
      />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
          className="space-y-10 text-center lg:text-left"
        >
          <div className="inline-flex items-center space-x-3 bg-sky-500/20 text-sky-300 px-4 py-2 rounded-full text-sm font-medium shadow-md border border-sky-500/30">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span>Next-Gen Clinical Intelligence</span>
          </div>

          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Welcome to <span className="text-sky-400">HealthTrack</span> AI
          </h1>
          <p className="text-lg md:text-xl text-slate-300/90 max-w-xl mx-auto lg:mx-0">
            Empowering healthcare professionals with AI-driven insights for superior patient care, 
            streamlined ICD-10 coding, and comprehensive clinical analysis.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {features.slice(0, 2).map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700/80 hover:shadow-sky-500/20 transition-shadow"
              >
                <feature.icon className="h-8 w-8 text-sky-400 mb-3" />
                <h3 className="text-lg font-semibold text-sky-300 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400/80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 0.4 }}
          className="flex items-center justify-center lg:justify-end"
        >
          <Card className="w-full max-w-md bg-slate-800/60 backdrop-blur-md border-slate-700/70 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="text-center pt-8 pb-6">
              <motion.div 
                className="inline-block mb-4"
                initial={{ scale: 0 }} animate={{ scale: 1}} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6}}
              >
                <Users className="h-16 w-16 text-sky-400 p-3 bg-sky-500/20 rounded-full" />
              </motion.div>
              <CardTitle className="text-3xl font-bold font-headline text-sky-300">Access Your Dashboard</CardTitle>
              <CardDescription className="text-slate-400/80 pt-2">
                Sign in to unlock AI-powered clinical decision support.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white text-lg font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out group transform hover:scale-105 focus:ring-4 focus:ring-sky-400/50"
              >
                {isLoading ? (
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {isLoading ? 'Authenticating...' : 'Sign In with Google'}
              </Button>
              <p className="text-xs text-slate-500/70 text-center px-4">
                By signing in, you agree to our 
                <a href="/terms-of-service" className="underline hover:text-sky-400 transition-colors"> Terms of Service </a> 
                and 
                <a href="/privacy-policy" className="underline hover:text-sky-400 transition-colors"> Privacy Policy</a>.
              </p>
            </CardContent>
            <CardFooter className="bg-slate-700/30 px-8 py-5 border-t border-slate-700/50">
              <p className="text-xs text-slate-400/80 text-center w-full">
                Need help? <a href="/contact-us" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">Contact Support</a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Footer copyright - subtle */}
      <motion.div 
        className="absolute bottom-6 text-center w-full z-0"
        initial={{ opacity: 0, y: 20}}
        animate={{ opacity: 1, y: 0}}
        transition={{ delay: 1.5, duration: 0.8, ease: "easeOut"}}
      >
        <p className="text-xs text-slate-500/70">
          &copy; {new Date().getFullYear()} HealthTrack AI. All rights reserved. Revolutionizing Healthcare with AI.
        </p>
      </motion.div>
    </div>  
  );
}
