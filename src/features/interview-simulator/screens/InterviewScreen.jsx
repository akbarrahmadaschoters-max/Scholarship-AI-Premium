import React, { useState, useEffect, useRef } from 'react';
import { callAI } from '../utils/aiClient';
import { selectQuestions, buildSystemPrompt } from '../utils/questionSelector';

const InterviewScreen = ({ config, panelist, onComplete }) => {
  // State
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(1);
  const [isInterviewDone, setIsInterviewDone] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(2700);
  const [error, setError] = useState(null);

  // New Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState('');

  // Fallback states for when voice is not supported
  const [inputText, setInputText] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const transcriptRef = useRef(transcript);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Initial load & check support
  useEffect(() => {
    let isMounted = true;
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setVoiceSupported(supported);

    if (supported) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const text = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setLiveTranscript(text);
        liveTranscriptRef.current = text;
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        const finalText = liveTranscriptRef.current.trim();
        if (finalText) {
          setLastUserMessage(finalText);
          sendMessage(finalText);
          setLiveTranscript('');
          liveTranscriptRef.current = '';
        }
      };

      recognitionRef.current.onerror = (event) => {
        // AbortError can happen when stopping manually, ignore it unless needed
        if (event.error !== 'aborted') {
          setIsRecording(false);
          setError("Microphone error: " + event.error + ". Please try again.");
        }
      };
    }

    const initInterview = async () => {
      const questions = selectQuestions(config);
      const prompt = buildSystemPrompt(config, panelist, questions);
      
      setSelectedQuestions(questions);
      setSystemPrompt(prompt);

      setIsLoading(true);
      try {
        const initialUserMsg = { role: "user", content: "I am ready for the interview. Please begin by greeting me and asking the first question." };
        const reply = await callAI({ 
          systemPrompt: prompt, 
          messages: [initialUserMsg] 
        });
        if (!isMounted) return;

        const assistantMsg = { role: "assistant", content: reply };
        const transMsg = { role: panelist.name, text: reply, timestamp: Date.now() };

        setConversationHistory([initialUserMsg, assistantMsg]);
        setTranscript([transMsg]);
        
        speakText(reply);

      } catch (err) {
        console.error(err);
        if (isMounted) setError(err.message || "Connection error. Failed to start interview.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initInterview();
    return () => { 
      isMounted = false; 
      window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, [config, panelist]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete(transcriptRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onComplete]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isLoading, error, isRecording, liveTranscript]);

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    setIsAISpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (
          v.name.includes('Google') ||
          v.name.includes('Neural') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel')
        )
      );
      if (preferred) utterance.voice = preferred;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const startRecording = () => {
    window.speechSynthesis.cancel();
    setIsAISpeaking(false);
    setError(null);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch(e) {
      // In case it's already started
      console.warn(e);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current.stop();
  };

  const sendMessage = async (textOverride = null) => {
    const userMsg = (textOverride !== null ? textOverride : inputText).trim();
    if (!userMsg || isLoading || isInterviewDone) return;

    if (!voiceSupported) setInputText('');
    setError(null);

    const newUserMsg = { role: "user", content: userMsg };
    const newTransMsg = { role: "You", text: userMsg, timestamp: Date.now() };

    const updatedHistory = [...conversationHistory, newUserMsg];
    const updatedTranscript = [...transcript, newTransMsg];

    setConversationHistory(updatedHistory);
    setTranscript(updatedTranscript);
    setIsLoading(true);

    try {
      const reply = await callAI({ systemPrompt, messages: updatedHistory });
      
      const assistantMsg = { role: "assistant", content: reply };
      const assistantTransMsg = { role: panelist.name, text: reply, timestamp: Date.now() };

      const finalHistory = [...updatedHistory, assistantMsg];
      const finalTranscript = [...updatedTranscript, assistantTransMsg];

      setConversationHistory(finalHistory);
      setTranscript(finalTranscript);
      setCurrentQuestionCount(prev => prev + 1);

      speakText(reply);

      const replyLower = reply.toLowerCase();
      const isDone = 
        currentQuestionCount >= 17 || 
        replyLower.includes("thank you for your time") ||
        replyLower.includes("that concludes") ||
        replyLower.includes("best of luck") ||
        replyLower.includes("interview is now complete");

      if (isDone) {
        setIsInterviewDone(true);
        setTimeout(() => {
          onComplete(finalTranscript);
        }, 5000); // Give some time for TTS to finish before completing
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const reply = await callAI({ systemPrompt, messages: conversationHistory });
      const assistantMsg = { role: "assistant", content: reply };
      const assistantTransMsg = { role: panelist.name, text: reply, timestamp: Date.now() };

      const finalHistory = [...conversationHistory, assistantMsg];
      const finalTranscript = [...transcript, assistantTransMsg];

      setConversationHistory(finalHistory);
      setTranscript(finalTranscript);
      setCurrentQuestionCount(prev => prev + 1);
      
      speakText(reply);
    } catch (err) {
      console.error(err);
      setError(err.message || "Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderFooterContent = () => {
    if (!voiceSupported) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <div className="bg-yellow-50 text-yellow-800 text-xs text-center py-1.5 rounded-md font-medium">
            ⚠️ Use Chrome or Edge for voice features
          </div>
          <div className="flex items-end gap-3 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(null);
                }
              }}
              disabled={isLoading || isInterviewDone}
              placeholder={isInterviewDone ? "Interview complete..." : "Type your answer..."}
              className="flex-1 resize-none bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[44px] max-h-[100px] disabled:bg-slate-50 disabled:text-slate-400"
              rows={1}
            />
            <button
              onClick={() => sendMessage(null)}
              disabled={isLoading || isInterviewDone || !inputText.trim()}
              className="shrink-0 w-12 h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (isLoading && !isRecording) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
          <div className="w-[72px] h-[72px] rounded-full bg-slate-200 flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-500">Processing...</span>
        </div>
      );
    }

    if (isAISpeaking) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-2 w-full">
          <div className="flex items-center gap-1.5 h-[40px]">
            {[0, 100, 200, 300, 400].map((delay, i) => (
              <div 
                key={i} 
                className="w-[6px] bg-indigo-600 rounded-md animate-[soundwave_1s_ease-in-out_infinite]"
                style={{ animationDelay: `${delay}ms`, height: '10px' }}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-indigo-700">{panelist.name} is speaking...</span>
          <button 
            disabled 
            className="w-[72px] h-[72px] rounded-full bg-slate-200 text-slate-400 flex items-center justify-center opacity-40 transition-all shadow-md mt-1"
          >
            <span className="text-3xl">🎙️</span>
          </button>
        </div>
      );
    }

    if (isRecording) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 w-full relative">
          <div className="w-full bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 absolute -top-24 mb-4 shadow-lg text-center max-h-[72px] overflow-hidden flex items-center justify-center">
            <p className="text-sm italic text-slate-200 line-clamp-2 w-full">
              {liveTranscript || <span className="opacity-50">Listening...</span>}
            </p>
          </div>
          <button 
            onClick={stopRecording}
            className="w-[72px] h-[72px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl animate-pulse-fast mt-6"
            style={{ animation: 'pulse-fast 0.8s infinite' }}
          >
            <span className="text-2xl">⏹️</span>
          </button>
          <span className="text-sm font-semibold text-red-500">Recording... Tap to stop</span>
        </div>
      );
    }

    // Idle
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
        <button 
          onClick={startRecording}
          disabled={isInterviewDone}
          className="w-[72px] h-[72px] rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] disabled:bg-slate-300 disabled:shadow-none"
          style={{ animation: isInterviewDone ? 'none' : 'pulse-slow 2s infinite' }}
        >
          <span className="text-3xl">🎙️</span>
        </button>
        <span className="text-sm font-semibold text-indigo-700">
          {isInterviewDone ? "Interview Complete" : "Tap to answer"}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative font-sans">
      <style>{`
        @keyframes soundwave {
          0%, 100% { height: 10px; }
          50% { height: 35px; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src={panelist?.avatarUrl} 
            alt={panelist?.name} 
            className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"
          />
          <span className="font-bold text-slate-800 text-sm hidden sm:block">{panelist?.name}</span>
        </div>

        <div className="flex-1 flex flex-col items-center mx-4">
          <span className="text-sm font-semibold text-slate-600 mb-1">
            Question {Math.min(currentQuestionCount, 17)} of 17
          </span>
          <div className="w-full max-w-xs h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300" 
              style={{ width: `${(Math.min(currentQuestionCount, 17) / 17) * 100}%` }}
            />
          </div>
        </div>

        <div className={`font-mono font-bold text-lg ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
          {formatTime(timeRemaining)}
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto pt-20 pb-[220px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {transcript.map((msg, idx) => {
            const isPanelist = msg.role === panelist.name;
            return (
              <div key={idx} className={`flex ${isPanelist ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${isPanelist ? 'items-start' : 'items-end'}`}>
                  
                  <div className="flex items-center gap-2 px-1">
                    {isPanelist && (
                      <img src={panelist.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-xs font-semibold text-slate-500">
                      {isPanelist ? panelist.name : 'You'}
                    </span>
                  </div>

                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    isPanelist 
                      ? 'bg-slate-800 text-slate-100 rounded-tl-sm' 
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator / Processing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-col gap-1 items-start max-w-[75%]">
                <div className="flex items-center gap-2 px-1">
                  <img src={panelist.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full" />
                  <span className="text-xs font-semibold text-slate-500">{panelist.name}</span>
                </div>
                <div className="px-4 py-4 rounded-2xl bg-slate-800 rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center my-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm flex flex-col sm:flex-row items-center gap-3 shadow-sm text-center">
                <span>⚠️ {error}</span>
                <div className="flex gap-2">
                  <button onClick={retryLastMessage} className="font-bold underline hover:text-red-900 bg-white/50 px-2 rounded-md">
                    Retry Sending
                  </button>
                  {lastUserMessage && voiceSupported && (
                    <button onClick={startRecording} className="font-bold underline hover:text-red-900 bg-white/50 px-2 rounded-md">
                      Re-record
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* NEW FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 min-h-[120px] flex items-center justify-center shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="w-full max-w-3xl flex justify-center">
          {renderFooterContent()}
        </div>
      </footer>
    </div>
  );
};

export default InterviewScreen;
