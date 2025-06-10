
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AppState, Patient } from '@/types';
import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';
import type { NewCaseFormValues } from '@/components/new-case/NewCaseForm';

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [analysisResult, setAnalysisResultState] = useState<AnalyzePatientSymptomsOutput | null | undefined>(undefined);
  const [analysisReturnPath, setAnalysisReturnPathState] = useState<string | null | undefined>(undefined);
  const [currentCaseDisplayData, setCurrentCaseDisplayDataState] = useState<Patient | NewCaseFormValues | null | undefined>(undefined);

  useEffect(() => {
    console.log('AppStateContext: useEffect reading from sessionStorage');
    try {
      const storedResultItem = sessionStorage.getItem('healthTrackAIAnalysisResult');
      setAnalysisResultState(storedResultItem ? JSON.parse(storedResultItem) : null);
    } catch (e) {
      console.error("AppStateContext: Failed to parse stored analysis result", e);
      sessionStorage.removeItem('healthTrackAIAnalysisResult');
      setAnalysisResultState(null);
    }

    try {
      const storedReturnPathItem = sessionStorage.getItem('healthTrackAIAnalysisReturnPath');
      setAnalysisReturnPathState(storedReturnPathItem && storedReturnPathItem !== 'null' ? storedReturnPathItem : null);
    } catch (e) {
      console.error("AppStateContext: Failed to load/parse stored analysisReturnPath", e);
      sessionStorage.removeItem('healthTrackAIAnalysisReturnPath');
      setAnalysisReturnPathState(null);
    }

    try {
      const storedCaseDataItem = sessionStorage.getItem('healthTrackAICaseDisplayData');
      setCurrentCaseDisplayDataState(storedCaseDataItem ? JSON.parse(storedCaseDataItem) : null);
    } catch (e) {
      console.error("AppStateContext: Failed to parse stored case display data", e);
      sessionStorage.removeItem('healthTrackAICaseDisplayData');
      setCurrentCaseDisplayDataState(null);
    }
  }, []);

  const setAnalysisResult = (
    resultData: AnalyzePatientSymptomsOutput | null,
    returnPathForThisResult?: string | null,
    caseDisplayData?: Patient | NewCaseFormValues | null
  ) => {
    console.log('AppStateContext: setAnalysisResult called with:', { resultData, returnPathForThisResult, caseDisplayData });

    setAnalysisResultState(resultData);
    if (resultData) {
      sessionStorage.setItem('healthTrackAIAnalysisResult', JSON.stringify(resultData));
    } else {
      sessionStorage.removeItem('healthTrackAIAnalysisResult');
    }

    setAnalysisReturnPathState(returnPathForThisResult || null);
    if (returnPathForThisResult) {
      sessionStorage.setItem('healthTrackAIAnalysisReturnPath', returnPathForThisResult);
    } else {
      sessionStorage.removeItem('healthTrackAIAnalysisReturnPath');
    }

    setCurrentCaseDisplayDataState(caseDisplayData || null);
    if (caseDisplayData) {
      sessionStorage.setItem('healthTrackAICaseDisplayData', JSON.stringify(caseDisplayData));
    } else {
      sessionStorage.removeItem('healthTrackAICaseDisplayData');
    }
  };

  const value = {
    analysisResult,
    analysisReturnPath,
    currentCaseDisplayData,
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
  return {
    analysisResult: context.analysisResult,
    analysisReturnPath: context.analysisReturnPath,
    currentCaseDisplayData: context.currentCaseDisplayData,
    setAnalysisResult: context.setAnalysisResult,
  };
};
