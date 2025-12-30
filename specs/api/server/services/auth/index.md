# Auth Service

이 문서는 **인증(Auth) Server Service** 구현을 정의한다.

> **범위**: 인증 관련 비즈니스 로직 및 Supabase Auth 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/auth/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**AuthService**는 인증 관련 모든 비즈니스 로직과 Supabase Auth 접근을 담당한다.

**위치**: `/lib/server/services/auth.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 회원가입, 로그인, 로그아웃, 세션 관리, 이메일 인증

---

## 2. 인증 시스템 개요

- **인증 제공자**: Supabase Auth
- **인증 방식**: 이메일 + 비밀번호
- **세션 관리**: JWT 기반 (HTTP-only cookie)
- **이메일 발송**: Nodemailer (Supabase 기본 메일 사용 안 함)

---

## 3. AuthService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/auth.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { ApiError } from '@/lib/server/utils/errors';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/server/utils/email';

export class AuthService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 이메일 인증 토큰 생성 및 발송

```ts
/**
 * 이메일 인증 토큰 생성 및 발송
 */
static async sendVerificationEmail(email: string): Promise<void> {
  const supabase = createServerClient();

  // 이메일 중복 확인
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(
      '이미 사용 중인 이메일입니다',
      400,
      'EMAIL_ALREADY_EXISTS'
    );
  }

  // 인증 토큰 생성 (6자리 숫자 또는 UUID)
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분

  // 토큰 저장
  await supabase.from('email_verifications').insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  // 이메일 발송
  await sendVerificationEmail(email, token);
}
```

### 4.2 이메일 인증 확인

```ts
/**
 * 이메일 인증 토큰 확인
 */
static async verifyEmail(token: string): Promise<{ email: string }> {
  const supabase = createServerClient();

  const { data: verification, error } = await supabase
    .from('email_verifications')
    .select('email, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !verification) {
    throw new ApiError(
      '유효하지 않은 인증 토큰입니다',
      400,
      'INVALID_TOKEN'
    );
  }

  // 만료 확인
  if (new Date(verification.expires_at) < new Date()) {
    throw new ApiError(
      '인증 토큰이 만료되었습니다',
      400,
      'TOKEN_EXPIRED'
    );
  }

  // 사용 여부 확인
  if (verification.used_at) {
    throw new ApiError(
      '이미 사용된 인증 토큰입니다',
      400,
      'TOKEN_ALREADY_USED'
    );
  }

  // 토큰 사용 처리
  await supabase
    .from('email_verifications')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);

  return { email: verification.email };
}
```

### 4.3 회원가입

```ts
/**
 * 회원가입
 */
static async signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ user: User; session: Session }> {
  const supabase = createServerClient();

  // 비밀번호 검증
  if (password.length < 8) {
    throw new ApiError(
      '비밀번호는 최소 8자 이상이어야 합니다',
      400,
      'INVALID_PASSWORD'
    );
  }

  // Supabase Auth 회원가입
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || null,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new ApiError(
        '이미 사용 중인 이메일입니다',
        400,
        'EMAIL_ALREADY_EXISTS'
      );
    }
    throw new ApiError(error.message, 400, 'SIGNUP_FAILED');
  }

  if (!data.user || !data.session) {
    throw new ApiError('회원가입 실패', 500, 'SIGNUP_FAILED');
  }

  // Profile 생성 (Trigger로 자동 생성됨)
  // 추가 정보가 필요한 경우 여기서 업데이트

  return {
    user: data.user,
    session: data.session,
  };
}
```

### 4.4 로그인

```ts
/**
 * 로그인
 */
static async login(
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  const supabase = createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 보안: 이메일 존재 여부 노출 방지
    throw new ApiError(
      '이메일 또는 비밀번호가 올바르지 않습니다',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  if (!data.user || !data.session) {
    throw new ApiError('로그인 실패', 500, 'LOGIN_FAILED');
  }

  return {
    user: data.user,
    session: data.session,
  };
}
```

### 4.5 로그아웃

```ts
/**
 * 로그아웃
 */
static async logout(): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new ApiError('로그아웃 실패', 500, 'LOGOUT_FAILED');
  }
}
```

### 4.6 세션 확인

```ts
/**
 * 세션 확인
 */
static async getSession(): Promise<{ user: User; session: Session } | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return {
    user: data.session.user,
    session: data.session,
  };
}
```

### 4.7 세션에서 사용자 정보 가져오기

```ts
/**
 * 세션에서 사용자 정보 가져오기
 */
static async getUserFromSession(): Promise<User | null> {
  const sessionData = await this.getSession();
  return sessionData?.user || null;
}
```

### 4.8 비밀번호 재설정 요청

```ts
/**
 * 비밀번호 재설정 이메일 발송
 */
static async sendPasswordResetEmail(email: string): Promise<void> {
  const supabase = createServerClient();

  // 사용자 존재 확인 (보안: 존재 여부 노출하지 않음)
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  // 이메일이 존재하지 않아도 성공 응답 (보안)
  if (!user) {
    return;
  }

  // 재설정 토큰 생성
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

  // 토큰 저장
  await supabase.from('password_resets').insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  // 이메일 발송
  await sendPasswordResetEmail(email, token);
}
```

### 4.9 비밀번호 변경

```ts
/**
 * 비밀번호 재설정 (토큰 확인 후)
 */
