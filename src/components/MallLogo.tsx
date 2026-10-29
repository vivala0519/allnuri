import { useState } from 'react';
import { MALL_LOGOS } from '../data/mallLogos';
import type { OnnuriMall } from '../types/onnuri';

export function MallLogo({ mall, size = 'normal' }: { mall: OnnuriMall; size?: 'normal' | 'small' }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = MALL_LOGOS[mall.id];
  const showImage = Boolean(url && failedUrl !== url);
  return (
    <span aria-hidden="true"
      style={{ backgroundColor: showImage ? '#fff' : mall.color }}
      className={`${size === 'small' ? 'w-8 h-8 rounded-lg text-xs' : 'w-12 h-12 rounded-[15px] text-[15px]'} grid place-items-center shrink-0 overflow-hidden border border-onnuri-line text-white font-bold`}>
      {showImage ? <img src={url} alt="" loading="lazy"
        className="w-full h-full object-contain p-1" onError={() => setFailedUrl(url)} /> : mall.code}
    </span>
  );
}
