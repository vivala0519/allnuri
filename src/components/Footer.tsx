import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-onnuri-cream py-10 text-xs text-onnuri-soft leading-relaxed">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <strong className="text-sm font-semibold text-onnuri-ink">
              디지털 온누리상품권 온라인몰 통합 검색 플랫폼
            </strong>
          </div>
          <p>
            본 웹사이트는 정부 또는 소상공인시장진흥공단이 운영하는 공식 서비스가 아닙니다.
            등록된 쇼핑몰의 가맹 상태와 개별 상품의 디지털 온누리상품권 결제 가능 여부는 시점에 따라 달라질 수 있습니다.
          </p>
        </div>

        <div className="space-y-1.5 md:text-right">
          <div>
            공식 사용처 및 가맹점 확인:{' '}
            <a
              href="https://www.onnuri.gift/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-onnuri-green font-semibold underline underline-offset-2"
            >
              <span>온누리상품권 공식 사이트 (onnuri.gift)</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
          <p>
            이 사이트는 외부 쇼핑몰 검색 결과 및 가격·재고의 정확성을 보증하지 않으며, 실제 결제는 이동한 각 쇼핑몰에서 이루어집니다.
          </p>
        </div>
      </div>
    </footer>
  );
};
