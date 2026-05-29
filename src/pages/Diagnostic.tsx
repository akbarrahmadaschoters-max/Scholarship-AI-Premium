import React from 'react';
import { DiagnosticProvider, useDiagnostic } from '../context/DiagnosticContext';
import { SurveyStep } from '../features/diagnostic/SurveyStep';

import { SatStep } from '../features/diagnostic/SatStep';
import { ResultStep } from '../features/diagnostic/ResultStep';


import { IeltsStep } from '../features/diagnostic/IeltsStep';


import { SelectionStep } from '../features/diagnostic/SelectionStep';
import { useSearchParams } from 'react-router-dom';

const DiagnosticEngineContent = () => {
  const { currentStep, setCurrentStep } = useDiagnostic();
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('mode') === 'retake') {
      setCurrentStep('selection');
      // Remove the query param so it doesn't get stuck in retake mode on reloads
      setSearchParams({});
    }
  }, [searchParams, setCurrentStep, setSearchParams]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Diagnostic Placement Engine</h1>
        </div>
      </div>
      
      {currentStep === 'selection' && <SelectionStep />}
      {currentStep === 'survey' && <SurveyStep />}
      {currentStep === 'sat' && <SatStep />}
      {currentStep === 'ielts' && <IeltsStep />}
      {currentStep === 'results' && <ResultStep />}
    </div>
  );
};

export const Diagnostic = () => {
  return (
    <DiagnosticProvider>
      <DiagnosticEngineContent />
    </DiagnosticProvider>
  );
};
