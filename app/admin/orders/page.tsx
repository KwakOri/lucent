import { createServerClient } from '@/lib/server/utils/supabase';
import { OrdersTable } from '@/src/components/admin/orders/OrdersTable';

async function getOrders() {
  const supabase = await createServerClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      buyer_name,
      buyer_email,
      total_amount,
      status,
      created_at,
      order_items (
        id,
        product:products (
          id,
          name,
          type
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return orders || [];
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

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
