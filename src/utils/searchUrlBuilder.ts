import { OnnuriMall } from '../types/onnuri';

/**
 * URL에서 안전하게 호스트명(www. 제거)을 추출합니다.
 */
export function extractCleanHostname(urlStr: string | null): string | null {
  if (!urlStr) return null;
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

/**
 * 기존 onnuri_unified_search_demo.html의 구글 검색 URL 생성 로직을 보존합니다.
 */
export function buildGoogleWebSearchUrl(mall: OnnuriMall, rawQuery: string): string {
  const q = rawQuery.trim() || '온누리상품권';
  const hostname = extractCleanHostname(mall.homeUrl);
  const term = hostname ? `site:${hostname} ${q}` : `"${mall.name}" ${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent(term)}`;
}

/**
 * 네이버 웹 검색 결과를 통해 해당 쇼핑몰 상품을 찾을 수 있는 보조 검색 링크를 생성합니다.
 */
export function buildNaverWebSearchUrl(mall: OnnuriMall, rawQuery: string): string {
  const q = rawQuery.trim() || '온누리상품권';
  const hostname = extractCleanHostname(mall.homeUrl);
  const term = hostname ? `site:${hostname} ${q}` : `"${mall.name}" ${q}`;
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(term)}`;
}

/**
 * 쇼핑몰별 최적 상품 검색 URL을 반환합니다.
 * - 직접 검색 URL 템플릿(searchUrlTemplate)이 검증된 쇼핑몰은 쇼핑몰 내부/전용관 검색 페이지로 바로 이동합니다.
 * - 검색 URL이 미확인된 쇼핑몰은 외부 웹 검색(구글 site: 또는 키워드 검색)으로 안전하게 연결합니다.
 */
export function buildMallPrimarySearchUrl(mall: OnnuriMall, rawQuery: string): string {
  const q = rawQuery.trim();
  if (mall.searchUrlTemplate) {
    const safeKeyword = encodeURIComponent(q || '온누리');
    return mall.searchUrlTemplate.replace('{query}', safeKeyword);
  }
  return buildGoogleWebSearchUrl(mall, q || '온누리상품권');
}

/**
 * 홈페이지와 전용관 URL을 구분하여 반환합니다.
 * 종합몰 내 전용관은 종합몰 전체 메인 페이지가 아닌 확인된 전용관 URL을 우선 반환합니다.
 */
export function getMallOfficialEntryUrl(mall: OnnuriMall): {
  url: string;
  label: string;
} | null {
  if (mall.mallType === '전용관' && mall.dedicatedZoneUrl) {
    return {
      url: mall.dedicatedZoneUrl,
      label: '전용관 열기',
    };
  }
  if (mall.homeUrl) {
    return {
      url: mall.homeUrl,
      label: '홈페이지',
    };
  }
  return null;
}
