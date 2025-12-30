/**
 * Order Detail API Routes
 *
 * GET /api/orders/:id - 주문 상세 조회
 * PATCH /api/orders/:id - 주문 상태 변경 (관리자)
 */

import { NextRequest } from 'next/server';
import { OrderService } from '@/lib/server/services/order.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser, isAdmin } from '@/lib/server/utils/supabase';
import type { UpdateOrderStatusRequest } from '@/types/api';

/**
 * 주문 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const adminCheck = await isAdmin();

    const order = await OrderService.getOrderById(
      params.id,
      adminCheck ? undefined : user.id // 관리자가 아니면 본인 확인
    );

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 주문 상태 변경 (관리자)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return handleApiError(new Error('관리자 권한이 필요합니다'));
    }

    const body = await request.json() as UpdateOrderStatusRequest;
    const { status } = body;

    if (!status) {
      return handleApiError(new Error('변경할 상태를 지정해주세요'));
    }

    const order = await OrderService.updateOrderStatus(
      params.id,
      status,
      user.id
    );

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
