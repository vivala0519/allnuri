import { useCallback, useEffect, useMemo, useState } from 'react';
import { ONNURI_MALLS } from './data/malls';
import { AdapterSearchResponse, UnifiedProduct } from './types/onnuri';
import { executeUnifiedSearch } from './services/productAdapter';
import {
  addRecentQuery,
  clearRecentQueries,
  loadFavoriteMalls,
  loadRecentQueries,
  removeRecentQuery,
  saveFavoriteMalls,
} from './utils/storage';
import { Header } from './components/Header';
import { HeroSearchSection } from './components/HeroSearchSection';
import { UnifiedProductComparisonSection } from './components/UnifiedProductComparisonSection';
import {
  CategoryFilter,
  MallDirectorySection,
  MethodFilter,
} from './components/MallDirectorySection';
import { IntegrationStatusTableSection } from './components/IntegrationStatusTableSection';
import { UsageGuideSection } from './components/UsageGuideSection';
import { Footer } from './components/Footer';

export function App() {
  // URL 쿼리 파라미터에서 초기 검색어 및 카테고리 복원
  const initialParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const initialQuery = initialParams.get('q')?.trim() || '';
  const initialCategory = (initialParams.get('category') as CategoryFilter) || 'all';
  const validInitialCategory: CategoryFilter = ['all', '전용몰', '전용관', '검토'].includes(
    initialCategory
  )
    ? initialCategory
    : 'all';

  const [queryInput, setQueryInput] = useState<string>(initialQuery);
  const [committedQuery, setCommittedQuery] = useState<string>(initialQuery);
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(validInitialCategory);
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [selectedMallId, setSelectedMallId] = useState<string>('all');
  const [mallNameQuery, setMallNameQuery] = useState<string>('');
  const [favOnly, setFavOnly] = useState<boolean>(
    initialParams.get('fav') === '1'
  );

  const [favorites, setFavorites] = useState<string[]>(() => loadFavoriteMalls());
  const [recentQueries, setRecentQueries] = useState<string[]>(() =>
    loadRecentQueries()
  );

  // 통합 상품 검색 어댑터 상태
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [adapterResponses, setAdapterResponses] = useState<AdapterSearchResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [customProducts, setCustomProducts] = useState<UnifiedProduct[]>([]);
  const [customProxyUrl, setCustomProxyUrl] = useState<string>('');

  // URL 쿼리 파라미터 동기화 (검색어 공유 기능)
  useEffect(() => {
    const params = new URLSearchParams();
    if (committedQuery.trim()) {
      params.set('q', committedQuery.trim());
    }
    if (categoryFilter !== 'all') {
      params.set('category', categoryFilter);
    }
    if (favOnly) {
      params.set('fav', '1');
    }
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [committedQuery, categoryFilter, favOnly]);

  // 통합 상품 검색 어댑터 실행
  useEffect(() => {
    let cancelled = false;
    setIsLoadingProducts(true);
    setProductError(null);

    executeUnifiedSearch(committedQuery, customProducts, customProxyUrl)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.products);
        setAdapterResponses(res.adapterResponses);
        setIsLoadingProducts(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setProductError(
          err instanceof Error ? err.message : '상품 검색 중 오류가 발생했습니다.'
        );
        setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [committedQuery, customProducts, customProxyUrl]);

  // 검색 실행 핸들러
  const handleSubmitSearch = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    setQueryInput(trimmed);
    setCommittedQuery(trimmed);
    if (trimmed) {
      setRecentQueries((prev) => addRecentQuery(trimmed, prev));
    }
  }, []);

  // 최근 검색어 개별 삭제 및 전체 삭제
  const handleRemoveRecentQuery = useCallback((target: string) => {
    setRecentQueries((prev) => removeRecentQuery(target, prev));
  }, []);

  const handleClearRecentQueries = useCallback(() => {
    setRecentQueries(clearRecentQueries());
  }, []);

  // 즐겨찾기 추가/해제 (localStorage 'onnuri-fav-v1' 동기화)
  const handleToggleFavorite = useCallback((mallName: string) => {
    setFavorites((prev) => {
      const next = prev.includes(mallName)
        ? prev.filter((item) => item !== mallName)
        : [...prev, mallName];
      saveFavoriteMalls(next);
      return next;
    });
  }, []);

  // 검색 URL 클립보드 공유
  const handleShareSearchUrl = useCallback(async (): Promise<boolean> => {
    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // 쇼핑몰 필터링
  const filteredMalls = useMemo(() => {
    const nameTerm = mallNameQuery.trim().toLowerCase();
    return ONNURI_MALLS.filter((mall) => {
      if (categoryFilter !== 'all' && mall.mallType !== categoryFilter) {
        return false;
      }
      if (selectedMallId !== 'all' && mall.id !== selectedMallId) {
        return false;
      }
      if (favOnly && !favorites.includes(mall.name)) {
        return false;
      }
      if (methodFilter === 'direct_or_zone' && mall.searchUrlTemplate === null) {
        return false;
      }
      if (
        methodFilter === 'domain_verified' &&
        mall.homeUrl === null &&
        mall.dedicatedZoneUrl === null
      ) {
        return false;
      }
      if (
        methodFilter === 'api_supported' &&
        mall.integrationCategory !== 'official_api_available'
      ) {
        return false;
      }
      if (nameTerm) {
        const searchable = `${mall.name} ${mall.description} ${mall.categories.join(' ')}`.toLowerCase();
        if (!searchable.includes(nameTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [
    categoryFilter,
    selectedMallId,
    favOnly,
    favorites,
    methodFilter,
    mallNameQuery,
  ]);

  const handleResetFilters = useCallback(() => {
    setCategoryFilter('all');
    setMethodFilter('all');
    setSelectedMallId('all');
    setMallNameQuery('');
    setFavOnly(false);
  }, []);

  const verifiedMallsCount = useMemo(
    () => ONNURI_MALLS.filter((m) => m.verificationStatus !== 'needs_review').length,
    []
  );
  const directOrDomainMallsCount = useMemo(
    () =>
      ONNURI_MALLS.filter(
        (m) => m.searchUrlTemplate !== null || m.homeUrl !== null || m.dedicatedZoneUrl !== null
      ).length,
    []
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white text-onnuri-ink">
      {/* 1. 상단 로고 및 내비게이션 */}
      <Header
        favoriteCount={favorites.length}
        favOnly={favOnly}
        onToggleFavOnly={() => setFavOnly((prev) => !prev)}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {/* 2 & 3. 통합 상품 검색 영역 + 추천/최근 검색어 */}
        <HeroSearchSection
          query={queryInput}
          onQueryChange={(val) => {
            setQueryInput(val);
            setCommittedQuery(val);
          }}
          onSubmitSearch={handleSubmitSearch}
          recentQueries={recentQueries}
          onRemoveRecentQuery={handleRemoveRecentQuery}
          onClearRecentQueries={handleClearRecentQueries}
          onShareSearchUrl={handleShareSearchUrl}
          totalMallsCount={ONNURI_MALLS.length}
          verifiedMallsCount={verifiedMallsCount}
          directSearchMallsCount={directOrDomainMallsCount}
        />

        {/* 4. 통합 상품 비교 및 직접 검색 바로가기 섹션 */}
        <UnifiedProductComparisonSection
          query={committedQuery}
          malls={ONNURI_MALLS}
          products={products}
          adapterResponses={adapterResponses}
          isLoading={isLoadingProducts}
          error={productError}
          customProducts={customProducts}
          onUpdateCustomProducts={setCustomProducts}
          customProxyUrl={customProxyUrl}
          onUpdateCustomProxyUrl={setCustomProxyUrl}
        />

        {/* 5 & 6. 쇼핑몰별 필터 + 온누리 사용처 전체 목록 (24곳) */}
        <MallDirectorySection
          malls={ONNURI_MALLS}
          filteredMalls={filteredMalls}
          keyword={committedQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          methodFilter={methodFilter}
          onMethodFilterChange={setMethodFilter}
          mallNameQuery={mallNameQuery}
          onMallNameQueryChange={setMallNameQuery}
          selectedMallId={selectedMallId}
          onSelectedMallIdChange={setSelectedMallId}
          favOnly={favOnly}
          onFavOnlyChange={setFavOnly}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onResetFilters={handleResetFilters}
        />

        {/* 쇼핑몰별 데이터 연동 상태표 */}
        <IntegrationStatusTableSection malls={ONNURI_MALLS} />

        {/* 7. 사용 방법 및 유의사항 */}
        <UsageGuideSection />
      </main>

      {/* 8. 푸터 */}
      <Footer />
    </div>
  );
}

export default App;
