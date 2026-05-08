import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const STAGES = [
  {
    num: '01',
    title: 'Resume intake',
    desc: 'Connect your Google Drive. We scan the folder structure and auto-import every resume — no copy-paste, no uploads.',
    chips: ['Google Drive sync', 'PDF parsing', 'Auto-import'],
  },
  {
    num: '02',
    title: 'Candidate review',
    desc: 'Parsed CV data in clean tabs — Education, Experience, Skills, Projects. Approve or reject in one click.',
    chips: ['AI scoring', 'Structured tabs', 'One-click approve'],
  },
  {
    num: '03',
    title: 'Round configuration',
    desc: 'Set up N interview rounds per role. Assign one interviewer per round. System handles the rest.',
    chips: ['Multi-round', 'Role-based', 'Slack notify'],
  },
  {
    num: '04',
    title: 'Self-serve scheduling',
    desc: 'Interviewers see live calendar free/busy slots and book directly. Google Meet link auto-generated.',
    chips: ['Google Calendar', 'Free/busy API', 'Google Meet'],
  },
  {
    num: '05',
    title: 'Feedback loop',
    desc: 'Structured scorecards after every round. HR sees feedback, transcripts, and selects final candidates.',
    chips: ['Scorecards', 'Transcripts', 'Final selection'],
  },
]

