/**
 * Auth API Client
 *
 * 인증 관련 API 호출
 */

import { apiClient } from "@/lib/client/utils/api-client";
import type { ApiResponse } from "@/types";
import type { AuthUser } from "@/types/auth";

/**
 * 이메일 인증 코드 발송 요청 데이터
 */
export interface SendVerificationData {
  email: string;
  password: string;
}

/**
 * Auth API
 */
export const AuthAPI = {
  /**
   * 이메일 인증 코드 발송 (회원가입용)
   */
  async sendVerification(
    data: SendVerificationData
  ): Promise<ApiResponse<{ email: string; expiresIn: number }>> {
    return apiClient.post("/api/auth/send-verification", data);
  },

  /**
   * 6자리 코드 검증
   */
  async verifyCode(data: {
    email: string;
    code: string;
  }): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post("/api/auth/verify-code", data);
  },

  /**
   * 검증 토큰으로 회원가입 (자동 로그인)
   */
  async signUpWithToken(data: {
    email: string;
    verificationToken: string;
  }): Promise<ApiResponse<{ user: AuthUser; session: any }>> {
    return apiClient.post("/api/auth/signup", data);
  },
};
