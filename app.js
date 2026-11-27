/* 떠날지도 앱 — data.js의 DESTS · REGIONS · AIRPORTS · AREAS · CC · INFO 사용 */
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
const WD = tx('일월화수목금토', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthName = m => tx(`${m}월`, MON[m - 1]);   // m: 1~12
const fmtD = s => { const d = parseD(s); return tx(`${d.getMonth() + 1}.${d.getDate()}(${WD[d.getDay()]})`, `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`); };
const nightsText = n => tx(`${n}박`, plural(n, 'night'));
const ymd = s => s.replace(/-/g, '');
const yymmdd = s => s.slice(2).replace(/-/g, '');
const dday = s => Math.round((parseD(s) - parseD(today())) / 864e5);
const clock = m => { const r = Math.round(m / 10) * 10; return `${pad(Math.floor(r / 60) % 24)}:${pad(r % 60)}`; };   // 일정 시각은 10분 단위로 표시

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
  d.name = d.ko;   // 화면에 보이는 이름 (영어판에서는 바뀜)
  d.visaFree = /무비자/.test(d.visa);
  d.hours = +((d.aps[0].time || '').match(/(\d+)시간/)?.[1] ?? 99);
});
if (EN) localizeData(DESTS);
const POPULAR = ["일본", "베트남", "태국", "대만", "홍콩", "프랑스", "스위스", "미국"];
// 나라 정보와 사정이 다른 공항: 괌은 '미국'에 속하지만 시차·입국·계절·팁이 다름 (입국 조건은 2026-11 확인)
const AP_FACTS = {
  GUM: {
    tagline: tx('비행 4시간대의 가까운 태평양 휴양섬', 'A Pacific island getaway about four and a half hours away'),
    airlines: tx('대한항공 외 (운항편은 예약 사이트에서 확인)', 'Korean Air and others (check current flights)'),
    visa: tx('무비자 45일 (출발 전 Guam-CNMI ETA 신청) · ESTA는 90일', 'Visa-free 45 days (apply for the Guam-CNMI ETA before flying) · 90 days with ESTA'),
    tz: tx('한국보다 1시간 빠름', '1 h ahead of Korea'),
    best: [12, 1, 2, 3, 4, 5], season: tx('건기 12~5월', 'Dry season Dec–May'),
    tip: tx('10~15% (서비스료 포함 여부 확인)', '10–15% (check if service is included)'),
    tips: tx(['Guam-CNMI ETA 또는 ESTA는 출발 전에 미리 신청', '이동은 렌터카나 투몬 지역 셔틀버스', '자외선이 강해 자외선 차단제 필수'],
      ['Apply for the Guam-CNMI ETA or ESTA before you fly', 'Get around by rental car or the Tumon shuttle buses', 'The sun is strong, so wear sunscreen'])
  }
};
// 지금 보는 공항 기준의 여행 정보 (공항별 예외가 있으면 덮어씀)
const factsOf = (d, ap) => ({ ...d, ...d.info, ...AP_FACTS[ap?.code] });
// 공항 이름에 있는 지명(괌, 제네바, 호놀룰루 …)으로도 찾음. '(김포 출발)'은 출발지라 제외
const apPlaces = a => { const name = (a.koName || a.name).replace('(김포 출발)', ''); return [name, ...name.split(/[\s()·]+/), a.city || '', ...a.name.split(',')].filter(Boolean).map(norm); };
const destByKo = ko => DESTS.find(d => d.ko === ko);
const destBySlug = s => DESTS.find(d => d.slug === s);
function findDest(q) {
  const n = norm(q);
  if (!n) return null;
  return DESTS.find(d => norm(d.ko) === n || norm(d.name) === n || norm(d.city) === n || d.aliases.some(a => norm(a) === n)
                      || d.aps.some(a => norm(a.code) === n || norm(a.en) === n || apPlaces(a).includes(n)))
      || DESTS.find(d => n.length >= 2 && (norm(d.ko).includes(n) || norm(d.name).includes(n) || d.aliases.some(a => norm(a).includes(n))));
}
// 도시 이름·공항코드로 검색했으면 그 도시의 공항을 기본 선택
const airportFor = (d, word) => (word && d.aps.find(a => norm(a.name).includes(norm(word)) || (a.koName && norm(a.koName).includes(norm(word))) || norm(a.en) === norm(word) || norm(a.code) === norm(word))) || d.aps[0];
const cityOf = ap => ap.city || ap.name.split(' ')[0];
const nm = s => s.name || s.ko;   // 명소의 표시 이름

// 선택한 공항(도시) 기준 명소. 같은 도시 공항(나리타→하네다 등)은 SPOT_ALIAS로 공유
const spotCache = new Map();
function spotsFor(d, ap) {
  const code = SPOT_ALIAS[ap?.code] || ap?.code;
  if (!code || !CITY_SPOTS[code]) return d.spots;
  if (!spotCache.has(code)) spotCache.set(code, localizeSpots(code, CITY_SPOTS[code].split(';').map(s => {
    const [ko, en, desc, k, g] = s.split('|'); return { ko, en, d: desc, k: k || undefined, g: g || '' };
  })));
  return spotCache.get(code);
}
// 명소 방문 정보(spotinfo.js): 추천 시간대 · 머무는 시간 · 입장 · 메모
const SLOT_ORDER = { 아침: 0, 오전: 1, 종일: 1, 오후: 2, 저녁: 3, 야간: 4 };
const SLOT_START = { 아침: 8 * 60, 오전: 9.5 * 60, 종일: 9 * 60, 오후: 13.5 * 60, 저녁: 17.5 * 60, 야간: 19.5 * 60 };
const SLOT_EN = { 아침: 'early morning', 오전: 'morning', 종일: 'full day', 오후: 'afternoon', 저녁: 'evening', 야간: 'night' };
const metaText = v => EN && EN_META[v] || v;
function spotMeta(s) {
  const [slot, stay, fee, note] = (s?.en && SPOT_META[s.en] || '').split('|');
  const key = SLOT_ORDER[slot] != null ? slot : '오후';
  return { slot: key, slotName: tx(key, SLOT_EN[key]), stay: +stay || 1.5, fee: metaText(fee || '확인 필요'), note: metaText(note || '') };
}
const spotGeo = s => s?.en && SPOT_GEO[s.en] || null;
function km(a, b) {
  const r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
const fmtMin = m => m < 60 ? tx(`${m}분`, `${m} min`) : tx(`${Math.floor(m / 60)}시간`, `${Math.floor(m / 60)}h`) + (m % 60 >= 5 ? tx(` ${Math.round(m % 60 / 5) * 5}분`, ` ${Math.round(m % 60 / 5) * 5}m`) : '');
// 직선거리로 이동수단·시간을 대략 추정 (도보 4.5km/h, 대중교통 18km/h+대기, 차·기차 65km/h+20분)
function travel(a, b) {
  if (!a || !b) return { min: 30, text: tx('🚇 이동 약 30분', '🚇 About 30 min travel') };
  const d = km(a, b);
  if (d < 0.15) return null;
  if (d < 1.2) { const m = Math.max(5, Math.round(d / 4.5 * 60)); return { min: m, text: tx(`🚶 도보 약 ${fmtMin(m)}`, `🚶 Walk about ${fmtMin(m)}`) }; }
  if (d < 25) { const m = Math.round(d / 18 * 60 + 12); return { min: m, text: tx(`🚇 대중교통 약 ${fmtMin(m)}`, `🚇 Transit about ${fmtMin(m)}`) }; }
  if (d < 450) { const m = Math.round(d / 65 * 60 + 20); return { min: m, text: tx(`🚗 차·기차 약 ${fmtMin(m)}`, `🚗 Car or train about ${fmtMin(m)}`) }; }
  const m = Math.round(d / 500 * 60 + 150); return { min: m, text: tx(`✈ 항공·장거리 이동 약 ${fmtMin(m)}`, `✈ Flight or long haul about ${fmtMin(m)}`) };
}
// 도시 중심(숙소 기준점) = 시내 명소 좌표의 평균
function cityCenter(spots) {
  const pts = spots.filter(s => !s.g).map(spotGeo).filter(Boolean);
  if (!pts.length) return spots.map(spotGeo).find(Boolean) || null;
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
}

// 제휴 파라미터 (config.js). 값이 있을 때만 링크에 붙이고 rel="sponsored" 표시
const affOn = key => typeof AFFILIATE !== 'undefined' && !!AFFILIATE[key];
const aff = (key, url) => affOn(key) ? url + (url.includes('?') ? '&' : '?') + AFFILIATE[key] : url;
const rel = key => affOn(key) ? 'sponsored noopener' : 'noopener';

function areasFor(d, ap) {
  if (AREAS[ap.code]) return localizeList(EN && EN_AREAS[ap.code], AREAS[ap.code].split(';').map(s => { const [n, desc, q] = s.split('|'); return { n, d: desc, q }; }));
  if (!d.aps || ap.en === d.aps[0].en) return d.areas;   // 대표 공항과 같은 도시 (예: 나리타, 쑹산)
  return [{ n: tx(cityOf(ap) + ' 시내', cityOf(ap) + ' centre'), d: tx('주요 명소와 교통이 편리한 중심가', 'Central area close to sights and transport'), q: ap.en }];
}

/* =========================================================
   검색 조건 (마지막 검색값 기억)
   ========================================================= */
const S = Object.assign({ from: 'ICN', trip: 'round', adults: 2, children: 0, infants: 0, direct: false, d1: null, d2: null }, store.get('search', {}));
if (!['ICN', 'GMP'].includes(S.from)) S.from = 'ICN';
// 지난 날짜는 새로 고름. 단, 저장한 여행이 진행 중이면 그 날짜를 유지 (여행 중에 다시 열어도 내 일정이 보이게)
const ongoing = [...store.get('trips', []), store.get('trip')].some(t => t && t.d1 === S.d1 && (t.d2 === t.d1 ? addDays(t.d1, 3) : t.d2) >= today());   // 편도는 4일간
if (!S.d1 || (S.d1 < today() && !ongoing)) { S.d1 = addDays(today(), 30); S.d2 = addDays(S.d1, 4); }   // 기본: 오늘+30일부터 4박
if (!S.d2 || S.d2 <= S.d1) S.d2 = addDays(S.d1, 4);
const saveS = () => store.set('search', S);
const nights = () => S.trip === 'oneway' ? 0 : Math.round((parseD(S.d2) - parseD(S.d1)) / 864e5);
const people = () => S.adults + S.children + S.infants;

const paxText = (a, c, i) => [tx(`성인 ${a}`, plural(a, 'adult')), c && tx(`소아 ${c}`, plural(c, 'child', 'children')), i && tx(`유아 ${i}`, plural(i, 'infant'))].filter(Boolean).join(' · ');
function syncForm() {
  $('#from').value = S.from;
  $$('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.trip === S.trip)));
  $('#direct').checked = S.direct;
  // 영어는 요일까지 쓰면 칸에 다 들어가지 않아 월·일만
  const day = s => EN ? `${MON[parseD(s).getMonth()]} ${parseD(s).getDate()}` : fmtD(s);
  $('#dateBtn').innerHTML = S.trip === 'oneway'
    ? `${day(S.d1)} <small>${tx('편도', 'one way')}</small>`
    : `${day(S.d1)} – ${day(S.d2)} <small>${nightsText(nights())}</small>`;
  $('#paxBtn').textContent = paxText(S.adults, S.children, S.infants);
}
function searchChanged() {
  if (sharedPlan) sharedPlan.backup = null;   // 직접 바꾼 검색 조건은 공유받은 일정을 닫아도 유지
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
  let html = `<div class="cal-head"><button type="button" class="cal-nav" data-m="-1" aria-label="${tx('이전 달', 'Previous month')}">‹</button>
    <b>${S.trip !== 'oneway' && calStart ? tx('오는 날을 선택하세요', 'Pick your return date') : tx('가는 날을 선택하세요', 'Pick your departure date')}</b>
    <button type="button" class="cal-nav" data-m="1" aria-label="${tx('다음 달', 'Next month')}">›</button></div><div class="cal-months">`;
  for (let k = 0; k < months; k++) {
    const m = new Date(calBase.getFullYear(), calBase.getMonth() + k, 1);
    html += `<div class="cal-month"><h5>${tx(`${m.getFullYear()}년 ${m.getMonth() + 1}월`, `${MON[m.getMonth()]} ${m.getFullYear()}`)}</h5><div class="cal-grid">`
      + [...WD].map((w, i) => `<span class="wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</span>`).join('')
      + '<span></span>'.repeat(m.getDay());
    const last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const s = iso(new Date(m.getFullYear(), m.getMonth(), day));
      const cls = [s === a && 'start', b && s === b && 'end', b && s > a && s < b && 'in', s === t && 'today'].filter(Boolean).join(' ');
      html += `<button type="button" class="day ${cls}" data-d="${s}" ${s < t ? 'disabled' : ''} aria-label="${tx(`${m.getMonth() + 1}월 ${day}일`, `${MON[m.getMonth()]} ${day}`)}">${day}</button>`;
    }
    html += '</div></div>';
  }
  html += '</div>';
  if (S.trip === 'round') html += `<div class="cal-foot">${[[2,tx('2박 3일','2 nights')],[3,tx('3박 4일','3 nights')],[4,tx('4박 5일','4 nights')],[6,tx('6박 7일','6 nights')]].map(([n, l]) =>
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
const PAX = [['adults', tx('성인', 'Adults'), tx('만 12세 이상', 'Age 12+'), 1, 9], ['children', tx('소아', 'Children'), tx('만 2~11세', 'Age 2–11'), 0, 8], ['infants', tx('유아', 'Infants'), tx('만 2세 미만 (좌석 없음)', 'Under 2 (no seat)'), 0, 4]];
function renderPax() {
  $('#paxPop').innerHTML = PAX.map(([k, n, sub, min, max]) => {
    const lim = k === 'infants' ? Math.min(max, S.adults) : max;
    return `<div class="pax-row"><div><b>${n}</b><small>${sub}</small></div>
      <div class="stepper"><button type="button" data-k="${k}" data-v="-1" ${S[k] <= min ? 'disabled' : ''} aria-label="${tx(`${n} 줄이기`, `Fewer ${n}`)}">−</button>
      <output aria-live="polite">${S[k]}</output>
      <button type="button" data-k="${k}" data-v="1" ${S[k] >= lim ? 'disabled' : ''} aria-label="${tx(`${n} 늘리기`, `More ${n}`)}">+</button></div></div>`;
  }).join('') + `<button type="button" class="pax-done">${tx('완료', 'Done')}</button>`;
}
$('#paxBtn').addEventListener('click', () => { if ($('#paxPop').hidden) { renderPax(); openPop('paxPop'); } else $('#paxPop').hidden = true; });
// 날짜·인원 칸의 빈 곳(칸 제목 포함)을 눌러도 열리게 → 모바일 터치 영역 확대
// (달력·인원 창은 누를 때마다 다시 그려져 e.target이 떨어져 나가므로, 클릭 당시의 경로(composedPath)로 판단)
$$('.field.date, .field.pax').forEach(f => f.addEventListener('click', e => { if (!e.composedPath().some(n => n.matches?.('.field-btn, .pop'))) $('.field-btn', f).click(); }));
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
  SUG.push({ t: 0, label: d.name, sub: d.tagline, d, keys: [d.ko, d.name, d.city, d.slug, ...d.aliases] });
  const seen = new Map();
  const addCity = (label, keys) => {
    if (label === d.name) return;
    if (seen.has(label)) return seen.get(label).keys.push(...keys);   // 같은 도시면 검색어(영문·공항코드)만 합침
    const ap = airportFor(d, label), item = { t: 1, label, sub: `${d.name}${ap && norm(ap.name).includes(norm(label)) ? ' · ' + ap.code : ''}`, d, word: label, keys };
    seen.set(label, item); SUG.push(item);
  };
  if (!EN) d.aliases.filter(hasKo).forEach(a => addCity(a, [a]));
  d.aps.forEach(a => addCity(cityOf(a), [a.name, a.koName || a.name, a.en, a.code]));
  const seenSpot = new Set();   // 명소는 해당 도시(공항)와 함께 기억 → 고르면 그 도시로 바로 이동
  d.aps.forEach(a => spotsFor(d, a).forEach(s => {
    if (seenSpot.has(s.ko)) return; seenSpot.add(s.ko);
    SUG.push({ t: 2, label: nm(s), sub: `${d.name} ${cityOf(a)} · ${s.d}`, d, ap: a.code, keys: [s.ko, nm(s), s.en] });
  }));
});
const KIND = tx(['국가', '도시', '명소'], ['Country', 'City', 'Sight']);
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
  const hl = label => { const i = label.toLowerCase().indexOf(q.toLowerCase());
    return q && i >= 0 ? esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length)) : esc(label); };
  const hasRecent = !n && store.get('recent', []).length;
  $('#suggest').innerHTML = (n ? '' : `<li class="head">${hasRecent ? tx('최근 본 · 인기 여행지', 'Recent and popular') : tx('인기 여행지', 'Popular destinations')}</li>`)
    + (sugItems.length ? sugItems.map((s, i) => `
      <li class="opt${i === sugIdx ? ' on' : ''}" role="option" id="sug${i}" aria-selected="${i === sugIdx}" data-i="${i}">
        <span class="ic">${s.t === 0 ? s.d.flagImg : s.t === 1 ? '📍' : '📸'}</span>
        <span class="txt"><b>${hl(s.label)}</b><small>${esc(s.sub)}</small></span>
        <span class="kind">${KIND[s.t]}</span></li>`).join('')
      : `<li class="head empty-sug">${tx(`'${esc(q)}'에 맞는 여행지가 없어요.<br>Enter를 누르면 영상을 직접 찾아볼게요.`, `No destination matches '${esc(q)}'.<br>Press Enter to search for videos.`)}</li>`);
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
  render(s.d, s.word, { spot: s.t === 2 ? s.label : null, ap: s.ap || null });
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
// 여행 영상이 아닌 것 제외: 위성·관측 영상, 지도·3D 렌더링, 행사·정치 영상, 1960년대 이전 흑백 필름
const NOT_TRAVEL = /\b(cira|goes-?\d*|nasa|noaa|landsat|sentinel|modis|copernicus|satellite|skysat|from space|iss\b|radar|himawari|simulation|lecture|interview|press conference|state dinner|president|minister|potus|map|maps|3d|render(ing)?|animation|orbit|peakvisor|peak ?names|path names|newsreel|footage)\b/i;
const OLD_FILM = /\b(18[89]\d|19[0-7]\d)\b/;   // 1970년대 이전 기록 영상 (예: 'The Nixons in Guam … (1972)')
// 군사·정치·뉴스·재난 영상 제외: 제목뿐 아니라 분류와 작성자까지 확인 (예: 괌을 검색하면 미군 홍보 영상이 대부분)
const NOT_TRAVEL_SOURCE = /\b(navy|naval|marines|marine corps|usmc|army|air force|air base|national guard|coast guard|uscg|usaf|usns|uss|idf|jmnn|military|soldiers?|sailors?|airmen|troops|battalion|squadron|war|warfare|wwii|president\w*|minister\w*|governor|senator|congress\w*|elections?|electoral|politic\w*|summit|protests?|coup|speech|remarks|interview\w*|discussion|press|news|report\w*|embassy|human rights|derechos|economic\w*|clinton|reagan|nixon|obama|biden|voice of america|voa|typhoon|hurricane|cyclone|flood\w*|earthquake|covid|pandemic|satellite|nasa|noaa|cira|himawari|from space|eclipse|google earth|lecture|conference|wikimania|wikimedians|wikitongues|sign language|simpleshow|concerts?|singers?)\b/i;
// 분류에 'Videos from Guam', '2021 in Guam'처럼 그 지역이라고 적혀 있는지
function inPlace(categories, term) {
  const t = fold(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${t}$|\\b(in|from|of) (the )?${t}($|,| \\()`);
  return categories.split('|').some(c => re.test(fold(c)));
}
// 목록에 없는 여행지의 영상 검색
function fetchVideos(term, limit = 12) {
  return cached(`v3:${term}|${limit}`, async () => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*'
      + '&generator=search&gsrnamespace=6&gsrlimit=50&gsrsearch=' + enc('filetype:video ' + term)   // 걸러지는 영상이 많아 넉넉히 검색
      + '&prop=videoinfo&viprop=url|mime|size|derivatives|extmetadata&viextmetadatafilter=Categories|Artist&viurlwidth=640';
    const j = await (await fetch(url)).json();
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.map(pg => {
      const v = pg.videoinfo?.[0]; if (!v) return null;
      const title = pg.title.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' ');
      if (NOT_TRAVEL.test(title) || OLD_FILM.test(title)) return null;
      const categories = v.extmetadata?.Categories?.value || '';
      const artist = String(v.extmetadata?.Artist?.value || '').replace(/<[^>]*>/g, ' ');
      if (NOT_TRAVEL_SOURCE.test(`${title} | ${categories} | ${artist}`)) return null;
      if (!fold(title).includes(fold(term))) return null;  // 제목에 검색어가 있는 영상만
      const local = inPlace(categories, term);
      const ders = (v.derivatives || []).filter(x => /webm|mp4/.test(x.type));
      const maxH = Math.max(0, ...ders.map(x => Math.min(x.height || 0, x.width || 0) || x.height || 0));
      if (ders.length && maxH < 400) return null;          // 저화질(360p 이하)만 있는 영상 제외
      const pick = h => ders.find(x => x.transcodekey && x.transcodekey.startsWith(h));
      const small = pick('480p') || pick('720p') || pick('360p');
      const big = pick('1080p') || pick('720p') || small;
      if (!small && v.size > 40e6) return null;            // 변환본 없는 큰 원본은 제외
      return { local, video: { title, src: (small || v).src || v.url, hd: (big || v).src || v.url, poster: v.thumburl, page: v.descriptionurl } };
    }).filter(Boolean)
      .sort((a, b) => b.local - a.local)                   // 그 지역 분류에 속한 영상 먼저, 나머지는 검색 순서 유지
      .slice(0, limit).map(x => x.video);
  });
}
// 고정 사진(photos.js)이 없는 명소용: 지도·로고·국기·인물 같은 그림은 건너뛰고 첫 번째 풍경 사진
const BAD_IMG = /\.svg$|map|locator|logo|flag|coat_of_arms|seal|diagram|plan|chart|location|emblem|icon|portrait|\.gif$|\.webm$/i;
function wikiImage(term) {
  if (SPOT_IMG[term]) return Promise.resolve(photoUrl(SPOT_IMG[term]));
  return cached('i2:' + term, async () => {
    const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=4&gsrsearch='
      + enc(term) + '&prop=pageimages&piprop=thumbnail|name|original&pithumbsize=800');
    const j = await r.json();
    const pg = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index)
      .find(p => p.thumbnail && p.pageimage && !BAD_IMG.test(p.pageimage) && (p.original?.width || 0) >= 700);
    return pg?.thumbnail?.source || null;
  });
}
// 명소 영상은 직접 확인해서 고정한 파일(photos.js의 SPOT_VIDEO)만 사용 → 엉뚱한 검색 결과가 섞이지 않음
// 고정 영상이 없는 명소는 대표 사진으로 보여줌
function pinnedVideos(files) {
  return cached('pv:' + files.join('|'), async () => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=videoinfo&viprop=url|size|derivatives'
      + '&titles=' + enc(files.map(f => 'File:' + f).join('|'));
    const j = await (await fetch(url)).json();
    const byTitle = {};
    Object.values(j.query?.pages || {}).forEach(pg => { if (pg.videoinfo) byTitle[pg.title.replace(/^File:/, '').replace(/ /g, '_')] = pg; });
    return files.map(f => byTitle[f.replace(/ /g, '_')]).filter(Boolean).map(pg => {
      const v = pg.videoinfo[0], ders = (v.derivatives || []).filter(x => /webm|mp4/.test(x.type));
      const pick = h => ders.find(x => x.transcodekey && x.transcodekey.startsWith(h));
      const small = pick('480p') || pick('720p') || pick('360p'), big = pick('1080p') || pick('720p') || small;
      return { title: pg.title.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' '), src: (small || v).src || v.url, hd: (big || v).src || v.url, page: v.descriptionurl };
    });
  });
}
// 한글 지명 → 영어 위키백과 문서 제목 (한국어 위키백과 문서의 영어판 링크). 예: 괌 → Guam
function enTitle(q) {
  if (!hasKo(q)) return Promise.resolve(null);
  return cached('et:' + q, async () => {
    const j = await (await fetch('https://ko.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=langlinks&lllang=en&titles=' + enc(q))).json();
    return j.query?.pages?.[0]?.langlinks?.[0]?.title || null;
  });
}
// 검색에 쓰는 영문 지명: 괄호와 쉼표 뒤 설명을 뗌. 예: 'Saipan, Northern Mariana Islands' → Saipan
const enName = q => enTitle(q).then(t => t?.replace(/\s*\(.*\)$|,.*$/g, '') || null);

