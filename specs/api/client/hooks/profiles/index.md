# Profiles React Query Hooks

이 문서는 **프로필(Profiles) React Query Hooks** 구현을 정의한다.

> **범위**: 프로필 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/profiles/index.md`
> - API Routes: `/specs/api/server/routes/profiles/index.md`

---

## 1. QueryKey 구조

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  profiles: {
    all: ['profiles'] as const,
    me: () => [...queryKeys.profiles.all, 'me'] as const,
  },
} as const;
```

---

## 2. Query Hooks

### 2.1 useProfile (내 프로필 조회)

```ts
// lib/client/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { ProfilesAPI } from '@/lib/client/services/profiles.api';
import { queryKeys } from './query-keys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profiles.me(),
    queryFn: () => ProfilesAPI.getMyProfile(),
    staleTime: 1000 * 60 * 10, // 10분
    retry: false, // 인증 에러 시 재시도 안 함
  });
}
```

**사용 예시**:

```tsx
function ProfilePage() {
  const { data, isLoading, error } = useProfile();

  if (isLoading) return <Loading />;
  if (error) {
    if (error.statusCode === 401) {
      // 로그인 필요
      return <Navigate to="/login" />;
    }
    return <Error message={error.message} />;
  }

  const profile = data?.data;
  if (!profile) return null;

  return (
    <div>
      <h1>{profile.name || '이름 없음'}</h1>
      <p>{profile.email}</p>
      <p>{profile.phone}</p>
      <p>{profile.address}</p>
    </div>
  );
}
```

---

## 3. Mutation Hooks

### 3.1 useUpdateProfile (프로필 수정)

```ts
// lib/client/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilesAPI, type UpdateProfileInput } from '@/lib/client/services/profiles.api';
import { queryKeys } from './query-keys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => ProfilesAPI.updateMyProfile(data),
    onSuccess: (response) => {
      // 캐시 업데이트
      queryClient.setQueryData(queryKeys.profiles.me(), response);
    },
  });
}
```

**사용 예시**:

```tsx
function ProfileEditForm() {
  const { data } = useProfile();
  const updateProfile = useUpdateProfile();

  const profile = data?.data;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateProfile.mutate(
      {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
      },
      {
        onSuccess: () => {
          alert('프로필이 업데이트되었습니다.');
        },
        onError: (error) => {
          if (error.errorCode === 'VALIDATION_ERROR') {
            // 검증 에러 표시
            console.error(error.errors);
          } else {
            alert(error.message);
          }
        },
      }
    );
  };

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>이름</label>
        <input
          type="text"
          name="name"
          defaultValue={profile.name || ''}
          placeholder="홍길동"
        />
      </div>

      <div>
        <label>연락처</label>
        <input
          type="text"
          name="phone"
          defaultValue={profile.phone || ''}
          placeholder="010-1234-5678"
        />
      </div>

      <div>
        <label>주소</label>
        <textarea
          name="address"
          defaultValue={profile.address || ''}
          placeholder="서울시 강남구 테헤란로 123"
        />
      </div>

      <button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}
```

---

## 4. 검증 에러 처리

### 4.1 검증 에러 표시

```tsx
function ProfileEditForm() {
  const updateProfile = useUpdateProfile();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        setValidationErrors({});
        alert('프로필이 업데이트되었습니다.');
      },
      onError: (error) => {
        if (error.errorCode === 'VALIDATION_ERROR') {
          setValidationErrors(error.errors || {});
        } else {
          alert(error.message);
        }
      },
    });
  };

  return (
    <form>
      <div>
        <input type="text" name="name" />
        {validationErrors.name && (
          <span className="error">{validationErrors.name}</span>
        )}
      </div>

      <div>
        <input type="text" name="phone" />
        {validationErrors.phone && (
          <span className="error">{validationErrors.phone}</span>
        )}
      </div>

      <div>
        <textarea name="address" />
        {validationErrors.address && (
          <span className="error">{validationErrors.address}</span>
        )}
      </div>

      <button type="submit">저장</button>
    </form>
  );
}
```

---

## 5. 주문 페이지에서 프로필 활용

### 5.1 배송 정보 기본값으로 사용

```tsx
function CheckoutPage() {
  const { data: profileData } = useProfile();
  const profile = profileData?.data;

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // 프로필 로드 시 배송 정보 기본값 설정
  useEffect(() => {
    if (profile) {
      setShippingInfo({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSubmit = () => {
    // 주문 생성 시 shippingInfo 사용
    createOrder({
      shipping_name: shippingInfo.name,
      shipping_phone: shippingInfo.phone,
      shipping_address: shippingInfo.address,
      // ...
    });
  };

  return (
    <form>
      <h2>배송 정보</h2>
      <input
        value={shippingInfo.name}
        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
        placeholder="수령인"
      />
      <input
        value={shippingInfo.phone}
        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
        placeholder="연락처"
      />
      <textarea
        value={shippingInfo.address}
        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
        placeholder="배송 주소"
      />
      <button onClick={handleSubmit}>주문하기</button>
    </form>
  );
}
```

---

## 6. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/profiles/index.md`
- API Routes: `/specs/api/server/routes/profiles/index.md`
