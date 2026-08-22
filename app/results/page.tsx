'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TestResult, isEnrichedQuestion, EnrichedQuestion, AIAnalysis } from '../lib/types';
import { formatTime } from '../lib/scoring';
import AIChat from '../components/AIChat';
import Logo, { LogoIcon } from '../components/Logo';
import { getCurrentTest } from '../lib/storage';

// BellCurve component removed as IQ score display is replaced with percentage

// Confidence chart
function ConfidenceChart({ answers, questions }: { answers: TestResult['answers']; questions: TestResult['questions'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const pad = { top: 30, right: 30, bottom: 40, left: 50 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

    // Running IQ estimate
    let cumCorrect = 0;
    const iqEstimates: number[] = [];
    for (let i = 0; i < answers.length; i++) {
      if (answers[i].isCorrect) cumCorrect++;
      const ratio = cumCorrect / (i + 1);
      iqEstimates.push(70 + ratio * 75);
    }

    const minIQ = Math.min(...iqEstimates) - 10;
    const maxIQ = Math.max(...iqEstimates) + 10;

    // Grid
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#999'; ctx.font = '11px Inter';
      ctx.textAlign = 'right';
      const val = Math.round(maxIQ - ((maxIQ - minIQ) / 4) * i);
      ctx.fillText(String(val), pad.left - 8, y + 4);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    iqEstimates.forEach((iq, i) => {
      const x = pad.left + (i / (iqEstimates.length - 1 || 1)) * plotW;
      const y = pad.top + ((maxIQ - iq) / (maxIQ - minIQ)) * plotH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, 'rgba(43,124,233,0.3)'); grad.addColorStop(1, 'rgba(43,124,233,0.05)');
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); ctx.strokeStyle = '#2B7CE9'; ctx.lineWidth = 2.5;
    iqEstimates.forEach((iq, i) => {
      const x = pad.left + (i / (iqEstimates.length - 1 || 1)) * plotW;
      const y = pad.top + ((maxIQ - iq) / (maxIQ - minIQ)) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    iqEstimates.forEach((iq, i) => {
      const x = pad.left + (i / (iqEstimates.length - 1 || 1)) * plotW;
      const y = pad.top + ((maxIQ - iq) / (maxIQ - minIQ)) * plotH;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = answers[i].isCorrect ? '#22c55e' : '#ef4444'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });

    // X labels
    ctx.fillStyle = '#999'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    iqEstimates.forEach((_, i) => {
      const x = pad.left + (i / (iqEstimates.length - 1 || 1)) * plotW;
      ctx.fillText(`Q${i + 1}`, x, h - 8);
    });
    ctx.fillText('Question Number', w / 2, h - 0);
    ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('IQ Estimate', 0, 0); ctx.restore();
  }, [answers, questions]);

  return <canvas ref={canvasRef} width={600} height={300} style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'block' }} />;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const data = getCurrentTest();
    if (!data) { router.push('/'); return; }
    setResult(data);

    // Fetch AI analysis
    setAiLoading(true);
    fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(r => r.json())
      .then((a: AIAnalysis) => { setAiAnalysis(a); setAiLoading(false); })
      .catch(() => setAiLoading(false));
  }, [router]);

  if (!result) return <div className="loading-screen"><div className="spinner" /><div className="loading-text">Loading results...</div></div>;

  const enrichedQs = result.questions.filter(isEnrichedQuestion) as EnrichedQuestion[];
  const date = new Date(result.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // IQ comparison data removed

  // Capacity colors
  const capacityColors: Record<string, string> = {
    'Quantitative Reasoning': '#1B2B5E',
    'Spatial Reasoning': '#F47920',
    'Logical Reasoning': '#2B7CE9',
    'Algebraic Reasoning': '#a78bfa',
    'Numerical Reasoning': '#f59e0b',
    'Pattern Recognition': '#22c55e',
  };

  const domainCardColors: Record<string, string> = {
    'Quantitative Reasoning': '#1B2B5E',
    'Spatial Reasoning': '#F47920',
    'Logical Reasoning': '#2563eb',
    'Algebraic Reasoning': '#7c3aed',
    'Numerical Reasoning': '#d97706',
    'Pattern Recognition': '#059669',
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoIcon size={50} />
          <div>
            <div className="results-header-info"><strong>MathsLove Results</strong></div>
            <div className="results-header-info">Date: {date} &bull; {result.grade.replace('grade_', 'Grade ')} Test</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => router.push('/')}>Take Another Test</button>
      </div>

      <div className="results-content">
        {/* Hero: IQ + Percentile */}
        <div className="results-hero">
          <div className="iq-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 8 }}>Your Score</div>
            <div className="iq-score-display">
              {Math.round((result.score / result.maxScore) * 100)}%
            </div>
            <div className="iq-label">{result.score} out of {result.maxScore} correct</div>
          </div>

          <div className="percentile-card">
            <div className="percentile-badge">{result.percentile}%</div>
            <h3 style={{ marginBottom: 12 }}>Performance Summary</h3>
            <p className="percentile-text">
              You answered <strong>{result.score}/{result.maxScore}</strong> questions correctly in <strong>{formatTime(result.totalTime)}</strong>.
              {result.cognitiveBreakdown && result.cognitiveBreakdown.length > 0 && (
                <> Your strongest area was <strong>
                  {result.cognitiveBreakdown.reduce((a, b) => a.percentage > b.percentage ? a : b).domain}
                </strong>.</>
              )}
            </p>
          </div>
        </div>

        {/* Breakdown by Domain */}
        {result.cognitiveBreakdown && result.cognitiveBreakdown.length > 0 && (
          <div className="capacities-section">
            <h3>Intellectual Capacities</h3>
            {result.cognitiveBreakdown.map(cb => (
              <div className="capacity-row" key={cb.domain}>
                <div className="capacity-label">{cb.domain}</div>
                <div className="capacity-bar-track">
                  <div className="capacity-bar-fill" style={{
                    width: `${cb.percentage}%`,
                    background: capacityColors[cb.domain] || 'var(--teal)',
                  }} />
                </div>
              </div>
            ))}
            <div className="capacity-scale">
              <span>Low</span><span>Lower</span><span>Average</span><span>Higher</span><span>High</span>
            </div>
          </div>
        )}

        {/* Domain Cards */}
        {result.cognitiveBreakdown && result.cognitiveBreakdown.length > 0 && (
          <div className="domain-cards">
            {result.cognitiveBreakdown.map(cb => (
              <div className="domain-card" key={cb.domain}>
                <div className="domain-card-header" style={{ background: domainCardColors[cb.domain] || 'var(--teal)' }}>
                  {cb.domain}
                </div>
                <div className="domain-card-body">
                  <div className="domain-overall">
                    <div className="domain-overall-label">Overall</div>
                    <div className="domain-overall-score">{cb.percentage}%</div>
                  </div>
                  <p className="domain-analysis">
                    You answered {cb.correct} out of {cb.total} questions correctly in {cb.domain}.
                    {cb.percentage >= 80
                      ? ` Excellent performance! You demonstrate strong ${cb.domain.toLowerCase()} skills.`
                      : cb.percentage >= 50
                      ? ` Good work. With practice, you can further strengthen your ${cb.domain.toLowerCase()} abilities.`
                      : ` This area needs more practice. Focus on building your ${cb.domain.toLowerCase()} foundations.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confidence Chart */}
        <div className="confidence-section">
          <h3>IQ Estimation During the Test</h3>
          <ConfidenceChart answers={result.answers} questions={result.questions} />
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
            Green dots indicate correct answers, red dots indicate incorrect answers.
          </p>
        </div>

        {/* AI Analysis */}
        <div className="ai-section">
          <h3>
            Detailed Analysis <span className="ai-badge">AI Powered</span>
          </h3>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="loading-text">Generating AI analysis...</p>
            </div>
          ) : aiAnalysis ? (
            <>
              <p className="ai-summary">{aiAnalysis.overallSummary}</p>
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--cream)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text)' }}>
                <strong>IQ Interpretation:</strong> {aiAnalysis.iqInterpretation}
              </div>
              <div className="ai-grid">
                <div className="ai-block ai-strengths">
                  <h4 style={{ color: 'var(--success)' }}>Strengths</h4>
                  <ul>{aiAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="ai-block ai-weaknesses">
                  <h4 style={{ color: 'var(--warning)' }}>Areas for Improvement</h4>
                  <ul>{aiAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              </div>
              <div className="ai-block ai-recommendations" style={{ marginTop: 24 }}>
                <h4 style={{ color: 'var(--teal)' }}>Recommendations</h4>
                <ul>{aiAnalysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </>
          ) : (
            <p className="ai-summary" style={{ color: 'var(--text-muted)' }}>
              AI analysis could not be generated. Please ensure the Gemini API key is configured in your environment variables.
            </p>
          )}
        </div>

        {/* Score Table */}
        <div className="score-table-section">
          <h3>Score Calculation</h3>
          <p className="subtitle">Detailed breakdown of your performance on each question</p>
          <table className="score-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Topic</th>
                <th>Your Answer</th>
                <th>Correct Answer</th>
                <th>Result</th>
                <th>Time Used</th>
              </tr>
            </thead>
            <tbody>
              {result.questions.map((q, i) => {
                const answer = result.answers[i];
                const eq = isEnrichedQuestion(q) ? (q as EnrichedQuestion) : null;
                return (
                  <tr key={i}>
                    <td className="link-cell">Question {i + 1}</td>
                    <td style={{ color: eq ? (domainCardColors[eq.cognitive_domain] || 'var(--teal)') : 'var(--text)' }}>
                      {eq ? eq.topic : q.solution_type}
                    </td>
                    <td>{answer?.answer || '(no answer)'}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{q.correct_answer}</td>
                    <td className={answer?.isCorrect ? 'answer-correct' : 'answer-incorrect'}>
                      {answer?.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </td>
                    <td className="time-cell">{formatTime(answer?.timeSpent || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Question Review Section */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--dark)' }}>Question Review</h3>
          {result.questions.map((q, i) => {
            const answer = result.answers[i];
            const eq = isEnrichedQuestion(q) ? (q as EnrichedQuestion) : null;
            return (
              <div className="question-review" key={i} style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '20px',
                borderLeft: answer?.isCorrect ? '4px solid #22c55e' : '4px solid #ef4444',
                border: '1px solid #f1f5f9'
              }}>
                <div className="question-review-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--dark)' }}>
                    Question {i + 1} 
                    {eq && <span style={{ 
                      fontSize: '0.8rem', 
                      marginLeft: 12, 
                      padding: '4px 10px', 
                      borderRadius: 12, 
                      background: 'var(--cream)', 
                      color: 'var(--teal)',
                      fontWeight: 600
                    }}>{eq.topic}</span>}
                  </span>
                  <span style={{
                    color: answer?.isCorrect ? '#22c55e' : '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    background: answer?.isCorrect ? '#f0fdf4' : '#fef2f2',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {answer?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p style={{ marginBottom: '16px', color: '#334155', lineHeight: 1.6, fontSize: '1rem' }}>{q.problem}</p>
                <div className="review-answer" style={{ marginBottom: 6, fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Your answer: </span>
                  <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{answer?.answer || '(no answer)'}</span>
                </div>
                <div className="review-answer" style={{ marginBottom: 16, fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Correct answer: </span>
                  <span style={{ fontWeight: 600, color: '#1B2B5E' }}>{q.correct_answer}</span>
                </div>
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}>
                    Show Explanation & Steps
                  </summary>
                  <div className="review-detail" style={{ 
                    marginTop: 12, 
                    whiteSpace: 'pre-line', 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    border: '1px solid #e2e8f0',
                    color: '#475569'
                  }}>{q.explanation}</div>
                </details>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  Time spent on this question: {formatTime(answer?.timeSpent || 0)}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Chat Widget */}
        <AIChat testResult={result} />
      </div>

      <footer className="footer">
        <strong>MathsLove</strong> — Love Maths. Think Better. &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
