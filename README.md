# 온누리 찾기 (Allnuri Finder) — 디지털 온누리상품권 온라인몰 통합 검색 플랫폼

> **개인용 시범 구현 (2026-10-28):** 로컬 API 서버가 20개 몰의 공개 검색·온누리 기획전 상품을 모읍니다. 일부 쇼핑몰 상품은 결제 가능 여부와 판매 상태를 확인해야 합니다. 나머지 쇼핑몰은 검색 바로가기입니다. 공개 페이지 구조나 접근 정책이 바뀌면 수집이 실패할 수 있습니다.

## 개인용 통합 검색 실행

Node.js 20 이상과 의존성 설치가 필요합니다. `npm install` 후 `npm run dev` 한 번만 실행하고 `http://localhost:5173`을 엽니다. npm 명령을 쓸 수 없는 환경에서는 `node node_modules/vite/bin/vite.js`로 실행할 수 있습니다. Vite 개발 서버와 프리뷰 서버가 검색 API를 함께 제공합니다. 검색창에 상품명을 입력하면 20개 몰의 상품을 함께 보여줍니다. 상품별 결제 가능 여부와 판매 상태가 미확인인 결과는 카드에 별도로 안내합니다. 상품가와 배송 정보는 결제 전에 원본 몰에서 다시 확인하세요. 배송비 미확인은 무료배송을 뜻하지 않습니다.

검색 API는 로컬 Vite 서버와 Vercel에서 `/api/onnuri/products` 경로로 동작하며 동일한 공개몰 검색 코드를 사용합니다. 몰별 요청은 검색어당 5분 동안 캐시하며, 대부분 첫 페이지만 수집합니다. 롯데ON은 온누리상생스토어에 노출된 상품 목록에서 검색하므로 전체 상품은 포함하지 않습니다. 몰 측에서 요청을 차단하거나 HTML 구조가 바뀌면 해당 몰 상태를 오류로 표시합니다. 접근 제한을 우회하지 않습니다. Netlify 함수는 제휴 JSON 피드 방식입니다. Vercel 설정과 배포 확인 절차는 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)를 참고하세요.

## 시범 연동 설정

협의된 쇼핑몰의 JSON 피드 URL을 서버 환경변수 `ONNURI_FEEDS_JSON`에 설정합니다. 배열은 최대 3곳이며 `mallId`는 `src/data/malls.ts`의 ID와 일치해야 합니다. 각 피드 항목에는 `id`, `title`, `price`, `productUrl`, `onnuriEligible: true`가 필요합니다. 결제 가능 여부가 명시되지 않은 상품은 검색 결과에서 제외됩니다. 선택 필드: `shippingFee`, `imageUrl`, `updatedAt`. 비공개 피드는 설정 항목의 `token`으로 Bearer 인증할 수 있습니다.

```json
[{"mallId":"onnuri-goodday","name":"온누리굿데이","url":"https://partner.example/products.json"}]
```

협의된 JSON 피드가 생기면 로컬에서는 `.env.example`을 `.env.local`로 복사해 `ONNURI_FEEDS_JSON`을 설정하고 `npm run dev`를 실행합니다. Vercel 또는 Netlify 배포에서는 `ONNURI_FEEDS_JSON`을 서버 환경변수로 설정합니다. 실제 피드가 제공되기 전에는 예시 URL을 설정하지 마세요.

디지털 온누리상품권(카드형·모바일 통합 앱)을 사용할 수 있는 **24개 온라인 쇼핑몰 및 종합몰 내 전용관**을 한곳에서 검색하고, 쇼핑몰별 상품 검색 결과 연결 및 연동 데이터의 가격·규격 비교를 제공하는 웹 애플리케이션입니다.

기존 단일 파일 시제품(`onnuri_unified_search_demo.html`)의 브랜드 컬러(`#18795f`)와 카드형 UI, 기존 기능(24개 쇼핑몰 목록, 즐겨찾기 `localStorage` 호환 등)을 100% 보존하면서 **React + TypeScript + Vite + Tailwind CSS** 기반의 실제 운영·배포 가능한 아키텍처로 발전시켰습니다.

---

## 1. 프로젝트 폴더 구조

