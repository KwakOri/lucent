'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useToastContext } from './ToastProvider';
import type { Toast as ToastType, ToastType as ToastTypeEnum } from './types';

interface ToastProps {
  toast: ToastType;
}

/**
 * Toast 컴포넌트
 *
 * 개별 토스트 UI 렌더링 및 자동 닫힘
 */
export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastContext();

  // 자동 닫힘 타이머
  useEffect(() => {
    if (toast.duration === Infinity) return;

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const handleDismiss = () => {
    removeToast(toast.id);
  };

  const { icon, bgClass, iconClass } = getToastStyles(toast.type);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={clsx(
        'pointer-events-auto',
        'flex items-start gap-3 p-4 rounded-lg shadow-lg',
        'min-w-[320px] max-w-[480px]',
        'animate-slide-in',
        bgClass
      )}
    >
      {/* Icon */}
      <div className={clsx('flex-shrink-0', iconClass)}>
        {icon}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium text-gray-900">
        {toast.message}
      </div>

      {/* Dismiss Button */}
      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="알림 닫기"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function getToastStyles(type: ToastTypeEnum) {
  const styles = {
    success: {
      icon: <CheckCircle size={20} />,
      bgClass: 'bg-green-50 border border-green-200',
      iconClass: 'text-green-600',
    },
    error: {
      icon: <XCircle size={20} />,
      bgClass: 'bg-red-50 border border-red-200',
      iconClass: 'text-red-600',
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bgClass: 'bg-yellow-50 border border-yellow-200',
      iconClass: 'text-yellow-600',
    },
    info: {
      icon: <Info size={20} />,
      bgClass: 'bg-blue-50 border border-blue-200',
      iconClass: 'text-blue-600',
    },
  };

  return styles[type];
}
