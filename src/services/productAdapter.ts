import { ONNURI_MALLS } from '../data/malls';
import {
  AdapterSearchResponse,
  ProductSearchAdapter,
  ProductSortOption,
  UnifiedProduct,
} from '../types/onnuri';
import { buildMallPrimarySearchUrl } from '../utils/searchUrlBuilder';
import { matchesSearchQuery } from '../utils/searchMatch.mjs';

/**
 * 상품명에서 규격·중량·용량(예: 10kg, 20kg, 500g, 2L x 6개 등)을 추출합니다.
 * 서로 다른 규격/용량 상품을 임의로 동일 상품으로 취급하지 않도록 규격을 분리 표시합니다.
 */
export function extractProductSpec(title: string): string | null {
  const normalized = title.replace(/\s+/g, ' ').trim();
  // 복합 수량 규격 (예: 2L x 6개, 500g * 2팩, 10kg+10kg)
  const multiMatch = normalized.match(
    /(\d+(?:\.\d+)?\s*(?:kg|g|mg|l|ml|리터|킬로)\s*[xX*+]\s*\d+\s*(?:개|입|팩|봉|병|포|박스|페트)?)/i
  );
  if (multiMatch) {
    return multiMatch[1].replace(/\s+/g, '').toLowerCase();
  }

  // 단일 중량/용량 규격 (예: 10kg, 4kg, 500g, 2L)
  const singleMatch = normalized.match(
    /(\d+(?:\.\d+)?\s*(?:kg|g|mg|l|ml|리터|킬로|포기|구|마리|세트|박스|매|롤))/i
  );
  if (singleMatch) {
    return singleMatch[1].replace(/\s+/g, '').toLowerCase();
  }

  return null;
}

/**
 * 통합 상품 목록을 정렬합니다.
 * - price_asc: 상품가 낮은 순 (배송비 미확인 상품도 공정하게 비교)
 * - price_desc: 상품가 높은 순
 * - relevance: 검색어 및 규격 일치도 높은 순
 */
export function sortUnifiedProducts(
  products: UnifiedProduct[],
  sortBy: ProductSortOption,
  query: string
): UnifiedProduct[] {
  const list = [...products];
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const querySpec = extractProductSpec(query);

  if (sortBy === 'price_asc') {
    return list.sort((a, b) => a.price - b.price);
  }

  if (sortBy === 'price_desc') {
    return list.sort((a, b) => b.price - a.price);
  }

  // 관련도순 정렬: 검색어 토큰 일치 개수 및 규격(예: 10kg) 정확 일치 여부 우선
  const scoreProduct = (item: UnifiedProduct): number => {
    const lowerTitle = item.title.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (lowerTitle.includes(token)) score += 10;
    }
    if (querySpec && item.parsedSpec === querySpec) {
      score += 25;
    } else if (querySpec && item.parsedSpec && item.parsedSpec !== querySpec) {
      // 검색어에 특정 규격(예: 10kg)이 있는데 다른 규격(예: 4kg)인 경우 후순위 배치
      score -= 10;
    }
    return score;
  };

  return list.sort((a, b) => {
    const diff = scoreProduct(b) - scoreProduct(a);
    if (diff !== 0) return diff;
    return a.price - b.price;
  });
}

/**
 * 외부 API 또는 검증된 JSON 피드에서 전달된 원시 상품 객체를 검증하고
 * 표준 UnifiedProduct 타입으로 안전하게 변환합니다.
 * 가짜 데이터를 생성하지 않으며 필수 필드가 누락된 항목은 제외합니다.
 */
export function normalizeRawProduct(raw: Record<string, unknown>): UnifiedProduct | null {
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null;
  const mallId = typeof raw.mallId === 'string' && raw.mallId.trim() ? raw.mallId.trim() : null;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
  const productUrl =
    typeof raw.productUrl === 'string' && raw.productUrl.startsWith('http')
      ? raw.productUrl
      : null;
  const price = typeof raw.price === 'number' && raw.price >= 0 ? raw.price : null;
  const shippingFee =
    typeof raw.shippingFee === 'number' && raw.shippingFee >= 0 ? raw.shippingFee : null;

  if (!id || !mallId || !title || !productUrl || price === null) {
    return null;
  }

  const matchedMall = ONNURI_MALLS.find((m) => m.id === mallId);
  const mallName =
    typeof raw.mallName === 'string' && raw.mallName.trim()
      ? raw.mallName.trim()
      : matchedMall?.name || mallId;
  const mallType = matchedMall?.mallType || '전용몰';
  const imageUrl =
    typeof raw.imageUrl === 'string' && raw.imageUrl.startsWith('http') ? raw.imageUrl : '';
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
      ? raw.updatedAt
      : new Date().toISOString();
  const dataSourceLabel =
    typeof raw.dataSourceLabel === 'string' && raw.dataSourceLabel.trim()
      ? raw.dataSourceLabel
      : '공식/제휴 API 연동';

  return {
    id,
    mallId,
    mallName,
    mallType,
    title,
    imageUrl,
    price,
    shippingFee,
    totalPrice: price + (shippingFee ?? 0),
    productUrl,
    parsedSpec: extractProductSpec(title),
    updatedAt,
    dataSourceLabel,
    eligibility: raw.eligibility === 'unknown' ? 'unknown' : undefined,
  };
}

