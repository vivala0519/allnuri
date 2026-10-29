import { readFeedConfig, searchPartnerFeeds } from '../../server/onnuri/feedCore.mjs';

export async function handler(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  const query = String(event.queryStringParameters?.q || '').trim();
  if (!query || query.length > 100) return { statusCode: 400, body: JSON.stringify({ error: 'q must be 1–100 characters' }) };
  try {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: JSON.stringify(await searchPartnerFeeds(query, readFeedConfig())),
    };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Feed configuration is invalid' }) };
  }
}
