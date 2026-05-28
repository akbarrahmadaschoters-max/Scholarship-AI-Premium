import React, { useState, useRef, useEffect } from 'react';

interface SpeakingRecorderProps {
  partNumber: number;
  prompt: string;
  followUps?: string[];
  onResult: (evaluation: any) => void; // speaking evaluation result
}

const SpeakingRecorder: React.FC<SpeakingRecorderProps> = ({ partNumber, prompt, followUps, onResult }) => {
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Check microphone availability on mount
  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        setMicAvailable(true);
      })
      .catch(() => setMicAvailable(false));
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      setMicAvailable(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const submitForReview = () => {
    if (!audioUrl) return;
    setEvalLoading(true);
    // For prototype, we send a placeholder transcript indicating audio URL
    fetch('/api/gemini/speaking-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: `Audio response for part ${partNumber}: ${audioUrl}` }),
    })
      .then(res => res.json())
      .then(data => {
        onResult(data);
      })
      .catch(() => {
        setEvalError(true);
        // Mock fallback
        onResult({ band: 6.0, fluency: '', lexical: '', grammar: '', pronunciation: '', strengths: [], improvements: [], sampleAnswer: '', nextSteps: '' });
      })
      .finally(() => setEvalLoading(false));
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 mb-4">
        <p className="font-semibold text-slate-800 whitespace-pre-line text-base leading-relaxed">{prompt}</p>
        {followUps && (
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {followUps.map((fu, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {fu}
              </li>
            ))}
          </ul>
        )}
      </div>

      {micAvailable !== false && (
        <div className="flex items-center gap-4 mb-2">
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
        </div>
      )}

      {micAvailable === false && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ Microphone unavailable.
        </div>
      )}

      {audioUrl && (
        <div className="mt-2">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {audioUrl && (
        <button
          onClick={submitForReview}
          disabled={evalLoading}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm"
        >
          {evalLoading ? 'Submitting...' : 'Submit for AI Review'}
        </button>
      )}

      {/* Fallback typed answer hidden behind a toggle */}
      {micAvailable === false && (
        <div>
          <button
            onClick={() => setShowFallback(prev => !prev)}
            className="text-sm text-indigo-600 underline"
          >
            {showFallback ? 'Hide typed answer' : 'Microphone not working? Type your answer instead.'}
          </button>
          {showFallback && (
            <textarea
              className="w-full h-40 border border-slate-200 rounded-xl p-4 mt-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Write your spoken answer here..."
              value={typedAnswer}
              onChange={e => setTypedAnswer(e.target.value)}
            />
          )}
        </div>
      )}

      {evalError && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ AI review failed. Showing mock feedback.
        </div>
      )}
    </div>
  );
};

export default SpeakingRecorder;
