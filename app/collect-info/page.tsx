'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GRADE_CONFIGS } from '../lib/constants';
import { saveUserProfile, getCurrentTest, addTestToHistory, saveCurrentTest } from '../lib/storage';
import Logo from '../components/Logo';

export default function CollectInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    email: '',
    location: '',
    board: 'US Common Core'
  });

  useEffect(() => {
    // Make sure test result exists in localStorage
    const result = getCurrentTest();
    if (!result) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const testResult = getCurrentTest();
      if (!testResult) return router.push('/');

      // Save user profile to localStorage + cookie
      saveUserProfile({
        parentName: formData.parentName,
        studentName: formData.studentName,
        email: formData.email,
        location: formData.location,
        board: formData.board,
      });

      // Add this test to persistent history
      addTestToHistory(testResult);

      // Fire-and-forget to the API (for future server-side use)
      fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: formData, testResult })
      }).catch(() => { /* silently ignore — data is already saved locally */ });

      // Redirect based on grade config (enriched or basic)
      const gradeConfig = GRADE_CONFIGS.find(g => g.key === testResult.grade);
      if (gradeConfig?.enriched) {
        router.push('/results');
      } else {
        router.push('/results/basic');
      }
    } catch {
      setLoading(false);
      alert('There was an error processing your results. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size={72} />
        </div>
        <h2 style={{ color: 'var(--blue)', marginBottom: '12px', textAlign: 'center' }}>Test Completed!</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
          Your child&apos;s Math IQ has been successfully calculated. Please provide a few details to unlock their comprehensive performance report and AI analysis.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Parent&apos;s Name</label>
            <input 
              type="text" 
              name="parentName" 
              required 
              className="answer-input" 
              style={{ padding: '12px 16px' }} 
              value={formData.parentName}
              onChange={handleChange}
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
              value={formData.studentName}
              onChange={handleChange}
              placeholder="e.g., Alex"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="answer-input" 
              style={{ padding: '12px 16px' }} 
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email to receive reports"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Country</label>
              <input 
                type="text" 
                name="location" 
                required 
                className="answer-input" 
                style={{ padding: '12px 16px' }} 
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., United States"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--dark)' }}>Curriculum / System</label>
              <select 
                name="board" 
                required 
                className="answer-input" 
                style={{ padding: '12px 16px', appearance: 'auto' }}
                value={formData.board}
                onChange={handleChange}
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

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ marginTop: '16px', width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'View Math IQ Results'}
          </button>
        </form>
        
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
          Your data is stored locally on your device and used only to personalize your experience. We never share personal information with third parties.
        </p>
      </div>
    </div>
  );
}
