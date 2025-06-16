'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { UserCircle, Bell, ShieldCheck, Edit3, Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <MainLayout>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-headline text-3xl font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and application preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="md:col-span-1" {...cardAnimationProps(0.1)}>
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center pb-4 bg-secondary/30 rounded-t-lg">
              {loading ? (
                <Skeleton className="h-24 w-24 rounded-full" />
              ) : (
                <Avatar className="h-24 w-24 border-4 border-primary/50">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                  <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                    {getInitials(user?.displayName)}
                  </AvatarFallback>
                </Avatar>
              )}
            </CardHeader>
            <CardContent className="text-center pt-4">
              {loading ? (
                <>
                  <Skeleton className="h-6 w-3/4 mx-auto mb-1" />
                  <Skeleton className="h-4 w-full mx-auto" />
                </>
              ) : (
                <>
                  <CardTitle className="font-headline text-xl text-foreground">
                    {user?.displayName || 'Anonymous User'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">{user?.email}</CardDescription>
                </>
              )}
              <Button variant="outline" className="mt-4 w-full" disabled>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Soon)
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="md:col-span-2 space-y-6">
          <motion.div {...cardAnimationProps(0.2)}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center text-primary">
                  <UserCircle className="mr-2 h-5 w-5" /> Preferences
                </CardTitle>
                <CardDescription>Customize your application experience.</CardDescription>
              </CardHeader>
              <CardContent>
                {mounted ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="theme-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    />
                    <Label htmlFor="theme-mode" className="flex items-center">
                      {theme === 'dark' ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                  </div>
                ) : (
                  <Skeleton className="h-8 w-32" /> /* Skeleton for theme switcher */
                )}
                <p className="text-muted-foreground mt-4">Other notification preferences and display options will be available here soon.</p>
                 <Button variant="ghost" className="mt-3 text-primary hover:bg-primary/10" disabled>Adjust More Preferences (Soon)</Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...cardAnimationProps(0.3)}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center text-primary">
                  <ShieldCheck className="mr-2 h-5 w-5" /> Account & Security
                </CardTitle>
                <CardDescription>Manage your account details and security settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Options for password changes (if applicable), two-factor authentication, and viewing login activity will be available here in the future.</p>
                <Button variant="ghost" className="mt-3 text-primary hover:bg-primary/10" disabled>Manage Account</Button>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div {...cardAnimationProps(0.4)}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center text-primary">
                  <Bell className="mr-2 h-5 w-5" /> Notifications
                </CardTitle>
                <CardDescription>Configure how you receive notifications from HealthTrack AI.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Detailed notification settings for different types of alerts and updates will appear here soon. You'll be able to choose between email, in-app, or push notifications.</p>
                 <Button variant="ghost" className="mt-3 text-primary hover:bg-primary/10" disabled>Configure Notifications</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
