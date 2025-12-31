import { notFound } from 'next/navigation';
import { OrderService } from '@/lib/server/services/order.service';
import { OrderDetail } from '@/src/components/admin/orders/OrderDetail';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await OrderService.getOrderById(id);
  } catch (error) {
    notFound();
  }

  return (
    <div>
      <OrderDetail order={order} />
    </div>
  );
}
