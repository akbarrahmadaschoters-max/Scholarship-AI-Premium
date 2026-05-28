import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DiagnosticProvider, useDiagnostic } from '../context/DiagnosticContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface DynamicListItem {
  id: string;
  title: string;
  description: string;
}

interface StudentProfile {
  fullName: string;
  targetCountries: string[];
  intendedMajors: string[];
  targetUniversities: string[];
  gpa: string;
  satScore: string;
  ieltsScore: string;
  honors: DynamicListItem[];
  competitions: DynamicListItem[];
  extracurriculars: DynamicListItem[];
  leadership: DynamicListItem[];
  volunteering: DynamicListItem[];
  projects: DynamicListItem[];
  workExperience: DynamicListItem[];
}

const defaultProfile: StudentProfile = {
  fullName: '',
  targetCountries: [],
  intendedMajors: [],
  targetUniversities: [],
  gpa: '',
  satScore: '',
  ieltsScore: '',
  honors: [],
  competitions: [],
  extracurriculars: [],
  leadership: [],
  volunteering: [],
  projects: [],
  workExperience: [],
};

const ProfilingContent = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { satResult, ieltsResult } = useDiagnostic();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState('Saved');

  const userId = currentUser?.uid || 'guest';
  const storageKey = `student_profiles_${userId}`;

  // Load from localStorage and initialize with diagnostic defaults if empty
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      // First time init: Try to grab predicted scores from Context/Diagnostic
      setProfile(prev => ({
        ...prev,
        fullName: currentUser?.displayName || '',
        satScore: satResult ? satResult.scoreRange.split('-')[0] : '',
        ieltsScore: ieltsResult ? ieltsResult.overallBand.toString() : '',
      }));
    }
  }, [userId, satResult, ieltsResult, currentUser]);

  // Autosave when profile changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      setSaveIndicator('Saving...');
      localStorage.setItem(storageKey, JSON.stringify(profile));
      
      // Also update the global score if they typed a new one, so the outcome page sees it
      // Wait, outcome page relies on diagnosticContext, but let's just save to profile for now.
      
      setTimeout(() => {
        setIsSaving(false);
        setSaveIndicator('Saved');
      }, 500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [profile, storageKey]);

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));
  const handleFinish = () => navigate('/outcome');

  const handleArrayInput = (field: keyof StudentProfile, value: string, max: number) => {
    const items = value.split(',').map(s => s.trim()).filter(s => s);
    if (items.length <= max) {
      setProfile({ ...profile, [field]: items });
    }
  };

  const addDynamicItem = (field: keyof StudentProfile) => {
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] as DynamicListItem[]), { id: Date.now().toString(), title: '', description: '' }]
    }));
  };

  const updateDynamicItem = (field: keyof StudentProfile, id: string, key: 'title' | 'description', value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as DynamicListItem[]).map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  };

  const removeDynamicItem = (field: keyof StudentProfile, id: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as DynamicListItem[]).filter(item => item.id !== id)
    }));
  };

  const renderDynamicList = (field: keyof StudentProfile, label: string) => {
    const items = profile[field] as DynamicListItem[];
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-slate-700">{label}</label>
          <button onClick={() => addDynamicItem(field)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-200">
            + Add New
          </button>
        </div>
        {items.length === 0 && <p className="text-xs text-slate-400 italic mb-2">No items added yet.</p>}
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-3 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
            <button 
              onClick={() => removeDynamicItem(field, item.id)}
              className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Title (e.g., President of Debate Club)"
                className="w-full text-sm p-2 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                value={item.title}
                onChange={e => updateDynamicItem(field, item.id, 'title', e.target.value)}
              />
              <input
                type="text"
                placeholder="Description / Achievement"
                className="w-full text-xs p-2 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                value={item.description}
                onChange={e => updateDynamicItem(field, item.id, 'description', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scholarship Profiling</h1>
          <p className="text-slate-500 font-medium mt-1">Build your comprehensive application portfolio.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-500">{saveIndicator}</span>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto p-0 overflow-hidden shadow-xl border-indigo-100">
        <div className="flex border-b border-slate-100">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 py-3 text-center text-sm font-bold border-b-2 ${step === s ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-400 bg-white'}`}>
              Step {s}
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Basic Information</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Countries <span className="text-xs text-slate-400 font-normal">(comma separated, max 10)</span></label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={profile.targetCountries.join(', ')} onChange={e => handleArrayInput('targetCountries', e.target.value, 10)} placeholder="USA, UK, Singapore" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Intended Majors <span className="text-xs text-slate-400 font-normal">(comma separated, max 5)</span></label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={profile.intendedMajors.join(', ')} onChange={e => handleArrayInput('intendedMajors', e.target.value, 5)} placeholder="Computer Science, Economics" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Universities <span className="text-xs text-slate-400 font-normal">(comma separated, max 15)</span></label>
                <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" rows={3}
                  value={profile.targetUniversities.join(', ')} onChange={e => handleArrayInput('targetUniversities', e.target.value, 15)} placeholder="MIT, Stanford, Oxford" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Academic Profile</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">High School GPA</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={profile.gpa} onChange={e => setProfile({...profile, gpa: e.target.value})} placeholder="e.g. 3.9/4.0 or 95/100" />
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-600 font-bold mb-3 uppercase tracking-wider">Standardized Tests</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">SAT Score</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white" 
                      value={profile.satScore} onChange={e => setProfile({...profile, satScore: e.target.value})} placeholder="e.g. 1450" />
                    <p className="text-xs text-slate-400 mt-1">Leave as predicted or enter actual score</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">IELTS Score</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white" 
                      value={profile.ieltsScore} onChange={e => setProfile({...profile, ieltsScore: e.target.value})} placeholder="e.g. 7.5" />
                    <p className="text-xs text-slate-400 mt-1">Leave as predicted or enter actual score</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Extracurriculars & Honors</h2>
              {renderDynamicList('honors', 'Awards & Honors')}
              {renderDynamicList('competitions', 'Competitions')}
              {renderDynamicList('extracurriculars', 'Extracurricular Activities')}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Leadership & Experience</h2>
              {renderDynamicList('leadership', 'Leadership Roles')}
              {renderDynamicList('volunteering', 'Volunteering')}
              {renderDynamicList('projects', 'Personal/School Projects')}
              {renderDynamicList('workExperience', 'Work Experience')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
            ← Back
          </Button>
          {step < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Continue →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinish} className="shadow-lg shadow-indigo-200">
              Save Profile & View Results ✓
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export const Profiling = () => {
  return (
    <DiagnosticProvider>
      <ProfilingContent />
    </DiagnosticProvider>
  );
};
