import { afterEach, expect, it, vi } from 'vitest';
import handler from '../../api/onnuri/products.js';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function response() {
  return { statusCode: 200, headers: {}, body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; } };
}

it('배포 API도 공개몰 검색을 실행하고 개별 실패를 응답한다', async () => {
  vi.stubEnv('ONNURI_FEEDS_JSON', '');
  const fetchMock = vi.fn().mockRejectedValue(new Error('upstream unavailable'));
  vi.stubGlobal('fetch', fetchMock);
  const res = response();
  await handler({ method: 'GET', url: '/api/onnuri/products?q=vercel-smoke' }, res);
  const body = JSON.parse(res.body);
  expect(res.statusCode).toBe(200);
  expect(body.sources.length).toBe(20);
  expect(body.sources.every((source) => source.status === 'error')).toBe(true);
  expect(fetchMock).toHaveBeenCalled();
  expect(res.headers['Content-Type']).toContain('application/json');
});

it.each([
  ['POST', '/api/onnuri/products?q=쌀', 405],
  ['GET', '/api/onnuri/products?q=', 400],
])('잘못된 배포 API 요청을 거절한다: %s %s', async (method, url, status) => {
  const res = response();
  await handler({ method, url }, res);
  expect(res.statusCode).toBe(status);
  expect(JSON.parse(res.body).error).toBeTruthy();
});
