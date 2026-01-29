const express = require("express");
const cors = require("cors");
const path = require("path");
const { Database } = require("@sqlitecloud/drivers");

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

// Initialize database connection
let database;
(async () => {
  try {
    database = new Database(SQLITECLOUD_URL);
    
    // Create table if it doesn't exist
    await database.sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;
    console.log("✅ Connected to SQLiteCloud and table ready");
  } catch (err) {
    console.error("❌ Connection error:", err.message);
  }
})();

// ==============================
// POST: Save feedback
// ==============================
app.post("/feedback", async (req, res) => {
  const { name, feedback } = req.body;

  if (!name || !feedback) {
    return res.status(400).json({ message: "Name and feedback are required" });
  }

  try {
    await database.sql`
      INSERT INTO feedback (name, message, createdAt)
      VALUES (${name}, ${feedback}, ${new Date().toISOString()})
    `;
    res.json({ message: "Feedback saved successfully!" });
  } catch (err) {
    console.error("POST error:", err.message);
    return res.status(500).json({ message: "Failed to save feedback", error: err.message });
  }
});

// ==============================
// GET: Fetch all feedback
// ==============================
app.get("/feedback", async (req, res) => {
  try {
    const result = await database.sql`
      SELECT * FROM feedback ORDER BY id DESC
    `;
    res.json(result);
  } catch (err) {
    console.error("GET error:", err.message);
    return res.status(500).json({ message: "Failed to fetch feedback", error: err.message });
  }
});

// ==============================
// DELETE: Delete feedback by ID
// ==============================
app.delete("/feedback/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await database.sql`
      DELETE FROM feedback WHERE id = ${id}
    `;
    res.json({ message: "Feedback deleted successfully!" });
  } catch (err) {
    console.error("DELETE error:", err.message);
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
