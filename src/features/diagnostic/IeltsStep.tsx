import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { 
  callGeminiSpeakingFeedback, 
  callGeminiSpeakingEval,
  callGeminiWritingEval
} from '../../api/gemini';

// ─── Types ──────────────────────────────────────────────────────────────────
interface ListeningQuestion {
  id: string;
  questionType: 'multiple_choice' | 'short_answer' | 'note_completion' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  skillFocus: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ReadingQuestion {
  id: string;
  questionType: 'multiple_choice' | 'short_answer' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface SpeakingPart {
  part: number;
  type: 'familiar' | 'cue_card' | 'discussion';
  prompt: string;
  followUps?: string[];
}

interface SpeakingEval {
  band: number;
  fluency: string;
  lexical: string;
  grammar: string;
  pronunciation: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  nextSteps: string;
}

// ─── Dialogue script ────────────────────────────────────────────────────────
const DIALOGUE_SCRIPT = `
Section 1: University Accommodation Enquiry

Receptionist: Good morning, University Housing Office. How can I help you?
Student: Hi, my name is James. I'm a new international student and I'd like to find out about on-campus accommodation.
Receptionist: Of course. Are you looking for a single room or would you prefer a shared apartment?
Student: I think a single room would be better for studying. What options do you have?
Receptionist: We have two main halls. Maple Hall costs four hundred and fifty dollars per month and includes meals. Oak Hall is three hundred dollars but meals are not included.
Student: Which one is closer to the library?
Receptionist: Oak Hall is only a five-minute walk from the main library. Maple Hall is about fifteen minutes away.
Student: That's helpful. Is there a gym facility I can use?
Receptionist: Yes, both halls have access to the student fitness centre, which is open from six in the morning until ten at night.
Student: Great. One more question – when is the application deadline?
Receptionist: Applications must be submitted by the fifteenth of August. You'll also need two passport photos and a copy of your enrolment letter.
Student: Perfect. Thank you very much for your help.
Receptionist: You're welcome. Good luck with your studies!
`.trim();

const LISTENING_QUESTIONS: ListeningQuestion[] = [
  {
    id: 'l1',
    questionType: 'multiple_choice',
    question: '1. Why is James calling the Housing Office?',
    options: [
      'A. To pay his accommodation fees',
      'B. To enquire about on-campus housing',
      'C. To report a problem with his room',
      'D. To extend his accommodation contract',
    ],
    correctAnswer: 'B',
    explanation: 'James explicitly says he would like to find out about on-campus accommodation.',
    skillFocus: 'Main idea',
    difficulty: 'easy',
  },
  {
    id: 'l2',
    questionType: 'multiple_choice',
    question: '2. How much does Maple Hall cost per month?',
    options: ['A. $300', 'B. $350', 'C. $400', 'D. $450'],
    correctAnswer: 'D',
    explanation: 'The receptionist states Maple Hall costs four hundred and fifty dollars per month.',
    skillFocus: 'Specific detail',
    difficulty: 'easy',
  },
  {
    id: 'l3',
    questionType: 'short_answer',
    question: '3. How far is Oak Hall from the main library? (write in minutes)',
    options: undefined,
    correctAnswer: '5',
    explanation: 'The receptionist says Oak Hall is only a five-minute walk from the main library.',
    skillFocus: 'Specific detail',
    difficulty: 'medium',
  },
  {
    id: 'l4',
    questionType: 'note_completion',
    question: '4. Complete the note: The fitness centre closes at ______ pm.',
    options: undefined,
    correctAnswer: '10',
    explanation: 'The fitness centre is open until ten at night.',
    skillFocus: 'Note completion',
    difficulty: 'medium',
  },
  {
    id: 'l5',
    questionType: 'matching',
    question: '5. Which hall DOES NOT include meals?',
    options: ['A. Maple Hall', 'B. Oak Hall', 'C. Both halls', 'D. Neither hall'],
    correctAnswer: 'B',
    explanation: 'Maple Hall includes meals; Oak Hall does not.',
    skillFocus: 'Matching information',
    difficulty: 'medium',
  },
  {
    id: 'l6',
    questionType: 'short_answer',
    question: '6. What is the application deadline date? (write day and month, e.g. 15 August)',
    options: undefined,
    correctAnswer: '15 August',
    explanation: 'The receptionist states applications must be submitted by the fifteenth of August.',
    skillFocus: 'Specific detail',
    difficulty: 'hard',
  },
];

const READING_PASSAGES = [
  {
    id: 'p1',
    title: 'Climate Change and Ice Cores',
    content: `The history of global climate change is a complex tapestry of natural cycles and, more recently, anthropogenic influences. Understanding these shifts requires examining ice core samples from Antarctica, which trap atmospheric gases from hundreds of thousands of years ago. These samples reveal a strong correlation between carbon dioxide concentrations and global temperatures. However, critics often point to historical anomalies, such as the Medieval Warm Period, to suggest that current warming trends might be part of a natural cycle rather than human-induced.
    
Despite these historical fluctuations, the overwhelming consensus among climatologists is that the rate of temperature increase since the Industrial Revolution is unprecedented. The rapid burning of fossil fuels, widespread deforestation, and industrial agriculture have exponentially increased the concentration of greenhouse gases. Ice shelves that have remained stable for millennia are now collapsing at an alarming rate, leading to rising sea levels that threaten coastal communities worldwide. Furthermore, ocean acidification, a direct result of increased carbon absorption, is disrupting marine ecosystems and threatening biodiversity.`,
    questions: [
      {
        id: 'r1',
        questionType: 'multiple_choice',
        question: '1. According to the text, ice core samples show a correlation between temperatures and...',
        options: ['A. Antarctic wildlife populations', 'B. Carbon dioxide concentrations', 'C. The Medieval Warm Period', 'D. Human agricultural patterns'],
        correctAnswer: 'B',
        explanation: 'The text states: "These samples reveal a strong correlation between carbon dioxide concentrations and global temperatures."'
      },
      {
        id: 'r2',
        questionType: 'multiple_choice',
        question: '2. What historical anomaly do critics often point to?',
        options: ['A. The Medieval Warm Period', 'B. The Industrial Revolution', 'C. The Ice Age', 'D. The Anthropocene Epoch'],
        correctAnswer: 'A',
        explanation: 'Critics point to historical anomalies, such as the Medieval Warm Period.'
      },
      {
        id: 'r3',
        questionType: 'multiple_choice',
        question: '3. The rate of temperature increase is described as unprecedented since...',
        options: ['A. The Medieval Warm Period', 'B. The invention of the automobile', 'C. The Industrial Revolution', 'D. The dawn of agriculture'],
        correctAnswer: 'C',
        explanation: 'The overwhelming consensus is that the rate of temperature increase since the Industrial Revolution is unprecedented.'
      },
      {
        id: 'r4',
        questionType: 'multiple_choice',
        question: '4. Which of the following is NOT mentioned as a cause of increased greenhouse gases?',
        options: ['A. Burning of fossil fuels', 'B. Deforestation', 'C. Industrial agriculture', 'D. Volcanic eruptions'],
        correctAnswer: 'D',
        explanation: 'The text lists burning fossil fuels, deforestation, and industrial agriculture. Volcanic eruptions are not mentioned.'
      },
      {
        id: 'r5',
        questionType: 'multiple_choice',
        question: '5. What is the direct cause of ocean acidification according to the passage?',
        options: ['A. Deforestation', 'B. Increased carbon absorption', 'C. Melting ice shelves', 'D. Plastic pollution'],
        correctAnswer: 'B',
        explanation: 'Ocean acidification is described as a direct result of increased carbon absorption.'
      }
    ]
  },
  {
    id: 'p2',
    title: 'Solutions and Mitigation Strategies',
    content: `Mitigating these impacts requires a multifaceted approach. Transitioning to renewable energy sources like solar and wind power is critical, but it must be accompanied by significant changes in global consumption patterns. Innovations in carbon capture technology offer a potential, albeit currently expensive, solution to draw down existing atmospheric carbon. 

Ultimately, combating climate change is not merely a technological challenge, but a profound socioeconomic one, demanding unprecedented international cooperation and systemic policy shifts. Without these shifts, localized efforts will remain insufficient against a rapidly deteriorating global environment.`,
    questions: [
      {
        id: 'r6',
        questionType: 'multiple_choice',
        question: '6. What must accompany the transition to renewable energy sources?',
        options: ['A. More fossil fuel burning', 'B. Planting more trees', 'C. Changes in global consumption patterns', 'D. Immediate ocean cleanup'],
        correctAnswer: 'C',
        explanation: 'Transitioning to renewable energy... must be accompanied by significant changes in global consumption patterns.'
      },
      {
        id: 'r7',
        questionType: 'multiple_choice',
        question: '7. How does the passage describe current carbon capture technology?',
        options: ['A. Cheap and effective', 'B. Expensive', 'C. Obsolete', 'D. Widely available'],
        correctAnswer: 'B',
        explanation: 'Innovations in carbon capture technology offer a potential, albeit currently expensive, solution.'
      },
      {
        id: 'r8',
        questionType: 'short_answer',
        question: '8. What type of power sources are mentioned alongside solar? (1 word)',
        correctAnswer: 'wind',
        explanation: 'The text mentions "solar and wind power".'
      },
      {
        id: 'r9',
        questionType: 'matching',
        question: '9. True or False: Combating climate change is purely a technological challenge.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'The passage explicitly states it is "not merely a technological challenge, but a profound socioeconomic one".'
      },
      {
        id: 'r10',
        questionType: 'matching',
        question: '10. True or False: Localized efforts alone are sufficient to combat climate change.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'The text states: "Without these shifts, localized efforts will remain insufficient".'
      }
    ]
  }
];

const READING_QUESTIONS: ReadingQuestion[] = READING_PASSAGES.flatMap(p => p.questions as ReadingQuestion[]);

const SPEAKING_PARTS: SpeakingPart[] = [
  {
    part: 1,
    type: 'familiar',
    prompt: 'Tell me about your hometown. What do you like most about living there?',
    followUps: [
      'How long have you lived in your hometown?',
      'Would you like to live somewhere else in the future?',
    ],
  },
  {
    part: 2,
    type: 'cue_card',
    prompt:
      'Describe a time when you had to adapt to a significant change in your life. You should say:\n• what the change was\n• when it happened\n• how you felt about it\n• and explain how you adapted to this change.',
  },
  {
    part: 3,
    type: 'discussion',
    prompt:
      'In your opinion, why is it important for young people to be adaptable in today\'s world? How can schools help students develop this skill?',
  },
];

const MOCK_SPEAKING_EVAL: SpeakingEval = {
  band: 6.0,
  fluency: 'Generally fluent with some hesitation. Try to reduce filler words like "um" and "uh".',
  lexical:
    'Good range of vocabulary for familiar topics. Incorporate more collocations and idiomatic expressions.',
  grammar:
    'Mostly accurate use of simple and compound sentences. Work on complex structures such as conditionals and relative clauses.',
  pronunciation: 'Clearly intelligible. Focus on sentence stress and intonation for natural delivery.',
  strengths: [
    'Clear and relevant content',
    'Good use of examples to support points',
    'Organised response with clear progression',
  ],
  improvements: [
    'Reduce hesitation and self-correction',
    'Use more sophisticated vocabulary',
    'Extend complex grammar usage',
  ],
  sampleAnswer:
    'One significant change I experienced was moving abroad for my studies. It happened about two years ago when I was 18. Initially, I felt overwhelmed and homesick, particularly because I had to manage everything independently for the first time. However, I gradually adapted by joining student clubs, which helped me build a social network. I also established a daily routine, which gave me a sense of structure and stability. Looking back, that change was genuinely transformative – it made me far more self-reliant and culturally aware.',
  nextSteps:
    'Practice speaking on abstract topics for 10 minutes daily. Record yourself and listen back to identify areas for improvement.',
};

// ─── Score helpers ──────────────────────────────────────────────────────────
function calcListeningBand(answers: Record<string, string>): number {
  let correct = 0;
  LISTENING_QUESTIONS.forEach(q => {
    const student = (answers[q.id] || '').trim().toLowerCase();
    const expected = q.correctAnswer.trim().toLowerCase();
    if (student === expected) correct++;
  });
  // Rough IELTS band mapping (out of 6 questions)
  if (correct >= 6) return 8.0;
  if (correct >= 5) return 7.0;
  if (correct >= 4) return 6.0;
  if (correct >= 3) return 5.5;
  if (correct >= 2) return 5.0;
  return 4.0;
}

function calcReadingBand(answers: Record<string, string>): number {
  let correct = 0;
  READING_QUESTIONS.forEach(q => {
    const student = (answers[q.id] || '').trim().toLowerCase();
    const expected = q.correctAnswer.trim().toLowerCase();
    if (student === expected) correct++;
  });
  if (correct >= 9) return 8.0;
  if (correct >= 7) return 7.0;
  if (correct >= 5) return 6.0;
  if (correct >= 3) return 5.0;
  return 4.0;
}

function calcIeltsBand(
  listeningBand: number,
  readingBand: number,
  writingBand: number,
  speakingBand: number
): number {
  const avg = (listeningBand + readingBand + writingBand + speakingBand) / 4;
  return Math.round(avg * 2) / 2; // round to nearest 0.5
}

// ─── Component ──────────────────────────────────────────────────────────────
export const IeltsStep: React.FC = () => {
  const navigate = useNavigate();

  const { ieltsAnswers, setIeltsAnswers, setCurrentStep, setIeltsResult, saveProgress, isSaving } =
    useDiagnostic();

  const [currentSkill, setCurrentSkill] = useState<'listening' | 'reading' | 'writing' | 'speaking'>(
    'listening'
  );

  // ── Listening state ────────────────────────────────────────────────────
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [listeningSubmitted, setListeningSubmitted] = useState(false);
  const [listeningBand, setListeningBand] = useState<number | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [listeningGenerated, setListeningGenerated] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakerTurnsRef = useRef<Array<{ speaker: string; text: string }>>([]);
  const playIndexRef = useRef(0);

  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const [readingBand, setReadingBand] = useState<number | null>(null);

  // ── Writing state ──────────────────────────────────────────────────────
  const [writingEval, setWritingEval] = useState<any | null>(null);
  const [writingEvalLoading, setWritingEvalLoading] = useState(false);

  // Parse dialogue into speaker turns on mount
  useEffect(() => {
    const lines = DIALOGUE_SCRIPT.split('\n').filter(l => l.trim());
    const turns: Array<{ speaker: string; text: string }> = [];
    for (const line of lines) {
      const match = line.match(/^([\w\s]+?):\s*(.+)$/);
      if (match) {
        turns.push({ speaker: match[1].trim(), text: match[2].trim() });
      }
    }
    if (turns.length > 0) {
      speakerTurnsRef.current = turns;
    } else {
      speakerTurnsRef.current = [{ speaker: 'Narrator', text: DIALOGUE_SCRIPT }];
    }
  }, []);

  // Try to fetch enhanced dialogue from server
  const generateEnhancedAudio = async () => {
    try {
      const res = await fetch('/api/ielts/generate-listening-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: DIALOGUE_SCRIPT }),
      });
      const data = await res.json();
      if (data?.speakerTurns?.length > 0) {
        speakerTurnsRef.current = data.speakerTurns;
      }
      setListeningGenerated(true);
    } catch {
      setListeningGenerated(true); // Use local fallback
    }
  };

  // Get two different voices for two speakers
  const getVoiceForSpeaker = (speaker: string): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number } => {
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const isStudentSpeaker = speaker.toLowerCase().includes('student') || speaker.toLowerCase().includes('james');

    if (isStudentSpeaker) {
      // Student: younger-sounding, slightly higher pitch, normal rate
      const maleVoice = enVoices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female'));
      return { voice: maleVoice || enVoices[1] || null, pitch: 1.1, rate: 0.95 };
    } else {
      // Receptionist/other: professional, slightly deeper, slower rate
      const femaleVoice = enVoices.find(v => v.name.toLowerCase().includes('female'));
      return { voice: femaleVoice || enVoices[0] || null, pitch: 0.9, rate: 0.85 };
    }
  };

