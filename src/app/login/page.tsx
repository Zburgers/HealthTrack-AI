'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sky-200 font-semibold text-lg tracking-wider"
          >
            Initializing HealthTrack AI...
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
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, type: "spring", stiffness: 100 }}
              className="flex items-center justify-center lg:justify-start gap-4"
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-2xl shadow-sky-500/30"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Activity className="h-8 w-8" />
              </motion.div>
              <div>
                <h1 className="font-headline text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                  HealthTrack AI
                </h1>
                <p className="text-lg text-sky-200/80 font-medium">The Future of Clinical Intelligence</p>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
              className="text-xl text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Elevate patient care with AI-driven diagnostics, streamlined workflows, and actionable insights. Securely, efficiently, intelligently.
            </motion.p>
          </div>

          {/* Features Grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ 
              hidden: { opacity: 0 }, 
              visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.8 } }
            }}
            className="grid sm:grid-cols-2 gap-5"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-slate-800/50 backdrop-blur-md border border-sky-500/30 rounded-xl p-5 shadow-lg hover:shadow-sky-500/20 hover:border-sky-400 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex-shrink-0 shadow-md">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-md text-sky-300">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-normal">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 0.4 }}
          className="flex items-center justify-center lg:justify-end"
        >
          <Card className="w-full max-w-md shadow-2xl shadow-indigo-500/30 border-0 bg-slate-800/60 backdrop-blur-lg rounded-2xl overflow-hidden">
            <CardHeader className="text-center space-y-6 p-8 bg-gradient-to-br from-sky-600/20 to-indigo-700/20">
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.6, type: "spring", stiffness: 150 }}
                className="space-y-3"
              >
                <div className="flex justify-center">
                  <motion.div 
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/40"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(56, 189, 248, 0.6)" }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <ShieldCheck className="h-10 w-10" />
                  </motion.div>
                </div>
                <CardTitle className="font-headline text-3xl font-bold text-sky-100">
                  Secure Access
                </CardTitle>
                <CardDescription className="text-slate-300 text-base">
                  Sign in to unlock the power of AI in your clinical practice.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
              >
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full group bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 hover:from-sky-400 hover:via-cyan-400 hover:to-indigo-500 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-sky-500/40 transition-all duration-300 transform hover:-translate-y-1 rounded-xl focus:ring-4 focus:ring-sky-400/50 focus:outline-none"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                      >
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Authenticating...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                      >
                        <GoogleIcon />
                        Sign In with Google
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="text-center"
              >
                <p className="text-xs text-slate-400/80">
                  Powered by cutting-edge AI & secure infrastructure.
                </p>
              </motion.div>
            </CardContent>
            <CardFooter className="p-6 bg-slate-800/30 border-t border-sky-500/20">
                <div className="text-center w-full space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By signing in, you agree to our <a href="/terms" className="underline hover:text-sky-300">Terms of Service</a> and <a href="/privacy" className="underline hover:text-sky-300">Privacy Policy</a>. 
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>HIPAA Compliant • SOC 2 Certified Platform</span>
                  </div>
                </div>
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
