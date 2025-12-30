/**
 * 디지털 상품 다운로드 API에 로깅 적용 예시
 *
 * 이 파일은 실제 다운로드 API를 구현할 때 참고하는 예시 코드입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, successResponse, errorResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

// ===== 다운로드 링크 생성 API 예시 =====

export async function generateDownloadLinkExample(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('인증이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    const { orderId } = await request.json();

    // TODO: 권한 확인 로직
    // - 사용자가 해당 상품을 구매했는지 확인
    // - 주문 상태가 PAID 이상인지 확인
    // const order = await OrderService.getOrderById(orderId);
    // const hasPermission = order.user_id === user.id && order.status === 'PAID';

    const hasPermission = true; // 실제로는 위 로직으로 확인

    if (!hasPermission) {
      // 권한 없는 다운로드 시도 로그
      await LogService.logUnauthorizedDownload(
        params.productId,
        user.id,
        request.ip
      );

      return errorResponse(
        '다운로드 권한이 없습니다',
        403,
        'DOWNLOAD_PERMISSION_DENIED'
      );
    }

    // TODO: 다운로드 링크 생성 (Cloudflare R2 presigned URL 등)
    // const downloadUrl = await generatePresignedUrl(productId);

    const downloadUrl = 'https://example.com/download/product-id';
    const expiresIn = 3600; // 1시간

    // 다운로드 링크 생성 로그
    await LogService.logDownloadLinkGenerated(params.productId, orderId, user.id);

    return successResponse({
      downloadUrl,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 디지털 상품 다운로드 API 예시 =====

export async function downloadDigitalProductExample(
  request: NextRequest,
  { params }: { params: { productId: string; orderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // 인증되지 않은 다운로드 시도 로그
      await LogService.logUnauthorizedDownload(
        params.productId,
        null,
        request.ip
      );

      return errorResponse('인증이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    // TODO: 권한 확인 로직
    // - 사용자가 해당 상품을 구매했는지 확인
    // - 주문 상태가 PAID 이상인지 확인
    // - 다운로드 횟수 제한 확인 (선택적)
    // const order = await OrderService.getOrderById(params.orderId);
    // const orderItem = order.items.find(item => item.product_id === params.productId);

    const hasPermission = true; // 실제로는 위 로직으로 확인

    if (!hasPermission) {
      // 권한 없는 다운로드 시도 로그
      await LogService.logUnauthorizedDownload(
        params.productId,
        user.id,
        request.ip
      );

      return errorResponse(
        '다운로드 권한이 없습니다',
        403,
        'DOWNLOAD_PERMISSION_DENIED'
      );
    }

    // TODO: 실제 파일 다운로드 로직
    // const fileStream = await downloadFromR2(productId);
    // const product = await ProductService.getProductById(params.productId);

    const product = {
      name: '미루루 보이스팩 Vol.1',
      file_size: 15000000, // 15MB
    };

    // 디지털 상품 다운로드 로그
    await LogService.logDigitalProductDownload(
      params.productId,
      params.orderId,
      user.id,
      request.ip,
      {
        productName: product.name,
        fileSize: product.file_size,
      }
    );

    // TODO: 다운로드 횟수 증가 (DB 업데이트)
    // await OrderService.incrementDownloadCount(params.orderId, params.productId);

    // 실제로는 파일 스트림을 반환
    return new NextResponse('File stream here', {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${product.name}.zip"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 만료된 링크 접근 처리 예시 =====

export async function handleExpiredLinkExample(
  request: NextRequest,
  { params }: { params: { productId: string; token: string } }
) {
  try {
    const user = await getCurrentUser();

    // TODO: 토큰 검증
    // const isValid = await verifyDownloadToken(params.token);

    const isExpired = true; // 토큰이 만료되었다고 가정

    if (isExpired) {
      // 만료된 링크 접근 로그
      await LogService.logExpiredLinkAccess(
        params.productId,
        user?.id || null,
        request.ip
      );

      return errorResponse(
        '다운로드 링크가 만료되었습니다. 새 링크를 생성해주세요.',
        410,
        'DOWNLOAD_LINK_EXPIRED'
      );
    }

    return successResponse({ message: '유효한 링크입니다' });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 마이페이지에서 다운로드 가능한 상품 목록 조회 예시 =====

export async function getDownloadableProductsExample(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('인증이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    // TODO: 사용자가 구매한 디지털 상품 목록 조회
    // const orders = await OrderService.getUserOrders(user.id, { status: 'PAID' });
    // const digitalProducts = orders.flatMap(order =>
    //   order.items.filter(item => item.product_type === 'VOICE_PACK')
    // );

    const digitalProducts = [
      {
        orderId: 'order-1',
        productId: 'product-1',
        productName: '미루루 보이스팩 Vol.1',
        downloadCount: 2,
        purchasedAt: '2025-01-15T10:00:00Z',
      },
    ];

    return successResponse(digitalProducts);
  } catch (error) {
    return handleApiError(error);
  }
}
