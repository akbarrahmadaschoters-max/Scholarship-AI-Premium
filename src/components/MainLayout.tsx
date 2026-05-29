import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Universities', path: '/universities', icon: '🎓' },
    { label: 'Scholarships', path: '/scholarships', icon: '🏆' },
    { label: 'Interviews', path: '/interviews', icon: '🎤' },
  ];

  // Helper to determine page title
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard': return { title: 'Command Center', subtitle: 'Your personalized AI roadmap for global university admissions.' };
      case '/universities': return { title: 'Universities Explorer', subtitle: 'Explore the Top 50 global universities and their admission requirements.' };
      case '/scholarships': return { title: 'Scholarships Explorer', subtitle: 'Find the best international scholarships tailored for Indonesian students.' };
      case '/interviews': return { title: 'Interview Simulator', subtitle: 'Practice your interview skills with Voice AI personas.' };
      case '/premium-dashboard': return { title: 'AI Premium Dashboard', subtitle: 'Exclusive matching, essays, and advanced analytics.' };
      default: return { title: 'Scholar Nova', subtitle: 'Empowering your educational journey.' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex min-h-screen bg-[var(--surface-light)]">
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[240px] bg-[var(--surface-dark)] flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--border-radius-sm)] bg-[var(--color-primary)] text-white font-bold flex items-center justify-center shrink-0">
            S
          </div>
          <span className="text-white font-bold tracking-wider text-sm">SCHOLAR NOVA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--border-radius-md)] transition-[var(--transition-fast)] font-medium text-sm
                ${isActive 
                  ? 'bg-[var(--color-primary-glow)] text-white' 
                  : 'text-[var(--color-dark-300)] hover:text-white hover:bg-white/5'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <span className={`w-5 flex justify-center text-lg ${isActive ? 'text-[var(--color-primary-light)]' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-white/5 mx-3" />

        {/* User Section */}
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center shrink-0">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-sm font-semibold truncate">
                {currentUser?.displayName || 'Student Profile'}
              </span>
              <span className="text-[var(--color-dark-300)] text-xs truncate">
                {currentUser?.email || 'student@scholarnova.ai'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--color-dark-300)] hover:text-[var(--color-danger)] transition-colors w-full px-2 py-1 rounded"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-[240px] min-h-screen relative flex flex-col w-full">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 font-bold text-slate-800">SCHOLAR NOVA</span>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full overflow-x-hidden">
          
          {/* Global Page Header Area */}
          <div className="mb-7">
            <h1 className="text-[32px] font-bold text-[var(--color-dark-900)] leading-tight mb-1">
              {title}
            </h1>
            <p className="text-sm text-[var(--color-dark-500)]">
              {subtitle}
            </p>
          </div>

          {/* Render Page */}
          <div className="w-full">
            {children}
          </div>
          
        </div>
      </main>
    </div>
  );
};
