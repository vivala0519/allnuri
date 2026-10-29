import { JSDOM, VirtualConsole } from 'jsdom';
import { matchesSearchQuery } from '../../src/utils/searchMatch.mjs';

const MALLS = [
  { mallId: 'onnuri-market-official', name: '온누리시장', origin: 'https://www.onnuri-mall.co.kr', kind: 'market' },
  { mallId: 'onnuri-goodday', name: '온누리굿데이', origin: 'https://www.onnurigood.com' },
  { mallId: 'inthemarket-onnuri', name: '인더마켓온누리몰', origin: 'https://www.inthemarket.co.kr' },
  { mallId: 'kkuk-ai-onnuri', name: '꾹AI:온누리몰', origin: 'https://onnuri.ai', kind: 'kkuk-ai' },
  { mallId: 'onnuri-chance', name: '온누리찬스', origin: 'https://onnurichance.com', kind: 'chance' },
  { mallId: 'onnuri-hotdeal', name: '온누리핫딜', origin: 'https://onnurideal.com', kind: 'hotdeal' },
  { mallId: 'noljang', name: '놀장', origin: 'https://mall.noljang.co.kr', kind: 'noljang' },
  { mallId: 'gongyoung-onnuri', name: '공영홈쇼핑 온누리장터', origin: 'https://www.gongyoungshop.kr', kind: 'gongyoung' },
  { mallId: 'gyeongbuk-cyso', name: '경북고향장터 사이소', origin: 'https://www.cyso.co.kr', kind: 'cyso' },
  { mallId: 'onnuri-paldo-sijang', name: '온누리팔도시장', origin: 'https://www.e-jangter.com', kind: 'paldo' },
  { mallId: 'onnuri-shopping', name: '온누리쇼핑', origin: 'https://onnurishop.co.kr', kind: 'onnuri-shopping' },
  { mallId: 'onnuri-5iljang', name: '온누리5일장', origin: 'https://www.onnuri5.co.kr', kind: 'five-day' },
  { mallId: 'onnuri-juntong-sijang', name: '온누리전통시장', origin: 'https://www.onnuri-sijang.com', kind: 'traditional' },
  { mallId: 'onnuri-market-nuri', name: '온누리마켓', origin: 'https://nurimarket.co.kr', kind: 'nuri' },
  { mallId: 'onnuri-gonggong-mall', name: '온누리공공몰', origin: 'https://www.ongong.kr', kind: 'gonggong' },
  { mallId: 'genius-mall', name: '지니어스 Mall', origin: 'https://luxurysystem.co.kr', kind: 'genius' },
  { mallId: 'epost-shopping-onnuri', name: '우체국쇼핑', origin: 'https://mall.epost.go.kr', kind: 'epost' },
  { mallId: 'hyundai-hmall-onnuri', name: '현대홈쇼핑 온누리샵', origin: 'https://www.hmall.com', kind: 'hmall' },
  { mallId: '11st-onnuri', name: '11번가 온누리마켓', origin: 'https://www.11st.co.kr', kind: 'elevenst' },
  { mallId: 'lotteon-onnuri', name: '롯데ON 온누리상생스토어', origin: 'https://www.lotteon.com', kind: 'lotte' },
];
const cache = new Map();
const CACHE_MS = 5 * 60 * 1000;
let cysoFeedCache;
let lotteFeedCache;

export function parsePublicResults(html, mall, now = new Date().toISOString(), query) {
  if (mall.kind === 'hotdeal') return parseHotdealResults(html, mall, now);
  const document = new JSDOM(html).window.document;
  if (mall.kind === 'paldo') return parsePaldoResults(document, mall, now);
  if (mall.kind === 'kkuk-ai') return parseKkukAiResults(document, mall, now);
  if (mall.kind === 'market') return parseMarketResults(document, mall, now);
  if (mall.kind === 'onnuri-shopping') return parseOnnuriShoppingResults(document, mall, now);
  if (mall.kind === 'nuri') return parseNuriResults(document, mall, now);
  if (mall.kind === 'gonggong') return parseGonggongResults(document, mall, now);
  if (mall.kind === 'genius') return parseGeniusResults(document, mall, now);
  if (mall.kind === 'epost') return parseEpostResults(document, mall, now);
  const form = document.querySelector('.search_form form.form_box');
  const resultArea = document.querySelector('.result_item #total_cnt');
  const emptyResult = document.querySelector('.c_section.c_comb .c_none .gtxt')?.textContent.includes('검색된 결과가 없습니다');
  if (!form || form.querySelector('input[name="pn"]')?.value !== 'product.search.list' ||
      (query !== undefined && form.querySelector('input[name="search_word"]')?.value !== query) ||
      (!resultArea && !emptyResult)) throw new Error('상품 검색 결과를 찾지 못했습니다');
  const items = [];
  for (const card of resultArea?.querySelectorAll('.item_box[data-pcode]') || []) {
    if (card.classList.contains('if_soldout') || card.querySelector('.soldout')) continue;
    const badges = [...card.querySelectorAll('.product-badge-list span, .item_icon span')];
    if (!badges.some((badge) => badge.textContent.replace(/\s/g, '') === '디지털온누리')) continue;
    const titleLink = card.querySelector('a.item_name[href]');
    const title = titleLink?.textContent.trim();
    const id = card.getAttribute('data-pcode');
    const priceText = card.querySelector('.price .after .won')?.textContent || '';
    const price = Number(priceText.replace(/[^\d]/g, ''));
    if (!id || !title || !titleLink || !Number.isFinite(price) || price <= 0) continue;
    const productUrl = new URL(titleLink.getAttribute('href'), mall.origin);
    if (productUrl.origin !== mall.origin) continue;
    const image = card.querySelector('.thumb img[src]');
    const imageUrl = image ? new URL(image.getAttribute('src'), mall.origin).toString() : '';
    const freeShipping = Boolean(card.querySelector('.item_icon img[alt="무료배송"]'));
    items.push({
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: freeShipping ? 0 : null,
      productUrl: productUrl.toString(), imageUrl, updatedAt: now,
      dataSourceLabel: '공개 검색 페이지 · 디지털온누리 표시',
    });
  }
  return items;
}

