/* 트립릴스 앱 — data.js의 DESTS · REGIONS · AIRPORTS · AREAS · CC · INFO 사용 */
'use strict';

/* =========================================================
   공통 도구
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const enc = encodeURIComponent;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withTimeout = (p, ms) => Promise.race([p, sleep(ms).then(() => { throw new Error('timeout'); })]);

// localStorage는 사생활 보호 모드 등에서 막힐 수 있어 항상 try로 감쌈
const store = {
  get(k, d) { try { const v = localStorage.getItem('tr.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tr.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('tr.' + k); } catch {} }
};
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ---------- 날짜 (로컬 시간 기준. toISOString은 UTC라 새벽에 날짜가 하루 밀림) ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const WD = '일월화수목금토';
const fmtD = s => { const d = parseD(s); return `${d.getMonth() + 1}.${d.getDate()}(${WD[d.getDay()]})`; };
const ymd = s => s.replace(/-/g, '');
const yymmdd = s => s.slice(2).replace(/-/g, '');
const dday = s => Math.round((parseD(s) - parseD(today())) / 864e5);

/* =========================================================
   데이터 가공
   ========================================================= */
DESTS.forEach(d => {
  d.info = INFO[d.ko] || {};
  d.slug = d.info.slug || d.ko;
  d.flagImg = `<img class="flag" src="https://flagcdn.com/w80/${CC[d.ko]}.png" alt="" width="20" height="13">`;
  d.aps = (AIRPORTS[d.ko] || `${d.iata}|${d.city}|${d.cityEn}|${d.flight}`).split(';')
    .map(s => { const [code, name, en, time] = s.split('|'); return { code, name, en, time }; });
  d.cur = (d.currency.match(/\(([A-Z]{3})\)/) || [])[1];
});
const POPULAR = ["일본", "베트남", "태국", "대만", "홍콩", "프랑스", "스위스", "미국"];
const destByKo = ko => DESTS.find(d => d.ko === ko);
const destBySlug = s => DESTS.find(d => d.slug === s);
function findDest(q) {
  const n = norm(q);
  if (!n) return null;
  return DESTS.find(d => norm(d.ko) === n || norm(d.city) === n || d.aliases.some(a => norm(a) === n)
                      || d.aps.some(a => norm(a.code) === n || norm(a.en) === n))
      || DESTS.find(d => n.length >= 2 && (norm(d.ko).includes(n) || d.aliases.some(a => norm(a).includes(n))));
}
// 도시 이름·공항코드로 검색했으면 그 도시의 공항을 기본 선택
const airportFor = (d, word) => (word && d.aps.find(a => norm(a.name).includes(norm(word)) || norm(a.en) === norm(word) || norm(a.code) === norm(word))) || d.aps[0];
const cityOf = ap => ap.name.split(' ')[0];
const flightHours = d => { const m = (d.aps[0].time || '').match(/(\d+)시간/); return m ? +m[1] : 99; };

function areasFor(d, ap) {
  if (AREAS[ap.code]) return AREAS[ap.code].split(';').map(s => { const [n, desc, q] = s.split('|'); return { n, d: desc, q }; });
  if (!d.aps || ap.en === d.aps[0].en) return d.areas;   // 대표 공항과 같은 도시 (예: 나리타, 쑹산)
  return [{ n: cityOf(ap) + ' 시내', d: '주요 명소와 교통이 편리한 중심가', q: ap.en }];
}

/* =========================================================
   검색 조건 (마지막 검색값 기억)
   ========================================================= */
const S = Object.assign({ from: 'ICN', trip: 'round', adults: 2, children: 0, infants: 0, direct: false, d1: null, d2: null }, store.get('search', {}));
if (!['ICN', 'GMP'].includes(S.from)) S.from = 'ICN';
if (!S.d1 || S.d1 < today()) { S.d1 = addDays(today(), 30); S.d2 = addDays(S.d1, 4); }   // 기본: 오늘+30일부터 4박
if (!S.d2 || S.d2 <= S.d1) S.d2 = addDays(S.d1, 4);
const saveS = () => store.set('search', S);
const nights = () => S.trip === 'oneway' ? 0 : Math.round((parseD(S.d2) - parseD(S.d1)) / 864e5);
const people = () => S.adults + S.children + S.infants;

function syncForm() {
  $('#from').value = S.from;
  $$('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.trip === S.trip)));
  $('#direct').checked = S.direct;
  $('#dateBtn').innerHTML = S.trip === 'oneway'
    ? `${fmtD(S.d1)} <small>편도</small>`
    : `${fmtD(S.d1)} – ${fmtD(S.d2)} <small>${nights()}박</small>`;
  const parts = [`성인 ${S.adults}`]; if (S.children) parts.push(`소아 ${S.children}`); if (S.infants) parts.push(`유아 ${S.infants}`);
  $('#paxBtn').textContent = parts.join(' · ');
}
function searchChanged() {
  saveS(); syncForm();
  if (current) { renderTravel(); renderInfo(); renderPlan(); }
}

/* ---------- 왕복/편도 · 직항 · 출발 ---------- */
$$('.seg button').forEach(b => b.addEventListener('click', () => { S.trip = b.dataset.trip; searchChanged(); }));
$('#direct').addEventListener('change', e => { S.direct = e.target.checked; searchChanged(); });
$('#from').addEventListener('change', e => { S.from = e.target.value; searchChanged(); });

/* ---------- 팝오버 공통 ---------- */
function openPop(id) {
  $$('.pop').forEach(p => { if (p.id !== id) p.hidden = true; });
  $('#' + id).hidden = false;
}
document.addEventListener('mousedown', e => {
  if (!e.target.closest('.field')) $$('.pop').forEach(p => p.hidden = true);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#viewer').hidden) return;   // 뷰어가 먼저 처리
  if (e.key === 'Escape') $$('.pop').forEach(p => p.hidden = true);
});

/* ---------- 날짜 범위 달력 ---------- */
let calBase, calStart = null, calHover = null;
function openCal() {
  const d = parseD(S.d1); calBase = new Date(d.getFullYear(), d.getMonth(), 1);
  calStart = null; calHover = null; renderCal(); openPop('cal');
}
function renderCal() {
  const months = innerWidth < 700 ? 1 : 2, t = today();
  const a = calStart || S.d1, b = calStart ? (calHover && calHover > calStart ? calHover : null) : (S.trip === 'oneway' ? null : S.d2);
  let html = `<div class="cal-head"><button type="button" class="cal-nav" data-m="-1" aria-label="이전 달">‹</button>
    <b>${S.trip === 'oneway' ? '가는 날을 선택하세요' : calStart ? '오는 날을 선택하세요' : '가는 날을 선택하세요'}</b>
    <button type="button" class="cal-nav" data-m="1" aria-label="다음 달">›</button></div><div class="cal-months">`;
  for (let k = 0; k < months; k++) {
    const m = new Date(calBase.getFullYear(), calBase.getMonth() + k, 1);
    html += `<div class="cal-month"><h5>${m.getFullYear()}년 ${m.getMonth() + 1}월</h5><div class="cal-grid">`
      + [...WD].map((w, i) => `<span class="wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</span>`).join('')
      + '<span></span>'.repeat(m.getDay());
    const last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const s = iso(new Date(m.getFullYear(), m.getMonth(), day));
      const cls = [s === a && 'start', b && s === b && 'end', b && s > a && s < b && 'in', s === t && 'today'].filter(Boolean).join(' ');
      html += `<button type="button" class="day ${cls}" data-d="${s}" ${s < t ? 'disabled' : ''} aria-label="${m.getMonth() + 1}월 ${day}일">${day}</button>`;
    }
    html += '</div></div>';
  }
  html += '</div>';
  if (S.trip === 'round') html += `<div class="cal-foot">${[[2,'2박 3일'],[3,'3박 4일'],[4,'4박 5일'],[6,'6박 7일']].map(([n, l]) =>
    `<button type="button" class="chip sm" data-n="${n}">${l}</button>`).join('')}</div>`;
  $('#cal').innerHTML = html;
}
$('#dateBtn').addEventListener('click', () => $('#cal').hidden ? openCal() : ($('#cal').hidden = true));
$('#cal').addEventListener('click', e => {
  const nav = e.target.closest('.cal-nav');
  if (nav) { calBase.setMonth(calBase.getMonth() + +nav.dataset.m); return renderCal(); }
  const quick = e.target.closest('[data-n]');
  if (quick) { S.d2 = addDays(calStart || S.d1, +quick.dataset.n); if (calStart) S.d1 = calStart; $('#cal').hidden = true; return searchChanged(); }
  const day = e.target.closest('.day'); if (!day || day.disabled) return;
  const s = day.dataset.d;
  if (S.trip === 'oneway') { S.d1 = s; if (S.d2 <= s) S.d2 = addDays(s, 4); $('#cal').hidden = true; return searchChanged(); }
  if (!calStart || s <= calStart) { calStart = s; return renderCal(); }   // 오는 날은 가는 날 이후만 선택 가능
  S.d1 = calStart; S.d2 = s; calStart = null; $('#cal').hidden = true; searchChanged();
});
$('#cal').addEventListener('mouseover', e => {
  const day = e.target.closest('.day'); if (!calStart || !day || day.dataset.d === calHover) return;
  calHover = day.dataset.d; renderCal();
});

