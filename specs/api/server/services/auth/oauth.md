# OAuth Service

이 문서는 **OAuth 인증 서비스** 로직을 정의한다.

> **범위**: OAuth 로그인 비즈니스 로직 (프로필 자동 생성/관리)
> **관련 문서**:
> - OAuth API Routes: `/specs/api/server/routes/auth/oauth-google.md`
> - Auth Service: `/specs/api/server/services/auth/index.md`
> - Profiles Service: `/specs/api/server/services/profiles/index.md`

---

## 1. 개요

**OAuthService**는 OAuth 인증 후 프로필 자동 생성 및 관리를 담당한다.

**위치**: `/lib/server/services/oauth.service.ts`
**역할**:
- OAuth 콜백 처리
- 프로필 자동 생성/로드
- 이메일 중복 처리
- OAuth 로그인 로깅

---

## 2. OAuthService 클래스

### 2.1 기본 구조

```ts
// lib/server/services/oauth.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { ApiError } from '@/lib/server/utils/errors';
import { LogService } from './log.service';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/types/database';

type Profile = Tables<'profiles'>;

export class OAuthService {
  /**
   * OAuth 콜백 처리
   * - 프로필 존재 확인
   * - 없으면 자동 생성
   * - 있으면 기존 프로필 반환
   */
  static async handleOAuthCallback(
    user: User
  ): Promise<{
    user: User;
    profile: Profile;
    isNewUser: boolean;
  }> {
    // 구현...
  }

  /**
   * OAuth 사용자 프로필 생성
   */
  static async createOAuthProfile(user: User): Promise<Profile> {
    // 구현...
  }

  /**
   * 이메일로 기존 프로필 조회
   */
  static async findProfileByEmail(email: string): Promise<Profile | null> {
    // 구현...
  }
}
```

---

## 3. 주요 메서드

### 3.1 handleOAuthCallback

**목적**: OAuth 인증 완료 후 프로필 확인/생성

```ts
/**
 * OAuth 콜백 처리
 *
 * @param user - Supabase auth.users 사용자 객체
 * @returns 사용자 정보, 프로필, 신규 여부
 */
static async handleOAuthCallback(
  user: User
): Promise<{
  user: User;
  profile: Profile;
  isNewUser: boolean;
}> {
  const supabase = createServerClient();

  // 1. profiles 테이블에서 기존 프로필 조회 (user.id로 검색)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    // 기존 사용자 - 프로필 반환
    await LogService.log({
      eventCategory: 'auth',
      eventType: 'oauth_login_success',
      message: 'Google OAuth 로그인 성공',
      userId: user.id,
      metadata: {
        provider: 'google',
        email: user.email,
        isNewUser: false,
      },
    });

    return {
      user,
      profile: existingProfile,
      isNewUser: false,
    };
  }

  // 2. 이메일 중복 확인 (보안: 자동 연결 방지)
  if (user.email) {
    const emailProfile = await this.findProfileByEmail(user.email);

    if (emailProfile) {
      // 동일 이메일로 이미 가입된 계정 존재
      // 보안상의 이유로 자동 연결하지 않음 (Pre-Account Takeover 방지)
      await LogService.log({
        eventCategory: 'auth',
        eventType: 'oauth_email_conflict',
        message: 'Google OAuth 이메일 중복 - 기존 계정 존재',
        userId: user.id,
        metadata: {
          email: user.email,
          existingProfileId: emailProfile.id,
        },
        severity: 'warning',
      });

      throw new ApiError(
        '이미 가입된 이메일입니다. 기존 계정으로 로그인하세요.',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }
  }

  // 3. 신규 사용자 - 프로필 자동 생성
  const newProfile = await this.createOAuthProfile(user);

  await LogService.log({
    eventCategory: 'auth',
    eventType: 'oauth_signup_success',
    message: 'Google OAuth 회원가입 성공 (프로필 자동 생성)',
    userId: user.id,
    metadata: {
      provider: 'google',
      email: user.email,
      name: newProfile.name,
    },
  });

  return {
    user,
    profile: newProfile,
    isNewUser: true,
  };
}
```

