import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Code2,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  AdapterSearchResponse,
  OnnuriMall,
  ProductSortOption,
  UnifiedProduct,
} from '../types/onnuri';
import { normalizeRawProduct, sortUnifiedProducts } from '../services/productAdapter';
import { trackEvent } from '../utils/analytics';
import { loadSearchSort, loadSearchView, saveSearchPreference } from '../utils/storage';



interface UnifiedProductComparisonSectionProps {
  query: string;
  malls: OnnuriMall[];
  products: UnifiedProduct[];
  adapterResponses: AdapterSearchResponse[];
  isLoading: boolean;
  error: string | null;
  searchFavoritesOnly: boolean;
  favoriteCount: number;
  onRetry: () => void;
  onRetryFailed: () => void;
  onSearchAll: () => void;
  onGoToFavorites: () => void;
  customProducts: UnifiedProduct[];
  onUpdateCustomProducts: (items: UnifiedProduct[]) => void;
  customProxyUrl: string;
  onUpdateCustomProxyUrl: (url: string) => void;
}

export const UnifiedProductComparisonSection: React.FC<
  UnifiedProductComparisonSectionProps
> = ({
  query,
  products,
  adapterResponses,
  isLoading,
  error,
  searchFavoritesOnly,
  favoriteCount,
  onRetry,
  onSearchAll,
  onGoToFavorites,
  customProducts,
  onUpdateCustomProducts,
  customProxyUrl,
  onUpdateCustomProxyUrl,
}) => {
  const [visibleCount, setVisibleCount] = useState(24);
  const [sortBy, setSortBy] = useState<ProductSortOption>(loadSearchSort);
  const [columns, setColumns] = useState<1 | 2 | 3>(loadSearchView);
  const [selectedSpec, setSelectedSpec] = useState<string>('all');
  const [showAdapterPanel] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [proxyInput, setProxyInput] = useState<string>(customProxyUrl);

  const activeQuery = query.trim();
  const failedMalls = [...new Map(adapterResponses.filter((response) => response.status === 'error').map((response) => [response.mallId, response])).values()];
  const hasConnected = adapterResponses.some((response) => response.status === 'connected');
  const noFavorites = searchFavoritesOnly && favoriteCount === 0;
  const noSearchableMalls = !hasConnected && failedMalls.length === 0;
  const allFailed = failedMalls.length > 0 && !hasConnected && products.length === 0;

  useEffect(() => { setVisibleCount(24); setSelectedSpec('all'); }, [query]);

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
      const validItems = (rawArray as unknown[])
        .map((item: unknown) =>
          typeof item === 'object' && item !== null
            ? normalizeRawProduct(item as Record<string, unknown>)
            : null
        )
        .filter((item: UnifiedProduct | null): item is UnifiedProduct => item !== null);

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


  return (
    <section
      aria-labelledby="unified-comparison-title"
      className="product-results py-8 sm:py-12 max-w-[1140px] mx-auto px-5 sm:px-6"
    >
      <div className="bg-white">
        {/* 섹션 상단 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2
              id="unified-comparison-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-onnuri-ink"
            >
              {query.trim() && (
                <>
                  <span className="text-onnuri-green">“{query.trim()}”</span> 검색 결과
                </>
              )}
            </h2>
          </div>

          {/*{!isTossBuild && <div className="flex items-center gap-2 self-start md:self-auto">*/}
          {/*  <button*/}
          {/*    type="button"*/}
          {/*    onClick={() => setShowAdapterPanel((prev) => !prev)}*/}
          {/*    aria-expanded={showAdapterPanel}*/}
          {/*    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-onnuri-line bg-onnuri-cream hover:border-onnuri-green text-xs font-semibold text-onnuri-ink transition-colors"*/}
          {/*  >*/}
          {/*    <Code2 className="w-4 h-4 text-onnuri-green" aria-hidden="true" />*/}
          {/*    <span>연동 설정</span>*/}
          {/*  </button>*/}
          {/*</div>}*/}
        </div>

        {/* 1. 직접 검색 URL 지원 쇼핑몰 원클릭 비교 바로가기 바 */}
        {/*<details className="mt-5 rounded-xl border border-onnuri-line bg-onnuri-cream">*/}
        {/*  <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-onnuri-soft">쇼핑몰에서 직접 검색하기 <span className="text-[#91a097] font-normal">({directSearchMalls.length}곳)</span></summary>*/}
        {/*  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 pt-0">*/}
        {/*    {directSearchMalls.map((mall) => {*/}
        {/*      const targetUrl = buildMallPrimarySearchUrl(mall, activeQuery);*/}
        {/*      return (*/}
        {/*        <a*/}
        {/*          key={mall.id}*/}
        {/*          href={targetUrl}*/}
        {/*          target="_blank"*/}
        {/*          rel="noopener noreferrer"*/}
        {/*          className="group flex items-center justify-between gap-2.5 bg-white hover:bg-onnuri-mint/40 border border-[#dfe8e1] hover:border-onnuri-green rounded-xl p-3 transition-all"*/}
        {/*        >*/}
        {/*          <div className="flex items-center gap-2.5 min-w-0">*/}
        {/*            <MallLogo mall={mall} size="small" />*/}
        {/*            <div className="min-w-0">*/}
        {/*              <div className="text-xs font-semibold text-onnuri-ink truncate group-hover:text-onnuri-green">*/}
        {/*                {mall.name}*/}
        {/*              </div>*/}
        {/*              <div className="text-[12px] text-[#73827a] truncate">*/}
        {/*                {mall.searchLinkMethod === 'dedicated_zone_search'*/}
        {/*                  ? '종합몰 내 온누리전용관 직접 검색'*/}
        {/*                  : '쇼핑몰 내부 상품 직접 검색'}*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <span className="inline-flex items-center gap-1 text-xs font-semibold text-onnuri-green whitespace-nowrap">*/}
        {/*            <span>검색</span>*/}
        {/*            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />*/}
        {/*          </span>*/}
        {/*        </a>*/}
        {/*      );*/}
        {/*    })}*/}
        {/*  </div>*/}
        {/*</details>*/}

        {/* API 어댑터 설정 및 검증용 데이터 피드 연결 패널 (토글) */}
        {showAdapterPanel && (
          <div className="mt-5 bg-onnuri-cream border border-onnuri-line rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-onnuri-ink flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-onnuri-green" />
                  <span>쇼핑몰 검색 어댑터(ProductSearchAdapter) 연동 상태 및 테스트</span>
                </h3>
                <p className="text-xs text-[#64736c] mt-1">
                  제휴 쇼핑몰 피드를 백엔드 검색 API에 연결하거나, 수집된 실제 상품 JSON 피드를 주입하여 가격 비교·규격 분리·정렬 기능을 검증할 수 있습니다.
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
                    <strong className="font-semibold text-onnuri-ink">{resp.mallName}</strong>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[12px] ${
                        resp.status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700'
                          : resp.status === 'error'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {resp.status === 'connected'
                          ? '상품 검색 연결됨'
                        : resp.status === 'unconfigured_api_key'
                          ? '프록시 미설정'
                          : resp.status === 'error'
                            ? '연동 오류'
                            : '직접/웹 검색 연결'}
                    </span>
                  </div>
                  <p className="text-[#6c7b73] text-[12px] leading-relaxed">{resp.message}</p>
                </div>
              ))}
            </div>

            {/* 백엔드 API 프록시 URL 설정 */}
            <div className="pt-2 border-t border-onnuri-line/80 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="proxyUrlInput"
                  className="block text-xs font-semibold text-onnuri-ink mb-1.5"
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
                    className="block text-xs font-semibold text-onnuri-ink"
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
                      className="text-[12px] text-rose-600 font-bold hover:underline"
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
          {!query.trim() ? (
            <div className="py-12 sm:py-16 text-center rounded-2xl bg-[#f7faf8]">
              <PackageSearch className="w-8 h-8 text-[#91ac9a] mx-auto mb-3" aria-hidden="true" />
              <p className="text-base font-bold text-onnuri-ink">찾고 싶은 상품을 검색해 보세요</p>
              <p className="text-sm text-onnuri-soft mt-1">쇼핑몰별 상품과 가격을 모아 보여드릴게요.</p>
            </div>
          ) : noFavorites ? (
            <div role="status" className="rounded-[24px] bg-onnuri-cream p-6">
              <h3 className="text-base font-bold text-onnuri-ink">즐겨찾기한 쇼핑몰이 없어요</h3>
              <p className="mt-2 text-sm text-onnuri-soft">쇼핑몰 목록에서 하트를 눌러 추가해 주세요.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={onGoToFavorites} className="min-h-11 font-semibold text-sm text-onnuri-greenDark">즐겨찾기 하러 가기</button>
                <button type="button" onClick={onSearchAll} className="min-h-11 font-semibold text-sm text-onnuri-greenDark">전체 쇼핑몰에서 검색</button>
              </div>
            </div>
          ) : isLoading && products.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="py-12 text-center bg-onnuri-cream/50 rounded-2xl border border-dashed border-onnuri-line"
            >
              <RefreshCw className="w-7 h-7 text-onnuri-green animate-spin mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-onnuri-ink">
                쇼핑몰의 상품을 찾고 있어요...
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <strong className="font-semibold block mb-1">
                  쇼핑몰 검색에 연결하지 못했어요
                </strong>
                <p>잠시 후 다시 시도해 주세요.</p>
                <button type="button" onClick={onRetry} className="mt-2 min-h-11 font-bold underline underline-offset-4">다시 시도</button>
              </div>
            </div>
          ) : allFailed ? (
            <div role="alert" className="rounded-[24px] bg-onnuri-cream p-6">
              <h3 className="text-base font-bold text-onnuri-ink">쇼핑몰 검색에 실패했어요</h3>
              <p className="mt-2 text-sm text-onnuri-soft">조회한 쇼핑몰에서 결과를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
              <button type="button" onClick={onRetry} className="mt-3 min-h-11 text-sm font-semibold text-onnuri-greenDark">다시 시도</button>
              {searchFavoritesOnly && <button type="button" onClick={onSearchAll} className="ml-4 min-h-11 text-sm font-semibold text-onnuri-greenDark">전체 쇼핑몰에서 검색</button>}
            </div>
          ) : (
            <>
              {isLoading && <p role="status" className="mb-4 text-sm text-onnuri-soft">다른 쇼핑몰의 상품도 찾고 있어요. 결과가 계속 추가됩니다.</p>}
              {/*<div className="mb-4 rounded-2xl bg-onnuri-cream px-4 py-3 text-sm text-onnuri-soft" aria-live="polite">*/}
              {/*  <p>{searchFavoritesOnly ? '즐겨찾기한 쇼핑몰' : '전체 쇼핑몰'} 검색 · 조회 완료 {completedMalls.size}곳{failedMalls.length > 0 && ` · 조회 실패 ${failedMalls.length}곳`}{checkedAt && ` · 조회 ${checkedAt}`}</p>*/}
              {/*  {failedMalls.length > 0 && <>*/}
              {/*    <details className="mt-1"><summary className="cursor-pointer min-h-11 flex items-center font-semibold text-onnuri-ink">조회 실패한 쇼핑몰 보기</summary>*/}
              {/*      <p className="leading-relaxed">{failedMalls.map((mall) => mall.mallName).join(', ')}</p>*/}
              {/*    </details>*/}
              {/*    <button type="button" onClick={onRetryFailed} className="min-h-11 font-semibold text-onnuri-greenDark">실패한 쇼핑몰 다시 시도</button>*/}
              {/*  </>}*/}
              {/*</div>*/}
              {products.length > 0 ? <>
              <div className="mb-2 flex items-center gap-2" role="group" aria-label="한 줄에 표시할 상품 수">
                <span className="w-12 shrink-0 text-sm font-semibold text-onnuri-soft">보기</span>
                {([1, 2, 3] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={columns === count}
                    aria-label={`한 줄에 ${count}개씩 보기`}
                    title={`한 줄에 ${count}개씩 보기`}
                    onClick={() => { setColumns(count); saveSearchPreference('view', String(count)); }}
                    className={`min-h-11 min-w-11 grid place-items-center rounded-xl transition-colors ${columns === count ? 'bg-onnuri-green text-white' : 'bg-onnuri-cream text-onnuri-soft'}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      {Array.from({ length: count }, (_, index) => {
                        const width = (18 - (count - 1) * 2) / count;
                        const x = 3 + index * (width + 2);
                        return <React.Fragment key={index}>
                          <rect x={x} y="4" width={width} height="7" rx="1" />
                          <rect x={x} y="13" width={width} height="7" rx="1" />
                        </React.Fragment>;
                      })}
                    </svg>
                  </button>
                ))}
              </div>
              {/* 정렬 및 규격/용량 필터 컨트롤 바 */}
              <div className="mb-4 space-y-2 border-b border-onnuri-line pb-4">
                {/* 정렬 선택 */}
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-sm font-semibold text-onnuri-soft">정렬</span>
                  <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      { key: 'price_asc', label: '낮은 가격순' },
                      { key: 'price_desc', label: '높은 가격순' },
                      { key: 'relevance', label: '관련도순' },
                    ] as { key: ProductSortOption; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setSortBy(opt.key); saveSearchPreference('sort', opt.key); }}
                      aria-pressed={sortBy === opt.key}
                      className={`min-h-11 shrink-0 px-3 rounded-full text-sm font-semibold transition-colors ${
                        sortBy === opt.key
                          ? 'bg-onnuri-green text-white'
                          : 'bg-onnuri-cream text-onnuri-soft hover:bg-onnuri-mint'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  </div>
                </div>
                {availableSpecs.length > 0 && <label className="flex items-center gap-2 text-sm font-semibold text-onnuri-soft">
                  <span className="w-12 shrink-0">규격</span>
                  <select value={selectedSpec} onChange={(event) => { setSelectedSpec(event.target.value); setVisibleCount(24); }} className="min-h-11 rounded-xl border border-onnuri-line bg-white px-3 text-sm font-semibold text-onnuri-ink">
                    <option value="all">전체</option>
                    {availableSpecs.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                  </select>
                </label>}
              </div>
              <p className="mb-3 text-sm font-semibold text-onnuri-ink">상품 {products.length.toLocaleString()}개</p>

              {/* 실제 수집 상품 비교 카드 그리드 */}
              <div className={`grid ${columns === 1 ? 'grid-cols-1 gap-4' : columns === 2 ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-2 sm:gap-4'}`}>
                {sortedProducts.slice(0, visibleCount).map((item) => (
                  <article
                    key={item.id}
                    className={`product-card min-w-0 flex border border-onnuri-line rounded-[20px] bg-white overflow-hidden hover:shadow-md transition-shadow ${columns === 1 ? 'flex-row p-3 gap-4' : 'flex-col p-2 sm:p-3 gap-2'}`}
                  >
                    {/* 상품 이미지 영역 */}
                    <div className={`relative shrink-0 rounded-2xl bg-onnuri-cream flex items-center justify-center overflow-hidden ${columns === 1 ? 'w-28 h-28' : 'w-full aspect-square'}`}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-contain bg-onnuri-cream"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-[#87938b]">
                          <ShoppingBag className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[12px] font-semibold">상품 이미지 없음</span>
                        </div>
                      )}
                    </div>

                    {/* 상품 상세 정보 */}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="text-xs font-bold text-onnuri-green mb-1 break-words">{item.mallName}{item.parsedSpec ? ` · ${item.parsedSpec}` : ''}</div>
                      <h3 className={`${columns === 3 ? 'text-xs' : 'text-sm sm:text-base'} font-bold text-onnuri-ink line-clamp-2 leading-snug mb-2 break-words`}>
                        {item.title}
                      </h3>

                      {/*{item.eligibility === 'unknown' && (*/}
                      {/*  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">*/}
                      {/*    디지털 온누리 결제 가능 여부와 판매 상태를 쇼핑몰에서 확인하세요.*/}
                      {/*  </p>*/}
                      {/*)}*/}

                      <div className="mt-auto pt-1">
                        <strong className={`${columns === 3 ? 'text-sm sm:text-xl' : 'text-lg sm:text-xl'} font-bold text-onnuri-ink break-words`}>{formatKRW(item.price)}</strong>
                        <p className="mt-1 text-xs text-onnuri-soft">{item.shippingFee === null ? '배송비 확인 필요' : item.shippingFee === 0 ? '무료배송' : `배송비 ${formatKRW(item.shippingFee)}`} {item.shippingFee !== null && ` · 합계 ${formatKRW(item.totalPrice)}`}</p>
                      </div>

                      <a
                        href={item.productUrl}
                        onClick={() => trackEvent('product_outbound_click', { mall_id: item.mallId })}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.title} 쇼핑몰에서 상품 보기`}
                        className="mt-3 w-full min-h-11 rounded-xl bg-onnuri-mint hover:bg-indigo-100 text-onnuri-greenDark text-xs sm:text-sm font-bold flex items-center justify-center gap-1 px-1 text-center transition-colors"
                      >
                        <span>{columns === 1 ? '쇼핑몰에서 상품 보기' : '상품 보기'}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              {sortedProducts.length === 0 && <p className="rounded-2xl bg-onnuri-cream p-5 text-sm text-onnuri-soft">선택한 규격의 상품이 없어요. 다른 규격을 선택해 주세요.</p>}
              {visibleCount < sortedProducts.length && <div className="mt-7 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="rounded-xl border border-onnuri-line px-8 py-3 text-sm font-bold text-onnuri-ink hover:border-onnuri-green">상품 더 보기 ({sortedProducts.length - visibleCount}개 남음)</button></div>}
              </> : <div role="status" className="rounded-[24px] bg-onnuri-cream p-6">
                <h3 className="text-base font-semibold text-onnuri-ink">{noSearchableMalls ? '검색 가능한 쇼핑몰이 없어요' : `‘${activeQuery}’ 검색결과가 없어요`}</h3>
                <p className="mt-2 text-sm leading-relaxed text-onnuri-soft">{noSearchableMalls ? '선택한 쇼핑몰은 통합 상품 검색을 지원하지 않아요.' : failedMalls.length > 0 ? '조회에 성공한 쇼핑몰에서 상품을 찾지 못했어요. 일부 쇼핑몰은 검색에 실패했어요.' : '다른 상품명이나 검색어로 다시 검색해 보세요.'}</p>
                {searchFavoritesOnly && <button type="button" onClick={onSearchAll} className="mt-3 min-h-11 text-sm font-semibold text-onnuri-greenDark">전체 쇼핑몰에서 검색</button>}
              </div>}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
