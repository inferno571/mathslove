import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/db';
import { getSession } from '../../lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to save results.' }, { status: 401 });
    }

    const body = await request.json();
    // Support the legacy format where testResult was nested, or direct format
    const testResult = body.testResult || body;

    if (!testResult || !testResult.grade || testResult.score === undefined) {
      return NextResponse.json({ error: 'Missing required test result data' }, { status: 400 });
    }

    const db = getDb();

    await db.sql`
      INSERT INTO test_results (
        user_id, grade, score, max_score, iq_score, percentile, total_time, test_data
      ) VALUES (
        ${session.userId}, ${testResult.grade}, ${testResult.score}, 
        ${testResult.maxScore}, ${testResult.iqScore}, ${testResult.percentile}, 
        ${testResult.totalTime}, ${JSON.stringify(testResult)}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save result:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

