'use client';

import { useActionState, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signup, verifyOTP, resendOTP } from '../actions/auth';
import type { ActionState } from '../actions/auth';
import Logo from '../components/Logo';

function OTPInput({ onDigitsChange }: { onDigitsChange: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    onDigitsChange(digits.join(''));
  }, [digits, onDigitsChange]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    setDigits(prev => {
      const updated = [...prev];
      updated[index] = digit;
      return updated;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigits(prev => {
        const updated = [...prev];
        updated[index - 1] = '';
        return updated;
      });
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setDigits(updated);

    const nextEmpty = updated.findIndex(d => d === '');
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  }, []);

  return (
    <div className="otp-input-group" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`otp-digit-input ${digit ? 'filled' : ''}`}
          autoComplete="one-time-code"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendOTP, {} as ActionState);
  const [cooldown, setCooldown] = useState(30);
  const [isCoolingDown, setIsCoolingDown] = useState(true);

  useEffect(() => {
    if (!isCoolingDown) return;
    if (cooldown <= 0) {
      setIsCoolingDown(false);
      return;
    }
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, isCoolingDown]);

  useEffect(() => {
    if (state?.success) {
      setCooldown(30);
      setIsCoolingDown(true);
    }
  }, [state]);

  return (
    <div style={{ textAlign: 'center' }}>
      {isCoolingDown ? (
        <p className="otp-resend-cooldown">
          Resend code in <span className="otp-cooldown-timer">{cooldown}s</span>
        </p>
      ) : (
        <form action={action}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="otp-resend-btn"
            disabled={pending}
          >
            {pending ? 'Sending...' : 'Resend verification code'}
          </button>
        </form>
      )}
      {state?.error && (
        <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>{state.error}</p>
      )}
      {state?.message && !state?.error && (
        <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '8px' }}>{state.message}</p>
      )}
    </div>
  );
}

export default function SignupPage() {
  const [signupState, signupAction, signupPending] = useActionState(signup, {} as ActionState);
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {} as ActionState);
  const [otpCode, setOtpCode] = useState('');
  const otpFormRef = useRef<HTMLFormElement>(null);

  const showOTP = signupState?.otpRequired || otpState?.otpRequired;
  const currentEmail = otpState?.email || signupState?.email || '';

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && otpFormRef.current && !otpPending) {
      otpFormRef.current.requestSubmit();
    }
  }, [otpCode, otpPending]);

  const handleDigitsChange = useCallback((code: string) => {
    setOtpCode(code);
  }, []);

  return (
    <div className="landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="login-card" style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={64} />
        </div>

        <div className={`otp-step-container ${showOTP ? 'show-otp' : 'show-credentials'}`}>
          {/* ===== STEP 1: Signup Form ===== */}
          <div className={`otp-step ${!showOTP ? 'active' : 'inactive'}`}>
            <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center' }}>Create an Account</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
              Create an account to save your child&apos;s Math IQ results and access their detailed AI performance analysis.
            </p>

            <form action={signupAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Parent&apos;s Name</label>
                  <input
                    type="text"
                    name="parentName"
                    required
                    className="answer-input"
                    style={{ padding: '12px 16px' }}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Student&apos;s Name</label>
                  <input
                    type="text"
                    name="studentName"
                    required
                    className="answer-input"
                    style={{ padding: '12px 16px' }}
                    placeholder="e.g., Alex"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="answer-input"
                  style={{ padding: '12px 16px' }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="answer-input"
                  style={{ padding: '12px 16px' }}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Country (Optional)</label>
                  <input
                    type="text"
                    name="location"
                    className="answer-input"
                    style={{ padding: '12px 16px' }}
                    placeholder="e.g., United States"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Curriculum</label>
                  <select
                    name="board"
                    className="answer-input"
                    style={{ padding: '12px 16px', appearance: 'auto' }}
                    defaultValue="US Common Core"
                  >
                    <option value="US Common Core">US Common Core</option>
                    <option value="UK National Curriculum">UK National Curriculum</option>
                    <option value="IB">International Baccalaureate (IB)</option>
                    <option value="Cambridge">Cambridge (IGCSE)</option>
                    <option value="CBSE">CBSE (India)</option>
                    <option value="ICSE">ICSE (India)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {signupState?.error && !showOTP && (
                <div className="otp-error-box">
                  {signupState.error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '8px', width: '100%' }}
                disabled={signupPending}
              >
                {signupPending ? (
                  <span className="otp-btn-loading">
                    <span className="otp-spinner"></span>
                    Creating account...
                  </span>
                ) : 'Sign Up & Verify Email'}
              </button>
            </form>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
              Already have an account? <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Log in</Link>
            </p>
          </div>

          {/* ===== STEP 2: OTP Verification ===== */}
          {showOTP && (
            <div className={`otp-step ${showOTP ? 'active' : 'inactive'}`}>
              <div className="otp-email-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Verify your email</span>
              </div>

              <h2 style={{ color: 'var(--navy)', marginBottom: '8px', textAlign: 'center', fontSize: '1.5rem' }}>
                Enter verification code
              </h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
                We sent a 6-digit code to
              </p>
              <p style={{ color: 'var(--navy)', marginBottom: '28px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
                {currentEmail}
              </p>

              <form ref={otpFormRef} action={otpAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input type="hidden" name="email" value={currentEmail} />
                <input type="hidden" name="code" value={otpCode} />

                <OTPInput onDigitsChange={handleDigitsChange} />

                {otpState?.error && (
                  <div className="otp-error-box">
                    {otpState.error}
                  </div>
                )}

                {signupState?.message && !otpState?.error && (
                  <div className="otp-success-box">
                    {signupState.message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={otpPending}
                >
                  {otpPending ? (
                    <span className="otp-btn-loading">
                      <span className="otp-spinner"></span>
                      Verifying...
                    </span>
                  ) : 'Verify & Continue'}
                </button>
              </form>

              <div style={{ marginTop: '20px' }}>
                <ResendButton email={currentEmail} />
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  className="otp-back-btn"
                  onClick={() => window.location.reload()}
                >
                  ← Back to signup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
