# UI Theme System - Color & Design Tokens

이 문서는 Lucent Management 프로젝트의 **색상 시스템과 디자인 토큰**을 정의합니다.

**중요**: 모든 UI 작업 시 이 문서의 컬러 토큰을 반드시 따라야 합니다.

---

## 핵심 원칙

1. **색상은 의미로 사용한다** - 숫자 기반 접근 금지
2. **텍스트는 text-* 토큰만 사용한다** - 임의의 회색 금지
3. **Primary 컬러는 절제해서 쓴다** - 한 화면에 1~2곳만
4. **Neutral이 UI의 80% 이상을 차지해야 한다**
5. **중요도 차이는 색이 아니라 위치·폰트·여백으로 해결**
6. **Tailwind 직접 클래스를 사용한다** - CSS Variables 사용 금지

---

## Tailwind 사용 방식 (중요!)

**✅ 올바른 사용:**
```tsx
<div className="bg-neutral-50">
  <p className="text-text-primary">제목</p>
  <button className="bg-primary-700 text-text-inverse">버튼</button>
</div>
```

**❌ 잘못된 사용:**
```tsx
<div className="bg-[var(--color-neutral-50)]">
  <p className="text-[var(--color-text-primary)]">제목</p>
  <button className="bg-[var(--color-primary-700)]">버튼</button>
</div>
```

**이유**: Tailwind의 직접 클래스를 사용하면 더 간결하고, IDE 자동완성이 잘 작동하며, 유지보수가 쉽습니다.

---

## 1️⃣ Text Color 매핑 (실사용 기준)

### 토큰 정의

| Tailwind Class | Hex | 사용 위치 |
|----------------|-----|----------|
| `text-text-primary` | `#2d2d2d` | 본문 텍스트, 상품명, 폼 label, 기본 UI 텍스트 |
| `text-text-secondary` | `#5f6368` | 설명 문구, 보조 정보, helper text |
| `text-text-muted` | `#8a8f94` | placeholder, hint, 비활성 설명 |
| `text-text-inverse` | `#ffffff` | 네이비/다크 배경 위 텍스트 |

### 사용 규칙

✅ **올바른 사용**
- 본문은 무조건 `text-text-primary`
- 중요도가 낮은 설명은 `text-text-secondary`
- placeholder는 `text-text-muted`

❌ **잘못된 사용**
- 회색 텍스트를 임의로 만들지 않는다 (`text-gray-600` 같은 것 사용 금지)
- 색상으로 중요도를 표현하지 않는다 (위치, 폰트, 여백으로 해결)

### Tailwind 사용 예시

```tsx
// ✅ 올바른 사용
<h1 className="text-text-primary">제목</h1>
<p className="text-text-secondary">설명</p>
<input placeholder="입력하세요" className="placeholder:text-text-muted" />

// ❌ 잘못된 사용
<h1 className="text-gray-800">제목</h1>
<p className="text-gray-600">설명</p>
```

---

## 2️⃣ Primary Blue 매핑 (하늘색 / 남색 계열)

### 토큰 정의

| Tailwind Class | 용도 |
|----------------|------|
| `bg-primary-700` / `text-primary-700` | 핵심 액션 강조 (Primary Button, CTA) |
| `bg-primary-600` / `text-primary-600` | hover / active 상태 |
| `bg-primary-500` / `text-primary-500` | 선택 상태, 링크 |
| `bg-primary-100` | 선택됨 배경 |
| `bg-primary-50` | 서브 배경, 강조 영역 |

### 사용 규칙

✅ **올바른 사용**
- Primary 컬러는 항상 **의도가 있을 때만** 사용
- 한 화면에 primary 강조는 **최대 1~2곳**
- CTA 버튼, 링크, 선택 상태에만 사용

❌ **잘못된 사용**
- 장식용으로 사용 금지
- 아이콘, 구분선 등에 primary 남발 금지
- 중요하지 않은 요소에 primary 사용 금지

### Tailwind 사용 예시

