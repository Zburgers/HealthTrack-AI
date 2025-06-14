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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, BarChart3, Loader2, AlertCircle, FileText } from 'lucide-react';
import { SimilarCaseOutput } from '@/types/similar-cases';

interface SimilarCasesPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cases: SimilarCaseOutput[] | null;
  isLoading: boolean;
  error: string | null;
}

const formatNoteSummary = (noteText: string | undefined): string => {
  if (!noteText || noteText.trim() === "") {
    return 'No detailed note available.';
  }

  // Normalize the whole note text first: convert newlines to spaces, multiple spaces to one.
  const normalizedFullNote = noteText.replace(/\n+/g, " ").replace(/\s\s+/g, " ").trim();

  let contentToProcess = normalizedFullNote; // Default to the full normalized note
  let sectionFound = false;

  const markers = [
    "History of Present Illness:",
    "Brief Hospital Course:",
    "Chief Complaint:",
    // Add other markers if relevant, e.g., "Summary of Hospital Course:"
  ];

  for (const marker of markers) {
    const markerLower = marker.toLowerCase();
    const normalizedNoteLower = normalizedFullNote.toLowerCase();
    const markerIndex = normalizedNoteLower.indexOf(markerLower);
    
    if (markerIndex !== -1) {
      const potentialContent = normalizedFullNote.substring(markerIndex + marker.length).trim();
      // Prefer sections that have a reasonable amount of text after the marker
      if (potentialContent.length > 50) { // Heuristic: 50 chars suggests actual content
        contentToProcess = potentialContent;
        sectionFound = true;
        break; // Found a good section
      }
    }
  }

  // If no specific section was deemed good, contentToProcess remains normalizedFullNote
  // Now, clean the selected contentToProcess
  let cleanedSummary = contentToProcess.replace(/_{2,}/g, ' ... '); 
  cleanedSummary = cleanedSummary.replace(/^[^a-zA-Z0-9]+/, ''); // Remove leading non-alphanumeric chars
  cleanedSummary = cleanedSummary.trim();

  // Final check for emptiness or too little information
  if (cleanedSummary === "" || cleanedSummary === "...") {
    return 'No detailed clinical narrative found.';
  }
  
  // If we used the full note and it's still very short after cleaning, it might not be useful.
  if (!sectionFound && cleanedSummary.length < 50) {
      return 'No detailed clinical narrative found.';
  }

  return cleanedSummary;
};

export default function SimilarCasesPanel({ isOpen, onOpenChange, cases, isLoading, error }: SimilarCasesPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading similar cases...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-semibold">Error loading similar cases</p>
          <p className="text-muted-foreground mt-1 text-sm">{error}</p>
        </div>
      );
    }

    if (!cases || cases.length === 0) {
      return (
        <div className="text-center py-10">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No similar cases found based on current criteria.</p>
        </div>
      );
    }

    const sortedAndLimitedCases = [...cases]
      .sort((a, b) => b.matchConfidence - a.matchConfidence)
      .slice(0, 5);

    return sortedAndLimitedCases.map((c) => (
      <Card key={c.id} className="shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <CardHeader className="flex flex-row items-start space-x-4 bg-secondary/50 p-4">
          <FileText className="h-10 w-10 text-primary mt-1" />
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">{`Case ID: ${c.id}`}</CardTitle>
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
            <h4 className="text-sm font-medium text-primary mb-1">Diagnosis Outcome (ICD Labels):</h4>
            <p className="text-sm text-foreground">{c.icd_label && c.icd_label.length > 0 ? c.icd_label.join(', ') : 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">Case Note Summary:</h4>
            <p className="text-sm text-foreground leading-relaxed line-clamp-4">{formatNoteSummary(c.note)}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Age: {c.age !== undefined ? c.age : 'N/A'}, Sex: {c.sex || 'N/A'}, Subject ID: {c.subject_id !== undefined ? c.subject_id : 'N/A'}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="font-headline text-2xl text-primary">Similar Past Cases</SheetTitle>
          <SheetDescription>
            Review cases with similar profiles for clinical insights. These are informational and require professional judgment.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Note: The case data presented is sourced from the MIMIC-IV v3.1 database, a publicly available dataset of de-identified real-world medical records from MIT's research.
            </span>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow p-6">
          <div className="space-y-6">
            {renderContent()}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 border-t mt-auto">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
