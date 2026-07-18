import crypto from 'crypto';
import { Router } from 'express';
import { config, isGoogleConfigured, isKakaoConfigured } from '../config.js';
import {
  consumeOAuthState,
  createSocialUser,
  findSocialAccount,
  findUserById,
  generateUniqueUsername,
  saveOAuthState
} from '../db.js';
import { signAccessToken } from './jwt.js';

const router = Router();

function redirectWithError(message) {
  const encoded = encodeURIComponent(message);
  return `${config.oauthSuccessRedirectUri}#oauth_error=${encoded}`;
}

function redirectWithToken(token) {
  return `${config.oauthSuccessRedirectUri}#access_token=${encodeURIComponent(token)}`;
}

function createState() {
  return crypto.randomBytes(24).toString('hex');
}

async function exchangeCodeForToken(tokenUrl, body) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || '토큰 교환에 실패했습니다.');
  }
  return data;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Google 사용자 정보를 가져오지 못했습니다.');
  }
  return data;
}

async function fetchKakaoProfile(accessToken) {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Kakao 사용자 정보를 가져오지 못했습니다.');
  }
  return data;
}

async function resolveSocialUser(provider, profile) {
  const existing = findSocialAccount(provider, profile.providerUserId);
  if (existing) {
    return findUserById(existing.user_id);
  }

  return createSocialUser({
    username: generateUniqueUsername(profile.usernameBase),
    email: profile.email,
    displayName: profile.displayName,
    preferredLanguage: 'vi',
    provider,
    providerUserId: profile.providerUserId
  });
}

router.get('/oauth2/authorization/google', (_req, res) => {
  if (!isGoogleConfigured()) {
    return res.redirect(redirectWithError('Google 로그인 설정이 완료되지 않았습니다.'));
  }

  const state = createState();
  saveOAuthState(state, 'google');

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/login/oauth2/code/google', async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.redirect(redirectWithError('Google 로그인 설정이 완료되지 않았습니다.'));
    }

    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(redirectWithError('Google 로그인이 취소되었습니다.'));
    }
    if (!code || !state || consumeOAuthState(String(state)) !== 'google') {
      return res.redirect(redirectWithError('Google 로그인 요청이 올바르지 않습니다.'));
    }

    const tokenData = await exchangeCodeForToken('https://oauth2.googleapis.com/token', {
      code: String(code),
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code'
    });

    const googleUser = await fetchGoogleProfile(tokenData.access_token);
    const user = await resolveSocialUser('google', {
      providerUserId: String(googleUser.id),
      usernameBase: googleUser.email?.split('@')[0] || `google_${googleUser.id}`,
      email: googleUser.email || null,
      displayName: googleUser.name || googleUser.email || 'Google 사용자'
    });

    return res.redirect(redirectWithToken(signAccessToken(user.id)));
  } catch (oauthError) {
    console.error('[oauth/google]', oauthError);
    return res.redirect(redirectWithError('Google 로그인 중 오류가 발생했습니다.'));
  }
});

router.get('/oauth2/authorization/kakao', (_req, res) => {
  if (!isKakaoConfigured()) {
    return res.redirect(redirectWithError('Kakao 로그인 설정이 완료되지 않았습니다.'));
  }

  const state = createState();
  saveOAuthState(state, 'kakao');

  const params = new URLSearchParams({
    client_id: config.kakao.clientId,
    redirect_uri: config.kakao.redirectUri,
    response_type: 'code',
    state
  });

  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
});

router.get('/login/oauth2/code/kakao', async (req, res) => {
  try {
    if (!isKakaoConfigured()) {
      return res.redirect(redirectWithError('Kakao 로그인 설정이 완료되지 않았습니다.'));
    }

    const { code, state, error, error_description: errorDescription } = req.query;
    if (error) {
      const message = errorDescription ? String(errorDescription) : 'Kakao 로그인이 취소되었습니다.';
      return res.redirect(redirectWithError(message));
    }
    if (!code || !state || consumeOAuthState(String(state)) !== 'kakao') {
      return res.redirect(redirectWithError('Kakao 로그인 요청이 올바르지 않습니다.'));
    }

    const tokenBody = {
      grant_type: 'authorization_code',
      client_id: config.kakao.clientId,
      redirect_uri: config.kakao.redirectUri,
      code: String(code)
    };
    if (config.kakao.clientSecret) {
      tokenBody.client_secret = config.kakao.clientSecret;
    }

    const tokenData = await exchangeCodeForToken('https://kauth.kakao.com/oauth/token', tokenBody);
    const kakaoUser = await fetchKakaoProfile(tokenData.access_token);
    const account = kakaoUser.kakao_account || {};
    const profile = account.profile || {};

    const user = await resolveSocialUser('kakao', {
      providerUserId: String(kakaoUser.id),
      usernameBase: profile.nickname || `kakao_${kakaoUser.id}`,
      email: account.email || null,
      displayName: profile.nickname || 'Kakao 사용자'
    });

    return res.redirect(redirectWithToken(signAccessToken(user.id)));
  } catch (oauthError) {
    console.error('[oauth/kakao]', oauthError);
    return res.redirect(redirectWithError('Kakao 로그인 중 오류가 발생했습니다.'));
  }
});

export default router;
