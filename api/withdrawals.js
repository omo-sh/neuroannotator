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

  try {
    // 1. REQUEST WITHDRAWAL (Worker)
    if (req.method === 'POST') {
      const { 
        userId, 
        username, 
        amountKes, 
        payoutMethod, 
        accountDetails, 
        batchDate 
      } = req.body || {};

      if (!userId || !amountKes || !payoutMethod || !accountDetails) {
        return res.status(400).json({ error: 'Missing required withdrawal details.' });
      }

      if (amountKes < 25000) {
        return res.status(400).json({ error: 'Minimum payout disbursement threshold is 25,000 KES.' });
      }

      // Check current user available balance
      const userRes = await client.execute({
        sql: `SELECT balance_available FROM neuro_users WHERE id = ?`,
        args: [userId]
      });

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const available = Number(userRes.rows[0].balance_available) || 0;
      if (available < amountKes) {
        return res.status(400).json({ error: 'Insufficient available balance.' });
      }

      // Deduct balance and insert withdrawal record
      await client.execute({
        sql: `UPDATE neuro_users SET balance_available = balance_available - ? WHERE id = ?`,
        args: [amountKes, userId]
      });

      await client.execute({
        sql: `INSERT INTO neuro_withdrawals (
          user_id, username, amount_kes, payout_method, account_details, status, batch_date
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        args: [
          userId, 
          username || 'worker', 
          amountKes, 
          payoutMethod, 
          accountDetails, 
          batchDate || 'Upcoming Friday'
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Withdrawal requested and queued for batch disbursement.'
      });
    }

    // 2. LIST WITHDRAWALS (Worker or Admin)
    if (req.method === 'GET') {
      const { userId } = req.query || {};

      let query = `SELECT * FROM neuro_withdrawals ORDER BY id DESC`;
      let args = [];

      if (userId) {
        query = `SELECT * FROM neuro_withdrawals WHERE user_id = ? ORDER BY id DESC`;
        args = [userId];
      }

      const results = await client.execute({ sql: query, args });

      const withdrawals = results.rows.map(w => ({
        id: Number(w.id),
        userId: String(w.user_id),
        username: String(w.username || ''),
        amount: Number(w.amount_kes),
        method: String(w.payout_method),
        accountDetails: String(w.account_details),
        status: String(w.status),
        batchDisbursementDate: String(w.batch_date || ''),
        adminNotes: w.admin_notes ? String(w.admin_notes) : null,
        createdAt: w.created_at
      }));

      return res.status(200).json(withdrawals);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('Withdrawals API error:', err);
    return res.status(500).json({ error: err.message || 'Withdrawal operation failed.' });
  }
}
