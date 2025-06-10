
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AppState } from '@/types';
import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [analysisResult, setAnalysisResultState] = useState<AnalyzePatientSymptomsOutput | null>(null);
  const [analysisReturnPath, setAnalysisReturnPathState] = useState<string | null>(null);

  useEffect(() => {
    console.log('AppStateContext: useEffect reading from sessionStorage');
    const storedResultItem = sessionStorage.getItem('healthTrackAIAnalysisResult');
    if (storedResultItem) {
      try {
        const parsedResult = JSON.parse(storedResultItem);
        setAnalysisResultState(parsedResult);
        console.log('AppStateContext: Loaded analysisResult from sessionStorage:', parsedResult);
      } catch (e) {
        console.error("AppStateContext: Failed to parse stored analysis result from sessionStorage", e);
        sessionStorage.removeItem('healthTrackAIAnalysisResult'); 
        setAnalysisResultState(null);
      }
    } else {
      console.log('AppStateContext: No analysisResult found in sessionStorage.');
      setAnalysisResultState(null); // Ensure state is null if not in session storage
    }

    const storedReturnPathItem = sessionStorage.getItem('healthTrackAIAnalysisReturnPath');
    if (storedReturnPathItem && storedReturnPathItem !== 'null') {
      setAnalysisReturnPathState(storedReturnPathItem);
      console.log('AppStateContext: Loaded analysisReturnPath from sessionStorage:', storedReturnPathItem);
    } else {
      console.log('AppStateContext: No analysisReturnPath found in sessionStorage or it was "null".');
      setAnalysisReturnPathState(null); 
    }
  }, []);

  const setAnalysisResult = (
    resultData: AnalyzePatientSymptomsOutput | null,
    returnPathForThisResult?: string | null 
  ) => {
    console.log('AppStateContext: setAnalysisResult called with:', resultData, 'and returnPath:', returnPathForThisResult);
    setAnalysisResultState(resultData);
    if (resultData) {
      sessionStorage.setItem('healthTrackAIAnalysisResult', JSON.stringify(resultData));
    } else {
      sessionStorage.removeItem('healthTrackAIAnalysisResult');
    }

    // If returnPathForThisResult is explicitly provided (string or null), update it.
    // If it's undefined (not passed), the current analysisReturnPath state and sessionStorage item remain untouched.
    if (typeof returnPathForThisResult !== 'undefined') {
      setAnalysisReturnPathState(returnPathForThisResult); 
      if (returnPathForThisResult) { 
        sessionStorage.setItem('healthTrackAIAnalysisReturnPath', returnPathForThisResult);
      } else { 
        sessionStorage.removeItem('healthTrackAIAnalysisReturnPath');
      }
    }
  };
  
  const value = {
    analysisResult,
    analysisReturnPath,
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
