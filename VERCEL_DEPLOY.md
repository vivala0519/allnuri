# Vercel 배포

## 프로젝트 설정

1. 변경 사항을 배포 브랜치에 커밋하고 Git 원격 저장소로 푸시합니다.
2. Vercel에서 해당 저장소를 Import합니다. Root Directory는 이 프로젝트의 `package.json`이 있는 폴더입니다.
3. Framework는 Vite, Build Command는 `npm run build`, Output Directory는 `dist`, Node.js는 24.x를 사용합니다. 저장소의 `vercel.json`과 `package.json`에 설정되어 있습니다.
4. Preview 배포 후 검색을 확인하고 Production에 반영합니다.

## 검색 API

`api/onnuri/products.js`가 Vercel Node.js 함수 진입점입니다. 로컬 Vite 서버와 동일한 `server/onnuri/localSearch.mjs`를 호출하므로 공개몰 검색과 선택적으로 설정한 제휴 피드를 함께 조회합니다. 공통 코드와 테스트는 `api/` 밖에 둬서 별도의 함수로 배포되지 않도록 합니다.

API는 `/api/onnuri/products?q=검색어`에서 JSON을 반환합니다. 정적 파일과 API를 먼저 처리하고 화면 경로는 `index.html`로 연결합니다. 존재하지 않는 `/api/` 요청은 404로 처리합니다. 함수 실행 지역은 서울(`icn1`), 최대 실행 시간은 60초입니다.

## 환경변수

공개몰 검색에는 필수 비밀키가 없습니다. 프런트엔드는 기본적으로 같은 도메인의 `/api/onnuri/products`를 사용합니다.

| 변수 | 설정 |
|---|---|
| `VITE_ONNURI_API_PROXY_URL` | 선택 사항. 설정한다면 `/api/onnuri/products`. 예전 localhost 주소가 등록되어 있으면 수정 |
| `ONNURI_FEEDS_JSON` | 실제 제휴 JSON 피드가 있을 때만 서버 환경변수로 설정 |

토큰이나 비밀키에 `VITE_` 접두사를 사용하지 않습니다. 프런트엔드 환경변수를 변경하면 다시 빌드·배포합니다.

## 배포 확인

- `/api/onnuri/products?q=쌀`이 HTML이 아닌 JSON을 반환하는지 확인합니다.
- `items`와 몰별 `sources`를 확인합니다. 한 몰이 실패해도 나머지 몰의 검색 결과는 반환됩니다.
- 화면에서 검색어를 입력하고 상품 카드, 가격, 원본 상품 링크를 확인합니다.
- 빈 검색어는 400, GET 외 메서드는 405인지 확인합니다.
- 특정 몰만 실패하면 Vercel 환경에서의 몰 접근 차단, 응답 시간, 페이지 구조를 확인합니다. 로컬 성공만으로 배포 환경의 접근 성공이 보장되지는 않습니다.

현재 캐시는 함수 인스턴스의 메모리에 저장됩니다. 인스턴스가 새로 뜨거나 여러 개 실행되면 캐시가 공유되지 않습니다. 첫 배포에 DB는 필요하지 않으며, 사용량이 커지면 공유 캐시와 요청 제한을 추가할 수 있습니다.

## 로컬 검증

```sh
npm ci
npm test
npm run build
```

이 검증은 실제 Vercel 배포 검증을 대신하지 않습니다. Vercel 미리보기 URL에서 검색 응답을 별도로 확인합니다.

참고: [Vite 배포](https://vercel.com/docs/frameworks/frontend/vite), [함수 공통 코드 배치](https://vercel.com/docs/functions/configuring-functions/advanced-configuration), [함수 실행 시간](https://vercel.com/docs/functions/configuring-functions/duration).
