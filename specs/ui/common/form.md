# UI – Common Form

이 문서는 서비스 전반에서 사용되는 **Form UI의 공통 규칙과 UX 정책**을 정의한다.

---

## 1. 구현 전제

- 모든 Form은 **React Hook Form**을 사용한다.
- Form 상태 관리는 **uncontrolled 방식**을 기본으로 한다.
- Form 로직은 페이지(또는 feature) 단위에서 관리한다.
- UI 컴포넌트는 Form 라이브러리에 종속되지 않도록 설계한다.
- Form을 구성하는 UI 요소(Input, Button, Error Message 등)는
  모두 **CVA 기반 공통 컴포넌트**를 사용한다.
- Form 상태(error, disabled, loading)는
  UI 컴포넌트의 **variant로 표현**한다.

---

## 2. Form 구조 원칙

- 모든 입력 필드는 `label`을 반드시 포함해야 한다.
- 필수 입력 항목은 시각적으로 구분되어야 한다.
  - `*` 또는 별도 텍스트로 명확히 표시한다.
  - 색상만으로 필수 여부를 구분하지 않는다.
- 하나의 Form에는 **하나의 submit 목적**만 존재한다.
- Enter 키를 통한 제출을 허용한다.
- 입력 항목이 많은 경우, 논리적 단위로 Form을 분리하거나
  단계형(step) Form을 고려한다.

---

## 3. Validation 정책

### 3.1 Validation 기준

- 클라이언트 validation을 1차로 수행한다.
- 서버 validation은 최종 검증으로 처리한다.
- Validation 에러 메시지는 UI 전체 에러 톤 가이드를 따른다.
- 사용자가 무엇을 수정해야 하는지 명확히 안내한다.

### 3.2 Validation 타이밍

- `blur` 시: 해당 필드 validation 실행
- `submit` 시: 전체 필드 validation 실행

---

## 4. Error 표시 규칙

### 4.1 필드 에러(Field Error)

- 입력 필드 하단에 표시한다.
- 한 필드당 하나의 에러 메시지만 노출한다.
- 사용자가 입력을 수정하면 즉시 에러를 해제할 수 있다.

### 4.2 Form 에러(Form Error)

- 서버 에러 또는 공통 에러는 Form 상단에 표시한다.
- 이메일 존재 여부 등 **보안상 민감한 정보는 노출하지 않는다**.

---

## 5. Submit UX

- submit 중에는 submit 버튼을 **disabled** 처리한다.
- submit 중 로딩 상태를 시각적으로 표시한다.
- 중복 제출을 방지한다.

### Disabled vs ReadOnly

- `disabled`: 사용자가 조작할 수 없는 상태
- `readOnly`: 값은 표시되지만 수정은 불가능한 상태
- 두 상태는 시각적으로 명확히 구분되어야 한다.

---

## 6. 성공 처리

- 성공 시 처리 방식은 화면별로 정의한다.
- 필요 시 form reset을 수행할 수 있다.
- 성공 피드백은 toast 또는 화면 전환으로 제공한다.

---

## 7. 접근성(Accessibility)

- 모든 입력 필드는 `label`과 연결되어야 한다.
- 에러 메시지는 스크린 리더가 인식 가능해야 한다.
- 키보드만으로 Form 조작이 가능해야 한다.

---

## 8. 확장 고려

- Controller 기반 컴포넌트 사용 가능성 고려
- Form 스키마 기반 validation 도입 가능성 고려
