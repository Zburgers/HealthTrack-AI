
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import type { Patient } from '@/types';
import { PlusCircle, User, AlertTriangle, ShieldAlert, CalendarClock, Bed, Filter, Search, Loader2, Sparkles } from 'lucide-react';
import { parseISO, compareDesc, compareAsc } from 'date-fns';

// Helper function to get correct risk score (0-100)
const getNormalizedRiskScore = (score: number): number => {
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  if (score > 1 && score <= 100) return Math.round(score);
  if (score > 100) return 100;
  return 0;
};

const getRiskScoreColor = (score: number): string => {
  const normalizedScore = getNormalizedRiskScore(score);
  if (normalizedScore >= 70) return 'bg-red-500';
  if (normalizedScore >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getRiskScoreBorderColor = (score: number): string => {
  const normalizedScore = getNormalizedRiskScore(score);
  if (normalizedScore >= 70) return 'border-red-500';
  if (normalizedScore >= 40) return 'border-yellow-500';
  return 'border-green-500';
};

const iconComponents: { [key: string]: React.ElementType } = {
  ShieldAlert,
  CalendarClock,
  Bed,
};

const riskRanges = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'low', label: 'Low (<40%)' },
  { value: 'medium', label: 'Medium (40-69%)' },
  { value: 'high', label: 'High (>=70%)' },
];

const ageRanges = [
  { value: 'all', label: 'All Ages' },
  { value: '0-18', label: '0-18 Years' },
  { value: '19-40', label: '19-40 Years' },
  { value: '41-65', label: '41-65 Years' },
  { value: '66+', label: '66+ Years' },
];

