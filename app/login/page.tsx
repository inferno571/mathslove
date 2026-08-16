'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '../actions/auth';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <div className="landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '100%', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={64} />
        </div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
          Sign in to view your child's Math IQ results and detailed AI analysis.
        </p>

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              className="answer-input" 
              style={{ padding: '12px 16px' }} 
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 500, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              {state.error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ marginTop: '8px', width: '100%' }}
            disabled={pending}
          >
            {pending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
