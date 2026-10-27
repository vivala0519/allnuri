# 온누리 찾기 (Allnuri Finder) — 디지털 온누리상품권 온라인몰 통합 검색 플랫폼

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
   - 고유 ID, 쇼핑몰 이름, 아이콘 코드/컬러, 공식 홈페이지(`homeUrl`), 종합몰 전용관 URL(`dedicatedZoneUrl`), 직접 검색 URL 템플릿(`searchUrlTemplate`), 쇼핑몰 유형(`전용몰` / `전용관` / `검토`), 공식 사용처 검증 상태, 마지막 검증일(`2026-10-27`), 데이터 연동 분류 및 결제 유의사항 완비
2. **홈페이지 URL과 검색 URL의 엄격한 분리 및 전용관 타겟팅 (`src/utils/searchUrlBuilder.ts`)**
   - 종합몰 내 전용관(11번가 온누리마켓, 롯데ON 온누리상생스토어, 우체국쇼핑, 공영홈쇼핑 온누리장터, 현대홈쇼핑 온누리샵)은 일반 종합몰 메인으로 이동하지 않고 **전용관 키워드가 결합된 검색 결과 URL** 및 전용관 진입 페이지로 연결
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
| 3 | `onnuri-juntong-sijang` | **온누리전통시장** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.onnuri-sijang.com/onnuri/main/pc` | 현대이지웰 운영 · `site:onnuri-sijang.com` 도메인 지정 웹 검색 |
| 4 | `inthemarket-onnuri` | **인더마켓온누리몰** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.inthemarket.co.kr/` | 쇼핑몰 내부 검색 URL 직접 연결 (`/goods/goods_search.php?keyword=`) |
| 5 | `onnuri-market-nuri` | **온누리마켓** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://nurimarket.co.kr/` | 공개 API 미제공 · `site:nurimarket.co.kr` 도메인 지정 웹 검색 |
| 6 | `noljang` | **놀장** | 전용몰 | 앱 중심 (2026-10) | 2. 검색 링크 연결 | `https://mall.noljang.co.kr/` | 전통시장 플랫폼 · `site:mall.noljang.co.kr` 도메인 지정 웹 검색 |
| 7 | `onnuri-shopping` | **온누리쇼핑** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | 미확정 (`null`) | 단일 도메인 미확정 · `"온누리쇼핑" + 검색어` 외부 웹 검색 연결 |
| 8 | `lotteon-onnuri` | **롯데ON 온누리상생스토어** | 전용관 | 검증완료 (2026-10) | 1. 공식 API/제휴 가능 | 전용관 검색 진입 URL | 롯데ON 내 `"온누리상생스토어 + 검색어"` 전용관 검색 직접 연결 |
| 9 | `sijang-to-room` | **시장을방으로** | 전용몰 | 앱 중심 (2026-10) | 2. 검색 링크 연결 | 모바일 앱 중심 (`null`) | 웹 고정 상품 검색 URL 미제공 · 외부 키워드 웹 검색 연결 |
| 10 | `onnuri-chance` | **온누리찬스** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnurichance.com/` | 공개 API 미제공 · `site:onnurichance.com` 도메인 지정 웹 검색 |
| 11 | `gyeongbuk-cyso` | **경북고향장터 사이소** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.cyso.co.kr/` | 경북 농특산물몰 · `site:cyso.co.kr` 도메인 지정 웹 검색 |
| 12 | `11st-onnuri` | **11번가 온누리마켓** | 전용관 | 검증완료 (2026-10) | 1. 공식 API/제휴 가능 | 전용관 검색 진입 URL | 11번가 Open API 보유 · 현재 `"온누리마켓 + 검색어"` 전용관 직접 연결 |
| 13 | `onnuri-hotdeal` | **온누리핫딜** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnurideal.com/` | 공개 API 미제공 · `site:onnurideal.com` 도메인 지정 웹 검색 |
| 14 | `first-welfare-onnuri` | **퍼스트복지몰 온누리** | 검토 | **재확인 필요** | 3. 제휴/확인 필요 | 미확정 (`null`) | 폐쇄형 복지몰 여부 및 현행 사용처 재확인 필요 · 외부 웹 검색 연결 |
| 15 | `dream-onnuri-mall` | **드림온누리몰** | 검토 | **재확인 필요** | 3. 제휴/확인 필요 | 미확정 (`null`) | 현행 사용처 유지 여부 및 도메인 재확인 필요 · 외부 웹 검색 연결 |
| 16 | `onnuri-gonggong-mall` | **온누리공공몰** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.ongong.kr/shop/` | 공개 API 미제공 · `site:ongong.kr` 도메인 지정 웹 검색 |
| 17 | `epost-shopping-onnuri` | **우체국쇼핑** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://mall.epost.go.kr/` | 우체국쇼핑 내 `"온누리 + 검색어"` 조합 내부 검색 직접 연결 |
| 18 | `onnuri-5iljang` | **온누리5일장** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnuri5.com/` | 공개 API 미제공 · `site:onnuri5.com` 도메인 지정 웹 검색 |
| 19 | `onnuri-paldo-sijang` | **온누리팔도시장** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | 미확정 (`null`) | `"온누리팔도시장" + 검색어` 외부 웹 검색 연결 |
| 20 | `gongyoung-onnuri` | **공영홈쇼핑 온누리장터** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.gongyoungshop.kr/` | 공영쇼핑 내 `"온누리 + 검색어"` 조합 내부 검색 직접 연결 |
| 21 | `kkuk-ai-onnuri` | **꾹AI:온누리몰** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://onnuri.ai/` | 공개 API 미제공 · `site:onnuri.ai` 도메인 지정 웹 검색 |
| 22 | `genius-mall` | **지니어스 Mall** | 전용몰 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://luxurysystem.co.kr/` | 공개 API 미제공 · `site:luxurysystem.co.kr` 도메인 지정 웹 검색 |
| 23 | `hyundai-hmall-onnuri` | **현대홈쇼핑 온누리샵** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | 전용관 검색 진입 URL | 현대Hmall 내 `"온누리샵 + 검색어"` 전용관 검색 직접 연결 |
| 24 | `pirates-mermaid` | **인어교주해적단** | 전용관 | 검증완료 (2026-10) | 2. 검색 링크 연결 | `https://www.tpirates.com/` | 수산물 플랫폼 · `site:tpirates.com` 도메인 지정 웹 검색 |

