import { test } from 'vitest';
import assert from 'node:assert/strict';
import { parseChanceResults, parseCysoResults, parseGongyoungResults, parseHotdealResults, parseNoljangResults, parsePublicResults, searchPublicMalls } from './publicSearch.mjs';

const mall = { mallId: 'onnuri-goodday', name: '온누리굿데이', origin: 'https://www.onnurigood.com' };
test('즐겨찾기가 없으면 쇼핑몰에 요청하지 않는다', async () => {
  let calls = 0;
  const result = await searchPublicMalls('favorites-empty', async () => { calls++; throw new Error('unexpected request'); }, []);
  assert.equal(calls, 0);
  assert.deepEqual(result, { items: [], sources: [] });
});

test('지정한 즐겨찾기 쇼핑몰만 조회한다', async () => {
  let calls = 0;
  const result = await searchPublicMalls('favorites-scope-test', async () => { calls++; throw new Error('offline'); }, ['onnuri-goodday']);
  assert.equal(calls, 1);
  assert.deepEqual(result.sources.map((source) => source.mallId), ['onnuri-goodday']);
});
const searchPage = (html, query = '쌀') => `<div class="search_form"><form class="form_box"><input name="pn" value="product.search.list"><input name="search_word" value="${query}"></form></div><div class="result_item"><div id="total_cnt">${html}</div></div>`;
const card = (badge, extra = '') => `<div class="item_box ${extra}" data-pcode="A1">
  <div class="thumb"><img src="/rice.jpg"></div>
  <div class="info"><div class="product-badge-list"><span>${badge}</span></div>
  <a class="item_name" href="/?pn=product.view&pcode=A1">햅쌀 10kg</a>
  <div class="price"><div class="after"><span class="won">38,000</span></div></div>
  <div class="item_icon"><img alt="무료배송"></div></div></div>`;

test('공개 검색에서 온누리 표시 상품만 정규화한다', () => {
  const items = parsePublicResults(searchPage(card('디지털온누리') + card('일반상품') + card('디지털온누리', 'if_soldout')), mall);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'onnuri-goodday:A1');
  assert.equal(items[0].price, 38000);
  assert.equal(items[0].shippingFee, 0);
  assert.equal(items[0].productUrl, 'https://www.onnurigood.com/?pn=product.view&pcode=A1');
});

test('몰별 실패가 다른 몰의 검색 결과를 막지 않는다', async () => {
  const result = await searchPublicMalls('햅쌀', async (url) => {
    if (!url.includes('onnurigood.com')) throw new Error('blocked');
    return { ok: true, text: async () => searchPage(card('디지털온누리'), '햅쌀') };
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.sources.find((source) => source.mallId === mall.mallId).status, 'connected');
  assert.ok(result.sources.filter((source) => source.mallId !== mall.mallId).every((source) => source.status === 'error'));
});

test('온누리팔도시장 전용 카테고리가 적용된 검색 상품만 포함한다', () => {
  const html = `<form id="Frm"><a class="selectCondition" onclick="fnCategoryClick(3130);">온누리 팔도시장</a>
    <div class="item_box"><a class="item_info" href="/Goods/Content.aspx?guid=123&cate="><div class="item_n">햅쌀 10kg</div><div class="item_price_n">41,900원</div></a><div class="box_item_tag">무료배송</div></div></form>`;
  const source = { mallId: 'onnuri-paldo-sijang', name: '온누리팔도시장', origin: 'https://www.e-jangter.com', kind: 'paldo' };
  const items = parsePublicResults(html, source);
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 41900);
  assert.equal(items[0].shippingFee, 0);
  assert.throws(() => parsePublicResults(html.replace('class="selectCondition"', 'class=""'), source));
});

test('사이소 온누리 기획전은 판매 중인 검색 상품만 포함한다', () => {
  const product = (saleItemNo, saleYn, itemName = '햅쌀 10kg') => ({
    itemNo: '10034107', saleItemNo, itemName, salePrc: 42900, saleStock: 3,
    saleYn, soldoutYn: false, itemImgUrl: '/data/item/rice.jpg',
  });
  const body = { itemExhibition: { exhbNo: 1773379812, exhbName: '온누리상품권 기획전', useYn: true },
    itemDisplayFullInfoList: [{ displayItems: [product('1628223553', true), product('2', false), product('3', true, '사과')] }] };
  const items = parseCysoResults(body, { mallId: 'gyeongbuk-cyso', name: '사이소', origin: 'https://www.cyso.co.kr' }, '쌀');
  assert.equal(items.length, 1);
  assert.equal(items[0].shippingFee, null);
  assert.equal(items[0].productUrl, 'https://www.cyso.co.kr/item/detail?id=10034107&saleItemNo=1628223553');
});

test('공영쇼핑 상품 카드 데이터에서 온누리 표시 및 판매 중인 상품만 포함한다', () => {
  const entry = (id, flag, state = '110') => `<goodsUnitInfoList><prdId>${id}</prdId><prdNm>햅쌀 10kg</prdNm><prdPrc>38800</prdPrc><trditMrktGoodsYn>${flag}</trditMrktGoodsYn><saleStatCd>${state}</saleStatCd><stkSoldYn>N</stkSoldYn><freeDlvYn>Y</freeDlvYn><imgUrl>/72/27/81/17383980.jpg</imgUrl></goodsUnitInfoList>`;
  const xml = `<ModelMap>${entry('91001079', 'Y')}${entry('12', 'N')}${entry('13', 'Y', '120')}</ModelMap>`;
  const items = parseGongyoungResults(xml, { mallId: 'gongyoung-onnuri', name: '공영홈쇼핑 온누리장터', origin: 'https://www.gongyoungshop.kr' });
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 38800);
  assert.equal(items[0].shippingFee, 0);
  assert.equal(items[0].productUrl, 'https://www.gongyoungshop.kr/goods/selectGoodsDetail.do?prdId=91001079');
});

