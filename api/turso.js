import { createClient } from '@libsql/client';

let cachedClient = null;

export function getTursoClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.TURSO_DATABASE_URL || "libsql://database-coral-cushion-vercel-icfg-b29nydt13wfj6ohbaerzacxw.aws-us-east-1.turso.io";
  const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTM2ODk1NjksImlkIjoiMDFhMWEwM2EtYzcwMS03NTY2LWIwNmMtOTYxYjEyNmJmY2ZmIiwia2lkIjoiUktjWFRNVm02OHZraTE1RDkzb2N2QlZudEdxQXpGR29Ya1pKRFFrLXl6byIsInJpZCI6IjhiMzE1NTBiLTZhNWQtNDgzMS1iN2Y2LTM5YWM5Y2YzYjE2MyJ9.xwE_dVc7fqNSp4fCFGvT4-hk-zGZUVkoxVEQaaLHJcDe7fYL1yLXvUjyQCcq5LxyCe4P6CTP6MUep1cguwh6CQ";

  if (!url) return null;

  try {
    cachedClient = createClient({
      url,
      authToken
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Turso client:', err);
    return null;
  }
}

let schemaInitialized = false;

export async function ensureNeuroSchema() {
  if (schemaInitialized) return;
  const client = getTursoClient();
  if (!client) return;

  try {
    // 1. Users table (Workers & Admins)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS neuro_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'worker',
        is_task_unlocked INTEGER DEFAULT 0,
        balance_available INTEGER DEFAULT 0,
        balance_in_review INTEGER DEFAULT 0,
        completed_tasks_count INTEGER DEFAULT 0,
        accuracy_score REAL DEFAULT 98.5,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        phone TEXT,
        email_verified INTEGER DEFAULT 0,
        email_otp TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safe Alter Table for schema additions
    try {
      await client.execute(`ALTER TABLE neuro_users ADD COLUMN phone TEXT`);
    } catch (_) {}
    try {
      await client.execute(`ALTER TABLE neuro_users ADD COLUMN email_verified INTEGER DEFAULT 0`);
    } catch (_) {}
    try {
      await client.execute(`ALTER TABLE neuro_users ADD COLUMN email_otp TEXT`);
    } catch (_) {}

    // 2. Crypto Deposits table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS neuro_deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT,
        email TEXT,
        network TEXT NOT NULL,
        deposit_address TEXT NOT NULL,
        amount_kes INTEGER DEFAULT 5000,
        amount_usdt REAL DEFAULT 38.5,
        tx_hash TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Task Submissions table (RLHF Evaluations)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS neuro_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT,
        campaign_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        selected_response TEXT NOT NULL,
        rationale TEXT,
        earned_kes INTEGER DEFAULT 85,
        status TEXT DEFAULT 'under_review',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Withdrawals table (M-Pesa / Crypto Payouts)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS neuro_withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT,
        amount_kes INTEGER NOT NULL,
        payout_method TEXT NOT NULL,
        account_details TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        batch_date TEXT,
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure Default Super Admin 'admin'
    const adminCheck = await client.execute({
      sql: `SELECT id FROM neuro_users WHERE username = 'admin' OR role = 'super_admin'`,
      args: []
    });

    if (adminCheck.rows.length === 0) {
      await client.execute({
        sql: `INSERT INTO neuro_users (
          id, email, username, password, role, is_task_unlocked, balance_available, balance_in_review, referral_code
        ) VALUES (
          'admin-root-01', 'admin@neuroannotator.online', 'admin', 'Admin1234!', 'super_admin', 1, 50000, 0, 'VIP_LEADER'
        )`,
        args: []
      });
    }

    schemaInitialized = true;
  } catch (err) {
    console.error('Error ensuring NeuroAnnotator schema:', err);
  }
}
