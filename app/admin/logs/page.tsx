import { LogService } from '@/lib/server/services/log.service';
import { LogsTable } from '@/src/components/admin/logs/LogsTable';

export default async function AdminLogsPage() {
  const { logs } = await LogService.getLogs({ limit: 100 });

  // 최근 24시간 로그 통계는 아직 LogService에 메서드가 없으므로 임시로 0 처리
  // TODO: LogService에 getStats 메서드 추가
  const stats = {
    total: logs.length,
    auth: logs.filter(l => l.event_category === 'AUTH').length,
    order: logs.filter(l => l.event_category === 'ORDER').length,
    download: logs.filter(l => l.event_category === 'DOWNLOAD').length,
    security: logs.filter(l => l.event_category === 'SECURITY').length,
  };

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
            📊 로그 통계 (최근 100개)
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
