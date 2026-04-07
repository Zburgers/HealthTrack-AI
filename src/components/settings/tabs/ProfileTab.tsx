'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Edit3, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileTabProps {
  user: any;
  loading: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, loading }) => {
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Information */}
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
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Account & Security */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <ShieldCheck className="mr-2 h-5 w-5" /> Account & Security
          </CardTitle>
          <CardDescription>Manage your account details and security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Options for password changes, two-factor authentication, and viewing login activity will be available here in the future.
          </p>
          <Button variant="ghost" className="text-primary hover:bg-primary/10" disabled>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Manage Security Settings (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileTab;
