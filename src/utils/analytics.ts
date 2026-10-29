import { Analytics } from '@apps-in-toss/web-framework';
import { isTossBuild } from './toss';

type AnalyticsValue = string | number | boolean;
type EventName = 'search_submitted' | 'search_completed' | 'search_failed' | 'search_retried' | 'product_outbound_click' | 'favorite_added' | 'favorite_removed';

export function trackEvent(name: EventName, params: Record<string, AnalyticsValue> = {}): void {
  if (!isTossBuild) return;
  try {
    void Analytics.log({ log_name: name, log_type: 'event', params }).catch(() => {});
  } catch {
    // Analytics must never interrupt the user's action.
  }
}