static async resetPassword(token: string, newPassword: string): Promise<void> {
  const supabase = createServerClient();

  // 토큰 확인
  const { data: resetData } = await supabase
    .from('password_resets')
    .select('email, expires_at, used_at')
    .eq('token', token)
    .single();

  if (!resetData) {
    throw new ApiError(
      '유효하지 않은 재설정 토큰입니다',
      400,
      'INVALID_TOKEN'
    );
  }

  if (new Date(resetData.expires_at) < new Date()) {
    throw new ApiError(
      '재설정 토큰이 만료되었습니다',
      400,
      'TOKEN_EXPIRED'
    );
  }

  if (resetData.used_at) {
    throw new ApiError(
      '이미 사용된 재설정 토큰입니다',
      400,
      'TOKEN_ALREADY_USED'
    );
  }

  // 비밀번호 검증
  if (newPassword.length < 8) {
    throw new ApiError(
      '비밀번호는 최소 8자 이상이어야 합니다',
      400,
      'INVALID_PASSWORD'
    );
  }

  // Supabase Auth 비밀번호 업데이트
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new ApiError('비밀번호 변경 실패', 500, 'PASSWORD_UPDATE_FAILED');
  }

  // 토큰 사용 처리
  await supabase
    .from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}
```

---

## 5. 헬퍼 메서드

### 5.1 이메일 검증

```ts
/**
 * 이메일 형식 검증
 */
private static validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 5.2 비밀번호 강도 검증

```ts
/**
 * 비밀번호 강도 검증
 */
private static validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다' };
  }

  // 추가 정책 (선택적)
  // const hasNumber = /\d/.test(password);
  // const hasLetter = /[a-zA-Z]/.test(password);
  // if (!hasNumber || !hasLetter) {
  //   return { valid: false, message: '비밀번호는 문자와 숫자를 포함해야 합니다' };
  // }

  return { valid: true };
}
```

---

## 6. 세션 관리

### 6.1 HTTP-only Cookie 설정

세션은 API Route에서 HTTP-only cookie로 설정됩니다:

```ts
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const { user, session } = await AuthService.login(email, password);

  // HTTP-only cookie 설정
  const response = NextResponse.json({
    status: 'success',
    data: { user },
  });

  response.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  response.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
```

---

## 7. 이메일 발송

### 7.1 Nodemailer 설정

```ts
// lib/server/utils/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: 'Lucent Management - 이메일 인증',
    html: `
      <h1>이메일 인증</h1>
      <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>이 링크는 10분간 유효합니다.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: 'Lucent Management - 비밀번호 재설정',
    html: `
      <h1>비밀번호 재설정</h1>
      <p>아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>이 링크는 1시간 동안 유효합니다.</p>
    `,
  });
}
```

---

## 8. 에러 처리

### 8.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `EMAIL_ALREADY_EXISTS` | 400 | 이미 사용 중인 이메일 |
| `INVALID_TOKEN` | 400 | 유효하지 않은 토큰 |
| `TOKEN_EXPIRED` | 400 | 만료된 토큰 |
| `TOKEN_ALREADY_USED` | 400 | 이미 사용된 토큰 |
| `INVALID_PASSWORD` | 400 | 비밀번호 형식 오류 |
| `INVALID_CREDENTIALS` | 401 | 잘못된 이메일/비밀번호 |
| `SIGNUP_FAILED` | 500 | 회원가입 실패 |
| `LOGIN_FAILED` | 500 | 로그인 실패 |
| `LOGOUT_FAILED` | 500 | 로그아웃 실패 |

### 8.2 사용 예시

```ts
if (!validateEmail(email)) {
  throw new ApiError('유효하지 않은 이메일 형식입니다', 400, 'INVALID_EMAIL');
}

const passwordValidation = validatePassword(password);
if (!passwordValidation.valid) {
  throw new ApiError(passwordValidation.message!, 400, 'INVALID_PASSWORD');
}
```

---

## 9. 보안 정책

### 9.1 비밀번호 정책

- 최소 8자 이상
- (선택) 문자 + 숫자 조합
- bcrypt 해싱 (Supabase Auth 자동 처리)

### 9.2 Rate Limiting

```ts
// middleware.ts에서 처리
export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/auth/')) {
    // Rate limit: 10 requests per minute
    const rateLimitExceeded = checkRateLimit(ip, path, 10, 60);
    if (rateLimitExceeded) {
      return NextResponse.json(
        { status: 'error', message: '요청이 너무 많습니다' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
```

### 9.3 보안 모범 사례

- ✅ HTTP-only cookie로 세션 저장
- ✅ 로그인 실패 시 이메일 존재 여부 노출 금지
- ✅ 비밀번호 재설정 시 이메일 존재 여부 노출 금지
- ✅ 토큰 만료 시간 설정 (이메일 인증: 10분, 비밀번호 재설정: 1시간)
- ✅ 토큰 일회성 사용 (used_at 체크)

---

## 10. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/auth/index.md`
- Client Services: `/specs/api/client/services/auth/index.md`
- Database Types: `/types/database.ts`
- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
