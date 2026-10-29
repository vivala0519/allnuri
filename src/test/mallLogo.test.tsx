import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MallLogo } from '../components/MallLogo';
import { ONNURI_MALLS } from '../data/malls';

describe('쇼핑몰 공식 아이콘', () => {
  it('공식 이미지가 실패하면 쇼핑몰의 기존 표시로 대체한다', () => {
    const mall = ONNURI_MALLS.find((item) => item.id === 'onnuri-goodday')!;
    const { container } = render(<MallLogo mall={mall} />);
    const image = container.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('/mall-logos/onnuri-goodday-screenshot.png');
    fireEvent.error(image);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(mall.code)).toBeTruthy();
  });

  it('이미지가 없는 몰은 기존 표시를 사용한다', () => {
    const mall = { ...ONNURI_MALLS[0], id: 'unknown-mall' };
    const { container } = render(<MallLogo mall={mall} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(mall.code)).toBeTruthy();
  });
});
