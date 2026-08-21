# scripts/archive

개발 초기 1회성 시드·consolidate 스크립트 보관 폴더입니다.

- `package.json`에 등록되지 않음
- 로컬 절대경로(`d:/대학DB/...`)가 하드코딩된 경우가 많음
- 운영 앱 빌드·실행과 무관

현재 npm scripts:

- `postinstall` → `copy-cesium-assets.mjs`
- `geocode:univ-map` → `enrich-school-overview-geocodes.ts`