function safeImage(value, origin) {
  try { const url = new URL(value, origin); return value && url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; }
}

export function parseElevenstResults(body, mall, now = new Date().toISOString()) {
  if (!Array.isArray(body?.data) || !Number.isFinite(body.totalCount)) throw new Error('11번가 검색 결과 형식이 다릅니다');
  const seen = new Set();
  return body.data.filter((group) => group?.groupName === 'list' && Array.isArray(group.items))
    .flatMap((group) => group.items).flatMap((product) => {
      const id = String(product?.id || '');
      const title = String(product?.title || '').trim();
      const price = Number(product?.finalPrc);
      const hasOnnuri = Array.isArray(product?.benefitText) && product.benefitText.some((benefit) => benefit?.type === 'onnuri');
      if (!hasOnnuri || product.soldOut === true || product.isSoldOut === true ||
          (product.soldOut !== false && product.isSoldOut !== false) || !/^\d+$/.test(id) || !title ||
          !Number.isFinite(price) || price <= 0 || seen.has(id)) return [];
      seen.add(id);
      return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
        shippingFee: product.deliveryDescription === '무료' ? 0 : null,
        productUrl: `${mall.origin}/products/${id}`, imageUrl: safeImage(product.imageUrl, mall.origin),
        updatedAt: now, dataSourceLabel: '온누리 검색 필터 · 상품별 온누리 표시' }];
    }).slice(0, 40);
}

export function parseLotteResults(body, mall, query, now = new Date().toISOString()) {
  const data = body?.data;
  if (body?.returnCode !== '200' || String(data?.dshopNo) !== '57821' ||
      data.dshopNm !== '온누리상생스토어' || !Array.isArray(data.dpShopMdulList)) throw new Error('온누리상생스토어 데이터가 없습니다');
  const tokens = query.toLocaleLowerCase('ko').trim().split(/\s+/).filter(Boolean);
  const seen = new Set();
  return data.dpShopMdulList.flatMap((module) => Array.isArray(module?.dpLnkDpTgtSetList) ? module.dpLnkDpTgtSetList : [])
    .filter((group) => group?.dpYn === 'Y')
    .flatMap((group) => Array.isArray(group.dtgtJsn) ? group.dtgtJsn : [])
    .flatMap((target) => Array.isArray(target?.pdList?.dataList) ? target.pdList.dataList : [])
    .flatMap((product) => {
      const id = String(product?.spdNo || '');
      const title = String(product?.spdNm || '').trim();
      const price = Number(product?.frstFvrPrc);
      if (product?.onnuriYn !== 'Y' || product.slStatCd !== 'SALE' || !/^LO\d+$/.test(id) || !title ||
          !tokens.every((token) => title.toLocaleLowerCase('ko').includes(token)) ||
          !Number.isFinite(price) || price <= 0 || seen.has(id)) return [];
      seen.add(id);
      const freeShipping = Array.isArray(product.flagInfoList) && product.flagInfoList.some((flag) => flag?.flagName === '무료배송');
      return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
        shippingFee: freeShipping ? 0 : null, productUrl: `${mall.origin}/p/product/${id}`,
        imageUrl: safeImage(product.imgFullUrl, mall.origin), updatedAt: now,
        dataSourceLabel: '온누리상생스토어 · 상품별 온누리 표시' }];
    }).slice(0, 40);
}

async function searchElevenstResults(mall, query, fetchImpl) {
  const url = new URL('https://alp-apis.11st.co.kr/search/api/tab');
  for (const [key, value] of Object.entries({ poc: 'pc', tabId: 'TOTAL_SEARCH', searchKeyword: query, pageNo: '1', filters: 'ONNURI' })) url.searchParams.set(key, value);
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseElevenstResults(await response.json(), mall);
}

