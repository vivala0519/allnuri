import { JSDOM } from 'jsdom';

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
];
const cache = new Map();
const CACHE_MS = 5 * 60 * 1000;
let cysoFeedCache;

export function parsePublicResults(html, mall, now = new Date().toISOString()) {
  if (mall.kind === 'hotdeal') return parseHotdealResults(html, mall, now);
  const document = new JSDOM(html).window.document;
  if (mall.kind === 'paldo') return parsePaldoResults(document, mall, now);
  if (mall.kind === 'kkuk-ai') return parseKkukAiResults(document, mall, now);
  if (mall.kind === 'market') return parseMarketResults(document, mall, now);
  const items = [];
  for (const card of document.querySelectorAll('.item_box[data-pcode]')) {
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

export async function searchPublicMalls(query, fetchImpl = fetch) {
  const results = await Promise.all(MALLS.map(async (mall) => {
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
            : mall.kind === 'kkuk-ai' ? 'pro_title'
            : mall.kind === 'market' ? 'searchListKn'
            : mall.kind === 'hotdeal' ? 'initialPage' : 'item_box';
          if (!html.includes(marker)) throw new Error('상품 검색 결과를 찾지 못했습니다');
          value = parsePublicResults(html, mall);
        }
        items = { at: Date.now(), value };
        cache.set(key, items);
        }
      }
      return { source: { mallId: mall.mallId, status: 'connected', count: items.value.length }, items: items.value };
    } catch {
      return { source: { mallId: mall.mallId, status: 'error', count: 0 }, items: [] };
    }
  }));
  return { items: results.flatMap((result) => result.items), sources: results.map((result) => result.source) };
}
