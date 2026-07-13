/**
 * Client-side storage layer for MathsLove.
 * Uses localStorage for persistence (survives tab/browser close).
 * Cookies are set for cross-tab sync and future server-side access.
 * 
 * When login is added later, this module will sync with a remote DB.
 */

import { TestResult } from './types';

// ── Storage Keys ──────────────────────────────────────────────────

const KEYS = {
  USER_PROFILE: 'ml_user_profile',
  TEST_HISTORY: 'ml_test_history',
  CURRENT_TEST: 'ml_current_test',
  SESSION_ID: 'ml_session_id',
} as const;

// ── Types ─────────────────────────────────────────────────────────

export interface UserProfile {
  parentName: string;
  studentName: string;
  email: string;
  location: string;
  board: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestHistoryEntry {
  id: string;
  grade: string;
  score: number;
  maxScore: number;
  iqScore: number;
  percentile: number;
  totalTime: number;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Set a cookie with SameSite=Strict and optional max-age.
 * Used to make the session ID available for future server-side access.
 */
function setCookie(name: string, value: string, days = 365): void {
  if (!isClient()) return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Strict`;
}

function getCookie(name: string): string | null {
  if (!isClient()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Session ───────────────────────────────────────────────────────

/** Get or create a persistent anonymous session ID (stored in both localStorage + cookie). */
export function getSessionId(): string {
  if (!isClient()) return '';

  let sessionId = localStorage.getItem(KEYS.SESSION_ID) || getCookie(KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateId();
    localStorage.setItem(KEYS.SESSION_ID, sessionId);
  }
  // Always sync to cookie so it's accessible server-side later
  setCookie(KEYS.SESSION_ID, sessionId);
  return sessionId;
}

// ── User Profile ──────────────────────────────────────────────────

export function saveUserProfile(data: Omit<UserProfile, 'createdAt' | 'updatedAt'>): UserProfile {
  if (!isClient()) throw new Error('Cannot save profile on server');

  const existing = getUserProfile();
  const now = new Date().toISOString();

  const profile: UserProfile = {
    ...data,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));

  // Store email in a cookie for future server-side identification
  setCookie('ml_email', data.email);

  return profile;
}

export function getUserProfile(): UserProfile | null {
  if (!isClient()) return null;
  const raw = localStorage.getItem(KEYS.USER_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

// ── Current Test Result ───────────────────────────────────────────
// Replaces sessionStorage — survives tab close

export function saveCurrentTest(result: TestResult): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.CURRENT_TEST, JSON.stringify(result));
}

export function getCurrentTest(): TestResult | null {
  if (!isClient()) return null;
  const raw = localStorage.getItem(KEYS.CURRENT_TEST);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestResult;
  } catch {
    return null;
  }
}

export function clearCurrentTest(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEYS.CURRENT_TEST);
}

// ── Test History ──────────────────────────────────────────────────

export function addTestToHistory(result: TestResult): TestHistoryEntry {
  if (!isClient()) throw new Error('Cannot save history on server');

  const entry: TestHistoryEntry = {
    id: generateId(),
    grade: result.grade,
    score: result.score,
    maxScore: result.maxScore,
    iqScore: result.iqScore,
    percentile: result.percentile,
    totalTime: result.totalTime,
    timestamp: result.timestamp,
  };

  const history = getTestHistory();
  history.unshift(entry); // newest first

  // Keep max 50 entries to avoid localStorage bloat
  const trimmed = history.slice(0, 50);
  localStorage.setItem(KEYS.TEST_HISTORY, JSON.stringify(trimmed));

  return entry;
}

export function getTestHistory(): TestHistoryEntry[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(KEYS.TEST_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TestHistoryEntry[];
  } catch {
    return [];
  }
}

// ── Clear All Data ────────────────────────────────────────────────

export function clearAllData(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
