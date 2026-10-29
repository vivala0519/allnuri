import React from 'react';
import { RotateCcw } from 'lucide-react';
import { MallKind, OnnuriMall } from '../types/onnuri';
import { MallCard } from './MallCard';

export type CategoryFilter = 'all' | MallKind;
export type MethodFilter =
  | 'all'
  | 'direct_or_zone'
  | 'domain_verified'
  | 'api_supported';

interface MallDirectorySectionProps {
  malls: OnnuriMall[];
  filteredMalls: OnnuriMall[];
  keyword: string;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (cat: CategoryFilter) => void;
  methodFilter: MethodFilter;
  onMethodFilterChange: (method: MethodFilter) => void;
  mallNameQuery: string;
  onMallNameQueryChange: (val: string) => void;
  selectedMallId: string;
  onSelectedMallIdChange: (id: string) => void;
  favOnly: boolean;
  onFavOnlyChange: (checked: boolean) => void;
  favorites: string[];
  onToggleFavorite: (mallName: string) => void;
  onResetFilters: () => void;
}

export const MallDirectorySection: React.FC<MallDirectorySectionProps> = ({
  malls,
  filteredMalls,
  keyword,
  categoryFilter,
  onCategoryFilterChange,
  favOnly,
  onFavOnlyChange,
  favorites,
  onToggleFavorite,
  onResetFilters,
}) => {
  const isVisibleMall = (mall: OnnuriMall) => mall.mallType !== '검토' && mall.id !== 'sijang-to-room';
  const visibleMalls = malls.filter(isVisibleMall);
  const visibleFilteredMalls = filteredMalls.filter(isVisibleMall);
  const counts = {
    all: visibleMalls.length,
    전용몰: visibleMalls.filter((m) => m.mallType === '전용몰').length,
    전용관: visibleMalls.filter((m) => m.mallType === '전용관').length,
  };

  return (
    <section
      id="malls-section"
      aria-labelledby="malls-title"
      className="mall-directory py-8 sm:py-12 max-w-[1140px] mx-auto px-4 sm:px-6"
    >
      {/* 섹션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2
            id="malls-title"
            className="text-[22px] sm:text-[28px] font-bold tracking-tight text-onnuri-ink"
          >
            온라인 쇼핑몰 모아보기
          </h2>
          <p className="text-sm text-onnuri-soft mt-2 leading-relaxed">
            온누리상품권 결제 가능 표시 상품을 확인 후 결제하세요
          </p>
        </div>

      </div>

      {/* 필터 및 검색 컨트롤 영역 */}
      <div className="bg-onnuri-cream rounded-[24px] p-4 sm:p-5 mb-4 space-y-4">
        {/* 1행: 쇼핑몰 유형 탭 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="쇼핑몰 유형 필터"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { key: 'all', label: `전체 ${counts.all}` },
                { key: '전용몰', label: `온누리 전용·중심몰 ${counts.전용몰}` },
                { key: '전용관', label: `종합몰 내 전용관 ${counts.전용관}` },
              ] as { key: CategoryFilter; label: string }[]
            ).map((tab) => {
              const active = categoryFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCategoryFilterChange(tab.key)}
                  className={`min-h-11 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                    active
                      ? 'bg-white text-onnuri-greenDark border-white shadow-sm'
                      : 'bg-transparent text-onnuri-soft border-transparent hover:bg-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 즐겨찾기만 보기 체크박스 */}
          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-onnuri-soft cursor-pointer select-none bg-onnuri-cream px-3.5 py-2 rounded-xl border border-onnuri-line">
            <input
              type="checkbox"
              id="favOnly"
              checked={favOnly}
              onChange={(e) => onFavOnlyChange(e.target.checked)}
              className="w-4 h-4 accent-onnuri-green rounded"
            />
            <span>즐겨찾기한 쇼핑몰만 보기 ({favorites.length})</span>
          </label>
        </div>

        {/* 2행: 연동 방식별 필터 + 특정 쇼핑몰 선택 + 쇼핑몰 이름 검색 */}
        {/*<details className="pt-3 border-t border-onnuri-line/70">*/}
        {/*  <summary className="cursor-pointer min-h-11 flex items-center text-sm font-bold text-onnuri-soft">상세 필터</summary>*/}
        {/*  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">*/}
        {/*  /!* 연동/검색 방식 필터 *!/*/}
        {/*  /!*<div className="flex items-center gap-2">*!/*/}
        {/*  /!*  <Filter className="w-4 h-4 text-onnuri-green flex-shrink-0" aria-hidden="true" />*!/*/}
        {/*  /!*  <label htmlFor="methodFilterSelect" className="sr-only">*!/*/}
        {/*  /!*    데이터 연동 방식 필터*!/*/}
        {/*  /!*  </label>*!/*/}
        {/*  /!*  <select*!/*/}
        {/*  /!*    id="methodFilterSelect"*!/*/}
        {/*  /!*    value={methodFilter}*!/*/}
        {/*  /!*    onChange={(e) => onMethodFilterChange(e.target.value as MethodFilter)}*!/*/}
        {/*  /!*    className="w-full text-sm font-medium text-onnuri-ink bg-onnuri-cream/70 border border-[#dce4dd] rounded-xl px-3 min-h-12 py-2.5 focus:outline-none focus:border-onnuri-green"*!/*/}
        {/*  /!*  >*!/*/}
        {/*  /!*    <option value="all">연동 방식: 전체 보기</option>*!/*/}
        {/*  /!*    <option value="direct_or_zone">직접/전용관 검색 URL 보유 몰</option>*!/*/}
        {/*  /!*    <option value="domain_verified">공식 도메인/전용관 확인 몰</option>*!/*/}
        {/*  /!*    <option value="api_supported">공식 Open API/제휴 가능 몰</option>*!/*/}
        {/*  /!*  </select>*!/*/}
        {/*  /!*</div>*!/*/}

        {/*  /!* 특정 쇼핑몰 선택 필터 *!/*/}
        {/*  <div>*/}
        {/*    <label htmlFor="mallSelectFilter" className="sr-only">*/}
        {/*      특정 쇼핑몰 선택*/}
        {/*    </label>*/}
        {/*    <select*/}
        {/*      id="mallSelectFilter"*/}
        {/*      value={selectedMallId}*/}
        {/*      onChange={(e) => onSelectedMallIdChange(e.target.value)}*/}
        {/*      className="w-full text-sm font-medium text-onnuri-ink bg-onnuri-cream/70 border border-[#dce4dd] rounded-xl px-3 min-h-12 py-2.5 focus:outline-none focus:border-onnuri-green"*/}
        {/*    >*/}
        {/*      <option value="all">쇼핑몰 선택: 전체 ({visibleMalls.length}곳)</option>*/}
        {/*      {visibleMalls.map((m) => (*/}
        {/*        <option key={m.id} value={m.id}>*/}
        {/*          {m.name} ({m.mallType})*/}
        {/*        </option>*/}
        {/*      ))}*/}
        {/*    </select>*/}
        {/*  </div>*/}

        {/*  /!* 쇼핑몰 이름 검색 *!/*/}
        {/*  <div className="relative flex items-center">*/}
        {/*    <Search*/}
        {/*      className="w-4 h-4 text-[#7c8a81] absolute left-3 pointer-events-none"*/}
        {/*      aria-hidden="true"*/}
        {/*    />*/}
        {/*    <input*/}
        {/*      id="mallFilter"*/}
        {/*      type="search"*/}
        {/*      value={mallNameQuery}*/}
        {/*      onChange={(e) => onMallNameQueryChange(e.target.value)}*/}
        {/*      placeholder="쇼핑몰 이름 또는 품목 검색 (예: 11번가, 수산)"*/}
        {/*      aria-label="쇼핑몰 이름 검색"*/}
        {/*      className="w-full text-sm font-medium text-onnuri-ink bg-white border border-[#dce4dd] rounded-xl pl-9 pr-3 min-h-12 py-2.5 focus:outline-none focus:border-onnuri-green"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*  </div>*/}
        {/*</details>*/}
      </div>

      {/* 검색 결과 요약 바 */}
      <div
        id="resultInfo"
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-2 text-sm text-onnuri-soft mb-3 px-1"
      >
        <span>총 <strong className="text-onnuri-green font-semibold">{visibleFilteredMalls.length}곳</strong></span>
        <button type="button" onClick={onResetFilters} className="min-h-11 px-2 font-bold hover:text-onnuri-green">필터 초기화</button>
      </div>

      {/* 쇼핑몰 카드 그리드 (모바일 1열, 태블릿 2열, PC 3열) */}
      {visibleFilteredMalls.length > 0 ? (
        <div
          id="mallGrid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {visibleFilteredMalls.map((mall) => (
            <MallCard
              key={mall.id}
              mall={mall}
              keyword={keyword}
              isFavorite={favorites.includes(mall.name)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div
          id="empty"
          className="bg-white py-12 px-5 text-center border border-dashed border-[#cddbd0] rounded-[21px] text-[#7d887f]"
        >
          <strong className="block text-lg font-semibold text-[#29392e] mb-2">
            조건에 맞는 쇼핑몰이 없습니다.
          </strong>
          <p className="text-xs sm:text-sm mb-4">
            선택한 쇼핑몰 유형, 즐겨찾기 필터 또는 쇼핑몰 이름 검색어를 변경해 보세요.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-onnuri-green text-white text-xs font-semibold hover:bg-onnuri-greenDark transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>필터 초기화</span>
          </button>
        </div>
      )}
    </section>
  );
};
