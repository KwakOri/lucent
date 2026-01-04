'use client';

import React from 'react';
import { Toast } from './Toast';
import type { Toast as ToastType, ToastPosition } from './types';

interface ToastContainerProps {
  toasts: ToastType[];
}

/**
 * ToastContainer
 *
 * 위치별로 토스트를 그룹화하여 렌더링
 */
export function ToastContainer({ toasts }: ToastContainerProps) {
  // 위치별로 토스트 그룹화
  const toastsByPosition = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, ToastType[]>);

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={getPositionClass(position as ToastPosition)}
          aria-live="polite"
          aria-atomic="false"
        >
          {positionToasts.map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </div>
      ))}
    </>
  );
}

function getPositionClass(position: ToastPosition): string {
  const baseClass = 'fixed z-[9999] flex flex-col gap-2 p-4 pointer-events-none';

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };

  return `${baseClass} ${positionClasses[position]}`;
}
