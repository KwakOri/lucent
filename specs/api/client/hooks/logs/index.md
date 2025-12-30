# Logs React Query Hooks

이 문서는 **로그(Logs) React Query Hooks** 구현을 정의한다.

> **범위**: 로그 데이터 fetching 및 상태 관리 Hooks (관리자 전용)
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/logs/index.md`
> - API Routes: `/specs/api/server/routes/logs/index.md`

---

## 1. QueryKey 구조

### 1.1 QueryKey 정의

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  logs: {
    all: ['logs'] as const,
    lists: () => [...queryKeys.logs.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.logs.lists(), filters] as const,
    details: () => [...queryKeys.logs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.logs.details(), id] as const,
    stats: (filters: Record<string, unknown>) =>
      [...queryKeys.logs.all, 'stats', filters] as const,
  },
} as const;
```

### 1.2 QueryKey 사용 예시

```ts
// 로그 목록 (필터 포함)
queryKeys.logs.list({ eventCategory: 'auth', page: 1 })
// → ['logs', 'list', { eventCategory: 'auth', page: 1 }]

// 로그 상세
queryKeys.logs.detail('log-uuid')
// → ['logs', 'detail', 'log-uuid']

// 로그 통계
queryKeys.logs.stats({ dateFrom: '2025-01-01' })
// → ['logs', 'stats', { dateFrom: '2025-01-01' }]

// 모든 로그 목록 무효화
queryKeys.logs.lists()
// → ['logs', 'list']
```

---

## 2. Query Hooks

### 2.1 useLogs (로그 목록 - 관리자)

```ts
// lib/client/hooks/useLogs.ts
import { useQuery } from '@tanstack/react-query';
import { LogsAPI, type GetLogsParams } from '@/lib/client/services/logs.api';
import { queryKeys } from './query-keys';

export function useLogs(params?: GetLogsParams) {
  return useQuery({
    queryKey: queryKeys.logs.list(params || {}),
    queryFn: () => LogsAPI.getLogs(params),
    keepPreviousData: true, // 페이지네이션 시 이전 데이터 유지
    staleTime: 1000 * 30, // 30초 (로그는 비교적 자주 갱신)
  });
}
```

**사용 예시 (관리자)**:

```tsx
function LogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    eventCategory: undefined,
    severity: undefined,
  });

  const { data, isLoading, error, isPreviousData } = useLogs({
    page,
    limit: 50,
    ...filters,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <LogFilters filters={filters} onChange={setFilters} />

      <LogTable logs={logs} />

      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onChange={setPage}
          disabled={isPreviousData}
        />
      )}
    </div>
  );
}
```

### 2.2 useLog (로그 상세 - 관리자)

