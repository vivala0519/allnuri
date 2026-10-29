import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnifiedProductComparisonSection } from '../components/UnifiedProductComparisonSection';
import type { AdapterSearchResponse } from '../types/onnuri';

const source = (mallId: string, status: AdapterSearchResponse['status']): AdapterSearchResponse => ({
  mallId, mallName: mallId, status, message: '', products: [], directSearchUrl: '', fetchedAt: '2026-10-29T03:00:00Z',
});

const setup = (overrides: Partial<React.ComponentProps<typeof UnifiedProductComparisonSection>> = {}) => {
  const props = {
    query: '사과', malls: [], products: [], adapterResponses: [], isLoading: false, error: null,
    searchFavoritesOnly: false, favoriteCount: 0, onRetry: vi.fn(), onRetryFailed: vi.fn(),
    onSearchAll: vi.fn(), onGoToFavorites: vi.fn(), customProducts: [], onUpdateCustomProducts: vi.fn(),
    customProxyUrl: '', onUpdateCustomProxyUrl: vi.fn(), ...overrides,
  };
  render(<UnifiedProductComparisonSection {...props} />);
  return props;
};

afterEach(cleanup);
describe('검색 상태 안내', () => {
  it('서버 오류를 빈 결과가 아닌 오류로 표시하고 재시도한다', () => {
    const props = setup({ error: 'network' });
    expect(screen.getByText('쇼핑몰 검색에 연결하지 못했어요')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });
  it('일부 실패와 조회 성공 후 빈 결과를 구분한다', () => {
    const props = setup({ adapterResponses: [source('몰 A', 'connected'), source('몰 B', 'error')] });
    expect(screen.getByText(/조회 완료 1곳 · 조회 실패 1곳/)).toBeTruthy();
    expect(screen.getByText(/조회에 성공한 쇼핑몰에서 상품을 찾지 못했어요/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '실패한 쇼핑몰 다시 시도' }));
    expect(props.onRetryFailed).toHaveBeenCalledOnce();
  });
  it('즐겨찾기가 비어 있으면 등록 또는 전체 검색을 선택한다', () => {
    const props = setup({ searchFavoritesOnly: true, favoriteCount: 0 });
    expect(screen.getByText('즐겨찾기한 쇼핑몰이 없어요')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '전체 쇼핑몰에서 검색' }));
    expect(props.onSearchAll).toHaveBeenCalledOnce();
  });
  it('연결된 몰이 없는 경우 결과가 없다고 단정하지 않는다', () => {
    setup({ searchFavoritesOnly: true, favoriteCount: 1, adapterResponses: [source('몰 C', 'link_only')] });
    expect(screen.getByText('검색 가능한 쇼핑몰이 없어요')).toBeTruthy();
  });
});
