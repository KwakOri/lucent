/**
 * Address Search API
 *
 * 카카오 주소 검색 API 프록시 엔드포인트
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  badRequestResponse,
  handleApiError
} from '@/lib/server/utils/api-response';
import { ApiError } from '@/lib/server/utils/errors';
import type {
  KakaoAddressSearchResponse,
  AddressSearchResult
} from '@/types/address';

const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '10';

    if (!query || query.trim().length === 0) {
      return badRequestResponse('검색어를 입력해주세요');
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      throw new ApiError('카카오 API 키가 설정되지 않았습니다', 500);
    }

    // 카카오 API 호출
    const kakaoResponse = await fetch(
      `${KAKAO_API_URL}?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    );

    if (!kakaoResponse.ok) {
      throw new ApiError('주소 검색에 실패했습니다', kakaoResponse.status);
    }

    const data: KakaoAddressSearchResponse = await kakaoResponse.json();

    // 응답 데이터를 클라이언트에 맞게 변환
    const results: AddressSearchResult[] = data.documents.map((doc) => ({
      roadAddress: doc.road_address?.address_name || null,
      jibunAddress: doc.address.address_name,
      zonecode: doc.road_address?.zone_no || '',
      buildingName: doc.road_address?.building_name || undefined,
    }));

    return successResponse({
      results,
      meta: data.meta,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
