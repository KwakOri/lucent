# UI – Common Input

이 문서는 서비스 전반에서 사용되는 **Input / Textarea UI의 공통 규칙과 UX 정책**을 정의한다.

본 문서는 `ui/index.md`, `ui/common/form.md`의 원칙을 따른다.

---

## 1. 범위 (Scope)

- 본 문서는 다음 컴포넌트를 다룬다:

  - `input` (text / email / password / number / tel)
  - `textarea`

- `select`, `checkbox`, `radio` 등은 별도 문서에서 정의한다.

---

## 2. 구현 전제

- Input UI는 **Form 라이브러리에 종속되지 않는다**.
- React Hook Form과의 연결은 Form 또는 Page 레벨에서 수행한다.
- Input 컴포넌트는 다음 책임만 가진다:

  - 값 표시
  - 상태 시각화
  - 에러 메시지 표시

> validation 로직, value 제어, submit 제어는 **상위(Form / Page) 책임**이다.

---

## 3. 역할 분리 원칙

- Input은 **단독으로 사용하지 않는다**.
- label, required 표시, error 메시지 레이아웃은
  `FormField` 또는 이에 준하는 래퍼 컴포넌트에서 관리하는 것을 전제로 한다.

> 본 문서는 Input 자체의 정책만을 다루며,
> 필드 단위 UX는 `ui/common/form-field.md`에서 정의한다.

---

## 4. CVA 기반 구조

### 4.1 Core Strategy

- Input 컴포넌트는 **Class Variance Authority(CVA)** 로 스타일을 관리한다.
- 상태 변화는 조건문이 아닌 **variant 조합**으로 표현한다.

### 4.2 Variant 정의

#### State Variant

- `default`: 기본 상태
- `focus`: 포커스 상태
- `error`: 에러 상태
- `disabled`: 비활성 상태
- `readOnly`: 읽기 전용 상태

> `success` 상태는 사용하지 않는다.
> 입력 완료에 대한 긍정 피드백은 Form 흐름 또는 다음 액션에서 처리한다.

#### Size Variant

- `md` (default)
- `sm`, `lg`는 필요 시 확장 가능

> 현재 프로젝트에서는 `md`를 기본값으로 사용한다.

---

## 5. Label & Placeholder 정책

- 모든 Input은 `label`을 반드시 포함해야 한다.
- label은 **입력 필드 상단에 고정**한다.
- placeholder는 입력 예시를 제공하는 용도로만 사용한다.
- placeholder를 label 대용으로 사용하지 않는다.

### Required 표시

- 필수 입력 항목은 label 옆에 `*`로 표시한다.
- 색상만으로 필수 여부를 구분하지 않는다.
- `aria-required` 속성을 함께 사용한다.

---

## 6. Error 표시 규칙

### 6.1 Error 책임

- Input 컴포넌트는 **에러를 생성하지 않는다**.
- 외부에서 전달된 `errorMessage`를 표시하는 역할만 수행한다.

```tsx
<Input label="이메일" errorMessage={errorMessage} />
```

### 6.2 Error UX

- 에러 메시지는 입력 필드 하단에 표시한다.
- 한 필드당 하나의 에러 메시지만 노출한다.
- 에러 메시지는 친절한 UX 톤 가이드를 따른다.

---

## 7. Disabled vs ReadOnly

- `disabled`

  - 포커스 불가
  - 값 수정 불가
  - submit 시 값 전송 ❌
  - 시각적으로 비활성 상태를 명확히 표현

- `readOnly`

  - 포커스 가능
  - 값 수정 불가
  - submit 시 값 전송 ⭕
  - 일반 입력 필드와 구분되는 스타일 제공

> `disabled`와 `readOnly`는 UX 및 데이터 처리 측면에서 명확히 구분한다.

---

## 8. 입력 타입(Type) 정책

- Input의 `type`은 native HTML input type을 그대로 따른다.
- type별 validation, masking, formatting은 Input 책임이 아니다.

지원 타입 예:

- text
- email
- password
- number
- tel

> 전화번호, 금액 등의 포맷 입력은 상위 레이어에서 처리한다.

---

## 9. 모바일 UX 고려 (Mobile First)

- Input type에 따라 모바일 키보드가 적절히 노출되도록 설정한다.
- 터치 영역은 충분한 높이를 확보한다.

---

## 10. 접근성 (Accessibility)

- `label`과 `input`은 `htmlFor` / `id`로 연결한다.
- 에러 상태에서는 `aria-invalid="true"`를 사용한다.
- 에러 메시지는 `aria-describedby`로 연결 가능해야 한다.
- 키보드 탐색 시 포커스 상태가 명확히 드러나야 한다.
- placeholder는 스크린 리더 기준 주요 정보로 사용하지 않는다.

---

## 11. Textarea 추가 규칙

- Textarea는 Input과 동일한 variant 시스템을 사용한다.
- 높이 조절 여부(resize)는 컴포넌트 옵션으로 제공할 수 있다.

---

## 12. 확장 고려

- 아이콘 포함 Input (leading / trailing)
- 비밀번호 표시 토글
- 숫자 입력 포맷팅

> 모든 확장은 기존 variant 체계를 해치지 않는 방향으로 설계한다.