  const playNextTurn = () => {
    const turns = speakerTurnsRef.current;
    const idx = playIndexRef.current;

    if (idx >= turns.length) {
      setAudioPlaying(false);
      setCurrentSpeaker(null);
      return;
    }

    const turn = turns[idx];
    setCurrentSpeaker(turn.speaker);

    const utter = new SpeechSynthesisUtterance(turn.text);
    const voiceConfig = getVoiceForSpeaker(turn.speaker);
    if (voiceConfig.voice) utter.voice = voiceConfig.voice;
    utter.pitch = voiceConfig.pitch;
    utter.rate = voiceConfig.rate;
    utter.lang = 'en-GB';

    utter.onend = () => {
      playIndexRef.current = idx + 1;
      // Add a natural pause between turns (500-1000ms)
      setTimeout(playNextTurn, 600 + Math.random() * 400);
    };
    utter.onerror = () => {
      setAudioPlaying(false);
      setAudioError(true);
      setCurrentSpeaker(null);
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const playAudio = async () => {
    if (!('speechSynthesis' in window)) {
      setAudioError(true);
      return;
    }
    window.speechSynthesis.cancel();

    // Generate enhanced audio if not done yet
    if (!listeningGenerated) {
      await generateEnhancedAudio();
    }

    playIndexRef.current = 0;
    setAudioPlaying(true);
    setAudioError(false);

    // Ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      await new Promise<void>(resolve => {
        window.speechSynthesis.onvoiceschanged = () => resolve();
        setTimeout(resolve, 500); // Fallback timeout
      });
    }

