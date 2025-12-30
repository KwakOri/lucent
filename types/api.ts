/**
 * API Request/Response Types
 *
 * API 요청/응답 관련 타입 정의
 */

import { TablesInsert, TablesUpdate, Enums } from './database';

/**
 * Product API Types
 */
export interface CreateProductRequest extends TablesInsert<'products'> {}

export interface UpdateProductRequest extends TablesUpdate<'products'> {}

export interface GetProductsQuery {
  page?: string;
  limit?: string;
  artistId?: string;
  type?: Enums<'product_type'>;
  isActive?: string;
  sortBy?: 'created_at' | 'price' | 'name';
  order?: 'asc' | 'desc';
}

/**
 * Order API Types
 */
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingMemo?: string;
}

export interface UpdateOrderStatusRequest {
  status: Enums<'order_status'>;
}

export interface GetOrdersQuery {
  page?: string;
  limit?: string;
  status?: Enums<'order_status'>;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Profile API Types
 */
export interface UpdateProfileRequest extends TablesUpdate<'profiles'> {}

/**
 * Log API Types
 */
export interface GetLogsQuery {
  page?: string;
  limit?: string;
  eventType?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Auth API Types
 */
export interface SendVerificationRequest {
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  token: string;
  newPassword: string;
}
