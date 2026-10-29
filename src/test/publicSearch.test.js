import { describe, expect, it } from 'vitest';
import { parseFiveDayResults, parsePublicResults, parseTraditionalResults, parseHmallResults, parseElevenstResults, parseLotteResults, searchPublicMalls } from '../../server/onnuri/publicSearch.mjs';
import { normalizeRawProduct, OfficialApiProxyAdapter } from '../services/productAdapter';
import { matchesSearchQuery } from '../utils/searchMatch.mjs';
import { vi } from 'vitest';

describe('검색어와 실제 결과 확인', () => {
  const mall = { mallId: 'onnuri-goodday', name: '온누리굿데이', origin: 'https://www.onnurigood.com' };
  const form = (query) => `<div class="search_form"><form class="form_box"><input name="pn" value="product.search.list"><input name="search_word" value="${query}"></form></div>`;
  const card = (id, title) => `<div class="item_box" data-pcode="${id}"><a class="item_name" href="/?pcode=${id}">${title}</a><div class="price"><div class="after"><span class="won">10,000</span></div></div><div class="product-badge-list"><span>디지털온누리</span></div></div>`;

  it('검색 결과 영역만 읽고 추천 영역의 상품은 제외한다', () => {
    const html = `${form('김치')}<div class="result_item"><div id="total_cnt">${card('1', '배추 김치')}</div></div><div class="other_recommend">${card('2', '김치 추천 상품')}</div>`;
    expect(parsePublicResults(html, mall, 'now', '김치').map((item) => item.title)).toEqual(['배추 김치']);
    expect(() => parsePublicResults(html, mall, 'now', '쌀')).toThrow();
  });

  it('검색 결과가 없으면 추천 상품을 결과로 읽지 않으며, 알 수 없는 페이지는 오류로 처리한다', () => {
    const html = `<div class="c_section c_comb">${form('리오마레')}<div class="c_none"><div class="gtxt">입력하신 단어로 검색된 결과가 없습니다.</div></div><div class="other_recommend">${card('2', '쌀')}</div></div>`;
    expect(parsePublicResults(html, mall, 'now', '리오마레')).toEqual([]);
    expect(() => parsePublicResults(form('리오마레') + card('2', '쌀'), mall, 'now', '리오마레')).toThrow();
  });

  it('공개 검색 결과에서도 무관한 상품을 걸러서 쇼핑몰별 수량에 반영한다', async () => {
    const html = `${form('김치 10kg')}<div class="result_item"><div id="total_cnt">${card('1', '배추 김치 10 kg')}${card('2', '햅쌀 10kg')}</div></div>`;
    const fetchImpl = async (url) => {
      if (String(url).startsWith(mall.origin)) return { ok: true, text: async () => html };
      throw new Error('offline');
    };
    const result = await searchPublicMalls('김치 10kg', fetchImpl);
    expect(result.items.filter((item) => item.mallId === mall.mallId).map((item) => item.title)).toEqual(['배추 김치 10 kg']);
    expect(result.sources.find((source) => source.mallId === mall.mallId)).toMatchObject({ status: 'connected', count: 1 });
  });

  it('직접 연결한 API 결과에서도 상품명과 무관한 결과를 제외한다', async () => {
    const originalFetch = globalThis.fetch;
    const item = { id: '1', mallId: mall.mallId, title: '리오 마레 참치', price: 5000, productUrl: 'https://www.onnurigood.com/item' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [item, { ...item, id: '2', title: '햅쌀' }], sources: [{ mallId: mall.mallId, status: 'connected', count: 2 }] }) });
    try {
      const [result] = await new OfficialApiProxyAdapter('/test-api').searchProducts('리오마레');
      expect(result.products.map((product) => product.title)).toEqual(['리오 마레 참치']);
    } finally { globalThis.fetch = originalFetch; }
  });

  it('띄어쓰기, 대소문자, 문장부호와 전각 문자를 정규화하고 검색어는 모두 확인한다', () => {
    expect(matchesSearchQuery('Ｒｉｏ-Mare 참치 10 kg', 'rio mare 10kg')).toBe(true);
    expect(matchesSearchQuery('배추 김치 5kg', '김치 10kg')).toBe(false);
    expect(matchesSearchQuery('김치', '...')).toBe(false);
  });
});

describe('온누리쇼핑 검색 결과', () => {
  const mall = { mallId: 'onnuri-shopping', name: '온누리쇼핑', origin: 'https://onnurishop.co.kr', kind: 'onnuri-shopping' };
  const card = (id, badge, price = '8,600', extra = '') => `<a href="#goods" prdtno="${id}">
    <div class="img"><img src="/image.jpg">${badge ? '<em class="onnuri-on"></em>' : ''}</div>
    <div class="txt"><div class="name">쌀국수</div><div class="price"><strong>${price}</strong></div></div>${extra}</a>`;

  it('온누리 표시가 있는 판매 상품만 가격과 원본 링크로 변환한다', () => {
    const result = parsePublicResults(card('123', true) + card('124', false) + card('125', true, '5,000', '품절'), mall, 'now');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 8600, shippingFee: null, productUrl: 'https://onnurishop.co.kr/shop/goods/123', imageUrl: 'https://onnurishop.co.kr/image.jpg' });
  });
});

