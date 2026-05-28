import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiagnosticProvider, useDiagnostic } from '../context/DiagnosticContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { generateDailyStudyPlan } from '../utils/generateStudyPlan';
import { generatePDFReport } from '../utils/generatePDF';

const OutcomeContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    satResult, ieltsResult, surveyData,
    dailyStudyPlan, setDailyStudyPlan,
    saveProgress,
  } = useDiagnostic();

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Load profile
  useEffect(() => {
    // We don't have AuthContext here natively, but we can assume "guest" or fetch it.
    // Actually, let's just grab the most recent one if we don't have the user ID easily, 
    // or just assume they are using localStorage keys we can find.
    // Wait, let's just grab it from localStorage if we know the key.
    // We'll search for the first key starting with 'student_profiles_'
    const profileKey = Object.keys(localStorage).find(k => k.startsWith('student_profiles_'));
    if (profileKey) {
      try {
        setProfile(JSON.parse(localStorage.getItem(profileKey) || ''));
      } catch(e){}
    }
  }, []);

  // Generate study plan on mount if not already generated
  useEffect(() => {
    if (dailyStudyPlan.length === 0 && surveyData.satDate) {
      const ieltsWeak = ieltsResult?.weaknesses || [];
      const satWeak = satResult?.weaknesses || [];
      const plan = generateDailyStudyPlan(satWeak, ieltsWeak);
      setDailyStudyPlan(plan);
    }
  }, []);

  // Fetch AI summary
  useEffect(() => {
    if (!satResult && !ieltsResult) return;
    setLoading(true);
    const prompt = `You are an expert education counselor. Based on these diagnostic results, provide a concise 3-paragraph analysis covering: 1) Overall readiness assessment, 2) Key strengths and weaknesses, 3) Prioritized improvement recommendations.\n\nSAT: ${JSON.stringify(satResult)}\nIELTS: ${JSON.stringify(ieltsResult)}`;
    fetch('/api/gemini/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiSummary(text || 'AI analysis complete. Review your scores below for detailed insights.');
      })
      .catch(() => setAiSummary('Review your scores below for detailed insights into your readiness.'))
      .finally(() => setLoading(false));
  }, [satResult, ieltsResult]);

  // Save after plan generation
  useEffect(() => {
    if (dailyStudyPlan.length > 0) saveProgress();
  }, [dailyStudyPlan]);

  // Compute overall readiness
  const displaySatScore = profile?.satScore || (satResult ? satResult.scoreRange : '—');
  const displayIeltsScore = profile?.ieltsScore || (ieltsResult ? ieltsResult.overallBand.toFixed(1) : '—');

  const ieltsScore = parseFloat(displayIeltsScore) || (ieltsResult?.overallBand || 0);
  const satTotal = parseInt(displaySatScore.toString().split('-')[0]) || (satResult?.overallScore ? parseInt(satResult.overallScore.split('-')[0]) : 0);
  
  const readinessScore = Math.min(100, Math.round(
    (ieltsScore / 9) * 50 + (satTotal / 1600) * 50
  ));

  const allWeaknesses = [
    ...(satResult?.weaknesses || []).map(w => `SAT: ${w}`),
    ...(ieltsResult?.weaknesses || []).map(w => `IELTS: ${w}`),
  ];
  const allRecommendations = [
    ...(satResult?.recommendations || []),
    ...(ieltsResult?.recommendations || []),
  ];

  // Scholarship readiness tier
  const scholarshipTier = readinessScore >= 80 ? 'Excellent' : readinessScore >= 60 ? 'Good' : readinessScore >= 40 ? 'Developing' : 'Needs Work';
  const scholarshipColor = readinessScore >= 80 ? 'text-emerald-600' : readinessScore >= 60 ? 'text-blue-600' : readinessScore >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Diagnostic Complete</p>
          <h1 className="text-4xl font-black mb-3">Your Readiness Report</h1>
          <p className="text-indigo-200 text-lg">Comprehensive analysis of your SAT & IELTS performance</p>
        </div>
      </header>

      <main id="report-content" className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Overall Readiness Score */}
        <Card className="p-8 mb-8 bg-white shadow-xl border-0 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                <circle cx="60" cy="60" r="52" stroke="url(#grad)" strokeWidth="8" fill="none"
                  strokeDasharray={`${readinessScore * 3.27} 327`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-black text-slate-900">{readinessScore}</span>
                <span className="text-xs text-slate-500 font-bold">/100</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Overall Readiness</h2>
              <p className="text-slate-500 mb-4">Based on your SAT and IELTS diagnostic performance</p>
              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${scholarshipColor} bg-opacity-10`}
                  style={{ backgroundColor: 'currentColor', color: 'inherit', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
                  {/* Using inline workaround */}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                  readinessScore >= 60 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  Scholarship: {scholarshipTier}
                </span>
                {ieltsResult && (
                  <span className="px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 bg-blue-50 text-blue-700">
                    CEFR: {ieltsResult.cefrLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Summary */}
        {loading && (
          <Card className="p-5 mb-6 bg-indigo-50 border border-indigo-100 animate-pulse">
            <p className="text-indigo-700 font-medium">🤖 AI is analyzing your results…</p>
          </Card>
        )}
        {aiSummary && !loading && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">AI</span>
              AI Readiness Analysis
            </h3>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{aiSummary}</p>
          </Card>
        )}

        {/* Score Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* IELTS Prediction */}
          <Card className="p-0 overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5 flex justify-between items-end">
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">IELTS Actual Score</p>
                <p className="text-4xl font-black mt-1">{profile?.ieltsScore || '—'}</p>
              </div>
              {ieltsResult && (
                <div className="text-right">
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Diagnostic Prediction</p>
                  <p className="text-2xl font-bold">{ieltsResult.overallBand.toFixed(1)}</p>
                </div>
              )}
            </div>
            {ieltsResult ? (
              <div className="p-5 space-y-3">
                {[
                  { label: 'Listening', score: ieltsResult.listeningBand },
                  { label: 'Reading', score: ieltsResult.readingBand },
                  { label: 'Writing', score: ieltsResult.writingBand },
                  { label: 'Speaking', score: ieltsResult.speakingBand },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{s.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(s.score / 9) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 w-8 text-right">{s.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-slate-400 text-sm">Complete IELTS diagnostic to see predictions</div>
            )}
          </Card>

          {/* SAT Prediction */}
          <Card className="p-0 overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-violet-600 to-purple-500 text-white p-5 flex justify-between items-end">
              <div>
                <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">SAT Actual Score</p>
                <p className="text-4xl font-black mt-1">{profile?.satScore || '—'}</p>
              </div>
              {satResult && (
                <div className="text-right">
                  <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">Diagnostic Prediction</p>
                  <p className="text-2xl font-bold">{satResult.overallScore || satResult.scoreRange}</p>
                </div>
              )}
            </div>
            {satResult ? (
              <div className="p-5 space-y-3">
                {[
                  { label: 'Math', score: satResult.mathScore },
                  { label: 'Reading & Writing', score: satResult.readingWritingScore },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-medium text-slate-600">{s.label}</span>
                    <span className="text-sm font-bold text-slate-800">{s.score}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    satResult.classification === 'High' ? 'bg-emerald-50 text-emerald-700' :
                    satResult.classification === 'Mid' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {satResult.classification} Performance
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 text-slate-400 text-sm">Complete SAT diagnostic to see predictions</div>
            )}
          </Card>
        </div>

        {/* Weaknesses & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-red-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-black">!</span>
              Weakness Analysis
            </h3>
            {allWeaknesses.length > 0 ? (
              <ul className="space-y-2">
                {allWeaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No significant weaknesses identified</p>
            )}
          </Card>

          <Card className="p-6 border-emerald-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
              Improvement Plan
            </h3>
            {allRecommendations.length > 0 ? (
              <ul className="space-y-2">
                {allRecommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Complete diagnostics to get personalized recommendations</p>
            )}
          </Card>
        </div>

        {/* Daily Study Plan */}
        <Card className="p-6 mb-8 border-0 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-1">📅 Daily Study Plan</h3>
          <p className="text-sm text-slate-500 mb-6">Based on your test dates, availability, and diagnostic weaknesses</p>

          {dailyStudyPlan.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {dailyStudyPlan.slice(0, 14).map((day, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-bold text-indigo-600">{day.day}</span>
                      <span className="text-sm text-slate-400 ml-2">{day.date}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {day.tasks.reduce((sum, t) => sum + t.duration, 0)} min total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {day.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'high' ? 'bg-red-400' :
                          task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{task.focus}: {task.title}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{task.duration}m</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          task.type === 'mock_test' ? 'bg-purple-100 text-purple-700' :
                          task.type === 'drilling' ? 'bg-blue-100 text-blue-700' :
                          task.type === 'essay_practice' ? 'bg-amber-100 text-amber-700' :
                          task.type === 'speaking_practice' ? 'bg-emerald-100 text-emerald-700' :
                          task.type === 'review' ? 'bg-slate-100 text-slate-600' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {task.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {dailyStudyPlan.length > 14 && (
                <p className="text-center text-sm text-slate-400 pt-2">
                  + {dailyStudyPlan.length - 14} more days in your plan
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Study plan will be generated after completing diagnostics</p>
          )}
        </Card>

        {/* Scholarship Readiness */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl">
          <h3 className="text-xl font-bold mb-4">🎓 Scholarship & University Readiness</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Readiness Level</p>
              <p className="text-2xl font-black">{scholarshipTier}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Competitive For</p>
              <p className="text-lg font-bold">
                {readinessScore >= 80 ? 'Top 20 Universities' :
                 readinessScore >= 60 ? 'Top 50 Universities' :
                 readinessScore >= 40 ? 'Top 100 Universities' : 'Regional Universities'}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Next Milestone</p>
              <p className="text-lg font-bold">
                {readinessScore >= 80 ? 'Polish Essays' :
                 readinessScore >= 60 ? 'Raise Test Scores' :
                 'Build Foundation'}
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 pb-10">
          <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')} className="shadow-lg shadow-indigo-200">
            ← Back to Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-sm"
            onClick={() => generatePDFReport(satResult, ieltsResult, dailyStudyPlan)}
          >
            📄 Download PDF Report
          </Button>
        </div>
      </main>
    </div>
  );
};

export const Outcome: React.FC = () => {
  return (
    <DiagnosticProvider>
      <OutcomeContent />
    </DiagnosticProvider>
  );
};
