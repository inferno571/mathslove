'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db';
import { createSession, deleteSession } from '../lib/session';
import { sendOTPEmail } from '../lib/email';

export type ActionState = {
  error?: string;
  success?: boolean;
  otpRequired?: boolean;
  email?: string;
  message?: string;
};

// Generate a cryptographically random 6-digit OTP
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

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

    // Send OTP for email verification (do NOT create session yet)
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    // Try to send OTP email - don't fail signup if email sending fails
    let emailError: string | null = null;
    try {
      await sendOTPEmail(email, code);
    } catch (emailErr: any) {
      console.error('Failed to send OTP email during signup:', emailErr);
      emailError = emailErr.message || 'Failed to send verification email';
    }

    return {
      otpRequired: true,
      email,
      message: emailError 
        ? `Account created, but we couldn't send the verification email: ${emailError}. Please use "Resend code" to try again.`
        : 'Account created! Please verify your email with the code we sent.',
    };
    
  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: `Signup failed: ${error.message || String(error)}` };
  }
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

    // Password verified — now send OTP for second factor
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate any existing unused OTPs for this user
    await db.sql`
      UPDATE otp_codes SET used = TRUE 
      WHERE email = ${email} AND used = FALSE
    `;

    // Insert new OTP
    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    // Send OTP email
    let emailError: string | null = null;
    try {
      await sendOTPEmail(email, code);
    } catch (emailErr: any) {
      console.error('Failed to send OTP email during login:', emailErr);
      emailError = emailErr.message || 'Failed to send verification email';
    }

    return { 
      otpRequired: true, 
      email,
      message: emailError
        ? `Couldn't send verification email: ${emailError}. Please use "Resend code" to try again.`
        : 'Verification code sent to your email.'
    };
    
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: `Login failed: ${error.message || String(error)}` };
  }
}

export async function verifyOTP(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;

  if (!email || !code) {
    return { error: 'Please enter the verification code.', otpRequired: true, email };
  }

  if (code.length !== 6) {
    return { error: 'Please enter the complete 6-digit code.', otpRequired: true, email };
  }

  try {
    const db = getDb();

    // Find valid OTP
    const result = await db.sql`
      SELECT oc.id, oc.user_id, oc.expires_at 
      FROM otp_codes oc
      WHERE oc.email = ${email} 
        AND oc.code = ${code} 
        AND oc.used = FALSE
      ORDER BY oc.created_at DESC
      LIMIT 1
    `;

    const otpRecord = result.rows[0];

    if (!otpRecord) {
      return { error: 'Invalid verification code. Please try again.', otpRequired: true, email };
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Mark as used so it can't be retried
      await db.sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otpRecord.id}`;
      return { error: 'Verification code has expired. Please request a new one.', otpRequired: true, email };
    }

    // Mark OTP as used
    await db.sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otpRecord.id}`;

    // Create session
    await createSession(otpRecord.user_id);

  } catch (error: any) {
    console.error('OTP verification error:', error);
    return { error: `Server error: ${error.message || String(error)}`, otpRequired: true, email };
  }

  redirect('/results');
}

export async function resendOTP(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.', otpRequired: true, email };
  }

  try {
    const db = getDb();

    // Verify user exists
    const userResult = await db.sql`SELECT id FROM users WHERE email = ${email}`;
    const user = userResult.rows[0];

    if (!user) {
      return { error: 'No account found with this email.', otpRequired: true, email };
    }

    // Rate limit: check if an OTP was sent in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const recentOTP = await db.sql`
      SELECT id FROM otp_codes 
      WHERE email = ${email} 
        AND created_at > ${thirtySecondsAgo}
      LIMIT 1
    `;

    if (recentOTP.rowCount && recentOTP.rowCount > 0) {
      return { 
        error: 'Please wait before requesting a new code.', 
        otpRequired: true, 
        email 
      };
    }

    // Invalidate old OTPs
    await db.sql`
      UPDATE otp_codes SET used = TRUE 
      WHERE email = ${email} AND used = FALSE
    `;

    // Generate and save new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    // Send email
    await sendOTPEmail(email, code);

    return { 
      otpRequired: true, 
      email, 
      message: 'A new verification code has been sent.',
      success: true
    };

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return { error: `Server error: ${error.message || String(error)}`, otpRequired: true, email };
  }
}

export async function logout() {
  await deleteSession();
  redirect('/');
}
