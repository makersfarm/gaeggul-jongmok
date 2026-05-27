import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/react";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronLeft,
  ExternalLink,
  FileSearch,
  Info,
  Moon,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  WalletCards,
  Users,
  Volume2,
} from "lucide-react";
import "./styles.css";

type SignalLevel = "high" | "medium" | "low" | "danger";

type Disclosure = {
  title: string;
  date: string;
  type: string;
  summary: string;
  impact: SignalLevel;
};

type NewsItem = {
  title: string;
  source: string;
  time: string;
  url: string;
};

type Report = {
  broker: string;
  opinion: string;
  target: string;
  summary: string;
  confidence: SignalLevel;
};

type Stock = {
  code: string;
  name: string;
  sector: string;
  price: string;
  change: number;
  volumeRank: number;
  surgeRank: number;
  riskRank: number;
  riskScore: number;
  trustScore: number;
  accuracyScore: number;
  verdict: string;
  dart: Disclosure[];
  technicals: string[];
  fundamentals: string[];
  reports: Report[];
  sentiment: {
    crowd: string;
    score: number;
    keywords: string[];
    caution: string;
  };
  news: NewsItem[];
};

type MarketRow = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  volume: number;
  market: "KOSPI" | "KOSDAQ";
};

type DartItem = {
  title: string;
  date: string;
  type: string;
  url?: string;
};

type ComputedDart = {
  dart: Disclosure[];
  riskScore: number;
  riskRank: number;
  trustScore: number;
  accuracyScore: number;
  fundamentals: string[];
  reports: Report[];
  verdict: string;
};

type FundamentalAnalysis = {
  grade: string;
  summary: string;
  opinion: string;
  metrics: {
    label: string;
    value: string;
    status: SignalLevel;
    plain: string;
    formula: string;
  }[];
  concepts: {
    title: string;
    description: string;
    easy: string;
  }[];
  checklist: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
  caveats: string[];
};

