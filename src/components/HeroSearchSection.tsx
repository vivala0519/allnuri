import React, { useState } from 'react';
import {
  Check,
  Clock,
  Info,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { RECOMMENDED_KEYWORDS } from '../data/malls';

interface HeroSearchSectionProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  recentQueries: string[];
  onRemoveRecentQuery: (keyword: string) => void;
  onClearRecentQueries: () => void;
  onShareSearchUrl: () => Promise<boolean>;
  totalMallsCount: number;
  verifiedMallsCount: number;
  directSearchMallsCount: number;
}

export const HeroSearchSection: React.FC<HeroSearchSectionProps> = ({
  query,
  onQueryChange,
  onSubmitSearch,
  recentQueries,
  onRemoveRecentQuery,
  onClearRecentQueries,
  onShareSearchUrl,
  totalMallsCount,
  verifiedMallsCount,
  directSearchMallsCount,
}) => {
  const [copied, setCopied] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSearch(query);
  };

  const handleShareClick = async () => {
    const ok = await onShareSearchUrl();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section
      id="search-section"
      aria-labelledby="hero-title"
      className="pt-8 sm:pt-12 pb-8 bg-gradient-to-b from-onnuri-cream/70 to-white border-b border-onnuri-line/60"
    >
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        {/* 상단 히어로 소개 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-7">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-extrabold text-onnuri-green bg-onnuri-mint/70 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-onnuri-orange" aria-hidden="true" />
              <span>디지털 온누리상품권 온라인 쇼핑 길잡이</span>
            </div>

            <h1
              id="hero-title"
              className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.2] text-onnuri-ink mt-4 mb-4"
            >
              찾고 싶은 상품,{' '}
              <span className="text-onnuri-green">온누리몰 한눈에.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#586861] leading-relaxed mb-5 max-w-2xl">
              여러 디지털 온누리상품권 사용처 쇼핑몰을 일일이 돌아다니지 마세요.
              검색어 한 번으로 <strong>24개 온누리 온라인몰·전용관</strong>의 상품 검색 결과와
              연동 데이터를 한곳에서 확인하고 비교할 수 있습니다.
            </p>

            {/* 핵심 통계 요약 */}
            <div className="flex flex-wrap gap-6 sm:gap-8 pt-1">
              <div>
                <span className="block text-xs font-bold text-[#7a867d] mb-0.5">
                  수록 온라인몰
                </span>
                <strong className="text-2xl sm:text-[26px] font-black text-onnuri-ink tracking-tight">
                  {totalMallsCount}
                  <small className="text-xs font-bold text-[#7b8980] ml-1">곳</small>
                </strong>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#7a867d] mb-0.5">
                  공식 사용처 확인
                </span>
                <strong className="text-2xl sm:text-[26px] font-black text-onnuri-green tracking-tight">
                  {verifiedMallsCount}
                  <small className="text-xs font-bold text-[#7b8980] ml-1">곳</small>
                </strong>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#7a867d] mb-0.5">
                  직접/도메인 검색 지원
                </span>
                <strong className="text-2xl sm:text-[26px] font-black text-onnuri-ink tracking-tight">
                  {directSearchMallsCount}
                  <small className="text-xs font-bold text-[#7b8980] ml-1">곳</small>
                </strong>
              </div>
            </div>
          </div>

          {/* 우측 그래픽 프리뷰 카드 (태블릿/PC 표시) */}
          <div
            aria-hidden="true"
            className="hidden lg:flex lg:col-span-5 min-h-[250px] bg-gradient-to-br from-[#d9efe4] to-[#f5f8e7] border border-[#cfebdd] rounded-[28px] items-center justify-center p-6 relative overflow-hidden"
          >
            <div className="bg-white rounded-[20px] p-5 w-full max-w-[330px] shadow-[0_18px_50px_rgba(27,94,64,0.12)] -rotate-1 border border-onnuri-line">
              <div className="flex justify-between items-center font-extrabold text-xs text-onnuri-ink pb-3 border-b border-gray-100">
                <span>온누리 통합 검색 프리뷰</span>
                <span className="tracking-widest text-gray-400">•••</span>
              </div>
              <div className="mt-3 border border-[#d9e4da] rounded-xl flex items-center gap-2 px-3 py-2 text-xs font-bold text-onnuri-green bg-onnuri-mint/30">
                <Search className="w-3.5 h-3.5" />
                <span>{query.trim() || '쌀 10kg'}</span>
              </div>
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2.5 p-2 border border-gray-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#177d62] text-white grid place-items-center text-xs font-black">
                    온
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold truncate">온누리시장</div>
                    <div className="text-[10px] text-gray-500">전용몰 · 도메인 검색 연결</div>
                  </div>
                  <span className="text-xs font-bold text-onnuri-green">↗</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 border border-gray-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#f33163] text-white grid place-items-center text-xs font-black">
                    11
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold truncate">11번가 온누리마켓</div>
                    <div className="text-[10px] text-gray-500">전용관 직접 검색 · Open API 지원</div>
                  </div>
                  <span className="text-xs font-bold text-onnuri-green">↗</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 border border-gray-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#e27a45] text-white grid place-items-center text-xs font-black">
                    굿
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold truncate">온누리굿데이</div>
                    <div className="text-[10px] text-gray-500">전용몰 내부 검색 직접 연결</div>
                  </div>
                  <span className="text-xs font-bold text-onnuri-green">↗</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙 메인 통합 검색 패널 */}
        <div className="bg-white border-2 border-onnuri-green/25 rounded-panel shadow-[0_20px_60px_rgba(24,121,95,0.08)] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label
              htmlFor="productQuery"
              className="text-base sm:text-lg font-extrabold text-onnuri-ink flex items-center gap-2"
            >
              <span>어떤 상품을 찾으세요?</span>
              <span className="text-xs font-bold text-onnuri-green bg-onnuri-mint px-2.5 py-0.5 rounded-full">
                통합 키워드 검색
              </span>
            </label>

            {query.trim() && (
              <button
                type="button"
                onClick={handleShareClick}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-onnuri-green hover:text-onnuri-greenDark bg-onnuri-mint/60 hover:bg-onnuri-mint px-3 py-1.5 rounded-lg transition-colors"
                aria-label="현재 검색어 URL 복사하여 공유하기"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>검색 링크 복사됨!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>검색어 URL 공유</span>
                  </>
                )}
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 flex items-center border-2 border-[#d4dfd7] focus-within:border-onnuri-green focus-within:ring-4 focus-within:ring-onnuri-mint rounded-2xl bg-white px-4 min-h-[56px] sm:min-h-[62px] transition-all">
              <Search
                className="w-5 h-5 text-onnuri-green flex-shrink-0 mr-3"
                aria-hidden="true"
              />
              <input
                id="productQuery"
                name="q"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="예: 쌀 10kg, 김치, 한우, 사과, 생수, 생활용품"
                autoComplete="off"
                className="w-full text-base sm:text-lg font-semibold text-onnuri-ink placeholder:text-[#9ba7a0] placeholder:font-normal bg-transparent border-0 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="검색어 지우기"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="bg-onnuri-green hover:bg-onnuri-greenDark active:scale-[0.99] text-white font-extrabold text-base px-7 min-h-[54px] sm:min-h-[62px] rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>온누리몰 통합 검색</span>
            </button>
          </form>

          {/* 추천 검색어 & 최근 검색어 영역 */}
          <div className="mt-4 pt-3.5 border-t border-onnuri-line/70 flex flex-col gap-2.5">
            {/* 추천 검색어 (실제 통계가 없으므로 '추천 검색어'로 명확히 표기) */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-extrabold text-onnuri-ink mr-1">
                <Sparkles className="w-3.5 h-3.5 text-onnuri-orange" aria-hidden="true" />
                추천 검색어
              </span>
              {RECOMMENDED_KEYWORDS.map((item) => {
                const isSelected = query.trim() === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSubmitSearch(item)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-colors border ${
                      isSelected
                        ? 'bg-onnuri-green text-white border-onnuri-green'
                        : 'bg-[#f7f9f5] text-[#4d5b54] border-[#e2e8e2] hover:bg-onnuri-mint hover:border-[#bddbc9]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* 최근 검색어 (localStorage 저장) */}
            {recentQueries.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 font-bold text-[#6e7d75] mr-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    최근 검색어
                  </span>
                  {recentQueries.map((recent) => (
                    <span
                      key={recent}
                      className="inline-flex items-center gap-1 bg-white border border-onnuri-line rounded-full pl-2.5 pr-1.5 py-1 text-[#4d5b54] font-semibold"
                    >
                      <button
                        type="button"
                        onClick={() => onSubmitSearch(recent)}
                        className="hover:text-onnuri-green"
                      >
                        {recent}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveRecentQuery(recent)}
                        aria-label={`최근 검색어 ${recent} 삭제`}
                        className="text-gray-400 hover:text-rose-600 p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onClearRecentQueries}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                  <span>최근 검색어 전체 삭제</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 투명한 데이터 연동 방식 안내 배너 */}
        <div
          role="note"
          className="mt-4 bg-[#e9f1eb] border border-[#d5e4d9] rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 text-xs sm:text-[13px] leading-relaxed text-[#42574b]"
        >
          <Info
            className="w-5 h-5 text-onnuri-green flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <strong className="text-onnuri-green font-extrabold">
              데이터 연동 방식 및 이용 안내:
            </strong>{' '}
            현재 대부분의 온누리 온라인몰은 외부 공개 상품 API를 제공하지 않습니다. 본 플랫폼은{' '}
            <strong>무단 크롤링이나 가짜 상품·가격 생성을 하지 않으며</strong>, 공식 Open API/제휴 피드가 연결된 경우에만
            실시간 상품 가격 비교 카드를 표시하고, 그 외 쇼핑몰은{' '}
            <strong>검증된 전용관 직접 검색 URL</strong> 또는{' '}
            <strong>공식 도메인 지정 웹 검색</strong>으로 즉시 연결합니다. 종합몰(11번가·롯데ON·우체국쇼핑·공영홈쇼핑·현대Hmall 등)은
            일반 상품이 아닌 <strong>온누리 전용관 표시 상품만</strong> 디지털 온누리상품권 결제가 가능합니다.
          </div>
        </div>
      </div>
    </section>
  );
};
