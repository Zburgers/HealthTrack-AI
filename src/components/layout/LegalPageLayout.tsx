'use client';
import React from 'react';
import { Bot } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-gray-100 font-sans">
      <motion.nav
        className="w-full bg-slate-800/80 backdrop-blur-lg z-50 border-b border-slate-700/50 sticky top-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex items-center justify-between py-5 px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Go to Homepage">
            <Bot className="text-purple-400 h-9 w-9" />
            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              HealthTrack AI
            </span>
          </Link>
        </div>
      </motion.nav>
      <main className="flex-grow container mx-auto px-6 py-8 md:py-12 pt-24 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 border border-slate-700/50"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8 text-center">
            {title}
          </h1>
          <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 prose-headings:text-purple-300 prose-a:text-pink-400 hover:prose-a:text-pink-300 prose-strong:text-gray-100">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LegalPageLayout;
