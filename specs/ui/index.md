# UI System Index

이 문서는 본 프로젝트의 **UI 시스템 전반에 대한 설계 철학, 공통 원칙, 구성 구조**를 정의한다.

본 UI 시스템은 **Mobile First**, **소비자용 쇼핑몰**, **확장 가능한 설계**를 전제로 하며, Claude Code가 전체 UI 결정을 일관되게 수행할 수 있도록 작성되었다.

---

## 1. UI 시스템의 목표

- 빠르고 명확한 정보 전달
- 모바일 환경에서의 높은 사용성
- 기능보다 **이해하기 쉬운 UX** 우선
- 컴포넌트 재사용성과 확장성 확보

---

## 2. 기본 전제

- 서비스 성격: **소비자용 쇼핑몰**
- 주요 사용자 환경: **모바일 웹 (Mobile First)**
- 데스크톱은 모바일 설계를 기반으로 점진적 확장

---

## 3. 핵심 설계 원칙

### 3.1 Mobile First

- 모든 UI는 모바일 화면을 기준으로 설계한다.
- 데스크톱 레이아웃은 모바일 UI를 확장하는 방식으로 구성한다.
- 터치 영역, 정보 밀도, 시선 흐름을 우선 고려한다.

### 3.2 단순함 우선

- 불필요한 인터랙션은 제거한다.
- 한 화면에 하나의 주요 행동만 존재하도록 설계한다.
- 사용자에게 판단 부담을 주지 않는다.

### 3.3 친절한 UX 톤

- 에러 메시지와 안내 문구는 **친절하고 부드러운 톤**을 사용한다.
- 사용자를 탓하는 표현을 사용하지 않는다.
- 가능한 경우 다음 행동을 함께 안내한다.

---

## 4. CVA 기반 UI 시스템

본 프로젝트의 UI 컴포넌트는 **Class Variance Authority(CVA)**를 사용하여 관리한다.

### 4.1 CVA 사용 목적

- 조건문 기반 스타일 분기 제거
- 상태와 표현을 명확히 분리
- 컴포넌트 확장 시 일관성 유지

### 4.2 Variant 설계 원칙

- 상태는 `variant`로만 표현한다.
- 시각적 변화는 조합 가능한 variant로 관리한다.
- 새로운 상태 추가 시 기존 variant 구조를 해치지 않는다.

---

## 5. 아이콘 시스템

본 프로젝트의 모든 아이콘은 **lucide-react**를 사용한다.

### 5.1 lucide-react 사용 이유

- 일관된 디자인 스타일
- Tree-shaking 지원으로 번들 크기 최적화
- TypeScript 완벽 지원
- React 컴포넌트 기반으로 사용 간편

### 5.2 사용 규칙

✅ **올바른 사용**
```tsx
import { Search, ShoppingCart, User } from 'lucide-react'

<Search className="w-5 h-5 text-[var(--color-text-secondary)]" />
<ShoppingCart className="w-6 h-6 text-[var(--color-primary-500)]" />
```

❌ **잘못된 사용**
- 다른 아이콘 라이브러리 혼용 금지
- SVG 파일 직접 임포트 지양 (브랜드 로고 등 예외)
- 이미지 태그로 아이콘 사용 금지

### 5.3 아이콘 크기 가이드

- 작은 아이콘: `w-4 h-4` (16px)
- 기본 아이콘: `w-5 h-5` (20px)
- 큰 아이콘: `w-6 h-6` (24px)
- 특별히 큰 아이콘: `w-8 h-8` (32px)

### 5.4 아이콘 색상

아이콘 색상은 **테마 시스템의 텍스트 컬러**를 따른다:
- 주요 아이콘: `text-[var(--color-text-primary)]`
- 보조 아이콘: `text-[var(--color-text-secondary)]`
- 비활성 아이콘: `text-[var(--color-text-muted)]`
- 강조 아이콘: `text-[var(--color-primary-500)]`

---

## 6. UI 레이어 구조

```
ui/
├─ index.md              # UI 시스템 전체 가이드
├─ common/               # 전역 공통 컴포넌트
│  ├─ button.md
│  ├─ input.md
│  ├─ select.md
│  ├─ checkbox.md
│  ├─ radio.md
│  ├─ switch.md
│  ├─ form.md
│  ├─ form-field.md
│  ├─ modal.md
│  ├─ toast.md
│  ├─ loading.md
│  ├─ empty-state.md
│  ├─ badge.md
```

- `common`: 서비스 전반에서 재사용되는 UI 규칙과 컴포넌트
- Page / Feature 단위 UI는 별도 폴더에서 관리한다.

---

## 7. Form & UI 책임 분리

- UI 컴포넌트는 **상태를 생성하지 않는다**.
- Form 로직은 Page 또는 Feature 레벨에서 관리한다.
- UI는 전달받은 상태를 시각적으로 표현하는 역할만 가진다.

---

## 8. 접근성 (Accessibility)

- 키보드 사용 가능
- 스크린 리더 인식 가능
- 색상만으로 정보를 전달하지 않는다

접근성은 선택 사항이 아닌 **기본 요구사항**이다.

---

## 9. 에러 / 로딩 / Empty 상태 우선순위

1. Loading
2. Error
3. Empty
4. Content

> 사용자는 항상 "지금 무슨 상태인지"를 알 수 있어야 한다.

---

## 10. 문서 활용 가이드

- 본 문서는 **설계 기준 문서**이다.
- 새로운 UI 추가 시 반드시 본 문서와 common 규칙을 따른다.
- 예외가 필요한 경우 명시적으로 문서화한다.

---

### 요약

- Mobile First 소비자 쇼핑몰 UI
- CVA 기반 UI 시스템
- 친절하고 단순한 UX
- 명확한 책임 분리
- 확장 가능한 구조
