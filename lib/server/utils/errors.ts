/**
 * API Error Class
 *
 * 일관된 에러 응답을 위한 커스텀 에러 클래스
 */

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * 유효성 검사 에러
 */
export class ValidationError extends ApiError {
  constructor(message: string, errorCode: string = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
    this.name = 'ValidationError';
  }
}

/**
 * 인증 에러
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = '인증이 필요합니다', errorCode: string = 'UNAUTHENTICATED') {
    super(message, 401, errorCode);
    this.name = 'AuthenticationError';
  }
}

/**
 * 권한 에러
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = '권한이 없습니다', errorCode: string = 'UNAUTHORIZED') {
    super(message, 403, errorCode);
    this.name = 'AuthorizationError';
  }
}

/**
 * 리소스를 찾을 수 없음
 */
export class NotFoundError extends ApiError {
  constructor(message: string = '리소스를 찾을 수 없습니다', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
    this.name = 'NotFoundError';
  }
}
