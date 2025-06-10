
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AppState } from '@/types';
import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with undefined to distinguish from explicitly null
  const [analysisResult, setAnalysisResultState] = useState<AnalyzePatientSymptomsOutput | null | undefined>(undefined);
  const [analysisReturnPath, setAnalysisReturnPathState] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    console.log('AppStateContext: useEffect reading from sessionStorage');
    try {
      const storedResultItem = sessionStorage.getItem('healthTrackAIAnalysisResult');
      if (storedResultItem) {
        const parsedResult = JSON.parse(storedResultItem);
        setAnalysisResultState(parsedResult);
        console.log('AppStateContext: Loaded analysisResult from sessionStorage:', parsedResult);
      } else {
        console.log('AppStateContext: No analysisResult found in sessionStorage. Setting to null.');
        setAnalysisResultState(null); 
      }
    } catch (e) {
      console.error("AppStateContext: Failed to parse stored analysis result from sessionStorage", e);
      sessionStorage.removeItem('healthTrackAIAnalysisResult'); 
      setAnalysisResultState(null);
    }

    try {
      const storedReturnPathItem = sessionStorage.getItem('healthTrackAIAnalysisReturnPath');
      if (storedReturnPathItem && storedReturnPathItem !== 'null') { // Ensure 'null' string isn't treated as a path
        setAnalysisReturnPathState(storedReturnPathItem);
        console.log('AppStateContext: Loaded analysisReturnPath from sessionStorage:', storedReturnPathItem);
      } else {
        console.log('AppStateContext: No analysisReturnPath found in sessionStorage or it was "null". Setting to null.');
        setAnalysisReturnPathState(null);
      }
    } catch (e) {
      console.error("AppStateContext: Failed to load/parse stored analysisReturnPath from sessionStorage", e);
      sessionStorage.removeItem('healthTrackAIAnalysisReturnPath');
      setAnalysisReturnPathState(null);
    }
  }, []);

  const setAnalysisResult = (
    resultData: AnalyzePatientSymptomsOutput | null,
    returnPathForThisResult: string | null // Explicitly pass null if it's a new case with no prior page or to clear it
  ) => {
    console.log('AppStateContext: setAnalysisResult called with result:', resultData, 'and returnPath:', returnPathForThisResult);
    
    setAnalysisResultState(resultData);
    if (resultData) {
      sessionStorage.setItem('healthTrackAIAnalysisResult', JSON.stringify(resultData));
    } else {
      sessionStorage.removeItem('healthTrackAIAnalysisResult');
      console.log('AppStateContext: Cleared analysisResult from sessionStorage.');
    }

    setAnalysisReturnPathState(returnPathForThisResult); 
    if (returnPathForThisResult) { 
      sessionStorage.setItem('healthTrackAIAnalysisReturnPath', returnPathForThisResult);
    } else { 
      sessionStorage.removeItem('healthTrackAIAnalysisReturnPath');
      console.log('AppStateContext: Cleared analysisReturnPath from sessionStorage.');
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
  // Provide default nulls if context values are still undefined during initial render cycle
  return {
    analysisResult: context.analysisResult === undefined ? null : context.analysisResult,
    analysisReturnPath: context.analysisReturnPath === undefined ? null : context.analysisReturnPath,
    setAnalysisResult: context.setAnalysisResult,
  };
};
