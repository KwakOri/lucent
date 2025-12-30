# UI – Common Select

이 문서는 서비스 전반에서 사용되는 **Select(선택형 입력 UI)**의 공통 규칙과 UX 정책을 정의한다.

Select는 `FormField` 내부에서 사용되는 **선택 입력 컴포넌트**이며,
본 문서는 `ui/index.md`, `ui/common/form.md`, `ui/common/input.md`, `ui/common/form-field.md`의 원칙을 따른다.

---

## 1. 역할 정의 (Role)

Select는 사용자가 **미리 정의된 옵션 중 하나(또는 복수)를 선택**하도록 돕는 입력 UI이다.

### 적합한 사용 사례

- 선택지가 명확하고 개수가 제한적인 경우
- 입력 오류를 방지해야 하는 경우
- 서버에서 정의된 enum / code 값 선택

### 부적합한 사용 사례

- 선택지가 매우 많은 경우 → 검색 기반 UI 고려
- 자유 입력이 필요한 경우 → Input 사용

---

## 2. 구현 전제

- Select UI는 **Form 라이브러리에 종속되지 않는다**.
- React Hook Form과의 연결은 Form 또는 Page 레벨에서 수행한다.
- Select 컴포넌트는 다음 책임만 가진다:

  - 현재 선택 값 표시
  - 옵션 목록 표시
  - 상태 시각화

> validation, 값 제어, submit 처리 로직은 상위 레이어 책임이다.

---

## 3. 구조 원칙

Select는 단독 사용하지 않으며,
항상 `FormField` 내부에서 사용되는 것을 전제로 한다.

```tsx
<FormField label="배송 방법" required>
  <Select options={options} />
</FormField>
```

---

## 4. Mobile First UI 정책

- 모바일 환경을 최우선 기준으로 설계한다.
- 기본 Select UI는 **Bottom Sheet 형태**를 권장한다.
- 데스크톱 환경에서는 Dropdown UI를 기본으로 사용한다.

> 동일한 Select 컴포넌트가 viewport에 따라 표현 방식만 달라질 수 있다.

---

## 5. CVA 기반 구조

### 5.1 Core Strategy

- Select 컴포넌트는 **Class Variance Authority(CVA)** 로 스타일을 관리한다.
- 표현 방식 차이는 variant로 분리한다.

### 5.2 Variant 정의

#### State Variant

- `default`: 기본 상태
- `focus`: 포커스 상태
- `error`: 에러 상태
- `disabled`: 비활성 상태
- `readOnly`: 읽기 전용 상태

> `success` 상태는 사용하지 않는다.

#### Size Variant

- `md` (default)

#### Presentation Variant

- `dropdown`: 데스크톱 기본
- `bottomSheet`: 모바일 기본

---

## 6. 옵션(Option) 정책

- 각 옵션은 `label`과 `value`를 가진다.
- `value`는 서버 또는 비즈니스 로직에서 사용하는 값과 일치해야 한다.
- `label`은 사용자에게 노출되는 텍스트이다.

```ts
{ label: "택배 배송", value: "DELIVERY" }
```

---

## 7. 선택 UX 규칙

- 기본적으로 **단일 선택**을 기준으로 한다.
- 복수 선택은 별도 컴포넌트로 분리한다.
- 선택 시 즉각적으로 선택 상태를 반영한다.

---

## 8. Disabled vs ReadOnly

- `disabled`

  - 선택 불가
  - 옵션 목록 열림 ❌
  - submit 시 값 전송 ❌

- `readOnly`

  - 선택 불가
  - 옵션 목록 열림 ❌
  - submit 시 값 전송 ⭕

> `disabled`와 `readOnly`는 명확히 구분한다.

---

## 9. 접근성 (Accessibility)

- 키보드로 옵션 탐색이 가능해야 한다.
- 현재 선택된 옵션은 스크린 리더로 인식 가능해야 한다.
- 에러 상태에서는 `aria-invalid="true"`를 사용한다.

---

## 10. 옵션 수 가이드

- 옵션이 5개 이하인 경우 Select 사용 적합
- 옵션이 많은 경우:

  - 검색 가능 Select
  - 카테고리 분리 UI 고려

---

## 11. 확장 고려

- 검색 가능한 Select
- 서버 데이터 기반 Select
- Cascading Select (의존 선택)

> 확장은 기존 FormField 구조를 유지하는 것을 전제로 한다.

---

### 요약

- Select는 선택 오류를 줄이기 위한 입력 UI
- Mobile First: Bottom Sheet / Desktop: Dropdown
- CVA 기반 상태 및 표현 관리
- FormField와 함께 사용하는 것을 전제로 설계
- 접근성과 일관성 확보
