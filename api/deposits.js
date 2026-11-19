import { getTursoClient, ensureNeuroSchema } from './turso.js';
import { initiateStkPush } from './daraja.js';

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
    // TRIGGER M-PESA STK PUSH (Daraja Online Prompt)
    if (action === 'mpesa_stk_push' && req.method === 'POST') {
      const { userId, phone, amountKes = 5000, username } = req.body || {};

      if (!phone) {
        return res.status(400).json({ error: 'Valid M-Pesa phone number is required.' });
      }

      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const stkAmount = Math.max(1, Math.round(Number(amountKes) || 5000));

      try {
        const stkRes = await initiateStkPush({
          phone,
          amount: stkAmount,
          accountReference: 'NEUROANN',
          transactionDesc: 'SecurityDeposit',
          host
        });

        // Record in deposits table as pending M-Pesa transaction
        await client.execute({
          sql: `INSERT INTO neuro_deposits (
            user_id, username, network, deposit_address, amount_kes, amount_usdt, tx_hash, status, admin_notes
          ) VALUES (?, ?, 'M-Pesa Express', ?, ?, ?, ?, 'stk_sent', ?)`,
          args: [
            userId || 'guest_worker',
            username || 'worker',
            phone,
            stkAmount,
            Math.round((stkAmount / 130) * 10) / 10,
            stkRes.CheckoutRequestID || 'PENDING_PROMPT',
            'STK Push dispatched to customer handset'
          ]
        });

        return res.status(200).json({
          success: true,
          message: 'M-Pesa STK prompt sent! Check your phone and enter your PIN.',
          stkResponse: stkRes
        });
      } catch (stkErr) {
        console.error('Daraja error in deposits.js:', stkErr);
        return res.status(500).json({ error: stkErr.message || 'Failed to dispatch M-Pesa prompt.' });
      }
    }

    // SUBMIT NEW CRYPTO OR M-PESA MANUAL DEPOSIT (Worker initiates)
    if (req.method === 'POST') {
      const { 
        userId, 
        username, 
        email, 
        network, 
        depositAddress, 
        amountKes = 5000, 
        amountUsdt = 38.5, 
        txHash 
      } = req.body || {};

      if (!userId || !network || !txHash) {
        return res.status(400).json({ error: 'Missing required deposit fields (userId, network, txHash).' });
      }

      const insertRes = await client.execute({
        sql: `INSERT INTO neuro_deposits (
          user_id, username, email, network, deposit_address, amount_kes, amount_usdt, tx_hash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        args: [
          userId, 
          username || 'worker', 
          email || '', 
          network, 
          depositAddress || '', 
          amountKes, 
          amountUsdt, 
          txHash.trim()
        ]
      });

      return res.status(200).json({
        success: true,
        depositId: Number(insertRes.lastInsertRowid),
        message: 'Deposit transaction submitted for on-chain verification.'
      });
    }

    // LIST DEPOSITS (Worker history or Admin view)
    if (req.method === 'GET') {
      const { userId } = req.query || {};

      let query = `SELECT * FROM neuro_deposits ORDER BY id DESC`;
      let args = [];

      if (userId) {
        query = `SELECT * FROM neuro_deposits WHERE user_id = ? ORDER BY id DESC`;
        args = [userId];
      }

      const results = await client.execute({ sql: query, args });

      const deposits = results.rows.map(r => ({
        id: Number(r.id),
        userId: String(r.user_id),
        username: String(r.username || ''),
        email: String(r.email || ''),
        network: String(r.network),
        depositAddress: String(r.deposit_address),
        amountKes: Number(r.amount_kes),
        amountUsdt: Number(r.amount_usdt),
        txHash: String(r.tx_hash),
        status: String(r.status),
        adminNotes: r.admin_notes ? String(r.admin_notes) : null,
        createdAt: r.created_at
      }));

      return res.status(200).json(deposits);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('Deposits API error:', err);
    return res.status(500).json({ error: err.message || 'Deposit operation failed.' });
  }
}
