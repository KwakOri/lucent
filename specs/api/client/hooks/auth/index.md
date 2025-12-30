# Auth React Query Hooks

이 문서는 **인증(Auth) React Query Hooks** 구현을 정의한다.

> **범위**: 인증 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/auth/index.md`
> - API Routes: `/specs/api/server/routes/auth/index.md`

---

## 1. 개요

인증 관련 React Query Hooks는 인증 데이터의 **fetching, caching, 상태 관리**를 담당합니다.

**위치**: `/lib/client/hooks/`
**사용 대상**: React Component에서만
**역할**: 세션 관리, 로그인/로그아웃, 회원가입

---

## 2. QueryKey 구조

### 2.1 QueryKey 정의

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
} as const;
```

### 2.2 QueryKey 사용 예시

```ts
// 세션
queryKeys.auth.session
// → ['auth', 'session']

// 사용자 정보
queryKeys.auth.user
// → ['auth', 'user']
```

---

## 3. Query Hooks

### 3.1 useSession (세션 확인)

```ts
// lib/client/hooks/useSession.ts
import { useQuery } from '@tanstack/react-query';
import { AuthAPI } from '@/lib/client/services/auth.api';
import { queryKeys } from './query-keys';

export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => AuthAPI.getSession(),
    retry: false, // 인증 실패 시 재시도 안 함
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true, // 탭 전환 시 재확인
  });
}
```

**사용 예시**:

```tsx
function App() {
  const { data: session, isLoading, isError } = useSession();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !session?.data?.user) {
    return <LoginPage />;
  }

  return <Dashboard user={session.data.user} />;
}
```

### 3.2 useUser (현재 사용자)

```ts
// lib/client/hooks/useUser.ts
import { useSession } from './useSession';

export function useUser() {
  const { data: session, isLoading, isError } = useSession();

  return {
    user: session?.data?.user || null,
    isLoading,
    isAuthenticated: !!session?.data?.user && !isError,
  };
}
```

**사용 예시**:

```tsx
function Header() {
  const { user, isAuthenticated } = useUser();

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <span>안녕하세요, {user?.name || user?.email}님</span>
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </header>
  );
}
```

---

## 4. Mutation Hooks

### 4.1 useSendVerification (이메일 인증 요청)

```ts
// lib/client/hooks/useSendVerification.ts
import { useMutation } from '@tanstack/react-query';
import { AuthAPI, type SendVerificationInput } from '@/lib/client/services/auth.api';

export function useSendVerification() {
  return useMutation({
    mutationFn: (data: SendVerificationInput) => AuthAPI.sendVerification(data),
  });
}
```

**사용 예시**:

```tsx
function SignUpStep1() {
  const [email, setEmail] = useState('');
  const sendVerification = useSendVerification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendVerification.mutateAsync({ email });
      toast.success('인증 이메일이 발송되었습니다');
      router.push('/signup/verify');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
      />
      <button disabled={sendVerification.isLoading}>
        {sendVerification.isLoading ? '발송 중...' : '인증 이메일 받기'}
      </button>
    </form>
  );
}
```

### 4.2 useSignUp (회원가입)

```ts
// lib/client/hooks/useSignUp.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthAPI, type SignUpInput } from '@/lib/client/services/auth.api';
import { queryKeys } from './query-keys';

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpInput) => AuthAPI.signUp(data),
    onSuccess: (data) => {
      // 세션 캐시 업데이트
      queryClient.setQueryData(queryKeys.auth.session, data);
    },
  });
}
```

**사용 예시**:

```tsx
function SignUpForm() {
  const signUp = useSignUp();
  const router = useRouter();

  const handleSubmit = async (data: SignUpInput) => {
    try {
      await signUp.mutateAsync(data);
      toast.success('회원가입이 완료되었습니다');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'EMAIL_ALREADY_EXISTS') {
          toast.error('이미 사용 중인 이메일입니다');
        } else {
          toast.error(error.message);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드 */}
      <button disabled={signUp.isLoading}>
        {signUp.isLoading ? '처리 중...' : '회원가입'}
      </button>
    </form>
  );
}
```

### 4.3 useLogin (로그인)

```ts
// lib/client/hooks/useLogin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthAPI, type LoginInput } from '@/lib/client/services/auth.api';
import { queryKeys } from './query-keys';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => AuthAPI.login(data),
    onSuccess: (data) => {
      // 세션 캐시 업데이트
      queryClient.setQueryData(queryKeys.auth.session, data);
    },
  });
}
```

**사용 예시**:

```tsx
function LoginForm() {
  const login = useLogin();
  const router = useRouter();

  const handleSubmit = async (data: LoginInput) => {
    try {
      await login.mutateAsync(data);
      toast.success('로그인되었습니다');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'INVALID_CREDENTIALS') {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
        } else {
          toast.error(error.message);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" placeholder="이메일" />
      <input type="password" name="password" placeholder="비밀번호" />
      <button disabled={login.isLoading}>
        {login.isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
```

### 4.4 useLogout (로그아웃)

```ts
// lib/client/hooks/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthAPI } from '@/lib/client/services/auth.api';
import { queryKeys } from './query-keys';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthAPI.logout(),
    onSuccess: () => {
      // 모든 캐시 초기화
      queryClient.clear();
    },
  });
}
```

