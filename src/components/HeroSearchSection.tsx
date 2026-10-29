import React from 'react';
import { Search, X } from 'lucide-react';

interface HeroSearchSectionProps {
  showAdNotice: boolean;
  searchFavoritesOnly: boolean;
  onSearchFavoritesOnlyChange: (value: boolean) => void;
  favoriteCount: number;
  onGoToFavorites: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  recentQueries: string[];
  onRemoveRecentQuery: (keyword: string) => void;
  onClearRecentQueries: () => void;
  onShareSearchUrl: () => Promise<boolean>;
}

export const HeroSearchSection: React.FC<HeroSearchSectionProps> = ({
  showAdNotice,
  searchFavoritesOnly, onSearchFavoritesOnlyChange, favoriteCount, onGoToFavorites,
  query, onQueryChange, onSubmitSearch, recentQueries, onRemoveRecentQuery, onClearRecentQueries,
}) => {
  return (
    <section id="search-section" aria-labelledby="hero-title" className="hero-search bg-white">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-6 pt-5 pb-0 sm:pt-10 sm:pb-0">
        <div className="max-w-3xl mx-auto">
          <p className="inline-flex rounded-full bg-onnuri-mint px-3 py-1.5 text-xs font-semibold text-onnuri-greenDark mb-5">디지털 온누리 상품권</p>
          <h1 id="hero-title" className="text-[34px] sm:text-[52px] font-bold tracking-[-0.045em] leading-[1.25] text-onnuri-ink">
            검색을 <span className="text-onnuri-green">한 곳에서</span>
          </h1>
          <p className="mt-3 text-[15px] sm:text-base text-onnuri-soft leading-relaxed">여러 온누리 쇼핑몰의 상품을 한곳에서 비교해 보세요.</p>
          <form onSubmit={(event) => { event.preventDefault(); onSubmitSearch(query); }} className="mt-8 flex items-center gap-2 bg-onnuri-cream rounded-[22px] border border-transparent focus-within:border-onnuri-green/40 focus-within:bg-white transition-colors p-2">
            <Search className="w-5 h-5 text-onnuri-soft ml-3 flex-shrink-0" aria-hidden="true" />
            <label htmlFor="main-search" className="sr-only">상품 검색어</label>
            <input id="main-search" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="어떤 상품을 찾으세요?" className="min-w-0 flex-1 h-12 px-1 bg-transparent text-base text-onnuri-ink placeholder:text-[#8b95a1] outline-none" />
            <button type="submit" className="h-12 px-5 sm:px-8 rounded-2xl bg-onnuri-green text-white font-bold hover:bg-onnuri-greenDark transition-colors">검색</button>
          </form>
          {recentQueries.length > 0 && (
            <div className="mt-4" aria-label="최근 검색어">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-onnuri-ink">최근 검색</span>
                <button type="button" onClick={onClearRecentQueries} className="min-h-11 px-2 text-xs font-medium text-onnuri-soft">전체 삭제</button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="최근 검색어 목록">
                {recentQueries.map((word) => (
                  <div key={word} className="flex shrink-0 items-center rounded-full bg-onnuri-cream">
                    <button type="button" onClick={() => onSubmitSearch(word)} className="min-h-11 max-w-[160px] truncate pl-4 pr-1 text-sm font-medium text-onnuri-ink" title={word}>{word}</button>
                    <button type="button" onClick={() => onRemoveRecentQuery(word)} aria-label={`${word} 최근 검색어 삭제`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-onnuri-soft">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/*{showAdNotice && <p className="mt-2 text-xs text-onnuri-soft">검색결과 확인 전 광고 시청 여부를 선택할 수 있어요.</p>}*/}
          <div className="mt-3 flex flex-wrap items-center gap-x-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-onnuri-soft">
            <input type="checkbox" checked={searchFavoritesOnly} onChange={(event) => onSearchFavoritesOnlyChange(event.target.checked)} className="h-4 w-4 accent-onnuri-green" />
            즐겨찾기한 쇼핑몰에서만 검색 ({favoriteCount})
          </label>
          <button type="button" onClick={onGoToFavorites} className="min-h-11 text-sm font-semibold text-onnuri-greenDark underline underline-offset-4">즐겨찾기 하러 가기</button>
          </div>
          {searchFavoritesOnly && favoriteCount === 0 && <p role="status" className="text-sm text-onnuri-soft">아래 쇼핑몰 목록에서 하트를 눌러 즐겨찾기를 추가해 주세요.</p>}
          {/*<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">*/}
          {/*  <span className="text-[#77877c] mr-1">추천</span>*/}
          {/*  {RECOMMENDED_KEYWORDS.slice(0, 5).map((word) => <button key={word} type="button" onClick={() => onSubmitSearch(word)} className="px-3 py-1.5 rounded-full bg-white border border-[#e1ebe3] text-[#53675a] hover:border-onnuri-green hover:text-onnuri-green transition-colors">{word}</button>)}*/}
          {/*</div>*/}
          {/*{recentQueries.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-onnuri-soft">*/}
          {/*  <Clock className="w-3.5 h-3.5" aria-hidden="true" /><span>최근</span>*/}
          {/*  {recentQueries.slice(0, 5).map((word) => <span key={word} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2"><button className="min-h-11 px-1" type="button" onClick={() => onSubmitSearch(word)}>{word}</button><button className="min-h-11 min-w-11 grid place-items-center" type="button" onClick={() => onRemoveRecentQuery(word)} aria-label={`${word} 최근 검색어 삭제`}><X className="w-4 h-4" /></button></span>)}*/}
          {/*  <button type="button" onClick={onClearRecentQueries} className="min-h-11 underline underline-offset-2">전체 삭제</button>*/}
          {/*</div>}*/}
          {/*<div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-onnuri-soft"><span>검색 결과의 가격과 결제 가능 여부는 쇼핑몰에서 확인해 주세요.</span><button type="button" onClick={share} className="min-h-11 inline-flex items-center gap-1.5 whitespace-nowrap hover:text-onnuri-green">{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? (isTossBuild ? '공유됨' : '복사됨') : '검색 공유'}</button></div>*/}
        </div>
      </div>
    </section>
  );
};
