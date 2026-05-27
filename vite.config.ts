import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import iconv from "iconv-lite";
import AdmZip from "adm-zip";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type MarketRow = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  volume: number;
  market: "KOSPI" | "KOSDAQ";
};

type CorpCodeRow = {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
};

type PricePoint = {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};

const NAVER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
  referer: "https://finance.naver.com/",
};

const CACHE_DIR = join(process.cwd(), "data", "cache");
const REPORT_CODE = "11011";

function cachePath(...parts: string[]) {
  return join(CACHE_DIR, ...parts);
}

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function readJsonCache<T>(path: string, maxAgeMs?: number): T | null {
  if (!existsSync(path)) return null;
  if (maxAgeMs) {
    const stat = readFileSync(path);
    void stat;
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeJsonCache(path: string, data: unknown) {
  ensureDir(path);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function xmlText(item: string, tag: string) {
  const cdata = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata) return decodeEntities(cdata[1].trim());
  const plain = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return decodeEntities((plain?.[1] ?? "").replace(/<[^>]+>/g, "").trim());
}

function numberFrom(value: string) {
  const normalized = value.replace(/[,+%\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function amountFrom(value: string | undefined) {
  if (!value || value === "-") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function ratio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function parseMarketRows(html: string, market: "KOSPI" | "KOSDAQ") {
  const rows: MarketRow[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html))) {
    const row = rowMatch[1];
    const codeMatch = row.match(/href="\/item\/main\.naver\?code=(\d{6})"/);
    const nameMatch = row.match(/class="tltle">([^<]+)</);
    if (!codeMatch || !nameMatch) continue;

    const numberCells = [...row.matchAll(/<td class="number">([\s\S]*?)<\/td>/g)].map((cell) =>
      cell[1].replace(/<[^>]+>/g, "").trim(),
    );
    const changeText = row.replace(/<[^>]+>/g, " ");
    const rateMatch = changeText.match(/([+-]?\d+(?:\.\d+)?)\s*%/);

    rows.push({
      code: codeMatch[1],
      name: decodeEntities(nameMatch[1].trim()),
      price: numberFrom(numberCells[0] ?? "0"),
      changeRate: rateMatch ? numberFrom(rateMatch[1]) : 0,
      volume: numberFrom(numberCells[5] ?? numberCells[4] ?? "0"),
      market,
    });
  }

  return rows;
}

async function getMarketRows() {
  const pages = await Promise.all(
    [
      ["KOSPI", "0"],
      ["KOSDAQ", "1"],
    ].map(async ([market, sosok]) => {
      const response = await fetch(
        `https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&page=1`,
        { headers: NAVER_HEADERS },
      );
      const html = iconv.decode(Buffer.from(await response.arrayBuffer()), "euc-kr");
      return parseMarketRows(html, market as "KOSPI" | "KOSDAQ");
    }),
  );

  return pages.flat();
}

async function getGoogleNews(stockName: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${stockName} 주가`,
  )}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetch(url, { headers: NAVER_HEADERS });
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5).map((match) => {
    const item = match[1];
    const title = xmlText(item, "title");
    const link = xmlText(item, "link");
    const pubDate = xmlText(item, "pubDate");
    const source = xmlText(item, "source") || "Google News";
    return { title, url: link, source, time: pubDate };
  });
}

async function getDartDisclosures(stockCode: string) {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) return [];

  const today = new Date();
  const end = today.toISOString().slice(0, 10).replace(/-/g, "");
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30);
  const start = startDate.toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&bgn_de=${start}&end_de=${end}&stock_code=${stockCode}&page_count=5`;
  const response = await fetch(url);
  const payload = await response.json();
  return Array.isArray(payload.list)
    ? payload.list.map((item: any) => ({
        title: item.report_nm,
        date: item.rcept_dt,
        type: item.corp_cls,
        url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
      }))
    : [];
}

async function getCorpCodeMap() {
  const apiKey = process.env.DART_API_KEY;
  const path = cachePath("dart", "corp-codes.json");
  const cached = readJsonCache<CorpCodeRow[]>(path);
  if (cached?.length) return cached;
  if (!apiKey) return [];

  const response = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`);
  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));
  const xml = zip.getEntries()[0]?.getData().toString("utf-8") ?? "";
  const rows = [...xml.matchAll(/<list>([\s\S]*?)<\/list>/g)]
    .map((match) => {
      const block = match[1];
      const get = (tag: string) => block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? "";
      return {
        corp_code: get("corp_code"),
        corp_name: get("corp_name"),
        stock_code: get("stock_code"),
        modify_date: get("modify_date"),
      };
    })
    .filter((row) => row.stock_code);
  writeJsonCache(path, rows);
  return rows;
}

async function getDartFundamentals(stockCode: string) {
  const apiKey = process.env.DART_API_KEY;
  const year = String(new Date().getFullYear() - 1);
  const path = cachePath("dart", "fundamentals", `${stockCode}-${year}.json`);
  const cached = readJsonCache<any>(path);
  if (cached) return cached;
  if (!apiKey) return { source: "dart-key-missing", accounts: [], metrics: null };

  const corp = (await getCorpCodeMap()).find((row) => row.stock_code === stockCode);
  if (!corp) return { source: "corp-code-missing", accounts: [], metrics: null };

  const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corp.corp_code}&bsns_year=${year}&reprt_code=${REPORT_CODE}`;
  const payload = await fetch(url).then((res) => res.json());
  const list = Array.isArray(payload.list) ? payload.list : [];
  const preferred = list.some((item: any) => item.fs_div === "CFS")
    ? list.filter((item: any) => item.fs_div === "CFS")
    : list;
  const account = (name: string) =>
    amountFrom(
      preferred.find((item: any) => item.account_nm === name || String(item.account_nm).includes(name))?.thstrm_amount,
    );
  const revenue = account("매출액");
  const operatingIncome = account("영업이익");
  const netIncome = account("당기순이익");
  const assets = account("자산총계");
  const liabilities = account("부채총계");
  const equity = account("자본총계");
  const processed = {
    source: "opendart-fnlttSinglAcnt",
    stockCode,
    corp,
    year,
    reportCode: REPORT_CODE,
    storedAt: new Date().toISOString(),
    accounts: preferred,
    metrics: {
      revenue,
      operatingIncome,
      netIncome,
      assets,
      liabilities,
      equity,
      operatingMargin: ratio(operatingIncome, revenue),
      netMargin: ratio(netIncome, revenue),
      debtRatio: ratio(liabilities, equity),
      roe: ratio(netIncome, equity),
    },
  };
  writeJsonCache(path, processed);
  return processed;
}

function parseNaverChart(text: string): PricePoint[] {
  const rows = [...text.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => match[1].split(",").map((part) => part.trim().replace(/^"|"$/g, "")))
    .filter((cols) => /^\d{8}$/.test(cols[0]) && cols.length >= 6);
  return rows.map((cols) => ({
    date: `${cols[0].slice(0, 4)}-${cols[0].slice(4, 6)}-${cols[0].slice(6, 8)}`,
    close: numberFrom(cols[4]),
    open: numberFrom(cols[1]),
    high: numberFrom(cols[2]),
    low: numberFrom(cols[3]),
    volume: numberFrom(cols[5]),
  }));
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function getTechnicalIndicators(stockCode: string) {
  const path = cachePath("market", "prices", `${stockCode}.json`);
  const cached = readJsonCache<any>(path);
  if (cached) return cached;

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 220);
  const format = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${stockCode}&requestType=1&startTime=${format(start)}&endTime=${format(end)}&timeframe=day`;
  const text = iconv.decode(Buffer.from(await fetch(url, { headers: NAVER_HEADERS }).then((res) => res.arrayBuffer())), "euc-kr");
  const prices = parseNaverChart(text);
  const closes = prices.map((point) => point.close).filter(Boolean);
  const volumes = prices.map((point) => point.volume).filter(Boolean);
  const latest = prices.at(-1) ?? null;
  const recent20 = prices.slice(-20);
  const processed = {
    source: "naver-siseJson",
    stockCode,
    storedAt: new Date().toISOString(),
    prices,
    indicators: {
      latestClose: latest?.close ?? null,
      ma5: average(closes.slice(-5)),
      ma20: average(closes.slice(-20)),
      ma60: average(closes.slice(-60)),
      v25: average(volumes.slice(-25)),
      support20: recent20.length ? Math.min(...recent20.map((point) => point.low)) : null,
      resistance20: recent20.length ? Math.max(...recent20.map((point) => point.high)) : null,
    },
  };
  writeJsonCache(path, processed);
  return processed;
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [
      react(),
      {
        name: "free-market-data-proxy",
        configureServer(server) {
        server.middlewares.use("/api/market", async (_req, res) => {
          try {
            const rows = await getMarketRows();
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ source: "naver-finance", rows }));
          } catch (error) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : "market fetch failed",
              }),
            );
          }
        });

        server.middlewares.use("/api/news", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const name = url.searchParams.get("name") ?? "삼성전자";
            const items = await getGoogleNews(name);
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ source: "google-news-rss", items }));
          } catch (error) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : "news fetch failed",
              }),
            );
          }
        });

        server.middlewares.use("/api/dart", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const code = url.searchParams.get("code") ?? "005930";
            const items = await getDartDisclosures(code);
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({
                source: process.env.DART_API_KEY ? "opendart" : "dart-key-missing",
                items,
              }),
            );
          } catch (error) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : "dart fetch failed",
              }),
            );
          }
        });

        server.middlewares.use("/api/fundamentals", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const code = url.searchParams.get("code") ?? "005930";
            const data = await getDartFundamentals(code);
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify(data));
          } catch (error) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : "fundamentals fetch failed",
              }),
            );
          }
        });

        server.middlewares.use("/api/technicals", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const code = url.searchParams.get("code") ?? "005930";
            const data = await getTechnicalIndicators(code);
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify(data));
          } catch (error) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : "technicals fetch failed",
              }),
            );
          }
        });
        },
      },
    ],
    server: {
      allowedHosts: true,
    },
  };
});