/* ---------- 인원 (성인/소아/유아) ---------- */
const PAX = [['adults', '성인', '만 12세 이상', 1, 9], ['children', '소아', '만 2~11세', 0, 8], ['infants', '유아', '만 2세 미만 (좌석 없음)', 0, 4]];
function renderPax() {
  $('#paxPop').innerHTML = PAX.map(([k, n, sub, min, max]) => {
    const lim = k === 'infants' ? Math.min(max, S.adults) : max;
    return `<div class="pax-row"><div><b>${n}</b><small>${sub}</small></div>
      <div class="stepper"><button type="button" data-k="${k}" data-v="-1" ${S[k] <= min ? 'disabled' : ''} aria-label="${n} 줄이기">−</button>
      <output aria-live="polite">${S[k]}</output>
      <button type="button" data-k="${k}" data-v="1" ${S[k] >= lim ? 'disabled' : ''} aria-label="${n} 늘리기">+</button></div></div>`;
  }).join('') + `<button type="button" class="pax-done">완료</button>`;
}
$('#paxBtn').addEventListener('click', () => { if ($('#paxPop').hidden) { renderPax(); openPop('paxPop'); } else $('#paxPop').hidden = true; });
$('#paxPop').addEventListener('click', e => {
  if (e.target.closest('.pax-done')) { $('#paxPop').hidden = true; return; }
  const b = e.target.closest('[data-k]'); if (!b) return;
  S[b.dataset.k] += +b.dataset.v;
  S.infants = Math.min(S.infants, S.adults);   // 유아는 성인 1명당 1명까지
  renderPax(); searchChanged();
});

/* =========================================================
   연관 검색어 (한글 · 영문 · 공항코드)
   ========================================================= */
const hasKo = s => /[가-힣]/.test(s);
const SUG = [];
DESTS.forEach(d => {
  SUG.push({ t: 0, label: d.ko, sub: d.tagline, d, keys: [d.ko, d.city, d.slug, ...d.aliases] });
  const seen = new Map();
  const addCity = (label, keys) => {
    if (label === d.ko) return;
    if (seen.has(label)) return seen.get(label).keys.push(...keys);   // 같은 도시면 검색어(영문·공항코드)만 합침
    const ap = airportFor(d, label), item = { t: 1, label, sub: `${d.ko}${ap && norm(ap.name).includes(norm(label)) ? ' · ' + ap.code : ''}`, d, word: label, keys };
    seen.set(label, item); SUG.push(item);
  };
  d.aliases.filter(hasKo).forEach(a => addCity(a, [a]));
  d.aps.forEach(a => addCity(cityOf(a), [a.name, a.en, a.code]));
  d.spots.forEach(s => SUG.push({ t: 2, label: s.ko, sub: `${d.ko} · ${s.d}`, d, keys: [s.ko, s.en] }));
});
const KIND = ['국가', '도시', '명소'];
let sugItems = [], sugIdx = -1;
function suggest() {
  const q = $('#q').value.trim(), n = norm(q);
  if (!n) {
    const recent = store.get('recent', []).map(destByKo).filter(Boolean);
    const list = [...recent, ...POPULAR.map(destByKo).filter(d => !recent.includes(d))].slice(0, 8);
    sugItems = list.map(d => SUG.find(s => s.t === 0 && s.d === d));
  } else {
    sugItems = SUG.map(s => {
      const l = norm(s.label);
      const score = l.startsWith(n) ? 0 : l.includes(n) ? 1 : s.keys.some(k => norm(k).startsWith(n)) ? 2 : s.keys.some(k => norm(k).includes(n)) ? 3 : -1;
      return { s, score };
    }).filter(x => x.score >= 0).sort((a, b) => a.score - b.score || a.s.t - b.s.t).slice(0, 8).map(x => x.s);
  }
  sugIdx = n && sugItems.length ? 0 : -1;
  const hl = label => { const i = label.indexOf(q);
    return q && i >= 0 ? esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length)) : esc(label); };
  const hasRecent = !n && store.get('recent', []).length;
  $('#suggest').innerHTML = (n ? '' : `<li class="head">${hasRecent ? '최근 본 · 인기 여행지' : '인기 여행지'}</li>`)
    + (sugItems.length ? sugItems.map((s, i) => `
      <li class="opt${i === sugIdx ? ' on' : ''}" role="option" id="sug${i}" aria-selected="${i === sugIdx}" data-i="${i}">
        <span class="ic">${s.t === 0 ? s.d.flagImg : s.t === 1 ? '📍' : '📸'}</span>
        <span class="txt"><b>${hl(s.label)}</b><small>${esc(s.sub)}</small></span>
        <span class="kind">${KIND[s.t]}</span></li>`).join('')
      : `<li class="head empty-sug">'${esc(q)}'에 맞는 여행지가 없어요.<br>Enter를 누르면 영상을 직접 찾아볼게요.</li>`);
  $('#suggest').hidden = false;
  $('#q').setAttribute('aria-expanded', 'true');
  $('#q').setAttribute('aria-activedescendant', sugIdx >= 0 ? 'sug' + sugIdx : '');
}
function hideSuggest() { $('#suggest').hidden = true; $('#q').setAttribute('aria-expanded', 'false'); }
function moveSug(i) {
  sugIdx = i;
  $$('#suggest .opt').forEach((li, k) => { li.classList.toggle('on', k === i); li.setAttribute('aria-selected', String(k === i)); });
  $('#q').setAttribute('aria-activedescendant', 'sug' + i);
  $('#sug' + i)?.scrollIntoView({ block: 'nearest' });
}
function pickSug(s) {
  $('#q').value = s.label; hideSuggest();
  render(s.d, s.word, { spot: s.t === 2 ? s.label : null });
}
$('#q').addEventListener('input', suggest);
$('#q').addEventListener('focus', () => { $$('.pop').forEach(p => p.hidden = true); suggest(); });
$('#q').addEventListener('blur', () => setTimeout(hideSuggest, 150));
$('#q').addEventListener('keydown', e => {
  if ($('#suggest').hidden || !sugItems.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    moveSug((sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + sugItems.length) % sugItems.length);
  } else if (e.key === 'Escape') hideSuggest();
});
$('#suggest').addEventListener('mousedown', e => { const li = e.target.closest('.opt'); if (li) { e.preventDefault(); pickSug(sugItems[+li.dataset.i]); } });
$('#suggest').addEventListener('mousemove', e => { const li = e.target.closest('.opt'); if (li && +li.dataset.i !== sugIdx) moveSug(+li.dataset.i); });

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#q').value.trim(); if (!q) return $('#q').focus();
  const go = $('.go'); go.classList.remove('fly'); void go.offsetWidth; go.classList.add('fly');   // 비행기 이륙 애니메이션
  if (!$('#suggest').hidden && sugIdx >= 0 && sugItems[sugIdx]) return pickSug(sugItems[sugIdx]);
  hideSuggest(); render(q);
});

/* =========================================================
   Wikimedia Commons 영상 · Wikipedia 사진 (결과는 7일간 브라우저에 캐시)
   ========================================================= */
