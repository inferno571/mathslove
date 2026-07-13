'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GRADE_CONFIGS, QUESTIONS_PER_TEST } from '../lib/constants';
import { Question, QuestionSet, UserAnswer, isEnrichedQuestion, EnrichedQuestion } from '../lib/types';
import { checkAnswer, selectRandomQuestions, formatTime, buildTestResult } from '../lib/scoring';
import Calculator from '../components/Calculator';
import Logo, { LogoIcon } from '../components/Logo';
import { saveCurrentTest } from '../lib/storage';

const getChoicesForQuestion = (question: Question) => {
  if (question.choices && question.choices.length > 0) {
    return question.choices;
  }
  // Fallback/Placeholder choices for other grades
  const correct = question.correct_answer;
  const fallbacks = [correct, 'Option B', 'Option C', 'Option D'];
  let hash = 0;
  const str = question.id || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const shuffled = [...fallbacks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.abs((hash + i) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function TestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradeKey = searchParams.get('grade') || 'grade_5';

  const gradeConfig = GRADE_CONFIGS.find(g => g.key === gradeKey);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timers, setTimers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load questions
  useEffect(() => {
    if (!gradeConfig) { router.push('/'); return; }
    fetch(`/data/${gradeConfig.file}`)
      .then(r => r.json())
      .then((data: QuestionSet) => {
        const selected = selectRandomQuestions(data.questions, QUESTIONS_PER_TEST);
        setQuestions(selected);
        setAnswers(new Array(selected.length).fill(''));
        setTimers(new Array(selected.length).fill(0));
        setLoading(false);
      })
      .catch(() => { router.push('/'); });
  }, [gradeConfig, router]);

  // Total timer
  useEffect(() => {
    if (loading) return;
    timerRef.current = setInterval(() => setTotalTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  // Per-question timer
  useEffect(() => {
    if (loading) return;
    questionTimerRef.current = setInterval(() => {
      setTimers(prev => {
        const next = [...prev];
        next[currentIndex] = (next[currentIndex] || 0) + 1;
        return next;
      });
    }, 1000);
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [currentIndex, loading]);

  // Focus input on question change
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [currentIndex, loading]);

  const setAnswer = useCallback((value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  }, [currentIndex]);

  const goTo = (index: number) => {
    if (index >= 0 && index < questions.length) setCurrentIndex(index);
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const userAnswers: UserAnswer[] = questions.map((q, i) => ({
      questionIndex: i,
      questionId: q.id,
      answer: answers[i] || '',
      timeSpent: timers[i] || 0,
      isCorrect: checkAnswer(answers[i] || '', q.correct_answer),
    }));

    const result = buildTestResult(gradeKey, questions, userAnswers);
    saveCurrentTest(result);

    router.push('/collect-info');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Preparing your test...</div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const enriched = isEnrichedQuestion(q) ? (q as EnrichedQuestion) : null;
  const answeredCount = answers.filter(a => a.trim()).length;

  return (
    <div className="test-page">
      <div className="test-header">
        <div className="test-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoIcon size={44} />
            <h2 style={{ margin: 0 }}>{gradeConfig?.label} Test</h2>
          </div>
          <span className="test-progress-text">{answeredCount}/{questions.length} answered</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
        <div className={`timer-display ${totalTime > 540 ? 'timer-warning' : ''}`}>
          {formatTime(totalTime)}
        </div>
      </div>

      <div className="test-content">
        <div className="question-dots">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`q-dot ${i === currentIndex ? 'active' : ''} ${answers[i]?.trim() ? 'answered' : ''}`}
              onClick={() => goTo(i)}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="question-card">
          <div className="question-meta">
            <span className="question-num">Q{currentIndex + 1}</span>
            {enriched && (
              <>
                <span className="question-badge badge-topic">{enriched.topic}</span>
                {enriched.calculator_needed && <span className="question-badge badge-calc">Calculator OK</span>}
              </>
            )}
          </div>

          <div className="question-text">{q.problem}</div>

          <div className="choices-group" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {getChoicesForQuestion(q).map((choice, idx) => {
              const isSelected = answers[currentIndex] === choice;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAnswer(choice)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius)',
                    border: isSelected ? '2px solid var(--teal)' : '1px solid #ddd',
                    background: isSelected ? 'var(--cream)' : 'white',
                    color: 'var(--dark)',
                    textAlign: 'left',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1px solid ' + (isSelected ? 'var(--teal)' : '#ccc'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: isSelected ? 'var(--teal)' : 'transparent',
                    color: isSelected ? 'white' : '#666'
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Time on this question: {formatTime(timers[currentIndex] || 0)}</span>
          </div>
        </div>

        <div className="test-nav">
          <div className="test-nav-group">
            <button className="btn-outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button className="btn-primary" onClick={() => goTo(currentIndex + 1)}>Next</button>
            ) : (
              <button className="btn-secondary" onClick={() => setShowModal(true)}>Finish Test</button>
            )}
          </div>
          <button
            className="btn-outline"
            style={{ borderColor: 'var(--copper)', color: 'var(--copper)' }}
            onClick={() => setShowModal(true)}
          >
            Submit All
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit Your Test?</h3>
            <p>Review your progress before submitting.</p>
            <div className="modal-stats">
              <div className="modal-stat">
                <div className="modal-stat-val">{answeredCount}</div>
                <div className="modal-stat-label">Answered</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-val">{questions.length - answeredCount}</div>
                <div className="modal-stat-label">Unanswered</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-val">{formatTime(totalTime)}</div>
                <div className="modal-stat-label">Time</div>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Go Back</button>
              <button className="btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
      
      {enriched?.calculator_needed && <Calculator />}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner" /><div className="loading-text">Loading...</div></div>}>
      <TestContent />
    </Suspense>
  );
}
