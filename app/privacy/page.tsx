import React from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function PrivacyPolicyPage() {
  return (
    <div className="landing" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cream)' }}>
      <nav className="nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <Logo size={48} showText textColor="white" />
        </Link>
      </nav>

      <main style={{ flex: 1, padding: '48px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ color: 'var(--navy)', marginBottom: '8px', fontSize: '2rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>Effective Date: August 2, 2026</p>
          
          <div style={{ color: 'var(--dark)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>Welcome to MathsLove ("MathsLove", "we", "our", or "us"). Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services.</p>
            
            <p>By accessing or using MathsLove, you agree to the practices described in this Privacy Policy.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>1. Information We Collect</h2>
            <p>We may collect the following information:</p>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '8px' }}>Personal Information</h3>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>Name</li>
              <li>Email address</li>
              <li>Mobile number (if provided)</li>
              <li>Parent or guardian information (where applicable)</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '8px' }}>Educational Information</h3>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>Grade/Class</li>
              <li>Assessment responses and scores</li>
              <li>Progress reports and performance analytics</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '8px' }}>Technical Information</h3>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device information</li>
              <li>Cookies and usage statistics</li>
            </ul>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>Create and manage your account.</li>
              <li>Conduct mathematics assessments.</li>
              <li>Generate personalized performance reports.</li>
              <li>Improve our educational content and services.</li>
              <li>Respond to customer support requests.</li>
              <li>Send important account-related communications.</li>
              <li>Inform you about new features, updates, or educational resources (you may opt out of promotional emails at any time).</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>3. Cookies</h2>
            <p>MathsLove may use cookies and similar technologies to improve website functionality, remember user preferences, analyze website traffic, and enhance the overall user experience.</p>
            <p>You may disable cookies through your browser settings; however, some features of the website may not function properly.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>4. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. While we strive to safeguard your information, no method of electronic storage or internet transmission is completely secure.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>5. Sharing of Information</h2>
            <p>We may share information only:</p>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>With trusted service providers who help operate our website.</li>
              <li>When required by law or legal process.</li>
              <li>To protect our legal rights or prevent fraud.</li>
            </ul>
            <p>We do not sell or rent your personal information.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>6. Children's Privacy</h2>
            <p>MathsLove provides educational services intended for school students. Where required by applicable law, parents or legal guardians should provide consent before a child submits personal information through our website.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>7. Your Rights</h2>
            <p>Subject to applicable laws, you may:</p>
            <ul style={{ paddingLeft: '24px', margin: 0 }}>
              <li>Access your personal information.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and personal information.</li>
              <li>Withdraw consent for marketing communications.</li>
            </ul>
            <p>To exercise these rights, please contact us using the details below.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>8. Data Retention</h2>
            <p>We retain your information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and improve our educational platform.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>9. Third-Party Services</h2>
            <p>Our website may use trusted third-party services for hosting, analytics, email communication, authentication, or other technical functions. These providers are expected to maintain appropriate security standards.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>10. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page along with the revised effective date.</p>

            <h2 style={{ color: 'var(--navy)', fontSize: '1.4rem', marginTop: '16px', marginBottom: '8px' }}>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p>
              <strong>MathsLove</strong><br />
              Email: <a href="mailto:support@mathslove.com" style={{ color: 'var(--blue)' }}>support@mathslove.com</a>
            </p>
            <p>We will make reasonable efforts to respond to your queries promptly.</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <strong>MathsLove</strong> — Love Maths. Think Better. &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
