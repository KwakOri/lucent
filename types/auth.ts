/**
 * Auth Types
 *
 * Supabase Auth 관련 타입 정의
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * Supabase User 타입
 */
export type AuthUser = User;

/**
 * Supabase Session 타입
 */
export type AuthSession = Session;

/**
 * Auth Response 타입
 */
export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

/**
 * 회원가입 Input
 */
export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

/**
 * 로그인 Input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * 이메일 인증 결과
 */
export interface EmailVerificationResult {
  email: string;
}

/**
 * 비밀번호 재설정 결과
 */
export interface PasswordResetResult {
  email: string;
}

/**
 * 세션 Response (nullable)
 */
export type SessionResponse = AuthResponse | null;
