# 맥아리 통역사 API

Node.js(Express) + SQLite 백엔드입니다. 회원가입·로그인, Google/Kakao 소셜 로그인, 로그인한 사용자의 번역 기록 저장/조회를 지원합니다.

## 실행

Node.js 18 이상이 필요합니다.

```powershell
cd server
npm install
npm start
```

기본 주소는 `http://localhost:8080`입니다. 프론트엔드(`index.html`)는 Live Server 등으로 `http://localhost:5500`에서 열면 됩니다.

## 환경 변수

`server/.env.example`을 참고해 `server/.env`를 만드세요.

| 변수 | 설명 |
|---|---|
| `APP_JWT_SECRET` | JWT 서명용 비밀키 (32자 이상 권장) |
| `APP_OAUTH_SUCCESS_REDIRECT_URI` | 소셜 로그인 후 돌아갈 프론트 주소 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `KAKAO_CLIENT_ID` | Kakao REST API 키 |
| `KAKAO_CLIENT_SECRET` | Kakao Client Secret 사용 시에만 |

Google은 **Client ID와 Client Secret 둘 다** 필요합니다. Client Secret은 [Google Cloud Console](https://console.cloud.google.com/) → 사용자 인증 정보에서 확인할 수 있습니다.

## OAuth 콘솔 설정

각 제공자 콘솔에 아래 **백엔드 콜백 URI**를 등록하세요.

```text
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/kakao
```

Kakao Developers → 내 애플리케이션 → 플랫폼 → Web → Redirect URI에 Kakao URI를 추가하세요.

Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI에 Google URI를 추가하세요.

## API

모든 요청·응답 본문은 JSON입니다. 보호된 API에는 아래 헤더를 붙입니다.

```http
Authorization: Bearer {accessToken}
```

| 기능 | 메서드·경로 | 인증 |
|---|---|---|
| 회원가입 | `POST /api/auth/signup` | 불필요 |
| 로그인 | `POST /api/auth/login` | 불필요 |
| 사용 가능한 소셜 로그인 | `GET /api/auth/social/providers` | 불필요 |
| Google 로그인 시작 | `GET /oauth2/authorization/google` | 불필요 |
| Kakao 로그인 시작 | `GET /oauth2/authorization/kakao` | 불필요 |
| 내 정보 | `GET /api/auth/me` | 필요 |
| 대화 저장 | `POST /api/conversations` | 필요 |
| 내 이전 대화 목록 | `GET /api/conversations` | 필요 |
| 대화 상세 / 삭제 | `GET` / `DELETE /api/conversations/{id}` | 필요 |

### 회원가입

```json
POST /api/auth/signup
{
  "username": "minsu01",
  "password": "safe-password-123",
  "displayName": "민수 보호자",
  "email": "minsu@example.com",
  "preferredLanguage": "vi",
  "termsAccepted": true
}
```

### 로그인

```json
POST /api/auth/login
{
  "username": "minsu01",
  "password": "safe-password-123"
}
```

응답 예시:

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

```json
POST /api/conversations
{
  "originalText": "실내화를 꼭 지참할 것",
  "translatedText": "Please bring indoor shoes.",
  "sourceLanguage": "ko",
  "targetLanguage": "en"
}
```

## 프론트엔드 연결

프론트엔드 기본 API 주소는 `http://localhost:8080`입니다. 다른 주소를 쓸 경우 `index.html` 로드 전에 아래처럼 지정할 수 있습니다.

```html
<script>
  window.MAEUM_API_BASE_URL = 'https://api.example.com';
</script>
```
