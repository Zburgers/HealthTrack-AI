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
import { Users, BarChart3, Loader2, AlertCircle, FileText, TrendingUp, Calendar, UserCheck, Stethoscope, ChevronDown, ChevronUp, Info, ClipboardList, Award, Activity, Clock, CheckCircle2, XCircle, PlusCircle, FileSignature } from 'lucide-react';
import { SimilarCaseOutput } from '@/types/similar-cases';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import React from 'react';

interface SimilarCasesPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cases: SimilarCaseOutput[] | null;
  isLoading: boolean;
  error: string | null;
}

// In-memory cache for similar cases queries (key: JSON.stringify(query/filter), value: { data, timestamp })
const SIMILAR_CASES_CACHE = new Map<string, { data: SimilarCaseOutput[]; timestamp: number }>();
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

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

// Helper: Format quick stats
const formatQuickStats = (caseData: SimilarCaseOutput) => {
  const stats: { label: string; value: string | number | undefined; icon: React.ReactNode }[] = [];
  if (caseData.outcomes?.lengthOfStay !== undefined) stats.push({ label: 'LOS', value: `${caseData.outcomes.lengthOfStay}d`, icon: <Clock className="h-4 w-4 text-blue-500" /> });
  if (caseData.outcomes?.dischargeStatus) stats.push({ label: 'Discharge', value: caseData.outcomes.dischargeStatus, icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> });
  if (caseData.metadata?.outcomeClass) stats.push({ label: 'Outcome', value: caseData.metadata.outcomeClass, icon: <Award className="h-4 w-4 text-purple-500" /> });
  if (caseData.metadata?.complexityScore !== undefined) stats.push({ label: 'Complexity', value: caseData.metadata.complexityScore, icon: <BarChart3 className="h-4 w-4 text-amber-500" /> });
  return stats;
};

// Helper: Format summary (first 2-3 lines, fade if long)
const formatSummary = (note: string | undefined) => {
  if (!note) return 'No clinical summary available.';
  const lines = note.split(/\n|\. /).filter(Boolean);
  const summary = lines.slice(0, 2).join('. ') + (lines.length > 2 ? '...' : '');
  return summary;
};

// Enhanced Case Card
const EnhancedCaseCard = ({ caseData, index, expanded, onToggle }: { caseData: SimilarCaseOutput; index: number; expanded: boolean; onToggle: () => void }) => {
  const confidence = getConfidenceColor(caseData.matchConfidence);
  const quickStats = formatQuickStats(caseData);
  const summary = formatSummary(caseData.note);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.35, type: 'spring', stiffness: 120 }}
      whileHover={{ y: -2, boxShadow: '0 4px 24px 0 rgba(80,120,255,0.08)' }}
      className="mb-4"
    >
      <div className={cn(
        'rounded-xl border bg-gradient-to-br from-white to-blue-50 shadow-md transition-all duration-300',
        expanded ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-blue-200'
      )}>
        {/* Main Card Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-5 py-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-blue-900 truncate">Case #{index + 1}</span>
                <Badge className={cn('text-xs font-semibold px-2 py-1 rounded-full border', confidence.bg, confidence.text, confidence.border)}>
                  {(caseData.matchConfidence * 100).toFixed(0)}% Match
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-700">
                <span className="flex items-center"><UserCheck className="h-4 w-4 mr-1 text-blue-500" />Age: {caseData.age ?? 'N/A'}</span>
                <span className="flex items-center"><ClipboardList className="h-4 w-4 mr-1 text-blue-500" />Sex: {caseData.sex ?? 'N/A'}</span>
                <span className="flex items-center"><Activity className="h-4 w-4 mr-1 text-blue-500" />ID: {caseData.subject_id ?? caseData.hadm_id ?? 'N/A'}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {caseData.icd_label && caseData.icd_label.length > 0 ? (
                  <>
                    {caseData.icd_label.slice(0, 3).map((label, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-800 border-green-300">{label}</Badge>
                    ))}
                    {caseData.icd_label.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">+{caseData.icd_label.length - 3} more</Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400">No diagnosis info</span>
                )}
              </div>
              <div className="mt-2 text-sm text-black max-w-xl line-clamp-2">
                {summary}
                </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {quickStats.map((stat, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 border border-gray-200 mr-2">
                    {stat.icon}<span className="ml-1 font-medium">{stat.label}:</span> <span className="ml-1">{stat.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex flex-col items-end justify-between h-full">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-100" aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? <ChevronUp className="h-6 w-6 text-blue-600" /> : <ChevronDown className="h-6 w-6 text-blue-600" />}
            </Button>
          </div>
        </div>
        {/* Expanded Section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <div className="font-bold text-black mb-1 text-base">Full Note:</div>
                    <div className="whitespace-pre-wrap text-black font-medium text-base max-h-48 overflow-auto">{caseData.note || 'No note available.'}</div>
                  </div>
                  {caseData.icd && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">ICD Codes:</div>
                      <div className="text-black">{caseData.icd.join(', ')}</div>
                    </div>
                  )}
                  {caseData.icd_label && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">ICD Labels:</div>
                      <div className="text-black">{caseData.icd_label.join(', ')}</div>
                    </div>
                  )}
                  {caseData.vitals && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">Vitals:</div>
                      <div className="text-black">{Object.entries(caseData.vitals).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                </div>
                  )}
                </div>
                <div>
                  {caseData.outcomes && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">Outcomes:</div>
                      <div className="text-black">{JSON.stringify(caseData.outcomes, null, 2)}</div>
                </div>
                  )}
                  {caseData.treatments && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">Treatments:</div>
                      <div className="text-black">{JSON.stringify(caseData.treatments, null, 2)}</div>
              </div>
                  )}
                  {caseData.diagnostics && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">Diagnostics:</div>
                      <div className="text-black">{JSON.stringify(caseData.diagnostics, null, 2)}</div>
            </div>
                  )}
                  {caseData.metadata && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="font-bold text-black mb-1 text-base">Metadata:</div>
                      <div className="text-black">{JSON.stringify(caseData.metadata, null, 2)}</div>
            </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">Case ID: {caseData.id}</div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
    </motion.div>
  );
};

export default function SimilarCasesPanel({ isOpen, onOpenChange, cases, isLoading, error }: SimilarCasesPanelProps) {
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);
  const handleToggle = (id: string) => {
    setExpandedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  // Always treat cases as an array for rendering
  const safeCases: SimilarCaseOutput[] = Array.isArray(cases) ? cases : [];
  const renderContent = () => {
    if (isLoading) {
      return <div className="p-6 text-center">Loading similar cases...</div>;
    }
    if (error) {
      return <div className="p-6 text-center text-red-600">{error}</div>;
    }
    if (!Array.isArray(cases)) {
      // Remove this error log and fallback, since we now always use safeCases
      // console.error('SimilarCasesPanel: cases is not an array:', cases);
      // return <div className="p-6 text-center text-red-600">Error: Similar cases data is malformed. Please try again or contact support.</div>;
    }
    if (safeCases.length === 0) {
      return <div className="p-6 text-center text-gray-500">No similar cases found.</div>;
    }
    return (
      <div className="space-y-4">
        {safeCases.map((caseData, idx) => (
          <EnhancedCaseCard
            key={caseData.id}
            caseData={caseData}
            index={idx}
            expanded={expandedIds.includes(caseData.id)}
            onToggle={() => handleToggle(caseData.id)}
          />
        ))}
      </div>
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
                {safeCases.length > 0 && `Showing top ${Math.min(5, safeCases.length)} of ${safeCases.length} matches`}
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