async function searchLotteResults(mall, query, fetchImpl) {
  if (!lotteFeedCache || Date.now() - lotteFeedCache.at >= CACHE_MS) {
    const response = await fetchImpl('https://pbf.lotteon.com/display/v2/dpShop/seltMainShop?dshopNo=57821&mdiaCd=PC', {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    parseLotteResults(body, mall, query);
    lotteFeedCache = { at: Date.now(), body };
  }
  return parseLotteResults(lotteFeedCache.body, mall, query);
}

function parseGonggongResults(document, mall, now) {
  if (!document.querySelector('#frmdetailsearch') || !document.title.includes('상품검색')) throw new Error('상품 검색 결과를 찾지 못했습니다');
  return [...document.querySelectorAll('.nl-items > a.nl-item')].flatMap((card) => {
    let url;
    try { url = new URL(card.getAttribute('href'), `${mall.origin}/shop/`); } catch { return []; }
    const id = url.searchParams.get('it_id');
    const title = card.querySelector('.nl-name b')?.textContent.trim();
    const priceNode = card.querySelector('.nl-price .discount') || card.querySelector('.nl-price .unit');
    const price = Number((priceNode?.textContent || '').replace(/[^\d]/g, ''));
    if (url.origin !== mall.origin || url.pathname !== '/shop/item.php' || !/^\d+$/.test(id || '') || !title || !Number.isFinite(price) || price <= 0 || /품절|판매종료/.test(card.textContent)) return [];
    return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
      shippingFee: card.querySelector('.free-ship')?.textContent.includes('무료배송') ? 0 : null,
      productUrl: url.toString(), imageUrl: safeImage(card.querySelector('.nl-item-pic img')?.getAttribute('src'), mall.origin),
      updatedAt: now, eligibility: 'unknown', dataSourceLabel: '공개 검색 · 상품별 결제 여부 미확인' }];
  });
}

function parseGeniusResults(document, mall, now) {
  if (!document.querySelector('form.search_bbs')) throw new Error('상품 검색 결과를 찾지 못했습니다');
  return [...document.querySelectorAll('.area_shopList ul[data-shop-list="default"] > li > a[href]')].flatMap((card) => {
    let url;
    try { url = new URL(card.getAttribute('href'), mall.origin); } catch { return []; }
    const id = url.searchParams.get('id');
    const title = card.querySelector(':scope > em')?.textContent.trim();
    const price = Number((card.querySelector('.price i:last-child')?.textContent || '').replace(/[^\d]/g, ''));
    if (url.origin !== mall.origin || url.pathname !== '/product/product.html' || url.searchParams.get('mode') !== 'view' || !/^\d+$/.test(id || '') || !title || !Number.isFinite(price) || price <= 0 || /품절|판매종료/.test(card.textContent)) return [];
    return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
      shippingFee: null, productUrl: url.toString(), imageUrl: safeImage(card.querySelector('.img img')?.getAttribute('src'), mall.origin),
      updatedAt: now, eligibility: 'unknown', dataSourceLabel: '공개 검색 · 상품별 결제 여부 미확인' }];
  });
}

function parseEpostResults(document, mall, now) {
  if (!document.querySelector('form#frm input[name="srchGoodsNm"]') ||
      (!document.querySelector('.list_box_v4') && !document.body.textContent.includes('판매중인 상품이 없습니다.'))) throw new Error('전통시장 검색 결과를 찾지 못했습니다');
  return [...document.querySelectorAll('.list_box_v4 .list_box > ul > li')].flatMap((card) => {
    const link = card.querySelector('a[href*="fn_goodsDetailView"]');
    const args = link?.getAttribute('href')?.match(/fn_goodsDetailView\('([A-Za-z0-9]+)','(05)','([A-Za-z0-9]*)','([A-Za-z0-9]*)','(\d+)'\)/);
    const title = card.querySelector('.goods_text .tit')?.textContent.trim();
    const price = Number((card.querySelector('.goods_text .price > p:not(.dc) em')?.textContent || '').replace(/[^\d]/g, ''));
    if (!args || !title || !Number.isFinite(price) || price <= 0 || /품절|판매종료/.test(card.textContent)) return [];
    const url = new URL('/fo/goods/goodsDetailView.do', mall.origin);
    for (const [key, value] of Object.entries({ goodsCd: args[1], pavlnDivCd: args[2], goodsDispTypeCd: args[3], goodsDispTypeDtlCd: args[4], ctgryCd: args[5] })) url.searchParams.set(key, value);
    return [{ id: `${mall.mallId}:${args[1]}`, mallId: mall.mallId, mallName: mall.name, title, price,
      shippingFee: card.querySelector('.goods_tip')?.textContent.includes('무료배송') ? 0 : null,
      productUrl: url.toString(), imageUrl: safeImage(card.querySelector('.goods_img img')?.getAttribute('src'), mall.origin),
      updatedAt: now, eligibility: 'unknown', dataSourceLabel: '전통시장관 검색 · 상품별 결제 여부 미확인' }];
  });
}

export function parseHmallResults(html, mall, query, now = new Date().toISOString()) {
  const document = new JSDOM(html, { virtualConsole: new VirtualConsole() }).window.document;
  let body;
  try { body = JSON.parse(document.querySelector('#__NEXT_DATA__')?.textContent || ''); } catch { throw new Error('온누리샵 데이터가 없습니다'); }
  const page = body?.props?.pageProps;
  const products = page?.res?.searchResult?.hmallItemSearchResultList;
  if (page?.param?.onnuriGcStlmYn !== 'Y' || page.param.searchTerm !== query || !Array.isArray(products)) throw new Error('온누리 검색 필터가 적용되지 않았습니다');
  const seen = new Set();
  return products.flatMap((product) => {
    const id = String(product?.slitmCd || '');
    const title = String(product?.slitmNm || '').trim();
    const price = Number(product?.sellPrc);
    if (product?.onnuriGcStlmYn !== 'Y' || product.soldout === true || product.ostkYn !== 'N' || !/^\d+$/.test(id) || !title || !Number.isFinite(price) || price <= 0 || seen.has(id)) return [];
    seen.add(id);
    const imageName = String(product.orglImgNm || '');
    const imageUrl = id.length >= 8 && /^[\w.-]+$/.test(imageName)
      ? `https://image.hmall.com/static/${id.slice(7, 8)}/${id.slice(6, 7)}/${id.slice(4, 6)}/${id.slice(2, 4)}/${imageName}` : '';
    return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price, shippingFee: null,
      productUrl: `${mall.origin}/md/pda/itemPtc?slitmCd=${id}`, imageUrl, updatedAt: now,
      dataSourceLabel: '온누리 검색 필터 · 디지털온누리 결제 필드' }];
  }).slice(0, 40);
}

