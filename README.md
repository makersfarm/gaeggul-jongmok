# 개꿀종목

공시, 무료 공개 시세, 뉴스 RSS, 대중 관심 신호를 한 화면에서 묶어 보는 국내 주식 분석 웹앱 데모입니다.

## 기능

- KOSPI/KOSDAQ 거래량 상위 종목 TOP 5
- 종목 상세 화면
- 무료 공개 시세 기반 테크니컬/펀더멘털 힌트
- Google News RSS 기반 최근 뉴스
- OpenDART optional 공시 조회
- OpenDART 사업보고서 주요 재무계정 수집/파싱
- 네이버 일봉 기반 이동평균, V25, 20일 지지/저항 계산
- 라이트/다크 테마
- 모바일 대응 UI
- 지표별 설명 tooltip

## 데이터 소스

- 시세/거래량: 네이버 금융 공개 페이지 polling
- 뉴스: Google News RSS
- 공시: OpenDART API, `DART_API_KEY` 설정 시 활성화
- 재무제표: OpenDART `fnlttSinglAcnt.json`
- 가격 히스토리: 네이버 금융 일봉 데이터

이 프로젝트는 MVP 검증용 데모입니다. 실시간 체결 데이터와 상용 서비스 운영에는 정식 데이터 라이선스와 약관 검토가 필요합니다.

## 저장 구조

현재 런타임 저장소는 로컬 파일 캐시입니다.

- `data/cache/dart/corp-codes.json`: DART 고유번호 매핑
- `data/cache/dart/fundamentals/<stockCode>-<year>.json`: 종목별 사업보고서 주요 재무계정
- `data/cache/market/prices/<stockCode>.json`: 종목별 일봉과 계산 지표

`data/cache/`는 `.gitignore`로 제외됩니다.

Supabase 전환용 스키마는 `supabase/schema.sql`에 있습니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 환경변수

```bash
cp .env.example .env
```

`DART_API_KEY`는 선택값입니다. 비워두면 앱은 공개 시세와 뉴스 중심으로 동작하고, 공시 영역에는 안내 fallback이 표시됩니다.
