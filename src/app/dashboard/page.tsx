
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggerContainer, 
  staggerItem, 
  fadeInUp, 
  cardHover,
  scaleIn 
} from '@/components/ui/animations';
import type { Patient } from '@/types';
import { 
  PlusCircle, 
  User, 
  AlertTriangle, 
  ShieldAlert, 
  CalendarClock, 
  Bed, 
  Filter, 
  Search, 
  Loader2, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { parseISO, compareDesc, compareAsc, format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';

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

// Utility functions for dashboard metrics
const getPatientStats = (patients: Patient[]) => {
  const total = patients.length;
  const highRisk = patients.filter(p => getNormalizedRiskScore(p.riskScore) >= 70).length;
  const mediumRisk = patients.filter(p => getNormalizedRiskScore(p.riskScore) >= 40 && getNormalizedRiskScore(p.riskScore) < 70).length;
  const lowRisk = patients.filter(p => getNormalizedRiskScore(p.riskScore) < 40).length;
  const analyzing = patients.filter(p => p.status === 'analyzing').length;
  
  // Recent activity (this week)
  const thisWeekStart = startOfWeek(new Date());
  const thisWeekEnd = endOfWeek(new Date());
  const recentVisits = patients.filter(p => {
    const visitDate = new Date(p.lastVisit);
    return visitDate >= thisWeekStart && visitDate <= thisWeekEnd;
  }).length;
  
  const todayVisits = patients.filter(p => isToday(new Date(p.lastVisit))).length;
  
  return {
    total,
    highRisk,
    mediumRisk, 
    lowRisk,
    analyzing,
    recentVisits,
    todayVisits,
    highRiskPercentage: total > 0 ? Math.round((highRisk / total) * 100) : 0,
    averageRiskScore: total > 0 ? Math.round(patients.reduce((acc, p) => acc + getNormalizedRiskScore(p.riskScore), 0) / total) : 0
  };
};

// Dashboard metric cards component
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = "primary",
  isLoading = false,
  delay = 0 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "success" | "warning" | "danger";
  isLoading?: boolean;
  delay?: number;
}) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200", 
    danger: "text-red-600 bg-red-50 border-red-200"
  };

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      whileHover={cardHover}
      style={{ animationDelay: `${delay}s` }}
    >
      <Card hoverable className="shadow-md border-l-4 border-l-primary">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
              {trend && (
                <div className={`flex items-center space-x-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

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

  // Calculate dashboard statistics
  const stats = useMemo(() => getPatientStats(patients), [patients]);

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
        <motion.div 
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Skeleton for patient cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card className="shadow-lg">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-full rounded" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Card className="col-span-full bg-destructive/10 border-destructive">
            <CardContent className="p-10 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Patients</h3>
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
        </motion.div>
      );
    }    if (filteredAndSortedPatients.length > 0) {
      return (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredAndSortedPatients.map((patient: Patient, index: number) => {
              const AlertIcon = patient.alert ? iconComponents[patient.alert.iconName] : null;
              const normalizedScore = getNormalizedRiskScore(patient.riskScore);
              return (
                <motion.div
                  key={patient.id}
                  variants={staggerItem}
                  layout
                  whileHover={cardHover}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card hoverable className={`shadow-lg border-l-4 ${getRiskScoreBorderColor(patient.riskScore)} flex flex-col h-full bg-card group`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">                        <div className="relative">
                          {patient.avatarUrl ? (
                            <Image 
                              src={patient.avatarUrl} 
                              alt={patient.name} 
                              width={48} 
                              height={48} 
                              className="rounded-full border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          {patient.status === 'analyzing' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Sparkles className="h-2 w-2 text-white animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {patient.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{patient.age} years old</span>
                            <span>•</span>
                            <span>{patient.gender}</span>
                          </div>
                          <CardDescription className="text-xs text-muted-foreground">
                            Last Visit: {format(new Date(patient.lastVisit), 'MMM dd, yyyy')}
                          </CardDescription>
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
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {patient.status === 'analyzing' ? (
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            ) : (
                              <Activity className={`h-4 w-4 ${getRiskScoreColor(patient.riskScore).replace('bg-', 'text-')}`} />
                            )}
                            <span className="text-sm font-medium text-foreground">Risk Score</span>
                          </div>
                          {patient.status === 'analyzing' ? (
                            <Badge variant="outline" className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                              Analyzing...
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`px-2 py-1 text-xs ${getRiskScoreColor(patient.riskScore)} text-white font-medium`}>
                              {normalizedScore}%
                            </Badge>
                          )}
                        </div>
                        
                        {patient.status !== 'analyzing' && (
                          <div className="w-full">
                            <Progress 
                              value={normalizedScore} 
                              className="h-2"
                              // @ts-ignore - Custom CSS property for dynamic color
                              style={{
                                '--progress-foreground': normalizedScore >= 70 ? '#ef4444' : normalizedScore >= 40 ? '#f59e0b' : '#10b981'
                              } as React.CSSProperties}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                          Key Conditions
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {patient.conditions.slice(0, 3).map((condition) => (
                            <Badge key={condition} variant="secondary" className="text-xs bg-secondary/50 text-secondary-foreground border border-secondary/20">
                              {condition}
                            </Badge>
                          ))}
                          {patient.conditions.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-secondary/50 text-secondary-foreground border border-secondary/20">
                              +{patient.conditions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    <div className="p-6 pt-0 mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 group-hover:shadow-md" 
                        asChild
                      >
                        <Link href={`/dashboard/patient/${patient.id}`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      );
    }

    return (
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Card className="col-span-full bg-card border-dashed border-2 border-muted">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Patients Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || filters.risk !== 'all' || filters.condition !== 'all' || filters.age !== 'all' || filters.gender !== 'all'
                ? "No patients match your current search and filter criteria. Try adjusting your filters or search terms."
                : "Your patient database is empty. Start by adding your first case to begin managing patient data."}
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Link href="/new-case">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Case
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
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
                <Heart className="mr-3 h-8 w-8 text-red-500" />
                Clinical Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor patient health, track risk assessments, and manage clinical workflows
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                asChild 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/new-case">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  New Case
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Link href="/analysis">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Analytics
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Key Metrics Section */}
          <motion.div variants={staggerItem}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Key Metrics
              </h2>
              <p className="text-sm text-muted-foreground">
                Overview of your clinical practice performance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Patients"
                value={stats.total}
                subtitle="Active in system"
                icon={Users}
                color="primary"
                isLoading={isLoading}
                delay={0.1}
              />
              <MetricCard
                title="High Risk"
                value={stats.highRisk}
                subtitle={`${stats.highRiskPercentage}% of patients`}
                icon={AlertCircle}
                color="danger"
                isLoading={isLoading}
                delay={0.2}
              />
              <MetricCard
                title="Recent Visits"
                value={stats.recentVisits}
                subtitle="This week"
                icon={Clock}
                color="success"
                isLoading={isLoading}
                delay={0.3}
              />
              <MetricCard
                title="Avg Risk Score"
                value={`${stats.averageRiskScore}%`}
                subtitle="Population average"
                icon={Activity}
                color="warning"
                isLoading={isLoading}
                delay={0.4}
              />
            </div>
          </motion.div>

          {/* Search and Filters Section */}
          <motion.div variants={staggerItem}>
            <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/50 to-secondary/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center">
                        <Search className="mr-2 h-5 w-5 text-primary" />
                        Patient Search & Filters
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Find and filter patients by various criteria
                      </p>
                    </div>
                    {(searchTerm || Object.values(filters).some(f => f !== 'all')) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({
                            risk: 'all',
                            condition: 'all',
                            age: 'all',
                            gender: 'all',
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                        Search Patients
                      </label>
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search by name or condition..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                        <Filter className="mr-1 h-4 w-4 text-primary" />
                        Filters & Sorting
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <Select value={filters.risk} onValueChange={(value) => handleFilterChange('risk', value)}>
                          <SelectTrigger className="bg-background/50 border-primary/20">
                            <SelectValue placeholder="Risk Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {riskRanges.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}>
                          <SelectTrigger className="bg-background/50 border-primary/20">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueConditions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={filters.age} onValueChange={(value) => handleFilterChange('age', value)}>
                          <SelectTrigger className="bg-background/50 border-primary/20">
                            <SelectValue placeholder="Age Range" />
                          </SelectTrigger>
                          <SelectContent>
                            {ageRanges.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                          <SelectTrigger className="bg-background/50 border-primary/20">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="bg-background/50 border-primary/20">
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Summary */}
          {!isLoading && (
            <motion.div variants={staggerItem}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-foreground">Patient Records</h3>
                  <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    {filteredAndSortedPatients.length} {filteredAndSortedPatients.length === 1 ? 'patient' : 'patients'}
                  </Badge>
                </div>
                {filteredAndSortedPatients.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Updated {format(new Date(), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Patient Cards */}
          <motion.div variants={staggerItem}>
            {renderContent()}
          </motion.div>

        </motion.div>
      </TooltipProvider>
    </MainLayout>
  );
}
