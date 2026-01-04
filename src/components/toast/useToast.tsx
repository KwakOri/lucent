'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToastContext } from './ToastProvider';
import type { ToastOptions } from './types';

interface UseToastReturn {
  showToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

/**
 * useToast Hook
 *
 * 토스트 열기/닫기 API 제공
 * Modal과 달리 Promise 없이 단순히 ID만 반환
 *
 * 중요: ToastProvider가 전역적으로 Portal을 렌더링하므로
 * 각 컴포넌트에서 renderToasts()를 호출할 필요 없음
 */
export function useToast(): UseToastReturn {
  const context = useToastContext();
  const toastIdsRef = useRef<Set<string>>(new Set());

  const showToast = useCallback(
    (message: string, options?: ToastOptions): string => {
      const id = context.addToast(message, options);
      toastIdsRef.current.add(id);
      return id;
    },
    [context]
  );

  const dismissToast = useCallback(
    (id: string) => {
      context.removeToast(id);
      toastIdsRef.current.delete(id);
    },
    [context]
  );

  const dismissAll = useCallback(() => {
    context.clearAll();
    toastIdsRef.current.clear();
  }, [context]);

  // Cleanup: 컴포넌트 언마운트 시에만 해당 컴포넌트에서 생성한 토스트 제거
  useEffect(() => {
    const removeToastRef = context.removeToast;
    return () => {
      toastIdsRef.current.forEach((id) => {
        removeToastRef(id);
      });
      toastIdsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 마운트/언마운트 시에만 실행

  return {
    showToast,
    dismissToast,
    dismissAll,
  };
}
