import React, { useState, useEffect } from 'react';
import { callAI } from '../utils/aiClient';
import rubric from '../data/rubric.json';

const ProcessingScreen = ({ transcript, clusters = [], config, panelist, timeRemaining = 0, onComplete }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState(null);

  const statuses = [
    "Analyzing your responses...",
    "Evaluating argument depth...",
    "Assessing communication clarity...",
    "Compiling personalized recommendations...",
    "Almost done..."
  ];

  // Rotate status text every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [statuses.length]);

  useEffect(() => {
    let isMounted = true;
    
    const generateFeedback = async (retryCount = 0) => {
      const minWaitPromise = new Promise(resolve => setTimeout(resolve, 4000));
      
      try {
        const transcriptText = transcript
          .map(t => `${t.role.toUpperCase()}: ${t.text}`)
          .join('\n\n');

        const durationMinutes = Math.floor((2700 - timeRemaining) / 60);
        const duration = durationMinutes > 0 ? `${durationMinutes} minutes` : "Unknown duration";

        const clusterInfo = clusters.map(c => `- ${c.name} (Weight: ${c.weight}%)`).join('\n');
        const rubricInfo = rubric.dimensions.map(d => `- ${d.label} (Weight: ${d.weight}%)`).join('\n');

        const feedbackPrompt = `
You are an expert scholarship and university admission interview evaluator.

Interview Details:
- Type: ${config.type} ${config.scholarship ?? ''}
- Level: ${config.level}
- Field: ${config.field}
- Interviewer: ${panelist.name}, ${panelist.title}
- Duration: ${duration}

Evaluation Criteria (Scoring Weights):
1. Topic Clusters (Content Mastery):
${clusterInfo || '- General (Weight: 100%)'}

2. Assessment Rubric (Delivery & Quality):
${rubricInfo}

Full Interview Transcript:
${transcriptText}

Evaluate the candidate thoroughly and objectively based on BOTH the Topic Clusters weights and the Assessment Rubric weights. 
Calculate the overallScore (0-100) mathematically by combining their performance across these weighted criteria.

Reply ONLY with a valid JSON object. No markdown, no backticks, no explanation.
Just the raw JSON:

{
  "overallScore": <number 0-100>,
  "grade": <"A" or "B" or "C" or "D">,
  "gradeLabel": <"Excellent" or "Good" or "Satisfactory" or "Needs Improvement">,
  "clusterScores": [
    {
      "clusterId": <string, e.g. "Motivation">,
      "clusterName": <string>,
      "score": <number 1-5>,
      "comment": <string, 2-3 sentences in English>
    }
  ],
  "dimensionScores": [
    {
      "dimensionId": <string>,
      "dimensionName": <string>,
      "score": <number 1-5>
    }
  ],
  "strengths": [<string>, <string>, <string>],
  "improvements": [<string>, <string>, <string>],
  "summary": <string, 3-4 sentences overall assessment in English>,
  "recommendation": <string, 1 actionable sentence in English>,
  "panelNote": <string, personal note from ${panelist.name} to candidate, warm tone, 2 sentences>
}
`;

        const reply = await callAI({
          systemPrompt: "You are an expert interview evaluator. Always respond with valid JSON only.",
          messages: [{ role: "user", content: feedbackPrompt }]
        });

        const cleaned = reply.replace(/```json|```/g, '').trim();
        const feedbackData = JSON.parse(cleaned);

        // Ensure we wait at least 4 seconds for UX
        await minWaitPromise;
        
        if (isMounted) {
          onComplete(feedbackData);
        }

      } catch (err) {
        console.error("Failed to generate or parse feedback:", err);
        if (retryCount < 1 && isMounted) {
          console.log("Retrying feedback generation...");
          generateFeedback(retryCount + 1);
        } else if (isMounted) {
          await minWaitPromise; // Still respect wait time on error
          setError("Failed to generate feedback. Please try again or check your API connection.");
        }
      }
    };

    generateFeedback();

    return () => { isMounted = false; };
  }, [config, panelist, transcript, timeRemaining, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <style>{`
        @keyframes customPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .anim-pulse-avatar {
          animation: customPulse 2s infinite ease-in-out;
        }
        @keyframes customSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .anim-slide-bar {
          animation: customSlide 1.5s infinite linear;
        }
        .fade-enter {
          opacity: 0;
          transition: opacity 0.5s ease-in;
        }
        .fade-enter-active {
          opacity: 1;
        }
      `}</style>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center">
        
        {/* Avatar */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-indigo-100 anim-pulse-avatar"></div>
          <img 
            src={panelist?.avatarUrl} 
            alt={panelist?.name} 
            className="relative w-[80px] h-[80px] rounded-full border-4 border-white shadow-md bg-gray-100 z-10"
          />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">{panelist?.name}</h2>
        <p className="text-sm text-gray-500 mb-8">is compiling your interview results</p>

        {/* Dynamic Status Text */}
        <div className="h-6 relative w-full mb-6 flex items-center justify-center">
          {statuses.map((status, index) => (
            <p 
              key={index} 
              className={`absolute w-full font-medium text-indigo-600 transition-opacity duration-500 ${
                index === statusIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {status}
            </p>
          ))}
        </div>

        {/* Indeterminate Progress Bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6 relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-indigo-600 rounded-full anim-slide-bar"></div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            ⚠️ {error}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 w-full py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingScreen;