const stocks: Stock[] = [
  {
    code: "005930",
    name: "삼성전자",
    sector: "반도체",
    price: "86,400",
    change: 3.8,
    volumeRank: 1,
    surgeRank: 2,
    riskRank: 4,
    riskScore: 38,
    trustScore: 86,
    accuracyScore: 81,
    verdict: "실적 회복 기대와 거래대금이 동시에 붙었지만 단기 과열은 낮음",
    dart: [
      {
        title: "대규모 시설투자 정정 공시",
        date: "2026.05.24",
        type: "투자",
        summary: "HBM 라인 증설 일정이 앞당겨졌고 자금 조달 계획은 기존 현금성 자산 중심.",
        impact: "high",
      },
      {
        title: "분기보고서",
        date: "2026.05.15",
        type: "실적",
        summary: "메모리 ASP 반등과 파운드리 적자 축소가 동시에 확인됨.",
        impact: "medium",
      },
    ],
    technicals: ["20일 신고가 돌파", "거래량 5일 평균 대비 184%", "RSI 67로 과열 직전"],
    fundamentals: ["PER 18.4배", "영업이익률 17.8%", "순현금 구조 유지"],
    reports: [
      {
        broker: "한빛증권",
        opinion: "매수",
        target: "105,000",
        summary: "AI 서버향 HBM 믹스 개선이 2개 분기 이상 지속될 가능성.",
        confidence: "high",
      },
      {
        broker: "동서증권",
        opinion: "중립",
        target: "91,000",
        summary: "이미 주가에 상당 부분 반영되어 추가 모멘텀 확인 필요.",
        confidence: "medium",
      },
    ],
    sentiment: {
      crowd: "긍정 우세",
      score: 74,
      keywords: ["HBM", "외국인 순매수", "실적턴"],
      caution: "단기 급등 후 실적 발표 전 변동성 확대 가능.",
    },
    news: [
      {
        title: "삼성전자, AI 메모리 증설 속도 높인다",
        source: "경제데일리",
        time: "28분 전",
        url: "https://finance.naver.com",
      },
      {
        title: "외국인 대형 반도체주 순매수 확대",
        source: "마켓와치",
        time: "1시간 전",
        url: "https://finance.naver.com",
      },
    ],
  },
  {
    code: "000660",
    name: "SK하이닉스",
    sector: "반도체",
    price: "241,500",
    change: 5.1,
    volumeRank: 2,
    surgeRank: 1,
    riskRank: 2,
    riskScore: 54,
    trustScore: 82,
    accuracyScore: 78,
    verdict: "모멘텀은 강하지만 기대치가 높아진 구간이라 리포트 괴리 체크 필요",
    dart: [
      {
        title: "단일판매 공급계약 체결",
        date: "2026.05.26",
        type: "계약",
        summary: "북미 클라우드 고객 대상 고부가 메모리 공급 물량 증가.",
        impact: "high",
      },
    ],
    technicals: ["갭 상승 후 종가 고가권", "MACD 양전환 유지", "기관 4거래일 연속 순매수"],
    fundamentals: ["매출 성장률 31%", "부채비율 63%", "컨센서스 상향 6건"],
    reports: [
      {
        broker: "서울투자",
        opinion: "매수",
        target: "285,000",
        summary: "HBM3E 수율 안정화가 밸류에이션 프리미엄을 정당화.",
        confidence: "high",
      },
    ],
    sentiment: {
      crowd: "강한 긍정",
      score: 81,
      keywords: ["수율", "목표가상향", "엔비디아"],
      caution: "낙관 게시글 비중이 높아 추격 매수 리스크 존재.",
    },
    news: [
      {
        title: "SK하이닉스 목표가 줄상향, HBM 프리미엄 지속",
        source: "비즈마켓",
        time: "12분 전",
        url: "https://finance.naver.com",
      },
    ],
  },
  {
    code: "035420",
    name: "NAVER",
    sector: "인터넷",
    price: "218,000",
    change: 2.4,
    volumeRank: 4,
    surgeRank: 4,
    riskRank: 5,
    riskScore: 31,
    trustScore: 77,
    accuracyScore: 73,
    verdict: "AI 검색과 커머스 마진 개선이 핵심. 방어적 반등 후보",
    dart: [
      {
        title: "자기주식 취득 결정",
        date: "2026.05.22",
        type: "주주환원",
        summary: "주가 안정과 주주가치 제고 목적의 자사주 매입.",
        impact: "medium",
      },
    ],
    technicals: ["60일선 회복", "거래대금 증가 초기", "변동성 축소 후 반등"],
    fundamentals: ["영업이익률 15.2%", "커머스 take-rate 개선", "현금흐름 안정"],
    reports: [
      {
        broker: "미래리서치",
        opinion: "매수",
        target: "260,000",
        summary: "광고 회복보다 비용 통제가 올해 이익 개선의 핵심.",
        confidence: "medium",
      },
    ],
    sentiment: {
      crowd: "중립",
      score: 58,
      keywords: ["AI검색", "웹툰", "자사주"],
      caution: "성장 기대는 있으나 검색 점유율 논쟁이 계속됨.",
    },
    news: [
      {
        title: "네이버, AI 검색 개편 이후 체류시간 개선",
        source: "테크경제",
        time: "2시간 전",
        url: "https://finance.naver.com",
      },
    ],
  },
  {
    code: "005380",
    name: "현대차",
    sector: "자동차",
    price: "297,000",
    change: 1.9,
    volumeRank: 5,
    surgeRank: 5,
    riskRank: 3,
    riskScore: 44,
    trustScore: 80,
    accuracyScore: 76,
    verdict: "주주환원과 환율 수혜는 긍정, 미국 정책 리스크는 분리 확인",
    dart: [
      {
        title: "현금ㆍ현물 배당 결정",
        date: "2026.05.20",
        type: "배당",
        summary: "분기 배당 규모가 컨센서스를 상회하며 주주환원 기대 강화.",
        impact: "high",
      },
    ],
    technicals: ["전고점 저항 접근", "거래량은 평균 수준", "ADX 상승 전환"],
    fundamentals: ["ROE 13.9%", "배당수익률 4%대", "북미 믹스 견조"],
    reports: [
      {
        broker: "K리서치",
        opinion: "매수",
        target: "350,000",
        summary: "EV 둔화에도 하이브리드 판매와 환율이 이익 방어.",
        confidence: "medium",
      },
    ],
    sentiment: {
      crowd: "긍정",
      score: 66,
      keywords: ["배당", "환율", "하이브리드"],
      caution: "관세와 인센티브 비용 변화가 주가 상단을 제한할 수 있음.",
    },
    news: [
      {
        title: "현대차, 하이브리드 판매 호조로 이익 방어",
        source: "오토파이낸스",
        time: "3시간 전",
        url: "https://finance.naver.com",
      },
    ],
  },
  {
    code: "247540",
    name: "에코프로비엠",
    sector: "2차전지",
    price: "191,200",
    change: 6.3,
    volumeRank: 3,
    surgeRank: 3,
    riskRank: 1,
    riskScore: 72,
    trustScore: 61,
    accuracyScore: 59,
    verdict: "반등 탄력은 강하지만 공매도/수급성 뉴스 비중이 높아 위험지수 최상",
    dart: [
      {
        title: "타법인 주식 취득 결정",
        date: "2026.05.25",
        type: "투자",
        summary: "전구체 공급망 안정화를 위한 지분 투자. 단기 재무 부담 가능.",
        impact: "medium",
      },
    ],
    technicals: ["상한가 근접 후 윗꼬리", "거래량 260% 급증", "RSI 78 과열"],
    fundamentals: ["영업이익률 4.1%", "재고자산 회전 부담", "원재료 가격 민감"],
    reports: [
      {
        broker: "밸류증권",
        opinion: "중립",
        target: "185,000",
        summary: "주가 반등은 빠르지만 실적 턴어라운드 확인 전.",
        confidence: "medium",
      },
    ],
    sentiment: {
      crowd: "과열",
      score: 88,
      keywords: ["숏커버", "테마순환", "급등"],
      caution: "대중 의견의 추격성 키워드가 많아 신뢰도 할인 필요.",
    },
    news: [
      {
        title: "2차전지주 동반 급등, 수급성 반등 평가",
        source: "증권타임",
        time: "45분 전",
        url: "https://finance.naver.com",
      },
    ],
  },
];

