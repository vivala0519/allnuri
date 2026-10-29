import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ log: vi.fn(), toss: true }));
vi.mock('@apps-in-toss/web-framework', () => ({ Analytics: { log: mocks.log } }));
vi.mock('../utils/toss', () => ({ get isTossBuild() { return mocks.toss; } }));
import { trackEvent } from '../utils/analytics';

describe('앱인토스 분석 이벤트', () => {
  beforeEach(() => { mocks.log.mockReset().mockResolvedValue(undefined); mocks.toss = true; });

  it('상품 이동 클릭을 쇼핑몰 ID와 함께 이벤트로 기록한다', () => {
    trackEvent('product_outbound_click', { mall_id: 'onnuri-goodday' });
    expect(mocks.log).toHaveBeenCalledWith({ log_name: 'product_outbound_click', log_type: 'event', params: { mall_id: 'onnuri-goodday' } });
  });

  it('웹 브라우저에서는 SDK 이벤트를 호출하지 않는다', () => {
    mocks.toss = false;
    trackEvent('search_submitted', { search_scope: 'all' });
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it('SDK가 실패해도 사용자 동작을 방해하지 않는다', () => {
    mocks.log.mockImplementation(() => { throw new Error('unavailable'); });
    expect(() => trackEvent('favorite_added', { mall_id: 'mall' })).not.toThrow();
  });
});
