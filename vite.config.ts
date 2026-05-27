import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import iconv from "iconv-lite";

type MarketRow = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  volume: number;
  market: "KOSPI" | "KOSDAQ";
};

const NAVER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
  referer: "https://finance.naver.com/",
};

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

export default defineConfig({
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
      },
    },
  ],
  server: {
    allowedHosts: true,
  },
});
