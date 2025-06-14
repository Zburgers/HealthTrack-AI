'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import { FileJson, FileText, Share2, Copy, LinkIcon, Download, Sparkles } from 'lucide-react';
import type { AIAnalysisOutput, Patient, NewCaseFormValues } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  analysisData: AIAnalysisOutput | null;
  patientData: Patient | NewCaseFormValues | null | undefined;
  soapNotes: string;
}

export default function ExportModal({ isOpen, onOpenChange, analysisData, patientData, soapNotes }: ExportModalProps) {
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
      case 'Link':        // Simulate generating and copying a link
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

  const exportOptions = [
    {
      id: 'json',
      title: 'FHIR-compatible JSON',
      description: 'Machine-readable format for integration',
      icon: FileJson,
      gradient: 'from-blue-500 to-cyan-500',
      format: 'JSON' as const,
    },
    {
      id: 'pdf',
      title: 'Download as PDF',
      description: 'Professional report for printing or sharing',
      icon: FileText,
      gradient: 'from-purple-500 to-pink-500',
      format: 'PDF' as const,
    },
    {
      id: 'link',
      title: 'Copy Secure Share Link',
      description: 'Generate a secure link for easy sharing',
      icon: LinkIcon,
      gradient: 'from-green-500 to-emerald-500',
      format: 'Link' as const,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-semibold text-foreground">
                      Export Patient Report
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Choose your preferred format for exporting the analysis
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-6 space-y-3">
                {exportOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="group relative w-full justify-start p-4 h-auto border-2 hover:border-primary/50 transition-all duration-200"
                        onClick={() => handleExport(option.format)}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${option.gradient} text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                              {option.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                          <div className="text-muted-foreground group-hover:text-primary transition-colors duration-200">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
                <DialogClose asChild>
                  <Button variant="ghost" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Reports include AI analysis and recommendations</span>
                </div>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
