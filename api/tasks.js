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

    // 1. SUBMIT BENCHMARK ACCURACY EXAM (10 Tasks, paid, measures accuracy)
    if (action === 'submit_exam' && req.method === 'POST') {
      const { userId, answers = [], totalEarnedKes = 850 } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId parameter.' });

      // Calculate accuracy against ground truth answers
      let correctCount = 0;
      answers.forEach(a => {
        if (a.selectedResponse === a.expectedBetter) {
          correctCount++;
        }
      });

      const totalTasks = answers.length || 10;
      const scorePercentage = Math.round((correctCount / totalTasks) * 100 * 10) / 10;
      const examStatus = 'submitted'; // Queued for Super Admin verification

      // Update user with exam score and credit earned exam payout to balance_in_review
      await client.execute({
        sql: `UPDATE neuro_users SET 
          exam_score = ?,
          exam_status = ?,
          accuracy_score = ?,
          completed_tasks_count = completed_tasks_count + ?,
          balance_in_review = balance_in_review + ?
        WHERE id = ?`,
        args: [scorePercentage, examStatus, scorePercentage, totalTasks, totalEarnedKes, userId]
      });

      // Save each task submission into neuro_submissions table
      for (const ans of answers) {
        await client.execute({
          sql: `INSERT INTO neuro_submissions (
            user_id, username, campaign_id, task_id, selected_response, rationale, earned_kes, status
          ) VALUES (?, 'worker', 'exam-accuracy-10', ?, ?, ?, ?, 'under_review')`,
          args: [userId, ans.taskId, ans.selectedResponse, ans.rationale || 'Benchmark Exam Evaluation', Math.round(totalEarnedKes / totalTasks)]
        });
      }

      return res.status(200).json({
        success: true,
        scorePercentage,
        correctCount,
        totalTasks,
        earnedKes: totalEarnedKes,
        examStatus,
        message: `Benchmark evaluation completed! Your accuracy score is ${scorePercentage}%. Submitted to Super Admin for verification.`
      });
    }

    // 2. SUBMIT REGULAR TASK EVALUATION
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
