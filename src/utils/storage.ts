const FAVORITES_STORAGE_KEY = 'onnuri-fav-v1';
const RECENT_QUERIES_STORAGE_KEY = 'onnuri-recent-queries-v1';
const MAX_RECENT_QUERIES = 8;

/**
 * 기존 onnuri_unified_search_demo.html과 동일한 localStorage 키('onnuri-fav-v1')를 사용하여
 * 기존 즐겨찾기 데이터(쇼핑몰 이름 배열)와 100% 호환됩니다.
 */
export function loadFavoriteMalls(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

export function saveFavoriteMalls(favorites: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // localStorage 접근 제한 환경 무시
  }
}

export function loadRecentQueries(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_QUERIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, MAX_RECENT_QUERIES);
    }
    return [];
  } catch {
    return [];
  }
}

export function addRecentQuery(query: string, current: string[]): string[] {
  const trimmed = query.trim();
  if (!trimmed) return current;
  const next = [trimmed, ...current.filter((q) => q !== trimmed)].slice(0, MAX_RECENT_QUERIES);
  try {
    localStorage.setItem(RECENT_QUERIES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function removeRecentQuery(query: string, current: string[]): string[] {
  const next = current.filter((q) => q !== query);
  try {
    localStorage.setItem(RECENT_QUERIES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearRecentQueries(): string[] {
  try {
    localStorage.removeItem(RECENT_QUERIES_STORAGE_KEY);
  } catch {
    // ignore
  }
  return [];
}
