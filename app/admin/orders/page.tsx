'use client';

import { useOrders } from '@/lib/client/hooks/useOrders';
import { OrdersTable } from '@/src/components/admin/orders/OrdersTable';

export default function AdminOrdersPage() {
  const { data, isLoading, error } = useOrders({ limit: '100' });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">주문 목록을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객 주문을 관리합니다
        </p>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <OrdersTable orders={data?.data || []} />
      )}
    </div>
  );
}