**동작 순서**:
1. `profiles.id`로 기존 프로필 검색
2. 없으면 `profiles.email`로 중복 확인 (보안)
   - 중복이면 에러 반환 (자동 연결하지 않음)
3. 중복 없으면 신규 프로필 생성

**반환값**:
- `user`: Supabase auth 사용자
- `profile`: profiles 테이블 레코드
- `isNewUser`: 신규 가입 여부

---

### 3.2 createOAuthProfile

**목적**: OAuth 사용자의 프로필 자동 생성

```ts
/**
 * OAuth 사용자 프로필 생성
 *
 * @param user - Supabase auth.users 사용자 객체
 * @returns 생성된 프로필
 */
static async createOAuthProfile(user: User): Promise<Profile> {
  const supabase = createServerClient();

  // Google에서 제공하는 정보 추출
  const email = user.email;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || null;

  if (!email) {
    throw new ApiError(
      'OAuth 사용자 이메일 정보를 찾을 수 없습니다',
      400,
      'OAUTH_EMAIL_MISSING'
    );
  }

  // profiles 테이블에 레코드 생성
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,          // auth.users.id와 동일
      email: email,
      name: name,
      phone: null,          // 추후 입력
      address: null,        // 추후 입력
    })
    .select()
    .single();

  if (error) {
    // 로그 기록
    await LogService.log({
      eventCategory: 'auth',
      eventType: 'oauth_profile_creation_failed',
      message: 'Google OAuth 프로필 생성 실패',
      userId: user.id,
      metadata: {
        email: email,
        error: error.message,
      },
      severity: 'error',
    });

    throw new ApiError(
      '프로필 생성에 실패했습니다',
      500,
      'PROFILE_CREATION_FAILED'
    );
  }

  return profile;
}
```

**저장 정보**:
- `id`: auth.users.id (UUID)
- `email`: Google 이메일 (필수)
- `name`: Google 이름 (선택, user_metadata에서 추출)
- `phone`: null
- `address`: null

**에러 처리**:
- 이메일 없음 → 400 에러
- DB 삽입 실패 → 500 에러 + 로그 기록

---

### 3.3 findProfileByEmail

**목적**: 이메일로 기존 프로필 검색 (계정 연결 용도)

```ts
/**
 * 이메일로 기존 프로필 조회
 *
 * @param email - 이메일 주소
 * @returns 프로필 또는 null
 */
static async findProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  return profile || null;
}
```

**사용 케이스**:
- 이메일 회원가입 후 동일 이메일로 Google OAuth 로그인
- 자동으로 기존 프로필과 연결

---

## 4. 프로필 관리 정책

### 4.1 프로필 생성 규칙

**신규 OAuth 사용자**:
- `profiles.id` = `auth.users.id`
- `email`, `name`은 Google에서 가져옴
- `phone`, `address`는 null (추후 마이페이지에서 입력)

**이메일 중복 처리 (보안 정책)**:
- 동일 이메일로 이미 가입된 계정이 있으면 **에러 반환**
- 자동 계정 연결하지 않음 (Pre-Account Takeover 공격 방지)
- 사용자에게 기존 계정으로 로그인하도록 안내
- 향후 로그인 후 설정에서 수동으로 계정 연결 기능 제공 예정

### 4.2 프로필 업데이트 정책

**재로그인 시**:
- 프로필 정보 자동 업데이트 **하지 않음**
- Google 이름이 변경되어도 profiles.name은 유지
- 사용자가 마이페이지에서 수동으로 수정 가능

**이유**: 사용자가 임의로 수정한 정보를 보존하기 위함

---

## 5. 에러 처리

### 5.1 이메일 없음

