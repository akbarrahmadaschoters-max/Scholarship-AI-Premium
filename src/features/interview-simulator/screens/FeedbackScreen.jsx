import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

const FeedbackScreen = ({ feedbackData, config, panelist, onRestart }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animateRadar, setAnimateRadar] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    // Score count-up animation
    const duration = 1500;
    const targetScore = feedbackData?.overallScore || 0;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedScore(Math.round(ease * targetScore));

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedScore(targetScore);
      }
    }, stepDuration);

    // Trigger CSS animations after mount
    setTimeout(() => {
      setAnimateRadar(true);
      setAnimateBars(true);
    }, 100);

    return () => clearInterval(interval);
  }, [feedbackData?.overallScore]);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDimColor = (index) => {
    const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    return colors[index % colors.length];
  };

  // Radar Chart Calculations
  const SIZE = 300;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 100;
  
  const clusters = feedbackData?.clusterScores || [];
  const totalClusters = clusters.length;

  const calculatePoints = (scoreAccessor) => {
    if (totalClusters === 0) return "";
    return clusters.map((cluster, i) => {
      const angle = (Math.PI * 2 * i) / totalClusters - Math.PI / 2; // start top
      const score = scoreAccessor(cluster);
      const radius = (score / 5) * MAX_RADIUS;
      const x = CENTER + radius * Math.cos(angle);
      const y = CENTER + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  };

  // The center points for the initial state of the animation
  const centerPoints = clusters.map(() => `${CENTER},${CENTER}`).join(" ");
  // The actual points based on scores
  const actualPoints = calculatePoints(c => c.score);

  // Generate grid circles
  const gridCircles = [1, 2, 3, 4, 5].map(level => {
    const r = (level / 5) * MAX_RADIUS;
    return <circle key={level} cx={CENTER} cy={CENTER} r={r} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />;
  });

  async function handleDownloadPDF() {
    setIsGeneratingPDF(true);
    
    const element = document.getElementById('feedback-pdf-content');
    const today = new Date().toISOString().split('T')[0];
    const scholarshipPart = config.scholarship ?? config.type;
    const filename = `InterviewSim_${scholarshipPart}_${config.level}_${today}.pdf`;
    
    const opt = {
      margin: [12, 12, 12, 12],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
        backgroundColor: '#1a1a2e'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    await html2pdf().set(opt).from(element).save();
    setIsGeneratingPDF(false);
  }

  if (!feedbackData) return <div className="p-10 text-center">No feedback data available.</div>;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-12 font-sans text-slate-800">
      <style>{`
        .pdf-hide { display: none !important; }
        .stagger-fade {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s ease-out forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .polygon-transition {
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bar-transition {
          transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      {/* PDF Content Area */}
      <div id="feedback-pdf-content" className="bg-white max-w-5xl mx-auto shadow-sm">
        
        {/* --- SECTION 1: Hero Score --- */}
        <section 
          className="stagger-fade bg-gradient-to-br from-slate-900 to-blue-900 text-white p-10 md:p-14" 
          style={{ animationDelay: '0s' }}
        >
          <div className="text-center mb-8">
            <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase mb-2">
              {config.type} {config.scholarship ? `- ${config.scholarship}` : ''} • {config.level} • {config.field}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">Comprehensive Evaluation Report</h1>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="flex flex-col items-center">
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 mb-2 font-mono">
                {animatedScore}
              </div>
              <p className="text-blue-200 font-medium">Overall Score</p>
            </div>

            <div className="h-24 w-px bg-white/20 hidden md:block"></div>

            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-3 ${getGradeColor(feedbackData.grade)}`}>
                {feedbackData.grade}
              </div>
              <p className="font-bold text-lg">{feedbackData.gradeLabel}</p>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 pt-6 border-t border-white/10">
            <img src={panelist?.avatarUrl} alt="Panelist" className="w-8 h-8 rounded-full border border-white/30 bg-slate-800" />
            <p className="text-sm text-blue-100">
              Evaluated by <span className="font-semibold">{panelist?.name}</span> • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </section>

        <div className="p-8 md:p-12 space-y-16">
          
          {/* --- SECTION 2: Dua Kolom --- */}
          <section className="stagger-fade grid grid-cols-1 md:grid-cols-12 gap-10 items-center" style={{ animationDelay: '0.2s' }}>
            {/* Kolom Kiri: Radar Chart (55%) */}
            <div className="md:col-span-7 flex flex-col items-center">
              <h3 className="text-xl font-bold mb-6 text-slate-800">Cluster Competency Radar</h3>
              <div className="relative w-[300px] h-[300px]">
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                  {/* Grids */}
                  {gridCircles}
                  
                  {/* Axis lines */}
                  {clusters.map((c, i) => {
                    const angle = (Math.PI * 2 * i) / totalClusters - Math.PI / 2;
                    const x2 = CENTER + MAX_RADIUS * Math.cos(angle);
                    const y2 = CENTER + MAX_RADIUS * Math.sin(angle);
                    return <line key={`axis-${i}`} x1={CENTER} y1={CENTER} x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth="1" />;
                  })}

                  {/* Score Polygon */}
                  <polygon 
                    points={animateRadar ? actualPoints : centerPoints}
                    fill="rgba(79, 70, 229, 0.2)"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="polygon-transition"
                  />

                  {/* Labels */}
                  {clusters.map((cluster, i) => {
                    const angle = (Math.PI * 2 * i) / totalClusters - Math.PI / 2;
                    // Slightly larger radius for text
                    const x = CENTER + (MAX_RADIUS + 25) * Math.cos(angle);
                    const y = CENTER + (MAX_RADIUS + 25) * Math.sin(angle);
                    
                    // Simple alignment logic
                    let textAnchor = "middle";
                    if (Math.cos(angle) > 0.1) textAnchor = "start";
                    if (Math.cos(angle) < -0.1) textAnchor = "end";

                    return (
                      <text 
                        key={`label-${i}`} 
                        x={x} 
                        y={y} 
                        textAnchor={textAnchor} 
                        alignmentBaseline="middle" 
                        fontSize="10" 
                        fontWeight="600"
                        fill="#475569"
                        className="max-w-[80px]"
                      >
                        {cluster.clusterName.length > 15 ? cluster.clusterName.substring(0, 15) + '...' : cluster.clusterName}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Kolom Kanan: Ringkasan Strengths & Improvements (45%) */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                  <span className="text-xl">✓</span> Key Strengths
                </h4>
                <ul className="space-y-2">
                  {(feedbackData.strengths || []).slice(0, 3).map((s, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-amber-800 font-bold mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠</span> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {(feedbackData.improvements || []).slice(0, 3).map((imp, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* --- SECTION 3: Cluster Detail --- */}
          <section className="stagger-fade" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-200 pb-3">Performance Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clusters.map((cluster, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-700">{cluster.clusterName}</h4>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-md border border-indigo-200">
                      {cluster.score} / 5
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full bar-transition"
                      style={{ width: animateBars ? `${(cluster.score / 5) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 italic leading-relaxed">
                    "{cluster.comment}"
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* --- SECTION 4: Dimension Scores + Summary --- */}
          <section className="stagger-fade grid grid-cols-1 md:grid-cols-2 gap-10" style={{ animationDelay: '0.6s' }}>
            {/* Kolom Kiri: Dimension Scores */}
            <div>
              <h3 className="text-xl font-bold mb-5 text-slate-800">Evaluation Dimensions</h3>
              <div className="space-y-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                {(feedbackData.dimensionScores || []).map((dim, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                      <span>{dim.dimensionName}</span>
                      <span>{dim.score} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full bar-transition ${getDimColor(i)}`}
                        style={{ width: animateBars ? `${(dim.score / 5) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Summary & Recommendation */}
            <div className="space-y-5 flex flex-col justify-center">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                <p className="text-sm text-blue-900 leading-relaxed font-medium">
                  {feedbackData.summary}
                </p>
              </div>
              
              <div className="bg-indigo-600 text-white p-5 rounded-xl shadow-md">
                <p className="text-sm font-semibold flex items-start gap-2">
                  <span className="text-lg">💡</span> 
                  <span className="mt-0.5">{feedbackData.recommendation}</span>
                </p>
              </div>

              <div className="bg-slate-100 border border-slate-200 p-5 rounded-xl relative">
                <div className="absolute -top-3 left-4 text-3xl text-slate-300 font-serif">"</div>
                <p className="text-sm text-slate-600 italic leading-relaxed relative z-10 pt-1">
                  {feedbackData.panelNote}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-2 text-right">
                  — {panelist?.name}
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
      {/* --- AKHIR id="feedback-pdf-content" --- */}

      {/* FOOTER (pdf-hide) */}
      <div className="max-w-2xl mx-auto mt-8 px-6 pb-12 pdf-hide stagger-fade" style={{ animationDelay: '0.8s' }}>
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
        >
          {isGeneratingPDF ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            '⬇ Download PDF Report'
          )}
        </button>
        <button 
          onClick={onRestart}
          className="w-full py-3 mt-3 bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl font-bold text-base transition-colors"
        >
          ↺ Try Another Interview
        </button>
      </div>
    </div>
  );
};

export default FeedbackScreen;
