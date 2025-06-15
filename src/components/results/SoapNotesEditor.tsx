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
}: SoapNotesEditorProps) {  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);  // Helper function to validate SOAP format more robustly
  const isValidSoapFormat = (notes: string): boolean => {
    if (!notes || notes.trim() === '') return false;
    
    // Check for traditional format with line breaks to avoid false positives
    const hasTraditionalFormat = notes.includes('S:') && notes.includes('O:') && 
                                notes.includes('A:') && notes.includes('P:');
    
    // Additional check: ensure S:, O:, A:, P: appear at line beginnings or after newlines
    const soapRegex = /(?:^|\n)\s*[SOAP]:\s/g;
    const matches = notes.match(soapRegex);
    const hasProperStructure = matches && matches.length >= 4;
    
    return hasTraditionalFormat && Boolean(hasProperStructure);
  };

  const handleSave = async () => {
    // Validate notes before saving
    if (!currentNotes || currentNotes.trim() === '') {
      toast({
        title: 'Cannot Save Empty Notes',
        description: 'Please enter some notes before saving.',
        variant: 'destructive',
      });
      return;
    }    // Check if notes are properly formatted SOAP notes
    if (!isValidSoapFormat(currentNotes)) {
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
    }    // Allow enhancement even if notes are empty - AI can generate notes from patient data
    const notesToEnhance = currentNotes.trim() || 'Generate SOAP notes based on the available patient information and observations.';

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/v2/enhance-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
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
  const isSaveDisabled = isSaving || !currentNotes.trim() || !isExistingPatient || !isValidSoapFormat(currentNotes);
  return (
    <motion.div 
      className="space-y-6 bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </div>
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">SOAP Notes Editor</h3>
            <p className="text-sm text-gray-600">Edit and enhance clinical documentation</p>
          </div>
        </div>
        
        {/* SOAP Format Guide */}
        <motion.div 
          className="hidden md:flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="font-medium text-blue-600">S:</span> Subjective
          <span className="mx-1">•</span>
          <span className="font-medium text-green-600">O:</span> Objective
          <span className="mx-1">•</span>
          <span className="font-medium text-purple-600">A:</span> Assessment
          <span className="mx-1">•</span>
          <span className="font-medium text-orange-600">P:</span> Plan
        </motion.div>
      </motion.div>

      {/* Enhanced Text Editor */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 focus-within:border-blue-400 transition-colors duration-300 bg-white shadow-inner">
          <Textarea
            value={currentNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Enter your SOAP notes here...

S (Subjective): Patient's description of symptoms and concerns
O (Objective): Observable measurements, test results, and physical examination findings  
A (Assessment): Clinical analysis and diagnosis
P (Plan): Treatment plan and next steps"
            className="min-h-[320px] md:min-h-[380px] resize-none text-base leading-relaxed p-6 border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400"
          />
          
          {/* Enhanced Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-4 py-2 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-4 text-gray-500">
              <span>{currentNotes.length} characters</span>
              <span>•</span>
              <span>{currentNotes.split('\n').length} lines</span>
              {isValidSoapFormat(currentNotes) && (
                <>
                  <span>•</span>
                  <div className="flex items-center text-green-600">
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    SOAP Format Valid
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span>Click AI Enhancement for formatting help</span>
            </div>
          </div>
        </div>
      </motion.div>      {/* Enhanced Action Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Left side - Enhancement Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>AI enhancement improves structure and formatting</span>
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={handleEnhanceNotes}
              disabled={isEnhanceDisabled}
              className="group relative overflow-hidden border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {isEnhancing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center text-blue-600"
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
                    className="flex items-center text-blue-600"
                  >
                    <Wand2 className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                    AI Enhancement
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Enhanced shimmer effect */}
              {!isEnhanceDisabled && (
                <div className="absolute inset-0 -top-[2px] bg-gradient-to-r from-transparent via-blue-200/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              )}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="ghost" 
              onClick={handleReset} 
              className="group hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200"
            >
              <RotateCcw className="mr-2 h-4 w-4 group-hover:-rotate-180 transition-transform duration-300" />
              Reset Draft
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleSave} 
              disabled={isSaveDisabled}
              className="group bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 hover:from-green-700 hover:via-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isSaving ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  Save Notes
                </motion.div>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>{/* Enhancement hint */}
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