    playNextTurn();
  };

  const pauseAudio = () => {
    window.speechSynthesis.pause();
    setAudioPlaying(false);
  };

  const resumeAudio = () => {
    window.speechSynthesis.resume();
    setAudioPlaying(true);
  };

  const restartAudio = () => {
    window.speechSynthesis.cancel();
    setAudioPlaying(false);
    setCurrentSpeaker(null);
    playIndexRef.current = 0;
    setTimeout(playAudio, 100);
  };

  // Cleanup speech on unmount / skill change
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentSkill]);

  const handleSubmitListening = () => {
    const band = calcListeningBand(listeningAnswers);
    setListeningBand(band);
    setListeningSubmitted(true);
    setIeltsAnswers(prev => ({ ...prev, ...listeningAnswers, _listeningBand: String(band) }));
  };

  const handleSubmitReading = () => {
    const band = calcReadingBand(readingAnswers);
    setReadingBand(band);
    setReadingSubmitted(true);
    setIeltsAnswers(prev => ({ ...prev, ...readingAnswers, _readingBand: String(band) }));
  };

  const [writingEvalError, setWritingEvalError] = useState<string | null>(null);

  const handleSubmitWriting = async () => {
    setWritingEvalLoading(true);
    setWritingEvalError(null);
    try {
      const essay = ieltsAnswers['write_1'] || '';
      const result = await callGeminiWritingEval(essay);
      if (!result) {
        throw new Error('No evaluation result returned from AI.');
      }
      setWritingEval(result);
      if (result?.band) {
        setIeltsAnswers(prev => ({ ...prev, _writingBand: String(result.band) }));
      }
    } catch (err: any) {
      console.error('Failed to evaluate writing:', err);
      setWritingEvalError(err.message || 'Failed to submit essay for evaluation. Please try again.');
    } finally {
      setWritingEvalLoading(false);
    }
  };

  // ── Speaking state ─────────────────────────────────────────────────────
  const [speakingPartIdx, setSpeakingPartIdx] = useState(0);
  const [speakingAnswers, setSpeakingAnswers] = useState<Record<number, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [speakingEval, setSpeakingEval] = useState<SpeakingEval | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState(false);
  const [speakingDone, setSpeakingDone] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [partFeedback, setPartFeedback] = useState<Record<number, string>>({});
  const [partFeedbackLoading, setPartFeedbackLoading] = useState(false);

  // Check mic availability and init speech recognition on mount
  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        setMicAvailable(true);
      })
      .catch(() => setMicAvailable(false));

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setSpeechTranscript(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setSpeechTranscript('');
      try { recognitionRef.current?.start(); } catch (e) {} // ignore if already started
      setIsRecording(true);
    } catch {
      setMicAvailable(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    try { recognitionRef.current?.stop(); } catch (e) {}
    setIsRecording(false);
  };

  const currentSpeakingPart = SPEAKING_PARTS[speakingPartIdx];

  const saveCurrentSpeakingAnswer = () => {
    const answer = speechTranscript.trim() || '[Audio recording submitted]';
    setSpeakingAnswers(prev => ({ ...prev, [currentSpeakingPart.part]: answer }));
    return answer;
  };

  const handleNextSpeakingPart = async () => {
    if (isRecording) stopRecording();
    const transcript = saveCurrentSpeakingAnswer();
    setAudioURL(null); // Clear audio for next part

    setPartFeedbackLoading(true);
    const feedbackData = await callGeminiSpeakingFeedback(currentSpeakingPart.part, currentSpeakingPart.prompt, transcript);
    if (feedbackData?.feedback) {
      setPartFeedback(prev => ({ ...prev, [currentSpeakingPart.part]: feedbackData.feedback }));
    }
    setPartFeedbackLoading(false);
    setSpeechTranscript('');

    if (speakingPartIdx < SPEAKING_PARTS.length - 1) {
      setSpeakingPartIdx(p => p + 1);
    } else {
      handleSubmitSpeaking();
    }
  };

  const handleSubmitSpeaking = async () => {
    const finalAnswers = { ...speakingAnswers };
    const answer = '[Audio recording submitted]';
    finalAnswers[currentSpeakingPart.part] = answer;
    setSpeakingAnswers(finalAnswers);
    setEvalLoading(true);
    setEvalError(false);

    const transcript = Object.entries(finalAnswers)
      .map(([part, ans]) => `Part ${part}: ${ans}`)
      .join('\n\n');

    const result = await callGeminiSpeakingEval(transcript);
    setSpeakingEval(result);
    if (result === MOCK_SPEAKING_EVAL) {
      setEvalError(true);
    }
    setEvalLoading(false);
    setSpeakingDone(true);
  };

  // ── Finish IELTS ───────────────────────────────────────────────────────
  const handleFinishIelts = async () => {
    const listeningB = listeningBand ?? 5.0;
    const readingB = readingBand ?? 5.0;
    const writingB = writingEval?.band ?? 5.0;
    const speakingB = speakingEval?.band ?? MOCK_SPEAKING_EVAL.band;
    const overall = calcIeltsBand(listeningB, readingB, writingB, speakingB);

    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    if (listeningB < 6) { weaknesses.push('Listening comprehension'); recommendations.push('Practice IELTS Section 1–4 audio drills daily'); }
    if (readingB < 6) { weaknesses.push('Reading accuracy'); recommendations.push('Work on skimming and scanning techniques'); }
    if (writingB < 6) { weaknesses.push('Writing task response'); recommendations.push('Practice Task 2 essays with timed conditions'); }
    if (speakingB < 6) { weaknesses.push('Speaking fluency'); recommendations.push('Record and review 10-minute speaking sessions'); }

    const result = {
      overallBand: overall,
      listeningBand: listeningB,
      readingBand: readingB,
      writingBand: writingB,
      speakingBand: speakingB,
      cefrLevel: overall >= 8 ? 'C2' : overall >= 6.5 ? 'C1' : overall >= 5.5 ? 'B2' : overall >= 4.5 ? 'B1' : 'A2',
      weaknesses,
      recommendations,
    };

    setIeltsResult(result);
    localStorage.setItem('ielts_result', JSON.stringify(result));
    await saveProgress();
    setCurrentStep('results');
  };

  // ─── Skill progress indicator ──────────────────────────────────────────
  const skills: Array<'listening' | 'reading' | 'writing' | 'speaking'> = [
    'listening', 'reading', 'writing', 'speaking',
  ];
  const skillLabels = ['Listening', 'Reading', 'Writing', 'Speaking'];

  return (
    <Card className="max-w-4xl mx-auto p-0 overflow-hidden shadow-2xl border border-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Phase C</span>
            <h2 className="text-2xl font-bold">IELTS Diagnostic Engine</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {skills.map((s, i) => (
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                  currentSkill === s
                    ? 'bg-white text-indigo-900'
                    : 'bg-indigo-800/50 text-indigo-300'
                }`}
              >
                {skillLabels[i]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* ═══════════════ LISTENING ═══════════════ */}
        {currentSkill === 'listening' && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Section 1</span>
              <h3 className="text-xl font-bold text-slate-900">University Accommodation Enquiry</h3>
              <p className="text-slate-500 text-sm mt-1">
                Listen to the conversation between a student and a housing officer, then answer the questions below.
              </p>
            </div>

            {/* Audio player */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.236 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.236l4.147-3.784a1 1 0 011 .86zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">IELTS Listening Track 1</p>
                  <p className="text-xs text-slate-500">Browser TTS • en-GB</p>
                </div>
              </div>

              {audioError && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  ⚠️ Audio is unavailable in this browser.
                </div>
              )}

              <div className="flex items-center gap-3">
                {!audioPlaying ? (
                  <Button variant="primary" onClick={playAudio} id="btn-play-audio">
                    ▶ Play
                  </Button>
                ) : (
                  <Button variant="outline" onClick={pauseAudio} id="btn-pause-audio">
                    ⏸ Pause
                  </Button>
                )}
                {window.speechSynthesis?.paused && (
                  <Button variant="outline" onClick={resumeAudio} id="btn-resume-audio">
                    ▶ Resume
                  </Button>
                )}
                <Button variant="outline" onClick={restartAudio} id="btn-restart-audio">
                  ↺ Restart
                </Button>

              </div>

              {audioPlaying && (
                <div className="mt-3 flex items-center gap-3 text-indigo-700 text-sm font-medium bg-indigo-50/50 rounded-lg px-3 py-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Playing audio…</span>
                  {currentSpeaker && (
                    <span className="ml-auto px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                      🗣 {currentSpeaker}
                    </span>
                  )}
                </div>
              )}


            </div>

            {/* Questions */}
            {!listeningSubmitted ? (
              <div className="space-y-6">
                {LISTENING_QUESTIONS.map(q => (
                  <div key={q.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <p className="font-medium text-slate-800 mb-3">{q.question}</p>
                    {q.questionType === 'multiple_choice' || q.questionType === 'matching' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options!.map(opt => {
                          const letter = opt.charAt(0);
                          const selected = listeningAnswers[q.id] === letter;
                          return (
                            <button
                              key={opt}
                              onClick={() => setListeningAnswers(prev => ({ ...prev, [q.id]: letter }))}
                              className={`text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                selected
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Type your answer..."
                        value={listeningAnswers[q.id] || ''}
                        onChange={e => setListeningAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    id="btn-submit-listening"
                    onClick={handleSubmitListening}
                    disabled={Object.keys(listeningAnswers).length < LISTENING_QUESTIONS.length}
                  >
                    Submit Listening Answers
                  </Button>
                </div>
              </div>
            ) : (
              /* Results view */
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl p-6 text-center shadow-lg">
                  <p className="text-sm font-medium text-indigo-200 mb-1">Estimated Listening Band</p>
                  <p className="text-5xl font-black">{listeningBand?.toFixed(1)}</p>
                  <p className="text-sm text-indigo-200 mt-1">out of 9.0</p>
                </div>
                {LISTENING_QUESTIONS.map(q => {
                  const student = (listeningAnswers[q.id] || '').trim().toLowerCase();
                  const correct = q.correctAnswer.trim().toLowerCase();
                  const isCorrect = student === correct;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl p-4 border text-sm ${
                        isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p className="font-medium text-slate-800 mb-1">{q.question}</p>
                      <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {isCorrect ? '✓ Correct' : `✗ Your answer: ${listeningAnswers[q.id] || '—'}`}
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-600 mt-1">
                          Correct answer: <span className="font-semibold">{q.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-slate-500 mt-1 italic">{q.explanation}</p>
                    </div>
                  );
                })}
                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="lg" id="btn-continue-reading" onClick={() => setCurrentSkill('reading')}>
                    Continue to Reading →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ READING ═══════════════ */}
        {currentSkill === 'reading' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Section 2</span>
                <h3 className="text-xl font-bold text-slate-900">Academic Reading</h3>
              </div>
            </div>

            {!readingSubmitted ? (
              <div className="space-y-8">
                {READING_PASSAGES.map((passage, pIdx) => (
                  <div key={passage.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-50 border-b border-slate-200 p-4">
                      <h4 className="font-bold text-slate-800">Passage {pIdx + 1}: {passage.title}</h4>
                    </div>
                    <div className="p-6">
                      <div className="mb-6 p-5 bg-indigo-50/50 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-indigo-100">
                        {passage.content}
                      </div>
                      
                      <div className="space-y-6">
                        {passage.questions.map((q: any) => (
                          <div key={q.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                            <p className="font-medium text-slate-800 mb-3">{q.question}</p>
                            {q.questionType === 'multiple_choice' || q.questionType === 'matching' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options!.map((opt: string) => {
                                  let letter = opt;
                                  if (q.questionType === 'multiple_choice') {
                                    letter = opt.charAt(0);
                                  }
                                  const selected = readingAnswers[q.id] === letter;
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => setReadingAnswers(prev => ({ ...prev, [q.id]: letter }))}
                                      className={`text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                        selected
                                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="Type your answer..."
                                value={readingAnswers[q.id] || ''}
                                onChange={e => setReadingAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    id="btn-submit-reading"
                    onClick={handleSubmitReading}
                    disabled={Object.keys(readingAnswers).length < READING_QUESTIONS.length}
                  >
                    Submit Reading Answers
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl p-6 text-center shadow-lg">
                  <p className="text-sm font-medium text-indigo-200 mb-1">Estimated Reading Band</p>
                  <p className="text-5xl font-black">{readingBand?.toFixed(1)}</p>
                  <p className="text-sm text-indigo-200 mt-1">out of 9.0</p>
                </div>
                {READING_QUESTIONS.map(q => {
                  const student = (readingAnswers[q.id] || '').trim().toLowerCase();
                  const correct = q.correctAnswer.trim().toLowerCase();
                  const isCorrect = student === correct;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl p-4 border text-sm ${
                        isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p className="font-medium text-slate-800 mb-1">{q.question}</p>
                      <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {isCorrect ? '✓ Correct' : `✗ Your answer: ${readingAnswers[q.id] || '—'}`}
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-600 mt-1">
                          Correct answer: <span className="font-semibold">{q.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-slate-500 mt-1 italic">{q.explanation}</p>
                    </div>
                  );
                })}
                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="lg" id="btn-continue-writing" onClick={() => setCurrentSkill('writing')}>
                    Continue to Writing →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ WRITING ═══════════════ */}
        {currentSkill === 'writing' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Section 3</span>
                <h3 className="text-xl font-bold text-slate-900">Writing Task 2</h3>
              </div>
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">UPDATED FLOW ACTIVE</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
              <p className="font-semibold text-indigo-900 mb-2">
                Some people believe that university education should be free for everyone. Others think that students should pay for their higher education.
              </p>
              <p className="text-indigo-700 font-medium">
                Discuss both these views and give your own opinion. Write at least 250 words.
              </p>
            </div>
            <textarea
              className="w-full h-64 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-4 text-sm outline-none resize-none"
              placeholder="Start typing your essay here..."
              value={ieltsAnswers['write_1'] || ''}
              onChange={e => setIeltsAnswers(prev => ({ ...prev, write_1: e.target.value }))}
              disabled={!!writingEval || writingEvalLoading}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-slate-400">
                Word count: {(ieltsAnswers['write_1'] || '').split(/\s+/).filter(w => w.length > 0).length}
              </p>
              {!writingEval && (
                <Button variant="primary" onClick={handleSubmitWriting} disabled={writingEvalLoading}>
                  {writingEvalLoading ? 'Evaluating...' : 'Submit Essay'}
                </Button>
              )}
            </div>
            {writingEvalError && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                ⚠️ {writingEvalError}
              </div>
            )}

            {writingEval && (
              <div className="mt-8 space-y-4">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl p-6 text-center shadow-lg">
                  <p className="text-sm font-medium text-indigo-200 mb-1">Estimated Writing Band</p>
                  <p className="text-5xl font-black">{writingEval.band?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-indigo-200 mt-1">out of 9.0</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Task Response', value: writingEval.taskResponse },
                    { label: 'Coherence & Cohesion', value: writingEval.coherence },
                    { label: 'Lexical Resource', value: writingEval.lexical },
                    { label: 'Grammatical Range', value: writingEval.grammar },
                  ].map(item => (
                    <div key={item.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{item.label}</p>
                      <p className="text-sm text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="font-semibold text-green-800 mb-2">✓ Strengths</p>
                    <ul className="space-y-1">
                      {writingEval.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="font-semibold text-amber-800 mb-2">↑ Areas to Improve</p>
                    <ul className="space-y-1">
                      {writingEval.improvements?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="primary" size="lg" id="btn-continue-speaking" onClick={() => setCurrentSkill('speaking')}>
                    Continue to Speaking →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SPEAKING ═══════════════ */}
        {currentSkill === 'speaking' && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Section 4</span>
              <h3 className="text-xl font-bold text-slate-900">
                Speaking – Part {currentSpeakingPart.part}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {currentSpeakingPart.type === 'familiar'
                  ? 'Answer familiar topic questions.'
                  : currentSpeakingPart.type === 'cue_card'
                  ? 'Prepare 1 minute, then speak for 2 minutes.'
                  : 'Discuss abstract ideas with extended answers.'}
              </p>
            </div>

            {!speakingDone ? (
              <div>
                {/* Prompt card */}
                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 mb-6">
                  <p className="font-semibold text-slate-800 whitespace-pre-line text-base leading-relaxed">
                    {currentSpeakingPart.prompt}
                  </p>
                  {currentSpeakingPart.followUps && (
                    <ul className="mt-4 space-y-1 text-sm text-slate-600">
                      {currentSpeakingPart.followUps.map((fu, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          {fu}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Recording UI */}
                {micAvailable !== false && !audioURL && (
                  <div className="flex items-center gap-4 mb-5">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        id="btn-start-record"
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-sm shadow-md transition-all"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        id="btn-stop-record"
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full font-semibold text-sm shadow-md transition-all animate-pulse"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        Stop ({recordingTime}s)
                      </button>
                    )}
                    {micAvailable === null && (
                      <span className="text-xs text-slate-400">Checking microphone…</span>
                    )}
                  </div>
                )}

                {/* Mic unavailable notice */}
                {micAvailable === false && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    ⚠️ Microphone is unavailable. Please allow microphone access in your browser settings and reload the page.
                  </div>
                )}

                {/* Audio player for recorded response */}
                {audioURL && (
                  <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">🎙️ Your submitted speaking response</p>
                    <audio controls src={audioURL} className="w-full" />
                    <p className="text-xs text-emerald-600 mt-2">✓ Recording saved. You may proceed to the next part.</p>
                  </div>
                )}

                {partFeedbackLoading && (
                  <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></span>
                    <span className="text-sm text-blue-800 font-medium">AI is generating feedback for this part...</span>
                  </div>
                )}

                {/* Saved answers and AI feedback from previous parts */}
                {Object.keys(speakingAnswers).length > 0 && (
                  <div className="mt-4 space-y-3">
                    {Object.entries(speakingAnswers).map(([part, ans]) => (
                      <div key={part} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                        <p className="font-bold text-slate-800 mb-1">Part {part} Answer:</p>
                        <p className="text-slate-600 italic mb-2">"{ans}"</p>
                        {partFeedback[Number(part)] && (
                          <div className="mt-2 bg-indigo-50 p-3 rounded border border-indigo-100">
                            <p className="font-semibold text-indigo-800 text-xs uppercase">AI Feedback</p>
                            <p className="text-indigo-900 text-sm">{partFeedback[Number(part)]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-400">
                    Part {speakingPartIdx + 1} of {SPEAKING_PARTS.length}
                  </span>
                  <Button
                    variant="primary"
                    size="lg"
                    id="btn-next-speaking-part"
                    onClick={handleNextSpeakingPart}
                    disabled={(!audioURL && !speechTranscript) || partFeedbackLoading}
                  >
                    {speakingPartIdx < SPEAKING_PARTS.length - 1
                      ? `Next Part (${speakingPartIdx + 2}/${SPEAKING_PARTS.length}) →`
                      : 'Submit Speaking →'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Speaking evaluation */
              <div>
                {evalLoading && (
                  <div className="flex items-center gap-3 p-5 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 animate-pulse">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-indigo-700 font-medium">AI is reviewing your speaking answer…</p>
                  </div>
                )}

                {evalError && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    ⚠️ AI review failed. Showing mock feedback instead.
                  </div>
                )}

                {speakingEval && (
                  <div className="space-y-5">
                    {/* Band score */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl p-6 text-center shadow-lg">
                      <p className="text-sm font-medium text-indigo-200 mb-1">Estimated Speaking Band</p>
                      <p className="text-5xl font-black">{speakingEval.band.toFixed(1)}</p>
                      <p className="text-sm text-indigo-200 mt-1">out of 9.0</p>
                    </div>

                    {/* Submitted answers */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-800 mb-3">Your Submitted Answers</h4>
                      {Object.entries(speakingAnswers).map(([part, ans]) => (
                        <div key={part} className="mb-3">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Part {part}</p>
                          <p className="text-sm text-slate-700">{String(ans)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Criteria */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Fluency & Coherence', value: speakingEval.fluency },
                        { label: 'Lexical Resource', value: speakingEval.lexical },
                        { label: 'Grammar', value: speakingEval.grammar },
                        { label: 'Pronunciation', value: speakingEval.pronunciation },
                      ].map(item => (
                        <div key={item.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{item.label}</p>
                          <p className="text-sm text-slate-700">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="font-semibold text-green-800 mb-2">✓ Strengths</p>
                        <ul className="space-y-1">
                          {speakingEval.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-semibold text-amber-800 mb-2">↑ Areas to Improve</p>
                        <ul className="space-y-1">
                          {speakingEval.improvements.map((s, i) => (
                            <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Sample answer */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                      <p className="font-semibold text-indigo-900 mb-2">📝 Improved Sample Answer</p>
                      <p className="text-sm text-indigo-800 leading-relaxed">{speakingEval.sampleAnswer}</p>
                    </div>

                    {/* Next steps */}
                    <div className="bg-slate-800 text-white rounded-xl p-5">
                      <p className="font-semibold mb-1">🎯 Next Practice Recommendation</p>
                      <p className="text-sm text-slate-300">{speakingEval.nextSteps}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-sm text-slate-400">{isSaving ? 'Saving…' : ''}</span>
                      <Button
                        variant="primary"
                        size="lg"
                        id="btn-finish-ielts"
                        onClick={handleFinishIelts}
                      >
                        Complete IELTS & View Results →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
