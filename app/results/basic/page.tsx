'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestResult } from '../../lib/types';
import { formatTime } from '../../lib/scoring';
import AIChat from '../../components/AIChat';
import { GRADE_CONFIGS } from '../../lib/constants';
import { LogoIcon } from '../../components/Logo';
import { getCurrentTest } from '../../lib/storage';

export default function BasicResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const data = getCurrentTest();
    if (!data) { router.push('/'); return; }
    setResult(data);
  }, [router]);

  if (!result) return <div className="loading-screen"><div className="spinner" /><div className="loading-text">Loading results...</div></div>;

  const grade = GRADE_CONFIGS.find(g => g.key === result.grade);
  const percentage = Math.round((result.score / result.maxScore) * 100);

  return (
    <div className="results-page">
      <div className="results-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoIcon size={50} />
          <div>
            <div className="results-header-info"><strong>MathsLove Results</strong></div>
            <div className="results-header-info">{grade?.label || result.grade} Test</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => router.push('/')}>Take Another Test</button>
      </div>

      <div className="basic-results">
        <div className="basic-score-card">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 8 }}>Your Score</div>
          <div className="basic-score-big">{result.score}/{result.maxScore}</div>
          <div className="basic-percentage">{percentage}%</div>
          <div className="basic-score-label">
            Completed in {formatTime(result.totalTime)}
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="iq-label" style={{ fontSize: '1.1rem' }}>
              Estimated IQ: <strong style={{ color: 'var(--teal)', fontSize: '1.3rem' }}>{result.iqScore}</strong>
            </div>
          </div>
        </div>

        <div className="coming-soon-banner">
          <h4>Detailed AI Analysis Coming Soon</h4>
          <p>Enriched question data for this grade level is being prepared. Try Grade 5 or Grade 6 for full AI-powered analysis with cognitive domain breakdowns.</p>
        </div>

        <h3 style={{ marginBottom: 16, color: 'var(--dark)' }}>Question Review</h3>
        {result.questions.map((q, i) => {
          const answer = result.answers[i];
          return (
            <div className="question-review" key={i}>
              <div className="question-review-header">
                <span style={{ fontWeight: 600 }}>Question {i + 1}</span>
                <span className={answer?.isCorrect ? 'review-correct' : 'review-incorrect'}>
                  {answer?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              <p>{q.problem}</p>
              <div className="review-answer">
                <span style={{ color: 'var(--text-muted)' }}>Your answer: </span>
                <span style={{ fontWeight: 600 }}>{answer?.answer || '(no answer)'}</span>
              </div>
              <div className="review-answer">
                <span style={{ color: 'var(--text-muted)' }}>Correct answer: </span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{q.correct_answer}</span>
              </div>
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Show Explanation
                </summary>
                <div className="review-detail" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{q.explanation}</div>
              </details>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Time: {formatTime(answer?.timeSpent || 0)}
              </div>
            </div>
          );
        })}

        {/* AI Chat Widget */}
        <AIChat testResult={result} />
      </div>

      <footer className="footer">
        <strong>MathsLove</strong> — Love Maths. Think Better. &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
