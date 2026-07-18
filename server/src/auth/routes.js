import { Router } from 'express';
import { getEnabledSocialProviders } from '../config.js';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  toUserRow
} from '../db.js';
import { buildAuthResponse, requireAuth } from './jwt.js';
import {
  handleRouteError,
  hashPassword,
  validateLoginPayload,
  validateSignupPayload,
  verifyPassword
} from './validation.js';

const router = Router();

router.get('/social/providers', (_req, res) => {
  res.json(getEnabledSocialProviders());
});

router.post('/signup', async (req, res) => {
  try {
    const payload = validateSignupPayload(req.body);

    if (findUserByUsername(payload.username)) {
      return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
    }
    if (findUserByEmail(payload.email)) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const passwordHash = await hashPassword(payload.password);
    const user = createUser({
      username: payload.username,
      email: payload.email,
      passwordHash,
      displayName: payload.displayName,
      preferredLanguage: payload.preferredLanguage
    });

    return res.status(201).json({
      authentication: buildAuthResponse(user)
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.post('/login', async (req, res) => {
  try {
    const payload = validateLoginPayload(req.body);
    const user = findUserByUsername(payload.username);

    if (!user || !(await verifyPassword(payload.password, user.password_hash))) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json(toUserRow(req.user));
});

export default router;
