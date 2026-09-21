'use client';

import { useActionState, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { forgotPassword, verifyOTP, resetPassword, resendOTP } from '../actions/auth';
import type { ActionState } from '../actions/auth';
import Logo from '../components/Logo';

const HCaptcha = dynamic(() => import('../components/HCaptcha'), { ssr: false });

// ── Password Strength Bar ────────────────────────────────────────────
function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3 | 4; label: string; className: string } {
  if (!password) return { level: 0, label: '', className: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', className: 'strength-weak' };
  if (score === 2) return { level: 2, label: 'Fair', className: 'strength-fair' };
  if (score === 3) return { level: 3, label: 'Good', className: 'strength-good' };
  return { level: 4, label: 'Strong', className: 'strength-strong' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { level, label, className } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className={`password-strength-wrapper ${className}`}>
      <div className="password-strength-bar">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`password-strength-segment ${i <= level ? 'active' : ''}`}
          />
        ))}
      </div>
      <p className="password-strength-label">{label}</p>
    </div>
  );
}

function PasswordInputWithToggle({ name, placeholder = '••••••••', onValueChange, id }: {
  name: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  id?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        name={name}
        required
        minLength={8}
        className="answer-input"
        style={{ padding: '12px 44px 12px 16px' }}
        placeholder={placeholder}
        onChange={e => onValueChange?.(e.target.value)}
        autoComplete={name === 'newPassword' ? 'new-password' : 'new-password'}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword(v => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── OTP Input ────────────────────────────────────────────────────────
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
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
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
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) updated[i] = pasted[i] || '';
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

// ── Resend Button (forgot-password context) ──────────────────────────
function ResendButton({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendOTP, {} as ActionState);
  const [cooldown, setCooldown] = useState(30);
  const [isCoolingDown, setIsCoolingDown] = useState(true);

  useEffect(() => {
    if (!isCoolingDown) return;
    if (cooldown <= 0) { setIsCoolingDown(false); return; }
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, isCoolingDown]);

  useEffect(() => {
    if (state?.success) { setCooldown(30); setIsCoolingDown(true); }
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
          <input type="hidden" name="context" value="forgot_password" />
          <button type="submit" className="otp-resend-btn" disabled={pending}>
            {pending ? 'Sending...' : 'Resend code'}
          </button>
        </form>
      )}
      {state?.error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>{state.error}</p>}
      {state?.message && !state?.error && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '8px' }}>{state.message}</p>}
    </div>
  );
}

// ── Step Indicator ───────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="fp-step-indicator">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`fp-step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}
        />
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // Step 1: enter email
  const [fpState, fpAction, fpPending] = useActionState(forgotPassword, {} as ActionState);
  // Step 2: verify OTP
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {} as ActionState);
  // Step 3: reset password
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, {} as ActionState);

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaResetRef = useRef<(() => void) | null>(null);
  const otpFormRef = useRef<HTMLFormElement>(null);

  // Step 1 → OTP required
  const showOTP = fpState?.otpRequired || otpState?.otpRequired;
  // Step 2 → OTP verified (success + no otpRequired = can reset)
  const showReset = !!(otpState?.success && !otpState?.otpRequired);

  const currentEmail = otpState?.email || fpState?.email || resetState?.email || '';

  const currentStep: 1 | 2 | 3 = showReset ? 3 : showOTP ? 2 : 1;

  // Auto-submit OTP form when 6 digits filled
  useEffect(() => {
    if (otpCode.length === 6 && otpFormRef.current && !otpPending) {
      otpFormRef.current.requestSubmit();
    }
  }, [otpCode, otpPending]);

  // Reset captcha on step-1 error
  useEffect(() => {
    if (fpState?.error) {
      captchaResetRef.current?.();
      setCaptchaToken(null);
    }
  }, [fpState?.error]);

  const handleDigitsChange = useCallback((code: string) => setOtpCode(code), []);

  // Inject captcha token into FormData
  const handleFpSubmit = useCallback(async (formData: FormData) => {
    if (captchaToken) formData.set('g-recaptcha-response', captchaToken);
    return fpAction(formData);
  }, [captchaToken, fpAction]);

  return (
    <div
      className="landing"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}
    >
      <div
        className="login-card"
        style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '440px', width: '100%', margin: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={64} />
        </div>

        <StepIndicator step={currentStep} />

        {/* ===== STEP 1: Enter Email ===== */}
        {!showOTP && !showReset && (
          <div className="otp-step active">
            <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center' }}>Forgot Password?</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
              Enter your account email and we&apos;ll send you a 6-digit reset code.
            </p>

            <form action={handleFpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  name="email"
                  required
                  className="answer-input"
                  style={{ padding: '12px 16px' }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {fpState?.error && <div className="otp-error-box">{fpState.error}</div>}

              {/* Google reCAPTCHA */}
              <HCaptcha
                onVerify={token => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                resetRef={captchaResetRef}
              />

              <button
                id="fp-send-btn"
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={fpPending || !captchaToken}
              >
                {fpPending ? (
                  <span className="otp-btn-loading"><span className="otp-spinner"></span>Sending code...</span>
                ) : 'Send Reset Code'}
              </button>
            </form>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
              Remember your password? <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ===== STEP 2: Enter OTP ===== */}
        {showOTP && !showReset && (
          <div className="otp-step active">
            <div className="otp-email-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Check your email</span>
            </div>

            <h2 style={{ color: 'var(--navy)', marginBottom: '8px', textAlign: 'center', fontSize: '1.5rem' }}>
              Enter reset code
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
              <input type="hidden" name="context" value="forgot_password" />

              <OTPInput onDigitsChange={handleDigitsChange} />

              {otpState?.error && <div className="otp-error-box">{otpState.error}</div>}
              {fpState?.message && !otpState?.error && <div className="otp-success-box">{fpState.message}</div>}

              <button
                id="fp-verify-btn"
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={otpPending}
              >
                {otpPending ? (
                  <span className="otp-btn-loading"><span className="otp-spinner"></span>Verifying...</span>
                ) : 'Verify Code'}
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <ResendButton email={currentEmail} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                className="otp-back-btn"
                onClick={() => window.location.reload()}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Set New Password ===== */}
        {showReset && (
          <div className="otp-step active">
            <div className="otp-email-badge" style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span>Identity verified</span>
            </div>

            <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center', fontSize: '1.4rem' }}>
              Set New Password
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '28px', textAlign: 'center', fontSize: '0.9rem' }}>
              Choose a strong password for your account.
            </p>

            <form action={resetAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="hidden" name="email" value={currentEmail} />

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>
                  New Password
                </label>
                <PasswordInputWithToggle
                  id="fp-new-password"
                  name="newPassword"
                  placeholder="Min. 8 characters"
                  onValueChange={setNewPassword}
                />
                <PasswordStrengthBar password={newPassword} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>
                  Confirm New Password
                </label>
                <PasswordInputWithToggle
                  id="fp-confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                />
              </div>

              {resetState?.error && <div className="otp-error-box">{resetState.error}</div>}
              {otpState?.message && !resetState?.error && <div className="otp-success-box">{otpState.message}</div>}

              <button
                id="fp-reset-btn"
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={resetPending}
              >
                {resetPending ? (
                  <span className="otp-btn-loading"><span className="otp-spinner"></span>Updating password...</span>
                ) : 'Update Password & Sign In'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
