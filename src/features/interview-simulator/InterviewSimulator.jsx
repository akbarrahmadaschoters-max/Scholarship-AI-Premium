import React, { useState, useEffect } from 'react';
import SetupScreen from './screens/SetupScreen';
import BriefingScreen from './screens/BriefingScreen';
import InterviewScreen from './screens/InterviewScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import panelistPersonas from './data/panelistPersonas.json';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 text-sm mb-6 bg-red-100 p-3 rounded-lg font-mono text-left overflow-auto">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
            >
              Back to Start
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const InterviewSimulator = () => {
  const [screen, setScreen] = useState('setup');
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [panelist, setPanelist] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [clusters, setClusters] = useState([]); // Store fetched clusters
  const [feedbackData, setFeedbackData] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // Trigger CSS transition when screen changes
  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [screen]);

  const getPanelist = (config) => {
    let key = "";
    if (config.type === "LPDP") {
      key = "LPDP_" + config.level;
    } else if (config.type === "INTERNATIONAL") {
      key = config.scholarship + "_" + config.level;
    } else if (config.type === "UNIVERSITY") {
      key = "UNIVERSITY_" + config.level;
    }

    const found = panelistPersonas.find(p => p.assignedTo.includes(key));
    return found || panelistPersonas[0];
  };

  const handleStartSetup = (config) => {
    setInterviewConfig(config);
    setPanelist(getPanelist(config));
    setScreen('briefing');
  };

  const handleStartBriefing = () => {
    setScreen('interview');
  };

  const handleCompleteInterview = (finalTranscript, fetchedClusters) => {
    setTranscript(finalTranscript);
    setClusters(fetchedClusters || []);
    setScreen('processing');
  };

  const handleCompleteProcessing = (feedback) => {
    setFeedbackData(feedback);
    
    // Save to localStorage history
    try {
      const historyStr = localStorage.getItem('interviewSimHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift({ date: Date.now(), config: interviewConfig, feedbackData: feedback });
      localStorage.setItem('interviewSimHistory', JSON.stringify(history.slice(0, 10)));
    } catch (err) {
      console.error("Failed to save history", err);
    }

    setScreen('feedback');
  };

  const handleRestart = () => {
    setInterviewConfig(null);
    setPanelist(null);
    setTranscript([]);
    setFeedbackData(null);
    setScreen('setup');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'setup':
        return <SetupScreen onStart={handleStartSetup} />;
      case 'briefing':
        return <BriefingScreen config={interviewConfig} panelist={panelist} onStart={handleStartBriefing} />;
      case 'interview':
        return <InterviewScreen config={interviewConfig} panelist={panelist} onComplete={handleCompleteInterview} />;
      case 'processing':
        return <ProcessingScreen transcript={transcript} clusters={clusters} config={interviewConfig} panelist={panelist} onComplete={handleCompleteProcessing} />;
      case 'feedback':
        return <FeedbackScreen feedbackData={feedbackData} config={interviewConfig} panelist={panelist} onRestart={handleRestart} />;
      default:
        return <div>Unknown Screen</div>;
    }
  };

  return (
    <ErrorBoundary onReset={handleRestart}>
      <div 
        className="w-full min-h-screen bg-slate-50 transition-opacity duration-300 ease-in-out"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {renderScreen()}
      </div>
    </ErrorBoundary>
  );
};

export default InterviewSimulator;
