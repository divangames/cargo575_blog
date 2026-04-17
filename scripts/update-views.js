const fs = require("fs");

const TOKEN = process.env.YANDEX_TOKEN;
const COUNTER_ID = process.env.YANDEX_COUNTER_ID;

if (!TOKEN || !COUNTER_ID) {
  throw new Error("Missing env: YANDEX_TOKEN or YANDEX_COUNTER_ID");
}

if (!fs.existsSync("articles.json")) {
  throw new Error("articles.json not found");
}

const { articles } = JSON.parse(fs.readFileSync("articles.json", "utf8"));
if (!Array.isArray(articles) || !articles.length) {
  throw new Error("articles.json: 'articles' must be non-empty array");
}

function normalizePath(p) {
  if (!p) return "/";
  const s = String(p).trim();
  return (s.startsWith("/") ? s : `/${s}`).replace(/\/+$/, "") || "/";
}

let previous = { views: {} };
if (fs.existsSync("views.json")) {
  try {
    previous = JSON.parse(fs.readFileSync("views.json", "utf8"));
  } catch {
    previous = { views: {} };
  }
}

async function fetchMetrikaRows() {
  const params = new URLSearchParams({
    ids: String(COUNTER_ID),
    metrics: "ym:pv:pageviews",
    dimensions: "ym:pv:URLPath",
    date1: "30daysAgo",
    date2: "today",
    limit: "100000",
    accuracy: "full"
  });

  const url = `https://api-metrika.yandex.net/stat/v1/data?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${TOKEN}` }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Metrika API ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

(async () => {
  const rows = await fetchMetrikaRows();
  const metrikaMap = {};

  for (const row of rows) {
    const pathRaw = row?.dimensions?.[0]?.name;
    const views = Number(row?.metrics?.[0] ?? 0);
    if (!pathRaw) continue;

    const path = normalizePath(decodeURIComponent(pathRaw));
    metrikaMap[path] = Math.max(0, Math.round(views));
  }

  const nextViews = {};
  for (const articlePathRaw of articles) {
    const path = normalizePath(articlePathRaw);
    const oldVal = Number(previous?.views?.[path] || 0);
    const newVal = metrikaMap[path];

    if (Number.isFinite(newVal)) {
      nextViews[path] = Math.max(oldVal, newVal);
      console.log(`OK ${path}: old=${oldVal}, metrika=${newVal}, saved=${nextViews[path]}`);
    } else {
      nextViews[path] = oldVal;
      console.log(`MISS ${path}: keep old=${oldVal}`);
    }
  }

  const out = {
    updatedAt: new Date().toISOString(),
    views: nextViews
  };

  fs.writeFileSync("views.json", JSON.stringify(out, null, 2) + "\n", "utf8");
})();
