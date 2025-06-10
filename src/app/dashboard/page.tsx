
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { PlusCircle, User, AlertTriangle, Activity } from 'lucide-react';
import Image from 'next/image';
import { mockPatients } from '@/lib/mock-data'; // Import mock data
import type { Patient } from '@/types'; // Import Patient type

const getRiskScoreColor = (score: number): string => {
  if (score >= 0.7) return 'bg-red-500'; // High risk
  if (score >= 0.4) return 'bg-yellow-500'; // Medium risk
  return 'bg-green-500'; // Low risk
};

const getRiskScoreBorderColor = (score: number): string => {
  if (score >= 0.7) return 'border-red-500';
  if (score >= 0.4) return 'border-yellow-500';
  return 'border-green-500';
};

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-bold text-primary">Patient Dashboard</h1>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/new-case">
              <PlusCircle className="mr-2 h-5 w-5" /> New Case
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockPatients.map((patient: Patient) => (
            <Card key={patient.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 ${getRiskScoreBorderColor(patient.riskScore)} flex flex-col`}>
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Image
                  src={patient.avatarUrl}
                  alt={patient.name}
                  width={60}
                  height={60}
                  className="rounded-full"
                  data-ai-hint={patient.dataAiHint}
                />
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">{patient.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Last Visit: {patient.lastVisit}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-1 ${getRiskScoreColor(patient.riskScore).replace('bg-', 'text-')}`} />
                    <span className="text-sm font-medium text-foreground">Risk Score: </span>
                  </div>
                  <Badge variant="outline" className={`px-2 py-1 text-xs ${getRiskScoreColor(patient.riskScore)} text-white`}>
                    {(patient.riskScore * 100).toFixed(0)}%
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Key Conditions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.map((condition) => (
                      <Badge key={condition} variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button variant="outline" size="sm" className="w-full text-primary border-primary hover:bg-primary/10" asChild>
                  <Link href={`/dashboard/patient/${patient.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
         {mockPatients.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-10 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Patients Yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding a new case to see patient information here.</p>
              <Button asChild>
                <Link href="/new-case">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Case
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
