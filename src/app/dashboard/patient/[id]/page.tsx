'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import type { Patient, VitalDisplayInfo, ICD10Code } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/context/AppStateContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { TreatmentTimelineView } from '@/components/results/TreatmentTimelineView';

import {
  ArrowLeft,
  UserCircle,
  Activity,
  ClipboardList,
  Brain,
  Stethoscope,
  Thermometer,
  HeartPulse,
  Wind,
  Gauge,
  Percent,
  AlertTriangle,
  BarChart3,
  InfoIcon, 
  BriefcaseMedical,
  Loader2,
  RefreshCw,
  Sparkles,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  History,
  TrendingUp,
  Shield,
  Copy,
  Edit,
  Pill,
  Clock
} from 'lucide-react';

const getRiskScoreColor = (score: number): string => {
  if (score >= 0 && score <= 1) score *= 100; 
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

const getRiskScoreBgColor = (score: number): string => {
  if (score >= 0 && score <= 1) score *= 100; 
  if (score >= 70) return 'bg-red-50 border-red-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
};

const vitalKeyToDisplayInfo: Record<string, { label: string; icon: React.ElementType; unit?: string; normal?: string }> = {
  bp: { label: 'Blood Pressure', icon: Gauge, unit: 'mmHg', normal: '<120/80' },
  hr: { label: 'Heart Rate', icon: HeartPulse, unit: 'bpm', normal: '60-100' },
  rr: { label: 'Respiratory Rate', icon: Wind, unit: '/min', normal: '12-20' },
  temp: { label: 'Temperature', icon: Thermometer, unit: '°C', normal: '36.1-37.2' },
  spo2: { label: 'SpO2', icon: Percent, unit: '%', normal: '95-100' },
};

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" }
});

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { setAnalysisResult } = useAppState();
  const patientId = typeof params.id === 'string' ? params.id : undefined;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isIcd10ModalOpen, setIsIcd10ModalOpen] = useState(false);
  const [selectedIcd10Code, setSelectedIcd10Code] = useState<ICD10Code | null>(null);

  const fetchPatientDetails = useCallback(async () => {
    if (!patientId) {
      setError("No patient ID provided.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patient details.');
      }
      const data = await response.json();
      setPatient(data);
      setIsAnalyzing(data.status === 'analyzing');
      return data;
    } catch (e) {
      setError((e as Error).message);
      setIsAnalyzing(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  // Auto-refresh when patient is in analyzing state
  useEffect(() => {
    if (!isAnalyzing || !patientId) return;

    const pollInterval = setInterval(async () => {
      setPollCount(prev => prev + 1);
      const updatedPatient = await fetchPatientDetails();
      
      // Stop polling if analysis is complete or failed, or after 20 attempts (2 minutes)
      if (updatedPatient && (updatedPatient.status === 'complete' || updatedPatient.status === 'analysis_failed')) {
        setIsAnalyzing(false);
        clearInterval(pollInterval);
      } else if (pollCount >= 20) {
        setIsAnalyzing(false);
        clearInterval(pollInterval);
      }
    }, 6000); // Poll every 6 seconds

    return () => clearInterval(pollInterval);
  }, [isAnalyzing, patientId, fetchPatientDetails, pollCount]);
  const handleViewFullAnalysis = () => {
    if (patient?.aiAnalysis) {
      // Set a temporary loading state first before pushing to analysis page
      setAnalysisResult(null, `/dashboard/patient/${patient.id}`, patient);
      router.push('/analysis');
    }
  };

  const handleIcd10CodeClick = (code: ICD10Code) => {
    setSelectedIcd10Code(code);
    setIsIcd10ModalOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <motion.div 
          className="flex flex-col items-center justify-center py-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AlertTriangle className="w-24 h-24 text-destructive mb-4" />
          <h1 className="font-headline text-3xl font-bold text-destructive mb-2">An Error Occurred</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </motion.div>
      </MainLayout>
    );
  }

  if (!patient) {
    return (
      <MainLayout>
        <motion.div 
          className="flex flex-col items-center justify-center py-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <UserCircle className="w-24 h-24 text-muted-foreground mb-4" />
          <h1 className="font-headline text-3xl font-bold text-destructive mb-2">Patient Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The patient you are looking for does not exist or the ID is incorrect.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </motion.div>
      </MainLayout>
    );
  }
    const patientRiskScore = patient.aiAnalysis?.riskScore ?? patient.riskScore;
  const normalizedPatientRiskScore = (patientRiskScore >= 0 && patientRiskScore <=1 ) ? patientRiskScore * 100 : patientRiskScore;

  // Show analyzing state banner
  const renderAnalyzingBanner = () => {
    if (!isAnalyzing) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-lg">AI Analysis in Progress</h3>
            <p className="text-blue-700 text-sm">
              Our AI is analyzing the patient's condition and generating insights. This usually takes 30-60 seconds.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              Analyzing...
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Show analysis failed state
  const renderAnalysisFailedBanner = () => {
    if (patient?.status !== 'analysis_failed') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-lg">Analysis Failed</h3>
            <p className="text-red-700 text-sm">
              The AI analysis could not be completed. Please try refreshing the page or contact support.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>      <TooltipProvider>
        <div className="space-y-6">
          {renderAnalyzingBanner()}
          {renderAnalysisFailedBanner()}
          
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="font-headline text-3xl font-bold text-primary truncate max-w-md">{patient.name} - Details</h1>
            <Button onClick={handleViewFullAnalysis} disabled={!patient.aiAnalysis}>
              <BarChart3 className="mr-2 h-4 w-4" /> View Full AI Analysis
            </Button>
          </motion.div>

          <motion.div {...cardAnimationProps(0.1)}>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-start space-x-4">
                <Image
                  src={patient.avatarUrl}
                  alt={patient.name}
                  width={100}
                  height={100}
                  className="rounded-lg border"
                  data-ai-hint={patient.dataAiHint}
                />
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-2xl font-headline text-foreground">{patient.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Patient ID: {patient.id}
                  </CardDescription>
                  <CardDescription className="text-sm text-muted-foreground">
                    {patient.age} years old {patient.gender}
                  </CardDescription>                  <p className="text-sm text-muted-foreground">Last Visit: {format(new Date(patient.lastVisit), "PPP")}</p>                  <div className="flex items-center pt-1">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-1.5 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-foreground">Risk Score: </span>
                        <span className="ml-1 font-bold text-lg text-blue-600 animate-pulse">
                          Analyzing...
                        </span>
                      </>
                    ) : patient.status === 'analysis_failed' ? (
                      <>
                        <AlertTriangle className="h-5 w-5 mr-1.5 text-red-600" />
                        <span className="text-sm font-medium text-foreground">Risk Score: </span>
                        <span className="ml-1 font-bold text-lg text-red-600">
                          Analysis Failed
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className={`h-5 w-5 mr-1.5 ${getRiskScoreColor(normalizedPatientRiskScore)}`} />
                        <span className="text-sm font-medium text-foreground">Risk Score: </span>
                        <span className={`ml-1 font-bold text-lg ${getRiskScoreColor(normalizedPatientRiskScore)}`}>
                          {normalizedPatientRiskScore.toFixed(0)}%
                        </span>
                      </>
                    )}
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-1 h-6 w-6 text-muted-foreground hover:text-primary">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm p-3 bg-popover text-popover-foreground shadow-lg rounded-md border">
                        <p className="font-semibold text-primary mb-1">Risk Score Reasoning (Example)</p>
                        {isAnalyzing ? (
                          <p>AI is currently analyzing the patient's condition to calculate risk score.</p>
                        ) : (
                          <>
                            <p>Risk score is influenced by factors such as: {patient.conditions.join(', ') || 'N/A'}, and primary complaint: "{patient.primaryComplaint || 'N/A'}".</p>
                            <p className="mt-1 italic">A detailed AI-generated explanation can be found in the full analysis.</p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-foreground">Primary Complaint:</h4>
                    <p className="text-muted-foreground">{patient.primaryComplaint}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Key Conditions:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {patient.conditions.map((condition) => (
                        <Badge key={condition} variant="secondary" className="bg-secondary text-secondary-foreground">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="grid grid-cols-5 gap-2">
              <TabsTrigger value="overview" onClick={() => setActiveTab('overview')} className={cn("flex-1 text-center", activeTab === 'overview' ? 'bg-primary text-primary-foreground' : '')}>
                <User className="mr-2 h-4 w-4 inline-block" /> Overview
              </TabsTrigger>
              <TabsTrigger value="medicalHistory" onClick={() => setActiveTab('medicalHistory')} className={cn("flex-1 text-center", activeTab === 'medicalHistory' ? 'bg-primary text-primary-foreground' : '')}>
                <Shield className="mr-2 h-4 w-4 inline-block" /> Medical History
              </TabsTrigger>
              <TabsTrigger value="vitals" onClick={() => setActiveTab('vitals')} className={cn("flex-1 text-center", activeTab === 'vitals' ? 'bg-primary text-primary-foreground' : '')}>
                <HeartPulse className="mr-2 h-4 w-4 inline-block" /> Vitals
              </TabsTrigger>
              <TabsTrigger value="observations" onClick={() => setActiveTab('observations')} className={cn("flex-1 text-center", activeTab === 'observations' ? 'bg-primary text-primary-foreground' : '')}>
                <FileText className="mr-2 h-4 w-4 inline-block" /> Doctor's Notes
              </TabsTrigger>
              <TabsTrigger value="aiAnalysis" onClick={() => setActiveTab('aiAnalysis')} className={cn("flex-1 text-center", activeTab === 'aiAnalysis' ? 'bg-primary text-primary-foreground' : '')} disabled={!patient.aiAnalysis}>
                <Brain className="mr-2 h-4 w-4 inline-block" /> AI Insights
              </TabsTrigger>
            </TabsList>
            <Separator />
              <TabsContent value="overview">
              <motion.div {...cardAnimationProps(0.2)}>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Patient Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Demographics</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Age:</span>
                            <span className="ml-2 font-medium">{patient.age} years old</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="ml-2 font-medium">{patient.gender}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last Visit:</span>
                            <span className="ml-2 font-medium">{format(new Date(patient.lastVisit), "PPP")}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Clinical Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className="ml-2">
                              {patient.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm">
                            <AlertTriangle className={`mr-2 h-4 w-4 ${getRiskScoreColor(normalizedPatientRiskScore)}`} />
                            <span className="text-muted-foreground">Risk Score:</span>
                            <span className={`ml-2 font-medium ${getRiskScoreColor(normalizedPatientRiskScore)}`}>
                              {normalizedPatientRiskScore.toFixed(0)}%
                            </span>
                          </div>                          <div className="flex items-center text-sm">
                            <Brain className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">AI Analysis:</span>
                            <Badge variant={patient.aiAnalysis ? "secondary" : "outline"} className="ml-2">
                              {patient.aiAnalysis ? "Complete" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Medical History Summary */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-4">Medical History Summary</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                            <span className="text-muted-foreground">Allergies:</span>
                          </div>                          {patient.allergies && patient.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.allergies.slice(0, 3).map((allergy: string, index: number) => (
                                <Badge key={index} variant="destructive" className="text-xs bg-red-100 text-red-800">
                                  {allergy}
                                </Badge>
                              ))}
                              {patient.allergies.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{patient.allergies.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None recorded</span>
                          )}
                        </div>
                          <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Pill className="mr-2 h-4 w-4 text-blue-600" />
                            <span className="text-muted-foreground">Medications:</span>
                          </div>
                          {patient.medications && patient.medications.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.medications.slice(0, 2).map((medication: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  {medication}
                                </Badge>
                              ))}
                              {patient.medications.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{patient.medications.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None recorded</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-purple-600" />
                            <span className="text-muted-foreground">Previous Conditions:</span>
                          </div>                          {patient.previousConditions && patient.previousConditions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.previousConditions.slice(0, 2).map((condition: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                  {condition}
                                </Badge>
                              ))}
                              {patient.previousConditions.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{patient.previousConditions.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card></motion.div>
            </TabsContent>

            <TabsContent value="medicalHistory">
              <motion.div {...cardAnimationProps(0.25)}>
                <div className="space-y-4">
                  {/* Primary Complaint Section */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" /> Primary Complaint
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-secondary/30 p-4 rounded-md">
                        <p className="text-foreground leading-relaxed">
                          {patient.primaryComplaint || 'No primary complaint recorded.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Allergies Section */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-red-600" /> Allergies
                      </CardTitle>
                      <CardDescription>
                        Known allergies and adverse reactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {patient.allergies && patient.allergies.length > 0 ? (                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {patient.allergies.map((allergy: string, index: number) => (
                              <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-red-800">
                                <strong>Important:</strong> Always verify allergies before prescribing medications or treatments.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-center">
                          <div className="space-y-2">
                            <Shield className="mx-auto h-12 w-12 text-green-500" />
                            <p className="text-muted-foreground">No known allergies recorded</p>
                            <p className="text-xs text-muted-foreground">Always confirm with patient before treatment</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Current Medications Section */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Pill className="mr-2 h-5 w-5 text-blue-600" /> Current Medications
                      </CardTitle>
                      <CardDescription>
                        Medications currently being taken by the patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>                      {patient.medications && patient.medications.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid gap-3">
                            {patient.medications.map((medication: string, index: number) => (
                              <div key={index} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <Pill className="h-4 w-4 text-blue-600 mr-3 flex-shrink-0" />
                                <span className="text-foreground font-medium">{medication}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-start space-x-2">
                              <InfoIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800">
                                Check for drug interactions when prescribing new medications.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-center">
                          <div className="space-y-2">
                            <Pill className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No current medications recorded</p>
                            <p className="text-xs text-muted-foreground">Verify with patient during consultation</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Previous Conditions Section */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-purple-600" /> Previous Medical Conditions
                      </CardTitle>
                      <CardDescription>
                        Medical history and past conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {patient.previousConditions && patient.previousConditions.length > 0 ? (                        <div className="space-y-3">
                          <div className="grid gap-2">
                            {patient.previousConditions.map((condition: string, index: number) => (
                              <div key={index} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-md">
                                <Clock className="h-4 w-4 text-purple-600 mr-3 flex-shrink-0" />
                                <span className="text-foreground">{condition}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-start space-x-2">
                              <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-blue-800">
                                Consider previous conditions when making diagnosis and treatment decisions.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-center">
                          <div className="space-y-2">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No previous conditions recorded</p>
                            <p className="text-xs text-muted-foreground">Update medical history as needed</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="vitals">
              <motion.div {...cardAnimationProps(0.3)}>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Patient Vitals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(patient.vitals).map(([key, value]) => {
                        const displayInfo = vitalKeyToDisplayInfo[key];
                        const IconComponent = displayInfo?.icon || Stethoscope;
                        if (!value) return null;
                        return (
                          <Card key={key} className="bg-secondary/30 p-3">
                            <CardHeader className="p-0 pb-1 flex flex-row items-center space-x-2">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <CardTitle className="text-sm font-medium text-muted-foreground">{displayInfo?.label || key.toUpperCase()}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <p className="text-lg font-semibold text-foreground">{value} {displayInfo?.unit}</p>
                              {displayInfo?.normal && (
                                <p className="text-xs text-muted-foreground">
                                  Normal: {displayInfo.normal}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="observations">
              <motion.div {...cardAnimationProps(0.4)}>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Doctor's Observations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{patient.doctorsObservations}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="aiAnalysis">
              <motion.div {...cardAnimationProps(0.5)}>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Brain className="mr-2 h-5 w-5 text-primary" /> AI-Generated Insights
                    </CardTitle>
                    <CardDescription>
                      Detailed analysis and recommendations powered by AI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                        <p className="text-primary">AI analysis is still in progress. Please check back shortly.</p>
                      </div>
                    )}
                    {patient.status === 'analysis_failed' && !isAnalyzing && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>AI Analysis Failed</AlertTitle>
                        <AlertDescription>
                          We were unable to complete the AI analysis for this patient. You can try refreshing or contact support.
                        </AlertDescription>
                      </Alert>
                    )}
                    {patient.aiAnalysis && patient.status === 'complete' && !isAnalyzing && (
                      <>
                        <div>
                          <h4 className="font-semibold text-primary mb-1">Overall Summary:</h4>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3 rounded-md">{patient.aiAnalysis.summary || 'No summary available.'}</p>
                        </div>

                        {patient.aiAnalysis.icd10Tags && patient.aiAnalysis.icd10Tags.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-primary mb-2">Potential ICD-10 Codes:</h4>
                            <div className="flex flex-wrap gap-2">
                              {patient.aiAnalysis.icd10Tags.map((code, index) => (
                                <Tooltip key={code.code}>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer border-2 text-xs font-medium px-2.5 py-1 rounded-full transition-all hover:shadow-md"
                                      onClick={() => handleIcd10CodeClick(code)}
                                    >
                                      {code.code}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-background text-foreground border shadow-lg rounded-md p-2">
                                    <p className="font-semibold">{code.code}</p>
                                    <p>{code.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        )}

                        {patient.aiAnalysis.differentialDiagnosis && patient.aiAnalysis.differentialDiagnosis.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-primary mb-2">Differential Diagnosis:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1 bg-secondary/30 p-3 rounded-md">
                              {patient.aiAnalysis.differentialDiagnosis.map((diag, index) => (
                                <li key={index}>{diag.condition} (Likelihood: {diag.likelihood})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {patient.aiAnalysis.recommendedTests && patient.aiAnalysis.recommendedTests.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-primary mb-2">Recommended Tests:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1 bg-secondary/30 p-3 rounded-md">
                              {patient.aiAnalysis.recommendedTests.map((test, index) => <li key={index}>{test}</li>)}
                            </ul>
                          </div>
                        )}
                        {patient.aiAnalysis.treatmentSuggestions && patient.aiAnalysis.treatmentSuggestions.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-primary mb-2">Treatment Suggestions:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1 bg-secondary/30 p-3 rounded-md">
                              {patient.aiAnalysis.treatmentSuggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="mt-6 text-center">
                          <Button onClick={handleViewFullAnalysis} variant="default" size="lg">
                            <BarChart3 className="mr-2 h-5 w-5" /> View Full Interactive Analysis Page
                          </Button>
                        </div>
                      </>
                    )}
                    {!patient.aiAnalysis && patient.status !== 'analyzing' && patient.status !== 'analysis_failed' && (
                       <div className="flex flex-col items-center justify-center py-10 text-center">
                        <InfoIcon className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No AI analysis data available for this patient yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Analysis might be pending or not initiated.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>

      {selectedIcd10Code && (
        <Dialog open={isIcd10ModalOpen} onOpenChange={setIsIcd10ModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary flex items-center">
                <BriefcaseMedical className="mr-2 h-6 w-6" /> ICD-10 Code: {selectedIcd10Code.code}
              </DialogTitle>
              <DialogDescription>
                Detailed information about the ICD-10 code "{selectedIcd10Code.code}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm">
              <div>
                <h5 className="font-semibold text-primary">Description:</h5>
                <p className="text-foreground/90 leading-relaxed">
                  {selectedIcd10Code.description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}
