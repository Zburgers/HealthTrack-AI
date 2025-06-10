import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AuthListener from '@/components/auth/AuthListener';
import { AppStateProvider } from '@/context/AppStateContext';

export const metadata: Metadata = {
  title: 'HealthTrack AI',
  description: 'AI-Powered Clinical Decision Support',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthListener />
        <AppStateProvider>
          {children}
        </AppStateProvider>
        <Toaster />
      </body>
    </html>
  );
}
