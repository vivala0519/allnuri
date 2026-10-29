import { afterEach, describe, expect, it, vi } from 'vitest';
import { ONNURI_MALLS } from '../data/malls';
import { executeProgressiveSearch } from '../services/productAdapter';

const ids = ONNURI_MALLS.slice(0, 8).map((mall) => mall.id);
const responseFor = (url: string) => {
  const malls = new URL(url).searchParams.get('malls')!.split(',');
  return { ok: true, json: async () => ({ items: [], sources: malls.map((mallId) => ({ mallId, status: 'connected', count: 0 })) }) };
};
afterEach(() => vi.unstubAllGlobals());

describe('순차 검색', () => {
  it('늦은 묶음을 기다리지 않고 먼저 도착한 결과를 전달한다', async () => {
    const waiting: Array<() => void> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => new Promise((resolve) => waiting.push(() => resolve(responseFor(url))))));
    const progress = vi.fn();
    const search = executeProgressiveSearch('순차검증고유어', [], undefined, ids, progress);
    expect(waiting).toHaveLength(2);
    waiting[0]();
    await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(1));
    expect(progress.mock.calls[0][1]).toBe(1);
    waiting[1]();
    const result = await search;
    expect(result.adapterResponses).toHaveLength(8);
    expect(progress).toHaveBeenCalledTimes(2);
  });

  it('동일 검색을 동시에 실행하거나 곧 다시 실행해도 요청을 공유한다', async () => {
    let release: (() => void) | undefined;
    const fetchMock = vi.fn((url: string) => new Promise((resolve) => { release = () => resolve(responseFor(url)); }));
    vi.stubGlobal('fetch', fetchMock);
    const first = executeProgressiveSearch('중복검증고유어', [], undefined, ids.slice(0, 4));
    const second = executeProgressiveSearch('중복검증고유어', [], undefined, ids.slice(0, 4));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release!();
    await Promise.all([first, second]);
    await executeProgressiveSearch('중복검증고유어', [], undefined, ids.slice(0, 4));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('모든 요청이 연결 실패하면 빈 결과가 아닌 오류를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(executeProgressiveSearch('연결실패검증고유어', [], undefined, ids)).rejects.toThrow('쇼핑몰 검색에 연결하지 못했어요.');
  });
});
