-- Cart Items Table
-- 장바구니 기능을 위한 테이블
-- Created: 2025-01-04

-- =====================================================
-- CART ITEMS TABLE
-- =====================================================

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 사용자 정보
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 상품 정보
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- 수량
    quantity INTEGER NOT NULL DEFAULT 1,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_created_at ON cart_items(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- updated_at 자동 업데이트
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE cart_items IS '장바구니 아이템 (사용자별 상품 + 수량)';
COMMENT ON COLUMN cart_items.user_id IS '장바구니 소유자';
COMMENT ON COLUMN cart_items.product_id IS '장바구니에 담긴 상품';
COMMENT ON COLUMN cart_items.quantity IS '상품 수량 (1 이상)';
COMMENT ON CONSTRAINT cart_items_user_product_unique ON cart_items IS '사용자당 동일 상품은 하나의 장바구니 아이템만 존재 (수량으로 관리)';
