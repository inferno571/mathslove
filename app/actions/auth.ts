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
  /** context for OTP: 'signup' | 'forgot_password' */
  otpContext?: 'signup' | 'forgot_password';
};

// ── CAPTCHA verification ──────────────────────────────────────────────
async function verifyCaptcha(token: string | null): Promise<boolean> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;

  // If no secret key configured, skip in development
  if (!secretKey) {
    console.warn('[captcha] HCAPTCHA_SECRET_KEY not set — skipping captcha verification in dev');
    return true;
  }

  // hCaptcha test secret always passes — good for local dev
  if (secretKey === '0x0000000000000000000000000000000000000000') {
    return true;
  }

  if (!token) return false;

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await response.json();
    if (!data.success) {
      console.warn('[captcha] hCaptcha verification failed:', data['error-codes']);
    }
    return data.success === true;
  } catch (err) {
    console.error('[captcha] Error calling hCaptcha API:', err);
    return false;
  }
}

// ── OTP generator ────────────────────────────────────────────────────
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

// ── signup ───────────────────────────────────────────────────────────
export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parentName = formData.get('parentName') as string;
  const studentName = formData.get('studentName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const mobile = (formData.get('mobile') as string) || '';
  const location = (formData.get('location') as string) || '';
  const board = (formData.get('board') as string) || 'US Common Core';
  const captchaToken = formData.get('h-captcha-response') as string | null;

  if (!parentName || !studentName || !email || !password) {
    return { error: 'Please fill out all required fields.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  // Verify captcha
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return { error: 'Please complete the CAPTCHA verification.' };
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

    // Insert user (email_verified starts as false; mobile stored but not verified)
    const result = await db.sql`
      INSERT INTO users (parent_name, student_name, email, password_hash, location, board, mobile)
      VALUES (${parentName}, ${studentName}, ${email}, ${passwordHash}, ${location}, ${board}, ${mobile})
      RETURNING id
    `;

    const user = result.rows[0];
    if (!user) {
      return { error: 'Failed to create user account.' };
    }

    // Send OTP for email verification
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    try {
      await sendOTPEmail(email, code, 'signup');
    } catch (emailErr: any) {
      console.error('Failed to send OTP email during signup, rolling back user:', emailErr);
      await db.sql`DELETE FROM otp_codes WHERE user_id = ${user.id}`;
      await db.sql`DELETE FROM users WHERE id = ${user.id}`;
      return { error: 'Could not send verification email. Please try again later.' };
    }

    return {
      otpRequired: true,
      otpContext: 'signup',
      email,
      message: 'Account created! Please verify your email with the code we sent.',
    };

  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred during signup. Please try again.' };
  }
}

// ── login ────────────────────────────────────────────────────────────
export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const captchaToken = formData.get('h-captcha-response') as string | null;

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  // Verify captcha
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return { error: 'Please complete the CAPTCHA verification.' };
  }

  try {
    const db = getDb();

    // Find user with email_verified status
    const result = await db.sql`SELECT id, password_hash, email_verified FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordsMatch) {
      return { error: 'Invalid email or password.' };
    }

    if (user.email_verified === false) {
      return { error: 'Please verify your email before logging in. Check your inbox for the verification code sent during signup.' };
    }

    await createSession(user.id);

  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred during login. Please try again.' };
  }

  redirect('/results');
}

// ── verifyOTP ─────────────────────────────────────────────────────────
export async function verifyOTP(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;
  const context = (formData.get('context') as 'signup' | 'forgot_password') || 'signup';

  if (!email || !code) {
    return { error: 'Please enter the verification code.', otpRequired: true, email, otpContext: context };
  }

  if (code.length !== 6) {
    return { error: 'Please enter the complete 6-digit code.', otpRequired: true, email, otpContext: context };
  }

  try {
    const db = getDb();

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
      return { error: 'Invalid verification code. Please try again.', otpRequired: true, email, otpContext: context };
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await db.sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otpRecord.id}`;
      return { error: 'Verification code has expired. Please request a new one.', otpRequired: true, email, otpContext: context };
    }

    await db.sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otpRecord.id}`;

    if (context === 'signup') {
      await db.sql`UPDATE users SET email_verified = TRUE WHERE id = ${otpRecord.user_id}`;
      await createSession(otpRecord.user_id);
    } else {
      return {
        success: true,
        email,
        otpContext: 'forgot_password',
        message: 'Code verified! Please set your new password.',
      };
    }

  } catch (error: any) {
    console.error('OTP verification error:', error);
    return { error: 'An unexpected error occurred. Please try again.', otpRequired: true, email, otpContext: context };
  }

  redirect('/results');
}

// ── resendOTP ─────────────────────────────────────────────────────────
export async function resendOTP(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const context = (formData.get('context') as 'signup' | 'forgot_password') || 'signup';

  if (!email) {
    return { error: 'Email is required.', otpRequired: true, email };
  }

  try {
    const db = getDb();

    const userResult = await db.sql`SELECT id FROM users WHERE email = ${email}`;
    const user = userResult.rows[0];

    if (!user) {
      return { error: 'No account found with this email.', otpRequired: true, email };
    }

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const recentOTP = await db.sql`
      SELECT id FROM otp_codes 
      WHERE email = ${email} 
        AND created_at > ${thirtySecondsAgo}
      LIMIT 1
    `;

    if (recentOTP.rowCount && recentOTP.rowCount > 0) {
      return { error: 'Please wait before requesting a new code.', otpRequired: true, email };
    }

    await db.sql`
      UPDATE otp_codes SET used = TRUE 
      WHERE email = ${email} AND used = FALSE
    `;

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    await sendOTPEmail(email, code, context);

    return {
      otpRequired: true,
      email,
      message: 'A new verification code has been sent.',
      success: true
    };

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return { error: 'Failed to resend verification code. Please try again.', otpRequired: true, email };
  }
}

// ── forgotPassword ────────────────────────────────────────────────────
export async function forgotPassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const captchaToken = formData.get('h-captcha-response') as string | null;

  if (!email) {
    return { error: 'Please enter your email address.' };
  }

  // Verify captcha
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return { error: 'Please complete the CAPTCHA verification.' };
  }

  try {
    const db = getDb();

    const userResult = await db.sql`SELECT id FROM users WHERE email = ${email}`;
    const user = userResult.rows[0];

    if (!user) {
      return { error: 'No account found with this email address.' };
    }

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const recentOTP = await db.sql`
      SELECT id FROM otp_codes 
      WHERE email = ${email} 
        AND created_at > ${thirtySecondsAgo}
      LIMIT 1
    `;

    if (recentOTP.rowCount && recentOTP.rowCount > 0) {
      return { error: 'Please wait 30 seconds before requesting another code.' };
    }

    await db.sql`
      UPDATE otp_codes SET used = TRUE 
      WHERE email = ${email} AND used = FALSE
    `;

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.sql`
      INSERT INTO otp_codes (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `;

    await sendOTPEmail(email, code, 'forgot_password');

    return {
      otpRequired: true,
      otpContext: 'forgot_password',
      email,
      message: 'A 6-digit code has been sent to your email.',
    };

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

// ── resetPassword ─────────────────────────────────────────────────────
export async function resetPassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !newPassword || !confirmPassword) {
    return { error: 'Please fill out all fields.', email };
  }

  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long.', email };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.', email };
  }

  try {
    const db = getDb();

    const userResult = await db.sql`SELECT id FROM users WHERE email = ${email}`;
    const user = userResult.rows[0];

    if (!user) {
      return { error: 'No account found with this email.' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user.id}`;
    await db.sql`UPDATE users SET email_verified = TRUE WHERE id = ${user.id}`;
    await createSession(user.id);

  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error: 'Failed to reset password. Please try again.', email };
  }

  redirect('/results');
}

// ── logout ────────────────────────────────────────────────────────────
export async function logout() {
  await deleteSession();
  redirect('/');
}
