import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Clock,
  Code2,
  Database,
  ExternalLink,
  Layers,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import {
  AdapterSearchResponse,
  OnnuriMall,
  ProductSortOption,
  UnifiedProduct,
} from '../types/onnuri';
import { normalizeRawProduct, sortUnifiedProducts } from '../services/productAdapter';
import { buildMallPrimarySearchUrl } from '../utils/searchUrlBuilder';

interface UnifiedProductComparisonSectionProps {
  query: string;
  malls: OnnuriMall[];
  products: UnifiedProduct[];
  adapterResponses: AdapterSearchResponse[];
  isLoading: boolean;
  error: string | null;
  customProducts: UnifiedProduct[];
  onUpdateCustomProducts: (items: UnifiedProduct[]) => void;
  customProxyUrl: string;
  onUpdateCustomProxyUrl: (url: string) => void;
}

export const UnifiedProductComparisonSection: React.FC<
  UnifiedProductComparisonSectionProps
> = ({
  query,
  malls,
  products,
  adapterResponses,
  isLoading,
  error,
  customProducts,
  onUpdateCustomProducts,
  customProxyUrl,
  onUpdateCustomProxyUrl,
}) => {
  const [sortBy, setSortBy] = useState<ProductSortOption>('price_asc');
  const [selectedSpec, setSelectedSpec] = useState<string>('all');
  const [showAdapterPanel, setShowAdapterPanel] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [proxyInput, setProxyInput] = useState<string>(customProxyUrl);

  const activeQuery = query.trim() || '쌀 10kg';

  // 규격/용량 목록 추출 (동일 규격끼리만 비교할 수 있도록 분리)
  const availableSpecs = useMemo(() => {
    const specs = new Set<string>();
    for (const p of products) {
      if (p.parsedSpec) specs.add(p.parsedSpec);
    }
    return Array.from(specs);
  }, [products]);

  // 규격 필터 및 정렬 적용
  const sortedProducts = useMemo(() => {
    const filtered =
      selectedSpec === 'all'
        ? products
        : products.filter((p) => p.parsedSpec === selectedSpec);
    return sortUnifiedProducts(filtered, sortBy, activeQuery);
  }, [products, selectedSpec, sortBy, activeQuery]);

  // 직접 검색 URL(전용관/내부 검색)이 확인된 주요 쇼핑몰 목록
  const directSearchMalls = useMemo(
    () => malls.filter((m) => m.searchUrlTemplate !== null && m.isAvailable),
    [malls]
  );

  const handleApplyJsonFeed = () => {
    setJsonError(null);
    if (!jsonInput.trim()) {
      onUpdateCustomProducts([]);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      const rawArray = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : null;
      if (!rawArray) {
        setJsonError('유효한 JSON 배열 또는 { "items": [...] } 형식이 아닙니다.');
        return;
      }
      const validItems = rawArray
        .map((item: unknown) =>
          typeof item === 'object' && item !== null
            ? normalizeRawProduct(item as Record<string, unknown>)
            : null
        )
        .filter((item): item is UnifiedProduct => item !== null);

      if (validItems.length === 0) {
        setJsonError(
          '필수 필드(id, mallId, title, price, productUrl)가 포함된 유효한 상품 데이터가 없습니다.'
        );
        return;
      }
      onUpdateCustomProducts(validItems);
    } catch {
      setJsonError('JSON 구문 분석에 실패했습니다. 올바른 JSON 형식을 입력해 주세요.');
    }
  };

  const formatKRW = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section
      aria-labelledby="unified-comparison-title"
      className="py-8 max-w-[1140px] mx-auto px-4 sm:px-6"
    >
      <div className="bg-white border border-onnuri-line rounded-panel p-5 sm:p-7 shadow-sm">
        {/* 섹션 상단 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-onnuri-line">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-onnuri-green mb-1">
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>통합 상품 검색 및 가격 비교 엔진</span>
            </div>
            <h2
              id="unified-comparison-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-onnuri-ink"
            >
              {query.trim() ? (
                <>
                  <span className="text-onnuri-green">“{query.trim()}”</span> 통합 검색 결과 및 쇼핑몰 바로가기
                </>
              ) : (
                '온누리몰 통합 상품 비교 및 직접 검색 연결'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-[#687770] mt-1">
              공식 API·검증 데이터가 연결된 쇼핑몰은 상품 가격과 배송비를 직접 비교하고, API 미제공 쇼핑몰은 전용관·내부 검색 결과로 즉시 연결합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowAdapterPanel((prev) => !prev)}
              aria-expanded={showAdapterPanel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-onnuri-line bg-onnuri-cream hover:border-onnuri-green text-xs font-extrabold text-onnuri-ink transition-colors"
            >
              <Code2 className="w-4 h-4 text-onnuri-green" aria-hidden="true" />
              <span>API 어댑터 상태 및 데이터 연동 설정</span>
            </button>
          </div>
        </div>

        {/* 1. 직접 검색 URL 지원 쇼핑몰 원클릭 비교 바로가기 바 */}
        <div className="mt-5 bg-[#f7faf8] border border-[#dce8df] rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-onnuri-green text-white text-[11px] font-extrabold">
                실시간 검색 바로가기
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-onnuri-ink">
                검증된 내부/전용관 검색 URL 보유 쇼핑몰 ({directSearchMalls.length}곳) —{' '}
                <span className="text-onnuri-green">“{activeQuery}”</span> 즉시 검색
              </h3>
            </div>
            <span className="text-[11px] text-[#6d7c74] font-semibold">
              클릭 시 각 쇼핑몰의 온누리 전용관 검색 결과 페이지가 새 창에서 열립니다
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {directSearchMalls.map((mall) => {
              const targetUrl = buildMallPrimarySearchUrl(mall, activeQuery);
              return (
                <a
                  key={mall.id}
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2.5 bg-white hover:bg-onnuri-mint/40 border border-[#dfe8e1] hover:border-onnuri-green rounded-xl p-3 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{ backgroundColor: mall.color }}
                      className="w-8 h-8 rounded-lg text-white text-xs font-black grid place-items-center flex-shrink-0"
                    >
                      {mall.code}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-onnuri-ink truncate group-hover:text-onnuri-green">
                        {mall.name}
                      </div>
                      <div className="text-[11px] text-[#73827a] truncate">
                        {mall.searchLinkMethod === 'dedicated_zone_search'
                          ? '종합몰 내 온누리전용관 직접 검색'
                          : '쇼핑몰 내부 상품 직접 검색'}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-onnuri-green whitespace-nowrap">
                    <span>검색</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* API 어댑터 설정 및 검증용 데이터 피드 연결 패널 (토글) */}
        {showAdapterPanel && (
          <div className="mt-5 bg-onnuri-cream border border-onnuri-line rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-onnuri-ink flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-onnuri-green" />
                  <span>쇼핑몰 검색 어댑터(ProductSearchAdapter) 연동 상태 및 테스트</span>
                </h3>
                <p className="text-xs text-[#64736c] mt-1">
                  API 키를 프런트엔드에 노출하지 않기 위해 백엔드 프록시 엔드포인트를 연결하거나, 수집된 실제 상품 JSON 피드를 주입하여 통합 가격 비교·규격 분리·정렬 기능을 검증할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 어댑터 응답 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {adapterResponses.slice(0, 4).map((resp) => (
                <div
                  key={resp.mallId}
                  className="bg-white border border-onnuri-line rounded-xl p-3 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <strong className="font-extrabold text-onnuri-ink">{resp.mallName}</strong>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        resp.status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700'
                          : resp.status === 'error'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {resp.status === 'connected'
                        ? 'API 연결됨'
                        : resp.status === 'unconfigured_api_key'
                          ? 'Open API 지원 (프록시 미설정)'
                          : resp.status === 'error'
                            ? '연동 오류'
                            : '직접/웹 검색 연결'}
                    </span>
                  </div>
                  <p className="text-[#6c7b73] text-[11px] leading-relaxed">{resp.message}</p>
                </div>
              ))}
            </div>

            {/* 백엔드 API 프록시 URL 설정 */}
            <div className="pt-2 border-t border-onnuri-line/80 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="proxyUrlInput"
                  className="block text-xs font-extrabold text-onnuri-ink mb-1.5"
                >
                  백엔드 상품 검색 API 프록시 URL (선택)
                </label>
                <div className="flex gap-2">
                  <input
                    id="proxyUrlInput"
                    type="url"
                    value={proxyInput}
                    onChange={(e) => setProxyInput(e.target.value)}
                    placeholder="예: /api/onnuri/products"
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-onnuri-line bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateCustomProxyUrl(proxyInput)}
                    className="px-3.5 py-2 rounded-xl bg-onnuri-ink text-white text-xs font-bold hover:opacity-90 whitespace-nowrap"
                  >
                    프록시 적용
                  </button>
                </div>
              </div>

              {/* 검증된 실제 상품 JSON 피드 입력 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="jsonFeedInput"
                    className="block text-xs font-extrabold text-onnuri-ink"
                  >
                    검증된 상품 데이터 JSON 피드 입력 ({customProducts.length}건 로드됨)
                  </label>
                  {customProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setJsonInput('');
                        onUpdateCustomProducts([]);
                      }}
                      className="text-[11px] text-rose-600 font-bold hover:underline"
                    >
                      피드 초기화
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <textarea
                    id="jsonFeedInput"
                    rows={2}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"id":"p1","mallId":"11st-onnuri","title":"당진 해나루 쌀 10kg","price":26900,"shippingFee":0,"productUrl":"https://..."}]'
                    className="flex-1 text-xs p-2 rounded-xl border border-onnuri-line bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyJsonFeed}
                    className="px-3.5 py-2 rounded-xl bg-onnuri-green text-white text-xs font-bold hover:bg-onnuri-greenDark whitespace-nowrap self-start"
                  >
                    데이터 반영
                  </button>
                </div>
                {jsonError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{jsonError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 통합 상품 비교 결과 표시 영역 */}
        <div className="mt-6">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="py-12 text-center bg-onnuri-cream/50 rounded-2xl border border-dashed border-onnuri-line"
            >
              <RefreshCw className="w-7 h-7 text-onnuri-green animate-spin mx-auto mb-2.5" />
              <p className="text-sm font-extrabold text-onnuri-ink">
                참여 쇼핑몰 어댑터에서 상품 정보를 확인하고 있습니다...
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <strong className="font-extrabold block mb-1">
                  상품 API 데이터 조회 중 오류가 발생했습니다
                </strong>
                <p>{error}</p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* 정렬 및 규격/용량 필터 컨트롤 바 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-onnuri-line">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-onnuri-ink">
                    <Layers className="w-3.5 h-3.5 text-onnuri-green" />
                    규격·용량별 비교:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpec('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      selectedSpec === 'all'
                        ? 'bg-onnuri-ink text-white border-onnuri-ink'
                        : 'bg-white text-[#5d6963] border-onnuri-line'
                    }`}
                  >
                    전체 ({products.length})
                  </button>
                  {availableSpecs.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSelectedSpec(spec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        selectedSpec === spec
                          ? 'bg-onnuri-green text-white border-onnuri-green'
                          : 'bg-white text-[#5d6963] border-onnuri-line hover:border-onnuri-green'
                      }`}
                    >
                      규격: {spec}
                    </button>
                  ))}
                  <span className="text-[11px] text-[#7a867d]">
                    * 서로 다른 규격/용량 상품을 임의로 같은 상품으로 합치지 않습니다.
                  </span>
                </div>

                {/* 정렬 선택 */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <ArrowUpDown className="w-3.5 h-3.5 text-onnuri-green" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#5d6963] mr-1">정렬:</span>
                  {(
                    [
                      { key: 'price_asc', label: '낮은 가격순(총구매가)' },
                      { key: 'price_desc', label: '높은 가격순(총구매가)' },
                      { key: 'relevance', label: '관련도순' },
                    ] as { key: ProductSortOption; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSortBy(opt.key)}
                      aria-pressed={sortBy === opt.key}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        sortBy === opt.key
                          ? 'bg-onnuri-green text-white'
                          : 'bg-onnuri-cream text-[#5d6963] hover:bg-onnuri-mint'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 실제 수집 상품 비교 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProducts.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col border border-onnuri-line rounded-card bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 상품 이미지 영역 */}
                    <div className="relative h-44 bg-onnuri-cream flex items-center justify-center border-b border-onnuri-line overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-[#87938b]">
                          <ShoppingBag className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[11px] font-semibold">상품 이미지 없음</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-onnuri-ink/85 text-white text-[11px] font-extrabold backdrop-blur-sm">
                          {item.mallName}
                        </span>
                        {item.parsedSpec && (
                          <span className="px-2 py-1 rounded-lg bg-onnuri-green text-white text-[11px] font-extrabold">
                            규격 {item.parsedSpec}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 상품 상세 정보 */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#6e7d75] mb-1">
                        <span>{item.mallType === '전용관' ? '종합몰 내 전용관' : '온누리 전용몰'}</span>
                        <span className="text-onnuri-green">{item.dataSourceLabel}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-onnuri-ink line-clamp-2 leading-snug mb-3">
                        {item.title}
                      </h3>

                      {/* 가격, 배송비, 총구매 예상 금액 */}
                      <div className="mt-auto bg-onnuri-cream/80 rounded-xl p-3 space-y-1.5 border border-onnuri-line/70">
                        <div className="flex items-center justify-between text-xs text-[#5d6963]">
                          <span>판매가</span>
                          <span className="font-bold">{formatKRW(item.price)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#5d6963]">
                          <span className="inline-flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-onnuri-green" />
                            배송비
                          </span>
                          <span className="font-bold">
                            {item.shippingFee === 0 ? '무료배송' : `+${formatKRW(item.shippingFee)}`}
                          </span>
                        </div>
                        <div className="pt-1.5 border-t border-onnuri-line flex items-baseline justify-between">
                          <span className="text-xs font-extrabold text-onnuri-ink">
                            총구매 예상 금액
                          </span>
                          <strong className="text-lg font-black text-onnuri-green">
                            {formatKRW(item.totalPrice)}
                          </strong>
                        </div>
                      </div>

                      {/* 업데이트 시각 및 구매 링크 */}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#7d8981]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          수집: {formatTimestamp(item.updatedAt)}
                        </span>
                      </div>

                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full min-h-[42px] rounded-xl bg-onnuri-green hover:bg-onnuri-greenDark text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>상품 상세 및 구매처 이동</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            /* 실제 상품 API 데이터가 없을 때 가짜 상품을 생성하지 않고 투명하게 안내하는 카드 */
            <div className="bg-onnuri-cream/70 border border-dashed border-[#c8d8cc] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-onnuri-mint text-onnuri-green grid place-items-center flex-shrink-0 mt-0.5">
                  <PackageSearch className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-onnuri-ink">
                      실시간 상품 DB 미연결 상태 안내 (가짜 상품·가격 미생성 원칙)
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                      검색 링크 연결 모드 작동 중
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#5c6c63] leading-relaxed mt-1">
                    현재 참여 쇼핑몰의 공식 상품 API 키 또는 백엔드 프록시가 연결되지 않아 임의의 가짜 상품이나 가격·재고를 표시하지 않습니다.
                    상단 <strong>검증된 전용관 검색 바로가기(7곳)</strong> 또는 아래 <strong>24개 전체 쇼핑몰 카드</strong>의 검색 버튼을 누르면{' '}
                    <strong className="text-onnuri-green">“{activeQuery}”</strong> 실제 판매 페이지로 즉시 연결됩니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdapterPanel((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl bg-white border border-onnuri-line hover:border-onnuri-green text-xs font-extrabold text-onnuri-green whitespace-nowrap self-stretch md:self-auto text-center"
              >
                {showAdapterPanel ? '연동 설정 닫기' : '상품 JSON 피드 / API 테스트 열기'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
