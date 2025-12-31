/**
 * ShippingForm Component
 *
 * 배송 정보 입력 폼 컴포넌트
 */

'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  memo: string;
}

interface ShippingFormProps {
  initialValues?: Partial<ShippingInfo>;
  customerInfo?: {
    name?: string;
    phone?: string;
  };
  onChange: (values: ShippingInfo) => void;
}

export function ShippingForm({
  initialValues,
  customerInfo,
  onChange,
}: ShippingFormProps) {
  const [values, setValues] = useState<ShippingInfo>({
    name: initialValues?.name || '',
    phone: initialValues?.phone || '',
    address: initialValues?.address || '',
    memo: initialValues?.memo || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    const newValues = { ...values, [field]: value };
    setValues(newValues);
    onChange(newValues);

    // 실시간 검증
    validateField(field, value);
  };

  const validateField = (field: keyof ShippingInfo, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = '수령인 이름을 입력해주세요';
        } else if (value.length < 2) {
          error = '이름은 2자 이상이어야 합니다';
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = '연락처를 입력해주세요';
        } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(value.replace(/-/g, ''))) {
          error = '올바른 연락처 형식이 아닙니다';
        }
        break;

      case 'address':
        if (!value.trim()) {
          error = '배송 주소를 입력해주세요';
        } else if (value.length < 10) {
          error = '상세한 주소를 입력해주세요';
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCopyFromCustomer = (checked: boolean) => {
    if (checked && customerInfo) {
      const newValues = {
        ...values,
        name: customerInfo.name || '',
        phone: customerInfo.phone || '',
      };
      setValues(newValues);
      onChange(newValues);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">배송 정보</h2>
        {customerInfo && (
          <Checkbox
            label="주문자 정보와 동일"
            onChange={handleCopyFromCustomer}
          />
        )}
      </div>

      <FormField
        label="수령인"
        htmlFor="shippingName"
        required
        error={errors.name}
      >
        <Input
          id="shippingName"
          name="shippingName"
          placeholder="받으실 분의 이름을 입력하세요"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
        />
      </FormField>

      <FormField
        label="연락처"
        htmlFor="shippingPhone"
        required
        error={errors.phone}
      >
        <Input
          id="shippingPhone"
          name="shippingPhone"
          type="tel"
          placeholder="010-0000-0000"
          value={values.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={!!errors.phone}
        />
      </FormField>

      <FormField
        label="배송 주소"
        htmlFor="shippingAddress"
        required
        error={errors.address}
      >
        <Textarea
          id="shippingAddress"
          name="shippingAddress"
          placeholder="상세 주소를 입력하세요"
          value={values.address}
          onChange={(e) => handleChange('address', e.target.value)}
          error={!!errors.address}
          rows={3}
        />
      </FormField>

      <FormField
        label="배송 메모"
        htmlFor="shippingMemo"
      >
        <Textarea
          id="shippingMemo"
          name="shippingMemo"
          placeholder="배송 시 요청사항을 입력하세요 (선택)"
          value={values.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
          rows={2}
        />
      </FormField>
    </div>
  );
}
