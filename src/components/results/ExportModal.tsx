'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileJson, FileText, Share2, Copy, LinkIcon } from 'lucide-react'; // Added LinkIcon

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ExportModal({ isOpen, onOpenChange }: ExportModalProps) {
  const { toast } = useToast();

  const handleExport = (format: 'JSON' | 'PDF' | 'Link') => {
    // Placeholder for actual export logic
    let description = '';
    switch (format) {
      case 'JSON':
        description = 'FHIR-compatible JSON report download initiated.';
        break;
      case 'PDF':
        description = 'PDF report download initiated.';
        break;
      case 'Link':
        // Simulate generating and copying a link
        navigator.clipboard.writeText('https://example.com/shared-report/xyz123')
          .then(() => {
            toast({
              title: 'Link Copied!',
              description: 'Secure share link copied to clipboard.',
            });
          })
          .catch(err => {
            console.error('Failed to copy link: ', err);
            toast({
              title: 'Copy Failed',
              description: 'Could not copy link to clipboard.',
              variant: 'destructive',
            });
          });
        return; // Prevent default toast
    }
    toast({
      title: `Exporting as ${format}`,
      description: `${description} (This is a simulation).`,
    });
    onOpenChange(false); // Close modal after action
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Export Patient Report</DialogTitle>
          <DialogDescription>
            Choose your preferred format for exporting the patient report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start text-lg py-6 border-primary text-primary hover:bg-primary/10"
            onClick={() => handleExport('JSON')}
          >
            <FileJson className="mr-3 h-6 w-6" /> FHIR-compatible JSON
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-lg py-6 border-primary text-primary hover:bg-primary/10"
            onClick={() => handleExport('PDF')}
          >
            <FileText className="mr-3 h-6 w-6" /> Download as PDF
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-lg py-6 border-primary text-primary hover:bg-primary/10"
            onClick={() => handleExport('Link')}
          >
            <LinkIcon className="mr-3 h-6 w-6" /> Copy Secure Share Link
          </Button>
        </div>
        <DialogFooter className="sm:justify-center">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
