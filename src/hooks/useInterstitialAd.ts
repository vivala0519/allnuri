import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { isTossBuild } from '../utils/toss';

const AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID?.trim() || 'ait-ad-test-interstitial-id';

export function useInterstitialAd() {
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);
  const trigger = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!isTossBuild || !loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) return;
    setSupported(true);
    let disposed = false;
    let phase: 'idle' | 'loading' | 'ready' | 'showing' = 'idle';
    let releaseLoad = () => {};
    let releaseShow = () => {};
    let complete: (() => void) | undefined;

    const preload = () => {
      if (disposed || phase !== 'idle') return;
      phase = 'loading';
      releaseLoad();
      try {
        releaseLoad = loadFullScreenAd({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => { if (!disposed && event.type === 'loaded') { phase = 'ready'; setReady(true); } },
          onError: () => { if (!disposed) phase = 'idle'; },
        });
      } catch {
        phase = 'idle';
      }
    };

    trigger.current = async () => {
      if (disposed) return;
      if (phase === 'idle') preload();
      if (phase !== 'ready') return;
      phase = 'showing';
      setReady(false);
      releaseShow();
      return new Promise<void>((resolve) => {
      complete = resolve;
      const finish = () => {
        if (disposed || phase !== 'showing') return;
        phase = 'idle';
        complete?.();
        complete = undefined;
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
      });
    };
    preload();
    return () => {
      disposed = true;
      trigger.current = async () => {};
      complete?.();
      releaseLoad();
      releaseShow();
    };
  }, []);

  const onSearch = useCallback(() => trigger.current(), []);
  return { supported, ready, onSearch };
}
