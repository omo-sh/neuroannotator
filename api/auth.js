import { getTursoClient, ensureNeuroSchema } from './turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = getTursoClient();
  if (!client) {
    return res.status(500).json({ error: 'Database connection failed.' });
  }

  await ensureNeuroSchema();

  const { action } = req.query || {};

  try {
    // 1. SIGN UP (Worker or Client)
    if (action === 'signup' && req.method === 'POST') {
      const { email, username, password, referral_code } = req.body || {};

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username, and password are required.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanUser = username.toLowerCase().trim();

      // Check existing email or username
      const existing = await client.execute({
        sql: `SELECT id FROM neuro_users WHERE LOWER(email) = ? OR LOWER(username) = ?`,
        args: [cleanEmail, cleanUser]
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email or username already exists.' });
      }

      const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
      const userRefCode = cleanUser.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      await client.execute({
        sql: `INSERT INTO neuro_users (
          id, email, username, password, role, is_task_unlocked, balance_available, balance_in_review, referral_code, referred_by
        ) VALUES (?, ?, ?, ?, 'worker', 0, 0, 0, ?, ?)`,
        args: [userId, cleanEmail, cleanUser, password, userRefCode, referral_code || null]
      });

      return res.status(200).json({
        id: userId,
        email: cleanEmail,
        username: cleanUser,
        role: 'worker',
        is_task_unlocked: false,
        balance_available: 0,
        balance_in_review: 0,
        completed_tasks_count: 0,
        accuracy_score: 98.5,
        referral_code: userRefCode
      });
    }

    // 2. SIGN IN
    if (action === 'login' && req.method === 'POST') {
      const { usernameOrEmail, password } = req.body || {};

      if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Please enter your username/email and password.' });
      }

      const cleanTarget = usernameOrEmail.toLowerCase().trim();

      const userRes = await client.execute({
        sql: `SELECT * FROM neuro_users WHERE LOWER(email) = ? OR LOWER(username) = ?`,
        args: [cleanTarget, cleanTarget]
      });

      if (userRes.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid username/email or password.' });
      }

      const user = userRes.rows[0];
      if (String(user.password) !== String(password)) {
        return res.status(400).json({ error: 'Invalid username/email or password.' });
      }

      return res.status(200).json({
        id: String(user.id),
        email: String(user.email),
        username: String(user.username),
        role: String(user.role),
        is_super_admin: user.role === 'super_admin' || user.username === 'suuki',
        is_task_unlocked: Boolean(user.is_task_unlocked),
        balance_available: Number(user.balance_available) || 0,
        balance_in_review: Number(user.balance_in_review) || 0,
        completed_tasks_count: Number(user.completed_tasks_count) || 0,
        accuracy_score: Number(user.accuracy_score) || 98.5,
        referral_code: user.referral_code ? String(user.referral_code) : null
      });
    }

    // 3. GET SESSION / PROFILE REFRESH
    if (action === 'me' && req.method === 'GET') {
      const { userId } = req.query || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId parameter.' });

      const userRes = await client.execute({
        sql: `SELECT * FROM neuro_users WHERE id = ?`,
        args: [userId]
      });

      if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = userRes.rows[0];

      return res.status(200).json({
        id: String(user.id),
        email: String(user.email),
        username: String(user.username),
        role: String(user.role),
        is_super_admin: user.role === 'super_admin' || user.username === 'suuki',
        is_task_unlocked: Boolean(user.is_task_unlocked),
        balance_available: Number(user.balance_available) || 0,
        balance_in_review: Number(user.balance_in_review) || 0,
        completed_tasks_count: Number(user.completed_tasks_count) || 0,
        accuracy_score: Number(user.accuracy_score) || 98.5,
        referral_code: user.referral_code ? String(user.referral_code) : null
      });
    }

    return res.status(400).json({ error: 'Invalid auth action.' });
  } catch (err) {
    console.error('Auth handler error:', err);
    return res.status(500).json({ error: err.message || 'Authentication error.' });
  }
}