/**
 * 백엔드 API 프록시 어댑터
 * - API 키와 비밀정보를 프런트엔드에 노출하지 않기 위해 백엔드 프록시 엔드포인트(VITE_ONNURI_API_PROXY_URL)를 통해 호출합니다.
 * - 프록시 서버가 설정되지 않은 환경에서는 가짜 상품을 생성하지 않고 투명하게 연동 대기 상태를 반환합니다.
 */
export class OfficialApiProxyAdapter implements ProductSearchAdapter {
  id = 'official-api-proxy';
  name = '상품 검색 어댑터';
  supportedMallIds: string[] = [];

  private proxyEndpoint: string | null;

  constructor(customEndpoint?: string) {
    const envUrl = import.meta.env.VITE_ONNURI_API_PROXY_URL;
    this.proxyEndpoint =
      customEndpoint?.trim() || (typeof envUrl === 'string' && envUrl.trim() ? envUrl.trim() : '/api/onnuri/products');
  }

  isConfigured(): boolean {
    return Boolean(this.proxyEndpoint);
  }

  async searchProducts(query: string): Promise<AdapterSearchResponse[]> {
    const now = new Date().toISOString();
    if (!this.proxyEndpoint || !query.trim()) {
      return [];
    }

    try {
      const url = new URL(this.proxyEndpoint, window.location.origin);
      url.searchParams.set('q', query);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API 응답 오류 (HTTP ${response.status})`);
      }

      const payload = (await response.json()) as {
        items?: Record<string, unknown>[];
        sources?: { mallId: string; status: 'connected' | 'error'; count: number }[];
      };
      const rawItems = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = rawItems
        .map((item) => normalizeRawProduct(item))
        .filter((item): item is UnifiedProduct => item !== null && matchesSearchQuery(item.title, query));

      const sources = Array.isArray(payload?.sources) ? payload.sources : [];
      return sources.flatMap((source) => {
        const mall = ONNURI_MALLS.find((m) => m.id === source.mallId);
        if (!mall) return [];
        const mallProducts = normalized.filter((p) => p.mallId === mall.id);
        return [{
          mallId: mall.id,
          mallName: mall.name,
          status: source.status,
          message: source.status === 'connected'
            ? `${mallProducts.length}건의 상품을 검색했습니다.`
            : '상품 검색 결과를 가져오지 못했습니다.',
          products: mallProducts,
          directSearchUrl: buildMallPrimarySearchUrl(mall, query),
          fetchedAt: now,
        }];
      });
    } catch (err) {
      console.error('상품 API 호출 실패', err);
      return ['onnuri-market-official', 'onnuri-goodday', 'inthemarket-onnuri', 'kkuk-ai-onnuri', 'onnuri-chance', 'onnuri-hotdeal'].flatMap((mallId) => {
        const mall = ONNURI_MALLS.find((item) => item.id === mallId);
        if (!mall) return [];
        return [{
          mallId: mall.id,
          mallName: mall.name,
          status: 'error' as const,
          message: err instanceof Error ? err.message : '검색 API 연결 실패',
          products: [],
          directSearchUrl: buildMallPrimarySearchUrl(mall, query),
          fetchedAt: now,
        }];
      });
    }
  }
}

/**
 * 전체 24개 쇼핑몰에 대해 통합 검색 결과(API 수집 상품 + 쇼핑몰별 검색 연결 상태)를 집계합니다.
 */
export async function executeUnifiedSearch(
  query: string,
  customItems: UnifiedProduct[] = [],
  customProxyUrl?: string
): Promise<{
  products: UnifiedProduct[];
  adapterResponses: AdapterSearchResponse[];
}> {
  const trimmed = query.trim();
  const proxyAdapter = new OfficialApiProxyAdapter(customProxyUrl);
  const apiResponses = await proxyAdapter.searchProducts(trimmed);
  const now = new Date().toISOString();

  const apiMallIds = new Set(apiResponses.map((r) => r.mallId));
  const linkResponses: AdapterSearchResponse[] = ONNURI_MALLS.filter(
    (m) => !apiMallIds.has(m.id)
  ).map((mall) => ({
    mallId: mall.id,
    mallName: mall.name,
    status: 'link_only',
    message: mall.integrationNote,
    products: [],
    directSearchUrl: buildMallPrimarySearchUrl(mall, trimmed),
    fetchedAt: now,
  }));

  const allResponses = [...apiResponses, ...linkResponses];

  // 사용자가 직접 업로드/연결한 검증된 실제 상품 피드 데이터 필터링
  const matchedCustomProducts = customItems.filter((item) => matchesSearchQuery(item.title, trimmed));

  const apiProducts = apiResponses.flatMap((r) => r.products);
  return {
    products: [...apiProducts, ...matchedCustomProducts],
    adapterResponses: allResponses,
  };
}
