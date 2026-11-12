(() => {
const D = window.MG, $ = s => document.querySelector(s);
const slides = [...document.querySelectorAll('.slide')];
const deck = $('#deck');
const contactBlock = $('.wc-s4');
if (contactBlock) {
  contactBlock.classList.add('s-ways');
  $('#s2 > .wrap').appendChild(contactBlock);
}
const hashTarget = location.hash && document.querySelector(location.hash);
if (hashTarget) setTimeout(() => hashTarget.scrollIntoView({ behavior: 'instant', block: 'start' }), 60);
if (new URLSearchParams(location.search).has('flat')) {
  document.head.insertAdjacentHTML('beforeend', '<style>*{transition:none!important;animation:none!important}.rv{opacity:1!important;transform:none!important;filter:none!important}</style>');
  slides.forEach(s => s.classList.add('in'));
}

/* nav dots + reveal */
const dots = $('.dots');
slides.forEach(s => { const a = document.createElement('a'); a.href = '#' + s.id; a.title = s.dataset.title; dots.appendChild(a); });
const prev = $('.deck-prev'), next = $('.deck-next'), count = $('.deck-count');
let active = 0;
const go = i => {
  active = Math.max(0, Math.min(slides.length - 1, i));
  slides[active].scrollIntoView({ behavior: 'smooth', block: 'start' });
};
$('.brand').addEventListener('click', e => { e.preventDefault(); go(0); });
prev.addEventListener('click', () => go(active - 1));
next.addEventListener('click', () => go(active + 1));
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); const i = slides.indexOf(e.target);
    active = i;
    [...dots.children].forEach((d, j) => d.classList.toggle('on', i === j));
    count.textContent = `${i + 1} / ${slides.length}`;
    prev.disabled = i === 0; next.disabled = i === slides.length - 1;
    if (i > 0) $('.cue')?.classList.add('used');
  }
}), { root: deck, threshold: .55 });
slides.forEach(s => io.observe(s));
addEventListener('keydown', e => {
  if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); go(active + 1); }
  if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); go(active - 1); }
});
addEventListener('resize', () => slides[active].scrollIntoView({ block: 'start' }));

/* globe */
const stage = $('.globe-stage'), gl = $('#globe'), cv = $('#globeCanvas'), cx = cv.getContext('2d');
const N = D.members.length, pts = [], dotsP = [];
const chipSize = N >= 28 ? [67, 32] : N >= 20 ? [74, 36] : N >= 14 ? [81, 41] : [88, 43];
gl.style.setProperty('--chip-w', `${chipSize[0]}px`);
gl.style.setProperty('--chip-h', `${chipSize[1]}px`);
gl.style.setProperty('--chip-logo-h', `${Math.round(chipSize[1] * .92)}px`);
const fib = (i, n) => { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5)); return [Math.cos(t) * r, y, Math.sin(t) * r]; };
D.members.forEach((m, i) => {
  const el = document.createElement('div'); el.className = `chip ${m.fit || ''}`.trim(); el.title = m.n;
  el.innerHTML = m.src ? `<span class="chip-logo"><img src="${m.src}" alt="${m.n}">${m.suffix ? `<b>${m.suffix}</b>` : ''}</span>` : `<span class="t" style="color:${m.color || '#12223F'}">${m.text}</span>`;
  const img = el.querySelector('img');
  if (img) {
    const fit = () => {
      const r = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1.4;
      // adaptive: wide logos fill width, tall logos fill height — small relative gap
      const pad = r >= 4 ? .045 : r >= 2 ? .07 : .11;      // gap as fraction of chip, tighter for extreme ratios
      const w = Math.min(chipSize[0] * (1 - 2 * pad), chipSize[1] * (1 - 2 * pad) * r);
    };
    img.complete ? fit() : img.addEventListener('load', fit);
  }
  gl.appendChild(el); pts.push({ p: fib(i, N), el });
});
for (let i = 0; i < 260; i++) dotsP.push(fib(i, 260));
let yaw = .4, pitch = -.25, vy = .0035, vp = 0, drag = false, lx = 0, ly = 0;
stage.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => { if (!drag) return; vy = (e.clientX - lx) * .006; vp = (ly - e.clientY) * .006; yaw += vy; pitch = Math.max(-1.2, Math.min(1.2, pitch + vp)); lx = e.clientX; ly = e.clientY; });
stage.addEventListener('pointerup', () => drag = false);
stage.addEventListener('pointercancel', () => drag = false);
const rot = ([x, y, z]) => { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
function frame() {
  if (!drag) { vy += (.0035 - vy) * .02; vp *= .92; yaw += vy; pitch += vp; pitch += (-.25 - pitch) * .01; }
  const w = stage.clientWidth, dpr = devicePixelRatio || 1; if (cv.width !== w * dpr) { cv.width = cv.height = w * dpr; }
  const R = w * .36, c = w / 2; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, w);
  for (const p of dotsP) { const [x, y, z] = rot(p); const a = (z + 1) / 2; cx.fillStyle = `rgba(44,95,207,${.08 + a * .45})`; cx.beginPath(); cx.arc(c + x * R, c + y * R, .8 + a * 1.6, 0, 6.3); cx.fill(); }
  cx.strokeStyle = 'rgba(44,95,207,.12)'; cx.lineWidth = 1;
  for (let k = -2; k <= 2; k++) { cx.beginPath(); for (let t = 0; t <= 64; t++) { const a = t / 64 * Math.PI * 2, lat = k * .5;
      const [x, y, z] = rot([Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat)]); t ? cx.lineTo(c + x * R, c + y * R) : cx.moveTo(c + x * R, c + y * R); } cx.stroke(); }
  for (const q of pts) { const [x, y, z] = rot(q.p), s = .55 + (z + 1) * .32, o = z < -.2 ? .38 + (z + 1) * .22 : 1;
    q.el.style.transform = `translate(${x * R * 1.12}px,${y * R * 1.12}px) scale(${s})`; q.el.style.opacity = o; q.el.style.zIndex = z > 0 ? 3 : 0;
    q.el.style.filter = z < -.1 ? `blur(${Math.min(1.1,(-z)*1.1)}px)` : 'none'; }
  requestAnimationFrame(frame);
}
frame();