/* ---------- 사진·영상 출처 (작성자 · 라이선스) ---------- */
// Wikimedia 파일 설명 페이지에서 작성자·라이선스를 가져옴. 여러 파일을 한 번에 묻고 7일간 캐시
const textOf = html => new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
const fileOf = page => { const m = String(page || '').match(/\/wiki\/File:([^?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
async function fileCredits(files) {
  const out = {}, need = [];
  [...new Set(files.filter(Boolean))].forEach(f => {
    const hit = store.get('c:cr:' + f);
    if (hit && Date.now() - hit.t < CACHE_DAYS * 864e5) out[f] = hit.v; else need.push(f);
  });
  for (let i = 0; i < need.length; i += 50) {
    const chunk = need.slice(i, i + 50);
    try {
      const j = await (await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiextmetadatafilter=Artist|LicenseShortName&titles='
        + enc(chunk.map(f => 'File:' + f).join('|')))).json();
      const back = {}; (j.query?.normalized || []).forEach(n => back[n.to] = n.from);   // API가 바꾼 제목(_ → 공백) → 원래 파일명
      (j.query?.pages || []).forEach(pg => {
        const info = pg.imageinfo?.[0]; if (!info) return;
        const f = (back[pg.title] || pg.title).replace(/^File:/, ''), m = info.extmetadata || {}, a = textOf(m.Artist?.value);
        const v = { a: a ? (a.length > 40 ? a.slice(0, 39) + '…' : a) : tx('작성자 정보 없음', 'Unknown author'), l: m.LicenseShortName?.value || tx('라이선스 확인 필요', 'Check licence'),
                    u: info.descriptionurl || 'https://commons.wikimedia.org/wiki/File:' + enc(f) };
        out[f] = v; store.set('c:cr:' + f, { t: Date.now(), v });
      });
    } catch {}
  }
  return out;
}
const hasVideo = s => !!(s.preset || SPOT_VIDEO[s.en]);
async function spotVideos(s) {
  if (s.preset) return s.preset;
  const files = SPOT_VIDEO[s.en];
  return files ? pinnedVideos(files) : [];
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
  toast(i >= 0 ? tx(`'${s}'을(를) 보관함에서 뺐어요`, `Removed '${spotTitle(s)}' from saved`) : tx(`'${s}'을(를) 보관함에 담았어요 ♥`, `Saved '${spotTitle(s)}' ♥`));
  return i < 0;
}
const savedFor = d => getSaved().filter(k => k.startsWith(d.ko + '|')).map(k => k.split('|')[1]);
function updateSavedCount() { $('#savedCount').textContent = getSaved().length; }
function addRecent(ko) {
  const r = store.get('recent', []).filter(x => x !== ko); r.unshift(ko); store.set('recent', r.slice(0, 8));
}
const CHECKS = tx(['여권 유효기간 (6개월 이상)', '비자·입국 서류', '항공권 예약', '숙소 예약', '환전·해외결제 카드', 'eSIM·유심 / 로밍', '여행자보험', '충전기·변환 플러그'],
  ['Passport valid 6+ months', 'Visa & entry papers', 'Book flights', 'Book stays', 'Cash & travel card', 'eSIM / SIM / roaming', 'Travel insurance', 'Chargers & plug adapter']);

/* =========================================================
   화면 전환 (주소: ?d=japan&ap=KIX · 공유 가능)
   ========================================================= */
let current = null, curAp = null;
function setURL(push) {
  const u = new URL(location.href); u.hash = sharedPlan?.hash || '';   // 공유받은 일정은 새로고침해도 다시 보이게
  u.search = withLang(current ? (current.custom ? `?q=${enc(current.ko)}` : `?d=${current.slug}${curAp && curAp !== current.aps[0] ? '&ap=' + curAp.code : ''}`) : '');
  history[push ? 'pushState' : 'replaceState'](null, '', u);
}
// 검색엔진용 대표 주소(canonical): 첫 화면은 사이트 주소, 여행지는 ?d=여행지
const SITE = new URL('./', location.href).href;   // 예: https://…/trip-reels/
function setCanonical(path) {
  let l = $('link[rel="canonical"]');
  if (!l) { l = document.createElement('link'); l.rel = 'canonical'; document.head.append(l); }
  l.href = SITE + (EN ? path + (path.includes('?') ? '&' : '?') + 'lang=en' : path);
}
// 공유 주소: 국가 페이지(/japan/)로 공유해야 카카오톡 등에서 여행지별 제목·설명 미리보기가 보임 (tools/build-pages.cjs가 만든 페이지)
// 영어판은 en/ 페이지로 공유해야 미리보기가 영어로 보임
const sharePage = () => EN ? `${SITE}en/?d=${current.info.slug}` : `${SITE}${current.info.slug}/`;
const shareURL = () => current && !current.custom && current.info.slug
  ? `${sharePage()}${curAp && curAp !== current.aps[0] ? '#ap=' + curAp.code : ''}` : location.href;
function route() {
  const p = new URLSearchParams(location.search);
  const legacy = decodeURIComponent(location.hash.slice(1));   // 예전 주소(#일본) 호환
  const d = p.get('d') && (destBySlug(p.get('d')) || findDest(p.get('d')));
  const hash = new URLSearchParams(location.hash.slice(1));
  const ap = hash.get('ap') || p.get('ap');   // 국가 페이지(/japan/#ap=KIX)에서 넘어온 공항
  if (d) {
    const sh = hash.has('p') ? readShare(d, ap, hash) : null;
    endShared();
    if (sh) startShared(sh);
    render(d, null, { push: false, ap, shared: !!sh });
    // 공유받은 일정은 화면 위쪽 내용이 그려진 뒤 일정 위치로 이동
    if (sh) setTimeout(() => $('#sec-plan')?.scrollIntoView({ behavior: 'smooth' }), 900);
    else if (hash.has('p')) toast(tx('일정 링크를 읽지 못했어요', 'Could not read the itinerary link'));
    return;
  }
  if (p.get('q')) return render(p.get('q'), null, { push: false });
  if (legacy && !['main', 'top'].includes(legacy) && !legacy.startsWith('sec-')) return render(legacy, null, { push: false });
  renderHome();
}
addEventListener('popstate', route);

/* =========================================================
   첫 화면
   ========================================================= */
const chip = (d, hot) => `<button type="button" class="chip" data-go="${d.ko}">${d.flagImg}${d.name}${hot ? '<span class="hot">HOT</span>' : ''}</button>`;
function renderHome() {
  endShared(); current = null; curAp = null; stopVideos();
  document.title = tx('떠날지도 · 여행지 영상 미리보기', 'Maybe Go · See places on video');
  setCanonical('');
  const m = new Date().getMonth() + 1;
  const recent = store.get('recent', []).map(destByKo).filter(Boolean);
  const saved = getSaved();
  const goodNow = DESTS.filter(d => d.info.best?.includes(m)).slice(0, 10);
  const easy = DESTS.filter(d => d.visaFree && d.hours < 5).sort((a, b) => a.hours - b.hours);
  let html = tripSections();

  if (recent.length) html += `<section class="home-sec"><h2 class="sec-h">${tx('최근 본 여행지', 'Recently viewed')}</h2><div class="chips">${recent.map(d => chip(d)).join('')}</div></section>`;
  if (saved.length) html += savedSection();

  html += `<section class="home-sec"><h2 class="sec-h">🔥 ${tx('지금 인기 여행지', 'Popular right now')}</h2>
    <div class="carousel" role="list">${POPULAR.map(destByKo).map(d => { const file = COVER_IMG[d.ko] || SPOT_IMG[spotsFor(d, d.aps[0])[0].en]; return `
      <div class="cover-item" role="listitem"><button type="button" class="cover" data-go="${d.ko}" data-file="${esc(file || '')}">
        <img class="cover-img" src="${photoUrl(file, 640)}" alt="" loading="lazy" decoding="async"><span class="hot">HOT</span><small class="credit" aria-hidden="true"></small>
        <span class="cover-txt"><b>${d.flagImg}${d.name}</b><small>${esc(d.tagline)}</small><em>✈ ${esc(d.aps[0].time)}</em></span>
      </button></div>`; }).join('')}</div></section>`;

  html += `<section class="home-sec"><h2 class="sec-h">📅 ${tx(`${m}월에 가기 좋은 곳`, `Great places to visit in ${MON[m - 1]}`)}</h2><div class="chips">${goodNow.map(d => chip(d)).join('')}</div></section>
    <section class="home-sec"><h2 class="sec-h">🛂 ${tx('무비자 + 비행 5시간 이내', 'Visa-free and under 5 hours (Korean passport)')}</h2><div class="chips">${easy.map(d =>
      `<button type="button" class="chip" data-go="${d.ko}">${d.flagImg}${d.name}<small>${esc(d.aps[0].time.replace(/^(약|about) /, ''))}</small></button>`).join('')}</div></section>`;

  html += `<section class="home-sec"><h2 class="sec-h">🌏 ${tx('전체 여행지', 'All destinations')}</h2>${REGIONS.map(([r, list]) =>
    `<div class="region"><h3>${tx(r, EN_REGIONS[r] || r)}</h3><div class="chips">${list.map(ko => chip(destByKo(ko), POPULAR.includes(ko))).join('')}</div></div>`).join('')}</section>`;

  $('#main').innerHTML = html;
  $$('.carousel').forEach(dragScroll);
  showCoverCredits();
}
// 스크롤바 없이 좌우로 밀어서 넘기기. 터치는 브라우저의 기본 밀기를 쓰고, 마우스는 끌어서 넘김
function dragScroll(el) {
  let down = false, dragged = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, speed = 0, settle;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    clearTimeout(settle);
    down = true; dragged = false; speed = 0;
    startX = lastX = e.clientX; startLeft = el.scrollLeft; lastT = e.timeStamp;
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    if (!(e.buttons & 1)) return release(e);   // 화면 밖에서 버튼을 놓은 경우
    const dx = e.clientX - startX;
    if (!dragged) {
      if (Math.abs(dx) < 8) return;            // 조금 흔들린 것은 클릭으로
      dragged = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = startLeft - dx;
    speed = (e.clientX - lastX) / Math.max(1, e.timeStamp - lastT); lastX = e.clientX; lastT = e.timeStamp;
  });
  function release(e) {
    if (!down) return;
    down = false;
    if (!dragged) return;
    // 놓은 속도만큼 더 나아간 위치에서 가장 가까운 카드에 맞춤
    const flick = e.timeStamp - lastT < 80 ? Math.max(-1.5, Math.min(1.5, speed)) * 120 : 0;   // 최대 180px(카드 한 장 이내)
    const goal = el.scrollLeft - flick;
    const max = el.scrollWidth - el.clientWidth, first = el.firstElementChild.offsetLeft;
    const target = [...el.children].map(c => Math.min(max, c.offsetLeft - first))
      .reduce((a, b) => Math.abs(b - goal) < Math.abs(a - goal) ? b : a);
    el.scrollTo({ left: target, behavior: 'smooth' });
    settle = setTimeout(() => el.classList.remove('dragging'), 500);
    setTimeout(() => { dragged = false; });
  }
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('dragstart', e => e.preventDefault());
  // 끌어서 넘긴 직후의 클릭은 여행지 열기로 보지 않음
  el.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
}
// 첫 화면 표지 사진 출처: 카드 모서리에 작성자·라이선스
async function showCoverCredits() {
  const covers = $$('.cover[data-file]').filter(b => b.dataset.file);
  if (!covers.length) return;
  const cr = await fileCredits(covers.map(b => b.dataset.file));
  covers.forEach(b => { const c = cr[b.dataset.file]; if (c) $('.credit', b).textContent = `${c.a} · ${c.l}`; });
}
function savedSection() {
  const groups = {};
  getSaved().forEach(k => { const [c, s] = k.split('|'); (groups[c] ||= []).push(s); });
  return `<section class="home-sec" id="savedSec"><h2 class="sec-h">♥ ${tx('내 여행 보관함', 'Saved places')}</h2><div class="saved-list">${Object.entries(groups).map(([c, list]) => {
    const d = destByKo(c); if (!d) return '';
    return `<div class="saved-row"><button type="button" class="saved-c" data-go="${c}">${d.flagImg}<b>${d.name}</b><small>${tx(`${list.length}곳 · 일정 보기 →`, `${plural(list.length, 'place')} · View plan →`)}</small></button>
      <div class="chips">${list.map(s => `<span class="chip static">${esc(spotTitle(s))}<button type="button" class="x-sm" data-unsave="${esc(c)}|${esc(s)}" aria-label="${esc(tx(`${s} 보관함에서 빼기`, `Remove ${spotTitle(s)} from saved`))}">×</button></span>`).join('')}</div></div>`;
  }).join('')}</div></section>`;
}
/* ---------- 저장한 여행 (여러 개) ----------
   여행: { id, ko, ap, city, trip: 'round'|'oneway', d1, d2, checks }. 일정(plans)·항공 시각(flights)은 여행 id로 저장 */
const newTripId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const isOneway = t => t.trip === 'oneway' || t.d2 === t.d1;
const tripEnd = t => isOneway(t) ? addDays(t.d1, 3) : t.d2;   // 편도는 추천 일정 길이(4일)까지를 여행 중으로
// 일정·항공 시각을 다른 이름(공항 코드 → 여행 id)으로 옮기거나, to가 없으면 지움
function moveTripData(from, to) {
  ['plans', 'flights'].forEach(k => {
    const all = store.get(k, {}); if (!all[from]) return;
    if (to) all[to] = all[from];
    delete all[from]; store.set(k, all);
  });
}
function getTrips() {
  const list = store.get('trips'); if (Array.isArray(list)) return list;
  // 예전 버전(여행 하나만 저장)의 기록을 옮김
  const old = store.get('trip'), d = old && destByKo(old.ko);
  if (!d) return [];
  const t = { ...old, id: newTripId(), ap: old.ap || d.aps[0].code, trip: old.d2 === old.d1 ? 'oneway' : 'round' };
  store.set('trips', [t]);
  if (store.get('trips')) { moveTripData(t.ap, t.id); store.del('trip'); }   // 새 기록이 저장된 것을 확인한 뒤 정리
  return [t];
}
const sameDates = t => t.trip === S.trip && t.d1 === S.d1 && (t.trip === 'oneway' || t.d2 === S.d2);
const tripAt = code => getTrips().find(t => t.ap === code && sameDates(t));   // 지금 보는 공항·날짜의 저장한 여행
const planKey = () => tripAt(curAp.code)?.id || curAp.code;
const tripDates = t => `${fmtD(t.d1)}${isOneway(t) ? tx(' 편도', ' · one way') : ' – ' + fmtD(t.d2)}`;
// 저장한 여행의 도시 이름은 저장할 때의 언어와 관계없이 지금 언어로
const tripCity = t => { const a = destByKo(t.ko)?.aps.find(x => x.code === t.ap); return a ? cityOf(a) : t.city || t.ko; };
// 지금 공항·검색 날짜로 새 여행을 저장
function addTrip() {
  const t = { id: newTripId(), ko: current.ko, ap: curAp.code, city: cityOf(curAp), trip: S.trip, d1: S.d1, d2: S.trip === 'oneway' ? S.d1 : S.d2, checks: {} };
  store.set('trips', [...getTrips(), t]);
  return t;
}
function updateTrip(id, change) {
  store.set('trips', getTrips().map(t => t.id === id ? { ...t, ...change } : t));
}
// 검색 날짜를 저장한 여행의 날짜로
function applyTripDates(t) {
  endShared();
  Object.assign(S, { trip: t.trip, d1: t.d1, d2: isOneway(t) ? addDays(t.d1, 4) : t.d2 });
  saveS(); syncForm();
}

function tripCard(t, open) {
  const d = destByKo(t.ko), n = dday(t.d1), done = CHECKS.filter((_, i) => t.checks?.[i]).length;
  return `<div class="trip-card" data-trip-id="${esc(t.id)}">
    <div class="trip-top"><div><span class="dday">${n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : tx('여행 중', 'On trip')}</span>
      <h2>${d.flagImg}${esc(tx(`${tripCity(t)} 여행`, `Trip to ${tripCity(t)}`))}</h2><p>${tripDates(t)}</p></div>
      <div class="trip-acts"><button type="button" class="btn" data-open-trip="${esc(t.id)}">${tx('여행 보기', 'Open trip')}</button><button type="button" class="btn ghost" data-del-trip="${esc(t.id)}">${tx('삭제', 'Delete')}</button></div></div>
    <details ${open ? 'open' : ''}><summary>${tx('준비 체크리스트', 'Packing & prep checklist')} <small>${done}/${CHECKS.length}</small></summary>
      <div class="checks">${CHECKS.map((c, i) => `<label class="check-item"><input type="checkbox" data-ci="${i}" ${t.checks?.[i] ? 'checked' : ''}> ${c}</label>`).join('')}</div></details>
  </div>`;
}
// 첫 화면: 다가오는 여행은 가까운 순서의 카드(첫 번째만 체크리스트를 펼침), 지난 여행은 한 줄 목록
function tripSections() {
  const trips = getTrips().filter(t => destByKo(t.ko)).sort((a, b) => a.d1.localeCompare(b.d1));
  const next = trips.filter(t => tripEnd(t) >= today()), past = trips.filter(t => tripEnd(t) < today()).reverse();
  return (next.length ? `<section class="home-sec trips">${next.length > 1 ? `<h2 class="sec-h">✈ ${tx(`내 여행 ${next.length}개`, `My trips (${next.length})`)}</h2>` : ''}${next.map((t, i) => tripCard(t, i === 0)).join('')}</section>` : '')
    + (past.length ? `<section class="home-sec"><h2 class="sec-h">🧳 ${tx('다녀온 여행', 'Past trips')}</h2><div class="past-trips">${past.map(t => `
      <div class="past-trip">${destByKo(t.ko).flagImg}<b>${esc(tripCity(t))}</b><small>${tripDates(t)}</small>
        <button type="button" class="btn ghost" data-open-trip="${esc(t.id)}">${tx('일정 보기', 'View plan')}</button><button type="button" class="btn ghost" data-del-trip="${esc(t.id)}">${tx('삭제', 'Delete')}</button></div>`).join('')}</div></section>` : '');
}
$('#main').addEventListener('click', e => {
  const open = e.target.closest('[data-open-trip]');
  if (open) {
    const t = getTrips().find(x => x.id === open.dataset.openTrip); if (!t) return;
    applyTripDates(t); $('#q').value = destByKo(t.ko).name;
    return render(destByKo(t.ko), null, { ap: t.ap });
  }
  const del = e.target.closest('[data-del-trip]'); if (!del) return;
  if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = tx('한 번 더 누르면 삭제', 'Click again to delete'); return; }   // 일정까지 지워지므로 두 번 확인
  const id = del.dataset.delTrip;
  store.set('trips', getTrips().filter(t => t.id !== id)); moveTripData(id);
  toast(tx('여행을 삭제했어요', 'Trip deleted')); renderHome();
});
$('#main').addEventListener('change', e => {
  const cb = e.target.closest('.trip-card [data-ci]'); if (!cb) return;
  const card = cb.closest('.trip-card'), t = getTrips().find(x => x.id === card.dataset.tripId); if (!t) return;
  const checks = { ...t.checks, [cb.dataset.ci]: cb.checked };
  updateTrip(t.id, { checks });
  $('summary small', card).textContent = `${CHECKS.filter((_, i) => checks[i]).length}/${CHECKS.length}`;
});

/* =========================================================
   여행지 화면
   ========================================================= */
const SECTIONS = [['spots', tx('🎬 명소', '🎬 Sights')], ['info', tx('📋 정보', '📋 Info')], ['plan', tx('🗓 일정', '🗓 Plan')], ['food', tx('🍜 먹거리', '🍜 Food')], ['flights', tx('✈️ 항공', '✈️ Flights')], ['hotels', tx('🏨 호텔', '🏨 Hotels')], ['more', tx('🎟 투어·준비', '🎟 Tours & prep')]];
function render(q, word, opts = {}) {
  hideSuggest(); $$('.pop').forEach(p => p.hidden = true); stopVideos();
  if (!opts.shared) endShared();
  const d = typeof q === 'object' ? q : findDest(q);
  if (d) {
    current = d;
    curAp = (opts.ap && d.aps.find(a => a.code === opts.ap)) || airportFor(d, word ?? (typeof q === 'string' ? q : null));
    addRecent(d.ko);
  } else {
    current = { ko: q, name: q, custom: true, flagImg: '📍', tagline: tx('검색한 여행지의 영상을 모아봤어요', 'Videos found for your search'), spots: null, info: {}, aliases: [],
      aps: [{ code: '', name: q, city: q, en: q, time: '' }], areas: [{ n: tx(q + ' 중심가', q + ' centre'), d: tx('주요 명소 접근성이 좋은 지역', 'Handy for the main sights') }] };
    curAp = current.aps[0];
  }
  const c = current, I = c.info, m = new Date().getMonth() + 1;
  setURL(opts.push !== false);
  document.title = tx(`${c.ko} 여행 · 떠날지도`, `${c.name} travel · Maybe Go`);
  setCanonical(c.custom ? '' : '?d=' + c.slug);
  if (!$('#q').value || opts.push === false) $('#q').value = c.name;

  $('#main').innerHTML = `
    <div class="dest-head">
      <div>
        <h2>${c.flagImg}${esc(c.name)}<span id="seasonBadge"></span></h2>
        <p id="destTagline">${esc(c.tagline)}</p>
      </div>
      <div class="head-acts">
        ${c.custom ? '' : '<button type="button" class="btn" id="tripSave"></button>'}
        <button type="button" class="btn ghost" id="shareBtn">${tx('공유', 'Share')}</button>
      </div>
    </div>
    ${c.custom ? '' : `<div class="facts">
      <div class="fact"><span class="fi">🛂</span><div><b>${tx('입국', 'Entry (Korean passport)')}</b><span id="fVisa">${esc(c.visa)}</span></div></div>
      <div class="fact fx" id="fx"><span class="fi">💱</span><div><b>${tx('환율', 'Exchange rate')}</b>${tx('불러오는 중…', 'Loading…')}</div></div>
      <div class="fact" id="wxFact"><span class="fi">🌤</span><div><b>${tx('날씨', 'Weather')}</b>${tx('불러오는 중…', 'Loading…')}</div></div>
      <div class="fact"><span class="fi">🕐</span><div><b>${tx('시차', 'Time difference')}</b><span id="fTz">${esc(c.tz)}</span></div></div>
      ${I.plug ? `<div class="fact ${I.ok ? 'good' : 'warn'}"><span class="fi">🔌</span><div><b>${tx('플러그 · 전압', 'Plug · voltage')}</b>${esc(I.plug)} ${esc(I.volt)}${I.ok ? tx(' · 그대로 사용', ' · Korean plugs fit') : tx(' · 변환 플러그 필요', ' · adapter needed for Korean plugs')}</div></div>` : ''}
      ${I.lang ? `<div class="fact"><span class="fi">🗣</span><div><b>${tx('언어', 'Language')}</b>${esc(I.lang)}</div></div>` : ''}
      ${I.tip ? `<div class="fact"><span class="fi">💁</span><div><b>${tx('팁', 'Tipping')}</b><span id="fTip">${esc(I.tip)}</span></div></div>` : ''}
    </div>`}
    <nav class="tabs" aria-label="${tx('여행지 메뉴', 'Destination menu')}">${SECTIONS.filter(([id]) => !(c.custom && ['plan'].includes(id)))
      .map(([id, l]) => `<a class="tab" href="#sec-${id}" data-sec="${id}">${l}</a>`).join('')}</nav>
    <section class="block" id="sec-spots" aria-labelledby="h-spots">
      <div class="block-title"><h3 id="h-spots">🎬 <span id="spotCity">${esc(c.custom ? c.ko : cityOf(curAp))}</span> ${tx('명소 숏폼', 'sights on video')}</h3>
        <button type="button" class="btn reels" id="reelsBtn">▶ ${tx('릴스로 몰아보기', 'Watch as reels')}</button></div>
      <div class="grid" id="grid"></div>
    </section>
    <section class="block" id="sec-info"></section>
    ${c.custom ? '' : '<section class="block" id="sec-plan"></section>'}
    <section class="block" id="sec-food"></section>
    <section class="block" id="sec-flights"></section>
    <section class="block" id="sec-hotels"></section>
    <section class="block" id="sec-more"></section>`;

  $('#shareBtn').addEventListener('click', share);
  $('#tripSave')?.addEventListener('click', saveTrip);
  $('#reelsBtn').addEventListener('click', () => openViewer(0, true));
  renderSpots(opts.spot);
  renderInfo(); renderPlan(); renderFood(); renderTravel(); renderMore();   // renderInfo가 날씨도 불러옴
  if (!c.custom) showFx();
  setupScrollspy();
  $('#main').scrollIntoView({ behavior: 'smooth' });
}

function saveTrip() {
  if (sharedHere()) return keepShared($('#tripSave'));   // 공유받은 일정을 보는 중이면 그 일정까지 함께 저장
  if (tripAt(curAp.code)) return toast(tx('이 날짜의 여행은 이미 저장돼 있어요', 'A trip for these dates is already saved'));
  const t = addTrip();
  moveTripData(curAp.code, t.id);   // 저장 전에 편집한 일정·항공 시각은 이 여행의 것
  renderPlan();
  toast(tx(`${t.city} 여행을 저장했어요 · 첫 화면에서 D-${Math.max(0, dday(t.d1))}와 체크리스트를 볼 수 있어요`, `Saved your ${t.city} trip · see the countdown and checklist on the home page`));
}
// 저장 버튼 문구: 지금 날짜의 여행이 저장돼 있는지에 따라
function updateTripButton() {
  const b = $('#tripSave'); if (!b) return;
  delete b.dataset.sure;
  b.textContent = !sharedHere() && tripAt(curAp.code) ? tx('✓ 저장한 여행', '✓ Saved trip') : getTrips().some(t => t.ap === curAp.code) ? tx('✈ 이 날짜로 새 여행 저장', '✈ Save a new trip for these dates') : tx('✈ 내 여행으로 저장', '✈ Save to my trips');
}
const share = () => shareLink(shareURL(), tx(`${current.ko} 여행 · 떠날지도`, `${current.name} travel · Maybe Go`), tx(`${current.ko} 명소를 영상으로 미리 보기`, `Preview ${current.name} sights on video`), tx('링크를 복사했어요', 'Link copied'));
async function shareLink(url, title, text, done) {
  try {
    if (navigator.share) return await navigator.share({ title, text, url });
    await navigator.clipboard.writeText(url); toast(done);
  } catch (e) { if (e?.name !== 'AbortError') prompt(tx('아래 링크를 복사하세요', 'Copy the link below'), url); }
}

/* ---------- 명소 카드 ---------- */
const ytLink = name => 'https://www.youtube.com/results?search_query=' + enc(name + tx(' 여행 shorts', ' travel shorts'));
const mapLink = (name, city) => 'https://www.google.com/maps/search/?api=1&query=' + enc(name + (city ? ' ' + city : ''));
let loader, player;
async function renderSpots(focusSpot) {
  const c = current, grid = $('#grid');
  let spots = c.custom ? c.spots : spotsFor(c, curAp);
  if ($('#spotCity')) $('#spotCity').textContent = c.custom ? c.ko : cityOf(curAp);
  if (!spots) {   // 데이터에 없는 여행지: Commons에서 직접 검색
    grid.innerHTML = `<div class="state">🔎 ${tx('영상을 찾는 중…', 'Searching for videos…')}</div>`;
    let vids = [], term = c.ko;
    try {
      // Commons 파일 이름은 대부분 영어라, 한글 지명은 영문 지명으로 바꿔 검색 (예: 괌 → Guam)
      term = (await withTimeout(enName(c.ko), 5000).catch(() => null)) || c.ko;
      vids = await withTimeout(fetchVideos(term), 12000);
    } catch {}
    if (current !== c) return;
    if (!vids.length) {
      const label = `'${esc(c.ko)}${term !== c.ko ? ` (${esc(term)})` : ''}'`;
      grid.innerHTML = `<div class="state"><b>🧭</b><p>${tx(`${label} 영상을 찾지 못했어요.`, `No videos found for ${label}.`)}</p>
        <p class="muted">${tx('영문 지명(예: Bali, Prague)으로 검색하거나 YouTube에서 찾아보세요.', 'Try another spelling (e.g. Bali, Prague) or search YouTube.')}</p>
        <a class="btn" href="${ytLink(c.ko)}" target="_blank" rel="noopener">▶ ${tx('YouTube 쇼츠에서 보기', 'See YouTube Shorts')}</a></div>`;
      $('#reelsBtn').hidden = true; return;
    }
    spots = c.spots = vids.map(v => ({ ko: v.title, name: v.title, en: null, d: '', preset: [v] }));
  }
  $('#reelsBtn').hidden = false;
  grid.innerHTML = spots.map((s, i) => `
    <article class="vcard" data-i="${i}" tabindex="0" aria-label="${esc(tx(`${s.ko} 영상 크게 보기`, `Watch ${nm(s)}`))}">
      <div class="media"><div class="skeleton"></div></div>
      <div class="top">
        <span class="badge">${tx('불러오는 중', 'Loading')}</span>
        ${c.custom ? '' : `<button type="button" class="heart${isSaved(c.ko, s.ko) ? ' on' : ''}" aria-pressed="${isSaved(c.ko, s.ko)}" aria-label="${esc(tx(`${s.ko} 보관함에 저장`, `Save ${nm(s)}`))}">♥</button>`}
      </div>
      <div class="meta">${s.g ? `<span class="tag">🚆 ${tx('근교', 'Day trip')} · ${esc(s.g)}</span>` : ''}<h4>${esc(nm(s))}</h4>${s.d ? `<p>${esc(s.d)}</p>` : ''}
        ${s.en && SPOT_META[s.en] ? (m => `<p class="info-line">🕐 ${esc(tx(`${m.slot} 추천 · ${m.stay}시간`, `Best: ${m.slotName} · ${m.stay} h`))} · ${esc(m.fee)}${m.note ? ` · <b>${esc(m.note)}</b>` : ''}</p>`)(spotMeta(s)) : ''}
        <div class="acts"><a class="pill" href="${ytLink(s.en || s.ko)}" target="_blank" rel="noopener">▶ ${tx('쇼츠', 'Shorts')}</a>
        ${s.en ? `<a class="pill" href="${mapLink(s.en, '')}" target="_blank" rel="noopener" title="${tx('Google 지도에서 위치와 오늘 운영시간 확인', 'Location and today\'s opening hours on Google Maps')}">📍 ${tx('지도·운영시간', 'Map & hours')}</a>` : ''}</div></div>
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
  if (e.target.closest('.retry')) { card._state = null; card._img = null; card.querySelector('.media').innerHTML = '<div class="skeleton"></div>'; return loadCard(card); }
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
  if (cls.includes('cycle')) { b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-label', tx('다른 영상 보기', 'Show another video')); }
}
// 카드: 고정 대표 사진을 먼저 보여주고, 영상이 준비되면 그 위에 자연스럽게 겹쳐 재생
const spotPhoto = s => s.en ? wikiImage(s.en).catch(() => null) : Promise.resolve(s.preset?.[0]?.poster || null);
function showPhoto(el, src) {
  if (!src || el._img === src) return;
  const media = $('.media', el);
  $('img.poster', media)?.remove();
  const img = new Image(); img.className = 'poster'; img.alt = nm(el._spot); img.decoding = 'async'; img.src = src;
  img.onload = () => $('.skeleton', media)?.remove();
  img.onerror = () => { img.remove(); el._img = null; if (el._state === 'photo') setPlaceholder(el); };
  media.prepend(img); el._img = src;
}
async function loadCard(el) {
  if (el._state === 'loading') return;
  const s = el._spot, photoP = withTimeout(spotPhoto(s), 8000).catch(() => null);
  if (!hasVideo(s)) {   // 고정 영상이 없으면 기다리지 않고 바로 사진
    el._state = 'loading'; setBadge(el, tx('사진 불러오는 중', 'Loading photo'), 'loading');
    const img = await photoP;
    if (el.isConnected) img ? setPhoto(el, img) : setPlaceholder(el);
    return;
  }
  el._state = 'loading'; setBadge(el, tx('영상 불러오는 중', 'Loading video'), 'loading');
  photoP.then(src => el.isConnected && showPhoto(el, src));
  try {
    el._vids = await withTimeout(spotVideos(s), 8000);
    if (!el.isConnected) return;
    if (el._vids.length) return setVideo(el, 0);
    const img = await photoP;
    img ? setPhoto(el, img) : setPlaceholder(el);
  } catch {
    if (!el.isConnected) return;
    const img = await photoP;
    img ? setPhoto(el, img, true) : setError(el);   // 영상 연결 실패: 사진이라도 보여주고 다시 시도 가능
  }
}
function setVideo(el, idx) {
  const v = el._vids[idx]; el._idx = idx; el._state = 'video'; el.classList.remove('is-photo');
  const media = $('.media', el);
  $('video', media)?.remove(); $('.placeholder', media)?.remove();
  if (!el._img && !$('.skeleton', media)) media.insertAdjacentHTML('afterbegin', '<div class="skeleton"></div>');
  const vid = document.createElement('video');
  Object.assign(vid, { muted: true, loop: true, playsInline: true, preload: 'metadata', src: v.src });   // 흐린 첫 프레임 대신 대표 사진이 비침
  vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
  media.append(vid); el._v = vid;
  const n = el._vids.length;
  setBadge(el, `${tx('영상', 'Video')} ${idx + 1}/${n} <span aria-hidden="true">⟳</span>`, 'cycle');   // 영상 수와 관계없이 같은 모양
  vid.addEventListener('playing', () => { vid.classList.add('on'); $('.skeleton', media)?.remove(); $('.badge', el).classList.add('live'); }, { once: true });
  vid.addEventListener('error', () => {   // 재생 실패 → 다음 후보 → 사진
    if (el._v !== vid) return;
    if (idx + 1 < n) return setVideo(el, idx + 1);
    vid.remove(); el._vids = []; el._v = null;
    el._img ? setPhoto(el, el._img) : spotPhoto(el._spot).then(img => img ? setPhoto(el, img) : setPlaceholder(el));
  });
  vid.play().catch(() => {});
}
function cycle(el) {
  if (!el._vids?.length) return;
  if (el._vids.length < 2) return toast(tx(`'${el._spot.ko}' 영상은 1개예요 · ▶ 쇼츠에서 더 볼 수 있어요`, `Only one video for '${nm(el._spot)}' · more on ▶ Shorts`));
  setVideo(el, (el._idx + 1) % el._vids.length);
}
function setPhoto(el, src, failed) {
  el._state = failed ? 'error' : 'photo'; el._v = null; el.classList.add('is-photo');   // 사진은 천천히 확대(켄 번즈)
  $('video', $('.media', el))?.remove();
  showPhoto(el, src);
  setBadge(el, failed ? tx('사진 · 영상 연결 실패', 'Photo · video failed') : tx('사진 · 영상은 쇼츠에서', 'Photo · videos on Shorts'), 'photo');
  if (failed && !$('.retry', el)) $('.media', el).insertAdjacentHTML('beforeend', `<button type="button" class="retry floating">${tx('영상 다시 시도', 'Retry video')}</button>`);
}
function setPlaceholder(el) {
  el._state = 'none'; el._v = null; el._img = null; el.classList.remove('is-photo');
  $('.media', el).innerHTML = `<div class="placeholder" aria-hidden="true">🏞</div>`;
  setBadge(el, tx('영상 준비 중 · 쇼츠에서 보기', 'No video yet · see Shorts'), 'photo');
}
function setError(el) {
  el._state = 'error'; el.classList.remove('is-photo');
  $('.media', el).innerHTML = `<div class="placeholder err"><span aria-hidden="true">⚠️</span><p>${tx('불러오지 못했어요', 'Could not load')}</p><button type="button" class="retry">${tx('다시 시도', 'Retry')}</button></div>`;
  setBadge(el, tx('연결 실패', 'Failed'), 'photo');
}
function stopVideos() { $$('.vcard video').forEach(v => v.pause()); }

/* ---------- 릴스 뷰어 (스와이프 · 방향키 · 자동 넘기기) ---------- */
let vIdx = 0, vTimer = null, vOrder = [];   // vOrder: 뷰어에서 보여줄 카드 순서 (카드 번호 목록), vIdx: 그 안의 위치
const vCards = () => $$('#grid .vcard');
const vCard = () => vCards()[vOrder[vIdx]];
const likelyVideo = el => el._state ? el._state === 'video' || (el._state === 'loading' && hasVideo(el._spot)) : hasVideo(el._spot);
async function openViewer(i, auto) {
  const cards = vCards(); if (!cards.length) return;
  stopVideos();
  // '릴스로 몰아보기'는 영상이 있는 명소부터 보여주고 사진만 있는 명소는 뒤로. 카드를 눌러 열면 카드 순서 그대로
  const all = cards.map((_, k) => k);
  vOrder = auto ? [...all.filter(k => likelyVideo(cards[k])), ...all.filter(k => !likelyVideo(cards[k]))] : all;
  $('#viewer').hidden = false; document.body.classList.add('noscroll');
  $('#vAuto').checked = auto || store.get('autoReels', false);
  showViewer(auto ? 0 : Math.max(0, vOrder.indexOf(i)));
  $('#vClose').focus();
}
async function showViewer(i) {
  const cards = vCards(), n = vOrder.length; vIdx = (i + n) % n;
  const el = cards[vOrder[vIdx]], s = el._spot, vid = $('#vVid'), img = $('#vImg');
  clearTimeout(vTimer); $('#vBar').style.transition = 'none'; $('#vBar').style.width = '0';
  $('#vCount').textContent = `${vIdx + 1} / ${n}`;
  $('#vTitle').textContent = nm(s); $('#vDesc').textContent = s.d || '';
  const vm = s.en && SPOT_META[s.en] ? spotMeta(s) : null;
  $('#vMeta').textContent = vm ? `🕐 ${tx(`${vm.slot} 추천 · 머무는 시간 약 ${vm.stay}시간`, `Best: ${vm.slotName} · stay about ${vm.stay} h`)} · ${vm.fee}${vm.note ? ' · ' + vm.note : ''}` : '';
  $('#vYt').href = ytLink(s.en || s.ko);
  $('#vMap').hidden = true; $('#vMapBtn').setAttribute('aria-pressed', 'false');
  const saved = !current.custom && isSaved(current.ko, s.ko);
  $('#vHeart').hidden = !!current.custom;
  $('#vHeart').textContent = saved ? tx('♥ 저장됨', '♥ Saved') : tx('♡ 저장', '♡ Save'); $('#vHeart').setAttribute('aria-pressed', saved);
  $('#vMapBtn').hidden = !s.en;
  if (!el._state || el._state === 'loading') {
    $('#vCredit').textContent = tx('불러오는 중…', 'Loading…'); vid.pause(); vid.hidden = true; img.hidden = true;
    if (!el._state) loadCard(el);
    for (let t = 0; el._state === 'loading' && t < 90; t++) await sleep(200);   // 카드 로딩이 끝날 때까지 대기
    if (vCard() !== el || $('#viewer').hidden) return;
  }
  const v = el._vids?.[el._idx];
  const file = !v && el._img && s.en ? SPOT_IMG[s.en] : null;   // 사진의 Wikimedia 파일명 (photos.js)
  vid.pause(); img.classList.remove('kb');
  if (v) {
    img.hidden = true; vid.hidden = false;
    vid.poster = el._img || ''; vid.src = v.hd; vid.loop = !$('#vAuto').checked; vid.controls = true; vid.muted = false;
    vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
  } else {
    vid.removeAttribute('src'); vid.load(); vid.hidden = true;
    img.hidden = !el._img; img.src = el._img || ''; img.alt = nm(s);
    if (el._img) { void img.offsetWidth; img.classList.add('kb'); }   // 사진은 천천히 확대(켄 번즈)
    if (file) {   // 카드용 작은 사진을 먼저 보여주고, 큰 화면용 고해상도 사진이 준비되면 교체
      const hd = new Image(); hd.src = photoUrl(file, 1280);
      hd.onload = () => { if (vCard() === el && !$('#viewer').hidden && img.src === el._img) img.src = hd.src; };
    }
  }
  showCredit(el, v, file);
  armAuto();
}
// 출처 표시: 작성자 · 라이선스 · 원본(파일 설명 페이지) 링크
function showCredit(el, v, file) {
  const kind = v ? tx('영상', 'Video') : tx('사진', 'Photo'), f = v ? fileOf(v.page) : file;
  $('#vSrc').hidden = !f; $('#vSrc').href = v ? v.page : f ? 'https://commons.wikimedia.org/wiki/File:' + enc(f) : '';
  $('#vCredit').textContent = v ? `${tx('영상', 'Video')} · ${v.title} · Wikimedia Commons` : el._img ? tx('사진 · Wikimedia Commons', 'Photo · Wikimedia Commons') : tx('이 명소는 아직 영상이 없어요 · 쇼츠에서 보기', 'No video for this sight yet · see Shorts');
  if (!f) return;
  fileCredits([f]).then(cr => {
    const c = cr[f]; if (!c || vCard() !== el || $('#viewer').hidden) return;
    $('#vCredit').textContent = `${kind} · ${c.a} · ${c.l} · Wikimedia Commons`;
    $('#vSrc').href = c.u;
  });
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
  vCard()?.focus();
}
$('#vClose').addEventListener('click', closeViewer);
$('#vPrev').addEventListener('click', () => showViewer(vIdx - 1));
$('#vNext').addEventListener('click', () => showViewer(vIdx + 1));
$('#vHeart').addEventListener('click', () => {
  const el = vCard(), on = toggleSaved(current.ko, el._spot.ko);
  $('#vHeart').textContent = on ? tx('♥ 저장됨', '♥ Saved') : tx('♡ 저장', '♡ Save'); $('#vHeart').setAttribute('aria-pressed', on);
  const h = $('.heart', el); h?.classList.toggle('on', on); renderPlan();
});
$('#vMapBtn').addEventListener('click', () => {
  const m = $('#vMap'), s = vCard()._spot, open = m.hidden;
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
    el().innerHTML = `<span class="fi">💱</span><div><b>${tx('환율', 'Exchange rate')} · ${d.getMonth() + 1}/${d.getDate()}${tx(' 기준', '')}</b>${unit.toLocaleString()} ${cur} = ${tx('', '₩')}${(won * unit).toLocaleString(tx('ko-KR', 'en-US'), { maximumFractionDigits: won * unit < 100 ? 2 : 0 })}${tx('원', '')}
      ${chg == null ? '' : `<span class="chg ${chg > 0 ? 'up' : chg < 0 ? 'down' : ''}" title="${tx('전일 대비', 'vs previous day')}">${chg > 0 ? '▲' : chg < 0 ? '▼' : '–'} ${Math.abs(chg).toFixed(2)}%</span>`}</div>`;
    c._fx = won;
    renderCalc();
  } catch { el()?.remove(); }
}

/* ---------- 날씨 (Open-Meteo, 키 없이 사용) ---------- */
const WX = [[0, '☀️', tx('맑음', 'Clear')], [1, '🌤', tx('대체로 맑음', 'Mostly clear')], [2, '⛅', tx('구름 조금', 'Partly cloudy')], [3, '☁️', tx('흐림', 'Cloudy')], [48, '🌫', tx('안개', 'Fog')], [57, '🌦', tx('이슬비', 'Drizzle')], [67, '🌧', tx('비', 'Rain')], [77, '🌨', tx('눈', 'Snow')], [82, '🌦', tx('소나기', 'Showers')], [86, '🌨', tx('눈 소나기', 'Snow showers')], [99, '⛈', tx('뇌우', 'Thunderstorm')]];
const wx = code => WX.find(([c]) => code <= c) || WX[3];
// 여행 날짜가 2주 이내면 그 날짜의 실제 예보, 더 멀면 같은 달의 최근 3년 평균(기온·비 오는 날)
const FORECAST_DAYS = 14;
const geo = ap => cached('g:' + ap.en, async () => (await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${enc(ap.en)}&count=1&language=${LANG}`)).json()).results?.[0] || null);
// 목록에 없는 여행지의 좌표. 지명 검색은 한글을 못 찾거나 동명 지역(Palau → 이탈리아)을 고르므로
// 영어 위키백과 문서의 좌표를 먼저 쓰고, 없을 때만 지명 검색
const customGeo = q => cached('cg:' + q, async () => {
  const title = (await enTitle(q)) || q;
  const j = await (await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=coordinates&titles=' + enc(title))).json();
  const at = j.query?.pages?.[0]?.coordinates?.[0];
  return at ? { latitude: at.lat, longitude: at.lon } : geo({ en: q });
});
function climate(g) {
  const Y = new Date().getFullYear();
  return cached(`clim:${g.latitude.toFixed(2)},${g.longitude.toFixed(2)}:${Y}`, async () => {
    const j = await (await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${g.latitude}&longitude=${g.longitude}&start_date=${Y - 3}-01-01&end_date=${Y - 1}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)).json();
    const acc = Array.from({ length: 12 }, () => ({ hi: 0, lo: 0, n: 0, rain: 0, mm: 0 }));
    j.daily.time.forEach((t, i) => {
      const a = acc[+t.slice(5, 7) - 1], hi = j.daily.temperature_2m_max[i], lo = j.daily.temperature_2m_min[i], p = j.daily.precipitation_sum[i];
      if (hi == null || lo == null) return;
      a.hi += hi; a.lo += lo; a.n++; if (p >= 1) a.rain++; a.mm += p || 0;
    });
    return acc.map(a => a.n ? { hi: a.hi / a.n, lo: a.lo / a.n, rainDays: a.rain / 3, mm: a.mm / 3 } : null);
  });
}
const packTip = (hi, lo, rain) => [hi < 8 ? tx('🧥 두꺼운 패딩·장갑', '🧥 Heavy coat and gloves') : hi < 16 ? tx('🧥 코트나 두꺼운 겉옷', '🧥 Coat or warm layer') : hi < 23 ? tx('🧶 가벼운 겉옷', '🧶 Light layer') : tx('👕 반팔·자외선 차단', '👕 Short sleeves and sunscreen'),
  lo < 3 && hi >= 8 ? tx('아침저녁 쌀쌀함', 'chilly mornings and evenings') : '', rain >= 10 ? tx('☔ 우산 필수', '☔ Umbrella essential') : rain >= 5 ? tx('🌂 작은 우산', '🌂 Small umbrella') : ''].filter(Boolean).join(' · ');
