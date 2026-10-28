import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Heart,
  Link2,
  Smartphone,
} from 'lucide-react';
import { OnnuriMall } from '../types/onnuri';
import {
  buildGoogleWebSearchUrl,
  buildMallPrimarySearchUrl,
  buildNaverWebSearchUrl,
  getMallOfficialEntryUrl,
} from '../utils/searchUrlBuilder';

interface MallCardProps {
  mall: OnnuriMall;
  keyword: string;
  isFavorite: boolean;
  onToggleFavorite: (mallName: string) => void;
}

export const MallCard: React.FC<MallCardProps> = ({
  mall,
  keyword,
  isFavorite,
  onToggleFavorite,
}) => {
  const trimmedKeyword = keyword.trim();
  const primarySearchUrl = buildMallPrimarySearchUrl(mall, trimmedKeyword);
  const googleSearchUrl = buildGoogleWebSearchUrl(mall, trimmedKeyword);
  const naverSearchUrl = buildNaverWebSearchUrl(mall, trimmedKeyword);
  const officialEntry = getMallOfficialEntryUrl(mall);

  const isDirectSearch = mall.searchUrlTemplate !== null;

  const getSearchMethodBadge = () => {
    switch (mall.searchLinkMethod) {
      case 'dedicated_zone_search':
        return {
          text: '전용관 직접 검색 연결',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'direct_mall_search':
        return {
          text: '쇼핑몰 내부 검색 연결',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'google_site_search':
        return {
          text: '공식 도메인 지정 웹 검색',
          className: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      default:
        return {
          text: '외부 키워드 웹 검색',
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        };
    }
  };

  const methodBadge = getSearchMethodBadge();

  return (
    <article
      className={`flex flex-col border rounded-card p-5 bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(38,76,54,0.08)] ${
        mall.verificationStatus === 'needs_review'
          ? 'border-amber-200 bg-amber-50/10'
          : 'border-[#e2e9e2]'
      }`}
    >
      {/* 카드 상단: 로고, 쇼핑몰 이름, 즐겨찾기 */}
      <div className="flex items-start gap-3">
        <div
          style={{ backgroundColor: mall.color }}
          className="w-12 h-12 rounded-[15px] text-white grid place-items-center text-[15px] font-black tracking-tight flex-shrink-0 shadow-sm"
          aria-hidden="true"
        >
          {mall.code}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-base tracking-tight text-onnuri-ink leading-snug break-words">
              {mall.name}
            </h3>
          </div>
          <p className="text-xs text-[#73827a] mt-1 leading-relaxed">
            {mall.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(mall.name)}
          aria-label={`${mall.name} 즐겨찾기 ${isFavorite ? '해제' : '추가'}`}
          aria-pressed={isFavorite}
          className={`p-1.5 rounded-full transition-colors ${
            isFavorite
              ? 'text-[#e9695b] bg-rose-50'
              : 'text-[#b5c3b8] hover:text-[#e9695b] hover:bg-gray-50'
          }`}
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-[#e9695b]' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 메타 배지: 쇼핑몰 유형, 검증 상태, 데이터 연동 방식 */}
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {/* 쇼핑몰 유형 배지 */}
        <span
          className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
            mall.mallType === '전용몰'
              ? 'bg-onnuri-mint/80 text-onnuri-greenDark'
              : mall.mallType === '전용관'
                ? 'bg-indigo-50 text-indigo-800'
                : 'bg-amber-100 text-amber-900'
          }`}
        >
          {mall.mallType === '전용몰'
            ? '온누리 전용·중심몰'
            : mall.mallType === '전용관'
              ? '종합몰 내 전용관'
              : '추가 확인 필요'}
        </span>

        {/* 사용처 검증 상태 배지 */}
        {mall.verificationStatus === 'verified' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#f2f6f2] text-[#4f6457] text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-onnuri-green" aria-hidden="true" />
            <span>2026.10 사용처 확인</span>
          </span>
        )}
        {mall.verificationStatus === 'app_mainly' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold">
            <Smartphone className="w-3 h-3" aria-hidden="true" />
            <span>앱 중심 운영 · 2026.10 확인</span>
          </span>
        )}
        {mall.verificationStatus === 'needs_review' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#fff2e8] text-[#bc6830] text-[11px] font-extrabold">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            <span>현행 사용처 재확인 필요</span>
          </span>
        )}

      </div>

      {/* 쇼핑몰별 온누리 결제 유의사항 안내 */}
      <div
        className={`mt-3 p-2.5 rounded-xl text-[11px] leading-relaxed ${
          mall.mallType === '전용관'
            ? 'bg-indigo-50/60 text-indigo-950 border border-indigo-100'
            : mall.mallType === '검토'
              ? 'bg-amber-50 text-amber-950 border border-amber-200'
              : 'bg-[#f6f9f6] text-[#526358]'
        }`}
      >
        {mall.paymentGuide}
      </div>

      {/* 하단 액션 버튼 영역: 검색 URL과 홈페이지/전용관 URL을 명확히 분리 */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* 주 검색 버튼 */}
          <a
            href={primarySearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[42px] rounded-xl border border-[#cce0d2] bg-[#eef7f0] hover:bg-[#dcefe1] text-[#1a6349] text-xs sm:text-[13px] font-extrabold px-3 py-2 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <span>
              {trimmedKeyword
                ? isDirectSearch
                  ? `“${trimmedKeyword}” 직접 검색`
                  : `“${trimmedKeyword}” 웹 검색`
                : isDirectSearch
                  ? '전용관/내부 검색'
                  : '웹에서 찾아보기'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          </a>

          {/* 공식 홈페이지 또는 전용관 바로가기 버튼 (확인된 경우만 노출) */}
          {officialEntry && (
            <a
              href={officialEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${mall.name} ${officialEntry.label} 열기`}
              className="min-h-[42px] rounded-xl border border-[#d9e5db] bg-white hover:bg-[#f6f8f5] text-[#5b6b60] text-xs font-extrabold px-3 py-2 flex items-center justify-center gap-1 whitespace-nowrap transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-onnuri-green" aria-hidden="true" />
              <span>{officialEntry.label}</span>
            </a>
          )}
        </div>

        <details className="text-[11px] text-[#78877e]">
          <summary className="cursor-pointer font-bold">상세 정보와 보조 검색</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
        {/* 검색/연동 방식 배지 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-bold ${methodBadge.className}`}
        >
          <Link2 className="w-3 h-3" aria-hidden="true" />
          <span>{methodBadge.text}</span>
        </span>

        {mall.integrationCategory === 'official_api_available' && (
          <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-extrabold">
            공식 Open API/제휴 연동 가능
          </span>
        )}
        {mall.integrationCategory === 'public_search' && (
          <span className="px-2 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-extrabold">
            로컬 상품 통합 검색
          </span>
        )}
          </div>
      {/* 주요 취급 품목 태그 */}
      {mall.categories.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {mall.categories.map((cat) => (
            <span
              key={cat}
              className="text-[11px] text-[#6d7c73] bg-[#f7f9f7] px-2 py-0.5 rounded"
            >
              #{cat}
            </span>
          ))}
        </div>
      )}

        {/* 보조 외부 검색 링크 (구글/네이버 웹 검색) */}
        <div className="flex items-center justify-between text-[11px] text-[#78877e] px-1">
          <span>보조 검색 연결:</span>
          <div className="flex items-center gap-2.5 font-bold">
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-onnuri-green underline underline-offset-2"
            >
              구글 검색 ↗
            </a>
            <a
              href={naverSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-onnuri-green underline underline-offset-2"
            >
              네이버 검색 ↗
            </a>
          </div>
        </div>
        </details>
      </div>
    </article>
  );
};
