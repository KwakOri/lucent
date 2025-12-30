# UI – Common Button

이 문서는 서비스 전반에서 사용되는 **Button UI의 공통 규칙과 UX 정책**을 정의한다.

본 문서는 `ui/index.md`, `ui/common/form.md`, `ui/common/input.md`의 원칙을 따른다.

---

## 1. 역할과 책임

- Button은 사용자의 **의도(intent)를 명확히 전달하는 UI 요소**다.
- 모든 Button은 하나의 명확한 액션을 수행해야 한다.
- Button은 비즈니스 로직을 포함하지 않는다.
- 상태 표현과 스타일 관리는 UI 레이어의 책임이다.

---

## 2. 구현 전제

- Button 컴포넌트는 **Class Variance Authority(CVA)** 기반으로 구현한다.
- 상태 변화는 조건문이 아닌 **variant 조합**으로 표현한다.
- Button은 기본적으로 재사용 가능한 공통 컴포넌트로 관리한다.

---

## 3. CVA Variant 설계

### 3.1 Intent Variant (의도)

Button의 시각적 강조 수준과 의미를 정의한다.

- `primary`

  - 주요 행동 (구매, 결제, 제출 등)

- `secondary`

  - 보조 행동 (취소, 뒤로가기 등)

- `danger`

  - 파괴적 행동 (삭제, 탈퇴 등)

- `neutral`

  - 의미가 중립적인 행동

> 한 화면에는 `primary` Button을 1개만 두는 것을 **권장**한다.
> 단, 모바일 UX 상 필요할 경우(예: 하단 고정 CTA + 상단 CTA) 예외를 허용한다.

---

### 3.2 State Variant

- `default`: 기본 상태
- `loading`: 처리 중 상태
- `disabled`: 비활성 상태

> Button의 상태는 내부 로직이 아닌 variant로 관리한다.

---

### 3.3 Size Variant

- `md` (default)
- `sm`, `lg`는 필요 시 확장 가능

모바일 환경을 기준으로 `md`를 기본값으로 사용한다.

---

## 4. UX 정책

### 4.1 Loading UX

- loading 상태에서는:

  - 클릭을 차단한다
  - 시각적인 로딩 표시를 제공한다

- **로딩 중에도 버튼 텍스트는 유지**한다.

  - 예: `주문하기` + spinner

- loading 중에는 버튼의 크기 변화가 발생하지 않아야 한다.

---

### 4.2 Disabled UX

- disabled 상태에서는:

  - 포커스를 받을 수 없다
  - 클릭 이벤트가 발생하지 않는다
  - 시각적으로 명확히 구분되어야 한다

---

## 5. Button 사용 원칙

- Button 내부 텍스트는 행동 중심으로 작성한다.

  - ❌ 확인
  - ⭕ 주문하기

- 의미 없는 아이콘 단독 사용을 지양한다.
- 아이콘이 포함된 경우에도 텍스트 버튼을 기본으로 한다.

---

## 6. Button 타입 규칙

### HTML `type` 속성

- 기본값은 `type="button"`으로 설정한다.
- Form 제출용 Button만 `type="submit"`을 사용한다.

---

## 7. 접근성(Accessibility)

- Button 텍스트는 스크린 리더가 인식 가능해야 한다.
- 아이콘만 있는 버튼에는 `aria-label`을 제공한다.
- 키보드 조작이 가능해야 한다.

---

## 8. 레이아웃 관련 정책

### Full-width Button

- Button의 기본 레이아웃은 content-width를 기준으로 한다.
- Form 제출, 주요 CTA 영역에서는 full-width Button 사용을 권장한다.

---

## 9. 확장 고려

- 아이콘 포함 Button (leading / trailing)
- 링크 스타일 Button

> 모든 확장은 기존 variant 체계를 해치지 않는 방향으로 설계한다.
