'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Moon, Sun, Settings2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreferencesTabProps {
  theme: string;
  setTheme: (theme: string) => void;
  mounted: boolean;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({ theme, setTheme, mounted }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Appearance Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Settings2 className="mr-2 h-5 w-5" /> Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of HealthTrack AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Theme Mode</Label>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            {mounted ? (
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  id="theme-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
                <Moon className="h-4 w-4" />
              </div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Bell className="mr-2 h-5 w-5" /> Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications from HealthTrack AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Detailed notification settings for different types of alerts and updates will appear here soon. 
            You'll be able to choose between email, in-app, or push notifications.
          </p>
          
          {/* Future notification options */}
          <div className="space-y-3 opacity-50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Patient Updates</Label>
                <p className="text-xs text-muted-foreground">Get notified about patient status changes</p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Appointment Reminders</Label>
                <p className="text-xs text-muted-foreground">Receive reminders for upcoming appointments</p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">System Alerts</Label>
                <p className="text-xs text-muted-foreground">Important system and security notifications</p>
              </div>
              <Switch disabled />
            </div>
          </div>
          
          <Button variant="ghost" className="mt-4 text-primary hover:bg-primary/10" disabled>
            <Bell className="mr-2 h-4 w-4" />
            Configure Notifications (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Language & Localization */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Globe className="mr-2 h-5 w-5" /> Language & Region
          </CardTitle>
          <CardDescription>Set your language and regional preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Language selection, date formats, and currency preferences will be available here in the future.
          </p>
          <Button variant="ghost" className="text-primary hover:bg-primary/10" disabled>
            <Globe className="mr-2 h-4 w-4" />
            Language Settings (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PreferencesTab;