describe('11번가와 롯데ON 온누리 검색', () => {
  it('11번가는 일반 검색 결과 중 온누리 표시가 있고 판매 중인 상품만 반환한다', () => {
    const mall = { mallId: '11st-onnuri', name: '11번가 온누리마켓', origin: 'https://www.11st.co.kr' };
    const item = { id: '123', title: '햅쌀 10kg', finalPrc: 30000, soldOut: false, benefitText: [{ type: 'onnuri' }], deliveryDescription: '무료' };
    const body = { totalCount: 3, data: [{ groupName: 'recommendAdPrd', items: [item] }, { groupName: 'list', items: [item, { ...item, id: '124', benefitText: [] }, { ...item, id: '125', soldOut: true }, item] }] };
    const result = parseElevenstResults(body, mall);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 30000, shippingFee: 0, productUrl: 'https://www.11st.co.kr/products/123' });
    expect(parseElevenstResults({ totalCount: 0, data: [] }, mall)).toEqual([]);
    expect(() => parseElevenstResults({}, mall)).toThrow();
  });

  it('롯데ON은 지정 전용관의 온누리 표시 상품만 키워드로 검색한다', () => {
    const mall = { mallId: 'lotteon-onnuri', name: '롯데ON', origin: 'https://www.lotteon.com' };
    const item = { spdNo: 'LO123', spdNm: '햅쌀 10kg', frstFvrPrc: 35000, onnuriYn: 'Y', slStatCd: 'SALE', flagInfoList: [{ flagName: '무료배송' }] };
    const body = { returnCode: '200', data: { dshopNo: '57821', dshopNm: '온누리상생스토어', dpShopMdulList: [{ dpLnkDpTgtSetList: [{ dpYn: 'Y', dtgtJsn: [{ pdList: { dataList: [item, { ...item, spdNo: 'LO124', onnuriYn: 'N' }, { ...item, spdNo: 'LO125', slStatCd: 'STOP' }, item] } }] }] }] } };
    const result = parseLotteResults(body, mall, '쌀');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 35000, shippingFee: 0, productUrl: 'https://www.lotteon.com/p/product/LO123' });
    expect(parseLotteResults(body, mall, '김치')).toEqual([]);
    expect(() => parseLotteResults({ ...body, data: { ...body.data, dshopNo: '1' } }, mall, '쌀')).toThrow();
  });
});

describe('추가 쇼핑몰 공개 검색', () => {
  it('공공몰은 할인된 판매가와 미확인 상태를 반환한다', () => {
    const mall = { mallId: 'onnuri-gonggong-mall', name: '온누리공공몰', origin: 'https://www.ongong.kr', kind: 'gonggong' };
    const html = `<title>상품검색</title><form id="frmdetailsearch"></form><div class="nl-items">
      <a class="nl-item" href="./item.php?it_id=123"><div class="nl-name"><b>쌀</b></div><div class="nl-price"><span class="unit">40,000원</span><span class="discount">30,000원</span></div><p class="free-ship">무료배송</p></a></div>`;
    expect(parsePublicResults(html, mall)[0]).toMatchObject({ price: 30000, shippingFee: 0, eligibility: 'unknown', productUrl: 'https://www.ongong.kr/shop/item.php?it_id=123' });
  });

  it('지니어스몰은 검색 목록의 판매가를 사용한다', () => {
    const mall = { mallId: 'genius-mall', name: '지니어스 Mall', origin: 'https://luxurysystem.co.kr', kind: 'genius' };
    const html = `<form class="search_bbs"></form><div class="area_shopList"><ul data-shop-list="default"><li>
      <a href="/product/product.html?id=123&mode=view"><em>컴퓨터</em><span class="price"><i>1,500,000</i><i>1,180,000</i></span></a></li></ul></div>`;
    expect(parsePublicResults(html, mall)[0]).toMatchObject({ price: 1180000, eligibility: 'unknown' });
  });

  it('우체국 전통시장 상품과 빈 검색 결과를 구분한다', () => {
    const mall = { mallId: 'epost-shopping-onnuri', name: '우체국쇼핑', origin: 'https://mall.epost.go.kr', kind: 'epost' };
    const form = '<form id="frm"><input name="srchGoodsNm"></form>';
    const html = `${form}<div class="list_box_v4"><div class="list_box"><ul><li><a href="javascript:fn_goodsDetailView('G123','05','','','123456');"><div class="goods_text"><p class="tit">쌀</p><div class="price"><p><em>59,000</em></p><p class="dc"><em>64,000</em></p></div></div><div class="goods_tip">무료배송</div></a></li></ul></div></div>`;
    expect(parsePublicResults(html, mall)[0]).toMatchObject({ price: 59000, shippingFee: 0, eligibility: 'unknown' });
    expect(parsePublicResults(`${form}판매중인 상품이 없습니다.`, mall)).toEqual([]);
    expect(() => parsePublicResults(form, mall)).toThrow();
  });

  it('현대H몰은 검색 필터와 결제 필드, 판매 상태를 모두 확인한다', () => {
    const mall = { mallId: 'hyundai-hmall-onnuri', name: '현대홈쇼핑 온누리샵', origin: 'https://www.hmall.com' };
    const item = { slitmCd: '2253533206', slitmNm: '햅쌀 10kg', sellPrc: 30000, orglImgNm: '2253533206_0.jpg', onnuriGcStlmYn: 'Y', soldout: false, ostkYn: 'N' };
    const wrap = (filter, products) => `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { param: { onnuriGcStlmYn: filter, searchTerm: '쌀' }, res: { searchResult: { hmallItemSearchResultList: products } } } } })}</script>`;
    const result = parseHmallResults(wrap('Y', [item, { ...item, slitmCd: '124', onnuriGcStlmYn: 'N' }, { ...item, slitmCd: '125', soldout: true }, item]), mall, '쌀');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 30000, productUrl: 'https://www.hmall.com/md/pda/itemPtc?slitmCd=2253533206', imageUrl: 'https://image.hmall.com/static/2/3/53/53/2253533206_0.jpg' });
    expect(() => parseHmallResults(wrap('N', [item]), mall, '쌀')).toThrow();
  });
});

