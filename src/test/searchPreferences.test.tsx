import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroSearchSection } from '../components/HeroSearchSection';
import { loadSearchFavoritesOnly, loadSearchSort, loadSearchView, saveSearchPreference } from '../utils/storage';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('검색 환경 설정', () => {
  it('보기, 정렬, 즐겨찾기 검색 설정을 저장하고 복원한다', () => {
    saveSearchPreference('view', '3');
    saveSearchPreference('sort', 'price_asc');
    saveSearchPreference('favorites', 'true');
    expect(loadSearchView()).toBe(3);
    expect(loadSearchSort()).toBe('price_asc');
    expect(loadSearchFavoritesOnly()).toBe(true);
  });
  it('잘못된 저장값을 기본값으로 복원한다', () => {
    saveSearchPreference('view', '99');
    saveSearchPreference('sort', 'invalid');
    expect(loadSearchView()).toBe(1);
    expect(loadSearchSort()).toBe('relevance');
  });
  it('최근 검색어 선택과 개별 삭제를 구분한다', () => {
    const submit = vi.fn();
    const remove = vi.fn();
    render(<HeroSearchSection showAdNotice={false} searchFavoritesOnly={false} onSearchFavoritesOnlyChange={vi.fn()} favoriteCount={0} onGoToFavorites={vi.fn()} query="" onQueryChange={vi.fn()} onSubmitSearch={submit} recentQueries={['사과']} onRemoveRecentQuery={remove} onClearRecentQueries={vi.fn()} onShareSearchUrl={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '사과' }));
    expect(submit).toHaveBeenCalledWith('사과');
    fireEvent.click(screen.getByRole('button', { name: '사과 최근 검색어 삭제' }));
    expect(remove).toHaveBeenCalledWith('사과');
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
