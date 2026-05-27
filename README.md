# 개꿀종목

공시, 무료 공개 시세, 뉴스 RSS, 대중 관심 신호를 한 화면에서 묶어 보는 국내 주식 분석 웹앱 데모입니다.

## 기능

- KOSPI/KOSDAQ 거래량 상위 종목 TOP 5
- 종목 상세 화면
- 무료 공개 시세 기반 테크니컬/펀더멘털 힌트
- Google News RSS 기반 최근 뉴스
- OpenDART optional 공시 조회
- 라이트/다크 테마
- 모바일 대응 UI
- 지표별 설명 tooltip

## 데이터 소스

- 시세/거래량: 네이버 금융 공개 페이지 polling
- 뉴스: Google News RSS
- 공시: OpenDART API, `DART_API_KEY` 설정 시 활성화

이 프로젝트는 MVP 검증용 데모입니다. 실시간 체결 데이터와 상용 서비스 운영에는 정식 데이터 라이선스와 약관 검토가 필요합니다.

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
