# 맥락 통역사

<<<<<<< HEAD
Node.js(Express) + SQLite 백엔드입니다. 이메일 회원가입·로그인과 로그인한 사용자의 번역 기록 저장·조회를 지원합니다.
=======
*"학교 알림장과 가정통신문을 다문화 가정 보호자가 쉽게 이해할 수 있도록 돕는 AI 번역 서비스입니다."*
>>>>>>> 172feb36f23ae4fa81293239bbb467175fb8665a

언어 장벽 때문에 학교 안내를 이해하기 어려운 보호자도 필요한 정보를 놓치지 않도록 돕습니다.  
누구나 자신의 언어로 학교와 더 자연스럽게 연결될 수 있는 서비스를 만들고자 합니다.

## 주요 기능
### 맥락 번역 서비스(메인 화면)
- 한국어 학교 안내문 입력 시 AI로 번역
- 베트남어, 중국어, 영어, 일본어, 몽골어 번역 지원
- 밑줄 친 단어 클릭 시 카드 형식으로 뜻 설명
- 형광펜칠 된 단어 클릭 시 학교 용어 사전의 해당 단어로 이동

### 이전 대화 보기
- 로그인 시에만 지원
- **맥락 번역 서비스**에서 AI가 답변한 내역을 확인할 수 있음
- 초기 제목은 물품 혹은 첫 마디이나 사용자가 직접 제목 변경 가능

### 학교 용어 사전
- 다문화 가정이 어려워하는 학교 관련된 단어가 정리된 사전
- 검색 및 페이지 이동 지원

### 회원가입 및 로그인
- 이메일로 회원가입 가능
- 로그아웃도 가능함
- 로그인 시 **이전 대화 보기 서비스** 지원

## 사용 방법

<<<<<<< HEAD
| 변수 | 설명 |
|---|---|
| `APP_JWT_SECRET` | JWT 서명용 비밀키 (32자 이상 권장) |

## API

모든 요청·응답 본문은 JSON입니다. 보호된 API에는 아래 헤더를 붙입니다.

```http
Authorization: Bearer {accessToken}
```

| 기능 | 메서드·경로 | 인증 |
|---|---|---|
| 회원가입 | `POST /api/auth/signup` | 불필요 |
| 로그인 | `POST /api/auth/login` | 불필요 |
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
=======
1. 메인 화면에 알림장 또는 가정통신문 내용을 입력합니다.
2. 번역할 언어를 선택합니다.
3. 번역 버튼을 눌러 AI 번역 결과를 확인합니다.
4. 로그인한 사용자는 메뉴의 `이전 대화 보기`에서 저장된 기록을 다시 확인할 수 있습니다.

## 기술 구성

- Frontend: HTML, CSS, JavaScript
- Authentication / Database: Supabase
- AI Translation: Gemini API
>>>>>>> 172feb36f23ae4fa81293239bbb467175fb8665a
