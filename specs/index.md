# Simple Web Shop – Specification Index

이 문서는 전체 프로젝트의 단일 기준 스펙 문서이다. 세부 주제는 `spec/` 하위 문서로 분리 관리한다.

---

## 1. 프로젝트 개요

- 간단한 웹 쇼핑몰 구축
- 불필요한 기능 최소화, 운영 안정성 우선
- 결제 방식: **계좌이체만 사용 (PG 연동 없음)**

---

## 2. 기술 스택

- **Frontend**: Next.js
- **Backend**: Next.js API Router

  - 추후 NestJS 등으로 분리 가능하도록 레이어링

- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

---

## 3. 인증 시스템 개요

- 고객 및 관리자 모두 인증 필요
- Supabase Auth 사용
- Supabase 기본 이메일 인증 메일은 사용하지 않음
- 이메일 인증은 **사전 인증 방식**으로 자체 구현

📄 상세: `spec/auth/signup.md`

---

## 4. 주요 기능 요구사항

### 4.1 고객 영역

- 이메일 사전 인증
- 회원가입 / 로그인 / 로그아웃
- 상품 목록 조회
- 상품 상세 페이지
- 주문 생성 (계좌이체)
- 주문 완료 페이지 (입금 안내)
- 본인 주문 내역 및 상태 조회

### 4.2 관리자 영역

- 관리자 로그인 (Supabase Auth)
- 상품 CRUD
- 상품 이미지 업로드
- 주문 목록 조회
- 주문 상태 수동 변경 (입금 확인)
- 고객 정보 조회

---

## 5. 결제 및 주문 정책

- 결제 수단: 계좌이체 단일
- 주문 생성 시 상태는 `입금대기`
- 관리자 수동 입금 확인 후 상태 변경
- 자동 입금 확인 기능 없음

---

## 6. 데이터 모델 (요약)

### Product

- id
- name
- price
- description
- image_url
- is_active

### Order

- id
- user_id
- status (PENDING / PAID / SHIPPED / DONE)
- created_at

### OrderItem

- order_id
- product_id
- quantity
- price_snapshot

---

## 7. API 레이어링 원칙

- API Route: Thin Controller
- Service Layer: 비즈니스 로직
- Repository Layer: DB 접근

구조는 NestJS 이전을 고려하여 설계한다.

---

## 8. UI 시스템

- 모바일 우선 반응형
- 단순한 레이아웃
- 컴포넌트 단위 설계

---

## 9. 테스트 전략

- Service 단위 테스트 중심
- 핵심 API 플로우 테스트
- E2E / UI 테스트는 최소화

---

## 10. 추후 논의 항목

- 재고 관리 수준
- 주문 취소 / 환불 정책
- 배송비 정책
- 관리자 계정 수