/* partners — compact strip on slide 1 */
const pg = $('#partnerStrip');
if (pg) {
  D.partners.forEach((p, i) => {
    const visual = p.src
      ? `<img class="plg-img" src="${p.src}" alt="${p.n}">`
      : `${p.icon ? `<img class="plg-ic" src="${p.icon}" alt="">` : ''}<strong>${p.text}</strong>`;
    pg.insertAdjacentHTML(
      'beforeend',
      `<div class="partner-logo" style="--i:${i}" aria-label="${p.n}" title="${p.n}"><span class="partner-name">${p.n}</span><span class="partner-visual">${visual}</span></div>`
    );
    if (i === 4) pg.insertAdjacentHTML('beforeend', '<div class="partner-logo partner-you" aria-label="Your company?"><span class="partner-name you-text">Your company?</span></div>');
  });
}

/* newest-first timeline + uncropped filmstrip */
const chapters = [...D.chapters].reverse();
const tabs = $('#eventTabs'), film = $('#filmstrip'), caption = $('#filmCaption');
const eventSlide = tabs.closest('.slide');
eventSlide.insertAdjacentHTML('beforeend', '<aside class="event-focus-card" aria-live="polite"></aside>');
const eventFocusCard = eventSlide.querySelector('.event-focus-card');
tabs.insertAdjacentHTML('afterbegin', `
  <svg class="event-arc-svg" viewBox="0 0 800 48" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="arcMetal" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="0">
      <stop offset="0" stop-color="#1b3358"/><stop offset=".22" stop-color="#7f9cc4"/><stop offset=".45" stop-color="#16294a"/>
      <stop offset=".62" stop-color="#8aa7cd"/><stop offset=".82" stop-color="#1b3358"/><stop offset="1" stop-color="#6f8db6"/>
    </linearGradient></defs>
    <path class="event-arc-glow"></path>
    <path class="event-arc-line"></path>
  </svg>`);
