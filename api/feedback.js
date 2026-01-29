import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { name, message } = req.body || {};

    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required' });
    }

    try {
      await sql`
        INSERT INTO feedback (name, message, created_at)
        VALUES (${name}, ${message}, NOW())
      `;

      return res.json({ message: 'Feedback saved successfully!' });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save feedback', error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT id, name, message, created_at
        FROM feedback
        ORDER BY id DESC
      `;

      return res.json({ data: result.rows });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      await sql`
        DELETE FROM feedback
        WHERE id = ${id}
      `;

      return res.json({ message: 'Feedback deleted successfully!' });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to delete feedback', error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