**사용 예시**:

```tsx
function LogoutButton() {
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success('로그아웃되었습니다');
      router.push('/login');
    } catch (error) {
      toast.error('로그아웃 실패');
    }
  };

  return (
    <button onClick={handleLogout} disabled={logout.isLoading}>
      {logout.isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
```

### 4.5 useResetPassword (비밀번호 재설정)

```ts
// lib/client/hooks/useResetPassword.ts
import { useMutation } from '@tanstack/react-query';
import { AuthAPI, type ResetPasswordInput } from '@/lib/client/services/auth.api';

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordInput) => AuthAPI.resetPassword(data),
  });
}
```

**사용 예시**:

```tsx
function ForgotPasswordForm() {
  const resetPassword = useResetPassword();

  const handleSubmit = async (email: string) => {
    try {
      await resetPassword.mutateAsync({ email });
      toast.success('비밀번호 재설정 이메일이 발송되었습니다');
    } catch (error) {
      toast.error('이메일 발송 실패');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="이메일" />
      <button disabled={resetPassword.isLoading}>
        {resetPassword.isLoading ? '발송 중...' : '재설정 링크 받기'}
      </button>
    </form>
  );
}
```

---

## 5. 실전 예시

### 5.1 Protected Route

```tsx
// components/ProtectedRoute.tsx
import { useSession } from '@/lib/client/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, isError } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !session?.data?.user)) {
      router.push('/login');
    }
  }, [isLoading, isError, session, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !session?.data?.user) {
    return null;
  }

  return <>{children}</>;
}
```

### 5.2 로그인 페이지

```tsx
// app/login/page.tsx
'use client';

import { useLogin } from '@/lib/client/hooks/useLogin';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login.mutateAsync({ email, password });
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'INVALID_CREDENTIALS') {
          alert('이메일 또는 비밀번호가 올바르지 않습니다');
        }
      }
    }
  };

  return (
    <div>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
        />
        <button type="submit" disabled={login.isLoading}>
          {login.isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
```

### 5.3 회원가입 플로우

```tsx
// app/signup/page.tsx
'use client';

import { useSendVerification } from '@/lib/client/hooks/useSendVerification';
import { useSignUp } from '@/lib/client/hooks/useSignUp';
import { useState } from 'react';

export default function SignUpPage() {
  const [step, setStep] = useState<'email' | 'verify' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const sendVerification = useSendVerification();
  const signUp = useSignUp();

  // 1단계: 이메일 인증 요청
  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendVerification.mutateAsync({ email });
      setStep('verify');
      alert('인증 이메일이 발송되었습니다');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      }
    }
  };

  // 3단계: 회원가입
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp.mutateAsync({ email, password, name });
      alert('회원가입이 완료되었습니다');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      }
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendVerification}>
        <h1>이메일 인증</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
        />
        <button disabled={sendVerification.isLoading}>
          {sendVerification.isLoading ? '발송 중...' : '인증 이메일 받기'}
        </button>
      </form>
    );
  }

  if (step === 'verify') {
    return (
      <div>
        <h1>이메일 확인</h1>
        <p>이메일로 발송된 링크를 클릭해주세요.</p>
        <p>인증이 완료되면 회원가입을 진행할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp}>
      <h1>회원가입</h1>
      <input
        type="email"
        value={email}
        disabled
        placeholder="이메일"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 (선택)"
      />
      <button disabled={signUp.isLoading}>
        {signUp.isLoading ? '처리 중...' : '회원가입'}
      </button>
    </form>
  );
}
```

---

## 6. 에러 처리

### 6.1 Hook 레벨 에러 처리

```ts
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthAPI.login,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.session, data);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('Login error:', error.message, error.errorCode);
      }
    },
  });
}
```

### 6.2 Component 레벨 에러 처리

```tsx
const login = useLogin();

const handleLogin = async (data: LoginInput) => {
  try {
    await login.mutateAsync(data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.errorCode === 'INVALID_CREDENTIALS') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else if (error.statusCode === 429) {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
      } else {
        setError(error.message);
      }
    }
  }
};
```

---

## 7. 캐시 관리

### 7.1 로그인 시 세션 캐시 업데이트

```ts
onSuccess: (data) => {
  queryClient.setQueryData(queryKeys.auth.session, data);
}
```

### 7.2 로그아웃 시 모든 캐시 초기화

```ts
onSuccess: () => {
  queryClient.clear(); // 모든 캐시 삭제
}
```

### 7.3 세션 만료 시 자동 로그아웃

```ts
export function useSession() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => AuthAPI.getSession(),
    retry: false,
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        // 세션 만료 → 모든 캐시 초기화
        queryClient.clear();
      }
    },
  });
}
```

---

## 8. 성능 최적화

### 8.1 staleTime 설정

```ts
// 세션: 5분
staleTime: 1000 * 60 * 5
```

### 8.2 refetchOnWindowFocus

탭 전환 시 세션 재확인:

```ts
refetchOnWindowFocus: true
```

---

## 9. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/auth/index.md`
- API Routes: `/specs/api/server/routes/auth/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
