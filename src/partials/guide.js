/* ---- guide.js: step navigation for a guide page ----
   startGuide(scenes, alwaysTick): scenes[i] is the animation for step i (or null); each has enter() and tick(dt).
   alwaysTick: animations that run regardless of the step (e.g. a hero map). */
function startGuide(scenes, alwaysTick = []){
  const steps = [...document.querySelectorAll('.step')];
  const rail = $('#railList');
  steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><span class="num">${i+1}</span><span class="name">${s.dataset.title}</span></button>`;
    li.querySelector('button').onclick = () => go(i);
    rail.appendChild(li);
  });
  let current = 0, finished = false, activeScene = null;
  const announcer = document.createElement('p');
  announcer.className = 'sr-only'; announcer.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcer);

  function go(i, scroll = true, push = scroll){
    finished = i >= steps.length;
    current = Math.max(0, Math.min(i, steps.length-1));
    steps.forEach((s, k) => s.classList.toggle('active', !finished && k === current));
    $('#complete').classList.toggle('show', finished);
    [...rail.querySelectorAll('button')].forEach((b, k) => {
      b.classList.toggle('done', finished || k < current);
      if (!finished && k === current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('#bar').style.width = finished ? '100%' : (current / steps.length) * 100 + '%';
    $('#prev').disabled = !finished && current === 0;
    $('#prev').style.visibility = (!finished && current === 0) ? 'hidden' : 'visible';
    $('#next').textContent = finished ? T.again : current === steps.length-1 ? T.finish : T.next;
    activeScene = finished ? null : scenes[current] || null;
    if (activeScene && activeScene.enter) activeScene.enter();
    const label = finished ? T.complete : fmt(T.stepOf, {n: current+1, total: steps.length, title: steps[current].dataset.title});
    $('#nowLabel').textContent = label;
    const hash = '#' + (finished ? 'complete' : steps[current].id);
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    if (scroll){
      announcer.textContent = label;
      $('#journey').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
    }
  }
  window.go = go;   // used by the test harness
  $('#next').onclick = () => finished ? go(0) : go(current+1);
  $('#prev').onclick = () => finished ? go(steps.length-1) : go(current-1);

  /* Deep links: #tawaf, #arafah, #complete ... */
  function fromHash(){
    const id = location.hash.slice(1);
    if (id === 'complete') return steps.length;
    return steps.findIndex(s => s.id === id);
  }
  function onHistory(){
    const i = fromHash();
    if (i >= 0){ if (i !== (finished ? steps.length : current)) go(i, true, false); }
    else if (!location.hash) go(0, false, false);   // back to the bare page; other anchors leave the step alone
  }
  addEventListener('popstate', onHistory);
  addEventListener('hashchange', onHistory);

  /* Arrow keys move between steps, following the reading direction */
  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const fwd = RTL ? 'ArrowLeft' : 'ArrowRight', back = RTL ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd && !finished) go(current+1);
    else if (e.key === back && (finished || current > 0)) finished ? go(steps.length-1) : go(current-1);
  });

  onMotionChange = () => { alwaysTick.forEach(a => a.enter && a.enter()); go(finished ? steps.length : current, false, false); };

  let last = performance.now();
  function loop(now){
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    alwaysTick.forEach(a => a.tick(dt));
    if (activeScene && activeScene.tick) activeScene.tick(dt);
    requestAnimationFrame(loop);
  }
  alwaysTick.forEach(a => a.enter && a.enter());
  requestAnimationFrame(loop);
  const i = fromHash(); go(i < 0 ? 0 : i, false, false);
  if (i >= 0) $('#journey').scrollIntoView({behavior: 'instant'});
}
