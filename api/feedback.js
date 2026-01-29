import axios from 'axios';
import https from 'https';

// SQLiteCloud connection
const SQLITECLOUD_URL = process.env.SQLITECLOUD_CONNECTION_STRING;
if (!SQLITECLOUD_URL) {
  throw new Error('SQLITECLOUD_CONNECTION_STRING environment variable is not set');
}

// Parse connection string
const parsedUrl = new URL(SQLITECLOUD_URL);
const apiKey = parsedUrl.searchParams.get('apikey');

// SQLiteCloud REST API base URL
const SQLITECLOUD_API = `https://${parsedUrl.hostname}:${parsedUrl.port || 8860}`;

// Create HTTPS agent
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Helper to execute queries
async function queryDB(sql) {
  try {
    const response = await axios.post(
      `${SQLITECLOUD_API}/`,
      { sql },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        httpAgent: false,
        httpsAgent: httpsAgent,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Database error:', error.response?.data || error.message);
    throw error;
  }
}

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
      await queryDB(
        `INSERT INTO feedback (name, message, created_at) VALUES ('${name}', '${message}', '${new Date().toISOString()}')`
      );

      return res.json({ message: 'Feedback saved successfully!' });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save feedback', error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await queryDB(
        'SELECT id, name, message, created_at FROM feedback ORDER BY id DESC'
      );

      return res.json({ data: result });
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
      await queryDB(`DELETE FROM feedback WHERE id = ${id}`);

      return res.json({ message: 'Feedback deleted successfully!' });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to delete feedback', error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