const levelText: Record<SignalLevel, string> = {
  high: "강함",
  medium: "보통",
  low: "낮음",
  danger: "주의",
};

const metricExplanations = {
  trust:
    "이 숫자는 ‘판단 근거가 얼마나 충분한가’를 뜻해요. 거래량, 뉴스, DART 공시가 확인될수록 올라가고 자료가 비어 있으면 낮아집니다. 지금은 DART 최근 공시 개수와 최근성을 반영합니다.",
  volumeRank:
    "오늘 시장에서 얼마나 많이 사고팔렸는지를 보는 순위예요. KOSPI/KOSDAQ 종목을 거래량이 많은 순서대로 줄 세운 값입니다. 순위가 높을수록 시장 관심이 크다고 볼 수 있어요.",
  surgeRank:
    "오늘 가격이 얼마나 빠르게 움직였는지를 보는 순위예요. 등락률이 큰 종목일수록 앞에 옵니다. 단, 많이 올랐다는 뜻이지 반드시 좋은 종목이라는 뜻은 아니에요.",
  risk:
    "단기 변동성이 얼마나 큰지 보여주는 주의 신호예요. 가격이 급하게 움직이고, 최근 공시가 많거나 임원·주요주주·정정 같은 민감 공시가 있으면 더 높아집니다.",
  accuracy:
    "분석에 사용된 데이터가 얼마나 채워졌는지를 뜻해요. 시세와 뉴스만 있을 때보다 DART 공시가 실제로 연결되면 점수가 올라갑니다.",
  sentiment:
    "사람들이 이 종목에 얼마나 관심을 보이는지 보는 보조 지표예요. 지금은 뉴스와 검색 관심을 바탕으로 임시 계산하고, 이후 커뮤니티/종목토론방 데이터가 붙으면 더 정확해집니다.",
};

