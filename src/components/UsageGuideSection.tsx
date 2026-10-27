import React from 'react';
import { AlertTriangle, CheckCircle, CreditCard, HelpCircle, ShieldCheck } from 'lucide-react';

export const UsageGuideSection: React.FC = () => {
  return (
    <section
      id="guide-section"
      aria-labelledby="guide-title"
      className="py-8 max-w-[1140px] mx-auto px-4 sm:px-6"
    >
      <div className="bg-onnuri-cream border border-onnuri-line rounded-panel p-5 sm:p-7">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-onnuri-green mb-1">
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>처음 이용하시는 분들을 위한 안내</span>
          </div>
          <h2
            id="guide-title"
            className="text-xl sm:text-2xl font-black tracking-tight text-onnuri-ink"
          >
            디지털 온누리상품권 온라인 결제 방법 및 유의사항
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-onnuri-line rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-onnuri-mint text-onnuri-green grid place-items-center mb-3">
              <CreditCard className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-onnuri-ink mb-2">
              1. 온누리상품권 앱 사전 등록
            </h3>
            <p className="text-xs text-[#64736c] leading-relaxed">
              온라인 쇼핑몰 결제 전 <strong>디지털 온누리상품권(카드형·모바일 통합 앱)</strong>에
              본인 명의 카드를 등록하고 잔액을 먼저 충전해 주세요.
            </p>
          </div>

          <div className="bg-white border border-onnuri-line rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-onnuri-mint text-onnuri-green grid place-items-center mb-3">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-onnuri-ink mb-2">
              2. 전용몰 vs 종합몰 내 전용관 구분
            </h3>
            <p className="text-xs text-[#64736c] leading-relaxed">
              11번가, 롯데ON, 우체국쇼핑, 공영홈쇼핑, 현대Hmall 등 종합몰에서는 전체 상품이 아닌{' '}
              <strong>[온누리마켓 / 온누리상생스토어 / 온누리샵]</strong> 배지가 붙은 전용관 상품만 온누리 결제가 가능합니다.
            </p>
          </div>

          <div className="bg-white border border-onnuri-line rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 grid place-items-center mb-3">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-onnuri-ink mb-2">
              3. 주문서 결제 수단 확인 필수
            </h3>
            <p className="text-xs text-[#64736c] leading-relaxed">
              주문 결제 화면에서 일반 신용카드 결제가 아닌 <strong>‘온누리상품권 결제’</strong> 또는{' '}
              <strong>‘디지털 온누리’</strong> 전용 결제 수단이 활성화되어 있는지 반드시 확인하세요.
            </p>
          </div>
        </div>

        <div className="mt-4 bg-white border border-onnuri-line rounded-xl p-4 flex items-start gap-2.5 text-xs text-[#5d6c63]">
          <ShieldCheck className="w-4 h-4 text-onnuri-green flex-shrink-0 mt-0.5" />
          <div>
            <strong>비공식 서비스 고지:</strong> ‘온누리 찾기’는 사용자의 온라인 사용처 검색 편의를 돕기 위한 민간 통합 검색 플랫폼이며, 중소벤처기업부나 소상공인시장진흥공단이 운영하는 공식 웹사이트가 아닙니다.
          </div>
        </div>
      </div>
    </section>
  );
};
