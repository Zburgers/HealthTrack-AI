'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  patientName: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  isDeleting = false
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deletionReason, setDeletionReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!isDeleting) {
      setCurrentStep(1);
      setDeletionReason('');
      setError('');
      onClose();
    }
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleConfirm = async () => {
    if (deletionReason.trim().length < 10) {
      setError('Deletion reason must be at least 10 characters long.');
      return;
    }

    setError('');
    try {
      await onConfirm(deletionReason);
      // Modal will be closed by parent component after successful deletion
    } catch (err) {
      setError('Failed to delete patient. Please try again.');
    }
  };

  const isReasonValid = deletionReason.trim().length >= 10;  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl p-6 mx-4 w-full max-w-md"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '1.5rem',
              margin: '0 1rem',
              width: '100%',
              maxWidth: '28rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-bold text-red-600">Archive Patient Case</h2>
              </div>
              
              <p className="text-sm text-gray-600">
                This action will archive the patient case. The data will be preserved but marked as deleted.
              </p>

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-red-900">
                            Are you sure you want to archive this case?
                          </h4>
                          <p className="text-sm text-red-800">
                            You are about to archive the case for <strong>{patientName}</strong>. 
                            This action will mark the patient as deleted but preserve all data for compliance purposes.
                          </p>
                          <div className="mt-3 text-xs text-red-700 space-y-1">
                            <p>• The patient will no longer appear in the main dashboard</p>
                            <p>• All medical data will be preserved for audit purposes</p>
                            <p>• This action can be reversed by an administrator</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label htmlFor="deletion-reason" className="text-sm font-medium text-gray-900">
                        Reason for Archiving <span className="text-red-600">*</span>
                      </label>                      <textarea
                        id="deletion-reason"
                        placeholder="Please provide a reason for archiving this patient case (minimum 10 characters)..."
                        value={deletionReason}
                        onChange={(e) => {
                          setDeletionReason(e.target.value);
                          if (error) setError('');
                        }}                        className={cn(
                          "w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500",
                          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
                          isDeleting && "bg-gray-100 text-gray-600 cursor-not-allowed"
                        )}
                        disabled={isDeleting}
                      />                      <div className="flex justify-between items-center text-xs">
                        <span className={cn(
                          "font-medium",
                          deletionReason.length >= 10 ? "text-green-600" : "text-gray-600"
                        )}>
                          {deletionReason.length}/10 characters minimum
                        </span>
                        {error && (
                          <span className="text-red-600 font-medium">{error}</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                          <strong>Medical Compliance:</strong> Provide a clear reason for archiving this case 
                          to maintain proper medical records and audit trails as required by healthcare regulations.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {currentStep === 1 && (
                  <>                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isDeleting}
                      className="w-full sm:w-auto border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isDeleting}
                      className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}

                {currentStep === 2 && (
                  <>                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isDeleting}
                      className="w-full sm:w-auto border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirm}
                      disabled={!isReasonValid || isDeleting}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Archiving...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archive Case
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default DeleteConfirmationModal;