const arcLine = tabs.querySelector('.event-arc-line');
const arcGlow = tabs.querySelector('.event-arc-glow');
let selectedEvent = 0;
const eventButtons = () => [...tabs.querySelectorAll('.event-tab')];
const arcPoints = active => chapters.map((_, i) => ({ x: 50 + i * 100, y: 24 }));
const arcPath = points => {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    d += ` Q ${a.x} ${a.y} ${(a.x + b.x) / 2} ${(a.y + b.y) / 2}`;
  }
  const last = points[points.length - 1];
  return `${d} Q ${last.x} ${last.y} ${last.x} ${last.y}`;
};
const setArcPeak = i => {
  const points = arcPoints(i);
  const d = `M 0 ${points[0].y} L 800 ${points[0].y}`;
  arcLine.setAttribute('d', d);
  arcGlow.setAttribute('d', d);
  eventButtons().forEach((button, j) => button.style.setProperty('--ball-y', points[j].y.toFixed(2)));
};
const clearTransientEventState = () => {
  eventSlide.classList.remove('timeline-focus');
  eventFocusCard.classList.remove('show');
  tabs.dataset.mode = 'idle';
  eventButtons().forEach(tab => {
    tab.classList.remove('show-detail', 'image-active');
  });
  film.querySelectorAll('.film-frame').forEach(frame => {
    frame.classList.remove('is-highlighted', 'is-dimmed');
  });
};
const setEvent = (i, scroll = false, reveal = false, mode = 'idle', targetFrame = null) => {
  selectedEvent = i;
  tabs.dataset.mode = mode;
  eventSlide.classList.toggle('timeline-focus', mode === 'timeline');
  eventButtons().forEach((tab, j) => {
    tab.classList.toggle('on', i === j);
    tab.classList.toggle('show-detail', reveal && i === j);
    tab.classList.toggle('image-active', mode === 'image' && i === j);
  });
  film.querySelectorAll('.film-frame').forEach(frame => {
    const matchesEvent = Number(frame.dataset.event) === i;
    const highlighted = mode === 'timeline' ? matchesEvent : mode === 'image' ? frame === targetFrame : false;
    frame.classList.toggle('is-highlighted', highlighted);
    frame.classList.toggle('is-dimmed', mode === 'timeline' && !matchesEvent);
  });
  setArcPeak(i);
  const c = chapters[i];
  const activeTab = eventButtons()[i];
  if (activeTab && reveal) {
    const r = activeTab.getBoundingClientRect();
    eventFocusCard.style.left = `${Math.max(150, Math.min(innerWidth - 150, r.left + r.width / 2))}px`;
  }
  eventFocusCard.innerHTML = `
    <small>${c.date} · ${c.venue}</small>
    <strong>${c.title}</strong>
    <span>${c.desc}</span>
    <b>${c.with ? `With ${c.with}` : 'An MgHUB community evening'}</b>`;
  eventFocusCard.classList.toggle('show', reveal && mode === 'timeline');
  caption.textContent = `${c.date} · ${c.title} · ${c.venue}${c.with ? ` · With ${c.with}` : ''}`;
  if (scroll) {
    const frames = [...film.querySelectorAll(`[data-event="${i}"]`)];
    if (frames.length) {
      const first = frames[0], last = frames[frames.length - 1];
      const center = (first.offsetLeft + last.offsetLeft + last.offsetWidth) / 2;
      const maximum = film.scrollWidth - film.clientWidth;
      film.scrollTo({ left: Math.max(0, Math.min(maximum, center - film.clientWidth / 2)), behavior: 'smooth' });
    }
  }
};
const filmFrames = [];
chapters.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'event-tab';
  b.style.setProperty('--i', i);
  b.innerHTML = `
    <small>${c.date}</small>
    <span>${c.title}</span>`;
  const activateTimeline = () => setEvent(i, true, true, 'timeline');
  b.addEventListener('mouseenter', activateTimeline);
  b.addEventListener('focus', activateTimeline);
  b.addEventListener('click', activateTimeline);
  b.addEventListener('mouseleave', clearTransientEventState);
  b.addEventListener('blur', clearTransientEventState);
  tabs.appendChild(b);
  c.photos.forEach((photo, j) => filmFrames.push({ event: i, photo, alt: `${c.title}, photo ${j + 1}`, date: c.date }));
});
filmFrames.forEach(frame => film.insertAdjacentHTML(
  'beforeend',
  `<figure class="film-frame" tabindex="0" data-event="${frame.event}"><img src="assets/photos/${frame.photo}.jpg" alt="${frame.alt}" loading="lazy"><figcaption>${frame.date}</figcaption></figure>`
));
film.querySelectorAll('.film-frame').forEach(frame => {
  const activate = () => setEvent(Number(frame.dataset.event), false, false, 'image', frame);
  frame.addEventListener('mouseenter', activate);
  frame.addEventListener('focus', activate);
  frame.addEventListener('click', activate);
  frame.addEventListener('mouseleave', clearTransientEventState);
  frame.addEventListener('blur', clearTransientEventState);
});
let filmTick;
film.addEventListener('scroll', () => {
  cancelAnimationFrame(filmTick);
  filmTick = requestAnimationFrame(() => {
    const center = film.getBoundingClientRect().left + film.clientWidth / 2;
    let nearest, distance = Infinity;
    film.querySelectorAll('.film-frame').forEach(frame => {
      const r = frame.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - center);
      if (d < distance) { distance = d; nearest = frame; }
    });
    if (nearest && tabs.dataset.mode === 'idle') setEvent(Number(nearest.dataset.event));
  });
});
const filmPrev=document.querySelector('.film-prev'),filmNext=document.querySelector('.film-next');
filmPrev&&filmPrev.addEventListener('click',()=>film.scrollBy({left:-420,behavior:'smooth'}));
filmNext&&filmNext.addEventListener('click',()=>film.scrollBy({left:420,behavior:'smooth'}));
setEvent(0);
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    film.scrollTo({ left: 0, behavior: 'auto' });
    setEvent(0);
  });
});
})();
