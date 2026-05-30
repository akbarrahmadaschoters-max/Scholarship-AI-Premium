import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AnimatedNumber = ({ target, suffix = '', delayMs = 2000 }: { target: number, suffix?: string, delayMs?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let intervalId: any;
    let current = 0;
    const step = Math.ceil(target / 50);

    const timer = setTimeout(() => {
      intervalId = setInterval(() => {
        current += step;
        if (current >= target) {
          setCount(target);
          clearInterval(intervalId);
        } else {
          setCount(current);
        }
      }, 20);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [target, delayMs]);

  return <>{count}{suffix && <span style={{ color: '#B8AEFF' }}>{suffix}</span>}</>;
};

const JourneyCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    const destinations = [
      {name:'Oxford',    x:0.72, y:0.18, color:'#4A7FBA', pulseOffset:0},
      {name:'Cambridge', x:0.55, y:0.08, color:'#9B2335', pulseOffset:0.5},
      {name:'Harvard',   x:0.82, y:0.32, color:'#A41034', pulseOffset:1},
      {name:'MIT',       x:0.88, y:0.52, color:'#8A8B8C', pulseOffset:1.5},
      {name:'Stanford',  x:0.78, y:0.70, color:'#8C1515', pulseOffset:2},
      {name:'NUS',       x:0.60, y:0.82, color:'#003D7C', pulseOffset:2.5},
    ];

    const getBezierPoint = (t: number, p0: any, p1: any, p2: any, p3: any) => {
      const cX = 3 * (p1.x - p0.x), bX = 3 * (p2.x - p1.x) - cX, aX = p3.x - p0.x - cX - bX;
      const cY = 3 * (p1.y - p0.y), bY = 3 * (p2.y - p1.y) - cY, aY = p3.y - p0.y - cY - bY;
      const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
      const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;
      return {x, y};
    };

    const paths = destinations.map((dest, i) => ({
      ...dest,
      progress: 0,
      travelerT: 0,
      activeTime: 1600 + i * 400
    }));

    const draw = (timestamp: DOMHighResTimeStamp) => {
      const time = timestamp - startTime;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255,255,255,0.018)';
      for(let x = 0; x < width; x += 28) {
        for(let y = 0; y < height; y += 28) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI*2);
          ctx.fill();
        }
      }

      const origin = { x: width * 0.12, y: height * 0.78 };

      paths.forEach(path => {
        if (time > path.activeTime) {
          path.progress = Math.min(path.progress + 0.008, 1.0);
        }

        if (path.progress > 0) {
          const dest = { x: path.x * width, y: path.y * height };
          const p1 = { x: origin.x + (dest.x - origin.x)*0.3 + 0.08*width, y: origin.y - 0.25*height };
          const p2 = { x: origin.x + (dest.x - origin.x)*0.7 - 0.05*width, y: dest.y - 0.15*height };

          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          const steps = Math.floor(80 * path.progress);
          for(let i=1; i<=steps; i++) {
            const t = i / 80;
            const pt = getBezierPoint(t, origin, p1, p2, dest);
            ctx.lineTo(pt.x, pt.y);
          }
          const grad = ctx.createLinearGradient(origin.x, origin.y, dest.x, dest.y);
          grad.addColorStop(0, 'rgba(232,201,122,0.15)');
          grad.addColorStop(1, path.color + '55');
          
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4,6]);
          ctx.lineDashOffset = -time * 0.03;
          ctx.stroke();
          ctx.setLineDash([]);

          if (path.progress > 0.3) {
            path.travelerT += 0.004;
            if (path.travelerT > 1) path.travelerT = 0;
            const t = path.travelerT;
            const pt = getBezierPoint(t, origin, p1, p2, dest);

            const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 10);
            glow.addColorStop(0, 'rgba(255,255,255,0.5)');
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI*2); ctx.fill();

            for(let i=1; i<=6; i++) {
              let tt = t - i*0.006;
              if(tt > 0) {
                const tailPt = getBezierPoint(tt, origin, p1, p2, dest);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.3 - i*0.04)})`;
                ctx.beginPath(); ctx.arc(tailPt.x, tailPt.y, Math.max(0, 3.5 - i*0.4), 0, Math.PI*2); ctx.fill();
              }
            }
          }

          if (path.progress > 0.85) {
            let appear = (path.progress - 0.85) / 0.15;
            appear = Math.max(0, Math.min(appear, 1));
            
            ctx.fillStyle = path.color + '14'; 
            ctx.beginPath(); ctx.arc(dest.x, dest.y, 14 + Math.sin(time*0.003 + path.pulseOffset)*6, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = path.color;
            ctx.beginPath(); ctx.arc(dest.x, dest.y, 10 * appear, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.beginPath(); ctx.arc(dest.x, dest.y, 6 * appear, 0, Math.PI*2); ctx.fill();

            if (appear > 0.7) {
              ctx.font = `600 ${11*appear}px "DM Sans", sans-serif`;
              ctx.fillStyle = `rgba(255,255,255,${appear * 0.85})`;
              ctx.textAlign = 'center';
              const ly = path.y < 0.4 ? dest.y - 20 : dest.y + 24;
              ctx.fillText(path.name, dest.x, ly);
            }
          }
        }
      });

      const pulse = Math.sin(time * 0.002);
      ctx.fillStyle = `rgba(232,201,122,${0.06 + pulse*0.06})`;
      ctx.beginPath(); ctx.arc(origin.x, origin.y, 12 + pulse*8, 0, Math.PI*2); ctx.fill();
      
      ctx.fillStyle = 'rgba(232,201,122,0.9)';
      ctx.beginPath(); ctx.arc(origin.x, origin.y, 6, 0, Math.PI*2); ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(origin.x, origin.y, 3, 0, Math.PI*2); ctx.fill();

      ctx.font = '11px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(232,201,122,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Indonesia 🇮🇩', origin.x, origin.y + 22);

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />;
};

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

  const headlineLines = [
    { text: 'Your path to', isElite: false },
    { text: 'elite', isElite: true },
    { text: 'universities,', isElite: false },
    { text: 'starts here.', isElite: false }
  ];

  return (
    <>
      <style>{`
        body {
          font-family: 'DM Sans', sans-serif;
          background: radial-gradient(ellipse at 15% 60%, #1E1245 0%, #0A0618 45%, #050310 100%);
        }
        body::before {
          content: '';
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: 
            radial-gradient(ellipse at 100% 0%, rgba(255,190,100,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 100%, rgba(100,80,255,0.08) 0%, transparent 50%);
          pointer-events: none;
          z-index: -1;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.8); opacity: 0.4; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(136,117,255,0.5); }
          50% { box-shadow: 0 0 42px rgba(136,117,255,0.7); }
        }
        .anim-fadeUp { animation: fadeUp ease forwards; opacity: 0; }
        .anim-fadeDown { animation: fadeDown ease forwards; opacity: 0; }
        .anim-wordIn { animation: wordIn ease forwards; opacity: 0; }
        
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        .right-separator::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 3px;
          background: linear-gradient(90deg, #8875FF, #B8AEFF, #C9A455);
        }
        .right-separator::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 1px; height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(136,117,255,0.2) 30%, rgba(136,117,255,0.2) 70%, transparent);
        }
      `}</style>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: '100vh', overflow: 'hidden' }}>
        
        {/* SISI KIRI */}
        <div style={{ padding: '44px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          
          <JourneyCanvas />

          {/* Logo */}
          <div className="anim-fadeDown flex items-center gap-[11px] relative z-20" style={{ animationDuration: '0.6s', animationDelay: '0.1s' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #8875FF, #B8AEFF)', boxShadow: '0 0 28px rgba(136,117,255,0.5)', fontFamily: "'Instrument Serif', serif", fontSize: '17px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glowPulse 3s ease-in-out infinite' }}>
              S
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
              SCHOLAR NOVA
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-20">
            <div className="anim-fadeUp flex items-center gap-[7px]" style={{ background: 'rgba(201,164,85,0.1)', border: '1px solid rgba(201,164,85,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '24px', display: 'inline-flex', animationDuration: '0.5s', animationDelay: '0.4s' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8C97A', animation: 'blink 2s infinite' }}></div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#E8C97A', fontWeight: 600, letterSpacing: '0.05em' }}>PREMIUM ACCESS</span>
            </div>

            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '54px', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'white', marginBottom: '20px' }}>
              {headlineLines.map((line, i) => (
                <React.Fragment key={i}>
                  <span className="anim-wordIn inline-block" style={{ animationDuration: '0.5s', animationDelay: `${0.5 + (i * 0.13)}s` }}>
                    {line.isElite ? (
                      <em style={{ fontStyle: 'italic', background: 'linear-gradient(110deg, #B8AEFF, #E8C97A)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{line.text}</em>
                    ) : (
                      line.text
                    )}
                  </span>
                  <br />
                </React.Fragment>
              ))}
            </h1>

            <p className="anim-fadeUp" style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '340px', animationDuration: '0.5s', animationDelay: '1.1s' }}>
              Personalized matching, gap analysis, and interview prep —
              built for students who aim for the world's best.
            </p>
          </div>

          {/* Stats Row */}
          <div className="anim-fadeUp flex relative z-20" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '26px', animationDuration: '0.5s', animationDelay: '1.9s' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '30px', color: 'white', lineHeight: 1 }}>
                <AnimatedNumber target={50} suffix="+" />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', marginTop: '4px' }}>Top universities</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)' }}></div>
            <div style={{ flex: 1, paddingLeft: '24px' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '30px', color: 'white', lineHeight: 1 }}>
                <AnimatedNumber target={30} suffix="+" />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', marginTop: '4px' }}>Scholarships tracked</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)' }}></div>
            <div style={{ flex: 1, paddingLeft: '24px' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '30px', color: 'white', lineHeight: 1 }}>
                <AnimatedNumber target={95} suffix="%" />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', marginTop: '4px' }}>Match accuracy</div>
            </div>
          </div>
        </div>

        {/* SISI KANAN */}
        <div className="right-separator relative z-20" style={{ background: 'rgba(251,251,253,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 52px' }}>
          <div className="w-full max-w-[310px] anim-fadeUp" style={{ animationDuration: '0.7s', animationDelay: '0.35s' }}>
            <div className="text-center">
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '27px', color: '#0A0618', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {isSignUp ? 'Create an Account' : 'Welcome back'}
              </h2>
              <p style={{ fontSize: '13px', color: '#8892A4', marginBottom: '26px' }}>
                {isSignUp ? 'Start your scholarship journey today.' : 'Continue your scholarship journey.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <button 
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white transition-all hover:-translate-y-[1px]"
              style={{ border: '1.5px solid #E4E7ED', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 500, color: '#1E2532', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8EBF0]"></div>
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="px-4 bg-[#FBFBFD] text-[#8892A4]">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={(e) => handleLogin(e, false)} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white text-[14px] text-[#0A0618] transition-all focus:outline-none placeholder:text-[#B8BEC9]"
                    style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '9px', border: '1.5px solid #E4E7ED', padding: '11px 14px', boxShadow: 'none' }}
                    placeholder="Full Name"
                    onFocus={(e) => { e.target.style.borderColor = '#8875FF'; e.target.style.boxShadow = '0 0 0 3px rgba(136,117,255,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E4E7ED'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              )}
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white text-[14px] text-[#0A0618] transition-all focus:outline-none placeholder:text-[#B8BEC9]"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '9px', border: '1.5px solid #E4E7ED', padding: '11px 14px', boxShadow: 'none' }}
                  placeholder="Email address"
                  onFocus={(e) => { e.target.style.borderColor = '#8875FF'; e.target.style.boxShadow = '0 0 0 3px rgba(136,117,255,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E4E7ED'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-[14px] text-[#0A0618] transition-all focus:outline-none placeholder:text-[#B8BEC9]"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '9px', border: '1.5px solid #E4E7ED', padding: '11px 14px', boxShadow: 'none' }}
                  placeholder="Password"
                  onFocus={(e) => { e.target.style.borderColor = '#8875FF'; e.target.style.boxShadow = '0 0 0 3px rgba(136,117,255,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E4E7ED'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="pt-1.5">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full text-white transition-all hover:-translate-y-[1px] relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #8875FF, #5B4FCC)', borderRadius: '10px', padding: '13px', 
                    fontSize: '15px', fontWeight: 600, boxShadow: '0 4px 18px rgba(136,117,255,0.4)', border: 'none' 
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">{isSubmitting ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
                </button>
              </div>
            </form>

            <div className="mt-5">
              <button 
                type="button"
                className="w-full group flex items-center justify-center gap-1 transition-all"
                style={{ 
                  background: 'transparent', border: '1.5px solid #E4E7ED', borderRadius: '10px', 
                  padding: '12px 13px', fontSize: '13.5px', fontWeight: 500, color: '#4A5568' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8875FF'; e.currentTarget.style.color = '#8875FF'; e.currentTarget.style.background = 'rgba(136,117,255,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E4E7ED'; e.currentTarget.style.color = '#4A5568'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => handleLogin(undefined, true)}
                disabled={isSubmitting}
              >
                Access Demo Dashboard <span className="group-hover:translate-x-[3px] transition-transform">→</span>
              </button>
            </div>
            
            <p className="mt-7 text-center text-[13px] text-gray-500">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }} 
                style={{ color: '#8875FF', fontWeight: 600 }}
                className="hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Apply now'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