```ts
if (!user.email) {
  throw new ApiError(
    'OAuth 사용자 이메일 정보를 찾을 수 없습니다',
    400,
    'OAUTH_EMAIL_MISSING'
  );
}
```

### 5.2 프로필 생성 실패

```ts
if (error) {
  await LogService.log({
    eventCategory: 'auth',
    eventType: 'oauth_profile_creation_failed',
    message: 'Google OAuth 프로필 생성 실패',
    userId: user.id,
    metadata: { error: error.message },
    severity: 'error',
  });

  throw new ApiError(
    '프로필 생성에 실패했습니다',
    500,
    'PROFILE_CREATION_FAILED'
  );
}
```

---

## 6. 로깅

### 6.1 로그인 성공 (기존 사용자)

```ts
await LogService.log({
  eventCategory: 'auth',
  eventType: 'oauth_login_success',
  message: 'Google OAuth 로그인 성공',
  userId: user.id,
  metadata: {
    provider: 'google',
    email: user.email,
    isNewUser: false,
  },
});
```

### 6.2 회원가입 성공 (신규 사용자)

```ts
await LogService.log({
  eventCategory: 'auth',
  eventType: 'oauth_signup_success',
  message: 'Google OAuth 회원가입 성공 (프로필 자동 생성)',
  userId: user.id,
  metadata: {
    provider: 'google',
    email: user.email,
    name: profile.name,
  },
});
```

### 6.3 이메일 중복 감지

```ts
await LogService.log({
  eventCategory: 'auth',
  eventType: 'oauth_email_conflict',
  message: 'Google OAuth 이메일 중복 - 기존 계정 존재',
  userId: user.id,
  metadata: {
    email: user.email,
    existingProfileId: emailProfile.id,
  },
  severity: 'warning',
});
```

### 6.4 프로필 생성 실패

```ts
await LogService.log({
  eventCategory: 'auth',
  eventType: 'oauth_profile_creation_failed',
  message: 'Google OAuth 프로필 생성 실패',
  userId: user.id,
  metadata: {
    email: user.email,
    error: error.message,
  },
  severity: 'error',
});
```

---

## 7. 타입 정의

```ts
// types/auth.ts (추가)

import type { User } from '@supabase/supabase-js';
import type { Tables } from './database';

/**
 * OAuth 콜백 처리 결과
 */
export interface OAuthCallbackResult {
  user: User;
  profile: Tables<'profiles'>;
  isNewUser: boolean;
}

/**
 * OAuth 제공자
 */
export type OAuthProvider = 'google' | 'kakao' | 'naver' | 'apple';
```

---

## 8. 테스트 케이스

### 8.1 신규 사용자 (첫 로그인)

**입력**:
```ts
const user: User = {
  id: 'new-user-uuid',
  email: 'newuser@gmail.com',
  user_metadata: {
    full_name: '홍길동',
  },
  // ...
};
```

**예상 결과**:
```ts
{
  user: { id: 'new-user-uuid', ... },
  profile: {
    id: 'new-user-uuid',
    email: 'newuser@gmail.com',
    name: '홍길동',
    phone: null,
    address: null,
  },
  isNewUser: true
}
```

### 8.2 기존 사용자 (재로그인)

**입력**:
```ts
const user: User = {
  id: 'existing-user-uuid',
  email: 'existing@gmail.com',
  // ...
};

// profiles 테이블에 이미 존재
const existingProfile = {
  id: 'existing-user-uuid',
  email: 'existing@gmail.com',
  name: '김철수',
  phone: '010-1234-5678',
  address: '서울시 강남구...',
};
```

**예상 결과**:
```ts
{
  user: { id: 'existing-user-uuid', ... },
  profile: existingProfile,
  isNewUser: false
}
```

### 8.3 계정 연결 (동일 이메일)

