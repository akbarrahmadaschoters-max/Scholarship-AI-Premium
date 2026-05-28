import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useDiagnostic, DiagnosticProvider } from '../context/DiagnosticContext';

interface Scholarship {
  name: string;
  country: string;
  estimatedDeadline: string;
  eligibilityFit: string;
  matchPercentage: number;
  requiredPreparation: string;
  priorityLevel: string;
}

interface University {
  name: string;
  country: string;
  fitLevel: string;
  suggestedMajorAlignment: string;
  admissionCompetitiveness: string;
  preparationFocus: string;
}

interface ApplicationPriority {
  name: string;
  priority: string;
  daysRemaining: number;
}

interface MatchData {
  recommendedScholarships: Scholarship[];
  recommendedUniversities: University[];
  eligibilityMatch: string;
  deadlineAwareness: string;
  profileStrengths: string[];
  profileGaps: string[];
  recommendedNextActions: string[];
  applicationPriority: ApplicationPriority[];
  scholarshipStrategy: string;
}

const PremiumDashboardContent = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { satResult, ieltsResult } = useDiagnostic();
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSampleData, setIsSampleData] = useState(false);

  const userId = currentUser?.uid || 'guest';
  const storageKey = `premiumScholarshipRecommendations_${userId}`;
  const profileKey = `student_profiles_${userId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved data');
      }
    }
  }, [storageKey]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const profileStr = localStorage.getItem(profileKey);
      const profile = profileStr ? JSON.parse(profileStr) : null;
      
      const payload = {
        satResult,
        ieltsResult,
        profile
      };

      if (!satResult || !ieltsResult || !profile) {
        setIsSampleData(true);
      } else {
        setIsSampleData(false);
      }

      const res = await fetch('/api/scholarships/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('API error');
      
      const json = await res.json();
      setData(json);
      localStorage.setItem(storageKey, JSON.stringify(json));
    } catch (error) {
      console.error('Failed to generate recommendations', error);
      // Data will be null, error UI shown
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 px-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold mb-2">Generating AI scholarship recommendations...</h2>
        <p className="text-slate-500 text-center max-w-md">Our AI is analyzing your academic data, goals, and test scores to build your customized application strategy.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 right-4">
           <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded mb-4">PREMIUM DASHBOARD ACTIVE</span>
        </div>
        <Card className="text-center p-10 max-w-md bg-white border-0 shadow-soft">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">🤖</div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-3">Ready for Premium Matching?</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">AI matching data is not available yet. Complete your diagnostic or profile setup to generate recommendations.</p>
          <Button variant="primary" onClick={generateRecommendations} className="w-full text-base py-3 shadow-[0_8px_16px_rgba(99,102,241,0.2)]">
            Generate Recommendations
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-indigo-50/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 relative">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                 <defs>
                   <linearGradient id="logo-gradient-pd" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#818cf8" />
                     <stop offset="100%" stopColor="#4f46e5" />
                   </linearGradient>
                 </defs>
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="url(#logo-gradient-pd)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 30" opacity="0.3" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-wider">SCHOLAR NOVA</h1>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100">Premium</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">PREMIUM DASHBOARD ACTIVE</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Exit Premium
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {isSampleData && (
           <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex justify-between items-center shadow-sm">
             <span className="font-medium text-sm">Using sample profile data. Complete your diagnostic for personalized recommendations.</span>
             <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate('/diagnostic')} variant="primary" className="bg-blue-600 border-blue-600 text-white">Start Diagnostic</Button>
                <Button size="sm" onClick={() => navigate('/outcome')} variant="outline" className="border-blue-300 text-blue-700 bg-white">View Diagnostic Result</Button>
             </div>
           </div>
        )}

        <div className="flex justify-end">
           <Button variant="outline" className="bg-white text-indigo-700 border-indigo-200 flex gap-2 items-center hover:bg-indigo-50">
             📄 Generate PDF Report
           </Button>
        </div>

        {/* AI Scholarship Match Summary */}
        <section>
          <Card className="p-8 bg-white border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col md:flex-row gap-8">
               <div className="flex-1">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">AI Scholarship Match Summary</h2>
                 <p className="text-xl font-semibold leading-relaxed text-slate-800 mb-6">{data.eligibilityMatch}</p>
                 
                 <div className="bg-indigo-50/50 rounded-[16px] p-5 border border-indigo-100/50">
                   <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                     <span className="text-indigo-500">✨</span> Suggested Application Strategy
                   </h3>
                   <p className="text-sm text-indigo-900/80 leading-relaxed">{data.scholarshipStrategy}</p>
                 </div>
               </div>
               
               <div className="w-full md:w-80 space-y-4">
                 <div className="bg-white rounded-[16px] p-5 border border-slate-100 shadow-sm">
                    <h3 className="text-xs text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Profile Strengths
                    </h3>
                    <ul className="space-y-2.5">
                      {data.profileStrengths?.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-700 items-start">
                          <span className="text-emerald-500 bg-emerald-50 rounded-full p-0.5 mt-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span> 
                          <span className="leading-tight">{s}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
                 <div className="bg-white rounded-[16px] p-5 border border-slate-100 shadow-sm">
                    <h3 className="text-xs text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div> Profile Weaknesses
                    </h3>
                    <ul className="space-y-2.5">
                      {data.profileGaps?.map((g, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-700 items-start">
                          <span className="text-amber-500 bg-amber-50 rounded-full p-0.5 mt-0.5">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </span> 
                          <span className="leading-tight">{g}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
             </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recommended Scholarships */}
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">Recommended Scholarships</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendedScholarships?.map((schol, idx) => (
                  <Card key={idx} className="p-5 border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all flex flex-col bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 block">{schol.country}</span>
                        <h3 className="text-lg font-bold text-slate-900">{schol.name}</h3>
                      </div>
                      <div className="text-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shrink-0">
                        <p className="text-xl font-black text-amber-600">{schol.matchPercentage}%</p>
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">Match</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-auto">
                       <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                         <span className="text-slate-500">Estimated Deadline</span>
                         <span className="font-bold text-red-600">{schol.estimatedDeadline}</span>
                       </div>
                       <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                         <span className="text-slate-500">Eligibility Fit</span>
                         <span className={`font-semibold ${schol.eligibilityFit === 'High' ? 'text-emerald-600' : 'text-amber-600'}`}>{schol.eligibilityFit}</span>
                       </div>
                       <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                         <span className="text-slate-500">Priority Level</span>
                         <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${schol.priorityLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{schol.priorityLevel}</span>
                       </div>
                       <div className="text-xs pt-1">
                         <span className="text-slate-500 block mb-1">Required Prep:</span>
                         <span className="font-medium text-slate-700">{schol.requiredPreparation}</span>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recommended Universities */}
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">Recommended Universities</h2>
              <div className="space-y-4">
                {data.recommendedUniversities?.map((uni, idx) => (
                  <Card key={idx} className="p-0 overflow-hidden hover:border-indigo-300 transition-colors bg-white">
                    <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded">{uni.country}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${uni.fitLevel === 'Reach' ? 'bg-rose-100 text-rose-700' : uni.fitLevel === 'Target' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{uni.fitLevel}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{uni.name}</h3>
                          <p className="text-sm font-medium text-indigo-600">{uni.suggestedMajorAlignment}</p>
                       </div>
                       
                       <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Competitiveness</p>
                            <span className="text-sm font-semibold text-slate-700">{uni.admissionCompetitiveness}</span>
                          </div>
                          <div className="hidden sm:block w-px bg-slate-200"></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Focus</p>
                            <span className="text-sm font-medium text-slate-600">{uni.preparationFocus}</span>
                          </div>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

          </div>

          <div className="lg:col-span-1 space-y-8">
            
            {/* Deadline-Based Priority */}
            <section className="sticky top-24">
              <Card className="border-t-4 border-t-red-500 bg-white shadow-lg mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-800">Deadline-Based Priority</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.deadlineAwareness}</p>
                </div>
                <div className="space-y-3">
                  {data.applicationPriority?.map((p, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 text-sm mb-0.5">{p.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${p.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.priority}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-black ${p.daysRemaining < 30 ? 'text-red-600' : 'text-slate-700'}`}>{p.daysRemaining}</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Next Actions */}
              <Card className="bg-white shadow-md border-slate-200">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                   <span>🎯</span> Recommended Next Actions
                 </h3>
                 <ul className="space-y-3">
                   {data.recommendedNextActions?.map((task, i) => (
                     <li key={i} className="flex gap-3 text-sm text-slate-600 items-start">
                       <input type="checkbox" className="mt-1 shrink-0 rounded text-indigo-500 focus:ring-indigo-500 border-slate-300" />
                       <span className="font-medium">{task}</span>
                     </li>
                   ))}
                 </ul>
              </Card>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
};

export const PremiumDashboard = () => {
  return (
    <DiagnosticProvider>
      <PremiumDashboardContent />
    </DiagnosticProvider>
  );
};
