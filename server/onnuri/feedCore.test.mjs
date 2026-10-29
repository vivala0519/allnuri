import { describe, expect, it } from 'vitest';
import { readFeedConfig, searchPartnerFeeds } from './feedCore.mjs';

describe('partner feed search', () => {
  it('returns only explicitly eligible matching products', async () => {
    const feeds = readFeedConfig(JSON.stringify([
      { mallId: 'onnuri-goodday', name: '온누리굿데이', url: 'https://partner.example/goodday.json' },
    ]));
    const fetchImpl = async () => ({ ok: true, json: async () => ({ items: [
      { id: '1', title: '햅쌀 10kg', price: 30000, productUrl: 'https://partner.example/1', onnuriEligible: true },
      { id: '2', title: '햅쌀 10kg', price: 20000, productUrl: 'https://partner.example/2', onnuriEligible: false },
      { id: '3', title: '사과 5kg', price: 10000, productUrl: 'https://partner.example/3', onnuriEligible: true },
    ] }) });
    const result = await searchPartnerFeeds('쌀 10kg', feeds, fetchImpl);
    expect(result.items.map((item) => item.id)).toEqual(['onnuri-goodday:1']);
    expect(result.sources).toEqual([{ mallId: 'onnuri-goodday', status: 'connected', count: 1 }]);
  });

  it('keeps a working mall when another feed fails', async () => {
    const feeds = readFeedConfig(JSON.stringify([
      { mallId: 'a', url: 'https://partner.example/a.json' },
      { mallId: 'b', url: 'https://partner.example/b.json' },
    ]));
    const fetchImpl = async (url) => {
      if (url.endsWith('/b.json')) throw new Error('unavailable');
      return { ok: true, json: async () => ({ items: [
        { id: '1', title: '사과', price: 1000, productUrl: 'https://partner.example/1', onnuriEligible: true },
      ] }) };
    };
    const result = await searchPartnerFeeds('사과', feeds, fetchImpl);
    expect(result.items).toHaveLength(1);
    expect(result.sources[1].status).toBe('error');
  });
});