```text
allnuri/
├── index.html                                    # 메인 웹 애플리케이션 엔트리 HTML
├── onnuri_unified_search_demo.html               # 기존 원본 시제품 HTML (보존)
├── package.json                                  # 의존성 및 실행/빌드/테스트 스크립트
├── tsconfig.json                                 # TypeScript 컴파일러 설정
├── vite.config.ts                                # Vite 빌드 및 Vitest 테스트 설정
├── tailwind.config.js                            # 온누리 브랜드 디자인 토큰 및 Tailwind 설정
├── postcss.config.js                             # PostCSS 설정
├── vercel.json                                   # Vercel SPA 배포 설정
├── netlify.toml                                  # Netlify SPA 배포 설정
├── README.md                                     # 프로젝트 실행·배포 가이드 및 연동 문서
└── src/
    ├── main.tsx                                  # React DOM 마운트 엔트리
    ├── App.tsx                                   # 전역 검색·필터·URL 동기화·어댑터 상태 통합
    ├── index.css                                 # 글로벌 스타일 및 키보드 포커스 접근성 스타일
    ├── types/
    │   └── onnuri.ts                             # 쇼핑몰, 통합 상품, 검색 어댑터 표준 타입 정의
    ├── data/
    │   └── malls.ts                              # 24개 온누리 온라인몰 구조화 데이터 및 추천 검색어
    ├── utils/
    │   ├── searchUrlBuilder.ts                   # 쇼핑몰 직접 검색 / 전용관 검색 / 구글·네이버 웹검색 URL 빌더
    │   └── storage.ts                            # 즐겨찾기(onnuri-fav-v1 호환) 및 최근 검색어 localStorage 관리
    ├── services/
    │   └── productAdapter.ts                     # 상품 검색 어댑터, 규격 추출(extractProductSpec), 총구매가 정렬 엔진
    ├── components/
    │   ├── Header.tsx                            # 상단 로고, 섹션 내비게이션, 즐겨찾기 퀵 필터, 비공식 배지
    │   ├── HeroSearchSection.tsx                 # 중앙 통합 상품 검색창, 추천/최근 검색어, 검색 URL 공유
    │   ├── UnifiedProductComparisonSection.tsx   # 직접 검색 바로가기 바 + 통합 상품 가격·규격 비교 및 API 테스트 패널
    │   ├── MallDirectorySection.tsx              # 쇼핑몰 유형 탭, 연동 방식 필터, 이름 검색, 카드 그리드
    │   ├── MallCard.tsx                          # 개별 쇼핑몰 카드 (유형/검증상태/연동방식 배지, 전용관·홈페이지 분리)
    │   ├── IntegrationStatusTableSection.tsx     # 24개 쇼핑몰 데이터 연동 상태표 UI
    │   ├── UsageGuideSection.tsx                 # 디지털 온누리 온라인 결제 방법 및 유의사항 안내
    │   └── Footer.tsx                            # 비공식 서비스 명시 및 공식 사이트(onnuri.gift) 안내 푸터
    └── test/
        ├── setup.ts                              # Vitest + Testing Library 설정
        └── app.test.tsx                          # 데이터 무결성, URL 빌더, 규격/가격 정렬, UI 통합 테스트
```

---

## 2. 로컬 실행 및 테스트 명령어

### 사전 요구사항
- Node.js `v18+` (권장 `v20+` 또는 `v24+`)
- `npm`

### 설치 및 실행
```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (http://localhost:5173)
npm run dev

# 3. 프로덕션 빌드 (TypeScript 타입 검증 + Vite 번들링)
npm run build

# 4. 빌드 결과물 로컬 프리뷰
npm run preview

# 5. 단위 및 통합 테스트 실행
npm test
```

> **참고 (Windows PowerShell 실행 정책 관련):** PowerShell에서 `npm.ps1` 스크립트 실행이 제한된 경우 `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build`, `npm.cmd test`로 실행할 수 있습니다.

---

## 3. 배포 방법 (Vercel / Netlify)

본 프로젝트는 정적 SPA 빌드를 생성하며 `vercel.json`과 `netlify.toml`이 포함되어 있어 즉시 배포 가능합니다.

