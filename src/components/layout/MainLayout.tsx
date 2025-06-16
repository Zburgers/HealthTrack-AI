'use client';
import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import { Sidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { AppStateProvider } from '@/context/AppStateContext';
import { pageTransition, fadeIn } from '@/components/ui/animations';
import { LayoutDashboard, FilePlus2, BarChart2, Settings, Palette } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/new-case', label: 'New Case', icon: FilePlus2 },
    { href: '/analysis', label: 'Analysis', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/test-styles', label: 'Test Styles', icon: Palette },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center h-screen bg-background text-foreground"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-primary/40 animate-pulse"></div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      return null;
    }
    return (
      <AppStateProvider>
        <AnimatePresence mode="wait">
          <motion.div 
            key="unauthenticated"
            className="bg-background text-foreground min-h-screen"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
            <Toaster />
          </motion.div>
        </AnimatePresence>
      </AppStateProvider>
    );
  }

  return (
    <AppStateProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <Header />
        <div className="flex flex-1 pt-16">
          <Sidebar
            navItems={navItems}
            className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 hidden md:block z-30 bg-card text-card-foreground border-r border-border shadow-lg"
          />
          <main className="flex-1 md:ml-64 overflow-y-auto bg-app-background" role="main" aria-label="Main content">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                variants={pageTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                className="p-4 sm:p-6 lg:p-8 min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <Toaster />
      </div>
    </AppStateProvider>
  );
}
