import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { isTossBuild } from '../utils/toss';

const AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID?.trim() || 'ait-ad-test-interstitial-id';

export function useInterstitialAd() {
  const [supported, setSupported] = useState(false);
  const trigger = useRef<() => void>(() => {});

  useEffect(() => {
    if (!isTossBuild || !loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) return;
    setSupported(true);
    let disposed = false;
    let phase: 'idle' | 'loading' | 'ready' | 'showing' = 'idle';
    let releaseLoad = () => {};
    let releaseShow = () => {};

    const preload = () => {
      if (disposed || phase !== 'idle') return;
      phase = 'loading';
      releaseLoad();
      try {
        releaseLoad = loadFullScreenAd({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => { if (!disposed && event.type === 'loaded') phase = 'ready'; },
          onError: () => { if (!disposed) phase = 'idle'; },
        });
      } catch {
        phase = 'idle';
      }
    };

    trigger.current = () => {
      if (disposed) return;
      if (phase === 'idle') preload();
      if (phase !== 'ready') return;
      phase = 'showing';
      releaseShow();
      const finish = () => {
        if (disposed || phase !== 'showing') return;
        phase = 'idle';
        preload();
      };
      try {
        releaseShow = showFullScreenAd({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => {
            if (event.type === 'dismissed' || event.type === 'failedToShow') finish();
          },
          onError: finish,
        });
      } catch {
        finish();
      }
    };
    preload();
    return () => {
      disposed = true;
      trigger.current = () => {};
      releaseLoad();
      releaseShow();
    };
  }, []);

  const onSearch = useCallback(() => trigger.current(), []);
  return { supported, onSearch };
}
