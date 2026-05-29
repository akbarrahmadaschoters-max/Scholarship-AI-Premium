import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type DiagnosticStep = 'survey' | 'sat' | 'ielts' | 'results' | 'selection';

export interface SurveyData {
  satDate: string;
  ieltsDate: string;
  studyHours: '<1 hour' | '1–2 hours' | '2–3 hours' | '3–4 hours' | '4+ hours' | '';
  studyDays: string[];
}

export interface SatResult {
  scoreRange: string;
  overallScore: string;
  classification: string;
  mathScore: string;
  readingWritingScore: string;
  weaknesses: string[];
  recommendations: string[];
}

export interface IeltsResult {
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  cefrLevel: string;
  weaknesses: string[];
  recommendations: string[];
}

export interface DayPlan {
  date: string;
  day: string;
  tasks: {
    focus: string;
    title: string;
    type: 'lesson' | 'drilling' | 'review' | 'mock_test' | 'essay_practice' | 'speaking_practice';
    duration: number; // minutes
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  }[];
}

interface DiagnosticContextType {
  currentStep: DiagnosticStep;
  setCurrentStep: (step: DiagnosticStep) => void;
  surveyData: SurveyData;
  setSurveyData: React.Dispatch<React.SetStateAction<SurveyData>>;
  satAnswers: Record<number, string>;
  setSatAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  ieltsAnswers: Record<string, string>;
  setIeltsAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  satResult?: SatResult;
  setSatResult: React.Dispatch<React.SetStateAction<SatResult | undefined>>;
  ieltsResult?: IeltsResult;
  setIeltsResult: React.Dispatch<React.SetStateAction<IeltsResult | undefined>>;
  dailyStudyPlan: DayPlan[];
  setDailyStudyPlan: React.Dispatch<React.SetStateAction<DayPlan[]>>;
  weaknessAnalysis: string[];
  setWeaknessAnalysis: React.Dispatch<React.SetStateAction<string[]>>;
  improvementPlan: string[];
  setImprovementPlan: React.Dispatch<React.SetStateAction<string[]>>;
  saveProgress: () => void;
  isSaving: boolean;
}

const DiagnosticContext = createContext<DiagnosticContextType | null>(null);

export const useDiagnostic = () => {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  return ctx;
};

export const DiagnosticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<DiagnosticStep>('survey');
  const [surveyData, setSurveyData] = useState<SurveyData>({
    satDate: '',
    ieltsDate: '',
    studyHours: '',
    studyDays: [],
  });
  const [satAnswers, setSatAnswers] = useState<Record<number, string>>({});
  const [ieltsAnswers, setIeltsAnswers] = useState<Record<string, string>>({});
  const [satResult, setSatResult] = useState<SatResult | undefined>(undefined);
  const [ieltsResult, setIeltsResult] = useState<IeltsResult | undefined>(undefined);
  const [dailyStudyPlan, setDailyStudyPlan] = useState<DayPlan[]>([]);
  const [weaknessAnalysis, setWeaknessAnalysis] = useState<string[]>([]);
  const [improvementPlan, setImprovementPlan] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('diagnostic_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.surveyData) setSurveyData(parsed.surveyData);
        if (parsed.satAnswers) setSatAnswers(parsed.satAnswers);
        if (parsed.ieltsAnswers) setIeltsAnswers(parsed.ieltsAnswers);
        if (parsed.satResult) setSatResult(parsed.satResult);
        if (parsed.ieltsResult) setIeltsResult(parsed.ieltsResult);
        if (parsed.dailyStudyPlan) setDailyStudyPlan(parsed.dailyStudyPlan);
        if (parsed.weaknessAnalysis) setWeaknessAnalysis(parsed.weaknessAnalysis);
        if (parsed.improvementPlan) setImprovementPlan(parsed.improvementPlan);
      } catch (e) {
        console.error('Failed to load saved progress', e);
      }
    }
  }, []);

  // Load from Firebase when user logs in
  useEffect(() => {
    if (currentUser) {
      const fetchFirebase = async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.satResult) setSatResult(data.satResult);
            if (data.ieltsResult) setIeltsResult(data.ieltsResult);
            if (data.currentStep) setCurrentStep(data.currentStep);
          }
        } catch (e) {
          console.error('Failed to load from firebase', e);
        }
      };
      fetchFirebase();
    }
  }, [currentUser]);

  const saveProgress = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Read from localStorage to avoid stale closure state
    const lsSat = localStorage.getItem('sat_result');
    const lsIelts = localStorage.getItem('ielts_result');
    const finalSat = lsSat ? JSON.parse(lsSat) : satResult;
    const finalIelts = lsIelts ? JSON.parse(lsIelts) : ieltsResult;

    const data = {
      currentStep, surveyData, satAnswers, ieltsAnswers,
      satResult: finalSat, ieltsResult: finalIelts, dailyStudyPlan, weaknessAnalysis, improvementPlan,
    };
    localStorage.setItem('diagnostic_progress', JSON.stringify(data));
    if (finalIelts) localStorage.setItem('ielts_result', JSON.stringify(finalIelts));
    if (finalSat) localStorage.setItem('sat_result', JSON.stringify(finalSat));
    if (dailyStudyPlan.length > 0) localStorage.setItem('daily_study_plan', JSON.stringify(dailyStudyPlan));

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          satResult: finalSat || null,
          ieltsResult: finalIelts || null,
          currentStep
        }, { merge: true });
      } catch (e) {
        console.error('Failed to save progress to Firebase', e);
      }
    }

    setIsSaving(false);
  };

  return (
    <DiagnosticContext.Provider value={{
      currentStep, setCurrentStep,
      surveyData, setSurveyData,
      satAnswers, setSatAnswers,
      ieltsAnswers, setIeltsAnswers,
      satResult, setSatResult,
      ieltsResult, setIeltsResult,
      dailyStudyPlan, setDailyStudyPlan,
      weaknessAnalysis, setWeaknessAnalysis,
      improvementPlan, setImprovementPlan,
      saveProgress, isSaving,
    }}>
      {children}
    </DiagnosticContext.Provider>
  );
};
