'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SoapNotesEditorProps {
  initialNotes: string;
}

export default function SoapNotesEditor({ initialNotes }: SoapNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleSave = () => {
    // In a real app, this would save to a backend.
    console.log('Saving SOAP notes:', notes);
    toast({
      title: 'Notes Saved (Simulated)',
      description: 'Your SOAP notes have been saved.',
    });
  };

  const handleReset = () => {
    setNotes(initialNotes);
     toast({
      title: 'Notes Reset',
      description: 'SOAP notes have been reset to the AI-generated version.',
    });
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter SOAP notes here..."
        className="min-h-[300px] md:min-h-[400px] lg:min-h-[calc(100vh-400px)] resize-y text-base leading-relaxed p-4 border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-secondary/30"
      />
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleReset} disabled={notes === initialNotes}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Save Notes
        </Button>
      </div>
    </div>
  );
}
