export type MallKind = '전용몰' | '전용관' | '검토';

export type VerificationStatus =
  | 'verified'       // 2026.10 공식 사용처 목록 확인 완료
  | 'app_mainly'     // 공식 사용처이나 모바일 앱 중심 운영
  | 'needs_review';  // 현행 사용처 재확인 필요 (기존 이미지 수록 등)

/**
 * 데이터 연동 가능성 3단계 분류 (요구사항 6번 기준)
 * 1. official_api_available: 공식 API 또는 허가된 제휴 데이터로 실제 연동 가능 (API 키/백엔드 프록시 연결 시)
 * 2. search_link_only: 공개 상품 API 미제공으로 쇼핑몰 직접 검색 링크 또는 외부 웹 검색 연결만 가능
 * 3. affiliate_or_verification_needed: 추가 제휴 계약 필요 또는 현행 사용처 확인 필요
 */
export type IntegrationCategory =
  | 'public_search'
  | 'official_api_available'
  | 'search_link_only'
  | 'affiliate_or_verification_needed';

export type SearchLinkMethod =
  | 'direct_mall_search'   // 쇼핑몰 자체 검색 URL 직접 연결
  | 'dedicated_zone_search'// 종합몰 내 온누리 전용관 키워드 조합 검색
  | 'google_site_search'   // 도메인 지정 구글 웹 검색 (site:domain)
  | 'google_keyword_search'; // 쇼핑몰명 + 키워드 외부 웹 검색

export interface OnnuriMall {
  /** 고유 ID */
  id: string;
  /** 쇼핑몰 이름 (기존 24개 쇼핑몰 이름 보존) */
  name: string;
  /** 대체 아이콘 텍스트 코드 */
  code: string;
  /** 대체 아이콘 배경 색상 */
  color: string;
  /** 로고 이미지 URL (선택) */
  logoUrl?: string;
  /** 공식 홈페이지 주소 (직접 확인된 경우만 입력, 미확인 시 null) */
  homeUrl: string | null;
  /** 종합몰 내 공식 전용관 URL 또는 안내 주소 (전용관 URL이 별도로 확인된 경우) */
  dedicatedZoneUrl: string | null;
  /** 직접 검색 URL 템플릿 ({query} 자리에 URL 인코딩된 검색어 치환, 미확인 시 null) */
  searchUrlTemplate: string | null;
  /** 쇼핑몰 유형: 전용몰(온누리 중심몰) | 전용관(종합몰 내 전용관) | 검토(추가 확인 필요) */
  mallType: MallKind;
  /** 공식 사용처 검증 상태 */
  verificationStatus: VerificationStatus;
  /** 마지막 검증 날짜 (YYYY-MM-DD) */
  lastVerifiedDate: string;
  /** 데이터 연동 가능성 분류 (1: 공식 API 가능, 2: 검색 링크만 가능, 3: 제휴/확인 필요) */
  integrationCategory: IntegrationCategory;
  /** 현재 검색 연결 방식 */
  searchLinkMethod: SearchLinkMethod;
  /** 데이터 제공 방식 및 API/연동 상세 안내 */
  integrationNote: string;
  /** 현재 사용 가능 여부 */
  isAvailable: boolean;
  /** 쇼핑몰 설명 (기존 note 보존 및 확장) */
  description: string;
  /** 주요 취급 카테고리 */
  categories: string[];
}

export interface UnifiedProduct {
  /** 상품 고유 식별자 */
  id: string;
  /** 판매 쇼핑몰 ID */
  mallId: string;
  /** 판매 쇼핑몰 이름 */
  mallName: string;
  /** 쇼핑몰 유형 */
  mallType: MallKind;
  /** 상품명 */
  title: string;
  /** 상품 이미지 URL */
  imageUrl: string;
  /** 상품 가격 (원) */
  price: number;
  /** 배송비 (원, 0이면 무료배송) */
  shippingFee: number | null;
  /** 총구매 예상 금액 (상품 가격 + 배송비) */
  totalPrice: number;
  /** 상품 상세 페이지 URL */
  productUrl: string;
  /** 추출된 규격/용량 정보 (동일 규격 비교 참고용, 예: '10kg', '1kg') */
  parsedSpec: string | null;
  /** 데이터 수집 또는 업데이트 시각 (ISO 8601) */
  updatedAt: string;
  /** 데이터 연동 출처 표시 */
  dataSourceLabel: string;
  /** 상품별 디지털 온누리 결제 가능 여부가 확인되지 않은 경우 */
  eligibility?: 'unknown';
}

export type ProductSortOption = 'relevance' | 'price_asc' | 'price_desc';

export interface AdapterSearchResponse {
  mallId: string;
  mallName: string;
  status: 'connected' | 'unconfigured_api_key' | 'link_only' | 'error';
  message: string;
  products: UnifiedProduct[];
  directSearchUrl: string;
  fetchedAt: string;
}

export interface ProductSearchAdapter {
  id: string;
  name: string;
  supportedMallIds: string[];
  isConfigured: () => boolean;
  searchProducts: (query: string) => Promise<AdapterSearchResponse[]>;
}
