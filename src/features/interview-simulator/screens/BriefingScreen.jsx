import React, { useState } from 'react';

const BriefingScreen = ({ config, panelist, onStart }) => {
  const [imageError, setImageError] = useState(false);

  // Helper to get initials if image fails
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => !p.includes('.')); // naive filter for "Dr.", "Prof."
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  };

  return (
    <div className="w-full max-w-[700px] mx-auto p-4 md:p-8">
      {/* Inline styles for custom animations to avoid assuming tailwind.config.js modifications */}
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .anim-slide-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }
        .anim-slide-right {
          animation: slideInRight 0.6s ease-out forwards;
        }
      `}</style>

      {/* TOP PART - Panelist Card */}
      <div className="bg-slate-900 rounded-t-2xl p-8 relative overflow-hidden anim-slide-left shadow-xl">
        {/* Subtle background decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="shrink-0">
            {imageError || !panelist?.avatarUrl ? (
              <div className="w-[100px] h-[100px] rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {getInitials(panelist?.name || 'Panelist')}
              </div>
            ) : (
              <img 
                src={panelist?.avatarUrl} 
                alt={panelist?.name} 
                onError={() => setImageError(true)}
                className="w-[100px] h-[100px] rounded-full border-4 border-white object-cover shadow-lg bg-gray-100"
              />
            )}
          </div>

          {/* Panelist Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">
              {panelist?.name || 'Assigned Panelist'}
            </h2>
            <p className="text-slate-300 font-medium mb-3">
              {panelist?.title} • {panelist?.institution}
            </p>
            <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">
              {panelist?.nationality}
            </span>
          </div>
        </div>

        <hr className="border-slate-800 my-6" />
        
        <p className="text-indigo-300 italic text-lg text-center font-medium">
          "{panelist?.quote || "I look forward to hearing your perspectives today."}"
        </p>
      </div>

      {/* BOTTOM PART - Rules */}
      <div className="bg-white rounded-b-2xl p-8 border border-t-0 border-gray-200 shadow-xl anim-slide-right">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Before We Begin</h3>
        
        <ul className="space-y-4 mb-8">
          <li className="flex items-start gap-3">
            <span className="text-xl">🇬🇧</span>
            <span className="text-gray-700">This interview will be conducted entirely in English</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">⏱️</span>
            <span className="text-gray-700">You have 45 minutes maximum</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">📝</span>
            <span className="text-gray-700">15–20 questions will be asked</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">💬</span>
            <span className="text-gray-700">Answer as honestly and specifically as possible</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">📊</span>
            <span className="text-gray-700">Detailed feedback will be given after the interview ends</span>
          </li>
        </ul>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
          <span className="text-blue-500 text-xl shrink-0">💡</span>
          <p className="text-sm text-blue-800 leading-relaxed font-medium">
            <span className="font-bold">Tip:</span> Use the STAR method (Situation, Task, Action, Result) for experience-based questions.
          </p>
        </div>

        <button 
          onClick={onStart}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors shadow-md"
        >
          I'm Ready — Start Interview →
        </button>
      </div>
    </div>
  );
};

export default BriefingScreen;