```ts
// lib/client/hooks/useLog.ts
import { useQuery } from '@tanstack/react-query';
import { LogsAPI } from '@/lib/client/services/logs.api';
import { queryKeys } from './query-keys';

export function useLog(id: string) {
  return useQuery({
    queryKey: queryKeys.logs.detail(id),
    queryFn: () => LogsAPI.getLog(id),
    enabled: !!id, // id가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

**사용 예시**:

```tsx
function LogDetailModal({ logId }: { logId: string }) {
  const { data: logData, isLoading } = useLog(logId);

  if (isLoading) return <Loading />;

  const log = logData?.data;
  if (!log) return <NotFound />;

  return (
    <div className="log-detail">
      <h2>{log.event_type}</h2>
      <p>{log.message}</p>

      <dl>
        <dt>카테고리</dt>
        <dd>{log.event_category}</dd>

        <dt>심각도</dt>
        <dd>{log.severity}</dd>

        {log.user && (
          <>
            <dt>사용자</dt>
            <dd>{log.user.email}</dd>
          </>
        )}

        <dt>발생 시간</dt>
        <dd>{new Date(log.created_at).toLocaleString()}</dd>
      </dl>

      {log.metadata && (
        <div className="metadata">
          <h3>메타데이터</h3>
          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 2.3 useLogStats (로그 통계 - 관리자)

```ts
// lib/client/hooks/useLogStats.ts
import { useQuery } from '@tanstack/react-query';
import { LogsAPI } from '@/lib/client/services/logs.api';
import { queryKeys } from './query-keys';

export function useLogStats(params?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.logs.stats(params || {}),
    queryFn: () => LogsAPI.getStats(params),
    staleTime: 1000 * 60, // 1분
  });
}
```

**사용 예시**:

```tsx
function LogsDashboard() {
  const { dateFrom, dateTo } = getDateRange('week');
  const { data, isLoading } = useLogStats({ dateFrom, dateTo });

  if (isLoading) return <Loading />;

  const stats = data?.data;
  if (!stats) return null;

  return (
    <div className="dashboard">
      <h1>로그 통계 (최근 7일)</h1>

      <div className="stats-grid">
        <StatCard title="전체 로그" value={stats.total} />

        <StatCard
          title="카테고리별"
          breakdown={stats.byCategory}
        />

        <StatCard
          title="심각도별"
          breakdown={stats.bySeverity}
        />
      </div>

      <LogChart data={stats.byDate} />
    </div>
  );
}
```

---

## 3. Mutation Hooks

로그는 **읽기 전용**이므로 Mutation Hook은 없습니다.
(로그는 서버에서 자동으로 기록됨)

---

## 4. 실전 예시

### 4.1 로그 목록 + 필터링 + 검색

```tsx
function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<GetLogsParams>({
    eventCategory: undefined,
    severity: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    search: '',
  });

  const { data, isLoading, isPreviousData } = useLogs({
    page,
    limit: 50,
    ...filters,
  });

  const handleFilterChange = (newFilters: Partial<GetLogsParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // 필터 변경 시 첫 페이지로
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setPage(1);
  };

  return (
    <div>
      <h1>시스템 로그</h1>

      <div className="filters">
        <select
          value={filters.eventCategory || ''}
          onChange={(e) => handleFilterChange({ eventCategory: e.target.value })}
        >
          <option value="">모든 카테고리</option>
          <option value="auth">인증</option>
          <option value="order">주문</option>
          <option value="product">상품</option>
          <option value="download">다운로드</option>
          <option value="security">보안</option>
        </select>

        <select
          value={filters.severity || ''}
          onChange={(e) => handleFilterChange({ severity: e.target.value })}
        >
          <option value="">모든 심각도</option>
          <option value="info">정보</option>
          <option value="warning">경고</option>
          <option value="error">오류</option>
          <option value="critical">긴급</option>
        </select>

        <input
          type="search"
          placeholder="로그 검색..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {isLoading && <Loading />}

      {data && (
        <>
          <LogTable logs={data.data} isPreviousData={isPreviousData} />
          <Pagination
            current={data.pagination.page}
            total={data.pagination.totalPages}
            onChange={setPage}
            disabled={isPreviousData}
          />
        </>
      )}
    </div>
  );
}
```

### 4.2 특정 유저의 활동 로그

```tsx
function UserActivityLogs({ userId }: { userId: string }) {
  const { data, isLoading } = useLogs({
    userId,
    limit: 100,
    order: 'desc',
  });

  if (isLoading) return <Loading />;

  const logs = data?.data || [];

  return (
    <div>
      <h2>사용자 활동 기록</h2>
      <Timeline>
        {logs.map((log) => (
          <TimelineItem key={log.id}>
            <time>{new Date(log.created_at).toLocaleString()}</time>
            <p>{log.message}</p>
            <Badge severity={log.severity}>{log.event_type}</Badge>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
}
```

### 4.3 실시간 로그 모니터링 (폴링)

```tsx
function LiveLogMonitor() {
  const { data, isLoading } = useLogs(
    {
      page: 1,
      limit: 20,
      order: 'desc',
    },
    {
      refetchInterval: 5000, // 5초마다 갱신
      refetchIntervalInBackground: true,
    }
  );

  const logs = data?.data || [];

  return (
    <div className="live-monitor">
      <h2>실시간 로그 모니터링</h2>
      <div className="log-stream">
        {logs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            isNew={isRecent(log.created_at, 10)} // 10초 이내
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 로그 대시보드

```tsx
function LogsDashboard() {
  const { dateFrom, dateTo } = getDateRange('month');
  const { data: statsData } = useLogStats({ dateFrom, dateTo });
  const { data: criticalLogs } = useLogs({
    severity: 'critical',
    limit: 10,
    order: 'desc',
  });
  const { data: recentLogs } = useLogs({
    limit: 20,
    order: 'desc',
  });

  const stats = statsData?.data;
  const critical = criticalLogs?.data || [];
  const recent = recentLogs?.data || [];

  return (
    <div className="dashboard">
      <h1>로그 대시보드</h1>

      {stats && (
        <div className="stats-overview">
          <StatCard
            title="전체 로그"
            value={stats.total}
            trend="+12%"
          />
          <StatCard
            title="경고"
            value={stats.bySeverity.warning || 0}
            color="yellow"
          />
          <StatCard
            title="오류"
            value={stats.bySeverity.error || 0}
            color="orange"
          />
          <StatCard
            title="긴급"
            value={stats.bySeverity.critical || 0}
            color="red"
          />
        </div>
      )}

      <div className="grid-2">
        <div className="critical-logs">
          <h2>긴급 로그</h2>
          {critical.length === 0 ? (
            <p>긴급 로그가 없습니다 ✅</p>
          ) : (
            <LogList logs={critical} />
          )}
        </div>

        <div className="recent-logs">
          <h2>최근 로그</h2>
          <LogList logs={recent} />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. 에러 처리

### 5.1 Hook 레벨 에러 처리

```ts
export function useLogs(params?: GetLogsParams) {
  return useQuery({
    queryKey: queryKeys.logs.list(params || {}),
    queryFn: () => LogsAPI.getLogs(params),
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.statusCode === 403) {
          console.error('관리자 권한이 필요합니다');
        }
      }
    },
  });
}
```

### 5.2 Component 레벨 에러 처리

```tsx
function LogsPage() {
  const { data, error, isError } = useLogs();

  if (isError) {
    if (error instanceof ApiError) {
      if (error.statusCode === 403) {
        return <Unauthorized message="관리자 권한이 필요합니다" />;
      }
      return <Error message={error.message} />;
    }
    return <Error message="알 수 없는 오류가 발생했습니다" />;
  }

  return <LogTable logs={data?.data || []} />;
}
```

---

## 6. 캐시 관리

### 6.1 자동 갱신 (Refetch Interval)

```ts
export function useLogs(params?: GetLogsParams) {
  return useQuery({
    queryKey: queryKeys.logs.list(params || {}),
    queryFn: () => LogsAPI.getLogs(params),
    refetchInterval: 30000, // 30초마다 자동 갱신
    refetchIntervalInBackground: false, // 백그라운드에서는 갱신 안 함
  });
}
```

### 6.2 수동 갱신

```tsx
function LogsPage() {
  const queryClient = useQueryClient();
  const { data } = useLogs();

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.logs.lists(),
    });
  };

  return (
    <div>
      <button onClick={handleRefresh}>새로고침</button>
      <LogTable logs={data?.data || []} />
    </div>
  );
}
```

---

## 7. 성능 최적화

### 7.1 staleTime 설정

```ts
// 로그 목록: 30초 (비교적 자주 변경됨)
staleTime: 1000 * 30

// 로그 상세: 5분 (변경되지 않음)
staleTime: 1000 * 60 * 5

// 로그 통계: 1분
staleTime: 1000 * 60
```

### 7.2 keepPreviousData

페이지네이션 시 이전 데이터 유지:

```ts
useQuery({
  queryKey: queryKeys.logs.list(params),
  queryFn: () => LogsAPI.getLogs(params),
  keepPreviousData: true, // 페이지 전환 시 깜빡임 방지
});
```

### 7.3 필터 디바운싱

검색 입력 시 디바운싱 적용:

```tsx
function LogSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data } = useLogs({
    search: debouncedSearch,
  });

  return (
    <input
      type="search"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="로그 검색..."
    />
  );
}
```

---

## 8. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/logs/index.md`
- API Routes: `/specs/api/server/routes/logs/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
