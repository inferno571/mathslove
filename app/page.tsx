'use client';

import { useRouter } from 'next/navigation';
import { GRADE_CONFIGS } from './lib/constants';
import Logo from './components/Logo';
import { AuthNav } from './components/AuthNav';

export default function Home() {
  const router = useRouter();

  const startTest = (gradeKey: string) => {
    router.push(`/test?grade=${gradeKey}`);
  };

  const faqs = [
    {
      question: "What is MathsLove?",
      answer: "MathsLove is an AI-powered platform designed to assess and analyze your child's mathematical intelligence through scientifically calibrated tests."
    },
    {
      question: "How long does the test take?",
      answer: "The test consists of 15 questions and typically takes about 5 to 15 minutes to complete, depending on the child's grade level and pace."
    },
    {
      question: "Is the test free?",
      answer: "Yes, you can take the basic assessment for free. We also offer detailed AI-powered insights to help you deeply understand your child's cognitive profile."
    },
    {
      question: "What age group is this for?",
      answer: "Our tests are currently calibrated for students in Grades 4 through 8, covering ages 9 to 14."
    },
    {
      question: "How is the Math IQ calculated?",
      answer: "The score is calculated based on accuracy, the difficulty of the specific questions answered, and the time taken to respond, providing a comprehensive measure of mathematical ability."
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <nav className="nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size={48} showText textColor="white" />
          <div style={{ fontSize: '0.85rem', opacity: 0.85, display: 'none' }}>Love Maths. Think Better.</div>
        </div>
        <AuthNav />
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>Get Your Child's <span style={{ color: '#F47920' }}>Math IQ</span> Measured</h1>
          <p>
            Discover your child's mathematical intelligence with our scientifically designed assessment.
            15 questions. Detailed AI-powered analysis. Know their true Math IQ.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => document.getElementById('grades')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Tested
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat">
          <div className="stat-value">2.5K+</div>
          <div className="stat-label">Tests Taken</div>
        </div>
        <div className="stat">
          <div className="stat-value">200K+</div>
          <div className="stat-label">Questions Answered</div>
        </div>
        <div className="stat">
          <div className="stat-value">99%</div>
          <div className="stat-label">Satisfaction Rate</div>
        </div>
      </div>

      <section className="section" id="grades">
        <h2 className="section-title">Select Your Grade Level</h2>
        <p className="section-subtitle">Choose your specific grade to begin your Math IQ assessment</p>

        <div className="grade-grid">
          {GRADE_CONFIGS.map((grade) => (
            <div
              key={grade.key}
              className="grade-card"
              style={{ '--card-color': grade.color } as React.CSSProperties}
              onClick={() => startTest(grade.key)}
            >

              <h3>{grade.label}</h3>
              <div className="age">{grade.ageRange}</div>
              <p>{grade.description}</p>
              {grade.enriched && (
                <span className="enriched-badge">Full AI Analysis</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <div className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <h4>Select Grade</h4>
              <p>Choose your grade level to get questions calibrated to your expected ability.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h4>Answer 15 Questions</h4>
              <p>Solve 15 carefully selected math problems. A timer tracks your speed per question.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h4>Get Your Score</h4>
              <p>Receive an IQ-scaled score based on accuracy, difficulty, and response time.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h4>AI Analysis</h4>
              <p>Get detailed AI insights into your strengths, weaknesses, and cognitive profile.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ textAlign: 'center' }}>
        <h2 className="section-title">The Most Accurate Math IQ Test</h2>
        <p style={{ maxWidth: 600, margin: '0 auto 32px', color: 'var(--text-light)', lineHeight: 1.7 }}>
          Our questions are sourced from peer-reviewed educational datasets including ASDiv and GSM8K.
          Each question has been carefully calibrated across difficulty levels and cognitive domains
          to provide a comprehensive measurement of mathematical intelligence.
        </p>
        <button className="btn-primary" onClick={() => document.getElementById('grades')?.scrollIntoView({ behavior: 'smooth' })}>
          Take the Test
        </button>
      </section>

      <section className="section" id="faq">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Everything you need to know about the MathsLove IQ Assessment</p>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary className="faq-summary">{faq.question}</summary>
              <div className="faq-content">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>

      <footer className="footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <div>
          <strong>MathsLove</strong> — Love Maths. Think Better. &copy; {new Date().getFullYear()}
        </div>
        <div style={{ fontSize: '0.85rem' }}>
          <a href="/privacy" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
