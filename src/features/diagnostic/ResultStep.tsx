import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useDiagnostic } from '../../context/DiagnosticContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { callGeminiDiagnostic } from '../../api/gemini';
import { generateDailyStudyPlan } from '../../utils/generateStudyPlan';

/**
 * ResultStep – displays SAT and IELTS results with AI analysis.
 * Renders a fallback UI if results are missing.
 */
export const ResultStep: React.FC = () => {
  const { satResult, ieltsResult, setCurrentStep, setDailyStudyPlan, saveProgress } = useDiagnostic();
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fetch AI analysis when at least one result is available
  useEffect(() => {
    if (!satResult && !ieltsResult) return;
    
    // Generate and save Daily Study Plan
    const satWeaknesses = satResult?.weaknesses || [];
    const ieltsWeaknesses = ieltsResult?.weaknesses || [];
    const plan = generateDailyStudyPlan(satWeaknesses, ieltsWeaknesses);
    setDailyStudyPlan(plan);
    saveProgress();

    setLoading(true);
    const prompt = `Provide a concise analysis of the following test results.\n${
      satResult ? `SAT: ${JSON.stringify(satResult)}\n` : ''
    }${ieltsResult ? `IELTS: ${JSON.stringify(ieltsResult)}` : ''}`;
    
    callGeminiDiagnostic([{ role: 'user', content: prompt }])
      .then(res => setAiResult(res))
      .catch(err => {
        console.error('Diagnostic error', err);
        setAiResult('Error generating AI report. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [satResult, ieltsResult]);

  // Fallback when both results are missing
  if (!satResult && !ieltsResult) {
    return (
      <Card className="max-w-3xl mx-auto p-6 bg-white/90 border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Results Not Available</h2>
        <p className="text-gray-600 mb-6">
          It looks like the diagnostic data is missing. Please restart the wizard.
        </p>
        <Button variant="primary" onClick={() => setCurrentStep('survey')}>
          Restart Diagnostic
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Loading indicator */}
      {loading && (
        <Card className="bg-indigo-100 border border-indigo-200 p-4">
          <p className="text-indigo-800 font-medium">AI is analyzing your result...</p>
        </Card>
      )}

      {/* AI analysis result */}
      {aiResult && (
        <div className="relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
          <Card className="bg-white rounded-xl shadow-none p-8">
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Comprehensive AI Diagnostic Report
              </h3>
            </div>
            <div className="prose prose-lg prose-indigo max-w-none text-slate-700 leading-relaxed marker:text-indigo-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiResult}
              </ReactMarkdown>
            </div>
          </Card>
        </div>
      )}

      {/* SAT Result Card */}
      {satResult && (
        <Card className="bg-white/95 border border-gray-100 shadow-lg">
          <h3 className="text-2xl font-semibold mb-3 text-indigo-800">
            SAT Mock Result – Overall {satResult.overallScore}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-medium">Math</p>
              <p className="text-xl font-bold text-indigo-600">{satResult.mathScore}</p>
            </div>
            <div>
              <p className="font-medium">Reading & Writing</p>
              <p className="text-xl font-bold text-indigo-600">{satResult.readingWritingScore}</p>
            </div>
          </div>
          {(satResult.weaknesses || []).length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-1">Weak Areas</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {(satResult.weaknesses || []).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {(satResult.recommendations || []).length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-1">Recommendations</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {(satResult.recommendations || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* IELTS Result Card */}
      {ieltsResult && (
        <Card className="bg-white/95 border border-gray-100 shadow-lg">
          <h3 className="text-2xl font-semibold mb-3 text-indigo-800">
            IELTS Mock Result – Overall Band {ieltsResult.overallBand}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-medium">Listening</p>
              <p className="text-xl font-bold text-indigo-600">{ieltsResult.listeningBand}</p>
            </div>
            <div>
              <p className="font-medium">Reading</p>
              <p className="text-xl font-bold text-indigo-600">{ieltsResult.readingBand}</p>
            </div>
            <div>
              <p className="font-medium">Writing</p>
              <p className="text-xl font-bold text-indigo-600">{ieltsResult.writingBand}</p>
            </div>
            <div>
              <p className="font-medium">Speaking</p>
              <p className="text-xl font-bold text-indigo-600">{ieltsResult.speakingBand}</p>
            </div>
          </div>
          {(ieltsResult.weaknesses || []).length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-1">Weak Areas</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {(ieltsResult.weaknesses || []).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {(ieltsResult.recommendations || []).length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-1">Recommendations</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {(ieltsResult.recommendations || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Return to Dashboard Button */}
      <div className="pt-8 pb-12 flex justify-center space-x-4">
        <Button variant="outline" size="lg" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button variant="primary" size="lg" onClick={() => navigate('/outcome')}>
          View Final Outcome & Study Plan →
        </Button>
      </div>
    </div>
  );
};
