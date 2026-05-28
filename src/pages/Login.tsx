import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login, signup, loginWithGoogle, loginMock } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (isDemo) {
        await loginMock('demo@student.com');
      } else {
        if (isSignUp) {
          await signup(email, password, displayName);
        } else {
          await login(email, password);
        }
      }
      navigate('/diagnostic');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Failed to authenticate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      navigate('/diagnostic');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Failed to authenticate with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Hero / Landing Content */}
      <div className="md:w-3/5 bg-[#F8F9FE] text-slate-800 p-10 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/50 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 blur-[120px]"></div>
        </div>

        <div className="relative z-10 flex items-center space-x-3 mb-12">
          <div className="h-10 w-10 relative">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                 <defs>
                   <linearGradient id="logo-gradient-login" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#818cf8" />
                     <stop offset="100%" stopColor="#4f46e5" />
                   </linearGradient>
                 </defs>
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="url(#logo-gradient-login)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M70,30 C70,15 50,15 50,15 C50,15 30,15 30,30 C30,45 70,55 70,70 C70,85 50,85 50,85 C50,85 30,85 30,70" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 30" opacity="0.3" />
              </svg>
          </div>
          <span className="text-xl font-extrabold tracking-wider text-slate-800">SCHOLAR NOVA</span>
        </div>

        <div className="relative z-10 max-w-2xl mt-auto mb-auto">
          <span className="inline-block px-3 py-1 bg-indigo-100 border border-indigo-200 rounded-full text-indigo-700 text-sm font-bold tracking-wide mb-6">
            P R E M I U M   A C C E S S
          </span>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
            AI premium scholarship consulting partner
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-10 max-w-xl font-medium">
            Dapatkan bimbingan beasiswa terbaik dengan AI. Persiapan lebih cerdas, peluang lebih besar.
          </p>

          {/* AI Feature Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
              <div className="text-indigo-500 mt-1 bg-indigo-50 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">AI University Match</h4>
                <p className="text-sm text-slate-500 mt-0.5">Find global programs matching your profile.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
              <div className="text-indigo-500 mt-1 bg-indigo-50 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Profile Gap Analysis</h4>
                <p className="text-sm text-slate-500 mt-0.5">Identify areas to improve for scholarships.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
              <div className="text-indigo-500 mt-1 bg-indigo-50 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Essay & Interview</h4>
                <p className="text-sm text-slate-500 mt-0.5">Mock interviews with real-time AI feedback.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
              <div className="text-indigo-500 mt-1 bg-indigo-50 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Timeline Planner</h4>
                <p className="text-sm text-slate-500 mt-0.5">Stay on track with IELTS, SAT, and deadlines.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="md:w-2/5 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white relative">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
            <p className="text-gray-500 font-medium">{isSignUp ? 'Start your scholarship journey today.' : 'Continue your scholarship journey.'}</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
              {errorMsg}
            </div>
          )}

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 text-base font-semibold mb-6 flex items-center justify-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={(e) => handleLogin(e, false)} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required={isSignUp}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isSubmitting} className="w-full h-12 text-base font-bold shadow-lg shadow-indigo-200">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or try the platform</span>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 text-base font-semibold"
              onClick={() => handleLogin(undefined, true)}
              disabled={isSubmitting}
            >
              Access Demo Dashboard
            </Button>
          </div>
          
          <p className="mt-10 text-center text-sm text-gray-500 font-medium">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }} 
              className="text-indigo-600 hover:text-indigo-500 font-bold"
            >
              {isSignUp ? 'Sign in' : 'Apply now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
