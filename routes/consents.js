const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db"); // your SQL connection (like sqlite3 or pg or mysql2)

const router = express.Router();

// ✅ Signup
router.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashed]
    );
    res.status(201).json({ user_id: result.lastID, username });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Signup failed" });
  }
});

// ✅ Login
router.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ user_id: user.id, username: user.username });
});

//saved consents
router.post("/api/consents", async (req, res) => {
  const { user_id, service, data_shared, consent_type, consent_date, notes } = req.body;
  try {
    await db.run(
      "INSERT INTO consents (user_id, service_name, data_shared, consent_type, consent_date, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, service, data_shared, consent_type, consent_date, notes]
    );
    res.json({ message: "Consent saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save consent" });
  }
});


module.exports = router;
