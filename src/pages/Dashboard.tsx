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
              onClick={() => navigate('/diagnostic')}
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

        {/* Top Metrics / Progress */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Readiness Score */}
          <Card hoverEffect className="p-6 col-span-1 md:col-span-2 bg-white relative overflow-hidden flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Progres Persiapan</h3>
              {diagnosticComplete ? (
                <p className="text-xs font-medium text-slate-500 max-w-[200px]">
                  {readinessScore >= 70 ? 'Great progress! Focus on polishing your essays.' : 'Keep improving your test scores for stronger applications.'}
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-500 max-w-[200px]">Complete the diagnostic to see your readiness score.</p>
              )}
            </div>
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
               <svg viewBox="0 0 36 36" className="w-full h-full text-indigo-100">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray={`${diagnosticComplete ? readinessScore : 0}, 100`} />
               </svg>
               <div className="absolute flex flex-col items-center justify-center">
                 <span className="text-2xl font-black text-slate-800">{diagnosticComplete ? readinessScore : 0}%</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Selesai</span>
               </div>
            </div>
          </Card>
          
          {/* IELTS Card */}
          <Card hoverEffect className="p-6 border-slate-200 cursor-pointer" onClick={() => (profile?.ieltsScore || ieltsResult) ? navigate('/outcome') : navigate('/diagnostic')}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">IELTS Score</h3>
            <div className="mt-2 flex flex-col gap-2">
              {profile?.ieltsScore && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Actual / Target</span>
                  <div className="flex items-end">
                    <span className="text-4xl font-extrabold text-blue-600">{profile.ieltsScore}</span>
                  </div>
                </div>
              )}
              {ieltsResult ? (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Diagnostic Prediction</span>
                  <div className="flex items-end">
                    <span className={`font-extrabold ${profile?.ieltsScore ? 'text-2xl text-blue-400' : 'text-4xl text-blue-600'}`}>
                      {ieltsResult.overallBand.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 mb-1 ml-2">CEFR: {ieltsResult.cefrLevel}</span>
                  </div>
                </div>
              ) : (
                !profile?.ieltsScore && <span className="text-sm font-semibold text-slate-400 mt-1">Not yet tested</span>
              )}
            </div>
          </Card>

          {/* SAT Card */}
          <Card hoverEffect className="p-6 border-slate-200 cursor-pointer" onClick={() => (profile?.satScore || satResult) ? navigate('/outcome') : navigate('/diagnostic')}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">SAT Score</h3>
            <div className="mt-2 flex flex-col gap-2">
              {profile?.satScore && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Actual / Target</span>
                  <div className="flex items-end">
                    <span className="text-4xl font-extrabold text-violet-600">{profile.satScore}</span>
                  </div>
                </div>
              )}
              {satResult ? (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Diagnostic Prediction</span>
                  <div className="flex items-end">
                    <span className={`font-extrabold ${profile?.satScore ? 'text-2xl text-violet-400' : 'text-4xl text-violet-600'}`}>
                      {satResult.scoreRange}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 mb-1 ml-2">{satResult.classification}</span>
                  </div>
                </div>
              ) : (
                !profile?.satScore && <span className="text-sm font-semibold text-slate-400 mt-1">Not yet tested</span>
              )}
            </div>
          </Card>
        </div>

        {/* Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* SAT Diagnostic Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-violet-100">
            <div className="bg-gradient-to-r from-violet-600 to-purple-500 text-white p-5">
              <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">SAT Diagnostic</p>
              <p className="text-lg font-bold mt-1">Digital SAT Practice Test</p>
            </div>
            <div className="p-5">
              {satResult ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Math</span>
                    <span className="font-bold text-violet-700">{satResult.mathScore}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Reading & Writing</span>
                    <span className="font-bold text-violet-700">{satResult.readingWritingScore}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      satResult.classification === 'High' ? 'bg-emerald-50 text-emerald-700' : 
                      satResult.classification === 'Mid' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>{satResult.classification}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-3">6 questions • Math, Reading & Writing • 45-minute timer</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/diagnostic')} className="w-full">
                    Start SAT Test →
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* IELTS Diagnostic Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-blue-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">IELTS Diagnostic</p>
              <p className="text-lg font-bold mt-1">Full IELTS Mock Test</p>
            </div>
            <div className="p-5">
              {ieltsResult ? (
                <div className="space-y-2">
                  {['Listening', 'Reading', 'Writing', 'Speaking'].map(skill => {
                    const band = ieltsResult[`${skill.toLowerCase()}Band` as keyof IeltsResult] as number;
                    return (
                      <div key={skill} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(band / 9) * 100}%` }} />
                          </div>
                          <span className="font-bold text-blue-700 w-6 text-right">{band?.toFixed?.(1) || band}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-3">Listening, Reading, Writing & Speaking sections</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/diagnostic')} className="w-full">
                    Start IELTS Test →
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Weakness Analysis Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-red-100">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-5">
              <p className="text-red-200 text-xs font-bold uppercase tracking-widest">Weakness Analysis</p>
              <p className="text-lg font-bold mt-1">Areas to Improve</p>
            </div>
            <div className="p-5">
              {diagnosticComplete ? (
                <ul className="space-y-2">
                  {[...(satResult?.weaknesses || []).map(w => `SAT: ${w}`), ...(ieltsResult?.weaknesses || []).map(w => `IELTS: ${w}`)].slice(0, 4).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Complete diagnostics to see your weak areas.</p>
              )}
            </div>
          </Card>

          {/* Daily Study Plan Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest">Study Schedule</p>
              <p className="text-lg font-bold mt-1">📅 Daily Study Plan</p>
            </div>
            <div className="p-5">
              {studyPlan.length > 0 ? (
                <div className="space-y-2">
                  {studyPlan.slice(0, 3).map((day, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-slate-800">{day.day}, {day.date}</p>
                      <p className="text-slate-500 text-xs">
                        {day.tasks.length} tasks • {day.tasks.reduce((s, t) => s + t.duration, 0)} min
                      </p>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => navigate('/outcome')} className="w-full mt-2">
                    View Full Plan →
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Complete diagnostics to generate your personalized study plan.</p>
              )}
            </div>
          </Card>

          {/* Scholarship Readiness Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-amber-100">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white p-5">
              <p className="text-amber-200 text-xs font-bold uppercase tracking-widest">Scholarship</p>
              <p className="text-lg font-bold mt-1">🎓 Readiness Level</p>
            </div>
            <div className="p-5">
              {diagnosticComplete ? (
                <div>
                  <p className={`text-2xl font-black ${readinessScore >= 70 ? 'text-emerald-600' : readinessScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {readinessScore >= 80 ? 'Excellent' : readinessScore >= 60 ? 'Good' : readinessScore >= 40 ? 'Developing' : 'Needs Work'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Competitive for {readinessScore >= 80 ? 'Top 20' : readinessScore >= 60 ? 'Top 50' : 'Top 100'} universities
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Complete diagnostics to assess scholarship readiness.</p>
              )}
            </div>
          </Card>

          {/* AI Recommendations Card */}
          <Card hoverEffect className="p-0 overflow-hidden border-indigo-100">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-5">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">AI Insights</p>
              <p className="text-lg font-bold mt-1">🤖 Recommendations</p>
            </div>
            <div className="p-5">
              {diagnosticComplete ? (
                <ul className="space-y-2">
                  {[...(satResult?.recommendations || []), ...(ieltsResult?.recommendations || [])].slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => navigate('/outcome')} className="w-full mt-2">
                    View Full Analysis →
                  </Button>
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Complete diagnostics to get AI-powered recommendations.</p>
              )}
            </div>
          </Card>
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
