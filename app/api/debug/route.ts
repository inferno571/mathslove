import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check environment variables
  results.env = {
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasStorageUrl: !!process.env.STORAGE_URL,
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8) || 'NOT SET',
    hasFromEmail: !!process.env.FROM_EMAIL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };

  // 2. Test DB connection
  try {
    const { getDb } = await import('../../lib/db');
    const db = getDb();
    const res = await db.sql`SELECT 1 as test`;
    results.db = { success: true, rows: res.rows, rowCount: res.rowCount };
  } catch (e: any) {
    results.db = { success: false, error: e.message, stack: e.stack?.split('\n').slice(0, 5) };
  }

  // 3. Test Resend API key (just validate, don't send)
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Try to list API keys - a lightweight way to validate the key
    const { data, error } = await resend.apiKeys.list();
    if (error) {
      results.resend = { success: false, error };
    } else {
      results.resend = { success: true, keyCount: Array.isArray(data) ? data.length : 0 };
    }
  } catch (e: any) {
    results.resend = { success: false, error: e.message };
  }

  // 4. Test bcryptjs
  try {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('test', 10);
    const match = await bcrypt.compare('test', hash);
    results.bcrypt = { success: true, hashWorks: match };
  } catch (e: any) {
    results.bcrypt = { success: false, error: e.message };
  }

  // 5. Test crypto (for OTP generation)
  try {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    results.crypto = { success: true, sample: array[0] };
  } catch (e: any) {
    results.crypto = { success: false, error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
