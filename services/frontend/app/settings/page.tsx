'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { UserCircle, Settings2, Database } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Import the new tab components
import ProfileTab from '@/components/settings/tabs/ProfileTab';
import PreferencesTab from '@/components/settings/tabs/PreferencesTab';
import DatabaseDeveloperTab from '@/components/settings/tabs/DatabaseDeveloperTab';

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

  return (
    <MainLayout>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-headline text-3xl font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, preferences, and system configuration.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database & Developer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab user={user} loading={loading} />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab theme={theme || 'light'} setTheme={setTheme} mounted={mounted} />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseDeveloperTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}
