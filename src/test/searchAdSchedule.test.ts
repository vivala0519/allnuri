import { describe, expect, it } from 'vitest';
import { nextSearchAdSchedule } from '../utils/searchAdSchedule';

describe('검색 광고 노출 순서', () => {
  it('첫 검색 이후 다섯 번의 새 검색마다 광고 대상이 된다', () => {
    let schedule = { lastQuery: '', searchCount: 0 };
    const shown: number[] = [];
    for (let index = 1; index <= 11; index++) {
      const next = nextSearchAdSchedule(schedule, `상품 ${index}`);
      if (next.showAd) shown.push(index);
      schedule = next.schedule;
    }
    expect(shown).toEqual([1, 6, 11]);
  });

  it('직전 검색어와 공백·대소문자만 다른 검색어는 횟수에서 제외한다', () => {
    const first = nextSearchAdSchedule({ lastQuery: '', searchCount: 0 }, 'Apple  주스');
    const duplicate = nextSearchAdSchedule(first.schedule, ' apple 주스 ');
    expect(duplicate.showAd).toBe(false);
    expect(duplicate.schedule).toEqual(first.schedule);
    expect(nextSearchAdSchedule(duplicate.schedule, '   ').schedule).toEqual(first.schedule);
  });

  it('확인 전 계산만 하고 취소하면 다음 검색도 최초 검색이다', () => {
    const schedule = { lastQuery: '', searchCount: 0 };
    expect(nextSearchAdSchedule(schedule, '사과').showAd).toBe(true);
    expect(nextSearchAdSchedule(schedule, '배').showAd).toBe(true);
  });
});
