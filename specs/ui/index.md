# UI Specification – Index

## 1. UI 설계 방향 (Design Principles)

### Mobile First

- 본 프로젝트의 주요 사용자는 **모바일 환경**에서 접근할 가능성이 높다.
- 모든 UI는 **모바일 화면을 기준으로 우선 설계**하며, 태블릿·데스크톱은 확장 개념으로 대응한다.
- 레이아웃, 터치 영역, 인터랙션은 모바일 사용성을 최우선으로 고려한다.

### Consumer Shopping Mall

- 본 서비스는 **소비자용 쇼핑몰(B2C)** 성격을 가진다.
- UI는 다음 특성을 지향한다:

  - 직관적이고 빠른 이해
  - 최소한의 학습 비용
  - 구매 흐름을 방해하지 않는 인터페이스

---

## 2. UI 시스템 아키텍처 (CVA 기반)

### Core Strategy

- 본 프로젝트는 **Class Variance Authority(CVA)** 를 기반으로 UI 시스템을 관리한다.
- UI 컴포넌트는 **조건문(if/else)** 이 아닌 **variant 조합**을 통해 상태와 스타일을 표현한다.

### CVA 사용 원칙

- 모든 공통 UI 컴포넌트는 CVA로 정의한다.
- 스타일 변경은 다음 방식을 따른다:

  - ❌ inline class override
  - ❌ 조건부 className 분기
  - ⭕ variant 추가
  - ⭕ compound variant 활용

### Variant = 상태

- UI의 시각적 상태는 컴포넌트 내부 로직이 아니라 **variant로 표현**한다.

예시 상태:

- disabled
- loading
- error
- success
- focus

---

## 3. Styling Convention (CVA + Tailwind)

- 스타일링은 **Tailwind CSS**를 기반으로 한다.
- CVA는 Tailwind class 조합을 관리하기 위한 도구로 사용한다.

### 공통 규칙

- spacing, typography, color는 디자인 시스템 기준을 따른다
- 임의의 커스텀 색상/값 사용을 지양한다

### Variant Naming Convention

공통적으로 다음 네이밍 패턴을 권장한다:

- `intent`: primary | secondary | danger | neutral
- `size`: sm | md | lg
- `state`: default | loading | disabled | error

> 실제 사용 여부와 상세 조합은 각 컴포넌트 문서에서 정의한다.

---

## 4. UX 톤 & 에러 메시지 가이드

### 기본 톤

- 에러 메시지는 **친절하고 부드러운 톤**을 사용한다.
- 사용자를 비난하거나 시스템 책임을 회피하는 표현을 지양한다.

### 에러 메시지 원칙

- 무엇이 문제인지 명확히 전달한다
- 가능하면 **해결 방법을 함께 제시**한다

예시:

- ❌ 요청에 실패했습니다
- ⭕ 네트워크 연결이 불안정해요. 잠시 후 다시 시도해 주세요

---

## 5. Layout & Header 정책

### 기본 방향

- 헤더는 **페이지 맥락에 따라 유연하게 변화**할 수 있어야 한다.
- 고정된 단일 헤더 구조를 전제로 하지 않는다.

### 권장 정책

- 인증(Auth) 관련 화면

  - 로그인 / 회원가입 / 비밀번호 재설정
  - → 헤더를 숨기거나 최소화

- 메인 쇼핑 플로우

  - 브랜드 인지 요소(로고)
  - 장바구니 진입점
  - 필요 시 뒤로가기 버튼

> 헤더의 상세 구성은 추후 UX 테스트 결과에 따라 조정 가능하도록 설계한다.

---

## 6. State & Accessibility

### UI 상태

- 로딩, 비활성, 오류 상태는 반드시 시각적으로 구분되어야 한다.
- 상태 표현은 variant를 통해 일관되게 관리한다.

### 접근성

- 접근성은 기본 요건으로 간주한다.
- 다음 원칙을 준수한다:

  - 충분한 터치 영역
  - 명확한 포커스 표시
  - 색상 대비 고려

---

## 7. 문서 구조 & 참조 관계

- `ui/index.md`

  - UI 시스템의 최상위 정책 및 철학

- `ui/common/*`

  - 버튼, 인풋, 폼 등 재사용 가능한 공통 컴포넌트

- 각 컴포넌트 문서는 다음을 포함한다:

  - CVA 정의
  - variant 목록
  - 사용 예시

---

### 요약

- Mobile First
- 소비자용 쇼핑몰 UX
- CVA 중심 UI 시스템
- variant 기반 상태 관리
- 친절한 UX 톤
- 확장 가능한 레이아웃 구조
