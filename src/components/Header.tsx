import React from 'react';
import { Heart } from 'lucide-react';

interface HeaderProps { favoriteCount: number; favOnly: boolean; onToggleFavOnly: () => void; }

export const Header: React.FC<HeaderProps> = ({ favoriteCount, favOnly, onToggleFavOnly }) => (
  <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-onnuri-line/70">
    <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <a href="#top" aria-label="온누리 찾기 맨 위로 이동" className="flex items-center gap-2.5 font-black text-lg tracking-tight text-onnuri-ink">
        <span className="grid place-items-center bg-onnuri-green text-white h-9 w-9 rounded-xl text-base" aria-hidden="true">온</span>온누리 찾기
      </a>
      <nav aria-label="주요 메뉴" className="flex items-center gap-3 sm:gap-7 text-sm font-bold text-[#64756b]">
        <a href="#search-section" className="hidden sm:inline hover:text-onnuri-green">상품 검색</a>
        <a href="#malls-section" className="hidden sm:inline hover:text-onnuri-green">쇼핑몰</a>
        <button type="button" onClick={() => { onToggleFavOnly(); document.getElementById('malls-section')?.scrollIntoView({ behavior: 'smooth' }); }} aria-pressed={favOnly} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${favOnly ? 'bg-rose-50 text-rose-700' : 'text-[#52665a] hover:bg-onnuri-cream'}`}>
          <Heart className={`w-4 h-4 ${favOnly ? 'fill-current' : ''}`} aria-hidden="true" /> 즐겨찾기{favoriteCount > 0 && <span>{favoriteCount}</span>}
        </button>
      </nav>
    </div>
  </header>
);
