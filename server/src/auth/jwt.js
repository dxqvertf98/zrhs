import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserById, toUserRow } from './db.js';

export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    expiresIn: config.jwtExpiresInSeconds
  });
}

export function buildAuthResponse(userRow) {
  return {
    accessToken: signAccessToken(userRow.id),
    tokenType: 'Bearer',
    expiresInSeconds: config.jwtExpiresInSeconds,
    user: toUserRow(userRow)
  };
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return Number(payload.sub);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const userId = verifyAccessToken(match[1]);
  if (!userId) {
    return res.status(401).json({ message: '로그인 정보가 만료되었거나 올바르지 않습니다.' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(401).json({ message: '로그인 정보가 만료되었거나 올바르지 않습니다.' });
  }

  req.user = user;
  next();
}
