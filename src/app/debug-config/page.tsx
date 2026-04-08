'use client';

import { clerkConfig } from '@/config';

export default function DebugConfigPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configuration Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Clerk Config:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            publishableKey: clerkConfig.publishableKey ? `${clerkConfig.publishableKey.substring(0, 20)}...` : 'MISSING',
            signInUrl: clerkConfig.signInUrl || '/login',
            signUpUrl: clerkConfig.signUpUrl || '/signup',
          }, null, 2)}
        </pre>

        <h2 className="text-lg font-semibold mb-2 mt-4">Environment Variables (Client-side):</h2>
        <pre className="text-sm">
          {JSON.stringify({
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...` : 'MISSING',
            NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