const CACHE_DAYS = 7;
const memo = new Map();
function cached(key, fn) {
  if (memo.has(key)) return memo.get(key);
  const hit = store.get('c:' + key);
  if (hit && Date.now() - hit.t < CACHE_DAYS * 864e5) { const p = Promise.resolve(hit.v); memo.set(key, p); return p; }
  const p = fn().then(v => { store.set('c:' + key, { t: Date.now(), v }); return v; });
  p.catch(() => memo.delete(key));   // 실패는 캐시하지 않음 (다시 시도 가능)
  memo.set(key, p); return p;
}
// 위성사진·관측 영상처럼 여행 영상이 아닌 것은 제외
const NOT_TRAVEL = /\b(cira|goes-?\d*|nasa|noaa|landsat|sentinel|modis|copernicus|satellite|from space|iss\b|radar|himawari|simulation|lecture|interview|press conference|state dinner|president|minister|potus)\b/i;
const words = t => fold(t).split(/[\s-]+/).filter(w => w.length > 3);
function fetchVideos(term, limit = 8) {
  return cached(`v:${term}|${limit}`, async () => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*'
      + '&generator=search&gsrnamespace=6&gsrlimit=' + limit + '&gsrsearch=' + enc('filetype:video ' + term)
      + '&prop=videoinfo&viprop=url|mime|size|derivatives&viurlwidth=640';
    const j = await (await fetch(url)).json();
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.map(pg => {
      const v = pg.videoinfo?.[0]; if (!v) return null;
      const title = pg.title.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' ');
      if (NOT_TRAVEL.test(title)) return null;
      const ders = (v.derivatives || []).filter(x => /webm|mp4/.test(x.type));
      const pick = h => ders.find(x => x.transcodekey && x.transcodekey.startsWith(h));
      const small = pick('480p') || pick('360p') || pick('720p') || pick('240p');
      const big = pick('1080p') || pick('720p') || small;
      if (!small && v.size > 40e6) return null;            // 변환본 없는 큰 원본은 제외
      return { title, src: (small || v).src || v.url, hd: (big || v).src || v.url, poster: v.thumburl, page: v.descriptionurl };
    }).filter(Boolean)
      .map((v, i) => ({ v, i, s: words(term).filter(w => fold(v.title).includes(w)).length }))
      .sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.v);
  });
}
function wikiImage(term) {
  return cached('i:' + term, async () => {
    const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1&gsrsearch='
      + enc(term) + '&prop=pageimages&piprop=thumbnail&pithumbsize=800');
    const j = await r.json(); const pg = Object.values(j.query?.pages || {})[0];
    return pg?.thumbnail?.source || null;
  });
}
// 제목에 명소 이름이 없는 영상(엉뚱한 검색 결과)은 제외
const UNIQUE = new Set("trevi colosseum eiffel louvre matterhorn jungfraujoch lauterbrunnen chillon stonehenge alhambra sagrada acropolis meteora mykonos cappadocia pamukkale bosphorus uluru banff borobudur komodo tegallalang uluwatu zhangjiajie jiufen taroko shilin merlion sentosa kinkaku dotonbori fushimi ayutthaya karnak kawasan boracay niagara versailles cesky guell amalfi giza buckingham hagia santorini shibuya".split(' '));
const termWords = s => fold(s.en).split(/[\s,-]+/).filter(w => w.length >= 3 && !['the', 'and'].includes(w));
function relevant(s, title) {
  const t = fold(title);
  if (s.k) return t.includes(s.k);
  const ws = termWords(s);
  if (ws.some(w => UNIQUE.has(w) && t.includes(w))) return true;
  return ws.filter(w => t.includes(w)).length >= Math.min(2, ws.length);
}
const retryTerm = s => s.k || termWords(s).find(w => UNIQUE.has(w)) || termWords(s).slice(0, 2).join(' ');
async function spotVideos(s) {
  if (s.preset) return s.preset;
  const ok = v => relevant(s, v.title);
  let v = (await fetchVideos(s.en)).filter(ok);
  if (!v.length) v = (await fetchVideos(retryTerm(s))).filter(ok);
  return v;
}

/* =========================================================
   보관함 · 최근 본 여행지 · 내 여행(D-day)
   ========================================================= */
const savedKey = (c, s) => `${c}|${s}`;
const getSaved = () => store.get('saved', []);
const isSaved = (c, s) => getSaved().includes(savedKey(c, s));
function toggleSaved(c, s) {
  const list = getSaved(), k = savedKey(c, s), i = list.indexOf(k);
  i >= 0 ? list.splice(i, 1) : list.push(k);
  store.set('saved', list); updateSavedCount();
  toast(i >= 0 ? `'${s}'을(를) 보관함에서 뺐어요` : `'${s}'을(를) 보관함에 담았어요 ♥`);
  return i < 0;
}
const savedFor = d => getSaved().filter(k => k.startsWith(d.ko + '|')).map(k => k.split('|')[1]);
function updateSavedCount() { $('#savedCount').textContent = getSaved().length; }
function addRecent(ko) {
  const r = store.get('recent', []).filter(x => x !== ko); r.unshift(ko); store.set('recent', r.slice(0, 8));
}
const CHECKS = ['여권 유효기간 (6개월 이상)', '비자·입국 서류', '항공권 예약', '숙소 예약', '환전·해외결제 카드', 'eSIM·유심 / 로밍', '여행자보험', '충전기·변환 플러그'];

/* =========================================================
   화면 전환 (주소: ?d=japan&ap=KIX · 공유 가능)
   ========================================================= */
let current = null, curAp = null;
function setURL(push) {
  const u = new URL(location.href); u.hash = '';
  u.search = current ? (current.custom ? `?q=${enc(current.ko)}` : `?d=${current.slug}${curAp && curAp !== current.aps[0] ? '&ap=' + curAp.code : ''}`) : '';
  history[push ? 'pushState' : 'replaceState'](null, '', u);
}
function route() {
  const p = new URLSearchParams(location.search);
  const legacy = decodeURIComponent(location.hash.slice(1));   // 예전 주소(#일본) 호환
  const d = p.get('d') && (destBySlug(p.get('d')) || findDest(p.get('d')));
  if (d) return render(d, null, { push: false, ap: p.get('ap') });
  if (p.get('q')) return render(p.get('q'), null, { push: false });
  if (legacy && !['main', 'top'].includes(legacy) && !legacy.startsWith('sec-')) return render(legacy, null, { push: false });
  renderHome();
}
addEventListener('popstate', route);

/* =========================================================
   첫 화면
   ========================================================= */
const chip = (d, hot) => `<button type="button" class="chip" data-go="${d.ko}">${d.flagImg}${d.ko}${hot ? '<span class="hot">HOT</span>' : ''}</button>`;
function renderHome() {
  current = null; curAp = null; stopVideos();
  document.title = '트립릴스 · 여행지 영상 미리보기';
  const m = new Date().getMonth() + 1;
  const trip = store.get('trip'), recent = store.get('recent', []).map(destByKo).filter(Boolean);
  const saved = getSaved();
  const goodNow = DESTS.filter(d => d.info.best?.includes(m)).slice(0, 10);
  const easy = DESTS.filter(d => /무비자/.test(d.visa) && flightHours(d) < 5).sort((a, b) => flightHours(a) - flightHours(b));
  let html = '';

  if (trip && destByKo(trip.ko) && trip.d2 >= today()) html += tripCard(trip);
  if (recent.length) html += `<section class="home-sec"><h2 class="sec-h">최근 본 여행지</h2><div class="chips">${recent.map(d => chip(d)).join('')}</div></section>`;
  if (saved.length) html += savedSection();

  html += `<section class="home-sec"><h2 class="sec-h">🔥 지금 인기 여행지</h2>
    <div class="carousel" role="list">${POPULAR.map(destByKo).map(d => `
      <button type="button" class="cover" role="listitem" data-go="${d.ko}" data-cover="${esc(d.spots[0].en)}">
        <span class="cover-img"></span><span class="hot">HOT</span>
        <span class="cover-txt"><b>${d.flagImg}${d.ko}</b><small>${esc(d.tagline)}</small><em>✈ ${esc(d.aps[0].time)}</em></span>
      </button>`).join('')}</div></section>`;

  html += `<section class="home-sec"><h2 class="sec-h">📅 ${m}월에 가기 좋은 곳</h2><div class="chips">${goodNow.map(d => chip(d)).join('')}</div></section>
    <section class="home-sec"><h2 class="sec-h">🛂 무비자 + 비행 5시간 이내</h2><div class="chips">${easy.map(d =>
      `<button type="button" class="chip" data-go="${d.ko}">${d.flagImg}${d.ko}<small>${esc(d.aps[0].time.replace('약 ', ''))}</small></button>`).join('')}</div></section>`;

  html += `<section class="home-sec"><h2 class="sec-h">🌏 전체 여행지</h2>${REGIONS.map(([r, list]) =>
    `<div class="region"><h3>${r}</h3><div class="chips">${list.map(ko => chip(destByKo(ko), POPULAR.includes(ko))).join('')}</div></div>`).join('')}</section>`;

  $('#main').innerHTML = html;
  bindTripCard();
  // 인기 여행지 커버 사진은 보일 때 불러옴
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const box = $('.cover-img', en.target);
    wikiImage(en.target.dataset.cover).then(src => { if (src) box.style.backgroundImage = `url("${src}")`; }).catch(() => {});
  }), { rootMargin: '200px' });
  $$('.cover').forEach(c => io.observe(c));
}
function savedSection() {
  const groups = {};
  getSaved().forEach(k => { const [c, s] = k.split('|'); (groups[c] ||= []).push(s); });
  return `<section class="home-sec" id="savedSec"><h2 class="sec-h">♥ 내 여행 보관함</h2><div class="saved-list">${Object.entries(groups).map(([c, list]) => {
    const d = destByKo(c); if (!d) return '';
    return `<div class="saved-row"><button type="button" class="saved-c" data-go="${c}">${d.flagImg}<b>${c}</b><small>${list.length}곳 · 일정 보기 →</small></button>
      <div class="chips">${list.map(s => `<span class="chip static">${esc(s)}<button type="button" class="x-sm" data-unsave="${esc(c)}|${esc(s)}" aria-label="${esc(s)} 보관함에서 빼기">×</button></span>`).join('')}</div></div>`;
  }).join('')}</div></section>`;
}
function tripCard(t) {
  const d = destByKo(t.ko), n = dday(t.d1), done = CHECKS.filter((_, i) => t.checks?.[i]).length;
  return `<section class="home-sec trip-card" id="tripCard">
    <div class="trip-top"><div><span class="dday">${n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : '여행 중'}</span>
      <h2>${d.flagImg}${esc(t.city || d.ko)} 여행</h2><p>${fmtD(t.d1)}${t.d2 && t.d2 !== t.d1 ? ' – ' + fmtD(t.d2) : ''}</p></div>
      <div class="trip-acts"><button type="button" class="btn" data-go="${d.ko}" data-ap="${t.ap || ''}">여행 보기</button><button type="button" class="btn ghost" id="tripDel">삭제</button></div></div>
    <h3>준비 체크리스트 <small>${done}/${CHECKS.length}</small></h3>
    <div class="checks">${CHECKS.map((c, i) => `<label class="check-item"><input type="checkbox" data-ci="${i}" ${t.checks?.[i] ? 'checked' : ''}> ${c}</label>`).join('')}</div>
  </section>`;
}
function bindTripCard() {
  $('#tripDel')?.addEventListener('click', () => { store.del('trip'); toast('내 여행을 삭제했어요'); renderHome(); });
  $$('#tripCard [data-ci]').forEach(cb => cb.addEventListener('change', () => {
    const t = store.get('trip'); t.checks = t.checks || {}; t.checks[cb.dataset.ci] = cb.checked; store.set('trip', t);
    $('#tripCard h3 small').textContent = `${CHECKS.filter((_, i) => t.checks[i]).length}/${CHECKS.length}`;
  }));
}

