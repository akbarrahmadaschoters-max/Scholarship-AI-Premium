import React from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useDiagnostic } from '../../context/DiagnosticContext';

export const SelectionStep: React.FC = () => {
  const { setCurrentStep, setSatResult, setIeltsResult, setSatAnswers, setIeltsAnswers, saveProgress } = useDiagnostic();

  const handleRetakeSAT = () => {
    // Clear SAT data to start fresh
    setSatResult(undefined);
    setSatAnswers({});
    localStorage.removeItem('sat_result');
    // Clear the daily study plan since one test result is changing
    localStorage.removeItem('daily_study_plan');
    setCurrentStep('sat');
    saveProgress();
  };

  const handleRetakeIELTS = () => {
    // Clear IELTS data to start fresh
    setIeltsResult(undefined);
    setIeltsAnswers({});
    localStorage.removeItem('ielts_result');
    // Clear the daily study plan since one test result is changing
    localStorage.removeItem('daily_study_plan');
    setCurrentStep('ielts');
    saveProgress();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-dark-900)] mb-3">Diagnostic Override</h2>
        <p className="text-[var(--color-dark-500)] max-w-xl mx-auto text-lg">
          Are you sure you want to start the test? This will override your previous diagnostic test results for the selected module.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* SAT Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border border-transparent hover:border-indigo-200 cursor-pointer" onClick={handleRetakeSAT}>
          <div className="p-8 text-center flex flex-col items-center h-full">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl font-extrabold text-indigo-600">SAT</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Retake SAT Mock Test</h3>
            <p className="text-slate-500 mb-8 flex-1">
              Reset your previous SAT diagnostic scores and start a fresh assessment.
            </p>
            <Button variant="primary" className="w-full" onClick={(e) => { e.stopPropagation(); handleRetakeSAT(); }}>
              Start SAT Test
            </Button>
          </div>
        </Card>

        {/* IELTS Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border border-transparent hover:border-blue-200 cursor-pointer" onClick={handleRetakeIELTS}>
          <div className="p-8 text-center flex flex-col items-center h-full">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl font-extrabold text-blue-600">IELTS</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Retake IELTS Mock Test</h3>
            <p className="text-slate-500 mb-8 flex-1">
              Reset your previous IELTS diagnostic scores and start a fresh assessment.
            </p>
            <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 shadow-blue-200" onClick={(e) => { e.stopPropagation(); handleRetakeIELTS(); }}>
              Start IELTS Test
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
