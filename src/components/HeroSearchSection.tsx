import React from 'react';
import { Clock, Search, X } from 'lucide-react';

interface HeroSearchSectionProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  recentQueries: string[];
  onRemoveRecentQuery: (keyword: string) => void;
  onClearRecentQueries: () => void;
  onShareSearchUrl: () => Promise<boolean>;
}

export const HeroSearchSection: React.FC<HeroSearchSectionProps> = ({
  query, onQueryChange, onSubmitSearch, recentQueries, onRemoveRecentQuery, onClearRecentQueries,
}) => {
  return (
    <section id="search-section" aria-labelledby="hero-title" className="hero-search bg-white">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-6 pt-10 pb-8 sm:pt-20 sm:pb-14">
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
          {/*<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">*/}
          {/*  <span className="text-[#77877c] mr-1">추천</span>*/}
          {/*  {RECOMMENDED_KEYWORDS.slice(0, 5).map((word) => <button key={word} type="button" onClick={() => onSubmitSearch(word)} className="px-3 py-1.5 rounded-full bg-white border border-[#e1ebe3] text-[#53675a] hover:border-onnuri-green hover:text-onnuri-green transition-colors">{word}</button>)}*/}
          {/*</div>*/}
          {recentQueries.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-onnuri-soft">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /><span>최근</span>
            {recentQueries.slice(0, 5).map((word) => <span key={word} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2"><button className="min-h-11 px-1" type="button" onClick={() => onSubmitSearch(word)}>{word}</button><button className="min-h-11 min-w-11 grid place-items-center" type="button" onClick={() => onRemoveRecentQuery(word)} aria-label={`${word} 최근 검색어 삭제`}><X className="w-4 h-4" /></button></span>)}
            <button type="button" onClick={onClearRecentQueries} className="min-h-11 underline underline-offset-2">전체 삭제</button>
          </div>}
          {/*<div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-onnuri-soft"><span>검색 결과의 가격과 결제 가능 여부는 쇼핑몰에서 확인해 주세요.</span><button type="button" onClick={share} className="min-h-11 inline-flex items-center gap-1.5 whitespace-nowrap hover:text-onnuri-green">{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? (isTossBuild ? '공유됨' : '복사됨') : '검색 공유'}</button></div>*/}
        </div>
      </div>
    </section>
  );
};
