'use client';

import { useActionState, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { login } from '../actions/auth';
import type { ActionState } from '../actions/auth';
import Logo from '../components/Logo';

const HCaptcha = dynamic(() => import('../components/HCaptcha'), { ssr: false });

export default function LoginPage() {
  const [loginState, loginAction, loginPending] = useActionState(login, {} as ActionState);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaResetRef = useRef<(() => void) | null>(null);

  // Reset captcha when there's an error so the user can try again
  useEffect(() => {
    if (loginState?.error) {
      captchaResetRef.current?.();
      setCaptchaToken(null);
    }
  }, [loginState?.error]);

  // Inject captcha token into FormData before the server action runs
  const handleLoginSubmit = useCallback(async (formData: FormData) => {
    if (captchaToken) formData.set('g-recaptcha-response', captchaToken);
    return loginAction(formData);
  }, [captchaToken, loginAction]);

  return (
    <div className="landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="login-card" style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '440px', width: '100%', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={64} />
        </div>

        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
          Sign in to view your child&apos;s Math IQ results and detailed AI analysis.
        </p>

        <form action={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              required
              className="answer-input"
              style={{ padding: '12px 16px' }}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark)' }}>
                Password
              </label>
              <Link href="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              required
              className="answer-input"
              style={{ padding: '12px 16px' }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {loginState?.error && (
            <div className="otp-error-box">
              {loginState.error}
            </div>
          )}

          {/* Google reCAPTCHA */}
          <HCaptcha
            onVerify={token => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            resetRef={captchaResetRef}
          />

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            style={{ marginTop: '4px', width: '100%' }}
            disabled={loginPending || !captchaToken}
          >
            {loginPending ? (
              <span className="otp-btn-loading">
                <span className="otp-spinner"></span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
