/**
 * GET /api/products/:id/sample
 *
 * 상품 샘플 오디오 스트리밍
 * - 보이스팩 구매 전 샘플 청취
 * - 인증 불필요 (공개)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/server/services/product.service';
import { handleApiError, errorResponse } from '@/lib/server/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 상품 조회
    const product = await ProductService.getProductById(id);

    // 2. 샘플 오디오 URL 확인
    if (!product.sample_audio_url) {
      return errorResponse('샘플 오디오가 제공되지 않는 상품입니다', 404, 'SAMPLE_NOT_FOUND');
    }

    // 3. R2에서 오디오 파일 가져오기
    const audioResponse = await fetch(product.sample_audio_url);

    if (!audioResponse.ok) {
      return errorResponse('샘플 오디오를 불러올 수 없습니다', 500, 'SAMPLE_FETCH_FAILED');
    }

    // 4. 오디오 스트림 반환
    const audioBuffer = await audioResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // 1년 캐시
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
