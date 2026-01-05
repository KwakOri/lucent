/**
 * Private Route Layout
 *
 * 로그인이 필요한 페이지들의 레이아웃
 * - 비로그인 사용자는 /login으로 리다이렉트
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/client/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

export default function PrivateRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      // 현재 페이지를 redirect 파라미터로 전달
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading size="lg" />
      </div>
    );
  }

  // 로그인하지 않은 경우 빈 화면 (리다이렉트 중)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading size="lg" />
      </div>
    );
  }

  // 로그인된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}
