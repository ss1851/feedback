const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// SQLiteCloud connection
const SQLITECLOUD_URL = process.env.SQLITECLOUD_CONNECTION_STRING;
if (!SQLITECLOUD_URL) {
  console.error("Error: SQLITECLOUD_CONNECTION_STRING environment variable is not set");
  process.exit(1);
}

console.log("Connecting to SQLiteCloud...");

// Parse SQLiteCloud connection string
const parsedUrl = new URL(SQLITECLOUD_URL);
const apiKey = parsedUrl.searchParams.get('apikey');
const dbPath = parsedUrl.pathname.substring(1); // Remove leading slash

// SQLiteCloud REST API base URL
const SQLITECLOUD_API = `https://${parsedUrl.hostname}:${parsedUrl.port || 8860}`;

// Helper to execute queries on SQLiteCloud
async function queryDB(sql) {
  try {
    const https = require('https');
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const response = await axios.post(
      `${SQLITECLOUD_API}/`,
      { sql },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        httpAgent: false,
        httpsAgent: agent,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Database error:', error.response?.data || error.message);
    throw error;
  }
}

// Create table if it doesn't exist
queryDB(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`)
  .then(() => console.log("✅ Connected to SQLiteCloud"))
  .catch(err => console.log("⚠️ Database warning:", err.message));

// ==============================
// POST: Save feedback
// ==============================
app.post("/feedback", async (req, res) => {
  const { name, feedback } = req.body;

  if (!name || !feedback) {
    return res.status(400).json({ message: "Name and feedback are required" });
  }

  try {
    await queryDB(
      `INSERT INTO feedback (name, message, createdAt) VALUES ('${name}', '${feedback}', '${new Date().toISOString()}')`
    );
    res.json({ message: "Feedback saved successfully!" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save feedback", error: err.message });
  }
});

// ==============================
// GET: Fetch all feedback
// ==============================
app.get("/feedback", async (req, res) => {
  try {
    const result = await queryDB("SELECT * FROM feedback ORDER BY id DESC");
    res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch feedback", error: err.message });
  }
});

// ==============================
// DELETE: Delete feedback by ID
// ==============================
app.delete("/feedback/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await queryDB(`DELETE FROM feedback WHERE id = ${id}`);
    res.json({ message: "Feedback deleted successfully!" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete feedback", error: err.message });
  }
});

// ==============================
// Start server
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Export the app for testing or serverless adapters
module.exports = app;
