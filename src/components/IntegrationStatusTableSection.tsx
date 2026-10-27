import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, ExternalLink, Table2 } from 'lucide-react';
import { OnnuriMall } from '../types/onnuri';
import { getMallOfficialEntryUrl } from '../utils/searchUrlBuilder';

interface IntegrationStatusTableSectionProps {
  malls: OnnuriMall[];
}

export const IntegrationStatusTableSection: React.FC<
  IntegrationStatusTableSectionProps
> = ({ malls }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const displayedMalls = expanded ? malls : malls.slice(0, 8);

  const getCategoryLabel = (cat: OnnuriMall['integrationCategory']) => {
    switch (cat) {
      case 'official_api_available':
        return {
          text: '1단계: 공식 API/제휴 연동 가능',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'search_link_only':
        return {
          text: '2단계: 검색 결과 링크 연결',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'affiliate_or_verification_needed':
        return {
          text: '3단계: 추가 제휴·사용처 확인 필요',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
        };
    }
  };

  return (
    <section
      id="integration-status"
      aria-labelledby="integration-status-title"
      className="py-8 max-w-[1140px] mx-auto px-4 sm:px-6"
    >
      <div className="bg-white border border-onnuri-line rounded-panel p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-onnuri-green mb-1">
              <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>투명한 데이터 연동 현황</span>
            </div>
            <h2
              id="integration-status-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-onnuri-ink"
            >
              쇼핑몰별 데이터 연동 상태표 (24곳)
            </h2>
            <p className="text-xs sm:text-sm text-[#687770] mt-1">
              각 쇼핑몰의 공식 API 제공 여부, 홈페이지·전용관 URL 구분, 직접 검색 URL 지원 여부 및 마지막 검증일을 투명하게 공개합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
              공식 API/제휴 가능: {malls.filter((m) => m.integrationCategory === 'official_api_available').length}곳
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              검색 링크 연결: {malls.filter((m) => m.integrationCategory === 'search_link_only').length}곳
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              추가 확인 필요: {malls.filter((m) => m.integrationCategory === 'affiliate_or_verification_needed').length}곳
            </span>
          </div>
        </div>

        {/* 반응형 테이블 */}
        <div className="overflow-x-auto border border-onnuri-line rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-onnuri-cream text-onnuri-ink font-extrabold border-b border-onnuri-line">
                <th className="py-3 px-3.5 whitespace-nowrap">쇼핑몰명 (ID)</th>
                <th className="py-3 px-3 whitespace-nowrap">유형</th>
                <th className="py-3 px-3 whitespace-nowrap">공식 사용처 검증</th>
                <th className="py-3 px-3 whitespace-nowrap">데이터 연동 분류</th>
                <th className="py-3 px-3 whitespace-nowrap">홈페이지 / 전용관</th>
                <th className="py-3 px-3.5 min-w-[240px]">연동 방식 및 기술 비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onnuri-line/70">
              {displayedMalls.map((mall) => {
                const catInfo = getCategoryLabel(mall.integrationCategory);
                const entry = getMallOfficialEntryUrl(mall);
                return (
                  <tr key={mall.id} className="hover:bg-onnuri-cream/40">
                    <td className="py-3 px-3.5 font-extrabold text-onnuri-ink whitespace-nowrap">
                      <div>{mall.name}</div>
                      <div className="text-[10px] font-mono text-gray-400 font-normal">
                        {mall.id}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-[#526358]">
                      {mall.mallType}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          mall.verificationStatus === 'needs_review'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-onnuri-mint text-onnuri-greenDark'
                        }`}
                      >
                        {mall.verificationStatus === 'verified'
                          ? `검증완료 (${mall.lastVerifiedDate})`
                          : mall.verificationStatus === 'app_mainly'
                            ? `앱 중심 (${mall.lastVerifiedDate})`
                            : '재확인 필요'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border font-bold text-[11px] ${catInfo.badgeClass}`}
                      >
                        {catInfo.text}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {entry ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-onnuri-green font-bold hover:underline"
                        >
                          <span>{entry.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">미확정 (웹검색)</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-[#5b6b62] leading-relaxed">
                      {mall.integrationNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 전체 펼치기 / 접기 버튼 */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-onnuri-cream hover:bg-onnuri-mint border border-onnuri-line text-xs font-extrabold text-onnuri-ink transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>연동 상태표 간략히 보기</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>24개 전체 쇼핑몰 연동 상태 모두 보기</span>
              </>
            )}
          </button>
        </div>

        {/* 향후 실제 통합 상품 검색 고도화 아키텍처 안내 */}
        <div className="mt-5 p-4 rounded-2xl bg-[#f7faf8] border border-[#dce8df] text-xs text-[#4f6156] leading-relaxed">
          <div className="font-extrabold text-onnuri-ink flex items-center gap-1.5 mb-1">
            <Database className="w-3.5 h-3.5 text-onnuri-green" />
            <span>향후 실시간 상품 통합 검색 완성을 위한 기술 로드맵</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>1단계 (공식 Open API 연동):</strong> 11번가 Open API(ProductSearch) 등 공개 API 제공 플랫폼에 대해 서버리스 백엔드 프록시(Vercel Functions / Node.js)를 구성하고 온누리마켓 전용 셀러·카테고리 필터를 적용하여 실시간 가격·배송비 수집
            </li>
            <li>
              <strong>2단계 (전용몰 표준 상품 피드 제휴):</strong> 온누리굿데이, 인더마켓온누리몰, 온누리시장 등 중소 전용몰(카페24/고도몰 기반)과 네이버쇼핑 EP(상품 DB URL) 형식의 일일 상품 피드 제휴 체결
            </li>
            <li>
              <strong>3단계 (단위가격 및 규격 정규화 고도화):</strong> 현재 구현된 <code>extractProductSpec()</code> 규격 파서를 확장하여 100g당·1kg당 단위가격 자동 계산 및 묶음상품 비교 제공
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
