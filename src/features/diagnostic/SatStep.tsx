import React, { useState, useEffect } from 'react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

// Mocked subset of 5 questions for prototype
const mockSatQuestions = [
  { id: 1, section: 'Math', subtopic: 'Algebra', difficulty: 'Medium', type: 'multipleChoice', text: 'If 3x - y = 12 and y = 3, what is the value of x?', options: ['3', '4', '5', '6'], answer: '5', explanation: 'Substitute y=3 into the equation: 3x - 3 = 12, so 3x = 15, which means x = 5.' },
  { id: 2, section: 'Math', subtopic: 'Geometry', difficulty: 'Hard', type: 'multipleChoice', text: 'A circle has a circumference of 16π. What is its area?', options: ['16π', '32π', '64π', '256π'], answer: '64π', explanation: 'Circumference = 2πr = 16π, so r = 8. Area = πr² = π(8²) = 64π.' },
  { id: 3, section: 'Reading', subtopic: 'Literary Analysis', difficulty: 'Medium', type: 'multipleChoice', passage: 'The forest was silent, save for the rhythmic crunching of leaves beneath our boots. The air was crisp, carrying the scent of pine and impending snow.', text: 'Based on the passage, the author\'s tone can best be described as...', options: ['Optimistic', 'Cynical', 'Objective', 'Nostalgic'], answer: 'Nostalgic', explanation: 'The descriptive, sensory language evokes a sense of personal memory and reflection.' },
  { id: 4, section: 'Writing', subtopic: 'Transitions', difficulty: 'Easy', type: 'multipleChoice', text: 'Which choice provides the most effective transition from the previous sentence?', options: ['Furthermore,', 'However,', 'Therefore,', 'Meanwhile,'], answer: 'However,', explanation: 'The second sentence presents a contrast to the first, making "However" the correct choice.' },
  { id: 5, section: 'Writing', subtopic: 'Grammar', difficulty: 'Easy', type: 'multipleChoice', text: 'The flock of birds (is/are) flying south for the winter.', options: ['is', 'are'], answer: 'is', explanation: 'The subject "flock" is a collective noun, which takes a singular verb "is".' },
  // New short‑answer Math question (student‑produced response)
  { id: 6, section: 'Math', subtopic: 'Algebra', difficulty: 'Hard', type: 'shortAnswer', text: 'Solve for x: 2x² – 5x + 2 = 0. Provide the exact values.', answer: '', explanation: 'Use the quadratic formula: x = [5 ± sqrt(25 – 16)] / 4 = (5 ± 3) / 4, giving x = 2 or x = 0.5.' }
];

export const SatStep = () => {
  const { satAnswers, setSatAnswers, setCurrentStep, saveProgress, isSaving, setSatResult } = useDiagnostic();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes for full SAT mock
  
  const currentQuestion = mockSatQuestions[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(); // Auto-submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (option: string) => {
    setSatAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = async () => {
    if (currentIndex < mockSatQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (currentIndex % 2 === 0) await saveProgress(); // Autosave occasionally
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    // Compute mock SAT results based on answers
    let correct = 0;
    const sectionMistakes: Record<string, number> = {};
    mockSatQuestions.forEach(q => {
      const userAns = satAnswers[q.id];
      if (q.type === 'shortAnswer') {
        // Count as correct if any answer provided
        if (userAns && userAns.trim() !== '') {
          correct += 1;
        } else {
          sectionMistakes[q.section] = (sectionMistakes[q.section] || 0) + 1;
        }
      } else if (userAns === q.answer) {
        correct += 1;
      } else {
        sectionMistakes[q.section] = (sectionMistakes[q.section] || 0) + 1;
      }
    });
    // Simple scoring: base 400 + correct * 120 (max ~1000)
    const score = 400 + correct * 120;
    const mathVal = Math.round(score * 0.4);
    const rwVal = Math.round(score * 0.6);
    const classification = score < 700 ? 'Low' : score < 900 ? 'Mid' : 'High';
    const weaknesses = Object.entries(sectionMistakes)
      .filter(([, cnt]) => cnt > 0)
      .map(([sec]) => sec);
    const recommendations = weaknesses.map(w => `Review ${w} concepts and practice more questions.`);
    const satResult = {
      overallScore: `${score}`,
      scoreRange: `${score - 40}-${score + 40}`,
      classification,
      mathScore: `${mathVal - 20}-${mathVal + 20}`,
      readingWritingScore: `${rwVal - 20}-${rwVal + 20}`,
      weaknesses,
      recommendations,
    } as any;
    setSatResult(satResult);
    localStorage.setItem('sat_result', JSON.stringify(satResult));
    await saveProgress();
    setCurrentStep('ielts');
  };

  const progressPercentage = ((currentIndex + 1) / mockSatQuestions.length) * 100;

  return (
    <Card className="max-w-4xl mx-auto p-0 overflow-hidden shadow-lg border border-gray-200">
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Phase B</span>
          <h2 className="text-2xl font-bold">SAT Diagnostic Engine</h2>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className={`font-mono text-xl ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="h-2 bg-gray-100">
        <div 
          className="h-2 bg-indigo-500 transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 font-semibold text-sm rounded-full">
            {currentQuestion.section} Section
          </span>
          <span className="text-sm font-bold text-gray-400">
            Question {currentIndex + 1} of {mockSatQuestions.length}
          </span>
        </div>

        <div className="mb-4">
          {currentQuestion.subtopic && (
            <span className="inline-block mr-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-sm rounded">
              {currentQuestion.subtopic}
            </span>
          )}
          {currentQuestion.difficulty && (
            <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-800 text-sm rounded">
              {currentQuestion.difficulty}
            </span>
          )}
        </div>

        {currentQuestion.passage && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 text-gray-700 italic leading-relaxed">
            {currentQuestion.passage}
          </div>
        )}
        
        <h3 className="text-2xl font-semibold text-slate-900 leading-relaxed mb-10">
          {currentQuestion.text}
        </h3>

        {currentQuestion.type === 'shortAnswer' ? (
          <textarea
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder="Enter your answer..."
            value={satAnswers[currentQuestion.id] || ''}
            onChange={e => handleSelectOption(e.target.value)}
          />
        ) : (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => {
              const isSelected = satAnswers[currentQuestion.id] === option;
              const alphabet = String.fromCharCode(65 + idx); // A, B, C, D
              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all flex items-center group ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                  }`}>
                    {alphabet}
                  </span>
                  <span className={`text-lg font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {satAnswers[currentQuestion.id] && currentQuestion.explanation && (
          <div className="mt-4 p-3 bg-indigo-50 border-l-4 border-indigo-400 text-indigo-800 rounded">
            {currentQuestion.explanation}
          </div>
        )}

        <div className="mt-12 flex justify-between items-center border-t border-gray-100 pt-6">
          <span className="text-sm text-gray-500">
            {isSaving ? 'Autosaving...' : ''}
          </span>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleNext}
            disabled={!satAnswers[currentQuestion.id] || isSaving}
            className="px-8"
          >
            {currentIndex === mockSatQuestions.length - 1 ? 'Complete SAT Test' : 'Next Question'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
