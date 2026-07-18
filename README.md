# 다문화 가정 학교 안내 지원 API

Spring Boot 기반 백엔드입니다. 현재 구현 범위는 회원가입·로그인과 **로그인한 사용자 본인의 이전 대화 기록** 저장/조회입니다. AI 번역은 아직 연결하지 않았으며, 이후 AI가 만든 `translatedText`를 대화 기록 API에 저장하면 됩니다.

## 실행

Java 17 이상과 Maven이 필요합니다.

```powershell
$env:APP_JWT_SECRET = "32바이트 이상인-충분히-긴-운영용-랜덤-비밀키를-여기에-설정"
mvn spring-boot:run
```

기본 주소는 `http://localhost:8080`입니다. 개발용 H2 데이터베이스는 `./data`에 저장되므로 서버를 다시 시작해도 회원과 기록이 유지됩니다. 실제 배포 때는 `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_DRIVER`를 운영 DB 값으로 설정하고, `APP_JWT_SECRET`도 반드시 교체하세요.

## API

모든 요청·응답 본문은 JSON입니다. 로그인 또는 회원가입 응답의 `accessToken`은 브라우저의 안전한 저장소에 보관하고, 보호된 API에 아래처럼 전달합니다.

```http
Authorization: Bearer {accessToken}
```

|기능|메서드·경로|인증|
|---|---|---|
|회원가입|`POST /api/auth/signup`|불필요|
|로그인|`POST /api/auth/login`|불필요|
|내 정보|`GET /api/auth/me`|필요|
|대화 저장|`POST /api/conversations`|필요|
|내 이전 대화 목록|`GET /api/conversations`|필요|
|대화 상세 / 삭제|`GET` / `DELETE /api/conversations/{id}`|필요|

### 회원가입

```json
POST /api/auth/signup
{
  "username": "minsu01",
  "password": "safe-password-123",
  "displayName": "민수 보호자",
  "preferredLanguage": "vi"
}
```

`username`은 영문·숫자·`. _ -`만 사용해 4~40자로 입력합니다. 응답은 로그인과 동일하게 JWT와 사용자 정보를 반환합니다.

### 로그인

```json
POST /api/auth/login
{
  "username": "minsu01",
  "password": "safe-password-123"
}
```

```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresInSeconds": 604800,
  "user": {
    "id": 1,
    "username": "minsu01",
    "displayName": "민수 보호자",
    "preferredLanguage": "vi",
    "createdAt": "2026-07-18T...Z"
  }
}
```

### 대화 기록 저장

AI 연결 전에는 임시 번역 결과 또는 프론트엔드가 만든 결과를 넣을 수 있습니다. AI가 붙은 뒤에는 번역 결과와 용어 설명을 생성한 직후 이 API를 호출하면 됩니다.

```json
POST /api/conversations
{
  "originalText": "실내화를 꼭 지참할 것",
  "translatedText": "Please bring indoor shoes.",
  "sourceLanguage": "ko",
  "targetLanguage": "en"
}
```

`GET /api/conversations`는 최신순으로 현재 로그인한 사용자의 기록만 반환합니다. 다른 계정의 기록 ID를 추측해서 요청해도 조회·삭제할 수 없습니다.

## 프론트엔드 연결 예시

```js
const API_BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  sessionStorage.setItem('accessToken', data.accessToken);
  return data.user;
}

async function loadMyHistory() {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }
  });
  if (!response.ok) throw new Error('대화 기록을 불러올 수 없습니다.');
  return response.json();
}
```
