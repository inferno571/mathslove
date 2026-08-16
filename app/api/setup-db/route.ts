import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Create users table
    await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        parent_name   VARCHAR(255) NOT NULL,
        student_name  VARCHAR(255) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        location      VARCHAR(255) DEFAULT '',
        board         VARCHAR(100) DEFAULT 'US Common Core',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Create test_results table
    await db.sql`
      CREATE TABLE IF NOT EXISTS test_results (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id),
        grade         VARCHAR(50) NOT NULL,
        score         INTEGER NOT NULL,
        max_score     INTEGER NOT NULL,
        iq_score      INTEGER NOT NULL,
        percentile    INTEGER NOT NULL,
        total_time    INTEGER NOT NULL,
        test_data     JSONB,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    return NextResponse.json({ message: 'Database tables created successfully.' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'Failed to set up database', details: String(error) },
      { status: 500 }
    );
  }
}
