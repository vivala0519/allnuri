import { Device, Share, User } from '@apps-in-toss/web-framework';

export const isTossBuild = import.meta.env.MODE === 'toss';
export const tossAppName = 'allnuri';
let identityRequest: Promise<void> | undefined;

export function initializeTossIdentity(): Promise<void> {
  if (!isTossBuild) return Promise.resolve();
  return identityRequest ??= (async () => {
    if (!User.getAnonymousKey.isSupported()) throw new Error('토스 앱을 최신 버전으로 업데이트해 주세요.');
    const result = await User.getAnonymousKey();
    if (result.type !== 'HASH' || !result.hash) throw new Error('사용자 정보를 확인하지 못했어요. 앱을 다시 열어 주세요.');
    localStorage.setItem('onnuri-toss-user-key', result.hash);
  })();
}

export async function shareTossSearch(query: string): Promise<void> {
  const link = await Share.createLink({ path: `intoss://${tossAppName}?q=${encodeURIComponent(query)}` });
  await Share.sendMessage({ message: link });
}

export async function openTossExternalLink(url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('보안 연결을 지원하는 상품 주소만 열 수 있어요.');
  await Device.openURL(parsed.toString());
}