**입력**:
```ts
// 1. 이메일 회원가입으로 이미 가입됨
const emailSignupProfile = {
  id: 'email-user-uuid',
  email: 'user@gmail.com',
  name: '이영희',
  // ...
};

// 2. 동일 이메일로 Google OAuth 로그인
const oauthUser: User = {
  id: 'oauth-user-uuid',  // 다른 UUID
  email: 'user@gmail.com', // 동일 이메일
  // ...
};
```

**예상 결과**:
```ts
{
  user: { id: 'oauth-user-uuid', ... },
  profile: emailSignupProfile,  // 기존 프로필 사용
  isNewUser: false
}
```

---

## 9. 보안 고려사항

### 9.1 이메일 검증

- Supabase Auth가 자동으로 이메일 검증 처리
- Google OAuth는 항상 검증된 이메일 제공
- `user.email_verified` 확인 불필요

### 9.2 프로필 접근 제어

- 프로필 조회/수정 시 항상 user.id 확인
- 다른 사용자의 프로필 접근 방지

### 9.3 SQL Injection 방지

- Supabase 클라이언트가 자동으로 파라미터 이스케이핑
- 직접 SQL 쿼리 사용 금지

### 9.4 Pre-Account Takeover (계정 탈취) 방지 ⭐

**공격 시나리오**:

1. 공격자가 피해자의 이메일 주소를 알아냄 (`victim@example.com`)
2. 피해자가 아직 해당 서비스에 가입하지 않은 상태
3. 공격자가 피해자의 이메일로 OAuth(Google) 가입을 시도
4. **만약 자동으로 이메일이 연결되면**: 공격자가 피해자 이메일로 계정 생성 성공
5. 피해자가 나중에 해당 이메일로 가입하려고 하면 "이미 가입된 이메일"이라는 메시지를 받음
6. 피해자는 비밀번호를 모르므로 "비밀번호 재설정"을 시도
7. **피해자의 이메일함에 접근 가능**하다면 계정 탈취 성공

**방어 전략 (현재 구현)**:

```ts
// lib/server/services/oauth.service.ts

// ✅ 이메일 중복 체크 - 자동 연결하지 않음
if (user.email) {
  const emailProfile = await this.findProfileByEmail(user.email);

  if (emailProfile) {
    // 🚫 자동으로 계정 연결하지 않음
    await LogService.log({
      eventCategory: 'auth',
      eventType: 'oauth_email_conflict',
      message: 'Google OAuth 이메일 중복 - 기존 계정 존재',
      userId: user.id,
      metadata: {
        email: user.email,
        existingProfileId: emailProfile.id,
      },
      severity: 'warning',
    });

    throw new ApiError(
      '이미 가입된 이메일입니다. 기존 계정으로 로그인하세요.',
      409,
      'EMAIL_ALREADY_EXISTS'
    );
  }
}
```

**왜 자동 연결하지 않는가?**

| 정책 | 장점 | 단점 |
|------|------|------|
| **자동 연결 금지** (현재) | - Pre-Account Takeover 공격 방지<br>- 사용자 의도 명확화<br>- 보안 로그 기록 가능 | - 사용자 불편 (이메일/OAuth 따로 가입 불가)<br>- 수동 계정 연결 필요 |
| 자동 연결 허용 | - 사용자 편의성 향상<br>- 매끄러운 UX | - **계정 탈취 위험**<br>- 의도하지 않은 계정 연결 |

**추가 방어 레이어**:

1. **이메일 인증 확인** (Supabase 자동 처리)
   ```ts
   // Google OAuth는 항상 검증된 이메일 제공
   if (!user.email_verified) {
     throw new ApiError('이메일 인증이 필요합니다', 403);
   }
   ```

2. **로그 모니터링**
   - `oauth_email_conflict` 이벤트 발생 시 알림
   - 같은 이메일로 반복 시도 시 Rate Limiting
   - 의심스러운 IP에서의 다량 OAuth 시도 감지

