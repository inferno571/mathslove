import { getSession } from '../lib/session';
import { getDb } from '../lib/db';
import { redirect } from 'next/navigation';
import Logo from '../components/Logo';
import Link from 'next/link';
import { AuthNav } from '../components/AuthNav';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect('/login');
  }

  const db = getDb();
  let results: any[] = [];
  try {
    const res = await db.sql`
      SELECT id, grade, score, max_score, created_at 
      FROM test_results 
      WHERE user_id = ${session.userId} 
      ORDER BY created_at DESC
    `;
    results = res.rows || [];
  } catch(e) {
    console.error('Failed to fetch test results:', e);
  }

  return (
    <div className="landing" style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav className="nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size={48} showText textColor="white" />
        </div>
        <AuthNav />
      </nav>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h2 style={{ margin: 0 }}>Your Past Results</h2>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>Take a Test</Link>
        </div>
        
        {results.length === 0 ? (
          <div style={{ padding: 40, background: 'white', borderRadius: 12, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't taken any tests yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {results.map((r: any) => (
              <div key={r.id} style={{ padding: 24, background: 'white', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 4 }}>
                    {r.grade.replace('grade_', 'Grade ')} Test
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--teal)' }}>
                    {Math.round((r.score / r.max_score) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {r.score}/{r.max_score} correct
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
