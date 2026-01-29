const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLiteCloud database
const connectionString = process.env.SQLITECLOUD_CONNECTION_STRING;
if (!connectionString) {
  console.error("Error: SQLITECLOUD_CONNECTION_STRING environment variable is not set");
  process.exit(1);
}

const db = new sqlite3.Database(connectionString, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLiteCloud database");
  }
});

// Create table if it does not exist
db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

// ==============================
// POST: Save feedback
// ==============================
app.post("/feedback", (req, res) => {
  const { name, feedback } = req.body;

  if (!name || !feedback) {
    return res.status(400).json({ message: "Name and feedback are required" });
  }

  const sql = `
    INSERT INTO feedback (name, message, createdAt)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [name, feedback, new Date().toISOString()], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to save feedback" });
    }
    res.json({ message: "Feedback saved successfully!" });
  });
});

// ==============================
// GET: Fetch all feedback
// ==============================
app.get("/feedback", (req, res) => {
  db.all("SELECT * FROM feedback ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch feedback" });
    }
    res.json(rows);
  });
});

// ==============================
// DELETE: Delete feedback by ID
// ==============================
app.delete("/feedback/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM feedback WHERE id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to delete feedback" });
    }

    res.json({ message: "Feedback deleted successfully!" });
  });
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
