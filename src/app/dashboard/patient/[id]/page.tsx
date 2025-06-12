
'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import type { Patient, VitalDisplayInfo, ICD10Code } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppState } from '@/context/AppStateContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

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
  Loader2
} from 'lucide-react';

const getRiskScoreColor = (score: number): string => {
  if (score >= 0 && score <= 1) score *= 100; 
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

const vitalKeyToDisplayInfo: Record<string, { label: string; icon: React.ElementType }> = {
  bp: { label: 'Blood Pressure', icon: Gauge },
  hr: { label: 'Heart Rate', icon: HeartPulse },
  rr: { label: 'Respiratory Rate', icon: Wind },
  temp: { label: 'Temperature', icon: Thermometer },
  spo2: { label: 'SpO2', icon: Percent },
};

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { setAnalysisResult } = useAppState();
  const patientId = typeof params.id === 'string' ? params.id : undefined;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isIcd10ModalOpen, setIsIcd10ModalOpen] = useState(false);
  const [selectedIcd10Code, setSelectedIcd10Code] = useState<ICD10Code | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchPatientDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch patient details.');
        }
        const data = await response.json();
        setPatient(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  const handleViewFullAnalysis = () => {
    if (patient?.aiAnalysis) {
      setAnalysisResult(patient.aiAnalysis, `/dashboard/patient/${patient.id}`, patient);
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

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
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
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">Last Visit: {format(new Date(patient.lastVisit), "PPP")}</p>
                  <div className="flex items-center pt-1">
                    <AlertTriangle className={`h-5 w-5 mr-1.5 ${getRiskScoreColor(normalizedPatientRiskScore)}`} />
                    <span className="text-sm font-medium text-foreground">Risk Score: </span>
                    <span className={`ml-1 font-bold text-lg ${getRiskScoreColor(normalizedPatientRiskScore)}`}>
                      {normalizedPatientRiskScore.toFixed(0)}%
                    </span>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-1 h-6 w-6 text-muted-foreground hover:text-primary">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm p-3 bg-popover text-popover-foreground shadow-lg rounded-md border">
                        <p className="font-semibold text-primary mb-1">Risk Score Reasoning (Example)</p>
                        <p>Risk score is influenced by factors such as: {patient.conditions.join(', ') || 'N/A'}, and primary complaint: "{patient.primaryComplaint || 'N/A'}".</p>
                        <p className="mt-1 italic">A detailed AI-generated explanation can be found in the full analysis.</p>
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
          </motion.div>

          <Accordion type="multiple" defaultValue={['vitals', 'observations', 'ai-analysis']} className="w-full space-y-4">
            <motion.div {...cardAnimationProps(0.2)}>
              <AccordionItem value="vitals" className="border rounded-lg shadow-md bg-card">
                <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                  <div className="flex items-center">
                    <Activity className="mr-3 h-6 w-6 text-primary" />
                    Vitals
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
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
                            <p className="text-lg font-semibold text-foreground">{value}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
            
            <motion.div {...cardAnimationProps(0.3)}>
              <AccordionItem value="observations" className="border rounded-lg shadow-md bg-card">
                <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                  <div className="flex items-center">
                    <ClipboardList className="mr-3 h-6 w-6 text-primary" />
                    Doctor's Observations
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <p className="text-muted-foreground whitespace-pre-wrap">{patient.doctorsObservations}</p>
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {patient.aiAnalysis && (
              <motion.div {...cardAnimationProps(0.4)}>
                <AccordionItem value="ai-analysis" className="border rounded-lg shadow-md bg-card">
                  <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                    <div className="flex items-center">
                      <Brain className="mr-3 h-6 w-6 text-primary" />
                      AI Analysis Summary
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Detected Conditions (ICD-10):</h4>
                      {patient.aiAnalysis.icd10Tags && patient.aiAnalysis.icd10Tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {patient.aiAnalysis.icd10Tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/10 cursor-pointer transition-transform hover:scale-105"
                              onClick={() => handleIcd10CodeClick(tag)}
                            >
                              {tag.code}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific ICD-10 codes identified by AI.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">SOAP Note Draft:</h4>
                      <Card className="bg-secondary/30 p-4 max-h-60 overflow-y-auto shadow-inner">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {patient.aiAnalysis.soapNotes}
                        </p>
                      </Card>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleViewFullAnalysis}>
                        <BarChart3 className="mr-2 h-4 w-4" /> View Full AI Analysis & Edit Notes
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            )}
          </Accordion>
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
