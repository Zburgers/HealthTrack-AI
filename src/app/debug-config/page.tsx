'use client';

import { firebaseConfig } from '@/config';

export default function DebugConfigPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Configuration Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Firebase Config:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 8)}...` : 'MISSING',
            authDomain: firebaseConfig.authDomain || 'MISSING',
            projectId: firebaseConfig.projectId || 'MISSING',
            storageBucket: firebaseConfig.storageBucket || 'MISSING',
            messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
            appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 8)}...` : 'MISSING',
            measurementId: firebaseConfig.measurementId || 'MISSING',
          }, null, 2)}
        </pre>
        
        <h2 className="text-lg font-semibold mb-2 mt-4">Environment Variables (Client-side):</h2>
        <pre className="text-sm">
          {JSON.stringify({
            NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 8)}...` : 'MISSING',
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
            NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 8)}...` : 'MISSING',
            NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'MISSING',
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