async function showWeather() {
  const c = current, ap = curAp, d1 = S.d1, d2 = S.trip === 'oneway' ? addDays(S.d1, 3) : S.d2;
  const el = () => current === c && curAp === ap && S.d1 === d1;
  const box = () => $('#wxBox'), fact = () => $('#wxFact'), city = esc(cityOf(ap));
  try {
    const g = await (c.custom ? customGeo(c.ko) : geo(ap)); if (!g) throw 0;
    const base = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&timezone=auto`;
    const away = dday(d1);
    const [now, fc] = await Promise.all([
      fetch(`${base}&current=temperature_2m,weather_code`).then(r => r.json()),
      away <= FORECAST_DAYS ? fetch(`${base}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&start_date=${d1}&end_date=${[d2, addDays(today(), 15)].sort()[0]}`).then(r => r.json()) : null
    ]);
    if (!el()) return;
    const [, ic, label] = wx(now.current.weather_code);
    if (fact()) fact().innerHTML = `<span class="fi">${ic}</span><div><b>${tx(`지금 ${city} 날씨`, `${city} now`)}</b>${Math.round(now.current.temperature_2m)}° ${label}</div>`;
    if (!box()) return;
    if (fc?.daily) {
      const t = fc.daily.time.slice(0, 8);
      box().innerHTML = `<h4>🌤 ${tx(`${city} 여행 기간 예보`, `${city} forecast for your dates`)}</h4><div class="wx-days">${t.map((day, i) => {
        const [, di, dl] = wx(fc.daily.weather_code[i]), dd = parseD(day), pr = fc.daily.precipitation_probability_max?.[i];
        return `<div class="wx-day"><small>${dd.getMonth() + 1}/${dd.getDate()}(${WD[dd.getDay()]})</small><span title="${dl}">${di}</span>
          <b>${Math.round(fc.daily.temperature_2m_max[i])}°</b><small>${Math.round(fc.daily.temperature_2m_min[i])}°${pr != null ? ` · ☔${pr}%` : ''}</small></div>`;
      }).join('')}</div>${d2 > fc.daily.time.at(-1) ? `<p class="muted small">${tx('이후 날짜는 아직 예보가 없어요.', 'No forecast yet for later dates.')}</p>` : ''}`;
    } else {
      const cl = await climate(g); if (!el()) return;
      const months = [...new Set([parseD(d1).getMonth(), parseD(d2).getMonth()])];
      box().innerHTML = `<h4>📊 ${tx(`${city} 여행 시기 평균 날씨`, `${city} typical weather`)} <small class="muted">${tx('최근 3년', 'last 3 years')}</small></h4>${months.map(mi => { const s = cl[mi]; if (!s) return '';
        return `<div class="clim"><b class="clim-m">${monthName(mi + 1)}</b>
          <div class="clim-row"><span><small>${tx('평균 최고', 'Avg high')}</small><b>${Math.round(s.hi)}°</b></span><span><small>${tx('평균 최저', 'Avg low')}</small><b>${Math.round(s.lo)}°</b></span>
          <span><small>${tx('비 오는 날', 'Rainy days')}</small><b>${Math.round(s.rainDays)}${tx('일', '')}</b></span><span><small>${tx('강수량', 'Rainfall')}</small><b>${Math.round(s.mm)}mm</b></span></div>
          <p class="muted small">${packTip(s.hi, s.lo, s.rainDays)}</p></div>`; }).join('')}
        <p class="muted small">${tx(`여행 ${FORECAST_DAYS}일 전부터는 실제 날짜 예보로 바뀌어요. (D-${away})`, `Switches to a daily forecast ${FORECAST_DAYS} days before your trip. (${away} days to go)`)}</p>`;
    }
  } catch {
    if (!el()) return;
    fact()?.remove();
    if (box()) box().innerHTML = `<h4>🌤 ${tx('날씨', 'Weather')}</h4><p class="muted">${tx('날씨 정보를 불러오지 못했어요.', 'Could not load the weather.')}</p>`;
  }
}

/* ---------- 여행 정보: 날씨 · 추천 시기 · 환율 계산기 · 예산 · 꿀팁 ---------- */
function renderInfo() {
  const c = current, I = c.custom ? c.info : factsOf(c, curAp), box = $('#sec-info'); if (!box) return;
  // 화면 위쪽 요약도 지금 공항 기준으로 (공항을 바꿔도 다시 그려지도록 여기서)
  if (!c.custom) [['#destTagline', I.tagline], ['#fVisa', I.visa], ['#fTz', I.tz], ['#fTip', I.tip]].forEach(([id, v]) => { const el = $(id); if (el) el.textContent = v; });
  const tripM = parseD(S.d1).getMonth() + 1;
  box.innerHTML = `
    <div class="block-title"><h3>📋 ${tx('여행 정보', 'Travel info')}</h3><small>${esc(tx(`${cityOf(curAp)} 기준`, `for ${cityOf(curAp)}`))}</small></div>
    <div class="info-grid">
      <div class="panel" id="wxBox"><h4>🌤 ${tx('날씨', 'Weather')}</h4><div class="skeleton-line"></div></div>
      ${I.best ? `<div class="panel"><h4>📅 ${tx('추천 시기', 'Best time')} · ${esc(I.season)}</h4>
        <div class="months">${Array.from({ length: 12 }, (_, i) => i + 1).map(k =>
          `<span class="mo${I.best.includes(k) ? ' best' : ''}${k === tripM ? ' trip' : ''}" title="${monthName(k)}${I.best.includes(k) ? tx(' 추천', ' · recommended') : ''}">${k}</span>`).join('')}</div>
        <p class="muted small">${I.best.includes(tripM) ? tx(`✅ 여행 날짜(${tripM}월)는 추천 시기예요`, `✅ Your travel month (${MON[tripM - 1]}) is a recommended time`) : tx(`ℹ️ 여행 날짜(${tripM}월)는 추천 시기가 아니에요`, `ℹ️ Your travel month (${MON[tripM - 1]}) is outside the best season`)}</p></div>` : ''}
      ${c.cur ? `<div class="panel" id="calcBox"><h4>💱 ${tx('환율 계산기', 'Currency converter')}</h4><p class="muted">${tx('환율 불러오는 중…', 'Loading rates…')}</p></div>` : ''}
      ${I.budget ? `<div class="panel" id="budgetBox"><h4>💰 ${tx('1일 예상 경비', 'Daily budget')} <small class="muted">${tx('1인 · 숙박 포함', 'per person, incl. lodging')}</small></h4>
        <div class="budget" role="group" aria-label="${tx('경비 수준 선택', 'Choose a spending level')}">${TIERS.map((l, i) => `<button type="button" class="tier" data-tier="${i}"><small>${l}</small><b>${money(I.budget[i])}</b></button>`).join('')}</div>
        <label class="own"><b>✏️ ${tx('직접 입력', 'Your amount')}</b><span>${tx('1인 하루', '₩ per day')} <input type="number" id="budgetAmt" inputmode="decimal" enterkeyhint="done" min="1" max="${OWN_MAX * AMT_UNIT}" step="any" placeholder="${tx('금액', 'Amount')}" aria-label="${tx('1인 하루 희망 경비 (만원)', 'Your daily budget per person in won')}"> ${tx('만원', '')}</span></label>
        <div class="budget-sum" aria-live="polite"></div></div>` : ''}
      ${I.tips ? `<div class="panel"><h4>💡 ${tx('현지 꿀팁', 'Local tips')}</h4><ul class="tips">${I.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        ${EN ? '' : '<a class="link" href="https://www.0404.go.kr/" target="_blank" rel="noopener">🛡 외교부 해외안전여행에서 여행경보 확인 →</a>'}</div>` : ''}
    </div>`;
  renderCalc(); renderBudget();
  // 제목 옆 배지도 '선택한 여행 날짜' 기준 (오늘 기준과 섞이지 않게)
  const badge = $('#seasonBadge');
  if (badge) badge.innerHTML = I.best?.includes(tripM) ? `<span class="now-good">${tx(`${tripM}월 여행 추천 시기`, `Great in ${MON[tripM - 1]}`)}</span>` : '';
  if (current === c) showWeather();
}

/* ---------- 예상 경비: 알뜰·보통·여유를 고르거나 희망 금액을 직접 넣으면 총액을 다시 계산 (선택은 기억) ---------- */
const TIERS = tx(['알뜰', '보통', '여유'], ['Budget', 'Mid-range', 'Comfort']);
// 금액은 만원 단위로 저장. 영어판은 원 단위로 보여주고 입력받음
const AMT_UNIT = tx(1, 10000);
const money = v => tx(`${man(v)}만원`, '₩' + Math.round(v * 10000).toLocaleString('en-US'));
const OWN_MAX = 10000;   // 직접 입력할 수 있는 1인 하루 최대 금액(만원)
let budgetTier = TIERS[store.get('tier', 1)] ? store.get('tier', 1) : 1;
let budgetAmt = +store.get('budgetAmt', 0) || 0;   // 직접 입력한 1인 하루 금액(만원), 0이면 없음
let budgetOwn = !!store.get('budgetOwn', false);   // true면 직접 입력한 금액으로 계산
const man = n => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 });   // 만원 단위 숫자
function renderBudget() {
  const box = $('#budgetBox'), b = current?.info.budget; if (!box || !b) return;
  const own = budgetOwn && budgetAmt > 0, per = own ? budgetAmt : b[budgetTier];
  const days = Math.max(1, nights() || 4), ppl = S.adults + S.children;
  const daysText = nights() ? nightsText(days) : tx(`${days}일`, plural(days, 'day'));
  $$('.tier', box).forEach(btn => { const on = !own && +btn.dataset.tier === budgetTier; btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); });
  $('.own', box).classList.toggle('on', own);
  const input = $('#budgetAmt'); if (document.activeElement !== input) input.value = budgetAmt ? Math.round(budgetAmt * AMT_UNIT * 100) / 100 : '';   // 입력 중에는 건드리지 않음
  // 직접 입력한 금액이 이 여행지에서 어느 수준인지 알려줌
  const tierName = TIERS[per >= b[2] ? 2 : per >= b[1] ? 1 : 0];
  const level = per < b[0] ? tx(`알뜰(${money(b[0])})보다 적어 빠듯할 수 있어요`, `Below the budget level (${money(b[0])}), so it may be tight`) : tx(`이 여행지의 '${tierName}' 수준이에요`, `That is a '${tierName}' budget here`);
  const basis = own ? tx('직접 입력한 금액', 'your amount') : TIERS[budgetTier];
  $('.budget-sum', box).innerHTML = `<small>${tx(`${basis} 기준 총 예상 경비`, `Estimated total (${basis})`)}</small><b>${tx('약', 'About')} ${money(per * days * ppl)}</b>
    <small>${money(per)} × ${daysText} × ${tx(`${ppl}명`, plural(ppl, 'person', 'people'))}${ppl > 1 ? ` (${tx(`1인 ${money(per * days)}`, `${money(per * days)} each`)})` : ''}</small>
    <small>${tx(`항공권${S.infants ? '·유아' : ''} 제외, 대략치`, `Rough figure, excluding flights${S.infants ? ' and infants' : ''}`)}</small>${own ? `<small class="level">${level}</small>` : ''}`;
}
function setBudget(own) {
  budgetOwn = own;
  store.set('tier', budgetTier); store.set('budgetAmt', budgetAmt); store.set('budgetOwn', budgetOwn);
  renderBudget();
}
$('#main').addEventListener('click', e => {
  const btn = e.target.closest('.tier[data-tier]'); if (!btn) return;
  budgetTier = +btn.dataset.tier; setBudget(false);
});
$('#main').addEventListener('input', e => {
  if (e.target.id !== 'budgetAmt') return;
  const v = parseFloat(e.target.value) / AMT_UNIT;
  budgetAmt = v > 0 ? Math.min(v, OWN_MAX) : 0;
  if (v > OWN_MAX) e.target.value = OWN_MAX * AMT_UNIT;
  setBudget(budgetAmt > 0);   // 비우면 고르던 알뜰·보통·여유 기준으로 돌아감
});
// 넣어 둔 금액이 있으면 입력칸을 누르는 것만으로 그 금액 기준으로 전환
$('#main').addEventListener('focusin', e => { if (e.target.id === 'budgetAmt' && budgetAmt) setBudget(true); });
function renderCalc() {
  const c = current, box = $('#calcBox'); if (!box || !c?._fx) return;
  const unit = fxUnit(c._fx);
  box.innerHTML = `<h4>💱 ${tx('환율 계산기', 'Currency converter')}</h4>
    <div class="calc">
      <label><span>${c.cur}</span><input type="number" inputmode="decimal" id="fxLocal" value="${unit}" min="0" aria-label="${tx(`${c.cur} 금액`, `Amount in ${c.cur}`)}"></label>
      <span class="eq" aria-hidden="true">⇄</span>
      <label><span>KRW</span><input type="number" inputmode="decimal" id="fxKrw" value="${Math.round(c._fx * unit)}" min="0" aria-label="${tx('원화 금액', 'Amount in won')}"></label>
    </div>
    <div class="chips calc-quick">${[1, 10, 100, 1000].map(n => n * unit)
      .map(n =>`<button type="button" class="chip sm" data-amt="${n}">${n.toLocaleString()} ${c.cur}</button>`).join('')}</div>`;
  const L = $('#fxLocal'), K = $('#fxKrw');
  L.addEventListener('input', () => { K.value = L.value === '' ? '' : Math.round(L.value * c._fx); });
  K.addEventListener('input', () => { L.value = K.value === '' ? '' : +(K.value / c._fx).toFixed(2); });
  $$('[data-amt]', box).forEach(b => b.addEventListener('click', () => { L.value = b.dataset.amt; L.dispatchEvent(new Event('input')); }));
}

/* ---------- 추천 일정 (♥ 저장한 명소 우선) ---------- */
// 항공편 시각(현지)은 저장한 여행별(저장 전에는 도착 공항별)로 기억. 넣지 않으면 14시 도착 · 14시 출발로 계산
const FLIGHT_DEFAULT = { arr: '14:00', dep: '14:00' };
const ARRIVE_LEAD = 120;    // 도착 후 입국 심사·시내 이동·숙소까지 걸리는 시간(분)
const DEPART_LEAD = 180;    // 출발 몇 분 전에 시내에서 공항으로 나서는지
const flightTimes = () => ({ ...FLIGHT_DEFAULT, ...(sharedHere() ? sharedHere().flights : store.get('flights', {})[planKey()]) });
const toMin = v => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const exactTime = m => { const v = (m + 1440) % 1440; return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`; };   // 항공편 시각은 반올림하지 않음
function setFlightTime(key, value) {
  const sv = sharedHere();
  if (sv) { sv.flights = { ...sv.flights, [key]: value }; return renderPlan(); }   // 공유받은 일정을 보는 중에는 저장하지 않음
  const all = store.get('flights', {}), at = planKey();
  all[at] = { ...all[at], [key]: value };
  store.set('flights', all); renderPlan();
}
$('#main').addEventListener('input', e => { const k = e.target.dataset?.flight; if (k && e.target.value) setFlightTime(k, e.target.value); });
$('#main').addEventListener('focusout', e => { const k = e.target.dataset?.flight; if (k && !e.target.value) e.target.value = flightTimes()[k]; });   // 지우다 만 칸은 이전 값으로

const isEvening = s => ['저녁', '야간'].includes(spotMeta(s).slot);
const bySlot = list => [...list].sort((a, b) => SLOT_ORDER[spotMeta(a).slot] - SLOT_ORDER[spotMeta(b).slot]);
// 첫날·마지막 날처럼 시간이 제한된 날: start부터 돌아 end 전에 끝낼 수 있는지
function fitsDay(list, start, end, center) {
  let t = start, prev = center, lunch = start > 13.5 * 60;
  for (const s of bySlot(list)) {
    const m = spotMeta(s), mv = travel(prev, spotGeo(s))?.min || 0;
    if (!lunch && t >= 11 * 60 && t <= 14.5 * 60) { t += 60; lunch = true; }
    if (!isEvening(s) && t + mv > 17 * 60) return false;   // 낮 명소는 늦은 오후 이후에 넣지 않음
    t = Math.max(t + mv, isEvening(s) ? SLOT_START[m.slot] : 0) + m.stay * 60;
    prev = spotGeo(s) || prev;
  }
  return t <= end;
}

// 직접 편집한 일정: 저장한 여행별(저장 전에는 도착 공항별)로 날짜마다 명소 이름을 순서대로 저장. 없으면 추천 일정
let planEditing = null, planLists = [];   // 편집 중인 공항 코드 · 화면에 보이는 날짜별 명소 이름
const savedPlan = () => sharedHere()?.lists || store.get('plans', {})[planKey()];
function savePlan(lists) {
  const all = store.get('plans', {}), key = planKey();
  if (lists) all[key] = lists; else delete all[key];
  store.set('plans', all); renderPlan();
}
function editPlan(act, name, to) {
  const lists = planLists.map(l => [...l]);
  const i = lists.findIndex(l => l.includes(name)), j = i < 0 ? -1 : lists[i].indexOf(name);
  if (act === 'add') lists[to].push(name);
  else if (i < 0) return;
  else if (act === 'remove') lists[i].splice(j, 1);
  else if (act === 'day') { lists[i].splice(j, 1); lists[to].push(name); }
  else {   // up · down: 하루의 처음·끝에서는 앞뒤 날짜로 넘어감
    const step = act === 'up' ? -1 : 1, k = j + step;
    if (lists[i][k] != null) [lists[i][j], lists[i][k]] = [lists[i][k], lists[i][j]];
    else if (lists[i + step]) { lists[i].splice(j, 1); lists[i + step][step < 0 ? 'push' : 'unshift'](name); }
    else return;
  }
  savePlan(lists);
  // 다시 그린 뒤에도 같은 명소의 버튼에 커서를 둠 (키보드로 이어서 옮길 수 있게)
  const sel = `[data-spot="${CSS.escape(name)}"]`;
  ($(`#planBody ${sel}[data-act="${act}"]:not(:disabled)`) || $(`#planBody select${sel}`))?.focus({ preventScroll: true });
}
$('#main').addEventListener('click', e => {
  const b = e.target.closest('#planBody button[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'toggle') {
    planEditing = planEditing === curAp.code ? null : curAp.code; renderPlan();
    $('#planBody [data-act="toggle"]')?.focus({ preventScroll: true });
  } else if (act === 'reset') {   // 실수로 지우지 않도록 두 번 눌러야 초기화
    if (b.dataset.sure) { savePlan(null); toast(tx('추천 일정으로 되돌렸어요', 'Back to the suggested plan')); }
    else { b.dataset.sure = '1'; b.textContent = tx('한 번 더 누르면 편집한 내용이 지워져요', 'Click again to discard your edits'); }
  } else if (act === 'trip-open' || act === 'trip-move') {
    const t = getTrips().find(x => x.id === b.dataset.id); if (!t) return;
    if (act === 'trip-open') { applyTripDates(t); renderTravel(); renderInfo(); }
    else { updateTrip(t.id, { trip: S.trip, d1: S.d1, d2: S.trip === 'oneway' ? S.d1 : S.d2 }); toast(tx('여행 날짜를 바꿨어요 · 편집한 일정과 체크리스트는 그대로예요', 'Trip dates changed · your plan and checklist are kept')); }
    renderPlan();
  } else if (act === 'share') shareLink(planURL(), tx(`${current.ko} 여행 일정 · 떠날지도`, `${current.name} itinerary · Maybe Go`), tx(`${cityOf(curAp)} 여행 일정을 확인해 보세요`, `Take a look at this ${cityOf(curAp)} itinerary`), tx('일정 링크를 복사했어요', 'Itinerary link copied'));
  else if (act === 'keep') keepShared(b);
  else if (act === 'close') closeShared();
  else editPlan(act, b.dataset.spot);
});
$('#main').addEventListener('change', e => {
  const s = e.target.closest('#planBody select[data-act]'); if (!s || s.value === '') return;
  if (s.dataset.act === 'add') editPlan('add', s.value, +s.dataset.day); else editPlan('day', s.dataset.spot, +s.value);
});

/* ---------- 일정 공유 링크: 여행 날짜·항공 시각·날짜별 명소를 주소의 # 뒤에 담음 (서버로 전송되지 않음) ---------- */
let sharedPlan = null;   // 링크로 받아 보고 있는 일정. 저장하기 전에는 브라우저에 남기지 않음
const sharedHere = () => sharedPlan && curAp && sharedPlan.code === curAp.code ? sharedPlan : null;
// 명소 이름을 짧은 코드로 (FNV-1a). 데이터에서 명소 순서가 바뀌어도 같은 코드
const spotId = name => { let h = 2166136261; for (const ch of name) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return (h >>> 0).toString(36); };
function planURL() {
  const ft = flightTimes();
  const q = new URLSearchParams({
    ap: curAp.code,
    d: (S.trip === 'oneway' ? [S.d1] : [S.d1, S.d2]).map(ymd).join('-'),
    f: `${ft.arr}-${ft.dep}`.replace(/:/g, ''),
    p: planLists.map(l => l.map(spotId).join('.')).join('-')
  });
  return `${sharePage()}#${q}`;
}
// 받은 링크 읽기. 누구나 고칠 수 있는 값이라 형식을 확인하고, 아는 명소만 받음
function readShare(d, apCode, q) {
  const ap = d.aps.find(a => a.code === apCode) || d.aps[0];
  const dates = /^(\d{8})(?:-(\d{8}))?$/.exec(q.get('d') || ''), p = q.get('p') || '';
  const f = /^([01]\d|2[0-3])([0-5]\d)-([01]\d|2[0-3])([0-5]\d)$/.exec(q.get('f') || '');
  if (!dates || p.length > 800 || !/^[0-9a-z.-]*$/.test(p)) return null;
  const toDate = v => { const s = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`; return iso(parseD(s)) === s ? s : null; };
  let d1 = toDate(dates[1]), d2 = dates[2] ? toDate(dates[2]) : null;
  if (!d1 || (dates[2] && !(d2 > d1))) return null;
  const trip = d2 ? 'round' : 'oneway', length = d2 ? Math.round((parseD(d2) - parseD(d1)) / 864e5) : 4;
  const expired = d1 < today();
  if (expired) d1 = addDays(today(), 30);   // 지난 날짜는 검색에 쓸 수 없어 같은 길이의 새 날짜로
  if (expired || !d2) d2 = addDays(d1, length);
  const byId = new Map(spotsFor(d, ap).map(s => [spotId(s.ko), s.ko]));
  const ids = p.split('-').slice(0, 10).map(day => day.split('.').filter(Boolean));
  const lists = ids.map(day => day.map(id => byId.get(id)).filter(Boolean));
  return {
    code: ap.code, trip, d1, d2, lists, expired, missing: ids.flat().length - lists.flat().length,
    flights: f ? { arr: `${f[1]}:${f[2]}`, dep: `${f[3]}:${f[4]}` } : {}, hash: '#' + q
  };
}
function startShared(sh) {
  sh.backup = { trip: S.trip, d1: S.d1, d2: S.d2 };   // 닫으면 내 검색 날짜로 되돌림
  Object.assign(S, { trip: sh.trip, d1: sh.d1, d2: sh.d2 }); sharedPlan = sh; syncForm();
}
function endShared() {
  const sh = sharedPlan; if (!sh) return;
  sharedPlan = null;
  if (sh.backup) { Object.assign(S, sh.backup); syncForm(); }
}
function closeShared() { endShared(); setURL(false); renderTravel(); renderInfo(); renderPlan(); }
// 공유받은 일정을 내 여행으로 저장. 같은 날짜의 여행에 편집한 일정이 있을 때만 덮어쓰기를 확인
function keepShared(btn) {
  const sh = sharedHere(); if (!sh) return;
  const mine = tripAt(sh.code);
  if (mine && store.get('plans', {})[mine.id] && !btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = tx('한 번 더 누르면 기존 내 일정을 덮어써요', 'Click again to overwrite your plan'); return; }
  const t = mine || addTrip();
  store.set('plans', { ...store.get('plans', {}), [t.id]: sh.lists });
  store.set('flights', { ...store.get('flights', {}), [t.id]: sh.flights });
  sharedPlan = null; saveS(); setURL(false); renderPlan(); toast(tx('내 여행으로 저장했어요 · 첫 화면에서 볼 수 있어요', 'Saved to your trips · see it on the home page'));
}

function renderPlan() {
  const c = current, box = $('#sec-plan'); if (!box || c.custom) return;
  // 선택한 도착 도시의 명소만 사용. ♥ 저장한 곳을 먼저 넣고, 남는 날은 추천 명소로 채움
  const all = spotsFor(c, curAp), savedNames = savedFor(c);
  const picked = all.filter(s => savedNames.includes(s.ko)), useSaved = picked.length > 0;
  const spots = [...picked, ...all.filter(s => !picked.includes(s))];
  const isPicked = s => picked.includes(s);
  const days = S.trip === 'oneway' ? 4 : Math.min(10, Math.max(1, nights() + 1));
  const near = spots.filter(s => !s.g), groups = [];
  spots.filter(s => s.g).forEach(s => { const g = groups.find(x => x.g === s.g); g ? g.list.push(s) : groups.push({ g: s.g, list: [s] }); });
  // 첫날(도착)·마지막 날(출국)은 시내 1곳, 사이 날은 시내 2곳과 근교 당일치기를 번갈아 배치
  const plan = Array.from({ length: days }, () => ({ list: [], g: null }));
  let gi = 0;
  const queue = [...near], center = cityCenter(all);
  // 시내 명소 n곳 꺼내기. 테마파크처럼 반나절 이상(6시간+) 걸리는 곳은 그날 하나만
  const takeNear = n => {
    const l = [];
    while (l.length < n && queue.length) {
      const long = spotMeta(queue[0]).stay >= 6;
      if (long && l.length) break;
      l.push(queue.shift());
      if (long) break;
    }
    return l;
  };
  // 시간 안에 끝낼 수 있는 명소만 순서대로 꺼내기 (못 넣은 곳은 다른 날에 남김)
  const takeFit = (n, start, end) => {
    const l = [];
    for (let k = 0; k < queue.length && l.length < n;) {
      const long = spotMeta(queue[k]).stay >= 6;
      if (!(long && l.length) && fitsDay([...l, queue[k]], start, end, center)) { l.push(...queue.splice(k, 1)); if (long) break; }
      else k++;
    }
    return l;
  };
  // 항공편 시각에 따른 첫날 시작과 마지막 날 마감. 출발 시각은 귀국일이 일정에 포함될 때만 적용 (편도·10일 초과 제외)
  const ft = flightTimes(), arrive = toMin(ft.arr), depart = toMin(ft.dep);
  const hasReturn = S.trip !== 'oneway' && days > 1 && nights() + 1 === days;
  const outAt = depart - DEPART_LEAD;   // 음수면 전날 밤에 공항으로 이동
  const firstStart = Math.max(arrive + ARRIVE_LEAD, 9 * 60);
  const endBy = i => !hasReturn ? Infinity : i === days - 1 ? outAt : i === days - 2 && outAt < 0 ? outAt + 1440 : Infinity;
  const sv = sharedHere(), saved = savedPlan(), custom = Array.isArray(saved), editing = !sv && planEditing === curAp.code;
  if (custom) {   // 직접 편집한 순서 그대로 (여행 일수가 줄면 넘치는 명소는 '더 둘러볼 곳'으로)
    const byName = new Map(all.map(s => [s.ko, s]));
    plan.forEach((p, i) => {
      p.list = (saved[i] || []).map(n => { const s = byName.get(n); byName.delete(n); return s; }).filter(Boolean);
      p.g = p.list[0]?.g || '';
    });
  } else {
    if (days === 1) plan[0].list = takeNear(2);
    else {
      plan[0].list = takeFit(firstStart <= 11 * 60 ? 2 : 1, firstStart, Math.min(23 * 60, endBy(0)));
      for (let i = 1; i < days - 1; i++) {
        const far = gi < groups.length && ((i % 2 === 0) || !queue.length);
        if (far) { plan[i].g = groups[gi].g; plan[i].list = groups[gi++].list; }
        else plan[i].list = takeNear(2);
      }
      plan[days - 1].list = hasReturn ? takeFit(outAt >= 17 * 60 ? 2 : 1, 9 * 60, outAt) : takeNear(1);
    }
    // 밤(야간) 명소 두 곳이 같은 날 몰리면 밤늦게 끝나므로, 야간 명소가 없는 다른 시내 일정의 낮 명소와 하나를 맞바꿈
    const isLate = s => spotMeta(s).slot === '야간';
    const cityDays = plan.filter((p, i) => i > 0 && i < days - 1 && !p.g);
    cityDays.forEach(a => {
      const late = a.list.filter(isLate); if (late.length < 2) return;
      const b = cityDays.find(x => x !== a && !x.list.some(isLate) && x.list.some(s => spotMeta(s).stay < 6)); if (!b) return;
      const ai = a.list.indexOf(late.at(-1)), bi = b.list.findLastIndex(s => spotMeta(s).stay < 6);
      [a.list[ai], b.list[bi]] = [b.list[bi], a.list[ai]];
    });
    plan.forEach(p => { p.list = bySlot(p.list); });   // 추천 일정은 추천 시간대 순서로
  }
  const city = cityOf(curAp), area = areasFor(c, curAp)[0]?.n || city;
  const dayNo = i => tx(`${i + 1}일차`, `Day ${i + 1}`);
  const dayLabel = i => { if (S.trip === 'oneway') return dayNo(i); const d = parseD(addDays(S.d1, i)); return `${dayNo(i)} · ${tx(`${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`, `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`)}`; };
  const route = list => 'https://www.google.com/maps/dir/' + list.map(s => enc(s.en)).join('/');
  const leave = i => hasReturn && i === days - 1;

  // 시간표 만들기: 정해진 순서대로 이동시간 → 머무는 시간 → 점심·저녁 끼워 넣기
  const foods = cityFood(curAp).food;
  let foodIdx = 0;
  const nextFood = () => foods.length ? foods[foodIdx++ % foods.length] : null;
  const timeline = plan.map((p, i) => {
    const rows = [], first = i === 0, isLast = leave(i), limit = endBy(i), kept = [];
    // 첫날은 도착 후 입국 심사·숙소 이동을 마친 시각부터 (이른 도착이면 9시부터)
    let t = first ? firstStart : p.g ? 8 * 60 : 9 * 60, prev = center, lunch = first && firstStart > 13.5 * 60, dinner = false;
    const meal = kind => { const f = nextFood(); rows.push({ kind: 'meal', time: t, text: `${kind === 'lunch' ? tx('🍜 점심', '🍜 Lunch') : tx('🍽 저녁', '🍽 Dinner')}${f ? ' · ' + f.n : ''}`, near: rows.filter(r => r.spot).at(-1)?.spot }); t += kind === 'lunch' ? 60 : 75; kind === 'lunch' ? lunch = true : dinner = true; };
    if (first) rows.push({ kind: 'note', time: arrive, exact: true, text: tx(`✈ ${curAp.name} 도착 · 입국 심사 후 ${area} ${arrive < 13 * 60 ? '숙소에 짐 맡기기' : '숙소 체크인'}`, `✈ Arrive at ${curAp.name} · after immigration, ${arrive < 13 * 60 ? 'drop your bags' : 'check in'} at your ${area} stay`) + (arrive + ARRIVE_LEAD >= 21 * 60 ? tx(' · 늦은 도착이라 첫날은 쉬어 가요', ' · late arrival, so rest on day one') : '') });
    const tripNote = p.g ? { kind: 'note', time: t, text: tx(`🚆 근교 당일치기 · ${p.g}(으)로 출발`, `🚆 Day trip · leave for ${p.g}`) } : null;
    if (tripNote) rows.push(tripNote);
    p.list.forEach((s, k) => {
      const before = { n: rows.length, t, lunch, dinner, foodIdx };
      const m = spotMeta(s), mv = travel(prev, spotGeo(s)), mvMin = mv?.min || 0;
      const free = () => rows.push({ kind: 'free', time: t, text: tx('☕ 자유 시간 · 쇼핑, 카페, 숙소 휴식', '☕ Free time · shopping, cafés, a rest') });
      if (!lunch && t >= 11 * 60 && t <= 14.5 * 60) meal('lunch');
      const want = SLOT_START[m.slot];
      // 저녁·야간 명소는 그 시간에 맞춰 출발: 남는 시간엔 점심·자유 시간·저녁을 먼저 넣고, 이동은 그 뒤에
      // (직접 편집해 낮 명소를 뒤에 두었다면 기다리지 않고 순서대로)
      if (isEvening(s) && p.list.slice(k + 1).every(isEvening) && t + mvMin < want) {
        if (!lunch && t <= 14.5 * 60) { if (12 * 60 - t >= 90) free(); t = Math.max(t, 12 * 60); meal('lunch'); }
        if (!dinner && want >= 18 * 60 && t <= 18.5 * 60) { if (18 * 60 - t >= 90) free(); t = Math.max(t, 18 * 60); meal('dinner'); }
        if (want - mvMin - t >= 90) free();
        t = Math.max(t, want - mvMin);
      }
      if (mv) { rows.push({ kind: 'move', text: mv.text }); t += mvMin; }
      // 테마파크처럼 점심시간을 통째로 걸치는 곳은 안에서 점심
      const inside = !lunch && m.stay >= 5 && t < 12 * 60 && t + m.stay * 60 > 13 * 60;
      if (inside) lunch = true;
      const row = { kind: 'spot', time: t, spot: s, m, inside };
      rows.push(row);
      t += Math.round(m.stay * 60);
      const late = t + (p.g ? travel(spotGeo(s), center)?.min || 0 : 0) > limit;
      // 추천 일정: 공항에 가야 하는 시각을 넘기면 넣기 전 상태로 되돌리고 '더 둘러볼 곳'으로 보냄
      if (late && !custom) { rows.length = before.n; ({ t, lunch, dinner, foodIdx } = before); return; }
      // 직접 넣은 명소는 빼지 않고 알려 줌
      row.warn = late ? tx('공항에 가야 하는 시각을 넘겨요', 'Runs past the time to leave for the airport') : t > 23 * 60 ? tx('밤 11시 이후에 끝나요', 'Ends after 11 pm') : '';
      prev = spotGeo(s) || prev; kept.push(s);
    });
    if (tripNote && !kept.length) rows.splice(rows.indexOf(tripNote), 1);   // 근교 명소를 하나도 못 넣었으면 출발 안내도 뺌
    // 일정이 일찍 끝나면 점심 → 맛집 거리·시장 자유 시간으로 채움
    const streets = cityFood(curAp).street;
    if (!lunch && t <= 14.5 * 60 && Math.max(t, 12 * 60) + 60 <= limit) { t = Math.max(t, 12 * 60); meal('lunch'); }
    if (!isLast && !p.g && kept.length && t < 16 * 60) {   // 근교 날은 그 도시 맛집 거리를 추천하지 않음
      const st = streets.length ? streets[i % streets.length] : null;
      rows.push({ kind: 'free', time: t, text: st ? tx(`☕ 자유 시간 · ${st.n} 구경 (${st.d})`, `☕ Free time · explore ${st.n} (${st.d})`) : tx('☕ 자유 시간 · 쇼핑, 카페, 산책', '☕ Free time · shopping, cafés, a stroll') });
      t = 17 * 60;
    }
    if (kept.at(-1)?.g) { const back = travel(prev, center); if (back) { rows.push({ kind: 'move', text: tx(back.text.replace(/^(\S+)/, '$1 숙소로'), back.text + ' back to your stay') }); t += back.min; } }
    if (isLast && outAt - t >= 90) rows.push({ kind: 'free', time: t, text: t < 12 * 60 ? tx('🧳 체크아웃 후 짐을 맡기고 근처 산책·쇼핑', '🧳 Check out, leave your bags, stroll and shop nearby') : tx('☕ 공항 가기 전까지 근처 산책·쇼핑', '☕ Stroll and shop nearby until the airport') });
    if (!dinner && t <= 22 * 60 && Math.max(t, 18.5 * 60) + 75 <= limit) { t = Math.max(t, 18.5 * 60); meal('dinner'); }
    if (!kept.length && !isLast && (first ? firstStart < 17 * 60 : limit === Infinity)) rows.splice(first ? 1 : 0, 0, { kind: 'free', time: first ? firstStart : 10 * 60, text: tx('☕ 자유 일정 · 쇼핑, 맛집, 휴식', '☕ Open day · shopping, food, rest') });
    if (hasReturn && outAt < 0 && i === days - 2) rows.push({ kind: 'note', time: outAt + 1440, exact: true, text: tx(`✈ ${curAp.name}(으)로 이동 · 내일 새벽 ${ft.dep} 출국`, `✈ Head to ${curAp.name} · flight at ${ft.dep} after midnight`) });
    if (isLast) rows.push(outAt < 0 ? { kind: 'note', time: depart, exact: true, text: tx(`✈ ${curAp.name} 출국 · 전날 밤에 공항으로 이동`, `✈ Depart from ${curAp.name} · go to the airport the night before`) }
      : { kind: 'note', time: outAt, exact: true, text: tx(`✈ ${curAp.name}(으)로 이동 · ${ft.dep} 출국`, `✈ Head to ${curAp.name} · flight at ${ft.dep}`) });
    return { g: kept.length ? p.g : '', list: kept, rows };
  });
  const placed = timeline.flatMap(p => p.list), unplaced = spots.filter(s => !placed.includes(s));
  planLists = timeline.map(p => p.list.map(s => s.ko));
  const spotName = s => nm(s) + (s.g ? tx('(근교)', ' (day trip)') : '');
  // 편집 모드에서 명소마다 붙는 순서·날짜·빼기 버튼
  const tools = (s, i, j) => {
    const id = `data-spot="${esc(s.ko)}"`;
    return `<div class="tl-edit">
      <button type="button" data-act="up" ${id} aria-label="${esc(tx(`${s.ko} 앞으로`, `Move ${nm(s)} earlier`))}" ${i === 0 && j === 0 ? 'disabled' : ''}>▲</button>
      <button type="button" data-act="down" ${id} aria-label="${esc(tx(`${s.ko} 뒤로`, `Move ${nm(s)} later`))}" ${i === days - 1 && j === timeline[i].list.length - 1 ? 'disabled' : ''}>▼</button>
      <select data-act="day" ${id} aria-label="${esc(tx(`${s.ko} 날짜 옮기기`, `Move ${nm(s)} to another day`))}">${timeline.map((_, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${dayNo(k)}</option>`).join('')}</select>
      <button type="button" data-act="remove" ${id} aria-label="${esc(tx(`${s.ko} 일정에서 빼기`, `Remove ${nm(s)} from the plan`))}">${tx('빼기', 'Remove')}</button></div>`;
  };
  const hm = clock, rowTime = r => r.time == null ? '' : r.exact ? exactTime(r.time) : hm(r.time);
  const nearMap = s => mapLink('restaurants near ' + (s?.en || curAp.en));
  const text = timeline.map((p, i) => `[${dayLabel(i)}${p.g ? tx(' · 근교 ', ' · Day trip: ') + p.g : ''}]\n` + p.rows.filter(r => r.kind !== 'move').map(r =>
    `${r.time != null ? rowTime(r) + ' ' : ''}${r.spot ? nm(r.spot) : r.text}`).join('\n')).join('\n\n');
  // 시각 입력칸은 처음 한 번만 만듦 (입력하는 동안 다시 그리면 커서가 사라지므로 제목과 본문만 갱신)
  if (!$('#planBody', box)) box.innerHTML = `<div class="block-title" id="planHead"></div>
    <div class="flight-times">
      <label><span>✈ ${tx('현지 도착', 'Arrival (local)')}</span><input type="time" data-flight="arr" required></label>
      <label id="depField"><span>🛫 ${tx('귀국편 출발', 'Return flight')}</span><input type="time" data-flight="dep" required></label>
      <p>${tx("항공권에 적힌 현지 시각을 넣으면 일정이 맞춰져요. 도착일은 '가는 날', 출발일은 '오는 날' 기준이에요. 도착 2시간 뒤부터 움직이고, 출발 3시간 전에 공항으로 가는 것으로 계산해요.", 'Enter the local times on your ticket and the plan adjusts. You arrive on the departure date and fly home on the return date. The plan starts 2 hours after landing and leaves for the airport 3 hours before departure.')}</p>
    </div>
    <div id="planBody"></div>`;
  $$('[data-flight]', box).forEach(el => { if (el !== document.activeElement) el.value = ft[el.dataset.flight]; });
  $('#depField', box).hidden = !hasReturn;
  const kind = sv ? tx('공유받은 일정', 'Shared plan') : custom ? tx('내 일정', 'My plan') : tx('추천 일정', 'Suggested plan');
  // 이 공항에 저장한 여행이 있는데 지금 날짜가 다르면, 그 일정을 보거나 날짜를 옮길 수 있게 안내
  const mine = tripAt(curAp.code);
  const otherTrips = sv || mine ? [] : getTrips().filter(t => t.ap === curAp.code && tripEnd(t) >= today()).sort((a, b) => a.d1.localeCompare(b.d1));
  updateTripButton();
  $('#planHead', box).innerHTML = `<h3>🗓 ${esc(city)} ${S.trip === 'oneway' ? tx(`${kind} (예시 4일)`, `· ${kind} (4-day sample)`) : tx(`${nights()}박 ${days}일 ${kind}`, `· ${days}-day ${kind.toLowerCase()}`)}</h3>
      <small>${mine && !sv ? tx('📌 저장한 여행 · ', '📌 Saved trip · ') : ''}${sv ? tx('링크로 받은 일정이에요', 'Received by link') :custom ? tx('직접 편집한 일정이에요 · ♥를 눌러도 순서는 바뀌지 않아요', 'Edited by you · ♥ no longer reorders it') :useSaved ? tx(`♥ 저장한 ${picked.length}곳을 먼저 넣고 남는 날은 추천 명소로 채웠어요`, `Your ${plural(picked.length, 'saved place')} first, then suggestions`) : tx(`${esc(city)} 추천 명소 기준 · 카드의 ♥로 꼭 갈 곳을 골라 보세요`, `Top sights in ${esc(city)} · tap ♥ on a card to prioritise it`)}</small>`;
  $('#planBody', box).innerHTML = `
    ${otherTrips.length ? `<div class="plan-trips"><p>📌 ${tx(`${esc(city)}에 저장한 여행이 있어요. 지금 날짜에는 그 여행의 일정이 적용되지 않아요.`, `You have a saved trip to ${esc(city)}. Its plan does not apply to these dates.`)}</p>${otherTrips.map(t => `
      <div><b>${tripDates(t)}</b><button type="button" class="btn" data-act="trip-open" data-id="${esc(t.id)}">${tx('이 여행 일정 보기', 'Open that trip')}</button>
        <button type="button" class="btn ghost" data-act="trip-move" data-id="${esc(t.id)}">${tx('여행 날짜를 지금 날짜로 바꾸기', 'Move it to these dates')}</button></div>`).join('')}</div>` : ''}
    <div class="plan-tools${sv ? ' shared' : ''}">
      ${sv ? `<button type="button" class="btn" data-act="keep">💾 ${tx('내 여행으로 저장', 'Save to my trips')}</button>
      <button type="button" class="btn ghost" data-act="close">✕ ${tx('내 일정 보기', 'Back to my plan')}</button>`
      : `<button type="button" class="btn${editing ? '' : ' ghost'}" data-act="toggle" aria-pressed="${editing}">${editing ? tx('✓ 편집 끝내기', '✓ Done editing') : tx('✏️ 일정 편집', '✏️ Edit plan')}</button>
      ${custom ? `<button type="button" class="btn ghost" data-act="reset">↺ ${tx('추천 일정으로 되돌리기', 'Reset to suggested')}</button>` : ''}`}
      <button type="button" class="btn ghost" data-act="share">🔗 ${tx('일정 링크 공유', 'Share plan link')}</button>
      ${sv ? `<p>📩 ${tx('공유받은 일정을 보고 있어요. 저장하기 전에는 내 일정이 바뀌지 않아요.', 'You are viewing a shared plan. Your own plan stays unchanged until you save.')}${sv.expired ? tx(' 보낸 일정의 날짜가 지나서 날짜를 새로 넣었어요. 위에서 여행 날짜를 골라 주세요.', ' Its dates have passed, so new ones were filled in. Pick your dates above.') : ''}${sv.missing ? tx(` 지금은 목록에 없는 명소 ${sv.missing}곳은 빠졌어요.`, ` ${plural(sv.missing, 'sight')} no longer listed ${sv.missing === 1 ? 'was' : 'were'} left out.`) : ''}</p>` : ''}
      ${editing ? `<p>${tx('▲▼로 순서를 바꾸고, 날짜를 골라 옮기거나 뺄 수 있어요. 시간은 자동으로 다시 계산되고, 편집한 일정은 이 브라우저에 저장돼요.', 'Use ▲▼ to reorder, pick a day to move a sight, or remove it. Times recalculate automatically and your edits are saved in this browser.')}</p>` : ''}
    </div>
    <div class="map-wrap" id="planMapWrap">
      <div class="map-days" role="group" aria-label="${tx('지도에 표시할 날짜', 'Days shown on the map')}"><button type="button" class="chip sm on" data-day="all">${tx('전체', 'All')}</button>${timeline.map((p, i) =>
        p.rows.some(r => r.spot && spotGeo(r.spot)) ? `<button type="button" class="chip sm" data-day="${i}"><i class="dot" style="background:${DAY_COLORS[i % DAY_COLORS.length]}"></i>${dayNo(i)}</button>` : '').join('')}</div>
      <div class="plan-map" id="planMap" role="img" aria-label="${esc(tx(`${city} 일정 지도`, `${city} plan map`))}"></div>
    </div>
    <div class="plan">${timeline.map((p, i) => `
      <div class="day-card${p.g ? ' far' : ''}"><div class="day-h"><b><i class="dot" style="background:${DAY_COLORS[i % DAY_COLORS.length]}"></i>${dayLabel(i)}</b>${p.list.length > 1 ? `<a class="link sm" href="${route(p.list)}" target="_blank" rel="noopener">${tx('길찾기 →', 'Directions →')}</a>` : ''}</div>
        ${p.g ? `<p class="day-tag">🚆 ${tx('근교 당일치기', 'Day trip')} · ${esc(p.g)}</p>` : ''}
        <ol class="tl">${p.rows.map(r => r.kind === 'move' ? `<li class="tl-move">${esc(r.text)}</li>`
          : r.kind === 'spot' ? `<li class="tl-spot${isPicked(r.spot) ? ' picked' : ''}"><span class="tm">${hm(r.time)}</span><div>${isPicked(r.spot) ? '<span class="pk" aria-label="saved">♥</span> ' : ''}<b>${esc(nm(r.spot))}</b>
              <small>${tx(`${r.m.stay}시간`, `${r.m.stay} h`)} · ${esc(r.m.fee)}${r.m.note ? ` · <em>${esc(r.m.note)}</em>` : ''}${r.inside ? tx(' · 점심은 안에서', ' · lunch inside') : ''}</small>${r.warn ? `<small><em>⚠ ${r.warn}</em></small>` : ''}${editing ? tools(r.spot, i, p.list.indexOf(r.spot)) : ''}</div></li>`
          : r.kind === 'meal' ? `<li class="tl-meal"><span class="tm">${rowTime(r)}</span><div>${esc(r.text)} <a class="link sm" href="${nearMap(r.near)}" target="_blank" rel="noopener">${tx('주변 맛집', 'Food nearby')}</a></div></li>`
          : `<li class="tl-${r.kind}"><span class="tm">${rowTime(r)}</span><div>${esc(r.text)}</div></li>`).join('')}</ol>${editing && unplaced.length
        ? `<select class="day-add" data-act="add" data-day="${i}" aria-label="${tx(`${i + 1}일차에 명소 추가`, `Add a sight to day ${i + 1}`)}"><option value="">${tx('＋ 명소 추가', '＋ Add a sight')}</option>${unplaced.map(s => `<option value="${esc(s.ko)}">${esc(spotName(s))}</option>`).join('')}</select>` : ''}</div>`).join('')}
    </div>
    <p class="muted small">⏱ ${tx("이동시간은 직선거리로 계산한 대략치이고, 운영시간·요금은 명소 카드의 '지도·운영시간'에서 확인하세요.", "Travel times are rough straight-line estimates. Check hours and prices via 'Map & hours' on each card.")}</p>
    ${unplaced.length ? `<p class="muted small">${tx('시간이 되면 더 둘러볼 곳', 'If you have time')}: ${unplaced.map(s => esc(spotName(s))).join(', ')}</p>` : ''}
    <div class="row-btns"><button type="button" class="btn ghost" id="planCopy">📋 ${tx('일정 복사', 'Copy plan')}</button>
      ${custom && !placed.length ? '' : `<a class="btn ghost" href="${route(custom ? placed : spots)}" target="_blank" rel="noopener">🗺 ${tx('Google 지도로 보기', 'Open in Google Maps')}</a>`}</div>`;
  $('#planCopy').addEventListener('click', async () => {
    const t = `${tx(`${c.ko} 여행 일정 (떠날지도)`, `${c.name} itinerary (Maybe Go)`)}\n\n${text}\n\n${planURL()}`;
    try { await navigator.clipboard.writeText(t); toast(tx('일정을 복사했어요', 'Plan copied')); } catch { prompt(tx('아래 내용을 복사하세요', 'Copy the text below'), t); }
  });
  drawPlanMap(timeline, center);
}

/* ---------- 일정 지도 (Leaflet + OpenStreetMap) ---------- */
const DAY_COLORS = ['#ff6b4a', '#2f80ed', '#12a150', '#a855f7', '#f59e0b', '#0ea5e9', '#e11d48', '#64748b', '#14b8a6', '#8b5cf6'];
let planMap = null, leafletP = null;
// 지도 라이브러리(Leaflet)는 일정 지도를 처음 그릴 때만 불러옴 → 첫 화면이 가벼워짐
function loadLeaflet() {
  if (typeof L !== 'undefined') return Promise.resolve();
  return leafletP ||= Promise.all([
    ['link', { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }],
    ['script', { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js' }]
  ].map(([tag, attrs]) => new Promise((ok, fail) => {
    const el = Object.assign(document.createElement(tag), attrs);
    el.onload = ok; el.onerror = () => { el.remove(); fail(new Error('leaflet')); };
    document.head.append(el);
  }))).catch(e => { leafletP = null; throw e; });
}
function drawPlanMap(timeline, center) {
  const wrap = $('#planMapWrap');
  if (!center) { wrap.hidden = true; return; }
  loadLeaflet().then(() => { if (wrap.isConnected) paintPlanMap(timeline, center); },
                     () => { wrap.hidden = true; });   // 지도 라이브러리를 못 불러오면 숨김
}
function paintPlanMap(timeline, center) {
  planMap?.remove();
  planMap = L.map('planMap', { scrollWheelZoom: false, attributionControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> ' + tx('기여자', 'contributors') }).addTo(planMap);
  const layers = timeline.map((p, i) => {
    const color = DAY_COLORS[i % DAY_COLORS.length], pts = [];
    const group = L.layerGroup();
    p.rows.filter(r => r.spot && spotGeo(r.spot)).forEach((r, k) => {
      const ll = spotGeo(r.spot); pts.push(ll);
      L.marker(ll, { icon: L.divIcon({ className: 'pin', html: `<span style="background:${color}">${i + 1}-${k + 1}</span>`, iconSize: [34, 22], iconAnchor: [17, 11] }) })
        .bindPopup(`<b>${esc(nm(r.spot))}</b><br>${tx(`${i + 1}일차`, `Day ${i + 1}`)} ${clock(r.time)} · ${tx(`${r.m.stay}시간`, `${r.m.stay} h`)}`).addTo(group);
    });
    if (pts.length > 1) L.polyline(pts, { color, weight: 3, opacity: .8, dashArray: p.g ? '6 6' : null }).addTo(group);
    return { group, pts };
  });
  const show = sel => {
    layers.forEach((l, i) => (sel === 'all' || +sel === i) ? l.group.addTo(planMap) : l.group.remove());
    const pts = (sel === 'all' ? layers.flatMap(l => l.pts) : layers[+sel]?.pts) || [];
    pts.length ? planMap.fitBounds(pts, { padding: [30, 30], maxZoom: 15 }) : planMap.setView(center, 12);
    $$('#planMapWrap [data-day]').forEach(b => b.classList.toggle('on', b.dataset.day === String(sel)));
  };
  $$('#planMapWrap [data-day]').forEach(b => b.addEventListener('click', () => show(b.dataset.day)));
  // 첫날 시내 일정이 지도 가운데 오도록: 근교가 있으면 '전체'가 너무 넓어져서 1일차부터 보여줌
  const farAway = layers.flatMap(l => l.pts).some(ll => km(ll, center) > 60);
  show(farAway && layers[0]?.pts.length ? 0 : 'all');
  setTimeout(() => planMap?.invalidateSize(), 200);
}

/* ---------- 먹거리 ---------- */
function cityFood(ap) {
  const f = CITY_FOOD[SPOT_ALIAS[ap?.code] || ap?.code];
  const split = (s, keys) => (s || '').split(';').filter(Boolean).map(x => { const v = x.split('|'); return Object.fromEntries(keys.map((k, i) => [k, v[i]])); });
  const en = EN && EN_FOOD[SPOT_ALIAS[ap?.code] || ap?.code] || [];
  return { food: localizeList(en[0], split(f?.food, ['n', 'd'])), street: localizeList(en[1], split(f?.street, ['n', 'd', 'q'])) };
}
function renderFood() {
  const c = current, box = $('#sec-food'); if (!box) return;
  const ap = curAp, city = cityOf(ap), f = cityFood(ap);
  const gm = q => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
  const nv = q => 'https://map.naver.com/p/search/' + enc(q);
  box.innerHTML = `<div class="block-title"><h3>🍜 ${esc(city)} ${tx('먹거리', 'food')}</h3><small>${tx('대표 음식과 맛집 거리', 'Local dishes and food streets')}</small></div>
    ${f.food.length ? `<div class="food-grid">${f.food.map(x => `<div class="food"><b>${esc(x.n)}</b><p>${esc(x.d)}</p>
      <div class="mini"><a href="${gm(x.n + ' ' + ap.en)}" target="_blank" rel="noopener">${tx('Google 지도', 'Google Maps')}</a>${EN ? '' : `<a href="${nv(city + ' ' + x.n)}" target="_blank" rel="noopener">네이버 지도</a>`}</div></div>`).join('')}</div>` : ''}
    ${f.street.length ? `<h4 class="sub-h">🏮 ${tx('맛집 거리 · 시장', 'Food streets & markets')}</h4><div class="areas">${f.street.map(x => `<div class="area"><b>${esc(x.n)}</b><p>${esc(x.d)}</p>
      <div class="mini"><a href="${gm(x.q)}" target="_blank" rel="noopener">${tx('지도에서 보기', 'View on map')}</a><a href="${gm('restaurants near ' + x.q)}" target="_blank" rel="noopener">${tx('주변 맛집', 'Food nearby')}</a></div></div>`).join('')}</div>` : ''}
    ${!f.food.length && !f.street.length ? `<div class="more-grid"><a class="more" href="${gm('restaurants in ' + ap.en)}" target="_blank" rel="noopener"><span class="mi">🍜</span><span><b>${esc(tx(`${city} 맛집`, `Food in ${city}`))}</b><small>${tx('Google 지도', 'Google Maps')}</small></span></a></div>` : ''}`;
}

/* ---------- 항공편 · 호텔 ---------- */
function renderTravel() {
  const c = current; if (!c || !$('#sec-flights')) return;
  const ap = curAp, to = ap.code, city = cityOf(ap);
  const { from, d1, d2, adults, children, infants, direct } = S, oneway = S.trip === 'oneway';
  const fromName = from === 'ICN' ? tx('인천', 'Seoul Incheon') : tx('김포', 'Seoul Gimpo');
  const n = Math.max(1, nights());
  const kidAges = [...Array(children).fill(8), ...Array(infants).fill(1)];
  const paxTxt = paxText(adults, children, infants);

  const gfq = `Flights to ${to || ap.en} from ${from} on ${d1}${oneway ? ' one way' : ` through ${d2}`} for ${adults} adults${children ? ` ${children} children` : ''}${infants ? ` ${infants} infants` : ''}${direct ? ' nonstop' : ''}`;
  const gf = `https://www.google.com/travel/flights?hl=${LANG}&curr=KRW&q=` + enc(gfq);
  const skyHost = tx('https://www.skyscanner.co.kr/', 'https://www.skyscanner.net/');
  const skyBase = to ? `${skyHost}transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/` : skyHost;
  const skyQ = `?adultsv2=${adults}${kidAges.length ? '&childrenv2=' + kidAges.join('%7C') : ''}&cabinclass=economy${direct ? '&preferdirects=true' : ''}${oneway ? '&rtn=0' : '&rtn=1'}`;
  const sky = aff('skyscanner', to ? `${skyBase}${yymmdd(d1)}/${oneway ? '' : yymmdd(d2) + '/'}${skyQ}` : skyBase);
  const skyMonth = aff('skyscanner', to ? `${skyBase}${d1.slice(2, 7).replace('-', '')}/${oneway ? '' : d2.slice(2, 7).replace('-', '') + '/'}${skyQ}` : skyBase);
  const nv = to ? `https://flight.naver.com/flights/international/${from}-${to}-${ymd(d1)}${oneway ? '' : `/${to}-${from}-${ymd(d2)}`}?adult=${adults}&child=${children}&infant=${infants}&fareType=Y${direct ? '&isDirect=true' : ''}`
                : 'https://flight.naver.com/';

  $('#sec-flights').innerHTML = `
    <div class="block-title"><h3>✈️ ${tx('항공편', 'Flights')}</h3><small>${fromName} → ${esc(city)} · ${fmtD(d1)}${oneway ? tx(' 편도', ' · one way') : ' – ' + fmtD(d2)} · ${paxTxt}${direct ? tx(' · 직항', ' · nonstop') : ''}</small></div>
    <div class="two">
      <div class="panel">
        ${c.aps.length > 1 ? `<h4>${tx('도착 공항', 'Arrival airport')}</h4><div class="ap-pick" role="radiogroup" aria-label="${tx('도착 공항 선택', 'Choose arrival airport')}">${c.aps.map(a =>
          `<button type="button" role="radio" aria-checked="${a.code === to}" data-ap="${a.code}" class="${a.code === to ? 'on' : ''}">${esc(a.name)} <small>${a.code}</small></button>`).join('')}</div>` : ''}
        <div class="route">
          <div class="ap">${from}<small>${fromName}</small></div>
          <div class="line"><i aria-hidden="true">✈</i>${ap.time ? `<span class="dur">${esc(ap.time)}</span>` : ''}</div>
          <div class="ap">${to || '✈'}<small>${esc(city)}</small></div>
        </div>
        ${c.custom ? `<p class="note">${tx('상세 노선 정보가 없는 여행지예요. 오른쪽 사이트에서 공항을 골라 검색해 주세요.', 'No route details for this place. Pick an airport on one of the search sites.')}</p>` : `
        <dl class="kv">
          <dt>${tx('도착 공항', 'Airport')}</dt><dd>${esc(ap.name)} (${to})</dd>
          <dt>${tx('비행 시간', 'Flight time')}</dt><dd>${esc(ap.time)}${from !== 'ICN' ? ` <small class="muted">${tx('(인천 기준)', '(from Incheon)')}</small>` : ''}</dd>
          <dt>${tx('주요 항공사', 'Airlines')}</dt><dd>${esc(factsOf(c, ap).airlines)}</dd>
          <dt>${tx('입국', 'Entry')}</dt><dd>${esc(factsOf(c, ap).visa)}</dd>
        </dl>`}
        <p class="note">${tx('※ 비행시간은 대략치예요. ', 'Flight times are approximate. ')}${from === 'GMP' ? tx('김포 출발 국제선은 일본·대만·중국 일부 노선만 있어요. ', 'Gimpo has only a few international routes (Japan, Taiwan, China). ') : ''}${tx('비자·입국 정책은 출발 전에 꼭 확인하세요.', 'Entry rules shown are for Korean passports; check them before you go.')}</p>
      </div>
      <div class="links">
        <a class="lnk" href="${gf}" target="_blank" rel="noopener"><div><b>${tx('Google 항공편', 'Google Flights')}</b><span>${tx('가격 추이 · 최저가 날짜 그래프', 'Price trends and cheapest dates')}</span></div><span class="arr">${tx('검색 →', 'Search →')}</span></a>
        <a class="lnk" href="${sky}" target="_blank" rel="${rel('skyscanner')}"><div><b>${tx('스카이스캐너', 'Skyscanner')}</b><span>${tx('항공사·여행사 가격 한 번에 비교', 'Compare airlines and agents')}</span></div><span class="arr">${tx('검색 →', 'Search →')}</span></a>
        ${EN ? '' : `<a class="lnk" href="${nv}" target="_blank" rel="noopener"><div><b>네이버 항공권</b><span>국내 여행사 특가 · 원화 결제</span></div><span class="arr">검색 →</span></a>`}
        ${to ? `<a class="lnk soft" href="${skyMonth}" target="_blank" rel="${rel('skyscanner')}"><div><b>📆 ${tx('날짜 유연하게', 'Flexible dates')}</b><span>${tx(`${parseD(d1).getMonth() + 1}월 전체에서 가장 싼 날 찾기 (스카이스캐너)`, `Cheapest day in ${MON[parseD(d1).getMonth()]} (Skyscanner)`)}</span></div><span class="arr">→</span></a>` : ''}
      </div>
    </div>`;

  const ageQ = kidAges.map(a => `&age=${a}`).join('');
  const bk = q => aff('booking', `https://www.booking.com/searchresults.${tx('ko', 'en-gb')}.html?ss=${enc(q)}&checkin=${d1}&checkout=${oneway ? addDays(d1, 1) : d2}&group_adults=${adults}&group_children=${kidAges.length}${ageQ}&no_rooms=1&lang=${tx('ko', 'en-gb')}&selected_currency=KRW`);
  const ag = q => aff('agoda', `https://www.agoda.com/${tx('ko-kr', 'en-us')}/search?textToSearch=${enc(q)}&checkIn=${d1}&los=${n}&adults=${adults}&children=${kidAges.length}${kidAges.length ? '&childages=' + kidAges.join(',') : ''}&rooms=1`);
  const gh = q => `https://www.google.com/travel/search?hl=${LANG}&curr=KRW&q=${enc(q + ' hotels')}`;
  $('#sec-hotels').innerHTML = `
    <div class="block-title"><h3>🏨 ${tx('호텔', 'Hotels')}</h3><small>${esc(city)} · ${oneway ? tx('1박 (편도)', '1 night (one way)') : nightsText(n)} · ${paxTxt}</small></div>
    <div class="links three">
      <a class="lnk" href="${bk(ap.en)}" target="_blank" rel="${rel('booking')}"><div><b>${tx('부킹닷컴', 'Booking.com')}</b><span>${tx('무료 취소 옵션 많음', 'Many free-cancellation rates')}</span></div><span class="arr">→</span></a>
      <a class="lnk" href="${ag(ap.en)}" target="_blank" rel="${rel('agoda')}"><div><b>${tx('아고다', 'Agoda')}</b><span>${tx('아시아 숙소 특가', 'Deals across Asia')}</span></div><span class="arr">→</span></a>
      <a class="lnk" href="${gh(ap.en)}" target="_blank" rel="noopener"><div><b>${tx('Google 호텔', 'Google Hotels')}</b><span>${tx('지도로 위치·가격 비교', 'Compare location and price on a map')}</span></div><span class="arr">→</span></a>
    </div>
    <div class="panel">
      <h4>${tx('추천 숙소 지역', 'Where to stay')} · ${esc(city)}</h4>
      <div class="areas">${areasFor(c, ap).map(a => `
        <div class="area"><b>${esc(a.n)}</b><p>${esc(a.d)}</p>
          <div class="mini"><a href="${bk(a.q || a.n + ' ' + ap.en)}" target="_blank" rel="${rel('booking')}">${tx('부킹닷컴', 'Booking.com')}</a><a href="${ag(a.q || a.n + ' ' + ap.en)}" target="_blank" rel="${rel('agoda')}">${tx('아고다', 'Agoda')}</a><a href="${gh(a.q || a.n + ' ' + city)}" target="_blank" rel="noopener">${tx('Google 호텔', 'Google Hotels')}</a><a href="${mapLink(a.q || a.n, a.q ? '' : ap.en)}" target="_blank" rel="noopener">${tx('지도', 'Map')}</a></div></div>`).join('')}
      </div>
    </div>`;
}
$('#main').addEventListener('click', e => {
  const b = e.target.closest('.ap-pick button'); if (!b || !current?.aps) return;
  endShared();
  curAp = current.aps.find(a => a.code === b.dataset.ap);
  stopVideos(); setURL(false); renderSpots(); renderTravel(); renderInfo(); renderPlan(); renderFood(); renderMore();   // 명소·일정·날씨·먹거리까지 그 도시 기준으로
  $('.ap-pick button.on')?.focus();
});

/* ---------- 투어·티켓 · 여행 준비 · 맛집 ---------- */
function renderMore() {
  const c = current, box = $('#sec-more'); if (!box) return;
  const city = cityOf(curAp), en = curAp.en;
  const mrt = q => aff('myrealtrip', 'https://www.myrealtrip.com/search?q=' + enc(q));
  const items = [
    ['🎟', '투어 · 입장권', '마이리얼트립', mrt(city), 'myrealtrip'],
    ['🎢', '투어 · 액티비티', '클룩', aff('klook', 'https://www.klook.com/ko/search/result/?query=' + enc(en)), 'klook'],
    ['📶', 'eSIM · 유심', '마이리얼트립', mrt(`${c.custom || AP_FACTS[curAp.code] ? city : c.ko} eSIM`), 'myrealtrip'],
    ['🚗', '해외 렌터카', '마이리얼트립', mrt(`${city} 렌터카`), 'myrealtrip'],
    ['🛡', '여행자보험', '마이리얼트립', mrt('여행자보험'), 'myrealtrip'],
    ['🍜', '맛집 · 지도', 'Google 지도', `https://www.google.com/maps/search/?api=1&query=${enc('restaurants in ' + en)}`],
    ['🗺', '맛집 · 지도', '네이버 지도', `https://map.naver.com/p/search/${enc(city + ' 맛집')}`],
    ['💬', '여행 브이로그', 'YouTube', 'https://www.youtube.com/results?search_query=' + enc(city + ' 여행 브이로그')]
  ];
  // 영어판은 한국어 전용 서비스(마이리얼트립·네이버) 대신 영어로 쓸 수 있는 곳
  const klook = q => aff('klook', 'https://www.klook.com/en-US/search/result/?query=' + enc(q));
  const itemsEn = [
    ['🎟', 'Tours & tickets', 'Klook', klook(en), 'klook'],
    ['🎢', 'Experiences', 'GetYourGuide', 'https://www.getyourguide.com/s/?q=' + enc(en)],
    ['📶', 'eSIM · SIM', 'Klook', klook(`${c.custom || AP_FACTS[curAp.code] ? en : c.name} eSIM`), 'klook'],
    ['🚗', 'Car rental', 'Klook', klook(`${en} car rental`), 'klook'],
    ['🍜', 'Restaurants', 'Google Maps', `https://www.google.com/maps/search/?api=1&query=${enc('restaurants in ' + en)}`],
    ['💬', 'Travel vlogs', 'YouTube', 'https://www.youtube.com/results?search_query=' + enc(en + ' travel vlog')]
  ];
  box.innerHTML = `<div class="block-title"><h3>🎟 ${tx('투어 · 여행 준비', 'Tours & prep')}</h3><small>${esc(city)}</small></div>
    <div class="more-grid">${(EN ? itemsEn : items).map(([ic, t, s, u, k]) => `<a class="more" href="${u}" target="_blank" rel="${rel(k || '')}"><span class="mi">${ic}</span><span><b>${t}</b><small>${s}</small></span></a>`).join('')}</div>`;
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
  history.pushState(null, '', withLang(location.pathname)); renderHome(); scrollTo({ top: 0, behavior: 'smooth' });
});
$('#savedBtn').addEventListener('click', () => {
  if (!getSaved().length) return toast(tx('명소 카드의 ♥를 누르면 보관함에 담겨요', 'Tap ♥ on a sight card to save it'));
  if (current) { history.pushState(null, '', withLang(location.pathname)); renderHome(); }
  setTimeout(() => $('#savedSec')?.scrollIntoView({ behavior: 'smooth' }), 50);
});
function applyTheme() {
  const t = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeIc').textContent = t === 'dark' ? '☀️' : '🌙';
  $('#themeBtn').setAttribute('aria-label', t === 'dark' ? tx('라이트 모드로 전환', 'Switch to light mode') : tx('다크 모드로 전환', 'Switch to dark mode'));
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
  toast(lg ? tx('글자를 크게 표시해요', 'Larger text on') : tx('기본 글자 크기로 돌아왔어요', 'Default text size'));
});
$('#fsBtn').setAttribute('aria-pressed', document.documentElement.dataset.fs === 'lg');
// 검색창이 화면 밖으로 나가면 하단 검색·맨 위로 버튼 표시
new IntersectionObserver(([en]) => { $('#fabSearch').hidden = en.isIntersecting; $('#fabTop').hidden = en.isIntersecting; }).observe($('#searchForm'));
$('#fabTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
// 아래로 스크롤하는 동안은 플로팅 버튼을 숨겨 카드 내용을 가리지 않게 (위로 올리면 다시 표시)
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY, dy = y - lastY; if (Math.abs(dy) < 8) return;
  $('.fab').classList.toggle('away', dy > 0); lastY = y;
}, { passive: true });
$('#fabSearch').addEventListener('click', () => { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => $('#q').focus(), 350); });

/* =========================================================
   시작
   ========================================================= */
// 제휴 링크가 하나라도 설정되어 있으면 하단에 제휴 고지 표시
if (typeof AFFILIATE !== 'undefined' && Object.values(AFFILIATE).some(Boolean)) $('#affNote').hidden = false;
applyTheme(); syncForm(); updateSavedCount(); route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
