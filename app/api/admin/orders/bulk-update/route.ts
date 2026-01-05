/**
 * Bulk Update Orders API
 *
 * 관리자 전용: 여러 주문의 상태를 일괄 변경
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/server/services/order.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { createServerClient } from '@/lib/server/utils/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // 관리자 권한 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    // TODO: 관리자 권한 체크 (실제 구현 시 추가)
    // const isAdmin = await checkAdminRole(user.id);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    // }

    const body = await request.json();
    const { orderIds, status } = body;

    // 입력 검증
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '주문 ID 배열이 필요합니다' }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: '상태값이 필요합니다' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'PAID', 'MAKING', 'SHIPPING', 'DONE'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다' }, { status: 400 });
    }

    // 일괄 업데이트 실행 (OrderService 사용하여 item_status도 함께 업데이트)
    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const result = await OrderService.updateOrderStatus(
          orderId,
          status as 'PENDING' | 'PAID' | 'MAKING' | 'SHIPPING' | 'DONE',
          user.id
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
        errors.push({ orderId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // 일부 실패한 경우에도 성공한 것들은 반환
    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json({ error: '모든 주문 업데이트에 실패했습니다', errors }, { status: 500 });
    }

    return successResponse({
      message: `${results.length}개 주문의 상태가 변경되었습니다`,
      updatedCount: results.length,
      updatedOrders: results.map(r => r.order),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
