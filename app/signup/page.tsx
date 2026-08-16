'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from '../actions/auth';
import Logo from '../components/Logo';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, {});

  return (
    <div className="landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={64} />
        </div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', textAlign: 'center' }}>Create an Account</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
          Create an account to save your child's Math IQ results and access their detailed AI performance analysis.
        </p>

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Parent's Name</label>
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
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Student's Name</label>
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
            {pending ? 'Creating account...' : 'Sign Up & View Results'}
          </button>
        </form>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
