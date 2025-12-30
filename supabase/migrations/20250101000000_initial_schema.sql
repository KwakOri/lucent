-- Lucent Management - Initial Schema Migration
-- Created: 2025-01-01
-- Description: MVP 1차 오픈을 위한 초기 데이터베이스 스키마

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Product Type
CREATE TYPE product_type AS ENUM ('VOICE_PACK', 'PHYSICAL_GOODS');

-- Order Status
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'MAKING', 'SHIPPING', 'DONE');

-- Email Verification Purpose
CREATE TYPE verification_purpose AS ENUM ('signup', 'reset_password', 'change_email');

-- =====================================================
-- TABLES
-- =====================================================

-- Images (이미지 파일 관리)
-- Cloudflare R2와 연동하여 모든 이미지 파일을 중앙 관리
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- R2 저장 정보
    r2_key VARCHAR(500) NOT NULL UNIQUE, -- R2 버킷 내 파일 경로
    r2_bucket VARCHAR(100) NOT NULL, -- R2 버킷 이름
    public_url VARCHAR(1000) NOT NULL, -- 공개 접근 URL

    -- 파일 메타데이터
    file_name VARCHAR(255) NOT NULL, -- 원본 파일명
    file_size INTEGER NOT NULL, -- 파일 크기 (bytes)
    mime_type VARCHAR(100) NOT NULL, -- MIME 타입 (image/png, image/jpeg 등)
    width INTEGER, -- 이미지 너비 (px)
    height INTEGER, -- 이미지 높이 (px)

    -- 용도 분류
    image_type VARCHAR(50) NOT NULL, -- 'project_cover', 'artist_profile', 'product_image' 등
    alt_text VARCHAR(500), -- 접근성을 위한 대체 텍스트

    -- CDN 및 최적화
    cdn_url VARCHAR(1000), -- CDN을 통한 최적화 URL (선택)
    thumbnail_url VARCHAR(1000), -- 썸네일 URL (선택)

    -- 관리 정보
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 업로드한 사용자 (관리자)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT images_file_size_positive CHECK (file_size > 0),
    CONSTRAINT images_dimensions_non_negative CHECK (
        (width IS NULL OR width > 0) AND
        (height IS NULL OR height > 0)
    )
);

CREATE INDEX idx_images_r2_key ON images(r2_key);
CREATE INDEX idx_images_image_type ON images(image_type);
CREATE INDEX idx_images_is_active ON images(is_active);
CREATE INDEX idx_images_uploaded_by ON images(uploaded_by);

-- Email Verifications (이메일 인증)
-- 회원가입, 비밀번호 재설정 등에 사용
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    purpose verification_purpose NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 인덱스
    CONSTRAINT email_verifications_token_key UNIQUE (token)
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- User Profiles (사용자 프로필)
-- auth.users를 확장하여 추가 정보 저장
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_profiles_email ON profiles(email);

-- Projects (프로젝트)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL, -- 커버 이미지
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_is_active ON projects(is_active);
CREATE INDEX idx_projects_order_index ON projects(order_index);

-- Artists (아티스트)
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    profile_image_id UUID REFERENCES images(id) ON DELETE SET NULL, -- 프로필 이미지
    shop_theme JSONB, -- 굿즈샵 테마 설정 (색상, 컨셉 등)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artists_project_id ON artists(project_id);
CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_is_active ON artists(is_active);

-- Products (상품)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type product_type NOT NULL,
    price INTEGER NOT NULL, -- 원화 단위 (예: 10000 = 10,000원)
    description TEXT,

    -- 이미지 관리 (images 테이블 참조)
    main_image_id UUID REFERENCES images(id) ON DELETE SET NULL, -- 메인 상품 이미지

    -- 오디오 파일 (보이스팩 전용, R2 직접 참조)
    sample_audio_url VARCHAR(500), -- 보이스팩 샘플 (Cloudflare R2)
    digital_file_url VARCHAR(500), -- 보이스팩 파일 (Cloudflare R2)

    stock INTEGER, -- 재고 (실물 굿즈용, NULL이면 무제한)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT products_slug_artist_unique UNIQUE (artist_id, slug),
    CONSTRAINT products_price_positive CHECK (price >= 0),
    CONSTRAINT products_stock_non_negative CHECK (stock IS NULL OR stock >= 0)
);

CREATE INDEX idx_products_artist_id ON products(artist_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);

-- Product Images (상품 이미지 갤러리)
-- 상품과 이미지의 다대다 관계 (여러 이미지를 순서대로 표시)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0, -- 이미지 표시 순서
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT product_images_unique UNIQUE (product_id, image_id)
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_image_id ON product_images(image_id);
CREATE INDEX idx_product_images_display_order ON product_images(display_order);

