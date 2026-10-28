// 공개 검색 결과에는 추천 상품이 섞일 수 있어 상품명에서 각 검색어를 확인한다.
export function matchesSearchQuery(title, query) {
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('ko').replace(/[^\p{L}\p{N}]/gu, '');
  const tokens = query.trim().split(/\s+/u).map(normalize).filter(Boolean);
  const normalizedTitle = normalize(title);
  return tokens.length > 0 && tokens.every((token) => normalizedTitle.includes(token));
}
