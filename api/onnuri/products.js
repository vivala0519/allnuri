import { readFeedConfig, searchPartnerFeeds } from './feedCore.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const query = String(request.query.q || '').trim();
  if (!query || query.length > 100) return response.status(400).json({ error: 'q must be 1–100 characters' });
  try {
    const result = await searchPartnerFeeds(query, readFeedConfig());
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json(result);
  } catch {
    return response.status(500).json({ error: 'Feed configuration is invalid' });
  }
}
