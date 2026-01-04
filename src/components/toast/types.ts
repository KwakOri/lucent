/**
 * Toast Notification System Types
 *
 * 모달과 달리 제네릭 타입, Promise 불필요
 * 단순히 문자열 메시지만 표시
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface ToastOptions {
  /** 토스트 타입 (기본: 'info') */
  type?: ToastType;

  /** 자동 닫힘 시간 (ms, 기본: 6000) */
  duration?: number;

  /** 토스트 위치 (기본: 'bottom-right') */
  position?: ToastPosition;

  /** X 버튼 표시 여부 (기본: true) */
  dismissible?: boolean;
}

export interface Toast {
  /** 고유 ID */
  id: string;

  /** 토스트 메시지 */
  message: string;

  /** 토스트 타입 */
  type: ToastType;

  /** 자동 닫힘 시간 (ms) */
  duration: number;

  /** 토스트 위치 */
  position: ToastPosition;

  /** X 버튼 표시 여부 */
  dismissible: boolean;

  /** 생성 시간 */
  createdAt: number;
}

export interface ToastContextValue {
  /** 현재 표시 중인 토스트 목록 */
  toasts: Toast[];

  /** 토스트 추가 (ID 반환, Promise 없음) */
  addToast: (message: string, options?: ToastOptions) => string;

  /** 토스트 제거 */
  removeToast: (id: string) => void;

  /** 모든 토스트 제거 */
  clearAll: () => void;
}
