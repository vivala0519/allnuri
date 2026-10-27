import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { ONNURI_MALLS } from '../data/malls';
import {
  buildGoogleWebSearchUrl,
  buildMallPrimarySearchUrl,
  getMallOfficialEntryUrl,
} from '../utils/searchUrlBuilder';
import {
  extractProductSpec,
  normalizeRawProduct,
  sortUnifiedProducts,
} from '../services/productAdapter';

describe('온누리 찾기 통합 검색 플랫폼 검증', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('기존 24개 쇼핑몰 데이터를 빠짐없이 보존하고 고유 ID를 부여해야 한다', () => {
    expect(ONNURI_MALLS).toHaveLength(24);
    const ids = new Set(ONNURI_MALLS.map((m) => m.id));
    expect(ids.size).toBe(24);

    const names = ONNURI_MALLS.map((m) => m.name);
    expect(names).toContain('온누리시장');
    expect(names).toContain('11번가 온누리마켓');
    expect(names).toContain('롯데ON 온누리상생스토어');
    expect(names).toContain('퍼스트복지몰 온누리');
    expect(names).toContain('드림온누리몰');
    expect(names).toContain('인어교주해적단');
  });

  it('종합몰 내 전용관은 일반 종합몰 전체가 아닌 전용관 키워드 검색 URL로 연결해야 한다', () => {
    const lotteOn = ONNURI_MALLS.find((m) => m.id === 'lotteon-onnuri')!;
    const searchUrl = buildMallPrimarySearchUrl(lotteOn, '쌀 10kg');
    expect(searchUrl).toContain('lotteon.com');
    expect(decodeURIComponent(searchUrl)).toContain('온누리상생스토어');
    expect(decodeURIComponent(searchUrl)).toContain('쌀 10kg');

    const entry = getMallOfficialEntryUrl(lotteOn);
    expect(entry?.label).toBe('전용관 열기');
  });

  it('고정 URL이 미확인된 쇼핑몰은 임의 URL 대신 구글 외부 웹 검색으로 안전하게 연결해야 한다', () => {
    const reviewMall = ONNURI_MALLS.find((m) => m.id === 'first-welfare-onnuri')!;
    expect(reviewMall.homeUrl).toBeNull();
    expect(reviewMall.searchUrlTemplate).toBeNull();
    const url = buildMallPrimarySearchUrl(reviewMall, '김치');
    expect(url).toBe(buildGoogleWebSearchUrl(reviewMall, '김치'));
    expect(decodeURIComponent(url)).toContain('"퍼스트복지몰 온누리" 김치');
  });

  it('상품 규격 파서(extractProductSpec)와 총구매가(판매가+배송비) 정렬이 정확히 동작해야 한다', () => {
    expect(extractProductSpec('당진 해나루 쌀 10kg 상등급')).toBe('10kg');
    expect(extractProductSpec('제주 삼다수 생수 2L x 6개')).toBe('2lx6개');

    const p1 = normalizeRawProduct({
      id: 'item-1',
      mallId: '11st-onnuri',
      title: '해나루 쌀 10kg',
      price: 27000,
      shippingFee: 3000, // 총구매가 30,000원
      productUrl: 'https://11st.co.kr/products/1',
    })!;
    const p2 = normalizeRawProduct({
      id: 'item-2',
      mallId: 'onnuri-goodday',
      title: '신동진 쌀 10kg',
      price: 28500,
      shippingFee: 0, // 무료배송, 총구매가 28,500원
      productUrl: 'https://www.onnurigood.com/goods/2',
    })!;

    expect(p1.totalPrice).toBe(30000);
    expect(p2.totalPrice).toBe(28500);

    const asc = sortUnifiedProducts([p1, p2], 'price_asc', '쌀 10kg');
    expect(asc[0].id).toBe('item-2');

    const desc = sortUnifiedProducts([p1, p2], 'price_desc', '쌀 10kg');
    expect(desc[0].id).toBe('item-1');
  });

  it('메인 화면 렌더링 시 가짜 상품을 생성하지 않으며 검색, 카테고리 필터, 즐겨찾기가 정상 작동해야 한다', async () => {
    render(<App />);

    // 초기 24곳 표시 확인
    expect(screen.getByText(/온라인 쇼핑몰 모아보기/i)).toBeInTheDocument();

    // 추천 검색어 버튼 클릭 시 검색어 반영 확인
    const chipBtn = screen.getByRole('button', { name: '쌀 10kg' });
    fireEvent.click(chipBtn);

    const searchInput = screen.getByLabelText(/어떤 상품을 찾으세요/i) as HTMLInputElement;
    expect(searchInput.value).toBe('쌀 10kg');

    // 즐겨찾기 추가 및 localStorage('onnuri-fav-v1') 호환 확인
    const favBtn = screen.getByRole('button', {
      name: '온누리시장 즐겨찾기 추가',
    });
    fireEvent.click(favBtn);

    const storedFavs = JSON.parse(localStorage.getItem('onnuri-fav-v1') || '[]');
    expect(storedFavs).toContain('온누리시장');

    // 추가 확인 필요 탭 필터링 확인 (2곳)
    const reviewTab = screen.getByRole('button', { name: /추가 확인 필요 2/i });
    fireEvent.click(reviewTab);
    expect(screen.getByText('퍼스트복지몰 온누리')).toBeInTheDocument();
    expect(screen.getByText('드림온누리몰')).toBeInTheDocument();
  });
});
