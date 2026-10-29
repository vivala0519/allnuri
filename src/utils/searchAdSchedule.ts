export interface SearchAdSchedule {
  lastQuery: string;
  searchCount: number;
}

export function normalizeAdSearchQuery(query: string): string {
  return query.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}

export function nextSearchAdSchedule(schedule: SearchAdSchedule, query: string): { schedule: SearchAdSchedule; showAd: boolean } {
  const normalized = normalizeAdSearchQuery(query);
  if (!normalized || normalized === schedule.lastQuery) return { schedule, showAd: false };
  const searchCount = schedule.searchCount + 1;
  return {
    schedule: { lastQuery: normalized, searchCount },
    showAd: searchCount === 1 || (searchCount - 1) % 5 === 0,
  };
}
