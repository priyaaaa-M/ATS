import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RefreshCw, Check, ChevronRight } from "lucide-react";

const STAGES = [
  {
    num: "01",
    title: "Resume intake",
    subtitle: "Automated G-Drive syncing",
  },
  {
    num: "02",
    title: "Candidate review",
    subtitle: "Structured profiles & AI scoring",
  },
  {
    num: "03",
    title: "Round config",
    subtitle: "N-round interviewer loops",
  },
  {
    num: "04",
    title: "Self-serve booking",
    subtitle: "Instant CalSync slots",
  },
  {
    num: "05",
    title: "Feedback loop",
    subtitle: "Structured analytics",
  },
];

// ==========================================
// SHOWCASE VISUALS (ENLARGED & HIGHLY READABLE)
// ==========================================

function MinimalIntakeVisual() {
  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-[#EC5B24] uppercase font-extrabold">
          Sync Engine
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
      </div>
      <div className="flex items-center justify-center my-auto relative py-6">
        <motion.div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-[#EC5B24]/40 to-transparent z-0" />
        <motion.div
          initial={{ y: -25, opacity: 0 }}
          animate={{ y: 25, opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="bg-[#121110] border border-white/15 rounded-xl p-4 px-5 flex items-center gap-3.5 relative z-10 shadow-xl shadow-black/60"
        >
          <FileText className="w-6 h-6 text-[#EC5B24] shrink-0" />
          <div className="text-left">
            <p className="text-sm font-bold text-white tracking-wide">
              resume_chen.pdf
            </p>
            <p className="text-xs font-mono text-white/60 mt-0.5">
              parsing core skills...
            </p>
          </div>
        </motion.div>
      </div>
      <div className="flex justify-between items-center text-xs text-white/50 font-mono">
        <span className="font-semibold text-white/60">G-Drive Import</span>
        <span className="text-[#EC5B24] font-bold">Active</span>
      </div>
    </div>
  );
}

function MinimalReviewVisual() {
  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-[#EC5B24] uppercase font-extrabold">
          Candidate Scoring
        </span>
        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/25 px-2.5 py-1 rounded-md font-bold font-mono">
          94 Match Score
        </span>
      </div>
      <div className="my-auto py-2">
        <div className="bg-[#121110] border border-white/10 rounded-xl p-4.5 shadow-xl">
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-8 h-8 rounded-full bg-[#EC5B24] flex items-center justify-center text-xs font-extrabold text-black">
              EM
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white tracking-wide">
                Elena Martinez
              </h4>
              <p className="text-xs text-white/60 mt-0.5">Backend Team Lead</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Golang", "Redis", "Docker"].map((s) => (
              <span
                key={s}
                className="text-xs bg-white/[0.04] border border-white/10 rounded px-2.5 py-1 text-white/90 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-white/50 font-mono">
        <span className="font-semibold text-white/60">Structure Tabs</span>
        <span className="text-green-400 font-bold">Approved</span>
      </div>
    </div>
  );
}

function MinimalRoundVisual() {
  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-[#EC5B24] uppercase font-extrabold">
          Pipeline Loops
        </span>
        <span className="text-xs text-white/50 font-mono font-semibold">
          3 Active Stages
        </span>
      </div>
      <div className="my-auto flex items-center justify-center gap-3 relative">
        <div className="absolute left-8 right-8 h-[1px] bg-white/10 z-0">
          <motion.div
            className="h-full bg-[#EC5B24] w-1/3 shadow-lg shadow-orange-500/50"
            animate={{ left: ["0%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            style={{ position: "absolute" }}
          />
        </div>
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className="w-12 h-12 rounded-xl bg-[#121110] border border-white/15 flex items-center justify-center relative z-10 shadow-lg"
          >
            <span className="text-sm font-mono font-bold text-white">
              0{num}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center text-xs text-white/50 font-mono">
        <span className="font-semibold text-white/60">Slack notify</span>
        <span className="text-[#EC5B24] font-bold">Synced</span>
      </div>
    </div>
  );
}

function MinimalSchedulingVisual() {
  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-[#EC5B24] uppercase font-extrabold">
          Scheduling Hub
        </span>
        <span className="text-xs bg-[#EC5B24]/10 text-[#EC5B24] border border-[#EC5B24]/20 px-2.5 py-1 rounded-md font-mono font-bold">
          Instant Booking
        </span>
      </div>
      <div className="my-auto py-2">
        <div className="bg-[#121110] border border-white/10 rounded-xl p-4 shadow-xl text-center">
          <p className="text-xs text-white/50 mb-3 font-mono font-medium">
            Select Time Slot
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="bg-white/[0.01] border border-white/5 text-xs text-white/30 p-2.5 rounded-lg cursor-not-allowed">
              09:30 AM
            </span>
            <motion.span
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-[#EC5B24]/20 border border-[#EC5B24]/50 text-xs text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#EC5B24]" />
              02:00 PM
            </motion.span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-white/50 font-mono">
        <span className="font-semibold text-white/60">CalSync API</span>
        <span className="text-[#EC5B24] font-bold">Meet Ready</span>
      </div>
    </div>
  );
}

function MinimalFeedbackVisual() {
  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-[#EC5B24] uppercase font-extrabold">
          Interviewer Scorecard
        </span>
        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/25 px-2.5 py-1 rounded-md font-mono font-bold">
          Strong Hire
        </span>
      </div>
      <div className="my-auto py-2.5 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5 font-mono">
            <span>TECHNICAL PROFICIENCY</span>
            <span className="text-[#EC5B24] font-extrabold">9.2 / 10</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#EC5B24]"
              initial={{ width: "0%" }}
              animate={{ width: "92%" }}
              transition={{ duration: 1.5 }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5 font-mono">
            <span>CULTURE COHESION</span>
            <span className="text-[#EC5B24] font-extrabold">8.5 / 10</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#EC5B24]"
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-white/50 font-mono">
        <span className="font-semibold text-white/60">HR Analytics</span>
        <span className="text-green-400 font-bold">Loop Complete</span>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT DEFINITION
// ==========================================

export function LoginPage() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [activeStage, setActiveStage] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoPlayRef = useRef<boolean>(true);

  useEffect(() => {
    const t = setInterval(() => {
      if (autoPlayRef.current) {
        setActiveStage((s) => (s + 1) % STAGES.length);
      }
    }, 4000);
    return () => clearInterval(t);
  }, []);

  if (!isLoading && isAuthenticated && user) {
    return (
      <Navigate
        to={user.role === "interviewer" ? "/interviewer" : "/dashboard"}
        replace
      />
    );
  }

  const goGoogle = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const base = (import.meta as any).env?.DEV
        ? ""
        : (import.meta as any).env?.VITE_API_URL;
      window.location.href = `${base || ""}/auth/google`;
    }, 800);
  };

  const handleStageSelect = (idx: number) => {
    autoPlayRef.current = false; // stop automatic loop on user click
    setActiveStage(idx);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');

        .gl-master-layout {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background-color: #000;
        }

        /* ── LEFT PANEL STYLING (ALWAYS SOLID PREMIUM DARK) ── */
        .gl-left-side {
          background-color: #000000;
          padding: 50px 60px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.03);
        }

        .gl-left-side::before {
          content: '';
          position: absolute;
          inset: 0;
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
          mask-image: radial-gradient(circle at 10% 10%, black 20%, transparent 80%);
          pointer-events: none;
        }

        .gl-left-glow {
          position: absolute;
          bottom: -50px;
          left: -50px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(236, 91, 36, 0.05) 0%, transparent 70%);
          filter: blur(30px);
          pointer-events: none;
        }

        /* ── SOLID WHITE RIGHT PANEL STYLING (ALWAYS WHITE BG) ── */
        .gl-right-side {
          background-color: #ffffff;
          color: #1c1917;
          padding: 50px 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        /* ── VISUAL SANDBOX AREA ── */
        .gl-visual-box {
          background: rgba(14, 13, 11, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          height: 220px;
          width: 100%;
          max-width: 420px;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 1px 0 rgba(255, 255, 255, 0.03) inset,
            0 20px 40px rgba(0, 0, 0, 0.6);
        }

        /* ── MINIMAL FORM ELEMENTS ── */
        .gl-min-form-container {
          width: 100%;
          max-width: 350px;
        }

        .gl-min-input {
          width: 100%;
          height: 42px;
          background-color: #fcfcfb;
          border: 1px solid #e5e5e0;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 13px;
          color: #1c1917;
          outline: none;
          transition: all 0.2s ease;
        }

        .gl-min-input:focus {
          border-color: #EC5B24;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(236, 91, 36, 0.08);
        }

        .gl-min-input::placeholder {
          color: #a1a19a;
          opacity: 0.6;
        }

        .gl-google-button {
          width: 100%;
          height: 44px;
          background-color: #ffffff;
          border: 1px solid #e5e5e0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #1c1917;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .gl-google-button:hover {
          background-color: #fcfcfb;
          border-color: #d6d6d0;
          transform: translateY(-0.5px);
        }

        .gl-submit-button {
          width: 100%;
          height: 44px;
          background-color: #EC5B24;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(236, 91, 36, 0.15);
        }

        .gl-submit-button:hover {
          background-color: #e04f18;
          box-shadow: 0 6px 16px rgba(236, 91, 36, 0.25);
          transform: translateY(-0.5px);
        }

        .gl-submit-button:active {
          transform: translateY(0px);
        }

        /* ── RESPONSIVE RESPONSIVENESS (MOBILE PHONE + TABLET FIX) ── */
        @media (max-width: 900px) {
          .gl-master-layout {
            grid-template-columns: 1fr;
          }
          .gl-left-side {
            display: none !important; /* Hide left decorative side completely on mobile/tablets for pristine focus */
          }
          .gl-right-side {
            min-height: 100vh;
            width: 100vw;
            padding: 40px 24px;
          }
        }
      `}</style>

      <div className="gl-master-layout">
        {/* ── LEFT PANEL (50% Pure Dark Background, Clean Minimalist Timeline) ── */}
        <div className="gl-left-side">
          <div className="gl-left-glow" />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 bg-[#EC5B24] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/15 border border-orange-500/10">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3.5" fill="#000000" />
                <circle cx="9" cy="2.5" r="1.8" fill="#000000" opacity="0.6" />
                <circle cx="9" cy="15.5" r="1.8" fill="#000000" opacity="0.6" />
                <circle cx="2.5" cy="9" r="1.8" fill="#000000" opacity="0.6" />
                <circle cx="15.5" cy="9" r="1.8" fill="#000000" opacity="0.6" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Gravio
            </span>
          </div>

          {/* Center Presentation */}
          <div className="my-auto max-w-lg w-full relative z-10 flex flex-col gap-8">
            <div>
              <h1 className="gl-display-title text-4xl md:text-5xl text-white/95 leading-[1.1] tracking-tight">
                Hire with{" "}
                <span className="italic text-[#EC5B24] font-semibold">
                  gravity.
                </span>
                <br />
                Move fast, hire right.
              </h1>
              <p className="text-white/60 text-sm md:text-base mt-3 max-w-md leading-relaxed">
                Intelligent pipeline automation integrated with Google
                Workspace.
              </p>
            </div>

            {/* Visual sandbox */}
            <div className="gl-visual-box">
              <AnimatePresence mode="wait">
                {activeStage === 0 && (
                  <motion.div
                    key="intake"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    className="absolute inset-0"
                  >
                    <MinimalIntakeVisual />
                  </motion.div>
                )}
                {activeStage === 1 && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    className="absolute inset-0"
                  >
                    <MinimalReviewVisual />
                  </motion.div>
                )}
                {activeStage === 2 && (
                  <motion.div
                    key="rounds"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    className="absolute inset-0"
                  >
                    <MinimalRoundVisual />
                  </motion.div>
                )}
                {activeStage === 3 && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    className="absolute inset-0"
                  >
                    <MinimalSchedulingVisual />
                  </motion.div>
                )}
                {activeStage === 4 && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    className="absolute inset-0"
                  >
                    <MinimalFeedbackVisual />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation bottom bar */}
          <div className="border-t border-white/10 pt-6 max-w-lg w-full relative z-10">
            <div className="flex justify-between gap-2">
              {STAGES.map((s, idx) => {
                const isActive = activeStage === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleStageSelect(idx)}
                    className="flex-1 text-left relative focus:outline-none group"
                  >
                    <div className="h-1 w-full bg-white/10 relative overflow-hidden mb-2.5 rounded-full">
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 bg-[#EC5B24] rounded-full"
                          initial={{ width: "0%" }}
                          animate={
                            autoPlayRef.current
                              ? { width: "100%" }
                              : { width: "100%" }
                          }
                          transition={
                            autoPlayRef.current
                              ? { duration: 4, ease: "linear" }
                              : { duration: 0.1 }
                          }
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs font-extrabold transition-colors tracking-wide ${isActive ? "text-white" : "text-white/30 group-hover:text-white/50"}`}
                    >
                      {s.num}
                    </p>
                    <p
                      className={`text-xs font-semibold transition-colors mt-0.5 tracking-wide hidden md:block leading-tight ${isActive ? "text-white/85" : "text-white/10"}`}
                    >
                      {s.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (Strictly White BG Login Form) ── */}
        <div className="gl-right-side">
          <div className="gl-min-form-container">
            {/* Header titles */}
            <div className="mb-6">
              <h2 className="gl-display-title text-2xl font-bold text-[#1c1917]">
                Welcome back
              </h2>
              <p className="text-xs text-[#78716c] mt-1">
                Sign in to continue to your workspace
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={goGoogle}
              disabled={isSubmitting}
              className="gl-google-button"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#EC5B24]" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span className="text-xs font-semibold text-[#1c1917]">
                Continue with Google
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-[1px] bg-[#e5e5e0]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#a1a19a]">
                or use email
              </span>
              <div className="flex-1 h-[1px] bg-[#e5e5e0]" />
            </div>

            {/* Credentials Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-bold tracking-wider uppercase mb-1.5 text-[#78716c]">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="gl-min-input"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[9px] font-bold tracking-wider uppercase text-[#78716c]">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    className="text-[10px] text-[#a1a19a] hover:text-[#EC5B24] transition-colors"
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="gl-min-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={goGoogle}
              disabled={isSubmitting}
              className="gl-submit-button mt-6"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
