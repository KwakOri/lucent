/**
 * Profile Edit Page
 *
 * 회원정보 수정 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyProfile, useUpdateProfile } from '@/hooks';
import { useToast } from '@/src/components/toast';

export default function ProfileEditPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: profile, isLoading, error } = useMyProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    main_address: '',
    detail_address: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // 프로필 데이터로 폼 초기화
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        main_address: profile.main_address || '',
        detail_address: profile.detail_address || '',
      });
    }
  }, [profile]);

  // 폼 변경 감지
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // 해당 필드 에러 제거
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 클라이언트 검증
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // 이름 검증
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요';
    } else if (formData.name.trim().length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다';
    } else if (formData.name.length > 50) {
      errors.name = '이름은 50자를 초과할 수 없습니다';
    } else if (!/^[가-힣a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = '이름은 한글, 영문, 공백만 사용할 수 있습니다';
    }

    // 전화번호 검증 (선택 사항)
    if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      errors.phone = '올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 전화번호 자동 포맷팅
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 저장
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // 첫 번째 에러 필드로 포커스
      const firstError = Object.keys(validationErrors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    updateProfile(
      {
        name: formData.name,
        phone: formData.phone || null,
        main_address: formData.main_address || null,
        detail_address: formData.detail_address || null,
      },
      {
        onSuccess: () => {
          showToast('프로필이 업데이트되었습니다', { type: 'success' });
          setIsDirty(false);
          router.push('/mypage');
        },
        onError: (error) => {
          console.error('Profile update failed:', error);
          showToast(error.message || '프로필 수정에 실패했습니다', { type: 'error' });
        },
      }
    );
  };

  // 취소
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <EmptyState
          title="프로필을 불러올 수 없습니다"
          description={error instanceof Error ? error.message : '프로필 정보를 불러오는 중 오류가 발생했습니다'}
        >
          <Link href="/mypage">
            <Button intent="primary" size="md">
              마이페이지로 돌아가기
            </Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            뒤로 가기
          </button>
          <h1 className="text-3xl font-bold text-text-primary">프로필 설정</h1>
          <p className="mt-2 text-text-secondary">회원정보를 수정할 수 있습니다</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 md:p-8">
          <div className="space-y-6">
            {/* 이메일 (읽기 전용) */}
            <FormField
              label="이메일"
              htmlFor="email"
              help="이메일은 변경할 수 없습니다"
            >
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                readOnly
              />
            </FormField>

            {/* 이름 */}
            <FormField
              label="이름"
              htmlFor="name"
              required
              error={validationErrors.name}
            >
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
                error={!!validationErrors.name}
              />
            </FormField>

            {/* 전화번호 */}
            <FormField
              label="전화번호"
              htmlFor="phone"
              error={validationErrors.phone}
              help={!validationErrors.phone ? "하이픈(-)을 포함한 형식으로 입력해주세요" : undefined}
            >
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                placeholder="010-1234-5678"
                error={!!validationErrors.phone}
              />
            </FormField>

            {/* 주소 - 메인 */}
            <FormField
              label="주소"
              htmlFor="main_address"
              error={validationErrors.main_address}
            >
              <Input
                id="main_address"
                type="text"
                value={formData.main_address}
                onChange={(e) => handleChange('main_address', e.target.value)}
                placeholder="기본 주소를 입력하세요"
                error={!!validationErrors.main_address}
              />
            </FormField>

            {/* 주소 - 상세 */}
            <FormField
              label="상세 주소"
              htmlFor="detail_address"
              error={validationErrors.detail_address}
            >
              <Input
                id="detail_address"
                type="text"
                value={formData.detail_address}
                onChange={(e) => handleChange('detail_address', e.target.value)}
                placeholder="상세 주소를 입력하세요"
                error={!!validationErrors.detail_address}
              />
            </FormField>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              intent="secondary"
              size="lg"
              onClick={handleCancel}
              disabled={isSaving}
              className="sm:order-1"
            >
              <X className="w-4 h-4" />
              취소
            </Button>
            <Button
              type="submit"
              intent="primary"
              size="lg"
              disabled={!isDirty || isSaving}
              className="sm:order-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
