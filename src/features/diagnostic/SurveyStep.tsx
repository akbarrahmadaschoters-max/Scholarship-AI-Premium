import React from 'react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const SurveyStep = () => {
  const { surveyData, setSurveyData, setCurrentStep, saveProgress, isSaving } = useDiagnostic();

  const handleDayToggle = (day: string) => {
    setSurveyData(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(day)
        ? prev.studyDays.filter(d => d !== day)
        : [...prev.studyDays, day]
    }));
  };

  const handleNext = async () => {
    await saveProgress();
    setCurrentStep('sat');
  };

  const isComplete = surveyData.satDate && surveyData.ieltsDate && surveyData.studyHours && surveyData.studyDays.length > 0;

  return (
    <Card className="max-w-3xl mx-auto p-8 shadow-lg">
      <div className="mb-8 border-b border-gray-100 pb-6">
        <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Step 1 of 4</span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Study Goals & Availability</h2>
        <p className="text-slate-500 mt-2">Let's build your personalized intensive study plan.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Official SAT Date</label>
            <input 
              type="date" 
              value={surveyData.satDate}
              onChange={e => setSurveyData({...surveyData, satDate: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Official IELTS Date</label>
            <input 
              type="date" 
              value={surveyData.ieltsDate}
              onChange={e => setSurveyData({...surveyData, ieltsDate: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">How many hours can you study per day?</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['<1 hour', '1–2 hours', '2–3 hours', '3–4 hours', '4+ hours'].map(hours => (
              <button
                key={hours}
                onClick={() => setSurveyData({...surveyData, studyHours: hours as any})}
                className={`py-3 px-2 rounded-xl text-sm font-semibold border transition-all ${
                  surveyData.studyHours === hours 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {hours}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Preferred study days</label>
          <div className="flex flex-wrap gap-3">
            {['weekdays', 'weekends', 'every day'].map(day => (
              <button
                key={day}
                onClick={() => handleDayToggle(day)}
                className={`py-2 px-5 rounded-full text-sm font-semibold border transition-all ${
                  surveyData.studyDays.includes(day)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {isSaving ? (
            <span className="flex items-center text-indigo-600"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Autosaving...</span>
          ) : 'Changes saved automatically'}
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleNext}
          disabled={!isComplete || isSaving}
        >
          Continue to SAT Test &rarr;
        </Button>
      </div>
    </Card>
  );
};
