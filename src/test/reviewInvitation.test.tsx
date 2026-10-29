import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => {
  const request = Object.assign(vi.fn().mockResolvedValue(undefined), { isSupported: vi.fn(() => true) });
  return { request };
});
vi.mock('@apps-in-toss/web-framework', () => ({ Review: { request: mock.request } }));
vi.mock('../utils/toss', () => ({ isTossBuild: true }));
import { ReviewInvitation } from '../components/ReviewInvitation';

beforeEach(() => { localStorage.clear(); mock.request.mockClear(); mock.request.isSupported.mockReturnValue(true); });
afterEach(cleanup);

describe('재방문 리뷰 안내', () => {
  it('첫 방문에는 표시하지 않고 재방문에 한 번 표시한다', () => {
    const first = render(<React.StrictMode><ReviewInvitation /></React.StrictMode>);
    expect(screen.queryByText(/재방문하셨네요/)).toBeNull();
    first.unmount();
    const second = render(<React.StrictMode><ReviewInvitation /></React.StrictMode>);
    expect(screen.getByText('재방문하셨네요! 리뷰와 평점은 큰 힘이 됩니다!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '리뷰 남기기' }));
    expect(mock.request).toHaveBeenCalledTimes(1);
    second.unmount();
    render(<ReviewInvitation />);
    expect(screen.queryByText(/재방문하셨네요/)).toBeNull();
  });
  it('리뷰 미지원 기기에서는 표시하지 않는다', () => {
    localStorage.setItem('onnuri-review-visited-v1', '1');
    mock.request.isSupported.mockReturnValue(false);
    render(<ReviewInvitation />);
    expect(screen.queryByText(/재방문하셨네요/)).toBeNull();
    expect(localStorage.getItem('onnuri-review-invitation-shown-v1')).toBeNull();
  });
});
