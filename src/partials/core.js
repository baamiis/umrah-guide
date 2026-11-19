/* ---- core.js: shared by every page ---- */
const T = {{@js}};
const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => o[k]);
const RTL = document.documentElement.dir === 'rtl';
const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduce = prefersReduce && !document.documentElement.classList.contains('motion-on');
const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };

/* Animation speed, shared by every scene on the page */
const speeds = [1, 0.5, 2]; let speedIdx = 0, speed = 1;
document.querySelectorAll('.speed').forEach(b => b.onclick = () => {
  speedIdx = (speedIdx + 1) % speeds.length; speed = speeds[speedIdx];
  document.querySelectorAll('.speed').forEach(x => x.textContent = fmt(T.speed, {x: speed}));
});

/* In-page links scroll without adding history entries, so Back always means "previous step" */
document.querySelectorAll('a[href^="#"]:not([href="#"]):not(#printLink)').forEach(a => {
  const target = document.getElementById(a.getAttribute('href').slice(1));
  if (!target || target.classList.contains('step')) return;
  a.addEventListener('click', e => {
    e.preventDefault();
    target.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
    if (a.classList.contains('skip')) target.focus({preventScroll: true});
  });
});

/* Visitors whose device asks for reduced motion can switch the diagrams back on */
let onMotionChange = () => {};
const motionNote = $('#motionNote');
function syncMotionNote(){
  if (!motionNote) return;
  motionNote.hidden = !prefersReduce;
  $('#motionText').textContent = reduce ? T.paused : T.preferLess;
  $('#motionBtn').textContent = reduce ? T.playAnim : T.pauseAnim;
}
if (motionNote) $('#motionBtn').onclick = () => {
  reduce = !reduce;
  document.documentElement.classList.toggle('motion-on', !reduce);
  try { localStorage.setItem('motion', reduce ? 'off' : 'on'); } catch(e){}
  syncMotionNote();
  onMotionChange();
};
syncMotionNote();

/* Language menu closes on outside click or Escape; its links keep the current step (/fr/umrah/#tawaf) */
const langMenu = $('.lang');
if (langMenu){
  document.addEventListener('click', e => { if (langMenu.open && !langMenu.contains(e.target)) langMenu.open = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && langMenu.open){ langMenu.open = false; langMenu.querySelector('summary').focus(); } });
  langMenu.querySelectorAll('a[hreflang]').forEach(a => a.addEventListener('click', () => {
    a.href = a.getAttribute('href').split('#')[0] + location.hash;
  }));
}

const printLink = $('#printLink');
if (printLink) printLink.onclick = e => { e.preventDefault(); print(); };
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
