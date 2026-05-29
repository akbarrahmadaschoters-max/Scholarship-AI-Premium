import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { SatResult, IeltsResult, DayPlan } from '../context/DiagnosticContext';
import { generatePDFReport } from '../utils/generatePDF';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import universitiesData from '../data/universities.json';

export const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Read results from localStorage (since DiagnosticProvider only wraps /diagnostic)
  const [satResult, setSatResult] = useState<SatResult | undefined>();
  const [ieltsResult, setIeltsResult] = useState<IeltsResult | undefined>();
  const [studyPlan, setStudyPlan] = useState<DayPlan[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('diagnostic_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.satResult) setSatResult(parsed.satResult);
        if (parsed.ieltsResult) setIeltsResult(parsed.ieltsResult);
        if (parsed.dailyStudyPlan) setStudyPlan(parsed.dailyStudyPlan);
      }
      // Also try individual keys
      const sr = localStorage.getItem('sat_result');
      if (sr) setSatResult(JSON.parse(sr));
      const ir = localStorage.getItem('ielts_result');
      if (ir) setIeltsResult(JSON.parse(ir));
      const sp = localStorage.getItem('daily_study_plan');
      if (sp) setStudyPlan(JSON.parse(sp));

      const userId = currentUser?.uid || 'guest';
      const p = localStorage.getItem(`student_profiles_${userId}`);
      if (p) setProfile(JSON.parse(p));
      
      // Fetch from Firebase
      if (currentUser) {
        const fetchFirebase = async () => {
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data.satResult) setSatResult(data.satResult);
              if (data.ieltsResult) setIeltsResult(data.ieltsResult);
            }
          } catch (e) {
            console.error('Failed to load from firebase', e);
          }
        };
        fetchFirebase();
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const diagnosticComplete = !!(satResult && ieltsResult);
  
  // Use profile score if available, otherwise use diagnostic result
  const displaySatScore = profile?.satScore || (satResult ? satResult.scoreRange : '—');
  const displayIeltsScore = profile?.ieltsScore || (ieltsResult ? ieltsResult.overallBand.toFixed(1) : '—');

  const satTotal = parseInt(displaySatScore.toString().split('-')[0]) || (satResult?.overallScore ? parseInt(satResult.overallScore.split('-')[0]) : 0);
  const ieltsScore = parseFloat(displayIeltsScore) || (ieltsResult?.overallBand || 0);

  const readinessScore = diagnosticComplete || profile
    ? Math.min(100, Math.round((ieltsScore / 9) * 50 + (satTotal / 1600) * 50))
    : 0;

  const topUniversitiesData = universitiesData.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Navigation */}

      <main id="report-content" className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Command Center</h2>
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">UPDATED FLOW ACTIVE</span>
            </div>
            <p className="mt-2 text-base text-slate-500 font-medium">Your personalized AI roadmap for global university admissions.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              className="shadow-lg shadow-indigo-200"
              onClick={() => navigate(diagnosticComplete ? '/diagnostic?mode=retake' : '/diagnostic')}
            >
              {diagnosticComplete ? 'Retake Diagnostic' : 'Start Diagnostic Test'}
            </Button>
            {(diagnosticComplete || profile) && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/outcome')}
                >
                  View Full Report →
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => generatePDFReport(satResult, ieltsResult, studyPlan)}
                  className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                  📄 Generate PDF
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => navigate('/premium-dashboard')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg shadow-amber-200/50 flex items-center gap-2"
                >
                  <span>★</span> AI Premium Matching
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Top Metrics / Progress Hero Card */}
        <div className="mb-12 rounded-[var(--border-radius-xl)] bg-[linear-gradient(135deg,#0F172A_0%,#1E1B4B_50%,#0F172A_100%)] p-8 md:p-10 relative overflow-hidden shadow-[var(--shadow-lg)]">
          {/* Background Decorations */}
          <div className="w-[300px] h-[300px] bg-[rgba(99,102,241,0.15)] rounded-full absolute -top-[80px] -right-[60px] blur-[60px] pointer-events-none" />
          <div className="w-[200px] h-[200px] bg-[rgba(139,92,246,0.10)] rounded-full absolute top-[40px] right-[80px] blur-[40px] pointer-events-none" />

          {/* Hero Layout */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-8 md:gap-4 lg:gap-8 relative z-10">
            
            {/* Column 1 (40%) - Progress */}
            <div className="md:col-span-4 flex flex-col justify-center">
              <span className="text-[11px] tracking-[0.08em] text-[var(--color-dark-300)] uppercase font-bold mb-5 block">
                PREPARATION PROGRESS
              </span>
              <div className="flex items-center gap-6">
                <div className="relative w-[80px] h-[80px] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary-light)" strokeWidth="3" strokeDasharray={`${readinessScore}, 100`} className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex items-center justify-center">
                    <span className="text-[18px] font-bold text-white">{readinessScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[20px] font-bold text-white leading-tight mb-1.5">{readinessScore}% Complete</h4>
                  <p className="text-[13px] text-[var(--color-dark-300)] mb-3">{readinessScore >= 70 ? 'Great progress! Focus on essays.' : 'Keep improving your scores'}</p>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full transition-all duration-1000 ease-out" style={{ width: `${readinessScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:flex md:col-span-1 justify-center items-center">
              <div className="w-[1px] h-[80px] bg-white/10" />
            </div>

            {/* Column 2 (30%) - IELTS Score */}
            <div className="md:col-span-2 flex flex-col justify-center">
              <span className="text-[11px] tracking-[0.08em] text-[var(--color-dark-300)] uppercase font-bold mb-3 block">
                IELTS SCORE
              </span>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-[52px] font-[800] text-white tracking-[-0.02em] leading-none">
                  {displayIeltsScore}
                </span>
                {ieltsResult?.cefrLevel && (
                  <span className="bg-[rgba(99,102,241,0.2)] text-[var(--color-primary-light)] px-2.5 py-0.5 rounded-[4px] text-[12px] font-bold mb-2">
                    {ieltsResult.cefrLevel}
                  </span>
                )}
              </div>
              <div className="mt-auto">
                <div className="text-[12px] text-[var(--color-dark-300)] font-medium mb-2">
                  Target: 6.5
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min((ieltsScore / 9) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:flex md:col-span-1 justify-center items-center">
              <div className="w-[1px] h-[80px] bg-white/10" />
            </div>

            {/* Column 3 (30%) - SAT Score */}
            <div className="md:col-span-2 flex flex-col justify-center">
              <span className="text-[11px] tracking-[0.08em] text-[var(--color-dark-300)] uppercase font-bold mb-3 block">
                SAT SCORE
              </span>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-[52px] font-[800] text-white tracking-[-0.02em] leading-none">
                  {displaySatScore === '—' ? '—' : satTotal}
                </span>
                {satResult?.classification && (
                  <span className="bg-[rgba(245,158,11,0.15)] text-[#FCD34D] px-2.5 py-0.5 rounded-[4px] text-[12px] font-bold mb-2 whitespace-nowrap">
                    {satResult.classification} Range
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--color-dark-300)] font-medium mb-3 mt-1">
                {satResult?.scoreRange ? `~${satResult.scoreRange.split('-')[1]} upper estimate` : 'Not tested'}
              </p>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto">
                <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min((satTotal / 1600) * 100, 100)}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* SAT Diagnostic Card (DARK FEATURE CARD) */}
          <div className="bg-[var(--color-dark-900)] border border-[rgba(255,255,255,0.06)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[rgba(255,255,255,0.06)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary-light)] font-bold">SAT DIAGNOSTIC</span>
                <span className="text-[20px]">📝</span>
              </div>
              <h3 className="text-[18px] font-[600] text-white">Digital SAT Practice Test</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col">
              {satResult ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-white/80">Math</span>
                    <span className="text-[24px] font-bold text-white">{satResult.mathScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-white/80">Reading & Writing</span>
                    <span className="text-[24px] font-bold text-white">{satResult.readingWritingScore}</span>
                  </div>
                  <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] mt-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      satResult.classification === 'High' ? 'bg-emerald-500/20 text-emerald-300' : 
                      satResult.classification === 'Mid' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                    }`}>{satResult.classification}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <p className="text-[13px] text-white/60 mb-5">6 questions • Math, Reading & Writing • 45-minute timer</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/diagnostic')} className="w-full mt-auto">
                    Start SAT Test →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* IELTS Diagnostic Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[var(--border-light)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary)] font-bold">IELTS DIAGNOSTIC</span>
                <span className="text-[20px]">🎧</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[var(--color-dark-900)]">Full IELTS Mock Test</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col">
              {ieltsResult ? (
                <div className="space-y-4">
                  {['Listening', 'Reading', 'Writing', 'Speaking'].map(skill => {
                    const band = ieltsResult[`${skill.toLowerCase()}Band` as keyof IeltsResult] as number;
                    const fillColor = band < 5.0 ? 'var(--color-danger)' : band <= 6.5 ? 'var(--color-warning)' : 'var(--color-success)';
                    return (
                      <div key={skill} className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px] text-[var(--color-dark-700)]">{skill}</span>
                          <span className="text-[14px] font-[600] text-[var(--color-dark-900)]">{band?.toFixed?.(1) || band}</span>
                        </div>
                        <div className="w-full h-[6px] bg-[var(--color-dark-100)] rounded-[3px] overflow-hidden">
                          <div className="h-full rounded-[3px] transition-all duration-1000 ease-out" style={{ width: `${(band / 9) * 100}%`, backgroundColor: fillColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <p className="text-[13px] text-[var(--color-dark-500)] mb-5">Listening, Reading, Writing & Speaking sections</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/diagnostic')} className="w-full mt-auto">
                    Start IELTS Test →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Weakness Analysis Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[var(--border-light)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary)] font-bold">WEAKNESS ANALYSIS</span>
                <span className="text-[20px]">🔍</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[var(--color-dark-900)]">Areas to Improve</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col">
              {diagnosticComplete ? (
                <div className="flex flex-wrap gap-2">
                  {[...(satResult?.weaknesses || []).map(w => `SAT: ${w}`), ...(ieltsResult?.weaknesses || []).map(w => `IELTS: ${w}`)].slice(0, 5).map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-[8px] bg-[var(--color-danger-ghost)] border border-[rgba(239,68,68,0.15)] text-[var(--color-danger)] px-[12px] py-[6px] rounded-[6px] text-[13px] font-medium">
                      ⚠️ {w}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--color-dark-500)]">Complete diagnostics to see your weak areas.</p>
              )}
            </div>
          </div>

          {/* Scholarship Readiness Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[var(--border-light)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary)] font-bold">SCHOLARSHIP</span>
                <span className="text-[20px]">🎓</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[var(--color-dark-900)]">Readiness Level</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col items-center justify-center text-center">
              {diagnosticComplete ? (
                <>
                  {/* Gauge Visual */}
                  <div className="relative w-[180px] h-[90px] overflow-hidden mb-4">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      {/* Background arc */}
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-dark-100)" strokeWidth="12" strokeLinecap="round" />
                      {/* Active arc */}
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" 
                        stroke={readinessScore >= 66 ? "var(--color-success)" : readinessScore >= 33 ? "var(--color-warning)" : "var(--color-danger)"} 
                        strokeWidth="12" strokeLinecap="round" 
                        strokeDasharray="125.6" 
                        strokeDashoffset={125.6 - (readinessScore / 100) * 125.6} 
                        className="transition-all duration-1000 ease-out" 
                      />
                      {/* Needle */}
                      <g transform={`rotate(${(readinessScore / 100) * 180 - 90} 50 50)`} className="transition-transform duration-1000 ease-out origin-[50px_50px]">
                        <polygon points="48,50 52,50 50,20" fill="var(--color-dark-800)" />
                        <circle cx="50" cy="50" r="4" fill="var(--color-dark-800)" />
                      </g>
                    </svg>
                  </div>
                  <div className={`text-[20px] font-bold mb-1 ${readinessScore >= 66 ? 'text-[var(--color-success)]' : readinessScore >= 33 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
                    {readinessScore >= 80 ? 'Excellent' : readinessScore >= 66 ? 'Good' : readinessScore >= 33 ? 'Developing' : 'Needs Work'}
                  </div>
                  <div className="text-[13px] text-[var(--color-dark-500)]">
                    Competitive for {readinessScore >= 80 ? 'Top 20' : readinessScore >= 60 ? 'Top 50' : 'Top 100'} universities
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-[var(--color-dark-500)]">Complete diagnostics to assess scholarship readiness.</p>
              )}
            </div>
          </div>

          {/* Daily Study Plan Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[var(--border-light)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary)] font-bold">STUDY SCHEDULE</span>
                <span className="text-[20px]">📅</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[var(--color-dark-900)]">Daily Study Plan</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col">
              {studyPlan.length > 0 ? (
                <div className="space-y-4">
                  {studyPlan.slice(0, 3).map((day, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-[var(--border-light)] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-[600] text-[14px] text-[var(--color-dark-900)]">{day.day}, {day.date}</p>
                        <p className="text-[var(--color-dark-500)] text-[12px] mt-0.5">
                          {day.tasks.length} tasks
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-[var(--color-primary-ghost)] text-[var(--color-primary)] text-[12px] font-bold px-2.5 py-1 rounded-md">
                          {day.tasks.reduce((s, t) => s + t.duration, 0)} min
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => navigate('/outcome')} className="w-full mt-auto">
                    View Full Plan →
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--color-dark-500)]">Complete diagnostics to generate your personalized study plan.</p>
              )}
            </div>
          </div>

          {/* AI Recommendations Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden transition-[var(--transition-base)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[2px] hover:border-[var(--color-primary-light)] flex flex-col">
            <div className="bg-transparent border-b border-[var(--border-light)] px-[24px] pt-[20px] pb-[16px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-primary)] font-bold">AI INSIGHTS</span>
                <span className="text-[20px]">🤖</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[var(--color-dark-900)]">Recommendations</h3>
            </div>
            <div className="px-[24px] pt-[20px] pb-[24px] flex-1 flex flex-col">
              {diagnosticComplete ? (
                <div className="space-y-2 flex-1">
                  {[...(satResult?.recommendations || []), ...(ieltsResult?.recommendations || [])].slice(0, 3).map((r, i) => (
                    <div key={i} className="border-l-[3px] border-[var(--color-primary)] bg-[var(--color-primary-ghost)] p-[10px_14px] rounded-[0_8px_8px_0] text-[13px] text-[var(--color-dark-700)] mb-[8px] leading-relaxed">
                      {r}
                    </div>
                  ))}
                  <div className="mt-auto pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/outcome')} className="w-full">
                      View Full Analysis →
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--color-dark-500)]">Complete diagnostics to get AI-powered recommendations.</p>
              )}
            </div>
          </div>
          
        </div>

        {/* University Targets */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Top University Targets</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Explore global institutions tailored for your ambition.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/universities')} className="font-semibold text-indigo-600 hidden sm:block">View All Universities &rarr;</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topUniversitiesData.map((u) => (
              <div 
                key={u.id} 
                onClick={() => navigate('/universities')}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                {/* Image Cover */}
                <div className="h-32 overflow-hidden relative bg-slate-200">
                  <img 
                    src={`https://picsum.photos/seed/${u.id}/600/400`} 
                    alt={u.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-sm">{u.flag}</span>
                    <span className="text-[10px] font-bold text-slate-700">{u.country}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1 font-bold text-[10px]">
                    🏆 #{u.rank}
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-base text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
                    {u.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
                    📍 {u.city} • <span className="italic">{u.type}</span>
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Acceptance</span>
                      <span className="text-xs font-bold text-slate-700">{u.acceptanceRate ? `${u.acceptanceRate}%` : 'N/A'}</span>
                    </div>
                    <span className="text-indigo-600 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
