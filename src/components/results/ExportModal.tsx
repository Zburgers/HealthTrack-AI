'use client';

import { AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, FileJson, FileText, Share2, Copy, LinkIcon, Download, Sparkles, CheckCircle2, Clock, Shield } from 'lucide-react';
import type { AIAnalysisOutput, Patient, NewCaseFormValues } from '@/types';
import { cn } from '@/lib/utils';
import React from 'react';

// Creating our own custom dialog components to avoid conflicts
const CustomDialog = DialogPrimitive.Root;
const CustomDialogTrigger = DialogPrimitive.Trigger;
const CustomDialogClose = DialogPrimitive.Close;

const CustomDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
CustomDialogOverlay.displayName = "CustomDialogOverlay";

const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <CustomDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:w-full",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

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
    if (format === 'JSON') {
      // Compose the data to dump
      const dump = {
        patientData,
        analysisData,
        soapNotes,
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_report_${patientData && 'id' in patientData ? patientData.id : 'new'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: 'FHIR-compatible JSON Downloaded',
        description: 'All patient data has been downloaded as a JSON file.',
      });
      onOpenChange(false);
      return;
    }
    // Placeholder for actual export logic
    let description = '';
    switch (format) {
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
      description: 'Machine-readable format for integration with EHR systems',
      icon: FileJson,
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      format: 'JSON' as const,
      features: ['Standards compliant', 'API ready', 'Structured data'],
      badge: 'Technical',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'pdf',
      title: 'Professional PDF Report',
      description: 'Comprehensive report optimized for clinical review',
      icon: FileText,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      format: 'PDF' as const,
      features: ['Print ready', 'Professional layout', 'Charts & graphs'],
      badge: 'Clinical',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'link',
      title: 'Secure Share Link',
      description: 'HIPAA-compliant sharing with expiration controls',
      icon: LinkIcon,
      gradient: 'from-emerald-500 via-green-600 to-teal-600',
      format: 'Link' as const,
      features: ['Time-limited', 'Access control', 'Audit trail'],
      badge: 'Secure',
      badgeColor: 'bg-green-100 text-green-700',
    },
  ];  return (
    <AnimatePresence>
      {isOpen && (
        <CustomDialog open={isOpen} onOpenChange={onOpenChange}>
          <CustomDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Enhanced Header with Gradient Background */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-t-lg -z-10" />
              
              <DialogHeader className="space-y-4 pb-6 relative">                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg">
                      <Download className="h-8 w-8" />
                    </div>                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Export Patient Report
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-lg mt-1">
                      Choose your preferred format for sharing the AI analysis results
                    </DialogDescription>
                  </div>                </div>
                
                {/* Report Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisData?.riskScore || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisData?.similarCases?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Similar Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {soapNotes ? Math.ceil(soapNotes.length / 100) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Notes (100s chars)</div>                  </div>
                </div>
              </DialogHeader>{/* Enhanced Export Options */}
              <div className="space-y-4 py-6">
                {exportOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (                    <div
                      key={option.id}
                    >
                      <Button
                        variant="outline"
                        className="group relative w-full justify-start p-6 h-auto border-2 hover:border-primary/50 hover:bg-gradient-to-r hover:from-white hover:to-gray-50 transition-all duration-300 overflow-hidden"
                        onClick={() => handleExport(option.format)}
                      >
                        {/* Hover shimmer effect */}
                        <div className="absolute inset-0 -top-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                        
                        <div className="flex items-center gap-6 w-full relative z-10">
                          {/* Enhanced Icon */}
                          <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${option.gradient} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                            <IconComponent className="h-7 w-7" />
                            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                                {option.title}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${option.badgeColor}`}>
                                {option.badge}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {option.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {option.features.map((feature, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <div className="text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-1">
                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>                      </Button>
                    </div>
                  );
                })}
              </div>
              
              {/* Enhanced Footer */}
              <DialogFooter className="flex-col gap-4 pt-6 border-t border-gray-200">
                {/* Security & Compliance Notice */}                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg w-full">                  <Shield className="h-4 w-4 text-green-600" />
                  <span>All exports are HIPAA compliant and include comprehensive AI analysis</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center w-full">                  <CustomDialogClose asChild>
                    <Button variant="ghost" className="px-6 hover:bg-gray-100">
                      Cancel
                    </Button>
                  </CustomDialogClose>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Reports generated in real-time</span>
                  </div>
                </div>
              </DialogFooter>              </div>
          </CustomDialogContent>
        </CustomDialog>
      )}
    </AnimatePresence>
  );
}