/* =========================================================
   여행지 화면
   ========================================================= */
const SECTIONS = [['spots', '🎬 명소'], ['info', '📋 정보'], ['plan', '🗓 일정'], ['flights', '✈️ 항공'], ['hotels', '🏨 호텔'], ['more', '🎟 투어·준비']];
function render(q, word, opts = {}) {
  hideSuggest(); $$('.pop').forEach(p => p.hidden = true); stopVideos();
  const d = typeof q === 'object' ? q : findDest(q);
  if (d) {
    current = d;
    curAp = (opts.ap && d.aps.find(a => a.code === opts.ap)) || airportFor(d, word ?? (typeof q === 'string' ? q : null));
    addRecent(d.ko);
  } else {
    current = { ko: q, custom: true, flagImg: '📍', tagline: '검색한 여행지의 영상을 모아봤어요', spots: null, info: {}, aliases: [],
      aps: [{ code: '', name: q, en: q, time: '' }], areas: [{ n: q + ' 중심가', d: '주요 명소 접근성이 좋은 지역' }] };
    curAp = current.aps[0];
  }
  const c = current, I = c.info, m = new Date().getMonth() + 1;
  setURL(opts.push !== false);
  document.title = `${c.ko} 여행 · 트립릴스`;
  if (!$('#q').value || opts.push === false) $('#q').value = c.ko;
  const trip = store.get('trip');
  const isTrip = trip && trip.ko === c.ko;

  $('#main').innerHTML = `
    <div class="dest-head">
      <div>
        <h2>${c.flagImg}${esc(c.ko)}${I.best?.includes(m) ? '<span class="now-good">지금 가기 좋아요</span>' : ''}</h2>
        <p>${esc(c.tagline)}</p>
      </div>
      <div class="head-acts">
        ${c.custom ? '' : `<button type="button" class="btn" id="tripSave">${isTrip ? '✓ 내 여행' : '✈ 내 여행으로 저장'}</button>`}
        <button type="button" class="btn ghost" id="shareBtn">공유</button>
      </div>
    </div>
    ${c.custom ? '' : `<div class="facts">
      <div class="fact"><span class="fi">🛂</span><div><b>입국</b>${esc(c.visa)}</div></div>
      <div class="fact fx" id="fx"><span class="fi">💱</span><div><b>환율</b>불러오는 중…</div></div>
      <div class="fact" id="wxFact"><span class="fi">🌤</span><div><b>날씨</b>불러오는 중…</div></div>
      <div class="fact"><span class="fi">🕐</span><div><b>시차</b>${esc(c.tz)}</div></div>
      ${I.plug ? `<div class="fact ${I.ok ? 'good' : 'warn'}"><span class="fi">🔌</span><div><b>플러그 · 전압</b>${esc(I.plug)} ${esc(I.volt)}${I.ok ? ' · 그대로 사용' : ' · 변환 플러그 필요'}</div></div>` : ''}
      ${I.lang ? `<div class="fact"><span class="fi">🗣</span><div><b>언어</b>${esc(I.lang)}</div></div>` : ''}
      ${I.tip ? `<div class="fact"><span class="fi">💁</span><div><b>팁</b>${esc(I.tip)}</div></div>` : ''}
    </div>`}
    <nav class="tabs" aria-label="여행지 메뉴">${SECTIONS.filter(([id]) => !(c.custom && ['plan'].includes(id)))
      .map(([id, l]) => `<a class="tab" href="#sec-${id}" data-sec="${id}">${l}</a>`).join('')}</nav>
    <section class="block" id="sec-spots" aria-labelledby="h-spots">
      <div class="block-title"><h3 id="h-spots">🎬 주요 명소 숏폼</h3>
        <button type="button" class="btn reels" id="reelsBtn">▶ 릴스로 몰아보기</button></div>
      <div class="grid" id="grid"></div>
    </section>
    <section class="block" id="sec-info"></section>
    ${c.custom ? '' : '<section class="block" id="sec-plan"></section>'}
    <section class="block" id="sec-flights"></section>
    <section class="block" id="sec-hotels"></section>
    <section class="block" id="sec-more"></section>`;

  $('#shareBtn').addEventListener('click', share);
  $('#tripSave')?.addEventListener('click', saveTrip);
  $('#reelsBtn').addEventListener('click', () => openViewer(0, true));
  renderSpots(opts.spot);
  renderInfo(); renderPlan(); renderTravel(); renderMore();   // renderInfo가 날씨도 불러옴
  if (!c.custom) showFx();
  setupScrollspy();
  $('#main').scrollIntoView({ behavior: 'smooth' });
}

function saveTrip() {
  const t = { ko: current.ko, ap: curAp.code, city: cityOf(curAp), d1: S.d1, d2: S.trip === 'oneway' ? S.d1 : S.d2, checks: store.get('trip')?.ko === current.ko ? store.get('trip').checks : {} };
  store.set('trip', t);
  $('#tripSave').textContent = '✓ 내 여행';
  toast(`${t.city} 여행을 저장했어요 · 첫 화면에서 D-${Math.max(0, dday(t.d1))}와 체크리스트를 볼 수 있어요`);
}
async function share() {
  const url = location.href, title = `${current.ko} 여행 · 트립릴스`;
  try {
    if (navigator.share) return await navigator.share({ title, text: `${current.ko} 명소를 영상으로 미리 보기`, url });
    await navigator.clipboard.writeText(url); toast('링크를 복사했어요');
  } catch (e) { if (e?.name !== 'AbortError') prompt('아래 링크를 복사하세요', url); }
}

