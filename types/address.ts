/**
 * 카카오 주소 검색 API 타입 정의
 */

export interface AddressSearchParams {
  query: string;
  page?: number;
  size?: number;
  analyze_type?: 'similar' | 'exact';
}

export interface KakaoAddressDocument {
  address_name: string;
  address_type: 'REGION' | 'ROAD' | 'REGION_ADDR' | 'ROAD_ADDR';
  x: string; // longitude
  y: string; // latitude
  address: {
    address_name: string;
    region_1depth_name: string; // 시도
    region_2depth_name: string; // 구
    region_3depth_name: string; // 동
    region_3depth_h_name: string;
    h_code: string;
    b_code: string;
    mountain_yn: 'Y' | 'N';
    main_address_no: string;
    sub_address_no: string;
    zip_code?: string;
  };
  road_address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: 'Y' | 'N';
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string; // 우편번호
  } | null;
}

export interface KakaoAddressSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoAddressDocument[];
}

export interface AddressSearchResult {
  roadAddress: string | null; // 도로명 주소
  jibunAddress: string; // 지번 주소
  zonecode: string; // 우편번호
  buildingName?: string; // 건물명
}
