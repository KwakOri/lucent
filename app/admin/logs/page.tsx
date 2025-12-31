import { createServerClient } from '@/lib/server/utils/supabase';
import { LogsTable } from '@/src/components/admin/logs/LogsTable';

async function getLogs() {
  const supabase = await createServerClient();

  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return logs || [];
}

async function getLogStats() {
  const supabase = await createServerClient();

  // 최근 24시간 로그 통계
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: totalCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo);

  const { count: authCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'AUTH')
    .gte('created_at', oneDayAgo);

  const { count: orderCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'ORDER')
    .gte('created_at', oneDayAgo);

  const { count: downloadCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'DOWNLOAD')
    .gte('created_at', oneDayAgo);

  const { count: securityCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'SECURITY')
    .gte('created_at', oneDayAgo);

  return {
    total: totalCount || 0,
    auth: authCount || 0,
    order: orderCount || 0,
    download: downloadCount || 0,
    security: securityCount || 0,
  };
}

export default async function AdminLogsPage() {
  const [logs, stats] = await Promise.all([
    getLogs(),
    getLogStats(),
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">로그 조회</h1>
        <p className="mt-1 text-sm text-gray-500">
          시스템 이벤트 로그를 조회합니다
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
            📊 로그 통계 (최근 24시간)
          </h3>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-5">
            <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5">
              <dt className="truncate text-sm font-medium text-gray-500">총 이벤트</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-blue-50 px-4 py-5">
              <dt className="truncate text-sm font-medium text-blue-600">인증</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-900">{stats.auth}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-green-50 px-4 py-5">
              <dt className="truncate text-sm font-medium text-green-600">주문</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-900">{stats.order}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-purple-50 px-4 py-5">
              <dt className="truncate text-sm font-medium text-purple-600">다운로드</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-purple-900">{stats.download}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-red-50 px-4 py-5">
              <dt className="truncate text-sm font-medium text-red-600">보안</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-900">{stats.security}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Logs Table */}
      <LogsTable logs={logs} />
    </div>
  );
}
