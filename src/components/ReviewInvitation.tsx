import { useEffect, useRef, useState } from 'react';
import { Review } from '@apps-in-toss/web-framework';
import { isTossBuild } from '../utils/toss';

const VISITED_KEY = 'onnuri-review-visited-v1';
const SHOWN_KEY = 'onnuri-review-invitation-shown-v1';

export function ReviewInvitation() {
  const [visible, setVisible] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !isTossBuild) return;
    initialized.current = true;
    try {
      const visited = localStorage.getItem(VISITED_KEY) === '1';
      localStorage.setItem(VISITED_KEY, '1');
      if (visited && localStorage.getItem(SHOWN_KEY) !== '1' && Review.request.isSupported()) {
        localStorage.setItem(SHOWN_KEY, '1');
        setVisible(true);
      }
    } catch {
      // If the visit cannot be saved, do not repeatedly prompt the user.
    }
  }, []);

  if (!visible) return null;

  return (
    <aside aria-label="리뷰 안내" className="mx-auto mt-5 max-w-3xl px-5 sm:px-6">
      <div className="rounded-2xl bg-onnuri-cream px-4 py-3">
        <p className="text-sm font-semibold leading-relaxed text-onnuri-ink">재방문하셨네요! 리뷰와 평점은 큰 힘이 됩니다!</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          <button type="button" onClick={() => {
            setVisible(false);
            try { void Review.request().catch(() => {}); } catch { /* Review is optional. */ }
          }} className="min-h-11 text-sm font-semibold text-onnuri-greenDark">리뷰 남기기</button>
          <button type="button" onClick={() => setVisible(false)} className="min-h-11 text-sm font-medium text-onnuri-soft">닫기</button>
        </div>
      </div>
    </aside>
  );
}