const genderOptions = [
  { value: 'all', label: 'All Genders' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const sortOptions = [
  { value: 'lastVisitDesc', label: 'Last Visit (Newest First)' },
  { value: 'lastVisitAsc', label: 'Last Visit (Oldest First)' },
  { value: 'nameAsc', label: 'Name (A-Z)' },
  { value: 'nameDesc', label: 'Name (Z-A)' },
  { value: 'riskScoreDesc', label: 'Risk Score (High to Low)' },
  { value: 'riskScoreAsc', label: 'Risk Score (Low to High)' },
];

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    risk: 'all',
    condition: 'all',
    age: 'all',
    gender: 'all',
  });
  const [sortBy, setSortBy] = useState('lastVisitDesc');

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) {
          throw new Error('Failed to fetch patient data.');
        }
        const data = await response.json();
        setPatients(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const uniqueConditions = useMemo(() => {
    const allConditions = new Set<string>();
    patients.forEach(p => p.conditions.forEach(c => allConditions.add(c)));
    return [{ value: 'all', label: 'All Conditions' }, ...Array.from(allConditions).sort().map(c => ({ value: c, label: c }))];
  }, [patients]);

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredAndSortedPatients = useMemo(() => {
    let processedPatients = [...patients];

    if (searchTerm) {
      processedPatients = processedPatients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.conditions.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.risk !== 'all') {
      processedPatients = processedPatients.filter(p => {
        const score = getNormalizedRiskScore(p.riskScore);
        if (filters.risk === 'low') return score < 40;
        if (filters.risk === 'medium') return score >= 40 && score < 70;
        if (filters.risk === 'high') return score >= 70;
        return true;
      });
    }
    if (filters.condition !== 'all') {
      processedPatients = processedPatients.filter(p => p.conditions.includes(filters.condition));
    }
    if (filters.age !== 'all') {
      processedPatients = processedPatients.filter(p => {
        const [min, max] = filters.age.split('-').map(s => s.replace('+', ''));
        if (filters.age === '66+') return p.age >= 66;
        return p.age >= parseInt(min) && p.age <= parseInt(max);
      });
    }
    if (filters.gender !== 'all') {
      processedPatients = processedPatients.filter(p => p.gender === filters.gender);
    }

    switch (sortBy) {
      case 'lastVisitDesc':
        processedPatients.sort((a, b) => compareDesc(new Date(a.lastVisit), new Date(b.lastVisit)));
        break;
      case 'lastVisitAsc':
        processedPatients.sort((a, b) => compareAsc(new Date(a.lastVisit), new Date(b.lastVisit)));
        break;
      case 'nameAsc':
        processedPatients.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        processedPatients.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'riskScoreDesc':
        processedPatients.sort((a, b) => getNormalizedRiskScore(b.riskScore) - getNormalizedRiskScore(a.riskScore));
        break;
      case 'riskScoreAsc':
        processedPatients.sort((a, b) => getNormalizedRiskScore(a.riskScore) - getNormalizedRiskScore(b.riskScore));
        break;
    }

    return processedPatients;
  }, [patients, searchTerm, filters, sortBy]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Card className="col-span-full bg-destructive/10 border-destructive">
          <CardContent className="p-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Patients</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
          </CardContent>
        </Card>
      );
    }

    if (filteredAndSortedPatients.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedPatients.map((patient: Patient, index: number) => {
            const AlertIcon = patient.alert ? iconComponents[patient.alert.iconName] : null;
            const normalizedScore = getNormalizedRiskScore(patient.riskScore);
            return (
              <motion.div
                key={patient.id}
                {...cardAnimationProps(index * 0.05)}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 ${getRiskScoreBorderColor(patient.riskScore)} flex flex-col h-full bg-card`}>
                  <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                    <Image
                      src={patient.avatarUrl}
                      alt={patient.name}
                      width={60}
                      height={60}
                      className="rounded-full border"
                      data-ai-hint={patient.dataAiHint}
                    />                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg font-semibold text-foreground">{patient.name}</CardTitle>
                        {patient.status === 'analyzing' && (
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>AI Analysis in Progress</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</CardDescription>
                      {patient.alert && AlertIcon && (
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className={`mt-1 flex items-center text-xs ${patient.alert.colorClass}`}>
                              <AlertIcon className={`h-4 w-4 mr-1`} />
                              <span>{patient.alert.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>{patient.alert.tooltip}</p></TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardHeader>                  <CardContent className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {patient.status === 'analyzing' ? (
                          <Loader2 className="h-5 w-5 mr-1 text-blue-600 animate-spin" />
                        ) : (
                          <AlertTriangle className={`h-5 w-5 mr-1 ${getRiskScoreColor(patient.riskScore).replace('bg-', 'text-')}`} />
                        )}
                        <span className="text-sm font-medium text-foreground">Risk Score: </span>
                      </div>
                      {patient.status === 'analyzing' ? (
                        <Badge variant="outline" className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                          Analyzing...
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`px-2 py-1 text-xs ${getRiskScoreColor(patient.riskScore)} text-white`}>
                          {normalizedScore}%
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-foreground mb-1">Key Conditions:</h4>
                      <div className="flex flex-wrap gap-1">
                        {patient.conditions.slice(0, 3).map((condition) => (
                          <Badge key={condition} variant="secondary" className="text-xs bg-secondary text-secondary-foreground">{condition}</Badge>
                        ))}
                        {patient.conditions.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">+{patient.conditions.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto">
                    <Button variant="outline" size="sm" className="w-full text-primary border-primary hover:bg-primary/10" asChild>
                      <Link href={`/dashboard/patient/${patient.id}`}>View Details</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      );
    }

    return (
      <motion.div {...cardAnimationProps(0.2)}>
        <Card className="col-span-full bg-card">
          <CardContent className="p-10 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Patients Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filters.risk !== 'all' || filters.condition !== 'all' || filters.age !== 'all' || filters.gender !== 'all'
                ? "Try adjusting your search or filter criteria."
                : "Your patient database appears to be empty. Start by adding a new case."}
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/new-case"><PlusCircle className="mr-2 h-4 w-4" /> Add New Case</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="flex flex-col space-y-6">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-headline text-3xl font-bold text-primary">Patient Dashboard</h1>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/new-case">
                <PlusCircle className="mr-2 h-5 w-5" /> New Case
              </Link>
            </Button>
          </motion.div>

          <motion.div {...cardAnimationProps(0.1)}>
            <Card className="shadow-lg p-4 md:p-6 bg-secondary">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="lg:col-span-1">
                  <label htmlFor="search" className="block text-sm font-medium text-secondary-foreground mb-1">
                    <Search className="inline mr-1 h-4 w-4 text-primary" /> Search Patients
                  </label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Name or condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="lg:col-span-2 flex items-center text-sm font-medium text-secondary-foreground mb-1 md:mb-0 md:mt-6">
                  <Filter className="inline mr-2 h-4 w-4 text-primary" /> Filters & Sort
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4 items-end">
                <div>
                  <label htmlFor="filter-risk" className="block text-xs font-medium text-secondary-foreground mb-1">Risk Score</label>
                  <Select value={filters.risk} onValueChange={(value) => handleFilterChange('risk', value)}><SelectTrigger id="filter-risk"><SelectValue /></SelectTrigger><SelectContent>{riskRanges.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
                <div>
                  <label htmlFor="filter-condition" className="block text-xs font-medium text-secondary-foreground mb-1">Condition</label>
                  <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}><SelectTrigger id="filter-condition"><SelectValue /></SelectTrigger><SelectContent>{uniqueConditions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
                <div>
                  <label htmlFor="filter-age" className="block text-xs font-medium text-secondary-foreground mb-1">Age</label>
                  <Select value={filters.age} onValueChange={(value) => handleFilterChange('age', value)}><SelectTrigger id="filter-age"><SelectValue /></SelectTrigger><SelectContent>{ageRanges.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
                <div>
                  <label htmlFor="filter-gender" className="block text-xs font-medium text-secondary-foreground mb-1">Gender</label>
                  <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}><SelectTrigger id="filter-gender"><SelectValue /></SelectTrigger><SelectContent>{genderOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
                <div>
                  <label htmlFor="sort-by" className="block text-xs font-medium text-secondary-foreground mb-1">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger id="sort-by"><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
            </Card>
          </motion.div>

          {renderContent()}

        </div>
      </TooltipProvider>
    </MainLayout>
  );
}
