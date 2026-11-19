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
    const { action } = req.query || {};

    // 1. GET FULL ADMIN SYSTEM METRICS
    if (action === 'overview' && req.method === 'GET') {
      const users = await client.execute(`SELECT * FROM neuro_users ORDER BY created_at DESC`);
      const deposits = await client.execute(`SELECT * FROM neuro_deposits ORDER BY id DESC`);
      const withdrawals = await client.execute(`SELECT * FROM neuro_withdrawals ORDER BY id DESC`);
      const submissions = await client.execute(`SELECT * FROM neuro_submissions ORDER BY id DESC LIMIT 100`);

      const totalWorkers = users.rows.filter(u => u.role !== 'super_admin').length;
      const totalDepositsKes = deposits.rows
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + (Number(d.amount_kes) || 0), 0);
      const pendingDepositsCount = deposits.rows.filter(d => d.status === 'pending').length;
      const pendingWithdrawalsCount = withdrawals.rows.filter(w => w.status === 'pending').length;

      // Fetch platform settings
      const settingsRes = await client.execute(`SELECT * FROM neuro_settings`);
      const settings = {};
      settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

      return res.status(200).json({
        metrics: {
          totalWorkers,
          totalDepositsKes,
          pendingDepositsCount,
          pendingWithdrawalsCount,
          totalSubmissions: submissions.rows.length,
          activationDepositKes: Number(settings.activation_deposit_kes || 5000)
        },
        settings,
        users: users.rows.map(u => ({
          id: String(u.id),
          email: String(u.email),
          username: String(u.username),
          role: String(u.role),
          is_task_unlocked: Boolean(u.is_task_unlocked),
          balance_available: Number(u.balance_available),
          balance_in_review: Number(u.balance_in_review),
          completed_tasks_count: Number(u.completed_tasks_count),
          referral_code: u.referral_code,
          exam_status: String(u.exam_status || 'pending'),
          exam_score: Number(u.exam_score || 0),
          admin_verified: Boolean(u.admin_verified),
          created_at: u.created_at
        })),
        deposits: deposits.rows.map(d => ({
          id: Number(d.id),
          userId: String(d.user_id),
          username: String(d.username || ''),
          email: String(d.email || ''),
          network: String(d.network),
          depositAddress: String(d.deposit_address),
          amountKes: Number(d.amount_kes),
          amountUsdt: Number(d.amount_usdt),
          txHash: String(d.tx_hash),
          status: String(d.status),
          adminNotes: d.admin_notes,
          createdAt: d.created_at
        })),
        withdrawals: withdrawals.rows.map(w => ({
          id: Number(w.id),
          userId: String(w.user_id),
          username: String(w.username || ''),
          amount: Number(w.amount_kes),
          method: String(w.payout_method),
          accountDetails: String(w.account_details),
          status: String(w.status),
          batchDate: String(w.batch_date),
          adminNotes: w.admin_notes,
          createdAt: w.created_at
        })),
        submissions: submissions.rows
      });
    }

    // 2. APPROVE OR REJECT CRYPTO DEPOSIT
    if (action === 'update_deposit' && req.method === 'POST') {
      const { depositId, status, notes } = req.body || {};
      if (!depositId || !status) {
        return res.status(400).json({ error: 'Missing depositId or status.' });
      }

      const depRes = await client.execute({
        sql: `SELECT * FROM neuro_deposits WHERE id = ?`,
        args: [depositId]
      });

      if (depRes.rows.length === 0) return res.status(404).json({ error: 'Deposit not found.' });
      const deposit = depRes.rows[0];

      await client.execute({
        sql: `UPDATE neuro_deposits SET status = ?, admin_notes = ? WHERE id = ?`,
        args: [status, notes || null, depositId]
      });

      // If approved, automatically unlock task access for worker and grant welcome bonus / initial balance
      if (status === 'approved') {
        await client.execute({
          sql: `UPDATE neuro_users 
                SET is_task_unlocked = 1,
                    balance_available = balance_available + ? 
                WHERE id = ?`,
          args: [deposit.amount_kes || 5000, deposit.user_id]
        });
      }

      return res.status(200).json({ success: true, message: `Deposit marked as ${status}.` });
    }

    // 3. TOGGLE WORKER TASK ACCESS MANUALLY
    if (action === 'toggle_user_access' && req.method === 'POST') {
      const { userId, isUnlocked } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId.' });

      await client.execute({
        sql: `UPDATE neuro_users SET is_task_unlocked = ? WHERE id = ?`,
        args: [isUnlocked ? 1 : 0, userId]
      });

      return res.status(200).json({ success: true, is_task_unlocked: isUnlocked });
    }

    // 4. VERIFY WORKER ACCOUNT (Super Admin verifies after accuracy exam)
    if (action === 'verify_worker' && req.method === 'POST') {
      const { userId, isVerified, notes } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId.' });

      await client.execute({
        sql: `UPDATE neuro_users SET 
          admin_verified = ?, 
          exam_status = CASE WHEN ? = 1 THEN 'passed' ELSE 'failed' END
        WHERE id = ?`,
        args: [isVerified ? 1 : 0, isVerified ? 1 : 0, userId]
      });

      return res.status(200).json({ success: true, message: `Worker verification status updated.` });
    }

    // 5. UPDATE SYSTEM SETTINGS (Super Admin raises or lowers deposit amount)
    if (action === 'update_settings' && req.method === 'POST') {
      const { depositKes } = req.body || {};
      const numericDeposit = Math.max(100, Math.round(Number(depositKes) || 5000));
      const numericUsdt = Math.round((numericDeposit / 130) * 10) / 10;

      await client.execute({
        sql: `INSERT OR REPLACE INTO neuro_settings (key, value) VALUES ('activation_deposit_kes', ?)`,
        args: [String(numericDeposit)]
      });

      await client.execute({
        sql: `INSERT OR REPLACE INTO neuro_settings (key, value) VALUES ('activation_deposit_usdt', ?)`,
        args: [String(numericUsdt)]
      });

      return res.status(200).json({
        success: true,
        message: `Security deposit amount updated to KSh ${numericDeposit.toLocaleString()} (~${numericUsdt} USDT).`,
        activationDepositKes: numericDeposit,
        activationDepositUsdt: numericUsdt
      });
    }

    // 4. UPDATE WITHDRAWAL STATUS (Approve / Reject)
    if (action === 'update_withdrawal' && req.method === 'POST') {
      const { withdrawalId, status, notes } = req.body || {};
      if (!withdrawalId || !status) {
        return res.status(400).json({ error: 'Missing withdrawalId or status.' });
      }

      const withRes = await client.execute({
        sql: `SELECT * FROM neuro_withdrawals WHERE id = ?`,
        args: [withdrawalId]
      });

      if (withRes.rows.length === 0) return res.status(404).json({ error: 'Withdrawal not found.' });
      const wRecord = withRes.rows[0];

      await client.execute({
        sql: `UPDATE neuro_withdrawals SET status = ?, admin_notes = ? WHERE id = ?`,
        args: [status, notes || null, withdrawalId]
      });

      // If rejected, refund the balance back to worker
      if (status === 'rejected') {
        await client.execute({
          sql: `UPDATE neuro_users SET balance_available = balance_available + ? WHERE id = ?`,
          args: [wRecord.amount_kes, wRecord.user_id]
        });
      }

      return res.status(200).json({ success: true, message: `Withdrawal marked as ${status}.` });
    }

    // 5. ADJUST WORKER BALANCE (Manual credit/debit)
    if (action === 'adjust_balance' && req.method === 'POST') {
      const { userId, deltaAvailableKes = 0, deltaReviewKes = 0 } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId.' });

      await client.execute({
        sql: `UPDATE neuro_users 
              SET balance_available = balance_available + ?,
                  balance_in_review = balance_in_review + ?
              WHERE id = ?`,
        args: [deltaAvailableKes, deltaReviewKes, userId]
      });

      return res.status(200).json({ success: true, message: 'User balance updated.' });
    }

    return res.status(400).json({ error: 'Invalid admin action.' });
  } catch (err) {
    console.error('Admin API error:', err);
    return res.status(500).json({ error: err.message || 'Admin operation failed.' });
  }
}
