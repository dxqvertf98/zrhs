import bcrypt from 'bcryptjs';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{4,40}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/;

export function validateSignupPayload(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const displayName = String(body.displayName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const preferredLanguage = String(body.preferredLanguage || 'vi').trim();
  const termsAccepted = Boolean(body.termsAccepted);

  if (!termsAccepted) {
    throw badRequest('서비스 이용약관과 개인정보 처리방침에 동의해야 합니다.');
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw badRequest('아이디는 영문, 숫자, . _ - 만 사용해 4~40자로 입력해 주세요.');
  }
  if (!PASSWORD_PATTERN.test(password)) {
    throw badRequest('비밀번호는 영문과 숫자를 포함해 10자 이상으로 입력해 주세요.');
  }
  if (!displayName || displayName.length > 50) {
    throw badRequest('이름을 올바르게 입력해 주세요.');
  }
  if (!email || email.length > 254 || !email.includes('@')) {
    throw badRequest('이메일을 올바르게 입력해 주세요.');
  }

  return { username, password, displayName, email, preferredLanguage };
}

export function validateLoginPayload(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    throw badRequest('아이디와 비밀번호를 입력해 주세요.');
  }

  return { username, password };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function handleRouteError(res, error) {
  const status = error.status || 500;
  const message = status === 500 ? '요청을 처리하지 못했습니다.' : error.message;
  return res.status(status).json({ message });
}