describe('온누리전통시장과 온누리마켓 검색 결과', () => {
  it('전통시장 검색에서 결제 가능 여부 미확인을 유지한다', () => {
    const mall = { mallId: 'onnuri-juntong-sijang', name: '온누리전통시장', origin: 'https://www.onnuri-sijang.com' };
    const body = [{}, { errorCode: 0, resultDocuments: [{ GDS_CD: '123', SCAT_CD: '456', GDS_NM: '쌀', REAL_SELL_PRC_B2C: '12300', CNDL_NCHG_DLV_YN: 'Y' }] }];
    const [item] = parseTraditionalResults(body, mall, 'now');
    expect(item).toMatchObject({ price: 12300, shippingFee: 0, eligibility: 'unknown', productUrl: 'https://www.onnuri-sijang.com/onnuri/goods/detail?goodsCd=123&ctgCd=456' });
    expect(normalizeRawProduct(item).eligibility).toBe('unknown');
    expect(() => parseTraditionalResults([{},{ errorCode: 1 }], mall)).toThrow();
  });

  it('온누리마켓에서 원본 검색 상품과 판매가만 추출한다', () => {
    const mall = { mallId: 'onnuri-market-nuri', name: '온누리마켓', origin: 'https://nurimarket.co.kr', kind: 'nuri' };
    const html = `<title>상품검색 | 온누리마켓</title><form name="frmsearch1"></form><div class="main_list">
      <div class="swiper-slide"><div class="main_list_tit"><a href="/shop/item.php?it_id=123">쌀</a></div>
      <div class="main_list_price_li2">28,200원</div><div class="main_list_ico">무료배송</div></div>
      <div class="swiper-slide"><div class="main_list_tit"><a href="https://example.com/shop/item.php?it_id=124">쌀</a></div><div class="main_list_price_li2">1,000원</div></div></div>`;
    const result = parsePublicResults(html, mall, 'now');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 28200, shippingFee: 0, eligibility: 'unknown', productUrl: 'https://nurimarket.co.kr/shop/item.php?it_id=123' });
    expect(() => parsePublicResults('<title>오류</title>', mall)).toThrow();
  });
});

describe('온누리5일장 검색 결과', () => {
  const mall = { mallId: 'onnuri-5iljang', name: '온누리5일장', origin: 'https://www.onnuri5.co.kr' };
  const item = { hash: 'Q46D1D', name: '김치통', prd_type: 'onnuri', stat: 2, sell_prc: 14700, is_free_dlv: 'P', thumb: 'https://img2.ppmall.kr/item.jpg' };

  it('온누리 유형이면서 판매 중인 상품만 반환하고 배송비 미확인은 비워둔다', () => {
    const result = parseFiveDayResults({ data: [item, { ...item, prd_type: 'cash' }, { ...item, stat: 3 }, { ...item, is_soldout: 'M' }] }, mall, 'now');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ price: 14700, shippingFee: null, productUrl: 'https://www.onnuri5.co.kr/shop/goods_detail?hash=Q46D1D' });
    expect(parseFiveDayResults({ data: [{ ...item, is_free_dlv: 'Y' }] }, mall)[0].shippingFee).toBe(0);
  });

  it('응답 형식이 바뀌면 빈 검색으로 오인하지 않는다', () => {
    expect(() => parseFiveDayResults({}, mall)).toThrow();
  });
});
