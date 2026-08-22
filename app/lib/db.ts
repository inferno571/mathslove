import 'server-only';
import { createPool } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export type QueryResultRow = Record<string, any>;

export interface SqlQueryResult<T = QueryResultRow> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  sql: <T = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => Promise<SqlQueryResult<T>>;
}

let client: DbClient | null = null;

// ── Local File-Based DB Engine (Fallback for Local Dev) ────────────

interface LocalDbSchema {
  users: Array<{
    id: number;
    parent_name: string;
    student_name: string;
    email: string;
    password_hash: string;
    location: string;
    board: string;
    created_at: string;
    updated_at: string;
  }>;
  test_results: Array<{
    id: number;
    user_id: number;
    grade: string;
    score: number;
    max_score: number;
    iq_score: number;
    percentile: number;
    total_time: number;
    test_data: any;
    created_at: string;
  }>;
  otp_codes: Array<{
    id: number;
    user_id: number;
    email: string;
    code: string;
    expires_at: string;
    used: boolean;
    created_at: string;
  }>;
  counters: {
    users: number;
    test_results: number;
    otp_codes: number;
  };
}

function getLocalDbFile(): string {
  return path.resolve(process.cwd(), 'mathiq-local.json');
}

function loadLocalDb(): LocalDbSchema {
  const filePath = getLocalDbFile();
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading local db file, re-initializing:', e);
    }
  }
  const initial: LocalDbSchema = {
    users: [],
    test_results: [],
    otp_codes: [],
    counters: { users: 0, test_results: 0, otp_codes: 0 },
  };
  saveLocalDb(initial);
  return initial;
}

function saveLocalDb(data: LocalDbSchema): void {
  const filePath = getLocalDbFile();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local db file:', e);
  }
}

