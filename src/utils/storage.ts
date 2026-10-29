const FAVORITES_STORAGE_KEY = 'onnuri-fav-v1';
const RECENT_QUERIES_STORAGE_KEY = 'onnuri-recent-queries-v1';
const MAX_RECENT_QUERIES = 8;
const SEARCH_VIEW_KEY = 'onnuri-search-view-v1';
const SEARCH_SORT_KEY = 'onnuri-search-sort-v1';
const SEARCH_FAVORITES_KEY = 'onnuri-search-favorites-v1';

export function loadSearchView(): 1 | 2 | 3 {
  try {
    const value = localStorage.getItem(SEARCH_VIEW_KEY);
    return value === '2' ? 2 : value === '3' ? 3 : 1;
  } catch { return 1; }
}

export function loadSearchSort(): 'relevance' | 'price_asc' | 'price_desc' {
  try {
    const value = localStorage.getItem(SEARCH_SORT_KEY);
    return value === 'price_asc' || value === 'price_desc' ? value : 'relevance';
  } catch { return 'relevance'; }
}

export function loadSearchFavoritesOnly(): boolean {
  try { return localStorage.getItem(SEARCH_FAVORITES_KEY) === 'true'; } catch { return false; }
}

export function saveSearchPreference(key: 'view' | 'sort' | 'favorites', value: string): void {
  const keys = { view: SEARCH_VIEW_KEY, sort: SEARCH_SORT_KEY, favorites: SEARCH_FAVORITES_KEY };
  try { localStorage.setItem(keys[key], value); } catch { /* Storage is optional. */ }
}

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
