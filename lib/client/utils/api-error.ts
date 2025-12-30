/**
 * API Error Class
 *
 * 클라이언트 측 API 에러 처리
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * 에러가 인증 관련 에러인지 확인
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * 에러가 Not Found 에러인지 확인
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * 에러가 서버 에러인지 확인
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * 에러가 클라이언트 에러인지 확인
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}
