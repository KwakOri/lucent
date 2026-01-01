'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from './ToastProvider';
import { ToastContainer } from './ToastContainer';
import type { ToastOptions } from './types';

interface UseToastReturn {
  showToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  renderToasts: () => React.ReactPortal | null;
}

/**
 * useToast Hook
 *
 * 토스트 열기/닫기 API 제공
 * Modal과 달리 Promise 없이 단순히 ID만 반환
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

  // Cleanup: 컴포넌트 언마운트 시 해당 컴포넌트에서 생성한 토스트 제거
  useEffect(() => {
    return () => {
      toastIdsRef.current.forEach((id) => {
        context.removeToast(id);
      });
      toastIdsRef.current.clear();
    };
  }, [context]);

  const renderToasts = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const toastRoot = document.getElementById('toast-root');
    if (!toastRoot) {
      console.warn('toast-root element not found');
      return null;
    }

    return createPortal(<ToastContainer toasts={context.toasts} />, toastRoot);
  }, [context.toasts]);

  return {
    showToast,
    dismissToast,
    dismissAll,
    renderToasts,
  };
}
