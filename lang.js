/* 언어 전환 (한국어 · English)
   - 주소의 ?lang=en|ko 가 있으면 그 언어, 없으면 상단 버튼으로 고른 언어 (기본 한국어)
   - 화면 문구는 tx('한국어', 'English'), 여행지 데이터는 data-en*.js를 아래 함수로 덮어씀
   - 한국어 이름(d.ko, s.ko)은 저장·검색·공유에 쓰는 식별자라 바꾸지 않고, 표시용 이름(name)만 따로 둠 */
const URL_LANG = new URLSearchParams(location.search).get('lang');
const SAVED_LANG = (() => { try { return JSON.parse(localStorage.getItem('tr.lang')) === 'en' ? 'en' : 'ko'; } catch { return 'ko'; } })();
const LANG = URL_LANG === 'en' || URL_LANG === 'ko' ? URL_LANG : SAVED_LANG;
const EN = LANG === 'en';
const tx = (ko, en) => EN ? en : ko;   // 지도 라이브러리(Leaflet)의 전역 L과 겹치지 않는 이름
// 저장해 둔 언어와 다르게 보고 있으면 주소에 언어를 남겨 새로고침·공유해도 유지
const LANG_QUERY = EN || LANG !== SAVED_LANG ? 'lang=' + LANG : '';
const withLang = url => LANG_QUERY ? url + (url.includes('?') ? '&' : '?') + LANG_QUERY : url;
const plural = (n, word, many) => `${n} ${n === 1 ? word : many || word + 's'}`;

// "약 2시간 20분" → "about 2h 20m"
const enFlightTime = t => String(t || '').replace('약 ', 'about ').replace(/(\d+)시간/g, '$1h').replace(/(\d+)분/g, '$1m')
  .replace('(시즌 직항)', '(seasonal nonstop)').replace('(주로 경유)', '(usually with a transfer)').replace('경유', 'via transfer');

const EN_SPOT_NAMES = new Map();   // 한국어 명소 이름 → 영어 이름 (보관함처럼 이름만 저장한 곳에서 사용)
const spotTitle = ko => EN && EN_SPOT_NAMES.get(ko) || ko;
// data.js의 "a;b;c"와 같은 순서의 영어 목록을 덮어씀. 개수가 다르면(데이터만 고친 경우) 한국어 그대로
function localizeList(text, list) {
  if (!EN || !text) return list;
  const en = text.split(';');
  if (en.length !== list.length) return list;
  return list.map((item, i) => { const [name, d] = en[i].split('|'); return { ...item, n: name, d }; });
}
function localizeSpots(code, list) {
  const en = EN && typeof EN_SPOTS !== 'undefined' && EN_SPOTS[code] ? EN_SPOTS[code].split(';') : [];
  return list.map((s, i) => {
    if (en.length !== list.length) return s;
    const [name, d] = en[i].split('|');
    return { ...s, name, d, g: s.g && (EN_GROUPS[s.g] || s.g) };
  });
}
// 여행지 데이터(DESTS · INFO · CITY_SPOTS)를 영어로
function localizeData(dests) {
  Object.entries(CITY_SPOTS).forEach(([code, v]) => {
    const en = (EN_SPOTS[code] || '').split(';'), ko = v.split(';');
    if (en.length === ko.length) ko.forEach((s, i) => EN_SPOT_NAMES.set(s.split('|')[0], en[i].split('|')[0]));
  });
  dests.forEach(d => {
    d.aps.forEach(a => { a.time = enFlightTime(a.time); });
    const row = EN_DEST[d.ko]; if (!row) return;
    const [name, tagline, airlines, visa, tz, season, plug, lang, tip, tips, aps, areas] = row.split('|');
    Object.assign(d, { name, tagline, airlines, visa, tz });
    Object.assign(d.info, { season, plug, lang, tip, tips: tips.split('^') });
    const list = aps.split('^');
    if (list.length === d.aps.length) d.aps.forEach((a, i) => {
      const [city, full] = list[i].split('/');
      Object.assign(a, { koName: a.name, city, name: full });
    });
    const en = areas ? areas.split('^') : [];
    if (en.length === (d.areas || []).length) d.areas = d.areas.map((a, i) => { const [n, desc] = en[i].split(':'); return { ...a, n, d: desc }; });
  });
}

/* ---------- 화면에 미리 적혀 있는 문구 (index.html의 data-en*) ---------- */
(function applyStaticText() {
  const btn = document.getElementById('langBtn');
  if (btn) btn.addEventListener('click', () => {
    const next = EN ? 'ko' : 'en';
    try { localStorage.setItem('tr.lang', JSON.stringify(next)); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang', next);
    location.assign(url);
  });
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'Maybe Go · See places on video';
  document.querySelector('meta[name="description"]')?.setAttribute('content', 'Type a destination to preview its sights on short videos, with exchange rates, weather, flights and hotels.');
  const each = (attr, fn) => document.querySelectorAll(`[${attr}]`).forEach(el => fn(el, el.getAttribute(attr)));
  each('data-en', (el, v) => { el.innerHTML = v; });
  each('data-en-label', (el, v) => el.setAttribute('aria-label', v));
  each('data-en-title', (el, v) => el.setAttribute('title', v));
  each('data-en-placeholder', (el, v) => el.setAttribute('placeholder', v));
})();