test('인더마켓의 아이콘 배지와 미확인 배송비를 구분한다', () => {
  const html = `<div class="item_box" data-pcode="B2"><div class="thumb"><img src="/rice.jpg"></div>
    <div class="info"><a class="item_name" href="/?pn=product.view&pcode=B2">쌀 4kg</a>
    <div class="price"><div class="after"><span class="won">25,000</span></div></div>
    <div class="item_icon"><span>디지털온누리</span></div></div></div>`;
  const items = parsePublicResults(searchPage(html), { mallId: 'inthemarket-onnuri', name: '인더마켓온누리몰', origin: 'https://www.inthemarket.co.kr' });
  assert.equal(items.length, 1);
  assert.equal(items[0].shippingFee, null);
});

test('꾹AI몰에서 온누리 아이콘이 표시된 검색 상품만 포함한다', () => {
  const html = `<a href="./product?prdno=13906"><div class="p_state"><img src="images/onnuri_ic.png"></div>
    <div class="thumb_wrap"><img src="pimages/rice.jpg"></div><p class="pro_title">햅쌀 10kg</p>
    <div class="priceWrap"><strong><span class="discount">18%</span>31,500</strong></div></a>
    <a href="./product?prdno=13907"><p class="pro_title">일반 상품</p><div class="priceWrap"><strong>5,000</strong></div></a>`;
  const items = parsePublicResults(html, { mallId: 'kkuk-ai-onnuri', name: '꾹AI:온누리몰', origin: 'https://onnuri.ai', kind: 'kkuk-ai' });
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 31500);
  assert.equal(items[0].productUrl, 'https://onnuri.ai/product?prdno=13906');
});

test('온누리시장 필터 응답의 현재 판매가를 추출한다', () => {
  const html = `<div id="searchListKn" data-total-cnt="1"><div id="productSearchList">
    <div class="list"><a class="imgBox" href="/product/detail?prodNo=123"><span class="img" style="background-image:url(https://example.com/rice.jpg)"></span></a>
    <div class="textBox"><a href="/product/detail?prodNo=123"><p class="text">햅쌀 10kg</p>
    <p>70,000원</p>53,000원<p class="star">4 (64)</p></a></div></div></div></div>`;
  const items = parsePublicResults(html, { mallId: 'onnuri-market-official', name: '온누리시장', origin: 'https://www.onnuri-mall.co.kr', kind: 'market' });
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 53000);
  assert.equal(items[0].productUrl, 'https://www.onnuri-mall.co.kr/product/detail?prodNo=123');
});

test('온누리찬스 공개 API는 디지털 온누리 혜택 및 품절 상태로 필터링한다', () => {
  const hit = (id, digital, sold = 'N') => ({
    item_id: id, title: '햅쌀 10kg', payload: { p_code: id, price: 38000,
      p_soldout_chk: sold, benefits: { digital_onnuri: digital },
      shipping: { status: 'free', fee: 0 } },
  });
  const items = parseChanceResults({ hits: [hit('A1', true), hit('A2', false), hit('A3', true, 'Y')] },
    { mallId: 'onnuri-chance', name: '온누리찬스', origin: 'https://onnurichance.com' });
  assert.equal(items.length, 1);
  assert.equal(items[0].shippingFee, 0);
  assert.equal(items[0].productUrl, 'https://onnurichance.com/?pn=product.view&pcode=A1');
});

test('온누리핫딜 공개 페이지 데이터는 결제 가능 상품만 포함한다', () => {
  const products = [
    { routeCode: 'ONP-1', name: '쌀 10kg', price: 39000, stock: 3, isOnnuriPayable: true, shippingPolicy: { shippingFeeType: 'free' } },
    { routeCode: 'ONP-2', name: '일반 상품', price: 1000, stock: 3, isOnnuriPayable: false },
  ];
  const flight = `30:{"initialPage":${JSON.stringify({ products })}}`;
  const html = `<script>self.__next_f.push([1,${JSON.stringify(flight)}])</script>`;
  const items = parseHotdealResults(html, { mallId: 'onnuri-hotdeal', name: '온누리핫딜', origin: 'https://onnurideal.com' });
  assert.equal(items.length, 1);
  assert.equal(items[0].shippingFee, 0);
});

test('놀장 공개 API에서 온누리 결제 및 판매 중인 상품만 포함한다', () => {
  const product = (id, onuriYn, productSaleYn = 'Y') => ({
    productId: id, marketCode: '12', productNm: '국내산 흑미 1kg', productPrice: 8000,
    onuriYn, productSaleYn, isFreeDelivery: 'N', productThumbnail: 'https://example.com/rice.jpg',
  });
  const body = { result: { content: [product(122956, 'Y'), product(122957, 'N'), product(122958, 'Y', 'N')] } };
  const items = parseNoljangResults(body, { mallId: 'noljang', name: '놀장', origin: 'https://mall.noljang.co.kr' });
  assert.equal(items.length, 1);
  assert.equal(items[0].price, 8000);
  assert.equal(items[0].shippingFee, null);
  assert.equal(items[0].productUrl, 'https://mall.noljang.co.kr/market/12/product/122956');
});
