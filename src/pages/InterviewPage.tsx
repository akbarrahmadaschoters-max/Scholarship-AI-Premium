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

      {/* Main Feature Content */}
      <main className="py-8">
        <InterviewSimulator />
      </main>
    </div>
  );
};
