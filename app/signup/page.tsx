'use client';

import { useActionState, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { signup, verifyOTP, resendOTP } from '../actions/auth';
import type { ActionState } from '../actions/auth';
import Logo from '../components/Logo';

// Lazy-load reCAPTCHA so it doesn't block the initial page render
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
          <div key={i} className={`password-strength-segment ${i <= level ? 'active' : ''}`} />
        ))}
      </div>
      <p className="password-strength-label">{label}</p>
    </div>
  );
}

function PasswordInput({ name, placeholder = '••••••••', onValueChange }: {
  name: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="password-input-wrapper">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        required
        minLength={8}
        className="answer-input"
        style={{ padding: '12px 44px 12px 16px' }}
        placeholder={placeholder}
        onChange={e => onValueChange?.(e.target.value)}
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

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => { onDigitsChange(digits.join('')); }, [digits, onDigitsChange]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits(prev => { const u = [...prev]; u[index] = digit; return u; });
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigits(prev => { const u = [...prev]; u[index - 1] = ''; return u; });
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted.length) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) updated[i] = pasted[i] || '';
    setDigits(updated);
    const next = updated.findIndex(d => d === '');
    inputRefs.current[next === -1 ? 5 : next]?.focus();
  }, []);

  return (
    <div className="otp-input-group" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={digit}
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
    if (cooldown <= 0) { setIsCoolingDown(false); return; }
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown, isCoolingDown]);

  useEffect(() => { if (state?.success) { setCooldown(30); setIsCoolingDown(true); } }, [state]);

  return (
    <div style={{ textAlign: 'center' }}>
      {isCoolingDown ? (
        <p className="otp-resend-cooldown">Resend code in <span className="otp-cooldown-timer">{cooldown}s</span></p>
      ) : (
        <form action={action}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="context" value="signup" />
          <button type="submit" className="otp-resend-btn" disabled={pending}>
            {pending ? 'Sending...' : 'Resend verification code'}
          </button>
        </form>
      )}
      {state?.error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>{state.error}</p>}
      {state?.message && !state?.error && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '8px' }}>{state.message}</p>}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function SignupPage() {
  const [signupState, signupAction, signupPending] = useActionState(signup, {} as ActionState);
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {} as ActionState);
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaResetRef = useRef<(() => void) | null>(null);
  const otpFormRef = useRef<HTMLFormElement>(null);

  const showOTP = signupState?.otpRequired || otpState?.otpRequired;
  const currentEmail = otpState?.email || signupState?.email || '';

  // Auto-submit OTP form when 6 digits filled
  useEffect(() => {
    if (otpCode.length === 6 && otpFormRef.current && !otpPending) {
      otpFormRef.current.requestSubmit();
    }
  }, [otpCode, otpPending]);

  // Reset captcha on error
  useEffect(() => {
    if (signupState?.error) {
      captchaResetRef.current?.();
      setCaptchaToken(null);
    }
  }, [signupState?.error]);

  const handleDigitsChange = useCallback((code: string) => setOtpCode(code), []);

  // Wrap signupAction to inject captcha token into FormData
  const handleSignupSubmit = useCallback(async (formData: FormData) => {
    if (captchaToken) formData.set('g-recaptcha-response', captchaToken);
    return signupAction(formData);
  }, [captchaToken, signupAction]);

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

            <form action={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Student Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Student&apos;s Name</label>
                <input type="text" name="studentName" required className="answer-input" style={{ padding: '12px 16px' }} placeholder="e.g., Alex" />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Email Address</label>
                <input type="email" name="email" required className="answer-input" style={{ padding: '12px 16px' }} placeholder="you@example.com" autoComplete="email" />
              </div>

              {/* Mobile with Country Code */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>
                  Mobile Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="countryCode"
                    required
                    className="answer-input"
                    style={{ padding: '12px 10px', appearance: 'auto', width: '130px', flexShrink: 0 }}
                    defaultValue="+1"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+7">🇷🇺 +7</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+63">🇵🇭 +63</option>
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+94">🇱🇰 +94</option>
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+64">🇳🇿 +64</option>
                    <option value="+353">🇮🇪 +353</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+46">🇸🇪 +46</option>
                    <option value="+41">🇨🇭 +41</option>
                  </select>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    className="answer-input"
                    style={{ padding: '12px 16px', flex: 1 }}
                    placeholder="234 567 8900"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Password</label>
                <PasswordInput name="password" onValueChange={setPassword} />
                <PasswordStrengthBar password={password} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>Must be at least 8 characters</p>
              </div>

              {/* Curriculum */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Curriculum</label>
                <select name="board" className="answer-input" style={{ padding: '12px 16px', appearance: 'auto' }} defaultValue="US Common Core">
                  <option value="US Common Core">US Common Core</option>
                  <option value="UK National Curriculum">UK National Curriculum</option>
                  <option value="IB">International Baccalaureate (IB)</option>
                  <option value="Cambridge">Cambridge (IGCSE)</option>
                  <option value="CBSE">CBSE (India)</option>
                  <option value="ICSE">ICSE (India)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {signupState?.error && !showOTP && (
                <div className="otp-error-box">{signupState.error}</div>
              )}

              {/* Google reCAPTCHA */}
              <HCaptcha
                onVerify={token => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                resetRef={captchaResetRef}
              />

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '4px', width: '100%' }}
                disabled={signupPending || !captchaToken}
              >
                {signupPending ? (
                  <span className="otp-btn-loading"><span className="otp-spinner"></span>Creating account...</span>
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

              <h2 style={{ color: 'var(--navy)', marginBottom: '8px', textAlign: 'center', fontSize: '1.5rem' }}>Enter verification code</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '8px', textAlign: 'center', fontSize: '0.9rem' }}>We sent a 6-digit code to</p>
              <p style={{ color: 'var(--navy)', marginBottom: '28px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>{currentEmail}</p>

              <form ref={otpFormRef} action={otpAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input type="hidden" name="email" value={currentEmail} />
                <input type="hidden" name="code" value={otpCode} />
                <input type="hidden" name="context" value="signup" />

                <OTPInput onDigitsChange={handleDigitsChange} />

                {otpState?.error && <div className="otp-error-box">{otpState.error}</div>}
                {signupState?.message && !otpState?.error && <div className="otp-success-box">{signupState.message}</div>}

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={otpPending}>
                  {otpPending ? (
                    <span className="otp-btn-loading"><span className="otp-spinner"></span>Verifying...</span>
                  ) : 'Verify & Continue'}
                </button>
              </form>

              <div style={{ marginTop: '20px' }}><ResendButton email={currentEmail} /></div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="otp-back-btn" onClick={() => window.location.reload()}>← Back to signup</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
