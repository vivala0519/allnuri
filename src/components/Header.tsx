import React from 'react';
import { ExternalLink, Heart, Search, ShieldAlert, Store, Table2 } from 'lucide-react';

interface HeaderProps {
  favoriteCount: number;
  favOnly: boolean;
  onToggleFavOnly: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoriteCount,
  favOnly,
  onToggleFavOnly,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-onnuri-line">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-3">
        {/* 브랜드 로고 */}
        <a
          href="#top"
          aria-label="온누리 찾기 맨 위로 이동"
          className="flex items-center gap-2.5 font-extrabold text-xl sm:text-[22px] tracking-tight text-onnuri-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-onnuri-orange rounded-lg"
        >
          <span
            className="grid place-items-center bg-onnuri-green text-white h-9 w-9 rounded-xl text-base font-black -rotate-6 shadow-sm"
            aria-hidden="true"
          >
            <b className="rotate-6">온</b>
          </span>
          <span>온누리 찾기</span>
        </a>

        {/* 중앙 및 우측 내비게이션 */}
        <nav aria-label="주요 메뉴" className="flex items-center gap-2 sm:gap-5 text-sm font-bold text-[#596862]">
          <a
            href="#search-section"
            className="hidden md:inline-flex items-center gap-1.5 hover:text-onnuri-green transition-colors py-1"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>통합 검색</span>
          </a>
          <a
            href="#malls-section"
            className="hidden sm:inline-flex items-center gap-1.5 hover:text-onnuri-green transition-colors py-1"
          >
            <Store className="w-4 h-4" aria-hidden="true" />
            <span>쇼핑몰 목록(24)</span>
          </a>
          <a
            href="#integration-status"
            className="hidden lg:inline-flex items-center gap-1.5 hover:text-onnuri-green transition-colors py-1"
          >
            <Table2 className="w-4 h-4" aria-hidden="true" />
            <span>데이터 연동 상태표</span>
          </a>
          <a
            href="#guide-section"
            className="hidden lg:inline-flex items-center gap-1.5 hover:text-onnuri-green transition-colors py-1"
          >
            <span>이용 안내</span>
          </a>

          {/* 즐겨찾기 퀵 토글 버튼 */}
          <button
            type="button"
            onClick={onToggleFavOnly}
            aria-pressed={favOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              favOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-onnuri-cream border-onnuri-line text-onnuri-ink hover:border-onnuri-green'
            }`}
            title="즐겨찾기한 쇼핑몰만 보기 전환"
          >
            <Heart
              className={`w-3.5 h-3.5 ${favOnly || favoriteCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`}
              aria-hidden="true"
            />
            <span>즐겨찾기</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white text-[11px] font-extrabold">
              {favoriteCount}
            </span>
          </button>

          <a
            href="https://www.onnuri.gift/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-onnuri-green hover:text-onnuri-greenDark font-bold whitespace-nowrap"
          >
            <span>온누리 공식 사이트</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <span
            className="hidden xl:inline-flex items-center gap-1 text-white bg-[#164f41] text-[11px] font-bold rounded-full px-3 py-1.5 whitespace-nowrap"
            title="정부·공공기관 공식 운영 사이트가 아닌 민간/비공식 통합 검색 서비스입니다"
          >
            <ShieldAlert className="w-3 h-3" aria-hidden="true" />
            비공식 통합검색
          </span>
        </nav>
      </div>
    </header>
  );
};
