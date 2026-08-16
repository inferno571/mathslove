'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db';
import { createSession, deleteSession } from '../lib/session';

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parentName = formData.get('parentName') as string;
  const studentName = formData.get('studentName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const location = (formData.get('location') as string) || '';
  const board = (formData.get('board') as string) || 'US Common Core';

  if (!parentName || !studentName || !email || !password) {
    return { error: 'Please fill out all required fields.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    const db = getDb();
    
    // Check if email already exists
    const existingUser = await db.sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return { error: 'An account with this email already exists.' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.sql`
      INSERT INTO users (parent_name, student_name, email, password_hash, location, board)
      VALUES (${parentName}, ${studentName}, ${email}, ${passwordHash}, ${location}, ${board})
      RETURNING id
    `;
    
    const user = result.rows[0];
    if (!user) {
      return { error: 'Failed to create user account.' };
    }

    // Create session
    await createSession(user.id);
    
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred during signup.' };
  }

  // Redirect to results (since signup happens after taking the test usually)
  // or dashboard if implemented
  redirect('/results');
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  try {
    const db = getDb();
    
    // Find user
    const result = await db.sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordsMatch) {
      return { error: 'Invalid email or password.' };
    }

    // Create session
    await createSession(user.id);
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred during login.' };
  }

  redirect('/results');
}

export async function logout() {
  await deleteSession();
  redirect('/');
}
