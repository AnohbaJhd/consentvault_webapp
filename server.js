const express = require('express');
const path = require('path');
const db = require('./routes/db.js');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fetch = require('node-fetch');
const cors = require('cors');
const authRoutes = require('./routes/consents.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --------- MIDDLEWARE ---------
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(authRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'consentvault_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// --------- AUTH ROUTES ---------

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const id = await db.createUser(username, hash);
  try {
    await db.createUser(username, hash);
    res.status(201).json({ message: "User created", username });
  } catch (e) {
    res.status(400).send('Signup failed: ' + e.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUser(username);

  if (!user) return res.status(401).json({ error: 'No such user' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(403).json({ error: 'Wrong password' });

  req.session.user = user.username;
  res.status(200).json({ user_id: user.id, username: user.username });
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

// Delete consent by ID
app.delete('/api/consents/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM consents WHERE id = ?', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Delete failed:', err);
    res.sendStatus(500);
  }
});

// --------- TRASH SYSTEM ---------

app.get('/api/consents/trashed/:userId', async (req, res) => {
  const userId = req.params.userId;
  const [rows] = await db.query("SELECT * FROM consents WHERE user_id = ? AND is_deleted = 1", [userId]);
  res.json(rows);
});

app.put('/api/consents/restore/:id', async (req, res) => {
  const id = req.params.id;
  await db.query("UPDATE consents SET is_deleted = 0 WHERE id = ?", [id]);
  res.sendStatus(200);
});

app.delete('/api/consents/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const [[consent]] = await db.query("SELECT * FROM consents WHERE id = ?", [id]);
    await db.query("DELETE FROM consents WHERE id = ?", [id]);

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
  console.log(`✅ ConsentVault backend running on http://localhost:${PORT}`);
});
