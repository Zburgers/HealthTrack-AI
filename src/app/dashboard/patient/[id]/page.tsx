
'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { mockPatients } from '@/lib/mock-data';
import type { Patient, VitalDisplayInfo } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppState } from '@/context/AppStateContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';

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
  Sheet,
  FileText,
  AlertTriangle,
  BarChart3,
  InfoIcon, // Added for risk reasoning
  BriefcaseMedical // Example icon for ICD-10 details
} from 'lucide-react';

const getRiskScoreColor = (score: number): string => {
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


export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { setAnalysisResult } = useAppState();
  const patientId = typeof params.id === 'string' ? params.id : undefined;

  const [isIcd10ModalOpen, setIsIcd10ModalOpen] = useState(false);
  const [selectedIcd10Code, setSelectedIcd10Code] = useState<string | null>(null);

  const patient = mockPatients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-10">
          <UserCircle className="w-24 h-24 text-muted-foreground mb-4" />
          <h1 className="font-headline text-3xl font-bold text-destructive mb-2">Patient Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The patient you are looking for does not exist or the ID is incorrect.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  const patientRiskScore = patient.aiAnalysis?.riskScore ?? patient.riskScore;

  const handleViewFullAnalysis = () => {
    if (patient.aiAnalysis) {
      setAnalysisResult(patient.aiAnalysis, `/dashboard/patient/${patient.id}`);
      router.push('/analysis');
    }
  };

  const handleIcd10CodeClick = (code: string) => {
    setSelectedIcd10Code(code);
    setIsIcd10ModalOpen(true);
  };

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="font-headline text-3xl font-bold text-primary truncate max-w-md">{patient.name} - Details</h1>
            <Button onClick={handleViewFullAnalysis} disabled={!patient.aiAnalysis}>
              <BarChart3 className="mr-2 h-4 w-4" /> View Full AI Analysis
            </Button>
          </div>

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
                <p className="text-sm text-muted-foreground">Last Visit: {patient.lastVisit}</p>
                <div className="flex items-center pt-1">
                  <AlertTriangle className={`h-5 w-5 mr-1.5 ${getRiskScoreColor(patientRiskScore)}`} />
                  <span className="text-sm font-medium text-foreground">Risk Score: </span>
                  <span className={`ml-1 font-bold text-lg ${getRiskScoreColor(patientRiskScore)}`}>
                    {patientRiskScore.toFixed(0)}%
                  </span>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-1 h-6 w-6 text-muted-foreground hover:text-primary">
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      <p className="font-semibold text-primary">Risk Score Reasoning (Placeholder)</p>
                      <p>This score is based on factors such as medical history, current symptoms, and vital signs. A detailed explanation can be generated by the AI.</p>
                      <p className="mt-1 italic">Example: Risk driven by persistent anxiety symptoms, sleep disruption, and elevated stress indicators. No acute vitals deviations.</p>
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

          <Accordion type="multiple" defaultValue={['vitals', 'observations', 'ai-analysis']} className="w-full space-y-4">
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

            {patient.aiAnalysis && (
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
                            className="border-primary text-primary hover:bg-primary/10 cursor-pointer"
                            onClick={() => handleIcd10CodeClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific ICD-10 codes identified by AI.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">SOAP Note Draft:</h4>
                    <Card className="bg-secondary/30 p-4 max-h-60 overflow-y-auto">
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
            )}
          </Accordion>
        </div>
      </TooltipProvider>

      {selectedIcd10Code && (
        <Dialog open={isIcd10ModalOpen} onOpenChange={setIsIcd10ModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary flex items-center">
                <BriefcaseMedical className="mr-2 h-6 w-6" /> ICD-10 Code: {selectedIcd10Code}
              </DialogTitle>
              <DialogDescription>
                Detailed information about the ICD-10 code "{selectedIcd10Code}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <h5 className="font-semibold text-foreground">Description (Placeholder):</h5>
                <p className="text-sm text-muted-foreground">
                  A detailed description of {selectedIcd10Code} would appear here. This information would typically be fetched from a medical database or generated by an AI.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-foreground">Risk Implications (Placeholder):</h5>
                <p className="text-sm text-muted-foreground">
                  Potential risks and complications associated with {selectedIcd10Code}.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-foreground">Typical Treatment Paths (Placeholder):</h5>
                <p className="text-sm text-muted-foreground">
                  Commonly followed treatment protocols and options for conditions related to {selectedIcd10Code}.
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

