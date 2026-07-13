import { NextRequest, NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData, testResult } = body;

    if (!userData || !testResult) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    // Save to Postgres (if configured)
    if (connectionString) {
      try {
        const pool = createPool({ connectionString });
        await pool.sql`
          INSERT INTO test_results (
            parent_name, student_name, email, location, board, 
            grade, score, max_score, iq_score, percentile, total_time
          ) VALUES (
            ${userData.parentName}, ${userData.studentName}, ${userData.email}, 
            ${userData.location}, ${userData.board}, ${testResult.grade}, 
            ${testResult.score}, ${testResult.maxScore}, ${testResult.iqScore}, 
            ${testResult.percentile}, ${testResult.totalTime}
          )
        `;
      } catch (dbError) {
        // If table doesn't exist, log it, but don't crash the user flow
        console.error('Vercel Postgres insert error (did you create the table?):', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
