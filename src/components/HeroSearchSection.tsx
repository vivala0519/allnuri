import React, { useState } from 'react';
import { Check, Clock, Search, Share2, X } from 'lucide-react';
import { isTossBuild } from '../utils/toss';

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
  query, onQueryChange, onSubmitSearch, recentQueries, onRemoveRecentQuery, onClearRecentQueries, onShareSearchUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (await onShareSearchUrl()) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section id="search-section" aria-labelledby="hero-title" className="bg-[#f4f8f5] border-b border-onnuri-line/60">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-12 pb-11 sm:pt-16 sm:pb-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.12em] text-onnuri-green mb-3">온누리 온라인 쇼핑</p>
          <h1 id="hero-title" className="text-[32px] sm:text-5xl font-black tracking-tight leading-tight text-onnuri-ink">
            찾는 상품을, <span className="text-onnuri-green">한 번에.</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5b6f64] leading-relaxed">여러 온누리 쇼핑몰의 상품과 가격을 한곳에서 비교해 보세요.</p>
          <form onSubmit={(event) => { event.preventDefault(); onSubmitSearch(query); }} className="mt-7 flex items-center gap-2 bg-white rounded-2xl border border-[#cbded2] shadow-[0_8px_28px_rgba(26,82,57,0.06)] p-2">
            <Search className="w-5 h-5 text-onnuri-green ml-3 flex-shrink-0" aria-hidden="true" />
            <label htmlFor="main-search" className="sr-only">상품 검색어</label>
            <input id="main-search" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="어떤 상품을 찾으세요?" className="min-w-0 flex-1 h-12 px-1 bg-transparent text-base text-onnuri-ink placeholder:text-[#9aa9a0] outline-none" />
            <button type="submit" className="h-12 px-6 sm:px-8 rounded-xl bg-onnuri-green text-white font-bold hover:bg-onnuri-greenDark transition-colors">검색</button>
          </form>
          {/*<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">*/}
          {/*  <span className="text-[#77877c] mr-1">추천</span>*/}
          {/*  {RECOMMENDED_KEYWORDS.slice(0, 5).map((word) => <button key={word} type="button" onClick={() => onSubmitSearch(word)} className="px-3 py-1.5 rounded-full bg-white border border-[#e1ebe3] text-[#53675a] hover:border-onnuri-green hover:text-onnuri-green transition-colors">{word}</button>)}*/}
          {/*</div>*/}
          {recentQueries.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#728278]">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /><span>최근</span>
            {recentQueries.slice(0, 5).map((word) => <span key={word} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1"><button type="button" onClick={() => onSubmitSearch(word)}>{word}</button><button type="button" onClick={() => onRemoveRecentQuery(word)} aria-label={`${word} 최근 검색어 삭제`}><X className="w-3 h-3" /></button></span>)}
            <button type="button" onClick={onClearRecentQueries} className="underline underline-offset-2">전체 삭제</button>
          </div>}
          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#718176]"><span>검색 결과의 가격과 결제 가능 여부는 쇼핑몰에서 확인해 주세요.</span><button type="button" onClick={share} className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-onnuri-green">{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? (isTossBuild ? '공유됨' : '복사됨') : '검색 공유'}</button></div>
        </div>
      </div>
    </section>
  );
};