```tsx
// ✅ 올바른 사용 (CTA 버튼)
<button className="bg-primary-700 text-text-inverse hover:bg-primary-600">
  구매하기
</button>

// ✅ 올바른 사용 (링크)
<a className="text-primary-500 hover:text-primary-600">
  자세히 보기
</a>

// ❌ 잘못된 사용 (장식용)
<div className="border-primary-500">
  일반 카드
</div>
```

---

## 3️⃣ Neutral Color 매핑 (배경 / 구분선)

### 토큰 정의

| Tailwind Class | 사용 위치 |
|----------------|----------|
| `bg-white` | 전체 페이지 배경, 카드 배경 |
| `bg-neutral-50` | 서브 배경, 섹션 배경 |
| `bg-neutral-100` | input background |
| `border-neutral-200` | divider, border |
| `border-neutral-300` | 비활성 border |

### 사용 규칙

✅ **올바른 사용**
- 배경은 항상 `neutral` 또는 `white` 사용
- 구분선, border는 `border-neutral-200` 사용
- 비활성 상태는 `border-neutral-300`

❌ **잘못된 사용**
- 컬러 배경 위에 텍스트를 얹지 않는다 (예외: hero 영역)
- `bg-gray-100` 같은 직접 지정 금지

### Tailwind 사용 예시

```tsx
// ✅ 올바른 사용
<div className="bg-white">
  <div className="bg-neutral-50 border border-neutral-200">
    카드 내용
  </div>
</div>

// ❌ 잘못된 사용
<div className="bg-gray-50 border-gray-200">
  카드 내용
</div>
```

---

## 4️⃣ Semantic Color 매핑 (저채도 유지)

### Error

| Tailwind Class | 사용 위치 |
|----------------|----------|
| `text-error-600` | 에러 텍스트 |
| `bg-error-100` | 에러 배경 |
| `border-error-500` | 에러 border |

### Success / Warning / Info

**사용처**: Toast, 상태 표시용으로만 사용

❌ **폼 기본 UI에는 사용 금지**

### Tailwind 사용 예시

```tsx
// ✅ 올바른 사용 (에러 메시지)
<p className="text-error-600">
  이메일 형식이 올바르지 않습니다
</p>

// ✅ 올바른 사용 (에러 border)
<input className="border-error-500" />

// ❌ 잘못된 사용 (일반 UI에 success 남발)
<div className="bg-green-50">
  일반 정보
</div>
```

---

## 5️⃣ Component 기준 매핑 (실전 중요)

### Input

```tsx
<input
  className="
    text-text-primary
    placeholder:text-text-muted
    border-neutral-200
    focus:border-primary-500
    disabled:bg-neutral-100
  "
/>

// 에러 상태
<input
  className="
    border-error-500
    text-text-primary
  "
/>
```

**규칙**:
- text: `text-text-primary`
- placeholder: `placeholder:text-text-muted`
- border: `border-neutral-200`
- focus: `focus:border-primary-500`
- error: `border-error-500`

### Button

#### Primary Button
```tsx
<button
  className="
    bg-primary-700
    text-text-inverse
    hover:bg-primary-600
  "
>
  구매하기
</button>
```

#### Secondary Button
```tsx
<button
  className="
    bg-neutral-100
    text-text-primary
    hover:bg-neutral-200
  "
>
  취소
</button>
```

#### Disabled Button
```tsx
<button
  disabled
  className="
    bg-neutral-200
    text-text-muted
    cursor-not-allowed
  "
>
  비활성
</button>
```

### Modal

```tsx
<div className="fixed inset-0 bg-black/40"> {/* overlay */}
  <div className="bg-white rounded-lg">
    <h2 className="text-text-primary">제목</h2>
    <p className="text-text-secondary">설명</p>
  </div>
</div>
```

**규칙**:
- overlay: `bg-black/40`
- bg: `bg-white`
- title: `text-text-primary`
- description: `text-text-secondary`

### Card

```tsx
<div
  className="
    bg-neutral-50
    border border-neutral-200
    rounded-lg
  "
>
  <h3 className="text-text-primary">카드 제목</h3>
  <p className="text-text-secondary">카드 설명</p>
</div>
```

