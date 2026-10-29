import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { UsageGuideSection } from './components/UsageGuideSection';
import { Footer } from './components/Footer';
import { initializeTossIdentity, isTossBuild, openTossExternalLink, shareTossSearch } from './utils/toss';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import { SearchAdConfirmation } from './components/SearchAdConfirmation';
import { ScrollToTop } from './components/ScrollToTop';
import { nextSearchAdSchedule, normalizeAdSearchQuery } from './utils/searchAdSchedule';

export function App() {
  const interstitialAd = useInterstitialAd();
  const [pendingAdSearch, setPendingAdSearch] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  useEffect(() => {
    initializeTossIdentity().catch(() => setPlatformError('사용자 정보를 확인하지 못했어요. 토스 앱에서 다시 열어 주세요.'));
  }, []);
  // URL 쿼리 파라미터에서 초기 검색어 및 카테고리 복원
  const initialParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const initialQuery = initialParams.get('q')?.trim() || '';
  const adSchedule = useRef({ lastQuery: normalizeAdSearchQuery(initialQuery), searchCount: 0 });
  const initialCategory = (initialParams.get('category') as CategoryFilter) || 'all';
  const validInitialCategory: CategoryFilter = ['all', '전용몰', '전용관'].includes(
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
  const [searchFavoritesOnly, setSearchFavoritesOnly] = useState(false);
  const [mallDirectoryExpanded, setMallDirectoryExpanded] = useState(true);
  const searchMallIds = useMemo(() => searchFavoritesOnly
    ? ONNURI_MALLS.filter((mall) => favorites.includes(mall.name)).map((mall) => mall.id)
    : undefined, [searchFavoritesOnly, favorites]);
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
  const [searchRevision, setSearchRevision] = useState(0);
  const searchGeneration = useRef(0);

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
    const generation = ++searchGeneration.current;
    setIsLoadingProducts(true);
    setProductError(null);

    executeUnifiedSearch(committedQuery, customProducts, customProxyUrl, searchMallIds)
      .then((res) => {
        if (cancelled || generation !== searchGeneration.current) return;
        setProducts(res.products);
        setAdapterResponses(res.adapterResponses);
        setIsLoadingProducts(false);
      })
      .catch((err) => {
        if (cancelled || generation !== searchGeneration.current) return;
        setProductError(
          err instanceof Error ? err.message : '상품 검색 중 오류가 발생했습니다.'
        );
        setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [committedQuery, customProducts, customProxyUrl, searchMallIds, searchRevision]);

  // 검색 실행 핸들러
  const commitSearch = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    adSchedule.current = nextSearchAdSchedule(adSchedule.current, trimmed).schedule;
    setQueryInput(trimmed);
    setCommittedQuery(trimmed);
    setSearchRevision((revision) => revision + 1);
    if (trimmed) {
      setRecentQueries((prev) => addRecentQuery(trimmed, prev));
    }
  }, []);

  const handleSubmitSearch = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    if (nextSearchAdSchedule(adSchedule.current, trimmed).showAd && interstitialAd.ready) {
      setPendingAdSearch(trimmed);
    } else {
      commitSearch(trimmed);
    }
  }, [interstitialAd.ready, commitSearch]);

  const retrySearch = useCallback(() => {
    setSearchRevision((revision) => revision + 1);
  }, []);

  const retryFailedMalls = useCallback(async () => {
    const ids = [...new Set(adapterResponses.filter((response) => response.status === 'error').map((response) => response.mallId))];
    if (!ids.length) return;
    const generation = ++searchGeneration.current;
    setIsLoadingProducts(true);
    try {
      const result = await executeUnifiedSearch(committedQuery, customProducts, customProxyUrl, ids);
      if (generation !== searchGeneration.current) return;
      setProducts((previous) => [...previous.filter((product) => !ids.includes(product.mallId)), ...result.products]);
      setAdapterResponses((previous) => [...previous.filter((response) => !ids.includes(response.mallId)), ...result.adapterResponses]);
    } catch {
      // Keep the previous successful results and failed mall status available for another retry.
    } finally {
      if (generation === searchGeneration.current) setIsLoadingProducts(false);
    }
  }, [adapterResponses, committedQuery, customProducts, customProxyUrl]);

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
      if (isTossBuild) {
        await shareTossSearch(committedQuery);
        return true;
      }
      const shareUrl = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      return false;
    } catch {
      if (isTossBuild) setPlatformError('공유하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return false;
    }
  }, [committedQuery]);

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


  return (
    <div id="top" className="min-h-screen flex flex-col bg-white text-onnuri-ink" onClickCapture={(event) => {
      if (!isTossBuild || !(event.target instanceof Element)) return;
      const link = event.target.closest('a[href]');
      const href = link?.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      event.preventDefault();
      openTossExternalLink(href).catch(() => setPlatformError('상품 페이지를 열지 못했어요. 잠시 후 다시 시도해 주세요.'));
    }}>
      {platformError && <div role="alert" className="p-4 bg-amber-50 text-amber-900">{platformError}<button className="ml-3 min-h-11 underline" onClick={() => setPlatformError(null)}>닫기</button></div>}
      {pendingAdSearch !== null && <SearchAdConfirmation
        query={pendingAdSearch}
        onCancel={() => setPendingAdSearch(null)}
        onConfirm={async () => {
          await interstitialAd.onSearch();
          commitSearch(pendingAdSearch);
          setPendingAdSearch(null);
        }}
      />}
      {/* 1. 상단 로고 및 내비게이션 */}
      {!isTossBuild && <Header
        favoriteCount={favorites.length}
        favOnly={favOnly}
        onToggleFavOnly={() => {
          setFavOnly((prev) => !prev);
          setMallDirectoryExpanded(true);
        }}
      />}

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {/* 2 & 3. 통합 상품 검색 영역 + 추천/최근 검색어 */}
        <HeroSearchSection
          showAdNotice={interstitialAd.supported}
          searchFavoritesOnly={searchFavoritesOnly}
          onSearchFavoritesOnlyChange={setSearchFavoritesOnly}
          favoriteCount={favorites.length}
          onGoToFavorites={() => {
            setMallDirectoryExpanded(true);
            window.setTimeout(() => document.getElementById('malls-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
          }}
          query={queryInput}
          onQueryChange={setQueryInput}
          onSubmitSearch={handleSubmitSearch}
          recentQueries={recentQueries}
          onRemoveRecentQuery={handleRemoveRecentQuery}
          onClearRecentQueries={handleClearRecentQueries}
          onShareSearchUrl={handleShareSearchUrl}
        />

        {/* 4. 통합 상품 비교 및 직접 검색 바로가기 섹션 */}
        <UnifiedProductComparisonSection
          query={committedQuery}
          malls={ONNURI_MALLS}
          products={products}
          adapterResponses={adapterResponses}
          isLoading={isLoadingProducts}
          error={productError}
          searchFavoritesOnly={searchFavoritesOnly}
          favoriteCount={searchMallIds?.length ?? 0}
          onRetry={retrySearch}
          onRetryFailed={retryFailedMalls}
          onSearchAll={() => setSearchFavoritesOnly(false)}
          onGoToFavorites={() => {
            setMallDirectoryExpanded(true);
            window.setTimeout(() => document.getElementById('malls-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
          }}
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
          isExpanded={mallDirectoryExpanded}
          onExpandedChange={setMallDirectoryExpanded}
        />

        {/* 쇼핑몰별 데이터 연동 상태표 */}
        <details className="max-w-[1140px] mx-auto px-4 sm:px-6 border-t border-onnuri-line">
          <summary className="py-5 cursor-pointer text-sm font-bold text-[#52665a]">이용 안내</summary>
          <UsageGuideSection />
          {/*<IntegrationStatusTableSection malls={ONNURI_MALLS} />*/}
        </details>
      </main>

      {/* 8. 푸터 */}
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;
