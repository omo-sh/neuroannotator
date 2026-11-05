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
    // 1. SUBMIT TASK EVALUATION
    if (req.method === 'POST') {
      const { 
        userId, 
        username, 
        campaignId, 
        taskId, 
        selectedResponse, 
        rationale, 
        earnedKes = 85 
      } = req.body || {};

      if (!userId || !campaignId || !taskId || !selectedResponse) {
        return res.status(400).json({ error: 'Missing required task submission fields.' });
      }

      await client.execute({
        sql: `INSERT INTO neuro_submissions (
          user_id, username, campaign_id, task_id, selected_response, rationale, earned_kes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'under_review')`,
        args: [
          userId, 
          username || 'worker', 
          campaignId, 
          taskId, 
          selectedResponse, 
          rationale || '', 
          earnedKes
        ]
      });

      // Update worker's balance_in_review and completed task count
      await client.execute({
        sql: `UPDATE neuro_users 
              SET balance_in_review = balance_in_review + ?,
                  completed_tasks_count = completed_tasks_count + 1
              WHERE id = ?`,
        args: [earnedKes, userId]
      });

      return res.status(200).json({
        success: true,
        earnedKes,
        message: 'Task submitted successfully to QA validation queue.'
      });
    }

    // 2. LIST RECENT SUBMISSIONS FOR USER
    if (req.method === 'GET') {
      const { userId } = req.query || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId parameter.' });

      const submissions = await client.execute({
        sql: `SELECT * FROM neuro_submissions WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
        args: [userId]
      });

      return res.status(200).json(submissions.rows);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('Task API error:', err);
    return res.status(500).json({ error: err.message || 'Task operation failed.' });
  }
}