/* ---------- 명소 카드 ---------- */
const ytLink = name => 'https://www.youtube.com/results?search_query=' + enc(name + ' 여행 shorts');
const mapLink = (name, city) => 'https://www.google.com/maps/search/?api=1&query=' + enc(name + (city ? ' ' + city : ''));
let loader, player;
async function renderSpots(focusSpot) {
  const c = current, grid = $('#grid');
  let spots = c.spots;
  if (!spots) {   // 데이터에 없는 여행지: Commons에서 직접 검색
    grid.innerHTML = '<div class="state">🔎 영상을 찾는 중…</div>';
    let vids = [];
    try { vids = await withTimeout(fetchVideos(c.ko, 12), 12000); } catch {}
    if (current !== c) return;
    if (!vids.length) {
      grid.innerHTML = `<div class="state"><b>🧭</b><p>'${esc(c.ko)}' 영상을 찾지 못했어요.</p>
        <p class="muted">영문 지명(예: Bali, Prague)으로 검색하거나 YouTube에서 찾아보세요.</p>
        <a class="btn" href="${ytLink(c.ko)}" target="_blank" rel="noopener">▶ YouTube 쇼츠에서 보기</a></div>`;
      $('#reelsBtn').hidden = true; return;
    }
    spots = c.spots = vids.map(v => ({ ko: v.title, en: null, d: '', preset: [v] }));
  }
  const city = c.custom ? c.ko : cityOf(c.aps[0]);
  grid.innerHTML = spots.map((s, i) => `
    <article class="vcard" data-i="${i}" tabindex="0" aria-label="${esc(s.ko)} 영상 크게 보기">
      <div class="media"><div class="skeleton"></div></div>
      <div class="top">
        <span class="badge">불러오는 중</span>
        ${c.custom ? '' : `<button type="button" class="heart${isSaved(c.ko, s.ko) ? ' on' : ''}" aria-pressed="${isSaved(c.ko, s.ko)}" aria-label="${esc(s.ko)} 보관함에 저장">♥</button>`}
      </div>
      <div class="meta"><h4>${esc(s.ko)}</h4>${s.d ? `<p>${esc(s.d)}</p>` : ''}
        <div class="acts"><a class="pill" href="${ytLink(s.en || s.ko)}" target="_blank" rel="noopener">▶ 쇼츠</a>
        ${s.en ? `<a class="pill" href="${mapLink(s.en, '')}" target="_blank" rel="noopener">📍 지도</a>` : ''}</div></div>
    </article>`).join('');
  const cards = $$('.vcard', grid);
  cards.forEach((el, i) => { el._spot = spots[i]; el._idx = 0; });
  loader?.disconnect(); player?.disconnect();
  loader = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && !en.target._state) { loadCard(en.target); loader.unobserve(en.target); } }), { rootMargin: '400px 300px' });
  player = new IntersectionObserver(es => es.forEach(en => { const v = en.target._v; if (v) en.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { threshold: .25 });
  cards.forEach(el => { loader.observe(el); player.observe(el); });
  if (focusSpot) { const el = cards.find(x => x._spot.ko === focusSpot); if (el) setTimeout(() => { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); }, 400); }
}
$('#main').addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { $('#q').value = go.dataset.go; return render(destByKo(go.dataset.go), null, { ap: go.dataset.ap || null }); }
  const un = e.target.closest('[data-unsave]');
  if (un) { const [c, s] = un.dataset.unsave.split('|'); toggleSaved(c, s); return renderHome(); }
  const card = e.target.closest('.vcard'); if (!card) return;
  if (e.target.closest('a')) return;
  if (e.target.closest('.heart')) {
    const on = toggleSaved(current.ko, card._spot.ko), h = e.target.closest('.heart');
    h.classList.toggle('on', on); h.setAttribute('aria-pressed', on); renderPlan(); return;
  }
  if (e.target.closest('.retry')) { card._state = null; card.querySelector('.media').innerHTML = '<div class="skeleton"></div>'; return loadCard(card); }
  if (e.target.closest('.badge.cycle')) return cycle(card);
  openViewer(+card.dataset.i, false);
});
$('#main').addEventListener('keydown', e => {
  const card = e.target.closest?.('.vcard');
  if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
  if (e.target.matches('.badge.cycle')) { e.preventDefault(); cycle(card); }
  else if (e.target === card) { e.preventDefault(); openViewer(+card.dataset.i, false); }
});
$('#main').addEventListener('mouseover', e => { const card = e.target.closest('.vcard'); card?._v?.play().catch(() => {}); });

