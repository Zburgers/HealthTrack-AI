'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, CheckCircle, BarChart3 } from 'lucide-react';

interface SimilarCase {
  id: string;
  patientName: string;
  patientAvatar: string;
  dataAiHint: string;
  diagnosisOutcome: string;
  treatmentSummary: string;
  matchConfidence: number; // 0-1
}

const mockSimilarCases: SimilarCase[] = [
  {
    id: 'case1',
    patientName: 'Alice Brown',
    patientAvatar: 'https://placehold.co/80x80.png',
    dataAiHint: 'woman smiling',
    diagnosisOutcome: 'Acute Bronchitis',
    treatmentSummary: 'Prescribed Amoxicillin 500mg TID for 7 days. Advised rest and hydration. Follow-up in 1 week.',
    matchConfidence: 0.85,
  },
  {
    id: 'case2',
    patientName: 'Bob Green',
    patientAvatar: 'https://placehold.co/80x80.png',
    dataAiHint: 'man glasses',
    diagnosisOutcome: 'Gastroenteritis',
    treatmentSummary: 'Recommended BRAT diet, oral rehydration salts. Symptoms resolved in 3 days.',
    matchConfidence: 0.72,
  },
  {
    id: 'case3',
    patientName: 'Carol White',
    patientAvatar: 'https://placehold.co/80x80.png',
    dataAiHint: 'elderly woman',
    diagnosisOutcome: 'Urinary Tract Infection',
    treatmentSummary: 'Ciprofloxacin 250mg BID for 5 days. Increased fluid intake. Significant improvement noted.',
    matchConfidence: 0.91,
  },
];

interface SimilarCasesPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SimilarCasesPanel({ isOpen, onOpenChange }: SimilarCasesPanelProps) {
  const sortedAndLimitedCases = [...mockSimilarCases] // Create a copy to avoid mutating the original array
    .sort((a, b) => b.matchConfidence - a.matchConfidence) // Sort by matchConfidence descending
    .slice(0, 5); // Take the top 5 cases

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="font-headline text-2xl text-primary">Similar Past Cases</SheetTitle>
          <SheetDescription>
            Review cases with similar profiles for clinical insights. These are informational and require professional judgment.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-160px)]"> {/* Adjust height as needed */}
          <div className="p-6 space-y-6">
            {sortedAndLimitedCases.length > 0 ? sortedAndLimitedCases.map((c) => (
              <Card key={c.id} className="shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="flex flex-row items-start space-x-4 bg-secondary/50 p-4">
                  <Image
                    src={c.patientAvatar}
                    alt={c.patientName}
                    width={60}
                    height={60}
                    className="rounded-full border-2 border-primary"
                    data-ai-hint={c.dataAiHint}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">{c.patientName}</CardTitle>
                     <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <BarChart3 className="h-4 w-4 mr-1 text-primary" />
                      Match Confidence: 
                      <Badge variant={c.matchConfidence > 0.8 ? "default" : "secondary"} className={`ml-2 ${c.matchConfidence > 0.8 ? 'bg-green-500 text-white' : c.matchConfidence > 0.7 ? 'bg-yellow-500 text-black' : 'bg-orange-500 text-white'}`}>
                        {(c.matchConfidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Diagnosis Outcome:</h4>
                    <p className="text-sm text-foreground">{c.diagnosisOutcome}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Treatment Summary:</h4>
                    <p className="text-sm text-foreground leading-relaxed">{c.treatmentSummary}</p>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No similar cases found based on current criteria.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 border-t">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
