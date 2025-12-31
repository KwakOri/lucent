import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/server/utils/supabase';
import { OrderDetail } from '@/src/components/admin/orders/OrderDetail';

async function getOrder(id: string) {
  const supabase = await createServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        product:products (
          id,
          name,
          type,
          slug,
          main_image:images!main_image_id (
            public_url,
            cdn_url
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  return order;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div>
      <OrderDetail order={order} />
    </div>
  );
}