export function LoginPage() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [activeStage, setActiveStage] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStage((s) => (s + 1) % STAGES.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={user.role === 'interviewer' ? '/interviewer' : '/dashboard'} replace />
  }

  const goGoogle = () => {
    const base = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL
    window.location.href = `${base}/auth/google`
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .gravio-login {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .gl-left {
          background: #0C0B09;
          padding: 40px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .gl-curves {
          position: absolute;
          inset: 0;
          pointer-events: none;
          width: 100%;
          height: 100%;
        }

        .gl-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .gl-logo-icon {
          width: 34px;
          height: 34px;
          background: #EC5B24;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gl-logo-name {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.3px;
          font-family: 'DM Sans', sans-serif;
        }

        .gl-hero {
          position: relative;
          z-index: 2;
        }

        .gl-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 2.5px;
          color: #5C5247;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .gl-eyebrow-line {
          width: 28px;
          height: 1px;
          background: #5C5247;
          flex-shrink: 0;
        }

        .gl-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 400;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        .gl-headline em {
          font-style: italic;
          color: #EC5B24;
        }

        .gl-sub {
          font-size: 13px;
          color: #5C5247;
          line-height: 1.7;
          max-width: 340px;
        }

        .gl-stages {
          position: relative;
          z-index: 2;
        }

        .gl-stage {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 16px 0;
          border-top: 0.5px solid #1A1713;
          cursor: pointer;
          transition: all 0.2s;
        }

        .gl-stage:last-child {
          border-bottom: 0.5px solid #1A1713;
        }

        .gl-stage-num {
          font-size: 10px;
          font-weight: 500;
          color: #2E2A25;
          min-width: 22px;
          margin-top: 3px;
          letter-spacing: 0.5px;
          transition: color 0.2s;
        }

        .gl-stage.active .gl-stage-num {
          color: #EC5B24;
        }

        .gl-stage-body {
          flex: 1;
        }

        .gl-stage-title {
          font-size: 14px;
          font-weight: 500;
          color: #2E2A25;
          line-height: 1.3;
          margin-bottom: 0;
          transition: color 0.2s;
        }

        .gl-stage.active .gl-stage-title {
          color: #fff;
        }

        .gl-stage-desc {
          font-size: 12px;
          color: #5C5247;
          line-height: 1.6;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, margin-top 0.2s;
        }

        .gl-stage.active .gl-stage-desc {
          max-height: 80px;
          margin-top: 6px;
        }

        .gl-chips {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, margin-top 0.2s;
        }

        .gl-stage.active .gl-chips {
          max-height: 40px;
          margin-top: 8px;
        }

        .gl-chip {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          border: 0.5px solid #2E2A25;
          color: #5C5247;
          letter-spacing: 0.2px;
          transition: border-color 0.2s, color 0.2s;
        }

        .gl-stage.active .gl-chip {
          border-color: #6B3A20;
          color: #EC5B24;
        }

        /* ── RIGHT PANEL ── */
        .gl-right {
          background: #FAFAF8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
        }

        .gl-form {
          width: 100%;
          max-width: 340px;
        }

        .gl-welcome {
          font-family: 'DM Serif Display', serif;
          font-size: 30px;
          font-weight: 400;
          color: #0C0B09;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .gl-welcome-sub {
          font-size: 13px;
          color: #888;
          margin-bottom: 32px;
          font-weight: 400;
        }

        .gl-google-btn {
          width: 100%;
          height: 46px;
          background: #0C0B09;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 22px;
          transition: background 0.15s;
          letter-spacing: 0.1px;
        }

        .gl-google-btn:hover {
          background: #1A1713;
        }

        .gl-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .gl-div-line {
          flex: 1;
          height: 0.5px;
          background: #E0DDD9;
        }

        .gl-div-text {
          font-size: 11px;
          color: #C0BDB9;
          font-weight: 400;
        }

        .gl-field-group {
          margin-bottom: 13px;
        }

        .gl-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }

        .gl-input {
          width: 100%;
          height: 42px;
          border: 0.5px solid #E0DDD9;
          border-radius: 7px;
          padding: 0 13px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #0C0B09;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
        }

        .gl-input:focus {
          border-color: #EC5B24;
        }

        .gl-input::placeholder {
          color: #C0BDB9;
        }

        .gl-submit-btn {
          width: 100%;
          height: 46px;
          background: #EC5B24;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          letter-spacing: 0.1px;
        }

        .gl-submit-btn:hover {
          background: #D44E1C;
        }

        .gl-submit-btn svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        .gl-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 0.5px solid #E8E5E2;
          display: flex;
          gap: 20px;
        }

        .gl-stat {
          flex: 1;
        }

        .gl-stat-num {
          font-size: 20px;
          font-weight: 600;
          color: #0C0B09;
          font-family: 'DM Serif Display', serif;
          letter-spacing: -0.5px;
        }

        .gl-stat-lbl {
          font-size: 11px;
          color: #AAA;
          margin-top: 2px;
          line-height: 1.4;
        }

        .gl-progress-bar {
          width: 100%;
          height: 2px;
          background: #1A1713;
          margin-top: 12px;
          border-radius: 2px;
          overflow: hidden;
        }

        .gl-progress-fill {
          height: 100%;
          background: #EC5B24;
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        @media (max-width: 768px) {
          .gravio-login {
            grid-template-columns: 1fr;
          }
          .gl-left {
            min-height: 50vh;
          }
        }
      `}</style>

      <div className="gravio-login">
        {/* ── LEFT PANEL ── */}
        <div className="gl-left">
          <svg className="gl-curves" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M420 0 Q680 200 560 450 Q440 700 680 900" fill="none" stroke="#EC5B24" strokeWidth="0.8" opacity="0.3" />
            <path d="M445 0 Q705 210 575 455 Q455 705 695 900" fill="none" stroke="#EC5B24" strokeWidth="0.7" opacity="0.22" />
            <path d="M470 0 Q730 220 590 460 Q470 710 710 900" fill="none" stroke="#EC5B24" strokeWidth="0.6" opacity="0.16" />
            <path d="M495 0 Q755 230 605 465 Q485 715 725 900" fill="none" stroke="#EC5B24" strokeWidth="0.5" opacity="0.11" />
            <path d="M520 0 Q780 240 620 470 Q500 720 740 900" fill="none" stroke="#EC5B24" strokeWidth="0.5" opacity="0.07" />
            <path d="M395 0 Q655 190 545 445 Q425 695 665 900" fill="none" stroke="#EC5B24" strokeWidth="0.7" opacity="0.2" />
            <path d="M370 0 Q630 180 530 440 Q410 690 650 900" fill="none" stroke="#EC5B24" strokeWidth="0.6" opacity="0.13" />
            <path d="M345 0 Q605 170 515 435 Q395 685 635 900" fill="none" stroke="#EC5B24" strokeWidth="0.5" opacity="0.08" />
          </svg>

          {/* Logo */}
          <div className="gl-logo">
            <div className="gl-logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3.5" fill="#0C0B09" />
                <circle cx="9" cy="2.5" r="1.8" fill="#0C0B09" opacity="0.5" />
                <circle cx="9" cy="15.5" r="1.8" fill="#0C0B09" opacity="0.5" />
                <circle cx="2.5" cy="9" r="1.8" fill="#0C0B09" opacity="0.5" />
                <circle cx="15.5" cy="9" r="1.8" fill="#0C0B09" opacity="0.5" />
              </svg>
            </div>
            <span className="gl-logo-name">Gravio</span>
          </div>

          {/* Hero */}
          <div className="gl-hero">
            <div className="gl-eyebrow">
              <div className="gl-eyebrow-line" />
              How it works
            </div>
            <h1 className="gl-headline">
              Hire with <em>gravity.</em><br />
              Move fast,<br />
              hire right.
            </h1>
            <p className="gl-sub">
              A structured hiring loop for every role, every round,
              and every interviewer — driven by your Google Workspace.
            </p>
          </div>

          {/* Pipeline stages */}
          <div className="gl-stages">
            {STAGES.map((s, i) => (
              <div
                key={i}
                className={`gl-stage${activeStage === i ? ' active' : ''}`}
                onClick={() => setActiveStage(i)}
              >
                <div className="gl-stage-num">{s.num}</div>
                <div className="gl-stage-body">
                  <div className="gl-stage-title">{s.title}</div>
                  <div className="gl-stage-desc">{s.desc}</div>
                  <div className="gl-chips">
                    {s.chips.map((c) => (
                      <span key={c} className="gl-chip">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="gl-progress-bar">
              <div
                className="gl-progress-fill"
                style={{ width: `${((activeStage + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="gl-right">
          <div className="gl-form">
            <h2 className="gl-welcome">Welcome back</h2>
            <p className="gl-welcome-sub">Sign in to continue to your workspace</p>

            {/* Google button */}
            <button className="gl-google-btn" onClick={goGoogle}>
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="gl-divider">
              <div className="gl-div-line" />
              <span className="gl-div-text">or sign in with email</span>
              <div className="gl-div-line" />
            </div>

            <div className="gl-field-group">
              <label className="gl-label">Email address</label>
              <input
                className="gl-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="gl-field-group">
              <label className="gl-label">Password</label>
              <input
                className="gl-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="gl-submit-btn" onClick={goGoogle}>
              Sign in
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <div className="gl-footer">
              <div className="gl-stat">
                <div className="gl-stat-num">5-step</div>
                <div className="gl-stat-lbl">Structured pipeline</div>
              </div>
              <div className="gl-stat">
                <div className="gl-stat-num">0 manual</div>
                <div className="gl-stat-lbl">Scheduling needed</div>
              </div>
              <div className="gl-stat">
                <div className="gl-stat-num">100%</div>
                <div className="gl-stat-lbl">Google Workspace</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}