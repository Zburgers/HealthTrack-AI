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
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BarChart3, Loader2, AlertCircle, FileText, TrendingUp, Calendar, UserCheck, Stethoscope } from 'lucide-react';
import { SimilarCaseOutput } from '@/types/similar-cases';
import { cn } from '@/lib/utils';

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

const getConfidenceColor = (confidence: number) => {
  if (confidence > 0.85) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
  if (confidence > 0.75) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
  if (confidence > 0.65) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
  return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
};

const CaseCard = ({ caseData, index }: { caseData: SimilarCaseOutput; index: number }) => {
  const confidence = getConfidenceColor(caseData.matchConfidence);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.4,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Case #{caseData.id}
                </CardTitle>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <Badge 
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      confidence.bg,
                      confidence.text,
                      confidence.border,
                      "border"
                    )}
                  >
                    {(caseData.matchConfidence * 100).toFixed(0)}% Match
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Patient Demographics */}
          <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Age:</span>
                  <p className="text-blue-900">{caseData.age !== undefined ? caseData.age : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Sex:</span>
                  <p className="text-blue-900">{caseData.sex || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">ID:</span>
                  <p className="text-blue-900 text-xs">{caseData.subject_id !== undefined ? caseData.subject_id : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700 text-sm">Diagnosis Outcome</span>
            </div>
            <div className="pl-6">
              {caseData.icd_label && caseData.icd_label.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {caseData.icd_label.slice(0, 3).map((label, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline" 
                      className="text-xs bg-green-50 text-green-800 border-green-300"
                    >
                      {label}
                    </Badge>
                  ))}
                  {caseData.icd_label.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                      +{caseData.icd_label.length - 3} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No diagnosis information available</p>
              )}
            </div>
          </div>

          {/* Case Summary */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-purple-700 text-sm">Clinical Summary</span>
            </div>
            <div className="pl-6">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                {formatNoteSummary(caseData.note)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SimilarCasesPanel({ isOpen, onOpenChange, cases, isLoading, error }: SimilarCasesPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center h-96 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-16 w-16 text-blue-500 mb-6" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-lg font-medium text-blue-600 mb-2">Finding Similar Cases</p>
            <p className="text-sm text-gray-500">Analyzing patient patterns and clinical profiles...</p>
          </motion.div>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center h-96 py-10 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Similar Cases</h3>
          <p className="text-sm text-gray-600 max-w-md">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </motion.div>
      );
    }

    if (!cases || cases.length === 0) {
      return (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Similar Cases Found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No matching cases were found based on the current patient profile and search criteria. 
            This could indicate a unique case or the need for different search parameters.
          </p>
        </motion.div>
      );
    }

    const sortedAndLimitedCases = [...cases]
      .sort((a, b) => b.matchConfidence - a.matchConfidence)
      .slice(0, 5);

    return (
      <AnimatePresence>
        <div className="space-y-6">
          {sortedAndLimitedCases.map((caseData, index) => (
            <CaseCard key={caseData.id} caseData={caseData} index={index} />
          ))}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-3xl p-0 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <SheetTitle className="font-bold text-2xl text-gray-900">Similar Cases</SheetTitle>
                <SheetDescription className="text-gray-600 mt-1">
                  Review similar patient profiles and clinical outcomes for reference
                </SheetDescription>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Clinical Reference Only:</strong> These cases are from the MIMIC-IV v3.1 database 
                (MIT's de-identified medical records). Use for reference and pattern recognition. 
                Professional clinical judgment is required for patient care decisions.
              </p>
            </div>
          </SheetHeader>
        </motion.div>
        
        <ScrollArea className="flex-grow p-6">
          {renderContent()}
        </ScrollArea>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SheetFooter className="p-6 border-t mt-auto bg-gray-50">
            <div className="flex justify-between items-center w-full">
              <p className="text-xs text-gray-500">
                {cases && cases.length > 0 && `Showing top ${Math.min(5, cases.length)} of ${cases.length} matches`}
              </p>
              <SheetClose asChild>
                <Button variant="outline" className="hover:bg-gray-100">
                  Close Panel
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