---

## 6️⃣ Tailwind 사용 원칙 (중요)

### ❌ 이렇게 쓰지 말 것

```tsx
// CSS Variables 사용 (구식)
<p className="text-[var(--color-text-primary)]">텍스트</p>
<button className="bg-[var(--color-primary-700)]">버튼</button>

// 숫자 기반 컬러 접근 (의미 파괴)
<p className="text-gray-800">텍스트</p>
<button className="bg-blue-500">버튼</button>
<div className="border-gray-300">구분선</div>
```

### ✅ 이렇게 쓸 것

```tsx
// Tailwind 직접 클래스 사용
<p className="text-text-primary">텍스트</p>
<button className="bg-primary-700">버튼</button>
<div className="border-neutral-200">구분선</div>
```

**이유**:
- 더 간결하고 읽기 쉬움
- IDE 자동완성이 잘 작동
- Tailwind의 최적화 기능 활용 가능
- 의미 기반 토큰 사용으로 유지보수 용이

---

## 7️⃣ CSS Variables 정의 (참고용)

`globals.css`의 `@theme` 블록에 다음 CSS Variables가 정의되어 있습니다.
이 변수들은 Tailwind가 자동으로 클래스로 변환해줍니다.

```css
@theme {
  /* Text Colors */
  --color-text-primary: #2d2d2d;
  --color-text-secondary: #5f6368;
  --color-text-muted: #8a8f94;
  --color-text-inverse: #ffffff;

  /* Primary Colors (Blue) */
  --color-primary-50: #e3f2fd;
  --color-primary-100: #bbdefb;
  --color-primary-500: #2196f3;
  --color-primary-600: #1e88e5;
  --color-primary-700: #1976d2;

  /* Neutral Colors */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8f9fa;
  --color-neutral-100: #f1f3f4;
  --color-neutral-200: #e8eaed;
  --color-neutral-300: #dadce0;

  /* Semantic Colors - Error */
  --color-error-100: #fce8e6;
  --color-error-500: #d93025;
  --color-error-600: #c5221f;

  /* Semantic Colors - Success */
  --color-success-100: #e6f4ea;
  --color-success-500: #34a853;
  --color-success-600: #2e7d32;
}
```

**중요**: 이 변수들을 직접 `var(--color-*)` 형태로 사용하지 마세요.
Tailwind 클래스(`bg-primary-700`, `text-text-primary` 등)를 사용하세요.

---

## 8️⃣ 최종 요약 (팀 기준)

### 필수 규칙

1. ✅ **Tailwind 직접 클래스 사용**
   - `text-[var(--color-text-primary)]` ❌
   - `text-text-primary` ✅

2. ✅ **색상은 의미로 사용한다**
   - `text-gray-800` ❌
   - `text-text-primary` ✅

3. ✅ **텍스트는 text-* 토큰만 사용한다**
   - 임의의 회색 생성 금지

4. ✅ **Primary 컬러는 절제해서 쓴다**
   - 한 화면에 최대 1~2곳

5. ✅ **Neutral이 UI의 80% 이상을 차지해야 한다**
   - 배경, border, 구분선은 모두 neutral

6. ✅ **중요도 차이는 색이 아니라 위치·폰트·여백으로 해결**
   - 폰트 크기, 굵기, 여백으로 계층 구조 표현

### 체크리스트 (컴포넌트 작성 전)

- [ ] Tailwind 직접 클래스를 사용했는가? (CSS Variables 사용 안 함)
- [ ] text-* 토큰만 사용했는가?
- [ ] primary 컬러를 남발하지 않았는가?
- [ ] 배경/border는 neutral을 사용했는가?
- [ ] 의미 없는 컬러를 사용하지 않았는가?

---

## 참고

- UI 시스템 전체 가이드: `/specs/ui/index.md`
- 공통 컴포넌트 스펙: `/specs/ui/common/`
- 프로젝트 개요: `/CLAUDE.md`
