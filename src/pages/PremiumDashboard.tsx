import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useDiagnostic, DiagnosticProvider } from '../context/DiagnosticContext';
import { SidePanel } from '../features/premium-dashboard/components/SidePanel';

// CountUp Component for Number Counter Animation
const CountUp = ({ end, duration = 1000, suffix = '' }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let observer: IntersectionObserver;

    const startAnimation = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      setCount(Math.floor(end * easeOut));

      if (progress < duration) {
        requestAnimationFrame(startAnimation);
      } else {
        setCount(end);
      }
    };

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(startAnimation);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

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
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('premium_dashboard_tab') || 'overview';
  });

  // Scholarship filter & panel state
  const [scholarshipFilter, setScholarshipFilter] = useState('All');
  const [scholarshipSort, setScholarshipSort] = useState('Match %');
  const [scholarshipSearch, setScholarshipSearch] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('scholarship_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  const [actionChecklist, setActionChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('premiumActionChecklist');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleChecklist = (id: string) => {
    const newChecklist = { ...checklist, [id]: !checklist[id] };
    setChecklist(newChecklist);
    localStorage.setItem('scholarship_checklist', JSON.stringify(newChecklist));
  };

  const toggleActionChecklist = (task: string) => {
    const updated = { ...actionChecklist, [task]: !actionChecklist[task] };
    setActionChecklist(updated);
    localStorage.setItem('premiumActionChecklist', JSON.stringify(updated));
  };

  // University filter & panel state
  const [uniTierFilter, setUniTierFilter] = useState('All');
  const [uniCountryFilter, setUniCountryFilter] = useState('All');
  const [uniSort, setUniSort] = useState('Match');
  const [selectedUniversity, setSelectedUniversity] = useState<Record<string, any> | null>(null);
  const [uniActiveTab, setUniActiveTab] = useState('S1');
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    if (activeTab === 'scholarships') {
      setAnimateChart(false);
      const timer = setTimeout(() => setAnimateChart(true), 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem('premium_dashboard_tab', tab);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const handleGeneratePDF = async () => {
    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsGeneratingPdf(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'universities', label: 'Universities' },
    { id: 'action-plan', label: 'Action Plan' }
  ];

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
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4) }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) }
        }
        .tab-enter {
          animation: fadeInUp 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .side-section-1 { opacity: 0; animation: fadeInUp 300ms ease-out 0ms forwards; }
        .side-section-2 { opacity: 0; animation: fadeInUp 300ms ease-out 100ms forwards; }
        .side-section-3 { opacity: 0; animation: fadeInUp 300ms ease-out 200ms forwards; }
        .side-section-4 { opacity: 0; animation: fadeInUp 300ms ease-out 300ms forwards; }
      `}</style>

      {/* Hero Section */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--color-dark-900)] leading-tight mb-1">AI Premium Dashboard</h1>
            <p className="text-sm text-[var(--color-dark-500)]">Exclusive matching, essays, and advanced analytics</p>
          </div>
          <Button 
            onClick={handleGeneratePDF}
            disabled={isGeneratingPdf}
            className="bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)] hover:-translate-y-[1px] hover:shadow-lg transition-all"
          >
            {isGeneratingPdf ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Generate PDF Report
              </span>
            )}
          </Button>
        </div>
        
        {/* Tab Navigation bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-[4px] pb-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  px-8 py-3 text-sm font-semibold transition-[var(--transition-fast)] whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-[var(--color-primary)] text-white rounded-[var(--border-radius-md)] shadow-[var(--shadow-primary)]' 
                    : 'bg-transparent text-[var(--color-dark-500)] hover:bg-[var(--color-primary-ghost)] hover:text-[var(--color-primary)] rounded-[var(--border-radius-md)]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        {isSampleData && (
           <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex justify-between items-center shadow-sm mb-8">
             <span className="font-medium text-sm">Using sample profile data. Complete your diagnostic for personalized recommendations.</span>
             <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate('/diagnostic')} variant="primary" className="bg-blue-600 border-blue-600 text-white">Start Diagnostic</Button>
                <Button size="sm" onClick={() => navigate('/outcome')} variant="outline" className="border-blue-300 text-blue-700 bg-white">View Diagnostic Result</Button>
             </div>
           </div>
        )}

        <div className="tab-enter" key={activeTab}>
          {activeTab === 'overview' && (
            <section className="grid lg:grid-cols-5 gap-6">
              {/* Kolom Kiri (60% -> col-span-3) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Hero Match Card */}
                <div 
                  className="rounded-[var(--border-radius-xl)] p-9 relative overflow-hidden text-white"
                  style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #0F172A 100%)' }}
                >
                  {/* Purple blur blob top right */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
                  
                  <div className="relative z-10">
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">AI Match Analysis</h2>
                    <p className="text-[20px] leading-relaxed text-white font-medium mb-6">{data.eligibilityMatch}</p>
                    
                    <hr className="border-t border-white/10 my-6" />
                    
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[var(--border-radius-md)] p-4 mb-6">
                      <h3 className="text-[14px] font-bold text-white uppercase tracking-wide mb-2 flex items-center gap-2">
                        <span>✨</span> Suggested Application Strategy
                      </h3>
                      <p className="text-[14px] text-indigo-100/80 leading-relaxed">{data.scholarshipStrategy}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-3xl font-black text-white mb-1"><CountUp end={data.recommendedScholarships?.length || 0} /></p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Scholarships</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-white mb-1"><CountUp end={data.recommendedUniversities?.length || 0} /></p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Universities</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-emerald-400 mb-1"><CountUp end={85} suffix="%" /></p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Readiness</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <Card className="p-6 bg-white border border-[var(--border-light)] rounded-[var(--border-radius-lg)]">
                  <h3 className="text-sm font-bold text-[var(--color-dark-900)] uppercase tracking-wide mb-6">Your Application Timeline</h3>
                  <div className="relative">
                    {/* Visual timeline line */}
                    <div className="absolute top-3 left-0 w-full h-1 bg-slate-100 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full w-1/3"></div>
                    </div>
                    {/* Timeline items (mocked visually) */}
                    <div className="relative flex justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 border-4 border-white shadow-sm mb-2"></div>
                        <span className="text-[11px] font-bold text-slate-800">Profile Setup</span>
                        <span className="text-[10px] text-slate-500">Completed</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-4 border-white shadow-sm mb-2">
                          <div className="w-2 h-2 m-1 rounded-full bg-indigo-500"></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">Test Prep</span>
                        <span className="text-[10px] text-indigo-500">Current Phase</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm mb-2"></div>
                        <span className="text-[11px] font-bold text-slate-400">Applications</span>
                        <span className="text-[10px] text-slate-400">Upcoming</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm mb-2"></div>
                        <span className="text-[11px] font-bold text-slate-400">Decisions</span>
                        <span className="text-[10px] text-slate-400">Pending</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Kolom Kanan (40% -> col-span-2) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Strengths Card */}
                <Card className="bg-[var(--surface-card)] border-[var(--border-light)] rounded-[var(--border-radius-lg)] p-5">
                  <h3 className="text-[11px] text-slate-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> PROFILE STRENGTHS
                  </h3>
                  <ul className="space-y-1">
                    {data.profileStrengths?.map((s, i) => (
                      <li key={i} className="flex gap-3 text-[14px] text-[var(--color-dark-700)] items-start p-2 rounded-lg hover:bg-[var(--color-success-ghost)] transition-[var(--transition-fast)]">
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span className="leading-tight">{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Weaknesses Card */}
                <Card className="bg-[var(--surface-card)] border-[var(--border-light)] rounded-[var(--border-radius-lg)] p-5">
                  <h3 className="text-[11px] text-slate-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> PROFILE WEAKNESSES
                  </h3>
                  <ul className="space-y-1">
                    {data.profileGaps?.map((g, i) => (
                      <li key={i} className="flex gap-3 text-[14px] text-[var(--color-dark-700)] items-start p-2 rounded-lg hover:bg-[var(--color-warning-ghost)] transition-[var(--transition-fast)]">
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 mt-0.5">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </span>
                        <span className="leading-tight">{g}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-[var(--border-light)] rounded-[var(--border-radius-md)] p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-indigo-600 mb-0.5"><CountUp end={data.recommendedScholarships?.[0]?.matchPercentage || 85} suffix="%" /></p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Top Match</p>
                  </div>
                  <div className="border border-[var(--border-light)] rounded-[var(--border-radius-md)] p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-slate-800 mb-0.5"><CountUp end={data.recommendedScholarships?.length || 0} /></p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Found</p>
                  </div>
                  <div className="border border-[var(--border-light)] rounded-[var(--border-radius-md)] p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-rose-500 mb-0.5"><CountUp end={data.applicationPriority?.[0]?.daysRemaining || 45} /></p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Days Left</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'scholarships' && (() => {
            const allScholarships = [...(data.recommendedScholarships || [])].sort((a, b) => {
              if (scholarshipSort === 'Match %') return b.matchPercentage - a.matchPercentage;
              return 0;
            });

            return (
              <section className="space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-[var(--border-radius-lg)] border border-[var(--border-light)] shadow-sm">
                  <div className="flex flex-wrap gap-3">
                    {['All', 'High Match', 'Deadline Soon', 'Full Funded'].map(f => (
                      <button
                        key={f}
                        onClick={() => setScholarshipFilter(f)}
                        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-[var(--transition-fast)] ${
                          scholarshipFilter === f
                            ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)]'
                            : 'bg-white text-[var(--color-dark-600)] border border-[var(--border-light)] hover:bg-slate-50'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <select
                      value={scholarshipSort}
                      onChange={e => setScholarshipSort(e.target.value)}
                      className="text-sm border border-[var(--border-light)] rounded-[var(--border-radius-md)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option>Match %</option>
                      <option>Deadline</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search scholarships..."
                      value={scholarshipSearch}
                      onChange={e => setScholarshipSearch(e.target.value)}
                      className="text-sm border border-[var(--border-light)] rounded-[var(--border-radius-md)] px-3 py-2 bg-white w-full sm:w-64 focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allScholarships.map((schol, idx) => {
                    const matchColor = schol.matchPercentage > 85 ? 'var(--color-success)' : schol.matchPercentage >= 70 ? 'var(--color-primary)' : 'var(--color-warning)';
                    const circ = 2 * Math.PI * 20;
                    const strokeDashoffsetTarget = circ - (schol.matchPercentage / 100) * circ;
                    const strokeDashoffset = animateChart ? strokeDashoffsetTarget : circ;

                    const getBadgeStyle = (level: string) => {
                      if (level === 'High') return 'bg-[var(--color-success-ghost)] text-[var(--color-success)] border border-[var(--color-success)]/20';
                      if (level === 'Medium') return 'bg-[var(--color-warning-ghost)] text-[var(--color-warning)] border border-[var(--color-warning)]/20';
                      return 'bg-[var(--color-danger-ghost)] text-[var(--color-danger)] border border-[var(--color-danger)]/20';
                    };

                    const isFilteredOut = (() => {
                      if (scholarshipSearch && !(schol.name || '').toLowerCase().includes(scholarshipSearch.toLowerCase())) return true;
                      if (scholarshipFilter === 'High Match' && schol.matchPercentage < 85) return true;
                      return false;
                    })();

                    return (
                      <Card
                        key={idx}
                        onClick={() => setSelectedScholarship(schol)}
                        className={`bg-white border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden cursor-pointer hover:shadow-[var(--shadow-lg)] hover:-translate-y-[3px] hover:border-[var(--color-primary)]/30 transition-all duration-300 flex flex-col p-0 ${isFilteredOut ? 'opacity-30 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}
                      >
                        {/* Header */}
                        <div className="p-5 pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[11px] uppercase tracking-wider text-[var(--color-dark-500)] font-bold flex items-center gap-1.5 mb-2">
                                🌍 {schol.country}
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 transform -rotate-90">
                                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                  <circle cx="24" cy="24" r="20" stroke={matchColor} strokeWidth="4" fill="transparent" strokeDasharray={circ} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" style={{ transitionDelay: `${idx * 0.1}s` }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[12px] font-bold text-[var(--color-dark-900)]">{schol.matchPercentage}%</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 mt-1">MATCH</span>
                            </div>
                          </div>
                          <h3 className="text-[18px] font-bold text-[var(--color-dark-900)] mt-[-10px] leading-tight pr-14">{schol.name}</h3>
                        </div>

                        <hr className="border-[var(--border-light)] my-4" />

                        {/* Body */}
                        <div className="px-5 pb-5 grid grid-cols-2 gap-y-4 gap-x-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Deadline</p>
                            <p className="text-[14px] font-semibold text-[var(--color-dark-800)]">{schol.estimatedDeadline}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Eligibility Fit</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-semibold ${getBadgeStyle(schol.eligibilityFit)}`}>
                              {schol.eligibilityFit}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Priority</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-semibold ${getBadgeStyle(schol.priorityLevel)}`}>
                              {schol.priorityLevel}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Required Prep</p>
                            <p className="text-[13px] text-[var(--color-dark-600)] line-clamp-2">{schol.requiredPreparation}</p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 border-t border-[var(--border-light)] px-5 py-3 mt-auto">
                          <p className="text-[12px] text-[var(--color-primary)] font-medium italic">→ Click to see full requirements & gap analysis</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {activeTab === 'universities' && (() => {
            const allUniversities = [...(data.recommendedUniversities || [])].sort((a, b) => {
              // placeholder sort logic if needed
              return 0;
            });

            return (
              <section className="space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-[var(--border-radius-lg)] border border-[var(--border-light)] shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-wrap gap-2">
                      {['All', 'REACH', 'TARGET', 'SAFETY'].map(tier => (
                        <button
                          key={tier}
                          onClick={() => setUniTierFilter(tier)}
                          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-[var(--transition-fast)] ${
                            uniTierFilter === tier
                              ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)]'
                              : 'bg-white text-[var(--color-dark-600)] border border-[var(--border-light)] hover:bg-slate-50'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                    <div className="hidden sm:block w-px bg-slate-200"></div>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'USA', 'UK', 'Europe', 'Asia', 'Australia'].map(country => (
                        <button
                          key={country}
                          onClick={() => setUniCountryFilter(country)}
                          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-[var(--transition-fast)] ${
                            uniCountryFilter === country
                              ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)]'
                              : 'bg-white text-[var(--color-dark-600)] border border-[var(--border-light)] hover:bg-slate-50'
                          }`}
                        >
                          {country === 'All' ? 'All Countries' : country}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      value={uniSort}
                      onChange={e => setUniSort(e.target.value)}
                      className="text-sm border border-[var(--border-light)] rounded-[var(--border-radius-md)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--color-primary)] w-full sm:w-auto"
                    >
                      <option>Sort by: Match</option>
                      <option>Sort by: Rank</option>
                    </select>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {allUniversities.map((uni, idx) => {
                    const tier = (uni.fitLevel || '').toUpperCase();
                    let borderColor = 'var(--border-light)';
                    let badgeClass = '';
                    let dotColor = '';

                    if (tier === 'REACH') {
                      borderColor = 'var(--color-danger)';
                      badgeClass = 'bg-[var(--color-danger-ghost)] text-[var(--color-danger)] border border-[var(--color-danger)]/20';
                      dotColor = 'text-[var(--color-danger)]';
                    } else if (tier === 'TARGET') {
                      borderColor = 'var(--color-warning)';
                      badgeClass = 'bg-[var(--color-warning-ghost)] text-[var(--color-warning)] border border-[var(--color-warning)]/20';
                      dotColor = 'text-[var(--color-warning)]';
                    } else {
                      borderColor = 'var(--color-success)';
                      badgeClass = 'bg-[var(--color-success-ghost)] text-[var(--color-success)] border border-[var(--color-success)]/20';
                      dotColor = 'text-[var(--color-success)]';
                    }

                    const compMap: Record<string, number> = {
                      'Extremely High': 5,
                      'Very High': 4,
                      'High': 4,
                      'Medium': 3,
                      'Low': 2
                    };
                    const dotsCount = compMap[uni.admissionCompetitiveness] || 3;
                    
                    const isFilteredOut = (() => {
                      if (uniTierFilter !== 'All' && (uni.fitLevel || '').toUpperCase() !== uniTierFilter) return true;
                      if (uniCountryFilter !== 'All' && !(uni.country || '').includes(uniCountryFilter)) return true;
                      return false;
                    })();

                    return (
                      <Card
                        key={idx}
                        onClick={() => setSelectedUniversity(uni)}
                        className={`group bg-white border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:translate-x-1 p-5 md:p-6 ${isFilteredOut ? 'opacity-30 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}
                        style={{ borderLeft: `4px solid ${borderColor}` }}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                          
                          {/* Col 1: Rank */}
                          <div className="w-[5%] shrink-0">
                            <span className="text-[28px] font-bold text-[var(--color-dark-200)]">#{idx + 1}</span>
                          </div>

                          {/* Col 2: Identity */}
                          <div className="w-[35%] shrink-0 flex flex-col">
                            <span className="text-[11px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex items-center gap-1.5">
                              🌍 {uni.country}
                            </span>
                            <h3 className="text-[17px] font-bold text-[var(--color-dark-900)] leading-tight mb-1">{uni.name}</h3>
                            <p className="text-[14px] text-[var(--color-primary)] font-medium mb-2">{uni.suggestedMajorAlignment}</p>
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-bold ${badgeClass}`}>
                                {tier}
                              </span>
                            </div>
                          </div>

                          {/* Col 3: Competitiveness */}
                          <div className="w-[35%] shrink-0 flex flex-col gap-3">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Competitiveness</p>
                              <div className="flex items-center gap-2">
                                <div className={`flex gap-0.5 ${dotColor} text-[10px]`}>
                                  {[1,2,3,4,5].map(d => (
                                    <span key={d}>{d <= dotsCount ? '●' : '○'}</span>
                                  ))}
                                </div>
                                <span className="text-[12px] font-medium text-slate-700">{uni.admissionCompetitiveness}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Focus Area</p>
                              <p className="text-[13px] text-[var(--color-dark-600)]">{uni.preparationFocus}</p>
                            </div>
                          </div>

                          {/* Col 4: Action */}
                          <div className="w-[25%] flex justify-end shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative">
                            <Button variant="outline" className="text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary-ghost)] text-xs px-4 py-1.5 h-auto relative overflow-hidden group/btn">
                              View Details
                              <span className="inline-block transition-transform duration-150 ease-out transform translate-x-2 opacity-0 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 ml-1">→</span>
                            </Button>
                          </div>

                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {activeTab === 'action-plan' && (() => {
            const urgentCount = (data.applicationPriority || []).filter(p => p.daysRemaining < 14).length;
            const completedCount = Object.values(actionChecklist).filter(Boolean).length;
            const nearestDeadline = data.applicationPriority && data.applicationPriority.length > 0 
              ? Math.min(...data.applicationPriority.map(p => p.daysRemaining)) 
              : 0;
            
            return (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Kolom Kiri — Deadline Timeline (55%) */}
                  <section className="w-full lg:w-[55%]">
                    <Card className="bg-white border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-sm h-full p-6">
                      <div className="mb-8">
                        <h3 className="text-[18px] font-black text-slate-800">Deadline-Based Priority</h3>
                        <p className="text-sm text-slate-500 mt-1">You have {urgentCount} urgent deadlines in the next 30 days</p>
                      </div>

                      <div className="relative pl-3">
                        {data.applicationPriority?.map((p, i) => {
                          const isUrgent = p.daysRemaining < 14;
                          const isHigh = p.daysRemaining >= 14 && p.daysRemaining <= 30;
                          const isMedium = p.daysRemaining > 30 && p.daysRemaining <= 60;
                          
                          let circleStyle = 'border-2 border-slate-300 bg-white';
                          let badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200';
                          let borderLeftColor = 'var(--border-light)';
                          let textColor = 'text-slate-700';

                          if (isUrgent) {
                            circleStyle = 'bg-[var(--color-danger)] shadow-[0_0_0_4px_rgba(239,68,68,0.2)] animate-pulse';
                            badgeStyle = 'bg-[var(--color-danger-ghost)] text-[var(--color-danger)] border border-[var(--color-danger)]/20';
                            borderLeftColor = 'var(--color-danger)';
                            textColor = 'text-[var(--color-danger)]';
                          } else if (isHigh) {
                            circleStyle = 'bg-[var(--color-warning)]';
                            badgeStyle = 'bg-[var(--color-warning-ghost)] text-[var(--color-warning)] border border-[var(--color-warning)]/20';
                            borderLeftColor = 'var(--color-warning)';
                            textColor = 'text-[var(--color-warning)]';
                          } else if (isMedium) {
                            circleStyle = 'bg-[#FBBF24]'; // yellow-400
                            badgeStyle = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
                            borderLeftColor = '#FBBF24';
                            textColor = 'text-yellow-700';
                          }

                          return (
                            <div key={i} className="relative mb-6 last:mb-0">
                              {/* Vertical Line */}
                              {i !== data.applicationPriority.length - 1 && (
                                <div 
                                  className="absolute left-[11px] top-6 bottom-[-24px] w-px"
                                  style={{ backgroundColor: (isUrgent && data.applicationPriority[i+1]?.daysRemaining < 14) ? 'var(--color-danger)' : 'var(--border-light)' }}
                                ></div>
                              )}

                              <div className="flex items-start gap-5 relative z-10">
                                {/* Circle Indicator */}
                                <div className="mt-2 shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white">
                                  <div className={`w-3.5 h-3.5 rounded-full ${circleStyle}`}></div>
                                </div>
                                
                                {/* Card Item */}
                                <div 
                                  className="flex-1 bg-white border border-[var(--border-light)] rounded-[var(--border-radius-md)] p-3.5 sm:p-4 shadow-sm"
                                  style={{ borderLeft: `3px solid ${borderLeftColor}` }}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <h4 className="text-[15px] font-bold text-slate-800 leading-tight mb-2">{p.name}</h4>
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                        {isUrgent ? 'URGENT' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW'}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className={`text-[22px] font-black leading-none ${textColor}`}>{p.daysRemaining}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Days</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </section>

                  {/* Kolom Kanan — Next Actions (45%) */}
                  <section className="w-full lg:w-[45%]">
                    <Card className="bg-white border border-[var(--border-light)] rounded-[var(--border-radius-lg)] shadow-sm h-full p-6">
                      <h3 className="text-[18px] font-black text-slate-800 mb-6">Recommended Next Actions</h3>
                      
                      <div className="space-y-2.5">
                        {data.recommendedNextActions?.map((task, i) => {
                          const isChecked = actionChecklist[task] || false;
                          
                          return (
                            <label 
                              key={i} 
                              className={`flex items-start gap-3 p-3.5 rounded-[var(--border-radius-md)] border cursor-pointer transition-[var(--transition-fast)] ${
                                isChecked ? 'bg-slate-50 border-[var(--border-light)]' : 'bg-white border-[var(--border-light)] hover:border-[var(--color-primary)]'
                              }`}
                            >
                              <div className="pt-0.5 shrink-0 relative">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => toggleActionChecklist(task)}
                                  className="peer sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isChecked 
                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' 
                                    : 'border-[var(--color-dark-300)] bg-transparent group-hover:border-[var(--color-primary)]'
                                }`}>
                                  {isChecked && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1">
                                <span className={`text-[14px] transition-all duration-300 ${
                                  isChecked ? 'text-slate-400 line-through opacity-70' : 'text-slate-700 font-medium'
                                }`}>
                                  {task}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </Card>
                  </section>
                </div>

                {/* SUMMARY ROW (Full Width) */}
                <div className="bg-[var(--color-dark-900)] text-white rounded-[var(--border-radius-lg)] p-5 sm:p-7 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="pt-4 sm:pt-0 sm:px-4 text-center">
                      <p className="text-3xl font-black text-emerald-400 mb-1">{completedCount}</p>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Completed Actions</p>
                    </div>
                    <div className="pt-4 sm:pt-0 sm:px-4 text-center">
                      <p className="text-3xl font-black text-rose-400 mb-1">{nearestDeadline}</p>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Days to Nearest Deadline</p>
                    </div>
                    <div className="pt-4 sm:pt-0 sm:px-4 text-center">
                      <p className="text-3xl font-black text-indigo-400 mb-1">85%</p>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Overall Readiness</p>
                    </div>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Application Readiness</span>
                      <span className="text-sm font-black text-white">85%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full relative" style={{ width: '85%' }}>
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                          <div className="w-full h-full bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      <SidePanel 
        isOpen={!!selectedScholarship} 
        onClose={() => setSelectedScholarship(null)} 
        title={selectedScholarship ? `${selectedScholarship.name} 🌍` : ''}
      >
        {selectedScholarship && (() => {
          const matchColor = selectedScholarship.matchPercentage > 85 ? 'var(--color-success)' : selectedScholarship.matchPercentage >= 70 ? 'var(--color-primary)' : 'var(--color-warning)';
          const circ = 2 * Math.PI * 45;
          const strokeDashoffset = circ - (selectedScholarship.matchPercentage / 100) * circ;
          
          const requirements = [
            { label: 'Minimum GPA 3.5', met: true },
            { label: 'IELTS Score 7.0+', met: false },
            { label: 'Motivation Letter', met: null }
          ];

          return (
            <div className="space-y-8 pb-10">
              {/* Overview */}
              <div className="flex flex-col items-center text-center pt-2 side-section-1">
                <div className="relative w-[120px] h-[120px] mb-5">
                  <svg className="w-[120px] h-[120px] transform -rotate-90">
                    <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle cx="60" cy="60" r="45" stroke={matchColor} strokeWidth="8" fill="transparent" strokeDasharray={circ} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col mt-1">
                    <span className="text-3xl font-black text-[var(--color-dark-900)] leading-none">{selectedScholarship.matchPercentage}%</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Match</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <span className="bg-[var(--color-success-ghost)] text-[var(--color-success)] px-3 py-1 rounded-full text-xs font-semibold">{selectedScholarship.eligibilityFit} Fit</span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{selectedScholarship.priorityLevel} Priority</span>
                </div>
              </div>

              {/* Requirements Table */}
              <div className="side-section-2">
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">Key Requirements Analysis</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {requirements.map((req, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-4 py-3 text-[var(--color-dark-700)]">{req.label}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {req.met === true ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Met</span>
                            ) : req.met === false ? (
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg> Not Met</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Close</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline */}
              <div className="side-section-3">
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">Deadline Timeline</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span>Today</span>
                    <span className="text-[var(--color-danger)]">45 Days Remaining</span>
                    <span>{selectedScholarship.estimatedDeadline}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-[var(--color-danger)] rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="side-section-4">
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">What You Need to Prepare</h3>
                <div className="space-y-2">
                  {['Update CV/Resume', 'Request 2 Recommendation Letters', 'Write Personal Statement Draft', 'Translate Academic Transcripts'].map((task, i) => {
                    const id = `task_${i}`;
                    const isChecked = checklist[id] || false;
                    return (
                      <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-200 hover:border-[var(--color-primary)]'}`}>
                        <div className="pt-0.5">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[var(--color-primary)] rounded border-slate-300 focus:ring-[var(--color-primary)]"
                            checked={isChecked}
                            onChange={() => toggleChecklist(id)}
                          />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isChecked ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{task}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <Button className="w-full bg-[var(--color-primary)] text-white font-bold py-3 hover:opacity-90">
                  Visit Official Website →
                </Button>
              </div>
            </div>
          );
        })()}
      </SidePanel>
      <SidePanel 
        isOpen={!!selectedUniversity} 
        onClose={() => setSelectedUniversity(null)} 
        title={selectedUniversity ? `${selectedUniversity.name} 🌍` : ''}
      >
        {selectedUniversity && (() => {
          const tier = (selectedUniversity.fitLevel || '').toUpperCase();
          let badgeClass = '';
          let badgeText = '';
          let badgeBorder = '';

          if (tier === 'REACH') {
            badgeClass = 'bg-[var(--color-danger-ghost)] text-[var(--color-danger)]';
            badgeText = 'text-[var(--color-danger)]';
            badgeBorder = 'border-[var(--color-danger)]/20';
          } else if (tier === 'TARGET') {
            badgeClass = 'bg-[var(--color-warning-ghost)] text-[var(--color-warning)]';
            badgeText = 'text-[var(--color-warning)]';
            badgeBorder = 'border-[var(--color-warning)]/20';
          } else {
            badgeClass = 'bg-[var(--color-success-ghost)] text-[var(--color-success)]';
            badgeText = 'text-[var(--color-success)]';
            badgeBorder = 'border-[var(--color-success)]/20';
          }

          const dummyReqs = [
            { label: 'IELTS', required: '7.5', user: '7.0', status: false },
            { label: 'SAT', required: '1450', user: '1480', status: true },
            { label: 'GPA', required: '3.8', user: '3.9', status: true },
          ];

          return (
            <div className="space-y-8 pb-10">
              {/* Match Overview Stats */}
              <div className="grid grid-cols-3 gap-3 side-section-1">
                <div className={`border border-[var(--border-light)] rounded-lg p-3 text-center bg-slate-50`}>
                  <p className="text-xl font-black text-slate-800">82%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Match</p>
                </div>
                <div className={`border border-[var(--border-light)] rounded-lg p-3 text-center bg-slate-50`}>
                  <p className={`text-xl font-black ${badgeText} line-clamp-1`}>{selectedUniversity.admissionCompetitiveness}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Competitiveness</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${badgeClass} ${badgeBorder}`}>
                  <p className={`text-xl font-black ${badgeText}`}>{tier}</p>
                  <p className="text-[9px] font-bold uppercase opacity-80">Tier</p>
                </div>
              </div>

              {/* Requirements Check */}
              <div className="side-section-2">
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 flex justify-between items-center">
                  Requirements Check
                  <div className="flex bg-slate-100 rounded p-0.5">
                    {['S1', 'S2', 'S3'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setUniActiveTab(t)}
                        className={`text-[10px] font-bold px-2 py-1 rounded ${uniActiveTab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Test</th>
                        <th className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Required</th>
                        <th className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Your Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dummyReqs.map((req, i) => (
                        <tr key={i} className={`bg-white ${req.status ? 'hover:bg-emerald-50/30' : 'hover:bg-red-50/30'}`}>
                          <td className="px-4 py-3 font-medium text-slate-700">{req.label}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{req.required}</td>
                          <td className="px-4 py-3 text-center">
                            {req.status ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                {req.user} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                                {req.user} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Why This University */}
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">Why This University</h3>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {selectedUniversity.preparationFocus}. Additionally, this university offers exceptional programs in your suggested major alignment ({selectedUniversity.suggestedMajorAlignment}), making it a strong strategic choice for your academic career.
                </p>
              </div>

              {/* Application Timeline */}
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">Application Timeline</h3>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                  <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Start preparing 6 months before</p>
                  <p className="text-sm text-indigo-900">Estimated deadlines for Fall intake typically fall between <strong>Nov 2024 - Jan 2025</strong>.</p>
                </div>
              </div>

              {/* Available Scholarships */}
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-dark-900)] mb-3 border-b border-slate-100 pb-2">Available Scholarships</h3>
                <div 
                  className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-[var(--color-primary)] transition-colors group"
                  onClick={() => {
                    setSelectedUniversity(null);
                    // Mocking jumping to scholarship:
                    setActiveTab('scholarships');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
                      💰
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">International Merit Scholarship</p>
                      <p className="text-xs text-slate-500">Full tuition coverage</p>
                    </div>
                  </div>
                  <span className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </div>

            </div>
          );
        })()}
      </SidePanel>
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
