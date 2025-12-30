# Auth API – Overview

이 문서는 **인증(Authentication) API** 전체 개요와 엔드포인트 목록을 정의한다.

---

## 1. 인증 시스템 개요

- **인증 제공자**: Supabase Auth
- **인증 방식**: 이메일 + 비밀번호
- **세션 관리**: JWT 기반 (HTTP-only cookie)
- **이메일 발송**: Nodemailer (Supabase 기본 메일 사용 안 함)

---

## 2. 인증 플로우

### 2.1 회원가입 플로우

```
1. 이메일 인증 요청 → POST /api/auth/send-verification
2. 이메일 확인 링크 클릭 → GET /api/auth/verify-email?token=xxx
3. 회원가입 (인증 완료된 이메일로) → POST /api/auth/signup
4. 자동 로그인 처리
```

### 2.2 로그인 플로우

```
1. 로그인 → POST /api/auth/login
2. JWT 세션 발급 (HTTP-only cookie)
3. 클라이언트에서 세션 확인 → GET /api/auth/session
```

### 2.3 로그아웃 플로우

```
1. 로그아웃 → POST /api/auth/logout
2. 세션 쿠키 삭제
```

---

## 3. API 엔드포인트 목록

### 인증 관련

| Method | Endpoint                      | 설명                 | 인증 필요 | 스펙 문서              |
| ------ | ----------------------------- | -------------------- | --------- | ---------------------- |
| POST   | `/api/auth/send-verification` | 이메일 인증 요청     | ❌        | email-verification.md  |
| GET    | `/api/auth/verify-email`      | 이메일 인증 확인     | ❌        | email-verification.md  |
| POST   | `/api/auth/signup`            | 회원가입             | ❌        | sign-up.md             |
| POST   | `/api/auth/login`             | 로그인               | ❌        | login.md               |
| POST   | `/api/auth/logout`            | 로그아웃             | ✅        | logout.md              |
| GET    | `/api/auth/session`           | 세션 확인/갱신       | ✅        | session.md             |
| POST   | `/api/auth/reset-password`    | 비밀번호 재설정 요청 | ❌        | reset-password.md      |
| POST   | `/api/auth/update-password`   | 비밀번호 변경 확인   | ❌        | reset-password.md      |

---

## 4. 공통 정책

### 4.1 에러 응답 형식

모든 인증 API는 공통 응답 형식을 따른다 (`specs/api/index.md` 참조):

```json
{
  "status": "error",
  "message": "사용자 친화적 메시지",
  "errorCode": "ERROR_CODE"
}
```

### 4.2 보안 정책

- 비밀번호는 최소 8자 이상
- 이메일 중복 여부는 회원가입 시에만 확인
- 로그인 실패 시 이메일 존재 여부 노출 금지
- Rate Limit 적용 (IP/이메일 기준)

### 4.3 세션 정책

- JWT는 HTTP-only cookie에 저장
- 세션 만료 시간: 7일 (기본)
- Refresh Token은 초기 범위에서 제외
- 세션 갱신은 자동으로 처리 (middleware)

---

## 5. 1차 MVP 범위

### 포함

- 이메일/비밀번호 회원가입
- 이메일 인증 (Nodemailer)
- 로그인/로그아웃
- 세션 확인
- 비밀번호 재설정

### 제외

- 소셜 로그인 (Google, Kakao 등)
- 2FA (2단계 인증)
- 휴대폰 인증
- Refresh Token

---

## 6. 확장 고려사항

- 소셜 로그인 추가 시 OAuth 플로우 설계
- 2FA 도입 시 TOTP 또는 이메일 OTP
- 디바이스 기반 로그인 제한
- 로그인 이력 관리
