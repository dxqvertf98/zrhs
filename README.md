# 다문화 가정 학교 안내 지원 API

Spring Boot 기반 백엔드입니다. 현재 구현 범위는 회원가입·로그인과 **로그인한 사용자 본인의 이전 대화 기록** 저장/조회입니다. AI 번역은 아직 연결하지 않았으며, 이후 AI가 만든 `translatedText`를 대화 기록 API에 저장하면 됩니다.

직접 회원가입/로그인과 Google·Kakao 소셜 로그인을 모두 지원합니다. 소셜 로그인 버튼은 해당 제공자 키가 설정된 경우에만 활성화됩니다.

## 실행

Java 17 이상과 Maven이 필요합니다.

```powershell
$env:APP_JWT_SECRET = "32바이트 이상인-충분히-긴-운영용-랜덤-비밀키를-여기에-설정"
mvn spring-boot:run
```

기본 주소는 `http://localhost:8080`입니다. 개발용 H2 데이터베이스는 `./data`에 저장되므로 서버를 다시 시작해도 회원과 기록이 유지됩니다. 실제 배포 때는 `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_DRIVER`를 운영 DB 값으로 설정하고, `APP_JWT_SECRET`도 반드시 교체하세요.

## Google·Kakao 로그인 설정

소셜 로그인에는 각 제공자 콘솔에서 받은 키가 필요합니다. 키를 코드나 Git에 넣지 말고 환경 변수로 설정하세요.

```powershell
$env:GOOGLE_CLIENT_ID = "Google OAuth 클라이언트 ID"
$env:GOOGLE_CLIENT_SECRET = "Google OAuth 클라이언트 보안 비밀"
$env:KAKAO_CLIENT_ID = "Kakao REST API 키"
$env:KAKAO_CLIENT_SECRET = "Kakao Client Secret" # 카카오 콘솔에서 Client Secret 사용 시에만
$env:APP_OAUTH_SUCCESS_REDIRECT_URI = "http://localhost:5500/index.html"
mvn spring-boot:run
```

두 콘솔 모두 다음 **백엔드 콜백 URI**를 등록해야 합니다. 실제 서비스 주소로 실행한다면 `localhost:8080` 부분만 운영 도메인으로 바꾸세요.

```text
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/kakao
```

로그인 성공 뒤에는 `APP_OAUTH_SUCCESS_REDIRECT_URI`로 돌아가며, 프론트엔드가 URL fragment의 일회성 로그인 토큰을 받아 세션에 저장합니다. 프론트 페이지의 기본 API 주소는 `http://localhost:8080`이고, 다른 주소를 쓸 경우 `window.MAEUM_API_BASE_URL`에 지정할 수 있습니다.

Google은 **Client ID와 Client Secret 둘 다** 필요합니다. Client ID만 설정하면 Google 버튼은 의도적으로 비활성화됩니다. Kakao는 REST API 키로 기본 로그인이 가능하며, Kakao 콘솔에서 Client Secret을 사용 설정했다면 `KAKAO_CLIENT_SECRET`도 넣어야 합니다.

## 배포용 회원가입

회원가입은 아이디·이메일 중복 검사, BCrypt 비밀번호 해시, 영문+숫자를 포함한 10자 이상 비밀번호, 약관 동의를 검증합니다. 배포에서는 이메일 인증도 켜세요.

```powershell
$env:APP_REQUIRE_EMAIL_VERIFICATION = "true"
$env:APP_MAIL_FROM = "no-reply@your-domain.com"
$env:APP_EMAIL_VERIFICATION_URL = "https://api.your-domain.com/api/auth/verify-email"
$env:SPRING_MAIL_HOST = "smtp.example.com"
$env:SPRING_MAIL_PORT = "587"
$env:SPRING_MAIL_USERNAME = "SMTP 계정"
$env:SPRING_MAIL_PASSWORD = "SMTP 비밀번호 또는 앱 비밀번호"
```

이 설정을 켜면 가입 직후 인증 링크가 이메일로 발송되고, 인증을 마친 계정만 로그인할 수 있습니다. 로컬 개발에서는 메일 서버가 없으므로 기본값이 꺼져 있습니다.

## API

모든 요청·응답 본문은 JSON입니다. 로그인 또는 회원가입 응답의 `accessToken`은 브라우저의 안전한 저장소에 보관하고, 보호된 API에 아래처럼 전달합니다.

```http
Authorization: Bearer {accessToken}
```

|기능|메서드·경로|인증|
|---|---|---|
|회원가입|`POST /api/auth/signup`|불필요|
|로그인|`POST /api/auth/login`|불필요|
|사용 가능한 소셜 로그인|`GET /api/auth/social/providers`|불필요|
|Google 로그인 시작|`GET /oauth2/authorization/google`|불필요|
|Kakao 로그인 시작|`GET /oauth2/authorization/kakao`|불필요|
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
