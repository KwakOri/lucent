/**
 * API Client
 *
 * fetch 기반 HTTP 클라이언트
 */

import { ApiError } from './api-error';

class APIClient {
  private baseURL: string;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  /**
   * HTTP 요청 공통 처리
   */
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // 쿠키 포함
      ...options,
    });

    // JSON 파싱
    const data = await response.json();

    // 에러 처리
    if (!response.ok) {
      throw new ApiError(
        data.message || '요청 실패',
        response.status,
        data.errorCode
      );
    }

    return data;
  }

  /**
   * GET 요청
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST 요청
   */
  async post<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH 요청
   */
  async patch<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT 요청
   */
  async put<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE 요청
   */
  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
