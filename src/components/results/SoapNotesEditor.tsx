'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast'; // Corrected import path
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SoapNotesEditorProps {
  currentNotes: string; // Changed from initialNotes to currentNotes to match usage
  onNotesChange: (newNotes: string) => void;
  onResetNotes: () => void; // Changed from onReset to onResetNotes
  onSaveNotes: (notes: string) => void; // Added for saving functionality
  patientDataForAI?: {
    patientInformation: string;
    vitals: string;
    observations: string;
  };
}

export default function SoapNotesEditor({ currentNotes, onNotesChange, onResetNotes, patientDataForAI, onSaveNotes }: SoapNotesEditorProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSave = () => {
    onSaveNotes(currentNotes); // Call parent's save handler
  };

  const handleReset = () => {
    onResetNotes(); // Call the parent's reset handler
     toast({
      title: 'Notes Reset',
      description: 'SOAP notes have been reset to the AI-generated version.',
    });
  }

  const handleEnhanceNotes = async () => {
    if (!patientDataForAI) {
      toast({
        title: 'Error',
        description: 'Patient data is not available for AI enhancement.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentNotes || currentNotes.trim() === '') {
      toast({
        title: 'Cannot Enhance Empty Notes',
        description: 'Please enter some notes before using AI enhancement.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patientDataForAI,
          currentNotes: currentNotes,
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

  return (
    <div className="space-y-4">
      <Textarea
        value={currentNotes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Edit SOAP notes here..."
        className="min-h-[200px] md:min-h-[250px] resize-y text-base leading-relaxed p-4 border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background"
      />
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
        <Button
          variant="outline"
          onClick={handleEnhanceNotes}
          disabled={isEnhancing || !patientDataForAI || !currentNotes.trim()}
          className="w-full sm:w-auto"
        >
          {isEnhancing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-magic mr-2" viewBox="0 0 16 16">
              <path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829Zm4.5.035A.5.5 0 0 0 13.293 2L12 3.293a.5.5 0 1 0 .707.707L14 2.707ZM7.293 4A.5.5 0 1 0 8 3.293L6.707 2A.5.5 0 0 0 6 2.707L7.293 4Zm-.646 2.354a.5.5 0 0 0 0 .708l1.414 1.415a.5.5 0 0 0 .707-.708L7.354 6.646a.5.5 0 0 0-.708 0Z"/>
              <path d="M2.828 12.828A4 4 0 0 1 8.485 7.172a4 4 0 0 1 5.657 5.656A4 4 0 0 1 2.828 12.828Zm2.343-2.343a3 3 0 1 0 4.243 4.243A3 3 0 0 0 5.17 10.485Z"/>
            </svg>
          )}
          AI Enhancement
        </Button>
        <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
          Reset Draft
        </Button>
        <Button onClick={handleSave} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
          Save Final Note
        </Button>
      </div>
    </div>
  );
}

