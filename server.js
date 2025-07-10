const express = require('express');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fetch = require('node-fetch'); // for webhook calls

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'consentvault_secret',
  resave: false,
  saveUninitialized: false
}));

// --------- AUTH ROUTES ---------

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.createUser(username, hash);
    res.redirect('/login.html');
  } catch (e) {
    res.status(400).send('Signup failed: ' + e.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUser(username);
  if (!user) return res.send('No such user');

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    req.session.user = username;
    res.redirect('/index.html');
  } else {
    res.send('Wrong password');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// --------- PAGE GUARD ---------

const protectRoute = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login.html');
  next();
};

// Optional: protect all HTML routes
app.use([
  '/index.html',
  '/dashboard.html',
  '/data.html',
  '/trash.html',
  '/form.html'
], protectRoute);

// --------- CONSENT ROUTES ---------

// Save new consent + webhook
app.post('/api/consents', async (req, res) => {
  const { user_id, service, data_shared, notes, consent_type, consent_date } = req.body;
  await db.addConsent(user_id, service, data_shared, notes, consent_type, consent_date);

  // Optional Webhook Trigger
  try {
    await fetch('https://webhook.site/your-real-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: "Consent Added",
        service,
        data_shared,
        consent_type,
        date: consent_date,
        user_id
      })
    });
  } catch (err) {
    console.log("⚠️ Webhook failed: ", err.message);
  }

  res.json({ message: 'Saved' });
});

// Get all consents by user
app.get('/api/consents/:userId', async (req, res) => {
  const userId = req.params.userId;
  const [rows] = await db.query(
    'SELECT * FROM consents WHERE user_id = ? AND is_deleted = 0 ORDER BY consent_date DESC',
    [userId]
  );
  res.json(rows);
});

// --------- TRASH SYSTEM ---------

// Get trashed consents
app.get('/api/consents/trashed/:userId', async (req, res) => {
  const userId = req.params.userId;
  const [rows] = await db.query("SELECT * FROM consents WHERE user_id = ? AND is_deleted = 1", [userId]);
  res.json(rows);
});

// Restore trashed consent
app.put('/api/consents/restore/:id', async (req, res) => {
  const id = req.params.id;
  await db.query("UPDATE consents SET is_deleted = 0 WHERE id = ?", [id]);
  res.sendStatus(200);
});

// Permanently delete + webhook
app.delete('/api/consents/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const [[consent]] = await db.query("SELECT * FROM consents WHERE id = ?", [id]);
    await db.query("DELETE FROM consents WHERE id = ?", [id]);

    // Optional webhook on permanent delete
    await fetch('https://webhook.site/your-real-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: "Consent Permanently Deleted",
        service: consent?.service_name,
        data_shared: consent?.data_shared,
        consent_type: consent?.consent_type,
        deleted_at: new Date().toISOString()
      })
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Delete failed:', err);
    res.sendStatus(500);
  }
});

// --------- START SERVER ---------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
