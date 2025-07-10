const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// ========== Table Setup ==========
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_name TEXT,
      data_shared TEXT,
      notes TEXT,
      consent_type TEXT,
      consent_date TEXT,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
});

// ========== Consent Functions ==========
function addConsent(user_id, service, data, notes, type, date) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO consents (user_id, service_name, data_shared, notes, consent_type, consent_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, service, data, notes, type, date],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getAllConsents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM consents WHERE is_deleted = 0 ORDER BY consent_date DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function query(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve([rows]);
    });
  });
}

// ========== User Auth ==========
function createUser(username, passwordHash) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, passwordHash],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function findUser(username) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ========== Export ==========
module.exports = {
  addConsent,
  getAllConsents,
  query,
  createUser,
  findUser
};
