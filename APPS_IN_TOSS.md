# 앱인토스 적용 및 출시 전 확인

앱 ID는 `allnuri`, SDK는 3.9.0입니다. 콘솔의 앱 ID도 동일해야 합니다.

## 빌드

```sh
npm ci
npm test
npm run build:toss
```

루트의 `allnuri.ait`를 앱인토스 콘솔에 업로드합니다. `npm run build`는 기존 Vercel 웹 배포용입니다. `dist`는 마지막에 빌드한 대상의 결과이므로 두 빌드 결과를 혼용하지 않습니다.

## 적용한 흐름

- 미니앱 내부에서 상품명 검색, 가격·규격 비교를 제공합니다. 구매 버튼은 타사 쇼핑몰의 상품 정보로 이동하며, 미니앱 자체에 주문·결제 기능을 제공하지 않습니다.
- 앱인토스 빌드는 기본 내비게이션을 사용하고, 웹의 자체 브랜드 헤더를 감춥니다.
- 시작 시 사용자 식별키를 한 번 요청해 로컬에 저장합니다. 식별키를 검색 서버로 전송하지 않습니다. 최근 검색과 즐겨찾기는 기존 로컬 저장을 사용하며 기기 간 동기화를 제공하지 않습니다.
- 공유는 `intoss://allnuri` 경로를 토스 공유 링크로 변환합니다. 테스트용 private 스킴이나 Vercel 주소를 공유하지 않습니다.
- 외부 HTTPS 링크는 SDK `Device.openURL`로 엽니다. 실패 시 앱 안에서 안내합니다.
- 라이트 테마, 확대 제한, 하단 안전 영역을 적용합니다. 사용자가 서버 주소나 상품 JSON을 입력하는 연동 설정은 미니앱에서 숨깁니다.

## API 배포

미니앱은 `https://allnuri.vercel.app/api/onnuri/products`를 호출합니다. 기존 `.env.local`에 상대 API 경로가 있어도 앱인토스 빌드에서는 HTTPS 서버 주소로 전환합니다. `VITE_ONNURI_API_PROXY_URL`로 다른 서버를 설정하려면 HTTPS 절대 주소를 사용합니다.

이번 API 변경을 Vercel에 재배포해야 합니다. 허용 CORS 출처는 SDK 3.1 이상 기준으로 아래 두 개입니다.

- `https://allnuri.apps.tossmini.com`
- `https://allnuri.private-apps.tossmini.com`

## 실제 기기에서 남은 확인

콘솔 등록·검수 제출·출시는 이 변경에 포함되지 않습니다. 토스 앱 QR 테스트에서 아래 항목을 확인해야 합니다.

- 토스 기본 뒤로가기·닫기·홈·더보기 기능과 최초 화면에서 뒤로가기 시 종료
- 실제 사용자 식별키 발급, 재진입 후 최근 검색·즐겨찾기 유지
- 검색 API CORS와 20개 몰 응답, 스크롤·상품 이미지·외부 상품 페이지 이동
- 검색어를 포함한 공유 링크로 앱 진입
- 등록 앱 이름·로고·앱 내 기능 설명과 실제 화면의 일치

앱 내 기능 설명은 '상품 검색 및 가격 비교' 범위로 작성합니다. 온누리 결제 완료나 모든 상품의 결제 가능 여부를 보장하는 표현은 사용하지 않습니다. 공개몰 데이터 수집과 이미지 사용 권한은 별도로 확인해야 합니다.

운영 정책은 '각 제품을 소개·추천한 뒤 최저가 구매 플랫폼으로 이동'하는 경우를 외부 이동의 허용 가능 사례로 안내합니다. 이 앱이 해당하는지의 최종 판단은 검수에서 이루어집니다. 검색과 가격 비교가 앱 내부에서 완료된다는 점, 상품 링크가 타사 상품 확인 목적이라는 점을 제출 설명에 포함합니다.

근거: [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame), [서비스 오픈 정책 2-2](https://developers-apps-in-toss.toss.im/intro/guide), [SDK 3.x](https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x).
# 전면형 광고

공식 API 문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/interstitial-rewarded-ad

- `src/hooks/useInterstitialAd.ts`에서 광고를 미리 로드합니다. 앱 진입 후 최초 검색과 이후 다섯 번째 새로운 검색마다(1·6·11번째) 준비된 광고가 있으면 확인창을 엽니다. 직전과 같은 검색어 및 재시도는 횟수에서 제외합니다. 사용자가 확인하면 광고를 표시하고, 닫히거나 표시 실패하면 검색을 진행하며, 취소하면 검색하지 않고 횟수도 늘지 않습니다. 광고가 준비되지 않은 검색은 광고 없이 진행합니다.
- 첫 진입, 자동 재검색, 즐겨찾기 변경에는 광고를 표시하지 않습니다. 광고 실패나 미지원 환경에서도 상품 검색은 진행됩니다.
- 기본 ID는 공식 전면형 테스트 ID입니다. 개발·QR 테스트에는 실제 운영 ID를 사용하지 마세요.
- 운영 배포 시 앱인토스 콘솔에서 전면형 광고 그룹을 생성한 후 빌드 환경의 `VITE_INTERSTITIAL_AD_GROUP_ID`를 해당 ID로 설정하고 다시 빌드하세요. 보상형 ID를 넣으면 보상형 광고가 표시되므로 반드시 전면형 그룹을 사용하세요.
- 실제 광고 렌더링·닫기·복귀 동작은 콘솔의 테스트 QR로 토스 앱에서 확인해야 합니다.

# 분석 이벤트와 전환 지표

토스 앱에서만 `Analytics.log`로 다음 이벤트를 기록합니다. 검색어, 상품명, URL과 사용자 입력 원문은 기록하지 않습니다. 전송 실패는 검색이나 이동을 막지 않습니다.

| 이벤트 | 의미 | 주요 파라미터 |
| --- | --- | --- |
| `search_submitted` | 사용자가 검색을 확정 | `search_scope` |
| `search_completed` | 검색 응답 수신 | `search_scope`, `result_count`, `successful_malls`, `failed_malls` |
| `search_failed` | 연결 오류 또는 일부·전체 몰 실패 | `failure_type`, `failed_malls` |
| `search_retried` | 사용자 재시도 | `retry_scope`, `mall_count` |
| `product_outbound_click` | 검색 결과에서 상품 링크 선택 | `mall_id` |
| `favorite_added`, `favorite_removed` | 쇼핑몰 즐겨찾기 변경 | `mall_id` |

대표 전환 지표 후보: `product_outbound_click` (이벤트 로그, 상품 페이지 이동 선택). 이것은 외부 쇼핑몰 결제 완료를 의미하지 않습니다. 보조 전환 후보는 `search_submitted`와 `favorite_added`입니다.

실제 출시된 앱에서 이벤트가 수집된 후 앱인토스 콘솔 > 올누리 > 핵심 지표에서 이벤트 로그로 등록하세요. 새 커스텀 이벤트는 먼저 수집되어야 지표로 의미가 있습니다. 이벤트 로그는 콘솔 > 분석 > 이벤트에서 확인하며, QR·샌드박스 데이터는 실제 분석에 수집되지 않고 출시 다음 날부터 집계됩니다. 기존 지표가 있다면 대표 지표 변경 전 현재 설정을 확인하세요.

공식 문서: https://developers-apps-in-toss.toss.im/guide/analytics/logging , https://developers-apps-in-toss.toss.im/guide/analytics/conversion-metrics