-- Orders (주문)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL UNIQUE, -- 주문번호 (예: ORD-20250101-0001)
    status order_status NOT NULL DEFAULT 'PENDING',
    total_price INTEGER NOT NULL,

    -- 배송 정보 (실물 굿즈용, 주문 시점의 스냅샷)
    -- 주문 생성 시 profiles 정보를 복사하되, 사용자가 수정 가능
    shipping_name VARCHAR(100), -- 수령인 이름
    shipping_phone VARCHAR(20), -- 수령인 연락처
    shipping_address TEXT, -- 배송 주소
    shipping_memo TEXT, -- 배송 메모 (문 앞, 경비실 등)

    -- 관리자 메모
    admin_memo TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT orders_total_price_positive CHECK (total_price >= 0)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items (주문 항목)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- 주문 당시 상품 정보 스냅샷
    product_name VARCHAR(255) NOT NULL,
    product_type product_type NOT NULL,
    price_snapshot INTEGER NOT NULL, -- 주문 당시 가격
    quantity INTEGER NOT NULL DEFAULT 1,

    -- 디지털 상품 다운로드 정보
    download_url VARCHAR(500), -- Cloudflare R2 presigned URL (보이스팩용)
    download_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_price_snapshot_non_negative CHECK (price_snapshot >= 0),
    CONSTRAINT order_items_download_count_non_negative CHECK (download_count >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Projects updated_at trigger
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Artists updated_at trigger
CREATE TRIGGER update_artists_updated_at
    BEFORE UPDATE ON artists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Products updated_at trigger
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Images updated_at trigger
CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders updated_at trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Profile 자동 생성 함수 (사용자 가입 시)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 새 사용자 생성 시 profile 자동 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE email_verifications IS '이메일 인증 토큰 저장 (회원가입, 비밀번호 재설정 등)';
COMMENT ON TABLE profiles IS '사용자 프로필 (auth.users 확장, 이름/연락처/주소 등)';
COMMENT ON TABLE images IS 'Cloudflare R2 이미지 파일 중앙 관리 테이블';
COMMENT ON TABLE projects IS '프로젝트 (0th, 1st 등)';
COMMENT ON TABLE artists IS '아티스트 (미루루, Drips 등)';
COMMENT ON TABLE products IS '상품 (보이스팩, 실물 굿즈)';
COMMENT ON TABLE product_images IS '상품 이미지 갤러리 (다대다 관계)';
COMMENT ON TABLE orders IS '주문 (주문자 정보는 profiles에서 조회)';
COMMENT ON TABLE order_items IS '주문 항목';

COMMENT ON COLUMN profiles.name IS '사용자 이름 (배송 정보 기본값으로 사용)';
COMMENT ON COLUMN profiles.phone IS '사용자 연락처 (배송 정보 기본값으로 사용)';
COMMENT ON COLUMN profiles.address IS '사용자 기본 주소 (배송 정보 기본값으로 사용)';
COMMENT ON COLUMN images.r2_key IS 'Cloudflare R2 버킷 내 파일 경로 (고유값)';
COMMENT ON COLUMN images.image_type IS '이미지 용도 분류 (project_cover, artist_profile, product_image 등)';
COMMENT ON COLUMN images.alt_text IS '접근성을 위한 대체 텍스트';
COMMENT ON COLUMN projects.cover_image_id IS '프로젝트 커버 이미지 (images 테이블 참조)';
COMMENT ON COLUMN artists.profile_image_id IS '아티스트 프로필 이미지 (images 테이블 참조)';
COMMENT ON COLUMN products.price IS '가격 (원화, 정수형)';
COMMENT ON COLUMN products.main_image_id IS '메인 상품 이미지 (images 테이블 참조)';
COMMENT ON COLUMN products.sample_audio_url IS '보이스팩 샘플 오디오 URL (Cloudflare R2)';
COMMENT ON COLUMN products.digital_file_url IS '보이스팩 전체 파일 URL (Cloudflare R2)';
COMMENT ON COLUMN product_images.display_order IS '이미지 표시 순서 (0부터 시작)';
COMMENT ON COLUMN orders.order_number IS '주문번호 (예: ORD-20250101-0001)';
COMMENT ON COLUMN orders.shipping_name IS '수령인 이름 (주문 시점 스냅샷, profiles.name에서 복사)';
COMMENT ON COLUMN orders.shipping_phone IS '수령인 연락처 (주문 시점 스냅샷, profiles.phone에서 복사)';
COMMENT ON COLUMN orders.shipping_address IS '배송 주소 (주문 시점 스냅샷, profiles.address에서 복사)';
COMMENT ON COLUMN order_items.price_snapshot IS '주문 당시 가격 (가격 변동 추적)';
COMMENT ON COLUMN order_items.download_url IS '디지털 상품 다운로드 URL (Cloudflare R2 presigned)';
