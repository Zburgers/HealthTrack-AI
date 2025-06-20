'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientAvatar } from '@/components/ui/patient-avatar';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggerContainer, 
  staggerItem, 
  fadeInUp, 
  cardHover 
} from '@/components/ui/animations';
import type { Patient } from '@/types';
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  Search, 
  Loader2, 
  Clock,
  Users,
  Info,
  User,
  Calendar,
  MessageSquare,
  Archive
} from 'lucide-react';
import { parseISO, format, formatDistanceToNow } from 'date-fns';

// Helper function to format deletion date
const formatDeletionDate = (dateInput?: string | Date) => {
  if (!dateInput) return 'Unknown';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, 'MMM dd, yyyy at h:mm a');
  } catch {
    return 'Invalid date';
  }
};

// Helper function to get time since deletion
const getTimeSinceDeletion = (dateInput?: string | Date) => {
  if (!dateInput) return 'Unknown time ago';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time ago';
  }
};

// Archive patient card component
const ArchivedPatientCard = ({ patient, delay = 0 }: { patient: Patient; delay?: number }) => {
  const riskScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const riskScoreLabel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';  
    return 'Low Risk';
  };
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={cardHover}
    >
      <Card className="shadow-md border border-gray-200 bg-gray-50/50 relative overflow-hidden">
        {/* Archive indicator */}
        <div className="absolute top-0 right-0 bg-gray-600 text-white px-2 py-1 text-xs font-medium">
          <Archive className="inline h-3 w-3 mr-1" />
          ARCHIVED
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <PatientAvatar 
                name={patient.name} 
                avatarUrl={patient.avatarUrl}
                className="h-12 w-12 opacity-75"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 truncate">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {patient.age} years • {patient.gender}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`${riskScoreColor(patient.riskScore)} text-white text-xs px-2 py-1`}
                      >
                        {riskScoreLabel(patient.riskScore)} ({patient.riskScore}%)
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {patient.status || 'draft'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                {patient.conditions && patient.conditions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Conditions:</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.conditions.slice(0, 3).map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-white">
                          {condition}
                        </Badge>
                      ))}
                      {patient.conditions.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white">
                          +{patient.conditions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Archive Information */}
                <div className="mt-4 p-3 bg-gray-100 rounded-lg border">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Archived:</span>
                          <p className="text-gray-600">
                            {getTimeSinceDeletion(patient.deletedAt)}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatDeletionDate(patient.deletedAt)}
                          </p>
                        </div>
                        {patient.deletedBy && (
                          <div>
                            <span className="font-medium text-gray-700">By:</span>
                            <p className="text-gray-600">{patient.deletedBy}</p>
                          </div>
                        )}
                      </div>
                      
                      {patient.deletionReason && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Reason:</span>
                          <p className="text-gray-600 text-sm italic break-words">
                            "{patient.deletionReason}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last visit info */}
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last visit: {format(new Date(patient.lastVisit), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Loading skeleton for archived patients
const ArchivedPatientSkeleton = () => (
  <Card className="shadow-md border border-gray-200 bg-gray-50/50">
    <CardContent className="p-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex space-x-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-16 w-full mt-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ArchivedPatientsPage() {
  const [archivedPatients, setArchivedPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch archived patients
  useEffect(() => {
    const fetchArchivedPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/patients?archivedOnly=true');
        if (!response.ok) {
          throw new Error('Failed to fetch archived patient data.');
        }
        const data = await response.json();
        setArchivedPatients(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedPatients();
  }, []);

  // Filter archived patients by search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return archivedPatients;
    
    const term = searchTerm.toLowerCase();
    return archivedPatients.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.conditions.some(condition => condition.toLowerCase().includes(term)) ||
      patient.deletionReason?.toLowerCase().includes(term) ||
      patient.deletedBy?.toLowerCase().includes(term)
    );
  }, [archivedPatients, searchTerm]);

  return (
    <MainLayout>
      <TooltipProvider>
        <motion.div 
          className="flex flex-col space-y-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Header Section */}
          <motion.div 
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
            variants={staggerItem}
          >
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
                <Archive className="mr-3 h-8 w-8" />
                Archived Patients
              </h1>
              <p className="text-muted-foreground">
                View and manage patient cases that have been archived.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Link>
            </Button>
          </motion.div>

          {/* Search Section */}
          <motion.div variants={staggerItem}>
            <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/50 to-secondary/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="max-w-md">
                  <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                    Search Archived Patients
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by name, condition, reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-background/50 border-primary/20 focus:border-primary pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Summary */}
          {!isLoading && (
            <motion.div variants={staggerItem}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'Archived Record' : 'Archived Records'}
                </h3>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <motion.div variants={staggerItem}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <ArchivedPatientSkeleton key={i} />)}
              </div>
            ) : error ? (
              <Card className="col-span-full bg-destructive/10 border-destructive">
                <CardContent className="p-10 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h3>
                  <p className="text-destructive/80 mb-4">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient, i) => (
                  <ArchivedPatientCard key={patient.id} patient={patient} delay={i * 0.1} />
                ))}
              </div>
            ) : (
              <Card className="col-span-full bg-card border-dashed border-2 border-muted">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">No Archived Patients Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm
                      ? "No archived patients match your search term."
                      : "There are currently no archived patient records."}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>
      </TooltipProvider>
    </MainLayout>
  );
}
