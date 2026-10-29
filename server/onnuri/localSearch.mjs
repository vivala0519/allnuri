import { readFeedConfig, searchPartnerFeeds } from './feedCore.mjs';
import { searchPublicMalls } from './publicSearch.mjs';

export async function searchLocalProducts(query, fetchImpl = fetch, mallIds) {
  const [feeds, publicResults] = await Promise.all([
    searchPartnerFeeds(query, readFeedConfig().filter((feed) => !mallIds || mallIds.includes(feed.mallId)), fetchImpl),
    searchPublicMalls(query, fetchImpl, mallIds),
  ]);
  return {
    items: [...publicResults.items, ...feeds.items],
    sources: [...publicResults.sources, ...feeds.sources],
  };
}

export async function handleLocalSearch(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  const url = new URL(request.url || '/', 'http://localhost');
  const query = (url.searchParams.get('q') || '').trim();
  if (!query || query.length > 100) {
    response.statusCode = 400;
    response.end(JSON.stringify({ error: 'q must be 1–100 characters' }));
    return;
  }
  try {
    const mallIds = url.searchParams.has('malls') ? url.searchParams.get('malls').split(',').filter(Boolean) : undefined;
    response.end(JSON.stringify(await searchLocalProducts(query, fetch, mallIds)));
  } catch {
    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'Search configuration is invalid' }));
  }
}