function createLocalDbClient(): DbClient {
  return {
    async sql<T = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<SqlQueryResult<T>> {
      const query = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ''), '').trim();
      const db = loadLocalDb();
      const now = new Date().toISOString();

      // ── DDL Queries ───────────────────────────────────────────────
      if (/^\s*CREATE\s+(TABLE|INDEX)/i.test(query)) {
        // Tables and indexes are inherently managed in local schema
        return { rows: [] as T[], rowCount: 0 };
      }

      // ── Users Queries ─────────────────────────────────────────────
      // Check existing email: SELECT id FROM users WHERE email = $1
      if (/SELECT\s+id\s+FROM\s+users\s+WHERE\s+email\s*=/i.test(query)) {
        const email = values[0];
        const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
        const rows = user ? [{ id: user.id }] : [];
        return { rows: rows as T[], rowCount: rows.length };
      }

      // Login user query: SELECT id, password_hash FROM users WHERE email = $1
      if (/SELECT\s+id,\s*password_hash\s+FROM\s+users\s+WHERE\s+email\s*=/i.test(query)) {
        const email = values[0];
        const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
        const rows = user ? [{ id: user.id, password_hash: user.password_hash }] : [];
        return { rows: rows as T[], rowCount: rows.length };
      }

      // Signup insert: INSERT INTO users ... RETURNING id
      if (/INSERT\s+INTO\s+users/i.test(query)) {
        const [parent_name, student_name, email, password_hash, location, board] = values;
        db.counters.users += 1;
        const newId = db.counters.users;
        const newUser = {
          id: newId,
          parent_name: String(parent_name || ''),
          student_name: String(student_name || ''),
          email: String(email || '').toLowerCase(),
          password_hash: String(password_hash || ''),
          location: String(location || ''),
          board: String(board || 'US Common Core'),
          created_at: now,
          updated_at: now,
        };
        db.users.push(newUser);
        saveLocalDb(db);
        return { rows: [{ id: newId }] as T[], rowCount: 1 };
      }

      // ── OTP Queries ───────────────────────────────────────────────
      // Invalidate old OTPs: UPDATE otp_codes SET used = TRUE WHERE email = $1 AND used = FALSE
      if (/UPDATE\s+otp_codes\s+SET\s+used\s*=\s*(TRUE|1)\s+WHERE\s+email\s*=/i.test(query)) {
        const email = values[0];
        let changes = 0;
        db.otp_codes.forEach(otp => {
          if (otp.email.toLowerCase() === String(email).toLowerCase() && !otp.used) {
            otp.used = true;
            changes++;
          }
        });
        if (changes > 0) saveLocalDb(db);
        return { rows: [] as T[], rowCount: changes };
      }

      // Mark single OTP used: UPDATE otp_codes SET used = TRUE WHERE id = $1
      if (/UPDATE\s+otp_codes\s+SET\s+used\s*=\s*(TRUE|1)\s+WHERE\s+id\s*=/i.test(query)) {
        const id = Number(values[0]);
        const otp = db.otp_codes.find(o => o.id === id);
        if (otp) {
          otp.used = true;
          saveLocalDb(db);
          return { rows: [] as T[], rowCount: 1 };
        }
        return { rows: [] as T[], rowCount: 0 };
      }

      // Insert new OTP: INSERT INTO otp_codes (user_id, email, code, expires_at) VALUES ($1, $2, $3, $4)
      if (/INSERT\s+INTO\s+otp_codes/i.test(query)) {
        const [user_id, email, code, expires_at] = values;
        db.counters.otp_codes += 1;
        const newId = db.counters.otp_codes;
        db.otp_codes.push({
          id: newId,
          user_id: Number(user_id),
          email: String(email).toLowerCase(),
          code: String(code),
          expires_at: String(expires_at),
          used: false,
          created_at: now,
        });
        saveLocalDb(db);
        return { rows: [{ id: newId }] as T[], rowCount: 1 };
      }

      // Find valid OTP: SELECT oc.id, oc.user_id, oc.expires_at FROM otp_codes ...
      if (/SELECT[\s\S]+FROM\s+otp_codes[\s\S]+WHERE[\s\S]+email[\s\S]+code/i.test(query)) {
        const email = values[0];
        const code = values[1];
        const match = db.otp_codes
          .filter(o => o.email.toLowerCase() === String(email).toLowerCase() && o.code === String(code) && !o.used)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        const rows = match ? [{ id: match.id, user_id: match.user_id, expires_at: match.expires_at }] : [];
        return { rows: rows as T[], rowCount: rows.length };
      }

      // Rate limit check: SELECT id FROM otp_codes WHERE email = $1 AND created_at > $2
      if (/SELECT\s+id\s+FROM\s+otp_codes[\s\S]+WHERE[\s\S]+email[\s\S]+created_at/i.test(query)) {
        const email = values[0];
        const threshold = new Date(values[1]).getTime();
        const recent = db.otp_codes.find(
          o => o.email.toLowerCase() === String(email).toLowerCase() && new Date(o.created_at).getTime() > threshold
        );
        const rows = recent ? [{ id: recent.id }] : [];
        return { rows: rows as T[], rowCount: rows.length };
      }

      // ── Test Results Queries ──────────────────────────────────────
      // Insert test result
      if (/INSERT\s+INTO\s+test_results/i.test(query)) {
        const [user_id, grade, score, max_score, iq_score, percentile, total_time, test_data] = values;
        db.counters.test_results += 1;
        const newId = db.counters.test_results;
        db.test_results.push({
          id: newId,
          user_id: Number(user_id),
          grade: String(grade),
          score: Number(score),
          max_score: Number(max_score),
          iq_score: Number(iq_score),
          percentile: Number(percentile),
          total_time: Number(total_time),
          test_data: typeof test_data === 'string' ? JSON.parse(test_data) : test_data,
          created_at: now,
        });
        saveLocalDb(db);
        return { rows: [{ id: newId }] as T[], rowCount: 1 };
      }

      // ── DELETE Queries ──────────────────────────────────────────
      // Delete OTP codes by user_id: DELETE FROM otp_codes WHERE user_id = $1
      if (/DELETE\s+FROM\s+otp_codes\s+WHERE\s+user_id\s*=/i.test(query)) {
        const userId = Number(values[0]);
        const before = db.otp_codes.length;
        db.otp_codes = db.otp_codes.filter(o => o.user_id !== userId);
        const deleted = before - db.otp_codes.length;
        if (deleted > 0) saveLocalDb(db);
        return { rows: [] as T[], rowCount: deleted };
      }

      // Delete user by id: DELETE FROM users WHERE id = $1
      if (/DELETE\s+FROM\s+users\s+WHERE\s+id\s*=/i.test(query)) {
        const id = Number(values[0]);
        const before = db.users.length;
        db.users = db.users.filter(u => u.id !== id);
        const deleted = before - db.users.length;
        if (deleted > 0) saveLocalDb(db);
        return { rows: [] as T[], rowCount: deleted };
      }

      // Truncate / delete all from a table: TRUNCATE TABLE x or DELETE FROM x (no WHERE)
      if (/(?:TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM\s+)(\w+)\s*$/i.test(query)) {
        const tableMatch = query.match(/(?:TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM\s+)(\w+)\s*$/i);
        if (tableMatch) {
          const table = tableMatch[1].toLowerCase();
          if (table === 'users') { const c = db.users.length; db.users = []; saveLocalDb(db); return { rows: [] as T[], rowCount: c }; }
          if (table === 'otp_codes') { const c = db.otp_codes.length; db.otp_codes = []; saveLocalDb(db); return { rows: [] as T[], rowCount: c }; }
          if (table === 'test_results') { const c = db.test_results.length; db.test_results = []; saveLocalDb(db); return { rows: [] as T[], rowCount: c }; }
        }
        return { rows: [] as T[], rowCount: 0 };
      }

      console.warn('Unhandled local SQL query:', query, values);
      return { rows: [] as T[], rowCount: 0 };
    },
  };
}

export function getDb(): DbClient {
  if (!client) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL;
    if (connectionString) {
      const pool = createPool({ connectionString });
      client = {
        sql: async <T = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]) => {
          const result = await pool.sql(strings, ...values);
          return {
            rows: result.rows as T[],
            rowCount: result.rowCount ?? result.rows.length,
          };
        },
      };
    } else {
      client = createLocalDbClient();
    }
  }
  return client;
}
