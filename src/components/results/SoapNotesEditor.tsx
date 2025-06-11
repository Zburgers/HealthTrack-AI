
'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SoapNotesEditorProps {
  currentNotes: string;
  onNotesChange: (newNotes: string) => void;
  onResetNotes: () => void;
}

export default function SoapNotesEditor({ currentNotes, onNotesChange, onResetNotes }: SoapNotesEditorProps) {
  const { toast } = useToast();

  // The local state 'notes' is managed by the parent through 'currentNotes' prop for real-time updates.
  // The 'onNotesChange' callback updates the parent's state.

  const handleSave = () => {
    // In a real app, this would likely trigger an API call to save the currentNotes.
    // For now, the parent (AnalysisPage) holds the 'editableSoapNotes' state.
    // If persistence is needed here, the parent would handle it.
    console.log('Saving SOAP notes:', currentNotes);
    toast({
      title: 'Notes Saved (Simulated)',
      description: 'Your SOAP notes have been "saved" (current edited version logged).',
    });
  };

  const handleReset = () => {
    onResetNotes(); // Call the parent's reset handler
     toast({
      title: 'Notes Reset',
      description: 'SOAP notes have been reset to the AI-generated version.',
    });
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={currentNotes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Edit SOAP notes here..."
        className="min-h-[200px] md:min-h-[250px] resize-y text-base leading-relaxed p-4 border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background"
      />
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={handleReset}
          // Disabled if currentNotes is the same as what it would be reset to (implicitly managed by parent)
          // Or simply enable if onResetNotes is provided. The parent should handle initial state comparison if needed.
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Draft
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Save Final Note
        </Button>
      </div>
    </div>
  );
}

