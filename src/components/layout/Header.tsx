'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const auth = getFirebaseAuth(); // Initialize auth here

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-background/40 backdrop-blur-lg border-b border-border/30 sticky top-0 z-50 shadow-lg ring-1 ring-black/5 font-body">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
            <path d="M20.29 8.29A5.55 5.55 0 0 0 16.5 3.5H9A5.5 5.5 0 0 0 3.5 9v7.5A5.55 5.55 0 0 0 8.29 20.29L12 22l3.71-1.71A5.55 5.55 0 0 0 20.5 16.5V9a5.5 5.5 0 0 0-0.21-0.71z"></path>
            <path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path>
            <path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path>
          </svg>
          <span className="font-headline text-2xl font-bold text-foreground tracking-tight">
            HealthTrack
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback className="font-medium">{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 bg-card border-border shadow-lg rounded-lg mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">{user.displayName || 'User Name'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border"/>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="px-3 py-2 text-sm hover:bg-muted focus:bg-muted cursor-pointer flex items-center text-foreground">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="px-3 py-2 text-sm hover:bg-muted focus:bg-muted cursor-pointer flex items-center text-red-500 hover:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/login')} variant="default" size="lg" className="font-medium">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