### A. Vercel 배포
1. GitHub 저장소에 프로젝트 푸시 후 [Vercel](https://vercel.com)에서 **New Project** 선택
2. Framework Preset: **Vite** 자동 감지 (`Build Command: npm run build`, `Output Directory: dist`)
3. (선택) 백엔드 오픈API 프록시 서버를 연동할 경우 Environment Variables에 `VITE_ONNURI_API_PROXY_URL` 등록
4. **Deploy** 클릭 (또는 CLI: `npx vercel --prod`)

### B. Netlify 배포
1. [Netlify](https://www.netlify.com)에서 **Add new site -> Import an existing project** 선택
2. 루트의 `netlify.toml` 설정(`command = "npm run build"`, `publish = "dist"`)이 자동 적용됨
3. **Deploy site** 클릭 (또는 CLI: `npx netlify deploy --prod`)

---

## 4. 구현된 기능 목록 vs 아직 구현되지 않은(외부 제휴 필요) 기능 목록

### 구현 완료된 기능
1. **24개 온누리 온라인몰 구조화 데이터 및 검증 체계 (`src/data/malls.ts`)**
   - 고유 ID, 쇼핑몰 이름, 아이콘 코드/컬러, 공식 홈페이지(`homeUrl`), 종합몰 전용관 URL(`dedicatedZoneUrl`), 직접 검색 URL 템플릿(`searchUrlTemplate`), 쇼핑몰 유형(`전용몰` / `전용관` / `검토`), 공식 사용처 검증 상태, 마지막 검증일, 데이터 연동 분류 및 결제 유의사항 완비
2. **홈페이지 URL과 검색 URL의 엄격한 분리 및 전용관 타겟팅 (`src/utils/searchUrlBuilder.ts`)**
   - 종합몰 내 전용관은 확인된 검색 URL 또는 전용관 진입 페이지로 연결하며, 상품별 결제 가능 여부가 미확인인 검색 결과에는 별도 안내 표시
   - 고정 URL이 미확정이거나 사용처 재확인이 필요한 쇼핑몰(퍼스트복지몰 온누리, 드림온누리몰 등)은 임의의 추측 URL을 넣지 않고 외부 웹 검색으로 안전 연결
   - 모든 쇼핑몰 카드에 주 검색 링크 외에 구글 웹 검색·네이버 웹 검색 보조 링크 제공
3. **통합 상품 검색 및 비교 엔진 (`src/services/productAdapter.ts`, `UnifiedProductComparisonSection.tsx`)**
   - 표준 상품 모델(`UnifiedProduct`) 및 어댑터 인터페이스(`ProductSearchAdapter`) 구현
   - 판매가(`price`) + 배송비(`shippingFee`)를 합산한 **총구매 예상 금액(`totalPrice`)** 자동 산출
   - 정렬 기능: **낮은 가격순(총구매가 기준)**, **높은 가격순(총구매가 기준)**, **관련도순**
   - 상품명 기반 **규격/용량 추출기(`extractProductSpec`)**: `10kg`, `20kg`, `2L x 6개` 등 규격을 분리 추출하여 서로 다른 규격의 상품을 임의로 같은 상품으로 취급하지 않고 규격별 필터링 비교 지원
   - **가짜 데이터 미생성 원칙 준수**: API 프록시나 검증된 피드가 연결되지 않은 상태에서 허위 상품·가격·재고를 생성하지 않으며, 투명한 연동 상태 안내와 검증용 JSON 피드/API 프록시 테스트 도구 제공
4. **검색 편의 및 필터 기능**
   - 추천 검색어(`쌀 10kg`, `김치`, `한우`, `사과`, `생수`, `생활용품` — 실제 통계 부재에 따라 '추천 검색어'로 명확히 표기)
   - 최근 검색어 `localStorage` 저장, 개별 삭제 및 전체 삭제
   - 검색어 및 필터 상태 URL 쿼리 파라미터(`?q=...&category=...&fav=1`) 실시간 동기화 및 클립보드 공유 버튼
   - 쇼핑몰 유형별 탭, 연동 방식별 필터, 특정 쇼핑몰 드롭다운 선택, 쇼핑몰 이름/품목 실시간 검색, 즐겨찾기(`onnuri-fav-v1` 기존 데이터 100% 호환) 필터
5. **모바일 최적화 및 웹 접근성**
   - 모바일 1열, 태블릿 2열, PC 3열 반응형 카드 그리드
   - 시맨틱 랜드마크(`header`, `nav`, `main`, `section`, `footer`), `aria-pressed`, `aria-live="polite"`, 키보드 포커스 링 적용

### 아직 구현되지 않은 기능 (외부 API 권한 및 쇼핑몰 제휴 필요 영역)
1. **24개 쇼핑몰 실시간 상품 DB 자동 수집 백엔드**
   - 대부분의 전통시장·온누리 전용몰은 공개 Open API를 제공하지 않으며, 무단 크롤링/스크래핑은 법적·기술적 제한(이용약관 위배, 접근 차단)이 있으므로 구현하지 않았습니다.
2. **종합몰 Open API 내 온누리 전용 상품 실시간 식별 연동**
   - 11번가 Open API, 롯데ON API 등 종합몰 API를 실제로 호출하려면 발급받은 API Key를 보관할 백엔드 서버(또는 Serverless Function)와 해당 상품이 '온누리상품권 결제 가능 전용관 상품'인지 식별하는 셀러/전용관 코드 매핑 제휴가 필요합니다.
3. **실사용자 기반 실시간 인기 검색어 통계 집계**
   - 현재 별도의 검색 로그 수집 백엔드 DB를 두지 않아 '추천 검색어'와 브라우저 로컬 '최근 검색어'로 동작합니다.

---

## 5. 쇼핑몰별 데이터 연동 상태표 (24곳 전체)

| 순번 | 고유 ID | 쇼핑몰 이름 | 유형 | 공식 사용처 검증 | 데이터 연동 분류 | 홈페이지 / 전용관 구분 | 검색 연결 방식 및 비고 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| 1 | `onnuri-market-official` | **온누리시장** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.onnuri-mall.co.kr/` | 공개 API 미제공 · `site:onnuri-mall.co.kr` 도메인 지정 웹 검색 |
| 2 | `onnuri-goodday` | **온누리굿데이** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.onnurigood.com/` | 쇼핑몰 내부 검색 URL 직접 연결 (`/goods/goods_search.php?keyword=`) |
| 3 | `onnuri-juntong-sijang` | **온누리전통시장** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://www.onnuri-sijang.com/onnuri/main/pc` | 상품별 결제 가능 여부와 판매 상태 확인 필요 |
| 4 | `inthemarket-onnuri` | **인더마켓온누리몰** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.inthemarket.co.kr/` | 쇼핑몰 내부 검색 URL 직접 연결 (`/goods/goods_search.php?keyword=`) |
| 5 | `onnuri-market-nuri` | **온누리마켓** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://nurimarket.co.kr/` | 상품별 결제 가능 여부와 판매 상태 확인 필요 |
| 6 | `noljang` | **놀장** | 전용몰 | 검증완료 (2026-10-28) | 로컬 공개 검색 | `https://mall.noljang.co.kr/` | 공개 검색 API의 `onuriYn=Y` 상품만 수집 |
| 7 | `onnuri-shopping` | **온누리쇼핑** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://onnurishop.co.kr/` | 검색 카드의 온누리 표시 상품을 로컬 검색에 포함 |
| 8 | `lotteon-onnuri` | **롯데ON 온누리상생스토어** | 전용관 | 검증완료 (2026-10) | 공개 검색 통합 | `https://www.lotteon.com/display/shop/seltDpShop/57821` | 전용관 노출 상품 중 온누리 표시와 판매 상태 확인 |
| 9 | `sijang-to-room` | **시장을방으로** | 전용몰 | 앱 중심 (2026-10) | 2. 검색 링크 연결 | 모바일 앱 중심 (`null`) | 웹 고정 상품 검색 URL 미제공 · 외부 키워드 웹 검색 연결 |
| 10 | `onnuri-chance` | **온누리찬스** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnurichance.com/` | 공개 API 미제공 · `site:onnurichance.com` 도메인 지정 웹 검색 |
| 11 | `gyeongbuk-cyso` | **경북고향장터 사이소** | 전용관 | 검증완료 (2026-10) | 1. 공개 검색 통합 | `https://www.cyso.co.kr/exhibition/detail?id=1773379812` | 온누리상품권 기획전의 판매 중 상품을 상품명으로 검색 |
| 12 | `11st-onnuri` | **11번가 온누리마켓** | 전용관 | 검증완료 (2026-10) | 공개 검색 통합 | 온누리상품권 검색 필터 | 상품별 온누리 표시와 품절 상태 확인 |
| 13 | `onnuri-hotdeal` | **온누리핫딜** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnurideal.com/` | 공개 API 미제공 · `site:onnurideal.com` 도메인 지정 웹 검색 |
| 14 | `first-welfare-onnuri` | **퍼스트복지몰 온누리** | 검토 | **재확인 필요** | 3. 제휴/확인 필요 | 미확정 (`null`) | 폐쇄형 복지몰 여부 및 현행 사용처 재확인 필요 · 외부 웹 검색 연결 |
| 15 | `dream-onnuri-mall` | **드림온누리몰** | 검토 | **재확인 필요** | 3. 제휴/확인 필요 | 미확정 (`null`) | 현행 사용처 유지 여부 및 도메인 재확인 필요 · 외부 웹 검색 연결 |
| 16 | `onnuri-gonggong-mall` | **온누리공공몰** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://www.ongong.kr/shop/` | 상품별 결제 가능 여부와 판매 상태 확인 필요 |
| 17 | `epost-shopping-onnuri` | **우체국쇼핑** | 전용관 | 검증완료 (2026-10) | 공개 검색 통합 | `https://mall.epost.go.kr/fo/pavln/sijangAll.do` | 전통시장관 검색 · 상품별 결제 가능 여부와 판매 상태 확인 필요 |
| 18 | `onnuri-5iljang` | **온누리5일장** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://www.onnuri5.co.kr/` | 온누리 상품 유형과 판매 상태를 확인한 검색 결과를 로컬 검색에 포함 |
| 19 | `onnuri-paldo-sijang` | **온누리팔도시장** | 전용몰 | 검증완료 (2026-10) | 1. 공개 검색 통합 | `https://www.e-jangter.com/Extmall/Onnuri.aspx` | 온누리 팔도시장 카테고리 필터 검색 결과 수집 |
| 20 | `gongyoung-onnuri` | **공영홈쇼핑 온누리장터** | 전용관 | 검증완료 (2026-10) | 1. 공개 검색 통합 | `https://www.gongyoungshop.kr/` | 상품 카드 응답의 온누리 표시와 판매 상태를 확인해 통합 |
| 21 | `kkuk-ai-onnuri` | **꾹AI:온누리몰** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnuri.ai/` | 공개 API 미제공 · `site:onnuri.ai` 도메인 지정 웹 검색 |
| 22 | `genius-mall` | **지니어스 Mall** | 전용몰 | 검증완료 (2026-10) | 공개 검색 통합 | `https://luxurysystem.co.kr/` | 상품별 결제 가능 여부와 판매 상태 확인 필요 |
| 23 | `hyundai-hmall-onnuri` | **현대홈쇼핑 온누리샵** | 전용관 | 검증완료 (2026-10) | 공개 검색 통합 | `https://www.hmall.com/md/dpa/searchSpexSectItem?sectId=3132118` | 온누리 필터 검색 · 상품별 결제 가능 및 품절 상태 확인 |
| 24 | `pirates-mermaid` | **인어교주해적단** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.tpirates.com/` | 수산물 플랫폼 · `site:tpirates.com` 도메인 지정 웹 검색 |

---

## 6. 앞으로 실제 상품 통합 검색을 완성하는 데 필요한 작업

1. **시범 상품 피드 연결 (`VITE_ONNURI_API_PROXY_URL` 연결)**
   - `/api/onnuri/products?q=검색어` 서버 검색 경로와 최대 3곳의 제휴 JSON 피드 어댑터가 준비되어 있습니다.
   - 각 쇼핑몰과 데이터 제공 범위 및 `onnuriEligible` 필드를 협의한 뒤 `ONNURI_FEEDS_JSON`을 설정해야 실제 상품 검색이 작동합니다.
2. **온누리 전용몰 상품 EP(피드) 제휴**
   - 온누리굿데이, 인더마켓온누리몰, 온누리시장 등 고도몰·카페24 기반 전용몰 운영사와 협의하여 일일 상품 피드(JSON/XML)를 제공받아 배치 색인(예: Supabase / PostgreSQL / Elasticsearch)을 구성합니다.
3. **공식 사용처 정기 검증 자동화**
   - 소상공인시장진흥공단 및 디지털 온누리상품권 공식 사이트(`onnuri.gift`)의 월별 온라인 사용처 공지사항을 확인하여 `src/data/malls.ts`의 `verificationStatus`와 `lastVerifiedDate`를 갱신합니다.
