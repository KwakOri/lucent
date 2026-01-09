'use client';

import { Header, Content } from '@/components/modal';
import type { ModalProps } from '@/components/modal';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface BulkUpdateLoadingModalProps extends ModalProps {
  count: number;
}

/**
 * 일괄 상태 변경 중 로딩 모달
 */
export function BulkUpdateLoadingModal({ count }: BulkUpdateLoadingModalProps) {
  return (
    <div>
      <Header title="상태 변경 중" showCloseButton={false} />
      <Content className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-700">
            {count}개 주문의 상태를 변경하고 있습니다...
          </p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
        </div>
      </Content>
    </div>
  );
}

interface BulkUpdateSuccessModalProps extends ModalProps {
  count: number;
  statusLabel: string;
}

/**
 * 일괄 상태 변경 완료 모달
 */
export function BulkUpdateSuccessModal({
  count,
  statusLabel,
  onSubmit,
}: BulkUpdateSuccessModalProps) {
  return (
    <div>
      <Header title="변경 완료" showCloseButton={false} />
      <Content className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <CheckCircleIcon className="w-16 h-16 text-green-500" />
          <p className="text-gray-700">
            {count}개 주문을 <span className="font-semibold">{statusLabel}</span>{' '}
            상태로 변경했습니다.
          </p>
        </div>
      </Content>
      <div className="px-6 py-4 border-t flex justify-end">
        <Button intent="primary" onClick={() => onSubmit()}>
          확인
        </Button>
      </div>
    </div>
  );
}
