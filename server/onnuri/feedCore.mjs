const cache = new Map();
const CACHE_MS = 5 * 60 * 1000;

export function readFeedConfig(value = process.env.ONNURI_FEEDS_JSON) {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length > 3) {
    throw new Error('ONNURI_FEEDS_JSON must be an array of at most three feeds.');
  }
  const ids = new Set();
  return parsed.map((feed) => {
    if (!feed || typeof feed.mallId !== 'string' || !/^[a-z0-9-]+$/.test(feed.mallId)
      || typeof feed.url !== 'string' || new URL(feed.url).protocol !== 'https:'
      || ids.has(feed.mallId)) {
      throw new Error('Each feed needs a unique mallId and an HTTPS url.');
    }
    ids.add(feed.mallId);
    return { mallId: feed.mallId, url: feed.url, name: String(feed.name || feed.mallId),
      token: typeof feed.token === 'string' ? feed.token : null };
  });
}

async function loadFeed(feed, fetchImpl) {
  const cached = cache.get(feed.url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.items;
  const response = await fetchImpl(feed.url, {
    headers: feed.token ? { Authorization: `Bearer ${feed.token}` } : {},
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`feed HTTP ${response.status}`);
  const body = await response.json();
  const items = Array.isArray(body) ? body : body?.items;
  if (!Array.isArray(items)) throw new Error('feed must contain an items array');
  cache.set(feed.url, { at: Date.now(), items });
  return items;
}

function normalize(item, feed) {
  if (!item || item.onnuriEligible !== true || typeof item.id !== 'string'
    || typeof item.title !== 'string' || !item.title.trim()
    || !Number.isFinite(item.price) || item.price < 0
    || typeof item.productUrl !== 'string') return null;
  let productUrl;
  try {
    productUrl = new URL(item.productUrl);
    if (productUrl.protocol !== 'https:') return null;
  } catch { return null; }
  return {
    id: `${feed.mallId}:${item.id}`, mallId: feed.mallId, mallName: feed.name,
    title: item.title.trim(), price: item.price,
    shippingFee: Number.isFinite(item.shippingFee) && item.shippingFee >= 0 ? item.shippingFee : 0,
    productUrl: productUrl.toString(),
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    dataSourceLabel: '제휴 상품 피드',
  };
}

export async function searchPartnerFeeds(query, feeds, fetchImpl = fetch) {
  const tokens = query.toLocaleLowerCase('ko').trim().split(/\s+/).filter(Boolean);
  const results = await Promise.all(feeds.map(async (feed) => {
    try {
      const raw = await loadFeed(feed, fetchImpl);
      const items = raw.map((item) => normalize(item, feed)).filter(Boolean)
        .filter((item) => tokens.every((token) => item.title.toLocaleLowerCase('ko').includes(token)));
      return { source: { mallId: feed.mallId, status: 'connected', count: items.length }, items };
    } catch {
      return { source: { mallId: feed.mallId, status: 'error', count: 0 }, items: [] };
    }
  }));
  return { items: results.flatMap((result) => result.items), sources: results.map((result) => result.source) };
}
