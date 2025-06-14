'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, RotateCcw, Save, Wand2, Info as InfoIcon } from 'lucide-react';
import { useState } from 'react';

interface SoapNotesEditorProps {
  currentNotes: string;
  onNotesChange: (newNotes: string) => void;
  onResetNotes: () => void;
  onSaveNotes: (notes: string) => void;
  patientDataForAI?: {
    patientInformation: string;
    vitals: string;
    observations: string;
  };
  isExistingPatient?: boolean; // New prop to indicate if this is an existing patient
}

export default function SoapNotesEditor({ 
  currentNotes, 
  onNotesChange, 
  onResetNotes, 
  patientDataForAI, 
  onSaveNotes,
  isExistingPatient = false
}: SoapNotesEditorProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validate notes before saving
    if (!currentNotes || currentNotes.trim() === '') {
      toast({
        title: 'Cannot Save Empty Notes',
        description: 'Please enter some notes before saving.',
        variant: 'destructive',
      });
      return;
    }

    // Check if notes are properly formatted SOAP notes
    if (!currentNotes.includes('S:') || !currentNotes.includes('O:') || 
        !currentNotes.includes('A:') || !currentNotes.includes('P:')) {
      toast({
        title: 'Invalid SOAP Format',
        description: 'Notes must be properly formatted with S:, O:, A:, and P: sections. Use AI Enhancement first.',
        variant: 'destructive',
      });
      return;
    }

    if (!isExistingPatient) {
      toast({
        title: 'Cannot Save Notes',
        description: 'Saving is only available for existing patient records.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSaveNotes(currentNotes);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    onResetNotes();
    toast({
      title: 'Notes Reset',
      description: 'SOAP notes have been reset to the AI-generated version.',
    });
  };
  const handleEnhanceNotes = async () => {
    if (!patientDataForAI) {
      toast({
        title: 'Error',
        description: 'Patient data is not available for AI enhancement.',
        variant: 'destructive',
      });
      return;
    }

    // Allow enhancement even if notes are empty - AI can generate notes from patient data
    const notesToEnhance = currentNotes.trim() || 'Generate SOAP notes based on the available patient information and observations.';

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patientDataForAI,
          currentNotes: notesToEnhance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to enhance notes');
      }

      const result = await response.json();
      onNotesChange(result.enhancedSoapNotes);
      toast({
        title: 'Notes Enhanced',
        description: 'SOAP notes have been enhanced by AI.',
      });
    } catch (error) {
      console.error('Error enhancing notes:', error);
      toast({
        title: 'Enhancement Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };
  // Modified logic: Allow enhancement if patient data is available (don't require existing notes)
  const isEnhanceDisabled = isEnhancing || !patientDataForAI;
  
  // Save button logic: disabled if saving, no content, invalid format, or not an existing patient
  const isSaveDisabled = isSaving || !currentNotes.trim() || !isExistingPatient ||
    (!currentNotes.includes('S:') || !currentNotes.includes('O:') || 
     !currentNotes.includes('A:') || !currentNotes.includes('P:'));

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
            <path d="M10 9H8"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">SOAP Notes Editor</h3>
          <p className="text-sm text-muted-foreground">Edit and enhance clinical documentation</p>
        </div>
      </div>

      {/* Text Editor */}
      <div className="relative">
        <Textarea
          value={currentNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter your SOAP notes here...

S (Subjective): Patient's description of symptoms and concerns
O (Objective): Observable measurements, test results, and physical examination findings  
A (Assessment): Clinical analysis and diagnosis
P (Plan): Treatment plan and next steps"
          className="min-h-[300px] md:min-h-[350px] resize-y text-base leading-relaxed p-6 border-2 transition-colors duration-200 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
        />
        
        {/* Character count indicator */}
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
          {currentNotes.length} characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Button
            variant="outline"
            onClick={handleEnhanceNotes}
            disabled={isEnhanceDisabled}
            className="group relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isEnhancing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing...
                </motion.div>
              ) : (
                <motion.div
                  key="enhance"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Wand2 className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                  AI Enhancement
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Shimmer effect when not disabled */}
            {!isEnhanceDisabled && (
              <div className="absolute inset-0 -top-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleReset} 
            className="group"
          >
            <RotateCcw className="mr-2 h-4 w-4 group-hover:-rotate-180 transition-transform duration-300" />
            Reset Draft
          </Button>          <Button 
            onClick={handleSave} 
            disabled={isSaveDisabled}
            className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                Save Final Note
              </>
            )}
          </Button>
        </motion.div>
      </div>      {/* Enhancement hint */}
      <motion.div 
        className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI enhancement will improve structure, add medical terminology, ensure SOAP format, and can generate notes from patient data if empty</span>
      </motion.div>

      {/* Save guidance */}
      {!isExistingPatient && (
        <motion.div 
          className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <InfoIcon className="h-4 w-4 text-amber-600" />
          <span>💾 <strong>Note:</strong> SOAP notes can only be saved for existing patient records, not for new case analysis.</span>
        </motion.div>
      )}

      {isExistingPatient && isSaveDisabled && currentNotes.trim() && (
        <motion.div 
          className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <span>💡 <strong>Tip:</strong> Use AI Enhancement to format notes properly before saving (requires S:, O:, A:, P: sections).</span>
        </motion.div>
      )}
    </motion.div>
  );
}