function setBadge(el, html, cls = '') {
  const b = $('.badge', el); b.className = 'badge ' + cls; b.innerHTML = html;
  if (cls.includes('cycle')) { b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-label', '다른 영상 보기'); }
}
async function loadCard(el) {
  if (el._state === 'loading') return;
  el._state = 'loading'; setBadge(el, '불러오는 중', 'loading');
  const s = el._spot;
  try {
    el._vids = await withTimeout(spotVideos(s), 15000);
    if (!el.isConnected) return;
    if (el._vids.length) return setVideo(el, 0);
    const img = s.en ? await withTimeout(wikiImage(s.en), 10000).catch(() => null) : null;
    if (!el.isConnected) return;
    img ? setPhoto(el, img) : setPlaceholder(el);
  } catch {
    if (el.isConnected) setError(el);
  }
}
function setVideo(el, idx) {
  const v = el._vids[idx]; el._idx = idx; el._state = 'video';
  const media = $('.media', el);
  media.innerHTML = '<div class="skeleton"></div>';
  const vid = document.createElement('video');
  Object.assign(vid, { muted: true, loop: true, playsInline: true, preload: 'metadata', poster: v.poster || '', src: v.src });
  vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
  media.prepend(vid); el._v = vid;
  const n = el._vids.length;
  setBadge(el, n > 1 ? `영상 ${idx + 1}/${n} <span aria-hidden="true">⟳</span>` : '영상', n > 1 ? 'cycle' : '');
  vid.addEventListener('loadeddata', () => $('.skeleton', media)?.remove(), { once: true });
  vid.addEventListener('playing', () => $('.badge', el).classList.add('live'), { once: true });
  vid.addEventListener('error', () => {   // 재생 실패 → 다음 후보 → 사진
    if (idx + 1 < n) return setVideo(el, idx + 1);
    el._vids = []; el._v = null;
    (el._spot.en ? wikiImage(el._spot.en) : Promise.resolve(null)).then(img => img ? setPhoto(el, img) : setPlaceholder(el)).catch(() => setPlaceholder(el));
  });
  vid.play().catch(() => {});
}
const cycle = el => el._vids?.length > 1 && setVideo(el, (el._idx + 1) % el._vids.length);
function setPhoto(el, src) {
  el._state = 'photo'; el._img = src; el._v = null;
  const img = new Image(); img.className = 'poster'; img.alt = el._spot.ko; img.loading = 'lazy'; img.decoding = 'async'; img.src = src;
  img.onerror = () => setPlaceholder(el);
  $('.media', el).replaceChildren(img);
  setBadge(el, '사진 · 영상은 쇼츠에서', 'photo');
}
function setPlaceholder(el) {
  el._state = 'none'; el._v = null; el._img = null;
  $('.media', el).innerHTML = `<div class="placeholder" aria-hidden="true">🏞</div>`;
  setBadge(el, '영상 준비 중 · 쇼츠에서 보기', 'photo');
}
function setError(el) {
  el._state = 'error';
  $('.media', el).innerHTML = `<div class="placeholder err"><span aria-hidden="true">⚠️</span><p>불러오지 못했어요</p><button type="button" class="retry">다시 시도</button></div>`;
  setBadge(el, '연결 실패', 'photo');
}
function stopVideos() { $$('.vcard video').forEach(v => v.pause()); }

/* ---------- 릴스 뷰어 (스와이프 · 방향키 · 자동 넘기기) ---------- */
let vIdx = 0, vTimer = null;
const vCards = () => $$('#grid .vcard');
async function openViewer(i, auto) {
  const cards = vCards(); if (!cards.length) return;
  stopVideos();
  $('#viewer').hidden = false; document.body.classList.add('noscroll');
  $('#vAuto').checked = auto || store.get('autoReels', false);
  showViewer(i);
  $('#vClose').focus();
}
async function showViewer(i) {
  const cards = vCards(); vIdx = (i + cards.length) % cards.length;
  const el = cards[vIdx], s = el._spot, vid = $('#vVid'), img = $('#vImg');
  clearTimeout(vTimer); $('#vBar').style.transition = 'none'; $('#vBar').style.width = '0';
  $('#vCount').textContent = `${vIdx + 1} / ${cards.length}`;
  $('#vTitle').textContent = s.ko; $('#vDesc').textContent = s.d || '';
  $('#vYt').href = ytLink(s.en || s.ko);
  $('#vMap').hidden = true; $('#vMapBtn').setAttribute('aria-pressed', 'false');
  const saved = !current.custom && isSaved(current.ko, s.ko);
  $('#vHeart').hidden = !!current.custom;
  $('#vHeart').textContent = saved ? '♥ 저장됨' : '♡ 저장'; $('#vHeart').setAttribute('aria-pressed', saved);
  $('#vMapBtn').hidden = !s.en;
  if (!el._state || el._state === 'loading') {
    $('#vCredit').textContent = '불러오는 중…'; vid.pause(); vid.hidden = true; img.hidden = true;
    if (!el._state) loadCard(el);
    for (let t = 0; el._state === 'loading' && t < 90; t++) await sleep(200);   // 카드 로딩이 끝날 때까지 대기
    if (vIdx !== +el.dataset.i || $('#viewer').hidden) return;
  }
  const v = el._vids?.[el._idx];
  vid.pause();
  if (v) {
    img.hidden = true; vid.hidden = false;
    vid.poster = v.poster || ''; vid.src = v.hd; vid.loop = !$('#vAuto').checked; vid.controls = true; vid.muted = false;
    vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
    $('#vSrc').hidden = false; $('#vSrc').href = v.page;
    $('#vCredit').textContent = `${v.title} · Wikimedia Commons`;
  } else {
    vid.removeAttribute('src'); vid.load(); vid.hidden = true;
    img.hidden = !el._img; img.src = el._img || ''; img.alt = s.ko;
    $('#vSrc').hidden = true;
    $('#vCredit').textContent = el._img ? '사진 · Wikipedia' : '이 명소는 아직 영상이 없어요 · 쇼츠에서 보기';
  }
  armAuto();
}
function armAuto() {
  clearTimeout(vTimer);
  const bar = $('#vBar'), vid = $('#vVid');
  if (!$('#vAuto').checked) { bar.style.width = '0'; return; }
  const ms = !vid.hidden && isFinite(vid.duration) && vid.duration > 0 ? Math.min(vid.duration * 1000, 15000) : 6000;
  bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
  bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%';
  vTimer = setTimeout(() => showViewer(vIdx + 1), ms);
}
$('#vVid').addEventListener('loadedmetadata', () => $('#vAuto').checked && armAuto());
$('#vVid').addEventListener('ended', () => $('#vAuto').checked && showViewer(vIdx + 1));
$('#vAuto').addEventListener('change', e => { store.set('autoReels', e.target.checked); $('#vVid').loop = !e.target.checked; armAuto(); });
function closeViewer() {
  clearTimeout(vTimer);
  const vid = $('#vVid'); vid.pause(); vid.removeAttribute('src'); vid.load();
  $('#vMap').removeAttribute('src');
  $('#viewer').hidden = true; document.body.classList.remove('noscroll');
  vCards()[vIdx]?.focus();
}
$('#vClose').addEventListener('click', closeViewer);
$('#vPrev').addEventListener('click', () => showViewer(vIdx - 1));
$('#vNext').addEventListener('click', () => showViewer(vIdx + 1));
$('#vHeart').addEventListener('click', () => {
  const el = vCards()[vIdx], on = toggleSaved(current.ko, el._spot.ko);
  $('#vHeart').textContent = on ? '♥ 저장됨' : '♡ 저장'; $('#vHeart').setAttribute('aria-pressed', on);
  const h = $('.heart', el); h?.classList.toggle('on', on); renderPlan();
});
$('#vMapBtn').addEventListener('click', () => {
  const m = $('#vMap'), s = vCards()[vIdx]._spot, open = m.hidden;
  if (open) { m.src = `https://maps.google.com/maps?q=${enc(s.en)}&z=13&output=embed`; clearTimeout(vTimer); $('#vVid').pause(); }
  m.hidden = !open; $('#vMapBtn').setAttribute('aria-pressed', open);
  if (!open) { $('#vVid').play().catch(() => {}); armAuto(); }
});
document.addEventListener('keydown', e => {
  if ($('#viewer').hidden) return;
  if (e.key === 'Escape') closeViewer();
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); showViewer(vIdx + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); showViewer(vIdx - 1); }
  else if (e.key === 'Tab') {   // 포커스를 뷰어 안에 가둠
    const f = $$('#viewer button:not([hidden]), #viewer a:not([hidden]), #viewer input').filter(x => x.offsetParent);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
});
let tStart = null, wheelLock = 0;
$('#vStage').addEventListener('touchstart', e => { tStart = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
$('#vStage').addEventListener('touchend', e => {
  if (!tStart || !$('#vMap').hidden) return;
  const dx = e.changedTouches[0].clientX - tStart[0], dy = e.changedTouches[0].clientY - tStart[1];
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 50) showViewer(vIdx + ((Math.abs(dy) > Math.abs(dx) ? dy : dx) < 0 ? 1 : -1));
  tStart = null;
});
$('#vStage').addEventListener('wheel', e => {
  if (!$('#vMap').hidden || Math.abs(e.deltaY) < 30 || Date.now() < wheelLock) return;
  wheelLock = Date.now() + 700; showViewer(vIdx + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

/* ---------- 환율 (전일 대비 변동 포함) ---------- */
let fxP = null;
function loadFx() {
  if (fxP) return fxP;
  const api = date => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/krw.json`;
  fxP = (async () => {
    try {
      const now = await (await fetch(api('latest'))).json();
      let prev = null;
      try { prev = await (await fetch(api(addDays(now.date, -1)))).json(); } catch {}
      return { date: now.date, rates: now.krw, prev: prev?.krw || null };
    } catch {   // 예비: open.er-api.com (전일 비교 없음)
      const j = await (await fetch('https://open.er-api.com/v6/latest/KRW')).json();
      const r = {}; Object.entries(j.rates).forEach(([k, v]) => r[k.toLowerCase()] = v);
      return { date: iso(new Date(j.time_last_update_unix * 1000)), rates: r, prev: null };
    }
  })();
  fxP.catch(() => { fxP = null; });
  return fxP;
}
const fxUnit = won => won < 1 ? 1000 : won < 10 ? 100 : 1;   // 엔·동처럼 단위가 작은 통화는 100·1000 단위로
async function showFx() {
  const c = current, cur = c.cur, el = () => current === c && $('#fx');
  if (!cur) { el()?.remove(); return; }
  try {
    const fx = await loadFx(), r = fx.rates[cur.toLowerCase()];
    if (!el()) return;
    if (!r) return el().remove();
    const won = 1 / r, unit = fxUnit(won), p = fx.prev?.[cur.toLowerCase()];
    const chg = p ? ((1 / r) / (1 / p) - 1) * 100 : null;
    const d = parseD(fx.date);
    el().innerHTML = `<span class="fi">💱</span><div><b>환율 · ${d.getMonth() + 1}/${d.getDate()} 기준</b>${unit.toLocaleString()} ${cur} = ${(won * unit).toLocaleString('ko-KR', { maximumFractionDigits: won * unit < 100 ? 2 : 0 })}원
      ${chg == null ? '' : `<span class="chg ${chg > 0 ? 'up' : chg < 0 ? 'down' : ''}" title="전일 대비">${chg > 0 ? '▲' : chg < 0 ? '▼' : '–'} ${Math.abs(chg).toFixed(2)}%</span>`}</div>`;
    c._fx = won;
    renderCalc();
  } catch { el()?.remove(); }
}

/* ---------- 날씨 (Open-Meteo, 키 없이 사용) ---------- */
const WX = [[0, '☀️', '맑음'], [1, '🌤', '대체로 맑음'], [2, '⛅', '구름 조금'], [3, '☁️', '흐림'], [48, '🌫', '안개'], [57, '🌦', '이슬비'], [67, '🌧', '비'], [77, '🌨', '눈'], [82, '🌦', '소나기'], [86, '🌨', '눈 소나기'], [99, '⛈', '뇌우']];
const wx = code => WX.find(([c]) => code <= c) || WX[3];
async function showWeather() {
  const c = current, ap = curAp, el = () => current === c && curAp === ap;
  const box = () => $('#wxBox'), fact = () => $('#wxFact');
  try {
    const g = await cached('g:' + ap.en, async () => (await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${enc(ap.en)}&count=1&language=ko`)).json()).results?.[0] || null);
    if (!g) throw 0;
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`)).json();
    if (!el()) return;
    const [, ic, label] = wx(w.current.weather_code);
    if (fact()) fact().innerHTML = `<span class="fi">${ic}</span><div><b>지금 ${esc(cityOf(ap))} 날씨</b>${Math.round(w.current.temperature_2m)}° ${label}</div>`;
    if (box()) box().innerHTML = `<h4>🌤 ${esc(cityOf(ap))} 5일 날씨</h4><div class="wx-days">${w.daily.time.map((t, i) => {
      const [, di, dl] = wx(w.daily.weather_code[i]), dd = parseD(t);
      return `<div class="wx-day"><small>${i === 0 ? '오늘' : `${dd.getMonth() + 1}/${dd.getDate()}(${WD[dd.getDay()]})`}</small><span title="${dl}">${di}</span>
        <b>${Math.round(w.daily.temperature_2m_max[i])}°</b><small>${Math.round(w.daily.temperature_2m_min[i])}°</small></div>`;
    }).join('')}</div>`;
  } catch {
    if (!el()) return;
    fact()?.remove();
    if (box()) box().innerHTML = `<h4>🌤 날씨</h4><p class="muted">날씨 정보를 불러오지 못했어요.</p>`;
  }
}

/* ---------- 여행 정보: 날씨 · 추천 시기 · 환율 계산기 · 예산 · 꿀팁 ---------- */
function renderInfo() {
  const c = current, I = c.info, box = $('#sec-info'); if (!box) return;
  const days = Math.max(1, nights() || 4), ppl = S.adults + S.children;
  const m = new Date().getMonth() + 1, tripM = parseD(S.d1).getMonth() + 1;
  box.innerHTML = `
    <div class="block-title"><h3>📋 여행 정보</h3><small>${esc(cityOf(curAp))} 기준</small></div>
    <div class="info-grid">
      <div class="panel" id="wxBox"><h4>🌤 날씨</h4><div class="skeleton-line"></div></div>
      ${I.best ? `<div class="panel"><h4>📅 추천 시기 · ${esc(I.season)}</h4>
        <div class="months">${Array.from({ length: 12 }, (_, i) => i + 1).map(k =>
          `<span class="mo${I.best.includes(k) ? ' best' : ''}${k === tripM ? ' trip' : ''}" title="${k}월${I.best.includes(k) ? ' 추천' : ''}">${k}</span>`).join('')}</div>
        <p class="muted small">${I.best.includes(tripM) ? `✅ 여행 날짜(${tripM}월)는 추천 시기예요` : `ℹ️ 여행 날짜(${tripM}월)는 추천 시기가 아니에요`}${tripM !== m ? '' : ''}</p></div>` : ''}
      ${c.cur ? `<div class="panel" id="calcBox"><h4>💱 환율 계산기</h4><p class="muted">환율 불러오는 중…</p></div>` : ''}
      ${I.budget ? `<div class="panel"><h4>💰 1일 예상 경비 <small class="muted">1인 · 숙박 포함</small></h4>
        <div class="budget">${['알뜰', '보통', '여유'].map((l, i) => `<div class="tier${i === 1 ? ' mid' : ''}"><small>${l}</small><b>${I.budget[i]}만원</b></div>`).join('')}</div>
        <p class="muted small">보통 기준 ${days}${nights() ? '박' : '일'} · ${ppl}명 ≈ <b class="ink">${(I.budget[1] * days * ppl).toLocaleString()}만원</b> (항공권 제외, 대략치)</p></div>` : ''}
      ${I.tips ? `<div class="panel"><h4>💡 현지 꿀팁</h4><ul class="tips">${I.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <a class="link" href="https://www.0404.go.kr/" target="_blank" rel="noopener">🛡 외교부 해외안전여행에서 여행경보 확인 →</a></div>` : ''}
    </div>`;
  renderCalc();
  if (current === c) showWeather();
}
function renderCalc() {
  const c = current, box = $('#calcBox'); if (!box || !c?._fx) return;
  const unit = fxUnit(c._fx);
  box.innerHTML = `<h4>💱 환율 계산기</h4>
    <div class="calc">
      <label><span>${c.cur}</span><input type="number" inputmode="decimal" id="fxLocal" value="${unit}" min="0" aria-label="${c.cur} 금액"></label>
      <span class="eq" aria-hidden="true">⇄</span>
      <label><span>KRW</span><input type="number" inputmode="decimal" id="fxKrw" value="${Math.round(c._fx * unit)}" min="0" aria-label="원화 금액"></label>
    </div>
    <div class="chips calc-quick">${[1, 10, 100, 1000].map(n => n * unit)
      .map(n =>`<button type="button" class="chip sm" data-amt="${n}">${n.toLocaleString()} ${c.cur}</button>`).join('')}</div>`;
  const L = $('#fxLocal'), K = $('#fxKrw');
  L.addEventListener('input', () => { K.value = L.value === '' ? '' : Math.round(L.value * c._fx); });
  K.addEventListener('input', () => { L.value = K.value === '' ? '' : +(K.value / c._fx).toFixed(2); });
  $$('[data-amt]', box).forEach(b => b.addEventListener('click', () => { L.value = b.dataset.amt; L.dispatchEvent(new Event('input')); }));
}

/* ---------- 추천 일정 (♥ 저장한 명소 우선) ---------- */
function renderPlan() {
  const c = current, box = $('#sec-plan'); if (!box || c.custom) return;
  const savedNames = savedFor(c), useSaved = savedNames.length > 0;
  const spots = useSaved ? c.spots.filter(s => savedNames.includes(s.ko)) : c.spots;
  const days = S.trip === 'oneway' ? 4 : Math.min(10, Math.max(1, nights() + 1));
  const plan = Array.from({ length: days }, () => []);
  // 첫날·마지막 날은 이동이 있어 1곳, 나머지는 2곳씩
  const caps = plan.map((_, i) => days === 1 ? 2 : i === 0 || i === days - 1 ? 1 : 2);
  let k = 0;
  for (let i = 0; i < days && k < spots.length; i++) for (let j = 0; j < caps[i] && k < spots.length; j++) plan[i].push(spots[k++]);
  const rest = spots.slice(k);
  const city = cityOf(curAp), area = areasFor(c, curAp)[0]?.n;
  const dayLabel = i => { if (S.trip === 'oneway') return `${i + 1}일차`; const d = parseD(addDays(S.d1, i)); return `${i + 1}일차 · ${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`; };
  const route = list => 'https://www.google.com/maps/dir/' + list.map(s => enc(s.en)).join('/');
  const text = plan.map((list, i) => `[${dayLabel(i)}] ` + [i === 0 ? '도착·체크인' : '', ...list.map(s => s.ko), i === days - 1 && days > 1 && S.trip !== 'oneway' ? '출국' : ''].filter(Boolean).join(' → ')).join('\n');
  box.innerHTML = `
    <div class="block-title"><h3>🗓 ${S.trip === 'oneway' ? '추천 일정 (예시 4일)' : `${nights()}박 ${days}일 추천 일정`}</h3>
      <small>${useSaved ? `♥ 저장한 명소 ${spots.length}곳 기준` : '추천 명소 기준 · 카드의 ♥로 원하는 명소만 골라 보세요'}</small></div>
    <div class="plan">${plan.map((list, i) => `
      <div class="day-card"><div class="day-h"><b>${dayLabel(i)}</b>${list.length > 1 ? `<a class="link sm" href="${route(list)}" target="_blank" rel="noopener">동선 보기 →</a>` : ''}</div>
        <ol>${i === 0 ? `<li class="mv">✈ ${esc(curAp.name)} 도착 · ${esc(area || city)} 숙소 체크인</li>` : ''}
          ${list.map(s => `<li>${esc(s.ko)} <small>${esc(s.d)}</small></li>`).join('')}
          ${!list.length && !(i === 0) ? '<li class="mv">자유 일정 · 쇼핑, 맛집, 휴식</li>' : ''}
          ${i === days - 1 && days > 1 && S.trip !== 'oneway' ? `<li class="mv">✈ ${esc(curAp.name)} 출국</li>` : ''}</ol></div>`).join('')}
    </div>
    ${rest.length ? `<p class="muted small">일정에 다 못 넣은 곳: ${rest.map(s => esc(s.ko)).join(', ')}</p>` : ''}
    <div class="row-btns"><button type="button" class="btn ghost" id="planCopy">📋 일정 복사</button>
      <a class="btn ghost" href="${route(spots)}" target="_blank" rel="noopener">🗺 전체 동선 지도</a></div>`;
  $('#planCopy').addEventListener('click', async () => {
    const t = `${c.ko} 여행 일정 (트립릴스)\n${text}\n${location.href}`;
    try { await navigator.clipboard.writeText(t); toast('일정을 복사했어요'); } catch { prompt('아래 내용을 복사하세요', t); }
  });
}

/* ---------- 항공편 · 호텔 ---------- */
function renderTravel() {
  const c = current; if (!c || !$('#sec-flights')) return;
  const ap = curAp, to = ap.code, city = cityOf(ap);
  const { from, d1, d2, adults, children, infants, direct } = S, oneway = S.trip === 'oneway';
  const fromName = from === 'ICN' ? '인천' : '김포';
  const n = Math.max(1, nights());
  const kidAges = [...Array(children).fill(8), ...Array(infants).fill(1)];
  const paxTxt = [`성인 ${adults}`, children && `소아 ${children}`, infants && `유아 ${infants}`].filter(Boolean).join(' · ');

  const gfq = `Flights to ${to || ap.en} from ${from} on ${d1}${oneway ? ' one way' : ` through ${d2}`} for ${adults} adults${children ? ` ${children} children` : ''}${infants ? ` ${infants} infants` : ''}${direct ? ' nonstop' : ''}`;
  const gf = 'https://www.google.com/travel/flights?hl=ko&curr=KRW&q=' + enc(gfq);
  const skyBase = to ? `https://www.skyscanner.co.kr/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/` : 'https://www.skyscanner.co.kr/';
  const skyQ = `?adultsv2=${adults}${kidAges.length ? '&childrenv2=' + kidAges.join('%7C') : ''}&cabinclass=economy${direct ? '&preferdirects=true' : ''}${oneway ? '&rtn=0' : '&rtn=1'}`;
  const sky = to ? `${skyBase}${yymmdd(d1)}/${oneway ? '' : yymmdd(d2) + '/'}${skyQ}` : skyBase;
  const skyMonth = to ? `${skyBase}${d1.slice(2, 7).replace('-', '')}/${oneway ? '' : d2.slice(2, 7).replace('-', '') + '/'}${skyQ}` : skyBase;
  const nv = to ? `https://flight.naver.com/flights/international/${from}-${to}-${ymd(d1)}${oneway ? '' : `/${to}-${from}-${ymd(d2)}`}?adult=${adults}&child=${children}&infant=${infants}&fareType=Y${direct ? '&isDirect=true' : ''}`
                : 'https://flight.naver.com/';

  $('#sec-flights').innerHTML = `
    <div class="block-title"><h3>✈️ 항공편</h3><small>${fromName} → ${esc(city)} · ${fmtD(d1)}${oneway ? ' 편도' : ' – ' + fmtD(d2)} · ${paxTxt}${direct ? ' · 직항' : ''}</small></div>
    <div class="two">
      <div class="panel">
        ${c.aps.length > 1 ? `<h4>도착 공항</h4><div class="ap-pick" role="radiogroup" aria-label="도착 공항 선택">${c.aps.map(a =>
          `<button type="button" role="radio" aria-checked="${a.code === to}" data-ap="${a.code}" class="${a.code === to ? 'on' : ''}">${esc(a.name)} <small>${a.code}</small></button>`).join('')}</div>` : ''}
        <div class="route">
          <div class="ap">${from}<small>${fromName}</small></div>
          <div class="line"><i aria-hidden="true">✈</i>${ap.time ? `<span class="dur">${esc(ap.time)}</span>` : ''}</div>
          <div class="ap">${to || '✈'}<small>${esc(city)}</small></div>
        </div>
        ${c.custom ? `<p class="note">상세 노선 정보가 없는 여행지예요. 오른쪽 사이트에서 공항을 골라 검색해 주세요.</p>` : `
        <dl class="kv">
          <dt>도착 공항</dt><dd>${esc(ap.name)} (${to})</dd>
          <dt>비행 시간</dt><dd>${esc(ap.time)}${from !== 'ICN' ? ' <small class="muted">(인천 기준)</small>' : ''}</dd>
          <dt>주요 항공사</dt><dd>${esc(c.airlines)}</dd>
          <dt>입국</dt><dd>${esc(c.visa)}</dd>
        </dl>`}
        <p class="note">※ 비행시간은 대략치예요. ${from === 'GMP' ? '김포 출발 국제선은 일본·대만·중국 일부 노선만 있어요. ' : ''}비자·입국 정책은 출발 전에 꼭 확인하세요.</p>
      </div>
      <div class="links">
        <a class="lnk" href="${gf}" target="_blank" rel="noopener"><div><b>Google 항공편</b><span>가격 추이 · 최저가 날짜 그래프</span></div><span class="arr">검색 →</span></a>
        <a class="lnk" href="${sky}" target="_blank" rel="noopener"><div><b>스카이스캐너</b><span>항공사·여행사 가격 한 번에 비교</span></div><span class="arr">검색 →</span></a>
        <a class="lnk" href="${nv}" target="_blank" rel="noopener"><div><b>네이버 항공권</b><span>국내 여행사 특가 · 원화 결제</span></div><span class="arr">검색 →</span></a>
        ${to ? `<a class="lnk soft" href="${skyMonth}" target="_blank" rel="noopener"><div><b>📆 날짜 유연하게</b><span>${parseD(d1).getMonth() + 1}월 전체에서 가장 싼 날 찾기 (스카이스캐너)</span></div><span class="arr">→</span></a>` : ''}
      </div>
    </div>`;

  const ageQ = kidAges.map(a => `&age=${a}`).join('');
  const bk = q => `https://www.booking.com/searchresults.ko.html?ss=${enc(q)}&checkin=${d1}&checkout=${oneway ? addDays(d1, 1) : d2}&group_adults=${adults}&group_children=${kidAges.length}${ageQ}&no_rooms=1&lang=ko`;
  const ag = q => `https://www.agoda.com/ko-kr/search?textToSearch=${enc(q)}&checkIn=${d1}&los=${n}&adults=${adults}&children=${kidAges.length}${kidAges.length ? '&childages=' + kidAges.join(',') : ''}&rooms=1`;
  const gh = q => `https://www.google.com/travel/search?hl=ko&curr=KRW&q=${enc(q + ' hotels')}`;
  $('#sec-hotels').innerHTML = `
    <div class="block-title"><h3>🏨 호텔</h3><small>${esc(city)} · ${oneway ? '1박 (편도)' : n + '박'} · ${paxTxt}</small></div>
    <div class="links three">
      <a class="lnk" href="${bk(ap.en)}" target="_blank" rel="noopener"><div><b>부킹닷컴</b><span>무료 취소 옵션 많음</span></div><span class="arr">→</span></a>
      <a class="lnk" href="${ag(ap.en)}" target="_blank" rel="noopener"><div><b>아고다</b><span>아시아 숙소 특가</span></div><span class="arr">→</span></a>
      <a class="lnk" href="${gh(ap.en)}" target="_blank" rel="noopener"><div><b>Google 호텔</b><span>지도로 위치·가격 비교</span></div><span class="arr">→</span></a>
    </div>
    <div class="panel">
      <h4>추천 숙소 지역 · ${esc(city)}</h4>
      <div class="areas">${areasFor(c, ap).map(a => `
        <div class="area"><b>${esc(a.n)}</b><p>${esc(a.d)}</p>
          <div class="mini"><a href="${bk(a.q || a.n + ' ' + ap.en)}" target="_blank" rel="noopener">부킹닷컴</a><a href="${ag(a.q || a.n + ' ' + ap.en)}" target="_blank" rel="noopener">아고다</a><a href="${gh(a.q || a.n + ' ' + city)}" target="_blank" rel="noopener">Google 호텔</a><a href="${mapLink(a.q || a.n, a.q ? '' : ap.en)}" target="_blank" rel="noopener">지도</a></div></div>`).join('')}
      </div>
    </div>`;
}
$('#main').addEventListener('click', e => {
  const b = e.target.closest('.ap-pick button'); if (!b || !current?.aps) return;
  curAp = current.aps.find(a => a.code === b.dataset.ap);
  setURL(false); renderTravel(); renderInfo(); renderPlan(); renderMore();
  $('.ap-pick button.on')?.focus();
});

/* ---------- 투어·티켓 · 여행 준비 · 맛집 ---------- */
function renderMore() {
  const c = current, box = $('#sec-more'); if (!box) return;
  const city = cityOf(curAp), en = curAp.en;
  const mrt = q => 'https://www.myrealtrip.com/search?q=' + enc(q);
  const items = [
    ['🎟', '투어 · 입장권', '마이리얼트립', mrt(city)],
    ['🎢', '투어 · 액티비티', '클룩', 'https://www.klook.com/ko/search/result/?query=' + enc(en)],
    ['📶', 'eSIM · 유심', '마이리얼트립', mrt(`${c.custom ? city : c.ko} eSIM`)],
    ['🚗', '해외 렌터카', '마이리얼트립', mrt(`${city} 렌터카`)],
    ['🛡', '여행자보험', '마이리얼트립', mrt('여행자보험')],
    ['🍜', '맛집 · 지도', 'Google 지도', `https://www.google.com/maps/search/?api=1&query=${enc('restaurants in ' + en)}`],
    ['🗺', '맛집 · 지도', '네이버 지도', `https://map.naver.com/p/search/${enc(city + ' 맛집')}`],
    ['💬', '여행 브이로그', 'YouTube', 'https://www.youtube.com/results?search_query=' + enc(city + ' 여행 브이로그')]
  ];
  box.innerHTML = `<div class="block-title"><h3>🎟 투어 · 여행 준비</h3><small>${esc(city)}</small></div>
    <div class="more-grid">${items.map(([ic, t, s, u]) => `<a class="more" href="${u}" target="_blank" rel="noopener"><span class="mi">${ic}</span><span><b>${t}</b><small>${s}</small></span></a>`).join('')}</div>`;
}

/* ---------- 탭: 현재 위치 표시 ---------- */
let spy;
function setupScrollspy() {
  spy?.disconnect();
  spy = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const id = en.target.id.replace('sec-', '');
    $$('.tab').forEach(t => { const on = t.dataset.sec === id; t.classList.toggle('on', on); on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'); });
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('section.block').forEach(s => spy.observe(s));
}
$('#main').addEventListener('click', e => {
  const t = e.target.closest('.tab'); if (!t) return;
  e.preventDefault(); $('#sec-' + t.dataset.sec)?.scrollIntoView({ behavior: 'smooth' });
});

/* =========================================================
   상단 버튼 · 플로팅 버튼 · 화면 설정
   ========================================================= */
$('.logo').addEventListener('click', e => {
  e.preventDefault(); $('#q').value = '';
  history.pushState(null, '', location.pathname); renderHome(); scrollTo({ top: 0, behavior: 'smooth' });
});
$('#savedBtn').addEventListener('click', () => {
  if (!getSaved().length) return toast('명소 카드의 ♥를 누르면 보관함에 담겨요');
  if (current) { history.pushState(null, '', location.pathname); renderHome(); }
  setTimeout(() => $('#savedSec')?.scrollIntoView({ behavior: 'smooth' }), 50);
});
function applyTheme() {
  const t = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeIc').textContent = t === 'dark' ? '☀️' : '🌙';
  $('#themeBtn').setAttribute('aria-label', t === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0f1420' : '#ff6b4a';
}
$('#themeBtn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = cur === 'dark' ? 'light' : 'dark';
  store.set('theme', document.documentElement.dataset.theme); applyTheme();
});
$('#fsBtn').addEventListener('click', () => {
  const lg = document.documentElement.dataset.fs !== 'lg';
  lg ? document.documentElement.dataset.fs = 'lg' : delete document.documentElement.dataset.fs;
  store.set('fs', lg ? 'lg' : 'md'); $('#fsBtn').setAttribute('aria-pressed', lg);
  toast(lg ? '글자를 크게 표시해요' : '기본 글자 크기로 돌아왔어요');
});
$('#fsBtn').setAttribute('aria-pressed', document.documentElement.dataset.fs === 'lg');
// 검색창이 화면 밖으로 나가면 하단 검색·맨 위로 버튼 표시
new IntersectionObserver(([en]) => { $('#fabSearch').hidden = en.isIntersecting; $('#fabTop').hidden = en.isIntersecting; }).observe($('#searchForm'));
$('#fabTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
$('#fabSearch').addEventListener('click', () => { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => $('#q').focus(), 350); });

/* =========================================================
   시작
   ========================================================= */
applyTheme(); syncForm(); updateSavedCount(); route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
