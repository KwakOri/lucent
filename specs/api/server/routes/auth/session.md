# Auth – Session Spec

이 문서는 **세션 확인 및 갱신(Session)** API 스펙을 정의한다.

---

## 1. 기본 원칙

- 세션은 JWT 기반으로 관리된다
- HTTP-only cookie에 저장되어 XSS 공격 방지
- 세션 확인은 모든 보호된 페이지에서 호출된다
- 세션 갱신은 자동으로 처리된다

---

## 2. API 스펙

### 2.1 엔드포인트

```
GET /api/auth/session
```

### 2.2 인증

- **선택**: 세션이 있으면 사용자 정보 반환, 없으면 null 반환
- 401 에러를 반환하지 않고, 세션 없음을 정상 응답으로 처리

### 2.3 요청

**Headers**

```
Cookie: sb-access-token={token}
```

**Query Parameters**

- 없음

### 2.4 응답

**세션 있음 (200 OK)**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "session": {
      "accessToken": "jwt-token",
      "expiresAt": "2024-01-08T00:00:00Z"
    }
  }
}
```

**세션 없음 (200 OK)**

```json
{
  "status": "success",
  "data": {
    "user": null,
    "session": null
  }
}
```

**서버 에러 (500)**

```json
{
  "status": "error",
  "message": "세션 확인 중 오류가 발생했습니다",
  "errorCode": "SESSION_ERROR"
}
```

---

## 3. 처리 로직

### 3.1 서버 처리 흐름

```
1. HTTP-only cookie에서 JWT 읽기
   ↓
2. Supabase Auth로 세션 확인
   ↓
3-1. 세션 유효 → 사용자 정보 반환
3-2. 세션 만료 → null 반환
3-3. 세션 갱신 필요 → 자동 갱신 후 반환
```

### 3.2 구현 예시

```ts
// app/api/auth/session/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return Response.json(
      {
        status: 'error',
        message: '세션 확인 중 오류가 발생했습니다',
        errorCode: 'SESSION_ERROR'
      },
      { status: 500 }
    );
  }

  if (!session) {
    return Response.json({
      status: 'success',
      data: {
        user: null,
        session: null
      }
    });
  }

  // 세션이 유효한 경우
  return Response.json({
    status: 'success',
    data: {
      user: {
        id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at
      },
      session: {
        accessToken: session.access_token,
        expiresAt: new Date(session.expires_at! * 1000).toISOString()
      }
    }
  });
}
```

---

## 4. 클라이언트 처리

### 4.1 Service Layer

```ts
// services/auth.service.ts
export class AuthService {
  static async getSession(): Promise<ApiResponse<SessionData>> {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });
    return response.json();
  }
}
```

### 4.2 React Query Hook

```ts
// hooks/auth/useSession.ts
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/services/auth.service';

export const useSession = () => {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: AuthService.getSession,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

### 4.3 사용 예시

```tsx
// components/AuthProvider.tsx
import { useSession } from '@/hooks/auth/useSession';

export const AuthProvider = ({ children }) => {
  const { data, isLoading } = useSession();

  if (isLoading) {
    return <Loading />;
  }

  const user = data?.data?.user;

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

```tsx
// app/mypage/layout.tsx
'use client';
import { useSession } from '@/hooks/auth/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MypageLayout({ children }) {
  const { data } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!data?.data?.user) {
      router.push('/login');
    }
  }, [data, router]);

  if (!data?.data?.user) {
    return <Loading />;
  }

  return <>{children}</>;
}
```

---

## 5. 세션 갱신 정책

### 5.1 자동 갱신

- Supabase는 기본적으로 세션을 자동 갱신한다
- Access Token이 만료되기 전에 Refresh Token으로 갱신
- 클라이언트는 별도 처리 불필요

### 5.2 갱신 실패 시

- Refresh Token도 만료된 경우
- 사용자를 로그인 페이지로 리다이렉트
- 현재 페이지 URL을 저장하여 로그인 후 복귀 가능

---

## 6. 보호된 라우트 처리

### 6.1 Middleware 활용

```ts
// middleware.ts
import { createClient } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  // 보호된 경로
  const protectedPaths = ['/mypage', '/orders'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/mypage/:path*', '/orders/:path*']
};
```

---

## 7. 에러 케이스

| 상황              | HTTP Status | errorCode       | 처리 방법                   |
| ----------------- | ----------- | --------------- | --------------------------- |
| 세션 없음         | 200         | -               | user: null 반환             |
| 세션 만료         | 200         | -               | user: null 반환, 리다이렉트 |
| Supabase 에러     | 500         | SESSION_ERROR   | 에러 메시지 표시            |
| 네트워크 에러     | 500         | NETWORK_ERROR   | 재시도 안내                 |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

- React Query로 5분간 캐싱
- Window focus 시 재검증
- 세션 변경 시 invalidate

### 8.2 불필요한 요청 방지

- 이미 세션이 있는 경우 재요청 방지
- 로그인/로그아웃 시에만 강제 갱신

---

## 9. 확장 고려사항

- 세션 만료 알림 (만료 5분 전)
- 여러 탭에서 세션 동기화
- 세션 이력 관리
- 디바이스별 세션 관리
