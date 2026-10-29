import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { OnnuriMall } from '../types/onnuri';
import { MallLogo } from './MallLogo';
import { getMallOfficialEntryUrl } from '../utils/searchUrlBuilder';

interface MallCardProps {
  mall: OnnuriMall;
  keyword: string;
  isFavorite: boolean;
  onToggleFavorite: (mallName: string) => void;
}

export const MallCard: React.FC<MallCardProps> = ({ mall, isFavorite, onToggleFavorite }) => {
  const officialEntry = getMallOfficialEntryUrl(mall);

  return (
    <article className="mall-card flex flex-col rounded-[24px] border border-onnuri-line bg-white p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(25,31,40,0.05)]">
      <div className="flex items-start gap-3">
        <MallLogo mall={mall} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-onnuri-ink break-words">
            {mall.name}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-onnuri-soft">{mall.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(mall.name)}
          aria-label={`${mall.name} 즐겨찾기 ${isFavorite ? '해제' : '추가'}`}
          aria-pressed={isFavorite}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
            isFavorite ? 'bg-rose-50 text-[#d84d3f]' : 'text-[#8e7d72] hover:bg-onnuri-cream hover:text-[#d84d3f]'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3">
        <span className="inline-flex rounded-lg bg-onnuri-cream px-2.5 py-1 text-xs font-medium text-onnuri-soft">
          {mall.mallType === '전용몰' ? '온누리 전용·중심몰' : mall.mallType === '전용관' ? '종합몰 내 전용관' : '추가 확인 필요'}
        </span>
      </div>

      {officialEntry && (
        <div className="mt-auto pt-4">
          <a
            href={officialEntry.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${mall.name} ${officialEntry.label} 열기`}
            className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-onnuri-cream px-4 text-sm font-semibold text-onnuri-ink transition-colors hover:bg-onnuri-mint"
          >
            <span>{officialEntry.label}</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
};
