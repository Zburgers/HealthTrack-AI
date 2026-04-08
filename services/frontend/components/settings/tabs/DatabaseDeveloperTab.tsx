'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { motion } from 'framer-motion';

// Import the individual panels
import DatabaseConnectionCard from '@/components/settings/database/DatabaseConnectionCard';
import QueryTesterPanel from '@/components/settings/database/QueryTesterPanel';
import DataManagementPanel from '@/components/settings/database/DataManagementPanel';

const DatabaseDeveloperTab: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Database Connection - Always Visible */}
      <DatabaseConnectionCard />
      
      {/* Advanced Developer Tools - Collapsible */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Code className="mr-2 h-5 w-5" /> Advanced Developer Tools
          </CardTitle>
          <CardDescription>
            Advanced tools for developers and system administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Query Tester */}
          <QueryTesterPanel />
          
          {/* Data Management */}
          <DataManagementPanel />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DatabaseDeveloperTab;
