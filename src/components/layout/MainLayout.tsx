'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from './Header';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

const loadingMessages = [
  "Checking vitals...",
  "Consulting with the AI...",
  "Polishing the stethoscopes...",
  "Brewing coffee for the late shift...",
  "Finding the best differential diagnoses...",
  "Making sure the data is HIPAA-compliant...",
  "Warming up the AI brain...",
  "Analyzing symptoms with machine learning magic...",
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 2500); // Change message every 2.5 seconds
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <AnimatePresence mode="wait">
          <motion.h4
            key={messageIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-muted-foreground font-semibold"
          >
            {loadingMessages[messageIndex]}
          </motion.h4>
        </AnimatePresence>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return null; // Or a message indicating redirection
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} HealthTrack AI. All rights reserved.
      </footer>
    </div>
  );
}