function clampScore(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function classifyDisclosure(title: string): { impact: SignalLevel; weight: number; label: string } {
  if (/정정|횡령|배임|불성실|상장폐지|관리종목|감사의견|소송|압수|조사/.test(title)) {
    return { impact: "danger", weight: 12, label: "주의 공시" };
  }
  if (/임원|주요주주|대량보유|자기주식|전환사채|신주인수권|유상증자|감자/.test(title)) {
    return { impact: "medium", weight: 7, label: "수급/지분 공시" };
  }
  if (/잠정|실적|매출|영업이익|공급계약|투자|배당/.test(title)) {
    return { impact: "high", weight: 4, label: "사업/실적 공시" };
  }
  return { impact: "low", weight: 2, label: "일반 공시" };
}

function daysSinceDartDate(value: string) {
  const normalized = value.replace(/\./g, "");
  if (!/^\d{8}$/.test(normalized)) return 30;
  const date = new Date(`${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 30;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

function applyDartSignals(stock: Stock, items: DartItem[]): ComputedDart {
  if (!items.length) {
    return {
      dart: stock.dart,
      riskScore: stock.riskScore,
      riskRank: stock.riskRank,
      trustScore: stock.trustScore,
      accuracyScore: stock.accuracyScore,
      fundamentals: stock.fundamentals,
      reports: stock.reports,
      verdict: stock.verdict,
    };
  }

  const enriched = items.map((item) => {
    const classified = classifyDisclosure(item.title);
    return {
      item,
      ...classified,
      days: daysSinceDartDate(item.date),
    };
  });
  const recentCount = enriched.filter((entry) => entry.days <= 7).length;
  const dangerCount = enriched.filter((entry) => entry.impact === "danger").length;
  const disclosureRisk = enriched.reduce(
    (sum, entry) => sum + entry.weight + (entry.days <= 3 ? 4 : entry.days <= 7 ? 2 : 0),
    0,
  );
  const nextRiskScore = clampScore(stock.riskScore + disclosureRisk, 18, 96);
  const nextTrustScore = clampScore(stock.trustScore + 10 + Math.min(items.length, 5) * 2 - dangerCount * 3, 0, 95);
  const nextAccuracyScore = clampScore(stock.accuracyScore + 18 + Math.min(items.length, 5) * 2, 0, 92);
  const headline = enriched[0];
  const dart = enriched.map(({ item, impact, label, days }) => ({
    title: item.title,
    date: formatDartDate(item.date),
    type: label,
    summary:
      days <= 7
        ? `최근 ${days || "당일"}일 내 접수된 ${label}입니다. 단기 수급과 변동성 판단에 반영했습니다.`
        : `최근 30일 내 접수된 ${label}입니다. 종목 판단 근거에 반영했습니다.`,
    impact,
  }));

  return {
    dart,
    riskScore: nextRiskScore,
    riskRank: nextRiskScore > 70 ? 1 : nextRiskScore > 50 ? 2 : 3,
    trustScore: nextTrustScore,
    accuracyScore: nextAccuracyScore,
    fundamentals: [
      `DART 최근 공시 ${items.length}건 확인`,
      `최근 7일 공시 ${recentCount}건${dangerCount ? `, 주의 공시 ${dangerCount}건` : ""}`,
      ...stock.fundamentals.slice(0, 1),
    ],
    reports: [
      {
        broker: "DART 기반 보조 판단",
        opinion: dangerCount ? "주의" : recentCount ? "확인 필요" : "참고",
        target: "-",
        summary: `${headline.item.title} 등 최근 공시를 반영했습니다. 리포트 원문 연결 전까지는 공시 신호를 우선 참고합니다.`,
        confidence: dangerCount ? "danger" : "medium",
      },
    ],
    verdict: `${stock.verdict} DART 최근 공시 ${items.length}건을 추가 반영해 신뢰도 ${nextTrustScore}, 정확성 ${nextAccuracyScore}, 위험지수 ${nextRiskScore}로 갱신했습니다.`,
  };
}

function buildFundamentalAnalysis(stock: Stock): FundamentalAnalysis {
  const dartCount = stock.dart.filter((item) => !item.title.includes("미설정")).length;
  const highImpact = stock.dart.filter((item) => item.impact === "high").length;
  const cautionImpact = stock.dart.filter((item) => item.impact === "danger" || item.type.includes("주의")).length;
  const volumeQuality = stock.volumeRank <= 2 ? "high" : stock.volumeRank <= 4 ? "medium" : "low";
  const disclosureQuality = dartCount >= 4 ? "high" : dartCount >= 2 ? "medium" : "low";
  const dataCoverage = clampScore(stock.accuracyScore + dartCount * 2 + highImpact * 2 - cautionImpact * 4, 0, 100);
  const qualityScore = clampScore(stock.trustScore + highImpact * 3 - cautionImpact * 5, 0, 100);
  const valuationRisk = clampScore(35 + Math.abs(stock.change) * 8 + stock.riskScore * 0.35 + cautionImpact * 10, 0, 100);
  const momentumSupport = clampScore(45 + Math.max(stock.change, 0) * 8 + (6 - stock.volumeRank) * 4 + highImpact * 3, 0, 100);
  const fundamentalScore = clampScore(
    dataCoverage * 0.3 + qualityScore * 0.25 + momentumSupport * 0.25 + (100 - valuationRisk) * 0.2,
    0,
    100,
  );
  const grade = fundamentalScore >= 78 ? "우수" : fundamentalScore >= 64 ? "양호" : fundamentalScore >= 50 ? "중립" : "주의";
  const positive = highImpact + (stock.volumeRank <= 2 ? 1 : 0) + (stock.trustScore >= 75 ? 1 : 0);
  const negative = cautionImpact + (stock.riskScore >= 70 ? 1 : 0) + (Math.abs(stock.change) >= 8 ? 1 : 0);

  return {
    grade,
    summary:
      dartCount > 0
        ? `최근 DART 공시 ${dartCount}건과 공개 시세를 함께 보면, 이 종목은 ${grade} 구간입니다. 공시 기반 근거는 ${disclosureQuality === "high" ? "충분한 편" : disclosureQuality === "medium" ? "보통" : "아직 제한적"}이고, 단기 가격 부담은 ${valuationRisk >= 70 ? "높습니다" : valuationRisk >= 50 ? "보통입니다" : "낮은 편입니다"}.`
        : "아직 DART 공시 데이터가 연결되지 않아 공개 시세와 뉴스 중심의 예비 분석입니다.",
    opinion:
      positive > negative
        ? "근거가 아예 없는 테마성 움직임보다는 낫습니다. 다만 매수 판단은 최근 공시 원문과 다음 실적 확인 후로 미루는 편이 안전합니다."
        : positive === negative
          ? "좋은 신호와 주의 신호가 섞여 있습니다. 지금은 확신보다 관찰이 더 어울리는 구간입니다."
          : "단기 관심은 높지만 위험 신호가 더 큽니다. 펀더먼털 투자 관점에서는 추격보다 원문 확인과 가격 안정 확인이 먼저입니다.",
    metrics: [
      {
        label: "데이터 완성도",
        value: `${dataCoverage}/100`,
        status: dataCoverage >= 75 ? "high" : dataCoverage >= 55 ? "medium" : "low",
        plain: "분석에 필요한 자료가 얼마나 채워졌는지 보는 점수입니다.",
        formula: "정확성 점수 + DART 공시 보정 + 주요 공시 보정 - 주의 공시 감점",
      },
      {
        label: "사업 근거 강도",
        value: `${qualityScore}/100`,
        status: qualityScore >= 75 ? "high" : qualityScore >= 55 ? "medium" : "low",
        plain: "공시와 거래량이 실제 판단 근거로 쓸 만한지 보는 점수입니다.",
        formula: "신뢰도 + 사업/실적 공시 가점 - 주의 공시 감점",
      },
      {
        label: "가격 부담",
        value: `${valuationRisk}/100`,
        status: valuationRisk >= 70 ? "danger" : valuationRisk >= 50 ? "medium" : "low",
        plain: "가격이 이미 빠르게 움직여 추격 매수 부담이 있는지 봅니다.",
        formula: "기본 부담 + 등락률 보정 + 위험지수 보정 + 주의 공시 가점",
      },
      {
        label: "수급 지지",
        value: `${momentumSupport}/100`,
        status: momentumSupport >= 75 ? "high" : momentumSupport >= 55 ? "medium" : "low",
        plain: "거래량과 상승 흐름이 종목 관심을 뒷받침하는지 봅니다.",
        formula: "기본 점수 + 상승률 보정 + 거래량 순위 보정 + 긍정 공시 보정",
      },
    ],
    concepts: [
      {
        title: "펀더먼털",
        description: "회사의 매출, 이익, 재무상태, 사업 경쟁력처럼 가격 뒤에 있는 실제 체력을 보는 분석입니다.",
        easy: "주가가 인기투표라면, 펀더먼털은 그 회사가 실제로 돈을 잘 벌고 버틸 수 있는지 보는 건강검진입니다.",
      },
      {
        title: "공시",
        description: "회사가 투자자에게 의무적으로 공개하는 공식 문서입니다. 사업 변화, 지분 변화, 실적, 계약 같은 정보가 들어갑니다.",
        easy: "소문이 아니라 회사가 공식적으로 낸 문서라서, 뉴스보다 먼저 확인해야 하는 1차 자료입니다.",
      },
      {
        title: "가격 부담",
        description: "좋은 회사라도 주가가 너무 빨리 오르면 단기적으로 손실 위험이 커질 수 있다는 뜻입니다.",
        easy: "좋은 물건도 너무 비싸게 사면 좋은 투자가 아닐 수 있습니다.",
      },
    ],
    checklist: [
      {
        label: "최근 공시 확인",
        passed: dartCount > 0,
        detail: dartCount > 0 ? `최근 공시 ${dartCount}건을 확인했습니다.` : "공시 원문 연결이 아직 필요합니다.",
      },
      {
        label: "거래량 관심",
        passed: volumeQuality !== "low",
        detail: stock.volumeRank <= 2 ? "거래량 상위권으로 시장 관심이 큽니다." : "거래량은 보통 수준입니다.",
      },
      {
        label: "주의 공시",
        passed: cautionImpact === 0,
        detail: cautionImpact ? `주의 성격 공시 ${cautionImpact}건이 있어 원문 확인이 필요합니다.` : "강한 주의 공시는 아직 감지되지 않았습니다.",
      },
      {
        label: "추격 부담",
        passed: valuationRisk < 70,
        detail: valuationRisk >= 70 ? "단기 가격 부담이 큽니다." : "가격 부담은 관리 가능한 범위입니다.",
      },
    ],
    caveats: [
      "현재 무료 공개 데이터 기반이라 정식 재무제표 항목 전체를 계산하지는 않습니다.",
      "PER, PBR, ROE, 부채비율 같은 정밀 지표는 재무제표 API 연결 후 정확도가 올라갑니다.",
      "이 화면은 투자 판단 보조 도구이며 매수·매도 추천이 아닙니다.",
    ],
  };
}

function rowToStock(row: MarketRow, index: number): Stock {
  const riskScore = Math.min(92, Math.max(18, Math.round(Math.abs(row.changeRate) * 9 + index * 5 + 24)));
  const trustScore = row.volume > 1_000_000 ? 78 : 66;
  const volumeText = row.volume.toLocaleString("ko-KR");
  const marketLabel = row.market === "KOSPI" ? "코스피" : "코스닥";

  return {
    code: row.code,
    name: row.name,
    sector: marketLabel,
    price: row.price.toLocaleString("ko-KR"),
    change: row.changeRate,
    volumeRank: index + 1,
    surgeRank: index + 1,
    riskRank: riskScore > 70 ? 1 : riskScore > 50 ? 2 : 3,
    riskScore,
    trustScore,
    accuracyScore: 62,
    verdict:
      row.changeRate >= 0
        ? `무료 공개 시세 기준 거래량 상위. 상승률 ${row.changeRate.toFixed(2)}%, 거래량 ${volumeText}주.`
        : `무료 공개 시세 기준 거래량 상위. 하락률 ${Math.abs(row.changeRate).toFixed(2)}%, 거래량 ${volumeText}주.`,
    dart: [
      {
        title: "OpenDART API 키 미설정",
        date: "최근 30일",
        type: "공시",
        summary: "DART_API_KEY를 설정하면 최근 공시가 자동 조회됩니다. 현재는 공개 시세 기반 화면입니다.",
        impact: "low",
      },
    ],
    technicals: [
      `${marketLabel} 거래대금/거래량 상위권`,
      `등락률 ${row.changeRate.toFixed(2)}%`,
      `거래량 ${volumeText}주`,
    ],
    fundamentals: [
      "무료 공개 소스만으로는 재무 지표 자동 산출 제한",
      "DART 사업보고서 연결 후 매출/영업이익률 확장 가능",
      "상용 전에는 데이터 출처와 지연 여부 표기 필요",
    ],
    reports: [
      {
        broker: "공개 리포트 연결 대기",
        opinion: "참고",
        target: "-",
        summary: "증권사 리포트는 저작권/배포권 이슈가 있어 공개 RSS 또는 링크 중심으로 연결하는 것이 안전합니다.",
        confidence: "low",
      },
    ],
    sentiment: {
      crowd: row.changeRate >= 3 ? "관심 급증" : row.changeRate <= -3 ? "주의 확대" : "중립",
      score: Math.min(95, Math.round(Math.abs(row.changeRate) * 10 + 40)),
      keywords: [marketLabel, "거래량", row.changeRate >= 0 ? "상승" : "하락"],
      caution: "현재 여론은 뉴스 RSS와 검색 결과 기반으로만 보조 판단해야 합니다.",
    },
    news: [
      {
        title: `${row.name} 관련 뉴스 로딩 중`,
        source: "Google News RSS",
        time: "조회 중",
        url: `https://news.google.com/search?q=${encodeURIComponent(`${row.name} 주가`)}&hl=ko&gl=KR&ceid=KR:ko`,
      },
    ],
  };
}

function formatNewsTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "방금";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDartDate(value: string) {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [liveStocks, setLiveStocks] = useState<Stock[]>(stocks);
  const [selectedCode, setSelectedCode] = useState(stocks[0].code);
  const [dataStatus, setDataStatus] = useState("무료 공개 데이터 연결 중");
  const selected = liveStocks.find((stock) => stock.code === selectedCode) ?? liveStocks[0];
  const fundamentalAnalysis = useMemo(() => buildFundamentalAnalysis(selected), [selected]);
  const ranking = useMemo(
    () =>
      [...liveStocks].sort(
        (a, b) =>
          b.change - a.change ||
          a.volumeRank - b.volumeRank ||
          b.riskScore - a.riskScore,
      ),
    [liveStocks],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMarket() {
      try {
        const response = await fetch("/api/market");
        if (!response.ok) throw new Error(`market ${response.status}`);
        const payload = (await response.json()) as { rows: MarketRow[] };
        const rows = payload.rows
          .filter((row) => row.price > 0 && row.volume > 0)
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 5);
        if (!rows.length) throw new Error("empty market rows");
        const nextStocks = rows.map(rowToStock);
        if (!cancelled) {
          setLiveStocks(nextStocks);
          setSelectedCode(nextStocks[0].code);
          setDataStatus("네이버 금융 공개 페이지 polling 데이터 사용 중");
        }
      } catch {
        if (!cancelled) setDataStatus("공개 데이터 조회 실패 - fallback 데이터 표시 중");
      }
    }

    loadMarket();
    const timer = window.setInterval(loadMarket, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSecondaryData() {
      const [newsResult, dartResult] = await Promise.allSettled([
        fetch(`/api/news?name=${encodeURIComponent(selected.name)}`).then((res) => res.json()),
        fetch(`/api/dart?code=${selected.code}`).then((res) => res.json()),
      ]);

      if (cancelled) return;

      setLiveStocks((current) =>
        current.map((stock) => {
          if (stock.code !== selected.code) return stock;

          const news =
            newsResult.status === "fulfilled" && Array.isArray(newsResult.value.items)
              ? newsResult.value.items.map((item: NewsItem) => ({
                  title: item.title,
                  source: item.source,
                  time: formatNewsTime(item.time),
                  url: item.url,
                }))
              : stock.news;

          const dart =
            dartResult.status === "fulfilled" &&
            Array.isArray(dartResult.value.items) &&
            dartResult.value.items.length
              ? dartResult.value.items
              : stock.dart;
          const dartSignals =
            dartResult.status === "fulfilled" &&
            Array.isArray(dartResult.value.items) &&
            dartResult.value.items.length
              ? applyDartSignals(stock, dartResult.value.items)
              : null;

          return {
            ...stock,
            news,
            dart: dartSignals?.dart ?? dart,
            riskScore: dartSignals?.riskScore ?? stock.riskScore,
            riskRank: dartSignals?.riskRank ?? stock.riskRank,
            trustScore: dartSignals?.trustScore ?? stock.trustScore,
            accuracyScore: dartSignals?.accuracyScore ?? stock.accuracyScore,
            fundamentals: dartSignals?.fundamentals ?? stock.fundamentals,
            reports: dartSignals?.reports ?? stock.reports,
            verdict: dartSignals?.verdict ?? stock.verdict,
          };
        }),
      );
    }

    loadSecondaryData();
    return () => {
      cancelled = true;
    };
  }, [selected.code, selected.name]);

  return (
    <main className={theme}>
      <section className="shell">
        <header className="topbar">
          <button className="brand" onClick={() => setSelectedCode(liveStocks[0].code)}>
            <Sparkles size={20} />
            <span>개꿀종목</span>
          </button>
          <button
            className="iconButton"
            aria-label="테마 변경"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">공시 + 시세 + 리포트 + 대중 의견</p>
            <h1>오늘 볼 종목을 근거와 위험까지 한 번에 압축</h1>
          </div>
          <div className="searchBox">
            <Search size={18} />
            <span>{dataStatus}</span>
          </div>
        </section>

        <section className="layout">
          <aside className="dashboard">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">TOP 5</p>
                <h2>인기 종목</h2>
              </div>
              <TrendingUp size={22} />
            </div>
            <div className="stockList">
              {ranking.map((stock, index) => (
                <button
                  key={stock.code}
                  className={`stockCard ${stock.code === selected.code ? "active" : ""}`}
                  onClick={() => setSelectedCode(stock.code)}
                >
                  <div className="rank">{index + 1}</div>
                  <div className="stockMain">
                    <strong>{stock.name}</strong>
                    <span>
                      {stock.code} · {stock.sector}
                    </span>
                  </div>
                  <div className="stockMetric">
                    <strong>+{stock.change}%</strong>
                    <span>위험 {stock.riskScore}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="detail">
            <button className="backButton" onClick={() => setSelectedCode(liveStocks[0].code)}>
              <ChevronLeft size={16} />
              대시보드
            </button>

            <div className="detailHero">
              <div>
                <p className="eyebrow">{selected.sector}</p>
                <h2>{selected.name}</h2>
                <p className="price">
                  {selected.price}원 <span>+{selected.change}%</span>
                </p>
              </div>
              <ScoreRing value={selected.trustScore} label="신뢰도" explanation={metricExplanations.trust} />
            </div>

            <p className="verdict">{selected.verdict}</p>

            <div className="metricGrid">
              <Metric
                icon={<Volume2 />}
                label="거래량 순위"
                value={`${selected.volumeRank}위`}
                tone="info"
                explanation={metricExplanations.volumeRank}
              />
              <Metric
                icon={<TrendingUp />}
                label="급등 순위"
                value={`${selected.surgeRank}위`}
                tone="good"
                explanation={metricExplanations.surgeRank}
              />
              <Metric
                icon={<AlertTriangle />}
                label="위험지수"
                value={`${selected.riskScore}/100`}
                tone="danger"
                explanation={metricExplanations.risk}
              />
              <Metric
                icon={<ShieldCheck />}
                label="정확성"
                value={`${selected.accuracyScore}%`}
                tone="safe"
                explanation={metricExplanations.accuracy}
              />
            </div>

            <div className="analysisGrid">
              <Panel icon={<FileSearch />} title="DART 공시 분석">
                {selected.dart.map((item) => (
                  <article className="compactItem" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.date} · {item.type}</span>
                    </div>
                    <p>{item.summary}</p>
                    <span className={`pill ${item.impact}`}>{levelText[item.impact]}</span>
                  </article>
                ))}
              </Panel>

              <Panel icon={<Activity />} title="시세 API 분석">
                <Column title="테크니컬" items={selected.technicals} />
                <Column title="펀더멘털" items={selected.fundamentals} />
              </Panel>

              <Panel icon={<Building2 />} title="증권사 리포트">
                {selected.reports.map((report) => (
                  <article className="compactItem" key={report.broker}>
                    <div>
                      <strong>
                        {report.broker} · {report.opinion}
                      </strong>
                      <span>목표가 {report.target}원</span>
                    </div>
                    <p>{report.summary}</p>
                    <span className={`pill ${report.confidence}`}>{levelText[report.confidence]}</span>
                  </article>
                ))}
              </Panel>

              <Panel icon={<Users />} title="실시간 대중 의견">
                <div className="sentiment">
                  <div>
                    <strong>{selected.sentiment.crowd}</strong>
                    <span className="inlineMetric">
                      언급 강도 {selected.sentiment.score}/100
                      <InfoTip text={metricExplanations.sentiment} />
                    </span>
                  </div>
                  <div className="keywordRow">
                    {selected.sentiment.keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  <p>{selected.sentiment.caution}</p>
                </div>
              </Panel>
            </div>

            <FundamentalDetail analysis={fundamentalAnalysis} stock={selected} />

            <Panel icon={<Newspaper />} title="최근 뉴스 RSS Preview" wide>
              <div className="newsList">
                {selected.news.map((news) => (
                  <a href={news.url} target="_blank" rel="noreferrer" key={news.title}>
                    <div>
                      <strong>{news.title}</strong>
                      <span>
                        {news.source} · {news.time}
                      </span>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                ))}
              </div>
            </Panel>
          </section>
        </section>
      </section>
    </main>
  );
}

function ScoreRing({
  value,
  label,
  explanation,
}: {
  value: number;
  label: string;
  explanation: string;
}) {
  return (
    <div className="scoreRing" style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}>
      <strong>{value}</strong>
      <span>
        {label}
        <InfoTip text={explanation} />
      </span>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
  explanation,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  explanation: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      {icon}
      <span className="metricLabel">
        {label}
        <InfoTip text={explanation} />
      </span>
      <strong>{value}</strong>
    </article>
  );
}

function FundamentalDetail({
  analysis,
  stock,
}: {
  analysis: FundamentalAnalysis;
  stock: Stock;
}) {
  return (
    <section className="fundamentalDetail">
      <div className="fundamentalHeader">
        <div>
          <p className="eyebrow">FUNDAMENTAL DEEP DIVE</p>
          <h3>{stock.name} 펀더먼털 상세 분석</h3>
        </div>
        <div className={`gradeBadge ${analysis.grade === "주의" ? "danger" : analysis.grade === "우수" ? "high" : "medium"}`}>
          {analysis.grade}
        </div>
      </div>

      <p className="fundamentalSummary">{analysis.summary}</p>

      <div className="fundamentalMetrics">
        {analysis.metrics.map((metric) => (
          <article className="fundamentalMetric" key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong className={metric.status}>{metric.value}</strong>
            </div>
            <p>{metric.plain}</p>
            <small>{metric.formula}</small>
          </article>
        ))}
      </div>

      <div className="fundamentalSections">
        <section>
          <h4>개념 설명</h4>
          <div className="conceptList">
            {analysis.concepts.map((concept) => (
              <article key={concept.title}>
                <strong>{concept.title}</strong>
                <p>{concept.description}</p>
                <span>{concept.easy}</span>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h4>투자 전 체크리스트</h4>
          <div className="checkList">
            {analysis.checklist.map((item) => (
              <article className={item.passed ? "passed" : "blocked"} key={item.label}>
                <strong>{item.passed ? "확인" : "주의"}</strong>
                <div>
                  <b>{item.label}</b>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="opinionBox">
        <strong>종합 의견</strong>
        <p>{analysis.opinion}</p>
      </div>

      <div className="caveatBox">
        {analysis.caveats.map((caveat) => (
          <span key={caveat}>{caveat}</span>
        ))}
      </div>
    </section>
  );
}

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ["bottom", "top", "right", "left"], padding: 12 }),
      shift({ padding: 12 }),
      size({
        padding: 12,
        apply({ availableWidth, elements }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.min(320, availableWidth)}px`,
          });
        },
      }),
    ],
  });

  return (
    <span className="infoTip" onMouseLeave={() => setOpen(false)}>
      <button
        ref={refs.setReference}
        type="button"
        aria-label={text}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </button>
      {open ? (
        <FloatingPortal>
          <span ref={refs.setFloating} className={`tipBubble ${themeClassName()}`} style={floatingStyles}>
            {text}
          </span>
        </FloatingPortal>
      ) : null}
    </span>
  );
}

function themeClassName() {
  const themedRoot = document.querySelector("main.dark") ? "dark" : "light";
  return `tipBubbleTheme ${themedRoot}`;
}

function Panel({
  icon,
  title,
  children,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`panel ${wide ? "wide" : ""}`}>
      <div className="panelTitle">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="column">
      <strong>{title}</strong>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
