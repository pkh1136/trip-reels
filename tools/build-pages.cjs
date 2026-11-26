// 국가별 공유용 페이지 생성: /japan/ 처럼 주소를 열면 미리보기(OG 태그)가 보이고 본 화면(?d=japan)으로 이동
// 실행: node tools/build-pages.cjs   (data.js를 고친 뒤 다시 실행)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';this.DESTS=DESTS;this.INFO=INFO;', ctx);
const BASE = 'https://pkh1136.github.io/trip-reels/';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let n = 0;
for (const d of ctx.DESTS) {
  const slug = ctx.INFO[d.ko]?.slug; if (!slug) continue;
  const title = `${d.ko} 여행 · 트립릴스`;
  const desc = `${d.tagline} — ${d.spots.slice(0, 4).map(s => s.ko).join(', ')} 영상과 환율·날씨·항공편·호텔 정보`;
  const target = `../?d=${slug}`;
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}?d=${slug}">
<meta property="og:type" content="website"><meta property="og:site_name" content="트립릴스">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${BASE}og.png"><meta property="og:url" content="${BASE}${slug}/">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="../icon.svg">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.hash)</script>
<style>body{font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#fff;color:#1b2333}</style>
</head><body><a href="${target}">${esc(d.ko)} 여행 보러 가기 →</a></body></html>
`;
  fs.mkdirSync(path.join(root, slug), { recursive: true });
  fs.writeFileSync(path.join(root, slug, 'index.html'), html);
  n++;
}
console.log(`${n}개 국가 페이지 생성`);
