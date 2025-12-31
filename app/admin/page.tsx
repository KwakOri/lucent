import { createServerClient } from '@/lib/server/utils/supabase';

async function getStats() {
  const supabase = await createServerClient();

  // 최근 주문 수
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // 입금 대기 주문
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING_PAYMENT');

  // 활성 상품 수
  const { count: activeProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // 활성 아티스트 수
  const { count: activeArtists } = await supabase
    .from('artists')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    activeProducts: activeProducts || 0,
    activeArtists: activeArtists || 0,
  };
}

async function getRecentOrders() {
  const supabase = await createServerClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      buyer_name,
      total_amount,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  return orders || [];
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '입금대기',
  PAID: '결제완료',
  PREPARING: '준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소됨',
};

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentOrders = await getRecentOrders();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lucent Management 관리 현황
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">전체 주문</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalOrders}
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">입금 대기</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
            {stats.pendingOrders}
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">활성 상품</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.activeProducts}
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">활성 아티스트</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.activeArtists}
          </dd>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold text-gray-900">최근 주문</h2>
            <p className="mt-1 text-sm text-gray-500">
              최근 5개의 주문 내역입니다
            </p>
          </div>
        </div>

        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        주문번호
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        구매자
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        금액
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        상태
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        주문일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                          주문 내역이 없습니다
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {order.order_number}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {order.buyer_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {order.total_amount.toLocaleString()}원
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`
                              inline-flex rounded-full px-2 text-xs font-semibold leading-5
                              ${order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                              ${order.status === 'PREPARING' || order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' : ''}
                            `}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('ko-KR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
