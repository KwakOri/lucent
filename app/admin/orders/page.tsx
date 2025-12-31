import { OrderService } from '@/lib/server/services/order.service';
import { OrdersTable } from '@/src/components/admin/orders/OrdersTable';

export default async function AdminOrdersPage() {
  const { orders } = await OrderService.getAllOrders({ limit: 100 });

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
      <OrdersTable orders={orders} />
    </div>
  );
}
