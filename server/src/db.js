import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from './config.js';

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT UNIQUE COLLATE NOCASE,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'vi',
    email_verified INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'ko',
    target_language TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function toUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    preferredLanguage: row.preferred_language,
    createdAt: `${row.created_at}Z`
  };
}

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function findSocialAccount(provider, providerUserId) {
  return db
    .prepare('SELECT * FROM social_accounts WHERE provider = ? AND provider_user_id = ?')
    .get(provider, providerUserId);
}

export function createUser({ username, email, passwordHash, displayName, preferredLanguage }) {
  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, display_name, preferred_language)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(username, email, passwordHash, displayName, preferredLanguage);
  return findUserById(result.lastInsertRowid);
}

export function createSocialUser({ username, email, displayName, preferredLanguage, provider, providerUserId }) {
  const insertUser = db.prepare(
    `INSERT INTO users (username, email, password_hash, display_name, preferred_language)
     VALUES (?, ?, NULL, ?, ?)`
  );
  const insertSocial = db.prepare(
    `INSERT INTO social_accounts (user_id, provider, provider_user_id)
     VALUES (?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const userResult = insertUser.run(username, email, displayName, preferredLanguage);
    insertSocial.run(userResult.lastInsertRowid, provider, providerUserId);
    return findUserById(userResult.lastInsertRowid);
  });

  return transaction();
}

export function linkSocialAccount(userId, provider, providerUserId) {
  db.prepare(
    `INSERT INTO social_accounts (user_id, provider, provider_user_id)
     VALUES (?, ?, ?)`
  ).run(userId, provider, providerUserId);
}

export function saveOAuthState(state, provider) {
  db.prepare('INSERT INTO oauth_states (state, provider) VALUES (?, ?)').run(state, provider);
}

export function consumeOAuthState(state) {
  const row = db.prepare('SELECT * FROM oauth_states WHERE state = ?').get(state);
  if (!row) return null;
  db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  return row.provider;
}

export function listConversations(userId) {
  return db
    .prepare(
      `SELECT id, original_text, translated_text, source_language, target_language, created_at
       FROM conversations
       WHERE user_id = ?
       ORDER BY datetime(created_at) DESC`
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      originalText: row.original_text,
      translatedText: row.translated_text,
      sourceLanguage: row.source_language,
      targetLanguage: row.target_language,
      createdAt: `${row.created_at}Z`
    }));
}

export function createConversation(userId, payload) {
  const result = db
    .prepare(
      `INSERT INTO conversations (user_id, original_text, translated_text, source_language, target_language)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      payload.originalText,
      payload.translatedText,
      payload.sourceLanguage || 'ko',
      payload.targetLanguage
    );
  return db
    .prepare(
      `SELECT id, original_text, translated_text, source_language, target_language, created_at
       FROM conversations WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

export function findConversation(userId, conversationId) {
  return db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
}

export function deleteConversation(userId, conversationId) {
  return db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(conversationId, userId);
}

export function generateUniqueUsername(base) {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 30) || 'user';
  let candidate = sanitized;
  let suffix = 1;
  while (findUserByUsername(candidate)) {
    candidate = `${sanitized.slice(0, 24)}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}
