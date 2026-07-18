import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function required(name, value) {
  if (!value) {
    console.warn(`[config] ${name} is not set`);
  }
  return value || '';
}

export const config = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.APP_JWT_SECRET || 'dev-only-change-this-secret-key-32bytes!!',
  jwtExpiresInSeconds: Number(process.env.APP_JWT_EXPIRES_SECONDS || 604800),
  oauthSuccessRedirectUri:
    process.env.APP_OAUTH_SUCCESS_REDIRECT_URI || 'http://localhost:5500/index.html',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  dbPath: process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'maeumari.db'),
  google: {
    clientId: required('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID),
    clientSecret: required('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET),
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/google'
  },
  kakao: {
    clientId: required('KAKAO_CLIENT_ID', process.env.KAKAO_CLIENT_ID),
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    redirectUri:
      process.env.KAKAO_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/kakao'
  }
};

export function isGoogleConfigured() {
  return Boolean(config.google.clientId && config.google.clientSecret);
}

export function isKakaoConfigured() {
  return Boolean(config.kakao.clientId);
}

export function getEnabledSocialProviders() {
  const providers = [];
  if (isGoogleConfigured()) providers.push('google');
  if (isKakaoConfigured()) providers.push('kakao');
  return providers;
}
