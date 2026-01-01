'use client';

import { useToast } from '@/src/components/toast';
import type { ToastPosition, ToastType } from '@/src/components/toast';

export default function ToastTestPage() {
  const { showToast, dismissAll, renderToasts } = useToast();

  const handleShowToast = (type: ToastType, position?: ToastPosition) => {
    const messages = {
      success: '작업이 성공적으로 완료되었습니다!',
      error: '오류가 발생했습니다. 다시 시도해주세요.',
      warning: '이 작업은 되돌릴 수 없습니다.',
      info: '새로운 업데이트가 있습니다.',
    };

    showToast(messages[type], { type, position });
  };

  const handleMultipleToasts = () => {
    showToast('첫 번째 알림', { type: 'info' });
    setTimeout(() => {
      showToast('두 번째 알림', { type: 'success' });
    }, 500);
    setTimeout(() => {
      showToast('세 번째 알림', { type: 'warning' });
    }, 1000);
    setTimeout(() => {
      showToast('네 번째 알림 (최대 3개까지만 표시)', { type: 'error' });
    }, 1500);
  };

  const handleLongMessage = () => {
    showToast(
      '이것은 매우 긴 메시지입니다. 토스트가 어떻게 표시되는지 확인하기 위해 충분히 긴 텍스트를 입력했습니다. 레이아웃이 깨지지 않고 잘 표시되는지 확인해보세요.',
      { type: 'info', duration: 10000 }
    );
  };

  const handleInfiniteToast = () => {
    const id = showToast('이 알림은 자동으로 닫히지 않습니다', {
      type: 'warning',
      duration: Infinity,
    });
    console.log('Toast ID:', id);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Toast Notification 테스트</h1>

        {/* Toast 타입 테스트 */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Toast 타입</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShowToast('success')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Success Toast
            </button>
            <button
              onClick={() => handleShowToast('error')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Error Toast
            </button>
            <button
              onClick={() => handleShowToast('warning')}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Warning Toast
            </button>
            <button
              onClick={() => handleShowToast('info')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Info Toast
            </button>
          </div>
        </section>

        {/* 위치 테스트 */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. Toast 위치</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleShowToast('info', 'top-left')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Top Left
            </button>
            <button
              onClick={() => handleShowToast('info', 'top-center')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Top Center
            </button>
            <button
              onClick={() => handleShowToast('info', 'top-right')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Top Right
            </button>
            <button
              onClick={() => handleShowToast('info', 'bottom-left')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Bottom Left
            </button>
            <button
              onClick={() => handleShowToast('info', 'bottom-center')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Bottom Center
            </button>
            <button
              onClick={() => handleShowToast('info', 'bottom-right')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Bottom Right (기본)
            </button>
          </div>
        </section>

        {/* 특수 케이스 테스트 */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. 특수 케이스</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMultipleToasts}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              여러 개 동시 표시 (최대 3개)
            </button>
            <button
              onClick={handleLongMessage}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              긴 메시지
            </button>
            <button
              onClick={handleInfiniteToast}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              자동 닫힘 없음
            </button>
            <button
              onClick={dismissAll}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
            >
              모두 닫기
            </button>
          </div>
        </section>

        {/* 사용 예시 */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">4. 코드 예시</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`// 기본 사용
const { showToast, renderToasts } = useToast();

// Success
showToast('저장되었습니다', { type: 'success' });

// Error
showToast('오류가 발생했습니다', { type: 'error' });

// 커스텀 옵션
showToast('처리 중...', {
  type: 'info',
  duration: Infinity, // 자동 닫힘 없음
  position: 'top-center',
});

// 렌더링 (필수)
return (
  <>
    <YourComponent />
    {renderToasts()}
  </>
);`}
          </pre>
        </section>
      </div>

      {/* Toast 렌더링 */}
      {renderToasts()}
    </div>
  );
}
