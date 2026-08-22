import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Delete all OTP codes first (foreign key constraint)
    await db.sql`DELETE FROM otp_codes`;
    
    // Delete all test results (foreign key constraint)
    await db.sql`DELETE FROM test_results`;
    
    // Delete all users
    await db.sql`DELETE FROM users`;

    return NextResponse.json({ 
      message: 'All user data cleared successfully.',
      cleared: ['otp_codes', 'test_results', 'users']
    });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: 'Failed to clear database', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
