'use client';
import React from 'react';
import Link from 'next/link';

const CommonFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900/50 border-t border-slate-700/50 mt-12 md:mt-20">
      <div className="container mx-auto py-10 px-6 text-center text-gray-400">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6 text-sm">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-purple-400 transition-colors">
            About Us
          </Link>
          <Link href="/privacy-policy" className="hover:text-purple-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:text-purple-400 transition-colors">
            Terms of Service
          </Link>
          <Link href="/contact-us" className="hover:text-purple-400 transition-colors">
            Contact Us
          </Link>
          <Link href="/citations" className="hover:text-purple-400 transition-colors">
            Citations
          </Link>
        </div>
        <p className="text-xs text-gray-500">
          &copy; {currentYear} HealthTrack AI. All rights reserved.
          <span className="block sm:inline mt-1 sm:mt-0">Revolutionizing healthcare, one insight at a time.</span>
        </p>
      </div>
    </footer>
  );
};

export default CommonFooter;
