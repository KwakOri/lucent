# UI – Common Form Field

이 문서는 서비스 전반에서 사용되는 **Form Field(UI 필드 단위 래퍼)**의 공통 규칙과 UX 정책을 정의한다.

Form Field는 `Input`, `Textarea`, `Select` 등의 입력 컴포넌트를 감싸는 **구조적·의미적 컨테이너**이다.

본 문서는 `ui/index.md`, `ui/common/form.md`, `ui/common/input.md`의 원칙을 따른다.

---

## 1. 역할 정의 (Role)

Form Field는 다음 책임을 가진다:

- `label` 표시 및 접근성 연결
- 필수 입력(required) 표시
- 에러 메시지 레이아웃 관리
- help / description 텍스트 제공
- 입력 컴포넌트와 메시지 간 **공간 및 정렬 규칙** 관리

> Form Field는 **값, validation, 이벤트를 직접 제어하지 않는다**.

---

## 2. 구조 원칙

### 2.1 기본 구조

Form Field는 아래 요소들로 구성된다:

1. Label 영역
2. Input 영역 (Input / Textarea / Select 등)
3. Message 영역 (Error 또는 Help)

```tsx
<FormField label="이메일" required>
  <Input type="email" />
</FormField>
```

---

## 3. Label 정책

- 모든 Form Field는 `label`을 포함해야 한다.
- label은 입력 필드 **상단에 고정**한다.
- label은 클릭 시 해당 입력 필드에 포커스를 이동시킨다.

### Required 표시

- 필수 입력 항목은 label 옆에 `*`로 표시한다.
- 색상만으로 필수 여부를 표현하지 않는다.
- `aria-required` 속성을 함께 사용한다.

---

## 4. Message 영역 정책

Form Field 하단에는 **하나의 메시지 영역**만 존재한다.

### 4.1 Error Message

- validation 실패 시 표시된다.
- 한 필드당 하나의 에러 메시지만 노출한다.
- 에러 메시지는 Input 바로 하단에 위치한다.
- 에러 메시지는 친절한 UX 톤을 따른다.

### 4.2 Help / Description Message

- 입력 가이드 또는 부가 설명을 제공한다.
- 에러가 존재할 경우 help 메시지는 노출하지 않는다.

---

## 5. 상태 우선순위

Form Field는 전달받은 상태에 따라 메시지를 결정한다.

우선순위:

1. Error
2. Help / Description

> 동시에 두 메시지를 노출하지 않는다.

---

## 6. 접근성 (Accessibility)

- `label`은 `htmlFor`를 통해 입력 필드와 연결한다.
- 메시지 영역은 `aria-describedby`로 연결 가능해야 한다.
- 에러 상태에서는 입력 필드에 `aria-invalid="true"`를 설정한다.

---

## 7. 레이아웃 & 간격 규칙

- Form Field 간에는 일관된 vertical spacing을 유지한다.
- Label ↔ Input ↔ Message 간 간격은 UI 시스템에서 통일한다.
- 에러 메시지 등장/해제 시 레이아웃 점프를 최소화한다.

---

## 8. Mobile First 고려

- 모바일 환경에서도 label, error, help 메시지가 잘려 보이지 않도록 한다.
- 터치 조작 시 오작동을 유발하지 않도록 충분한 간격을 확보한다.

---

## 9. 확장 고려

- Select / Checkbox / Radio Field 확장
- 다중 Input Field (예: 전화번호 분리 입력)
- Inline Field (가로 정렬 Form)

> 모든 확장은 본 Form Field 구조를 기반으로 한다.

---

### 요약

- Form Field는 필드 단위 UX의 중심 컴포넌트
- Input과 명확한 책임 분리
- Label / Required / Error / Help의 단일 관리 지점
- 접근성과 레이아웃 일관성을 동시에 확보