---

## 6. 앞으로 실제 상품 통합 검색을 완성하는 데 필요한 작업

1. **백엔드 오픈API 프록시 서버 구축 (`VITE_ONNURI_API_PROXY_URL` 연결)**
   - 프런트엔드의 `OfficialApiProxyAdapter`(`src/services/productAdapter.ts`)는 이미 `/api/onnuri/products?q=검색어` 형태의 표준 JSON 응답을 받아 렌더링하도록 구현되어 있습니다.
   - Vercel Serverless Functions 또는 Node.js(Express/Fastify) 서버에서 11번가 Open API 키 등을 환경변수로 안전하게 관리하고, 온누리 전용관 상품만 필터링하여 반환하도록 연결하면 즉시 실시간 가격 비교가 작동합니다.
2. **온누리 전용몰 상품 EP(피드) 제휴**
   - 온누리굿데이, 인더마켓온누리몰, 온누리시장 등 고도몰·카페24 기반 전용몰 운영사와 협의하여 일일 상품 피드(JSON/XML)를 제공받아 배치 색인(예: Supabase / PostgreSQL / Elasticsearch)을 구성합니다.
3. **공식 사용처 정기 검증 자동화**
   - 소상공인시장진흥공단 및 디지털 온누리상품권 공식 사이트(`onnuri.gift`)의 월별 온라인 사용처 공지사항을 확인하여 `src/data/malls.ts`의 `verificationStatus`와 `lastVerifiedDate`를 갱신합니다.