async function searchHmallResults(mall, query, fetchImpl) {
  const url = new URL('/md/pde/search', mall.origin);
  url.searchParams.set('searchTerm', query);
  url.searchParams.set('onnuriGcStlmYn', 'Y');
  const response = await fetchImpl(url, { headers: { Accept: 'text/html' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseHmallResults(await response.text(), mall, query);
}

function parseNuriResults(document, mall, now) {
  if (!document.querySelector('form[name="frmsearch1"]') || !document.title.includes('상품검색')) {
    throw new Error('상품 검색 결과를 찾지 못했습니다');
  }
  return [...document.querySelectorAll('.main_list .swiper-slide')].flatMap((card) => {
    const link = card.querySelector('.main_list_tit a[href]');
    if (!link || /품절|판매종료/.test(card.textContent)) return [];
    let url;
    try { url = new URL(link.getAttribute('href'), mall.origin); } catch { return []; }
    const id = url.searchParams.get('it_id');
    const title = link.textContent.trim();
    const priceText = card.querySelector('.main_list_price_li2')?.textContent || '';
    const price = Number(priceText.replace(/[^\d]/g, ''));
    if (url.origin !== mall.origin || url.pathname !== '/shop/item.php' || !/^\d+$/.test(id || '') || !title || !Number.isFinite(price) || price <= 0) return [];
    const image = card.querySelector('.main_list_img img[alt][src]')?.getAttribute('src') || '';
    let imageUrl = '';
    try { const parsed = new URL(image, mall.origin); if (image && parsed.protocol === 'https:') imageUrl = parsed.toString(); } catch { /* Ignore invalid images. */ }
    return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
      shippingFee: card.querySelector('.main_list_ico')?.textContent.includes('무료배송') ? 0 : null,
      productUrl: url.toString(), imageUrl, updatedAt: now, eligibility: 'unknown',
      dataSourceLabel: '공개 검색 · 상품별 결제 여부 미확인' }];
  });
}

export function parseTraditionalResults(body, mall, now = new Date().toISOString()) {
  const result = body?.[1];
  if (!Array.isArray(body) || !Array.isArray(result?.resultDocuments) || result.errorCode !== 0) {
    throw new Error('검색 결과 형식이 다릅니다');
  }
  return result.resultDocuments.flatMap((product) => {
    const id = String(product?.GDS_CD || '');
    const category = String(product?.SCAT_CD || '');
    const title = String(product?.GDS_NM || '').trim();
    const price = Number(product?.REAL_SELL_PRC_B2C);
    if (!/^\d+$/.test(id) || !/^\d+$/.test(category) || !title || !Number.isFinite(price) || price <= 0) return [];
    const path = String(product.IMG_PATH || '');
    return [{ id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name, title, price,
      shippingFee: product.CNDL_NCHG_DLV_YN === 'Y' ? 0 : null,
      productUrl: `${mall.origin}/onnuri/goods/detail?goodsCd=${id}&ctgCd=${category}`,
      imageUrl: /^\/upload\/goods\/images\/[\w/.-]+$/i.test(path) ? `https://contents-prd.ezwelfare.net/ezwel-image/welfare_market${path}` : '',
      updatedAt: now, eligibility: 'unknown', dataSourceLabel: '공개 검색 · 상품별 결제 여부 미확인' }];
  });
}

async function searchTraditionalResults(mall, query, fetchImpl) {
  const url = new URL('/onnuri/main/searchList', mall.origin);
  const params = { searchTerm: encodeURIComponent(query), displaySize: '20', currentPage: '1',
    clientCd: 'onnuri_b2c', dvcCd: 'PCWB', svcType: '1001', sort: 'best',
    cndlNchgDlvYn: '', minPrice: '', maxPrice: '', brndCd: '', lcatCd: '', mcatCd: '', scatCd: '', b2cYn: 'Y' };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseTraditionalResults(await response.json(), mall);
}

function parseOnnuriShoppingResults(document, mall, now) {
  return [...document.querySelectorAll('a[href="#goods"][prdtno]')].flatMap((card) => {
    if (!card.querySelector('.onnuri-on') || /품절|판매종료/.test(card.textContent)) return [];
    const id = card.getAttribute('prdtno');
    const title = card.querySelector('.txt .name')?.textContent.trim();
    const price = Number((card.querySelector('.price strong')?.textContent || '').replace(/,/g, '').trim());
    if (!/^\d+$/.test(id || '') || !title || !Number.isFinite(price) || price <= 0) return [];
    const image = card.querySelector('.img img[src]')?.getAttribute('src') || '';
    let imageUrl = '';
    try {
      if (image) {
        const parsed = new URL(image, mall.origin);
        if (parsed.protocol === 'https:') imageUrl = parsed.toString();
      }
    } catch { /* Malformed image paths do not invalidate a product. */ }
    return [{
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: null, productUrl: `${mall.origin}/shop/goods/${id}`,
      imageUrl, updatedAt: now,
      dataSourceLabel: '공개 검색 페이지 · 온누리 표시',
    }];
  });
}

export function parseFiveDayResults(body, mall, now = new Date().toISOString()) {
  if (!Array.isArray(body?.data)) throw new Error('검색 결과 형식이 다릅니다');
  return body.data.flatMap((product) => {
    if (product?.prd_type !== 'onnuri' || ![2, 5].includes(Number(product.stat)) || product.is_soldout === 'M') return [];
    const id = String(product.hash || '');
    const title = String(product.name || '').trim();
    const price = Number(product.sell_prc);
    if (!/^[A-Za-z0-9]+$/.test(id) || !title || !Number.isFinite(price) || price <= 0) return [];
    const image = String(product.thumb || '');
    return [{
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: product.is_free_dlv === 'Y' ? 0 : null,
      productUrl: `${mall.origin}/shop/goods_detail?hash=${id}`,
      imageUrl: image.startsWith('https://') ? image : '', updatedAt: now,
      dataSourceLabel: '공개 검색 API · 온누리 상품 유형',
    }];
  });
}

async function searchFiveDayResults(mall, query, fetchImpl) {
  const response = await fetchImpl('https://api.samaint.co.kr/main/product_search_cate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'application/json' },
    body: new URLSearchParams({ mall_id: 'onnuri', member_id: '', cno: '', cate_gno: '45',
      search_str: query, request_method: 'POST', page: '1', perPage: '30' }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseFiveDayResults(await response.json(), mall);
}

function parsePaldoResults(document, mall, now) {
  if (!document.querySelector('a.selectCondition[onclick*="fnCategoryClick(3130)"]')) throw new Error('온누리 카테고리 필터가 적용되지 않았습니다');
  const items = [];
  for (const card of document.querySelectorAll('form#Frm .item_box')) {
    const link = card.querySelector('a.item_info[href*="/Goods/Content.aspx"]');
    if (!link) continue;
    const productUrl = new URL(link.getAttribute('href'), mall.origin);
    const id = productUrl.searchParams.get('guid');
    const title = card.querySelector('.item_n')?.textContent.trim();
    const price = Number((card.querySelector('.item_price_n')?.textContent || '').replace(/[^\d]/g, ''));
    if (!/^\d+$/.test(id || '') || !title || !Number.isFinite(price) || price <= 0 || productUrl.origin !== mall.origin) continue;
    const image = card.querySelector('.item_thumb img[src]');
    const imageUrl = image ? new URL(image.getAttribute('src'), mall.origin).toString() : '';
    items.push({
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: card.querySelector('.box_item_tag')?.textContent.includes('무료배송') ? 0 : null,
      productUrl: productUrl.toString(), imageUrl, updatedAt: now,
      dataSourceLabel: '공개 검색 페이지 · 온누리 팔도시장 카테고리 필터',
    });
  }
  return items;
}

function readJsonObject(source, start) {
  if (source[start] !== '{') return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) { escaped = false; continue; }
    if (quoted && char === '\\') { escaped = true; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return JSON.parse(source.slice(start, i + 1));
  }
  return null;
}

export function parseHotdealResults(html, mall, now = new Date().toISOString()) {
  const document = new JSDOM(html).window.document;
  let page = null;
  for (const script of document.querySelectorAll('script')) {
    const source = script.textContent;
    if (!source.includes('initialPage')) continue;
    const match = source.match(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/);
    if (!match) continue;
    const flight = JSON.parse(match[1]);
    const marker = '"initialPage":';
    const start = flight.indexOf(marker);
    if (start < 0) continue;
    page = readJsonObject(flight, start + marker.length);
    if (page) break;
  }
  if (!Array.isArray(page?.products)) throw new Error('상품 검색 데이터가 없습니다');
  return page.products.flatMap((product) => {
    if (product?.isOnnuriPayable !== true || product.stock <= 0 || product.isListingVisible === false) return [];
    const id = String(product.routeCode || '').trim();
    const title = String(product.name || '').trim();
    const price = Number(product.price);
    if (!id || !title || !Number.isFinite(price) || price <= 0) return [];
    const fee = product.shippingPolicy?.shippingFeeType === 'free' ? 0
      : Number.isFinite(product.baseShippingFee) && product.baseShippingFee >= 0 ? product.baseShippingFee : null;
    return [{
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: fee,
      productUrl: `${mall.origin}/products/${encodeURIComponent(id)}`,
      imageUrl: typeof product.image === 'string' && product.image.startsWith('https://') ? product.image : '',
      updatedAt: now, dataSourceLabel: '공개 검색 페이지 · 온누리 결제 필드',
    }];
  });
}

function parseMarketResults(document, mall, now) {
  const items = [];
  if (!document.querySelector('#searchListKn[data-total-cnt]')) return items;
  for (const card of document.querySelectorAll('#productSearchList .list')) {
    const title = card.querySelector('.textBox .text')?.textContent.trim();
    const link = card.querySelector('.textBox a[href*="prodNo="]');
    if (!title || !link) continue;
    const productUrl = new URL(link.getAttribute('href'), mall.origin);
    const id = productUrl.searchParams.get('prodNo');
    const prices = [...link.textContent.matchAll(/([\d,]+)\s*원/g)];
    const price = Number(prices.at(-1)?.[1]?.replace(/,/g, ''));
    if (!id || !Number.isFinite(price) || price <= 0 || productUrl.origin !== mall.origin) continue;
    const imageStyle = card.querySelector('.imgBox .img')?.getAttribute('style') || '';
    const imagePath = imageStyle.match(/url\((['"]?)(.*?)\1\)/)?.[2];
    items.push({
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: null, productUrl: productUrl.toString(),
      imageUrl: imagePath ? new URL(imagePath, mall.origin).toString() : '',
      updatedAt: now, dataSourceLabel: '공개 검색 페이지 · 디지털온누리 필터',
    });
  }
  return items;
}

function parseKkukAiResults(document, mall, now) {
  const items = [];
  for (const link of document.querySelectorAll('a[href*="prdno="]')) {
    if (!link.querySelector('.p_state img[src*="onnuri_ic"]')) continue;
    const titleNode = link.querySelector('.pro_title')?.cloneNode(true);
    titleNode?.querySelectorAll('.ttlIcon').forEach((badge) => badge.remove());
    const title = titleNode?.textContent.trim();
    if (!title || title.includes('품절')) continue;
    const productUrl = new URL(link.getAttribute('href'), `${mall.origin}/`);
    const id = productUrl.searchParams.get('prdno');
    const priceText = link.querySelector('.priceWrap strong')?.textContent || '';
    const price = Number(priceText.match(/([\d,]+)\s*$/)?.[1]?.replace(/,/g, ''));
    if (!id || !title || !Number.isFinite(price) || price <= 0 || productUrl.origin !== mall.origin) continue;
    const image = link.querySelector('.thumb_wrap img[src]');
    const imageUrl = image ? new URL(image.getAttribute('src'), `${mall.origin}/`).toString() : '';
    items.push({
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: null, productUrl: productUrl.toString(),
      imageUrl, updatedAt: now, dataSourceLabel: '공개 검색 페이지 · 온누리 아이콘 표시',
    });
  }
  return items;
}

export function parseChanceResults(body, mall, now = new Date().toISOString()) {
  if (!Array.isArray(body?.hits)) throw new Error('검색 결과 형식이 다릅니다');
  const items = [];
  for (const hit of body.hits) {
    const payload = hit?.payload;
    if (payload?.benefits?.digital_onnuri !== true || payload.p_soldout_chk === 'Y') continue;
    const id = String(payload.p_code || hit.item_id || '').trim();
    const title = String(hit.title || payload.p_name || '').trim();
    const price = Number(payload.price ?? payload.p_price);
    if (!id || !title || !Number.isFinite(price) || price <= 0) continue;
    const shippingFee = payload.shipping?.status === 'free' ? 0
      : Number.isFinite(payload.shipping?.fee) && payload.shipping.fee >= 0 ? payload.shipping.fee : null;
    const imageUrl = String(payload.image_url || payload.p_img_list_square || '');
    items.push({
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee,
      productUrl: `${mall.origin}/?pn=product.view&pcode=${encodeURIComponent(id)}`,
      imageUrl: imageUrl.startsWith('https://') ? imageUrl : '',
      updatedAt: now, dataSourceLabel: '공개 검색 API · 디지털온누리 혜택',
    });
  }
  return items;
}

export function parseNoljangResults(body, mall, now = new Date().toISOString()) {
  const products = body?.result?.content;
  if (!Array.isArray(products)) throw new Error('검색 결과 형식이 다릅니다');
  return products.flatMap((product) => {
    if (product?.onuriYn !== 'Y' || product.productSaleYn !== 'Y') return [];
    const id = String(product.productId ?? '').trim();
    const marketCode = String(product.marketCode ?? '').trim();
    const title = String(product.productNm ?? '').trim();
    const price = Number(product.productPrice);
    if (!/^\d+$/.test(id) || !/^\d+$/.test(marketCode) || !title || !Number.isFinite(price) || price <= 0) return [];
    const imageUrl = String(product.productThumbnail || '');
    return [{
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: product.isFreeDelivery === 'Y' ? 0 : null,
      productUrl: `${mall.origin}/market/${marketCode}/product/${id}`,
      imageUrl: imageUrl.startsWith('https://') ? imageUrl : '',
      updatedAt: now, dataSourceLabel: '공개 검색 API · 온누리 결제 필드',
    }];
  });
}

function parseGongyoungXml(xml) {
  const document = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
  if (document.querySelector('parsererror')) throw new Error('상품 응답 XML 형식이 다릅니다');
  return document;
}

export function parseGongyoungResults(xml, mall, now = new Date().toISOString()) {
  const document = parseGongyoungXml(xml);
  if (!document.querySelector('ModelMap')) throw new Error('상품 상세 결과가 없습니다');
  const value = (node, tag) => node.querySelector(tag)?.textContent?.trim() || '';
  return [...document.querySelectorAll('goodsUnitInfoList')].flatMap((node) => {
    if (value(node, 'trditMrktGoodsYn') !== 'Y' || value(node, 'saleStatCd') !== '110' || value(node, 'stkSoldYn') === 'Y') return [];
    const id = value(node, 'prdId');
    const title = value(node, 'prdNm');
    const price = Number(value(node, 'prdPrc'));
    if (!/^\d+$/.test(id) || !title || !Number.isFinite(price) || price <= 0) return [];
    const imagePath = value(node, 'imgUrl');
    return [{
      id: `${mall.mallId}:${id}`, mallId: mall.mallId, mallName: mall.name,
      title, price, shippingFee: value(node, 'freeDlvYn') === 'Y' ? 0 : null,
      productUrl: `${mall.origin}/goods/selectGoodsDetail.do?prdId=${id}`,
      imageUrl: /^\/[\w/.-]+\.(?:jpg|jpeg|png|webp)$/i.test(imagePath)
        ? `https://img.publichs.com/ECMCFO/share/product${imagePath}` : '',
      updatedAt: now, dataSourceLabel: '공개 상품 카드 데이터 · 온누리 표시',
    }];
  });
}

async function searchGongyoungResults(mall, query, fetchImpl) {
  const requestOptions = { signal: AbortSignal.timeout(8000) };
  const searchResponse = await fetchImpl(`${mall.origin}/search/ajaxSearchGoodsList.do`, {
    ...requestOptions, method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'text/xml' },
    body: new URLSearchParams({ kwd: query, preKwd: query, pageNum: '1', pageSize: '40', sort: 'r' }),
  });
  if (!searchResponse.ok) throw new Error(`HTTP ${searchResponse.status}`);
  const searchDocument = parseGongyoungXml(await searchResponse.text());
  if (searchDocument.querySelector('rstCode')?.textContent !== '0000') throw new Error('상품 검색 실패');
  const ids = [...searchDocument.querySelectorAll('Map > list > prdId')]
    .map((node) => node.textContent.trim()).filter((id) => /^\d+$/.test(id));
  if (ids.length === 0) return [];
  const detailsResponse = await fetchImpl(`${mall.origin}/goods/getGoodsUnitInfo.do`, {
    ...requestOptions, method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', Accept: 'text/xml' },
    body: JSON.stringify({ includeBrdCstTgtPrd: false, isSlStsCd130: false,
      prdInfoList: ids.map((prdId, idx) => ({ idx, prdId })) }),
  });
  if (!detailsResponse.ok) throw new Error(`HTTP ${detailsResponse.status}`);
  const results = parseGongyoungResults(await detailsResponse.text(), mall);
  return results.filter((item) => ids.includes(item.id.slice(mall.mallId.length + 1)));
}

export function parseCysoResults(body, mall, query, now = new Date().toISOString()) {
  if (body?.itemExhibition?.exhbNo !== 1773379812 || body.itemExhibition.useYn !== true ||
      !String(body.itemExhibition.exhbName || '').includes('온누리상품권') ||
      !Array.isArray(body.itemDisplayFullInfoList)) throw new Error('온누리 기획전 데이터가 없습니다');
  const keyword = query.toLocaleLowerCase('ko');
  return body.itemDisplayFullInfoList.flatMap((group) => Array.isArray(group.displayItems) ? group.displayItems : [])
    .filter((product) => product?.saleYn === true && product.soldoutYn === false &&
      Number(product.saleStock) > 0 && String(product.itemName || '').toLocaleLowerCase('ko').includes(keyword))
    .slice(0, 40).flatMap((product) => {
      const id = String(product.itemNo || '');
      const saleItemNo = String(product.saleItemNo || '');
      const title = String(product.itemName || '').trim();
      const price = Number(product.salePrc);
      if (!/^\d+$/.test(id) || !/^\d+$/.test(saleItemNo) || !title || !Number.isFinite(price) || price <= 0) return [];
      const imagePath = String(product.itemImgUrl || '');
      return [{
        id: `${mall.mallId}:${saleItemNo}`, mallId: mall.mallId, mallName: mall.name,
        title, price, shippingFee: null,
        productUrl: `${mall.origin}/item/detail?id=${id}&saleItemNo=${saleItemNo}`,
        imageUrl: imagePath.startsWith('/data/item/') ? `https://cdn.cyso.co.kr${imagePath}` : '',
        updatedAt: now, dataSourceLabel: '공개 온누리상품권 기획전 · 판매 중 상품',
      }];
    });
}

async function searchCysoResults(mall, query, fetchImpl) {
  if (!cysoFeedCache || Date.now() - cysoFeedCache.at >= CACHE_MS) {
    const tokenResponse = await fetchImpl('https://api.cyso.co.kr/auth-service/api/v1/auth/guest/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}', signal: AbortSignal.timeout(8000),
    });
    if (!tokenResponse.ok) throw new Error(`HTTP ${tokenResponse.status}`);
    const token = (await tokenResponse.json())?.accessToken;
    if (typeof token !== 'string' || !token) throw new Error('게스트 토큰이 없습니다');
    const response = await fetchImpl('https://api.cyso.co.kr/item-service/api/v1/user/item/exhibition/1773379812', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    parseCysoResults(body, mall, query);
    cysoFeedCache = { at: Date.now(), body };
  }
  return parseCysoResults(cysoFeedCache.body, mall, query);
}

function buildSearchUrl(mall, query) {
  if (mall.kind === 'gonggong' || mall.kind === 'genius' || mall.kind === 'epost') {
    const paths = { gonggong: '/shop/search.php', genius: '/product/product.html', epost: '/fo/pavln/sijangAll.do' };
    const keys = { gonggong: 'stx', genius: 'search', epost: 'srchGoodsNm' };
    const url = new URL(paths[mall.kind], mall.origin);
    url.searchParams.set(keys[mall.kind], query);
    if (mall.kind === 'epost') { url.searchParams.set('pageIndex', '1'); url.searchParams.set('searchMCtgryCd', '99'); }
    return url.toString();
  }
  if (mall.kind === 'nuri') {
    const url = new URL('/shop/search_product.php', mall.origin);
    url.searchParams.set('sq', query);
    return url.toString();
  }
  if (mall.kind === 'onnuri-shopping') {
    const url = new URL('/search', mall.origin);
    url.searchParams.set('searchWrd', query);
    return url.toString();
  }
  if (mall.kind === 'paldo') {
    const url = new URL('/goods/search.aspx', mall.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('sort', 'SELLCNT');
    url.searchParams.set('page', '1');
    url.searchParams.set('pagesize', '40');
    url.searchParams.set('lcatlist', '3130');
    return url.toString();
  }
  if (mall.kind === 'noljang') {
    const url = new URL('https://api.noljang.co.kr/api/v1/search/MARKET/entire/ver2');
    url.searchParams.set('keyword', query);
    url.searchParams.set('size', '20');
    url.searchParams.set('page', '0');
    return url.toString();
  }
  if (mall.kind === 'hotdeal') {
    const url = new URL('/search', mall.origin);
    url.searchParams.set('q', query);
    return url.toString();
  }
  if (mall.kind === 'chance') {
    const url = new URL('https://api.onnurichance.com/search');
    url.searchParams.set('q', query);
    url.searchParams.set('size', '20');
    url.searchParams.set('sort_by', 'relevance');
    return url.toString();
  }
  if (mall.kind === 'market') {
    const url = new URL('/product/searchAjax', mall.origin);
    url.searchParams.set('listCount', '40');
    url.searchParams.set('searchNmed', query);
    url.searchParams.set('onrCertYn', 'Y');
    return url.toString();
  }
  if (mall.kind === 'kkuk-ai') {
    const url = new URL('/search', mall.origin);
    url.searchParams.set('k_order', '3');
    url.searchParams.set('page_num', '50');
    url.searchParams.set('keytype', 'productname:productcode:comment');
    url.searchParams.set('keyword', query);
    return url.toString();
  }
  return `${mall.origin}/?pn=product.search.list&search_word=${encodeURIComponent(query)}`;
}

export async function searchPublicMalls(query, fetchImpl = fetch, mallIds) {
  const results = await Promise.all(MALLS.filter((mall) => !mallIds || mallIds.includes(mall.mallId)).map(async (mall) => {
    try {
      const url = buildSearchUrl(mall, query);
      const key = `${mall.mallId}:${query}`;
      let items = cache.get(key);
      if (!items || Date.now() - items.at >= CACHE_MS) {
        if (mall.kind === 'gongyoung') {
          items = { at: Date.now(), value: await searchGongyoungResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'cyso') {
          items = { at: Date.now(), value: await searchCysoResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'five-day') {
          items = { at: Date.now(), value: await searchFiveDayResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'traditional') {
          items = { at: Date.now(), value: await searchTraditionalResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'hmall') {
          items = { at: Date.now(), value: await searchHmallResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'elevenst') {
          items = { at: Date.now(), value: await searchElevenstResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else if (mall.kind === 'lotte') {
          items = { at: Date.now(), value: await searchLotteResults(mall, query, fetchImpl) };
          cache.set(key, items);
        } else {
        const response = await fetchImpl(url, {
          headers: { Accept: mall.kind === 'chance' || mall.kind === 'noljang' ? 'application/json' : 'text/html' },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let value;
        if (mall.kind === 'chance') {
          value = parseChanceResults(await response.json(), mall);
        } else if (mall.kind === 'noljang') {
          value = parseNoljangResults(await response.json(), mall);
        } else {
          const html = await response.text();
          const marker = mall.kind === 'paldo' ? 'fnCategoryClick(3130)'
            : mall.kind === 'gonggong' ? 'frmdetailsearch'
            : mall.kind === 'genius' ? 'search_bbs'
            : mall.kind === 'epost' ? 'srchGoodsNm'
            : mall.kind === 'nuri' ? 'frmsearch1'
            : mall.kind === 'onnuri-shopping' ? 'searchWrd'
            : mall.kind === 'kkuk-ai' ? 'pro_title'
            : mall.kind === 'market' ? 'searchListKn'
            : mall.kind === 'hotdeal' ? 'initialPage' : 'search_form';
          if (!html.includes(marker)) throw new Error('상품 검색 결과를 찾지 못했습니다');
          value = parsePublicResults(html, mall, undefined, query);
        }
        items = { at: Date.now(), value };
        cache.set(key, items);
        }
      }
      const matchingItems = items.value.filter((item) => matchesSearchQuery(item.title, query));
      return { source: { mallId: mall.mallId, status: 'connected', count: matchingItems.length }, items: matchingItems };
    } catch {
      return { source: { mallId: mall.mallId, status: 'error', count: 0 }, items: [] };
    }
  }));
  return { items: results.flatMap((result) => result.items), sources: results.map((result) => result.source) };
}