3. **향후 확장: 수동 계정 연결**
   ```ts
   // 사용자가 로그인 후 설정 페이지에서 수동으로 OAuth 연결
   async linkOAuthAccount(userId: string, oauthProvider: OAuthProvider) {
     // 1. 현재 로그인한 사용자 확인
     // 2. 해당 OAuth 계정의 이메일이 일치하는지 확인
     // 3. 사용자 동의 후 연결
     // 4. 로그 기록: 'oauth_account_linked'
   }
   ```

**실제 사례**:

```
시나리오 A (안전):
1. 사용자가 이메일 회원가입: user@gmail.com
2. 나중에 Google OAuth로 로그인 시도 (동일 이메일)
3. ✅ 에러 발생: "이미 가입된 이메일입니다. 기존 계정으로 로그인하세요."
4. 사용자는 이메일/비밀번호로 로그인
5. (향후) 설정에서 Google 계정 연결 가능

시나리오 B (공격 차단):
1. 공격자가 victim@gmail.com으로 이메일 회원가입 시도
2. 이메일 인증 메일이 피해자에게 전송됨
3. 피해자는 인증 링크를 클릭하지 않음 → 계정 활성화 안 됨
4. 공격자는 로그인 불가
5. ✅ 공격 실패

시나리오 C (공격 시도 - 방어 성공):
1. 공격자가 victim@gmail.com으로 Google OAuth 가입 시도
2. Google에서 인증됨 (공격자의 Google 계정 이메일이 아님)
3. ❌ 불가능: Google OAuth는 인증된 사용자의 이메일만 제공
4. 공격자는 자신의 이메일로만 OAuth 가입 가능
5. ✅ 공격 불가능
```

**결론**:

현재 구현은 **보안을 우선**하여 자동 계정 연결을 허용하지 않습니다. 사용자 편의성은 약간 떨어지지만, 계정 탈취 위험을 원천 차단합니다.

**향후 개선 방향**:
- 로그인 후 설정 페이지에서 수동 OAuth 계정 연결 기능 제공
- 이메일/비밀번호 계정과 OAuth 계정을 안전하게 통합
- 사용자가 직접 제어하는 계정 연결 플로우 제공

---

## 10. 향후 확장

### 10.1 다른 OAuth 제공자

**Kakao, Naver, Apple 지원 시**:

```ts
static async handleOAuthCallback(
  user: User,
  provider: OAuthProvider = 'google'
): Promise<OAuthCallbackResult> {
  // provider에 따라 user_metadata 구조가 다를 수 있음
  const name = this.extractNameFromMetadata(user, provider);

  // 나머지 로직은 동일
  // ...
}

private static extractNameFromMetadata(
  user: User,
  provider: OAuthProvider
): string | null {
  switch (provider) {
    case 'google':
      return user.user_metadata?.full_name || user.user_metadata?.name;
    case 'kakao':
      return user.user_metadata?.kakao_account?.profile?.nickname;
    case 'naver':
      return user.user_metadata?.name;
    default:
      return null;
  }
}
```

### 10.2 프로필 정보 추가 수집

첫 로그인 후 추가 정보 입력 플로우:

```ts
// isNewUser === true일 때
if (result.isNewUser && !result.profile.phone) {
  // 프론트엔드에서 추가 정보 입력 페이지로 리디렉션
  return {
    ...result,
    redirectTo: '/auth/complete-profile',
  };
}
```

---

## 11. 데이터베이스 스키마

### 11.1 profiles 테이블

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이메일 인덱스 (OAuth 계정 연결용)
CREATE INDEX idx_profiles_email ON profiles(email);
```

**중요**:
- `id`는 `auth.users.id`를 참조
- `email`은 UNIQUE 제약 조건 (계정 연결 정책)
- `created_at`은 최초 가입 시각 (OAuth든 이메일이든)

---

## 12. 참고 문서

- Supabase Auth: https://supabase.com/docs/guides/auth
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- OAuth 2.0 Spec: https://oauth.net/2/

---

**작성일**: 2025-01-01
**업데이트**: 필요 시 수정
