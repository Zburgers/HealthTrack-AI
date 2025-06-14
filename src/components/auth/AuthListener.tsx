'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Shield, ShieldCheck } from 'lucide-react';

const AuthListener = () => {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/login', '/'];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect yet
    
    if (!user && !isPublicPath) {
      // User not authenticated and trying to access protected route
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/')) {
      // User is authenticated and on login/home page, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname, isPublicPath]);

  // Show loading state with enhanced UI
  if (loading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 p-8 bg-background/90 backdrop-blur-sm rounded-2xl border shadow-2xl"
          >
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/30"
              />
            </div>
            
            <div className="text-center space-y-2">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-semibold text-foreground"
              >
                Authenticating
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground"
              >
                Verifying your credentials...
              </motion.p>
            </div>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full w-32"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show error state if authentication fails
  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 p-8 bg-background/90 backdrop-blur-sm rounded-2xl border shadow-2xl max-w-md mx-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-400/10 ring-1 ring-red-500/20">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Authentication Error
              </h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'Failed to authenticate. Please try again.'}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Retry
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show success state briefly when authentication succeeds
  if (user && !isPublicPath) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg backdrop-blur-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-green-800">Authenticated</div>
              <div className="text-green-600">Welcome back!</div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default AuthListener;
