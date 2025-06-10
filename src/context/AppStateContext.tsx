'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AppState } from '@/types';
import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [analysisResult, setAnalysisResultState] = useState<AnalyzePatientSymptomsOutput | null>(null);

  // Persist analysisResult to sessionStorage to survive refreshes on the results page or new case page.
  // This is a simple solution. For more complex needs, consider dedicated state management libraries.
  React.useEffect(() => {
    const storedResult = sessionStorage.getItem('healthTrackAIAnalysisResult');
    if (storedResult) {
      try {
        setAnalysisResultState(JSON.parse(storedResult));
      } catch (e) {
        console.error("Failed to parse stored analysis result", e);
        sessionStorage.removeItem('healthTrackAIAnalysisResult');
      }
    }
  }, []);

  const setAnalysisResult = (result: AnalyzePatientSymptomsOutput | null) => {
    setAnalysisResultState(result);
    if (result) {
      sessionStorage.setItem('healthTrackAIAnalysisResult', JSON.stringify(result));
    } else {
      sessionStorage.removeItem('healthTrackAIAnalysisResult');
    }
  };
  
  const value = {
    analysisResult,
    setAnalysisResult,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
