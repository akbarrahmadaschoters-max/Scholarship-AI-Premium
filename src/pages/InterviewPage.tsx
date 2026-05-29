import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import InterviewSimulator from '../features/interview-simulator/InterviewSimulator';

export const InterviewPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="h-10 w-10 relative">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                 <defs>
                   <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#818cf8" />
                     <stop offset="100%" stopColor="#4f46e5" />
                   </linearGradient>
                 </defs>
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="url(#logo-gradient)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 30" opacity="0.3" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-wider">SCHOLAR NOVA</h1>
          </Link>
          
          <div className="flex items-center space-x-5">
            <div className="hidden md:flex space-x-6 mr-4 text-sm font-semibold text-slate-600">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <a href="#" className="hover:text-indigo-600 transition-colors">Universities</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Scholarships</a>
              <Link to="/interviews" className="text-indigo-600">Interviews</Link>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                {currentUser?.displayName || 'User'}
              </span>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {(currentUser?.displayName || 'U')[0].toUpperCase()}
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Feature Content */}
      <main className="py-8">
        <InterviewSimulator />
      </main>
    </div>
  );
};
