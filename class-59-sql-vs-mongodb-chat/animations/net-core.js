// Shared engine for the class 56 animations: boxes, links, moving request "packets",
// narration and pause / play / next step. Every page describes scenarios as async scripts.
const Net = (() => {
  const $ = s => document.querySelector(s);
  const CANCEL = { cancelled: true };
  const VW = 1000;
  // idle = nothing is playing yet (or the scenario has finished): the main button then says Start / Replay.
  const P = { paused: false, stepOnce: false, gate: null, run: 0, idle: true, played: false };
  let VH = 500, MAXS = 1.4, stage, world, svg, layer, defs = [], active = -1;
  let nodes = {}, links = [], packets = [], last = 0;

  const speed = () => +$('#speed').value;

  // ---------- stage ----------
  function mount(height, maxScale) {
    VH = height;
    MAXS = maxScale || 1.4;
    stage = $('#stage');
    stage.innerHTML = '<div class="net-world"><svg class="net-links"></svg><div class="net-layer"></div></div>';
    world = stage.querySelector('.net-world');
    svg = stage.querySelector('svg');
    layer = stage.querySelector('.net-layer');
    world.style.width = VW + 'px';
    world.style.height = VH + 'px';
    svg.setAttribute('width', VW);
    svg.setAttribute('height', VH);
    fit();
    window.addEventListener('resize', fit);
    requestAnimationFrame(tick);
  }

  function fit() {
    const s = Math.min(MAXS, stage.clientWidth / VW);
    world.style.transform = `scale(${s})`;
    world.style.left = (stage.clientWidth - VW * s) / 2 + 'px';
    stage.style.height = VH * s + 'px';
  }

  function reset() {
    packets.forEach(p => { p.el.remove(); p.resolve(false); });
    packets = [];
    nodes = {};
    links = [];
    layer.innerHTML = '';
    svg.innerHTML = '';
  }

  // ---------- boxes ----------
  function group(o) {
    const el = document.createElement('div');
    el.className = 'grp';
    Object.assign(el.style, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' });
    el.innerHTML = `<span>${o.label || ''}</span>`;
    layer.appendChild(el);
  }

  function node(id, o) {
    const el = document.createElement('div');
    layer.appendChild(el);
    nodes[id] = { el, o: Object.assign({ kind: 'server' }, o) };
    paint(id);
    drawLinks();
  }

  function paint(id) {
    const { el, o } = nodes[id];
    el.className = `nd ${o.kind} ${o.state || ''}`;
    el.style.left = o.x + 'px';
    el.style.top = o.y + 'px';
    if (o.w) el.style.width = o.w + 'px';
    el.innerHTML = `<div class="nd-t">${o.label}</div>`
      + (o.sub ? `<div class="nd-s">${o.sub}</div>` : '')
      + (o.body ? `<div class="nd-b">${o.body}</div>` : '')
      + (o.badge ? `<span class="nd-badge ${o.badgeCls || ''}">${o.badge}</span>` : '');
  }

  function set(id, patch) { Object.assign(nodes[id].o, patch); paint(id); drawLinks(); }
  const get = id => nodes[id].o;

  function flash(id, kind) {
    const el = nodes[id].el;
    el.classList.remove('fl-ok', 'fl-bad');
    void el.offsetWidth;
    el.classList.add('fl-' + kind);
  }

  // ---------- links ----------
  function link(a, b, o = {}) { links.push({ a, b, o }); drawLinks(); }
  function unlink(a, b) { links = links.filter(l => !((l.a === a && l.b === b) || (l.a === b && l.b === a))); drawLinks(); }
  function linkSet(a, b, patch) {
    links.filter(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)).forEach(l => Object.assign(l.o, patch));
    drawLinks();
  }
  function drawLinks() {
    svg.innerHTML = links.filter(l => nodes[l.a] && nodes[l.b]).map(l => {
      const A = nodes[l.a].o, B = nodes[l.b].o;
      const cls = [l.o.dashed ? 'dash' : '', l.o.cls || ''].join(' ');
      return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${cls}"/>`
        + (l.o.label ? `<text x="${(A.x + B.x) / 2}" y="${(A.y + B.y) / 2 - 8}" class="${l.o.cls || ''}">${l.o.label}</text>` : '');
    }).join('');
  }

  // ---------- packets ----------
  // Moves a pill from one box to another. Resolves when it arrives (or at stopAt, 0..1, if it gets "lost" on the way).
  function send(from, to, o = {}) {
    const A = nodes[from].o, B = nodes[to].o;
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.className = 'pk ' + (o.cls || '');
      el.innerHTML = o.label || '';
      el.style.left = A.x + 'px';
      el.style.top = A.y + 'px';
      layer.appendChild(el);
      packets.push({ el, ax: A.x, ay: A.y, bx: B.x, by: B.y, t: 0, dur: o.dur || 1100, stopAt: o.stopAt || 1, resolve });
    });
  }

  // Animation frames stop when the tab is hidden, so a slow timer keeps packets moving then.
  let lastFrame = 0;
  setInterval(() => { if (performance.now() - lastFrame > 250) advance(performance.now()); }, 100);

  function tick(ts) {
    lastFrame = performance.now();
    advance(ts);
    requestAnimationFrame(tick);
  }

  function advance(ts) {
    const dt = last ? Math.min(ts - last, 1000) : 0;
    last = ts;
    if (!P.paused) {
      const sp = speed();
      packets = packets.filter(p => {
        p.t = Math.min(p.stopAt, p.t + dt * sp / p.dur);
        const e = p.t < 0.5 ? 2 * p.t * p.t : 1 - Math.pow(-2 * p.t + 2, 2) / 2;
        p.el.style.left = p.ax + (p.bx - p.ax) * e + 'px';
        p.el.style.top = p.ay + (p.by - p.ay) * e + 'px';
        if (p.t >= p.stopAt) { p.el.remove(); p.resolve(true); return false; }
        return true;
      });
    }
  }

  // ---------- timing, narration, pause ----------
  function check(ctx) { if (ctx.id !== P.run) throw CANCEL; }
  const tickMs = ms => new Promise(r => setTimeout(r, ms));

  // Waits ms of animation time (frozen while paused, faster with the speed slider).
  // Real elapsed time since the last check (capped, so a sleeping laptop does not skip a whole scene).
  const since = prev => Math.min(performance.now() - prev, 1000);

  async function wait(ctx, ms) {
    let left = ms, prev = performance.now();
    while (left > 0) {
      check(ctx);
      await tickMs(30);
      if (!P.paused) left -= since(prev) * speed();
      prev = performance.now();
    }
    check(ctx);
  }

  // A narration pause: waits a bit when playing, or until Next / Play when paused.
  async function beat(ctx, ms = 2400) {
    check(ctx);
    if (P.stepOnce) { P.stepOnce = false; P.paused = true; syncCtl(); }
    let left = ms, prev = performance.now();
    while (left > 0 && !P.paused) {
      await tickMs(30);
      check(ctx);
      left -= since(prev) * speed();
      prev = performance.now();
    }
    if (P.paused) await new Promise(r => { P.gate = r; syncCtl(); });
    check(ctx);
  }

  function say(html, kind) {
    $('#msgText').innerHTML = html;
    $('#msg').className = kind || '';
  }

  // Runs a side task (like a stream of requests) that stops quietly when the scenario is restarted.
  function bg(promise) { promise.catch(e => { if (e !== CANCEL) console.error(e); }); }

  function syncCtl() {
    $('#bPause').innerHTML = P.idle ? (P.played ? '&#8635; Replay' : '&#9654; Start') : P.paused ? '&#9654; Play' : '&#10074;&#10074; Pause';
    $('#bPause').classList.toggle('primary', P.idle || P.paused);
    $('#bStep').disabled = P.idle || !P.paused;
  }
  function mainButton() {
    if (P.idle) { P.paused = false; start(active); }
    else setPaused(!P.paused);
  }
  function setPaused(v) {
    P.paused = v;
    if (!v && P.gate) { const g = P.gate; P.gate = null; g(); }
    syncCtl();
  }
  function next() {
    if (!P.paused) return;
    P.stepOnce = true;
    P.paused = false;
    if (P.gate) { const g = P.gate; P.gate = null; g(); }
    syncCtl();
  }

  // ---------- scenarios ----------
  // list: [{ label, setup(), run(ctx) }]
  function scenarios(list, intro) {
    defs = list;
    $('#scen').innerHTML = list.map((d, i) => `<button data-s="${i}">${d.label}</button>`).join('');
    document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => select(+b.dataset.s));
    $('#bRestart').onclick = () => { if (active >= 0) start(active); };
    $('#bPause').onclick = mainButton;
    $('#bStep').onclick = next;
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); mainButton(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });
    select(0, intro);
  }

  // Clicking a step only sets it up (paused). Nothing moves until Start is pressed.
  function select(i, intro) {
    active = i;
    P.run++;
    P.gate = null;
    P.stepOnce = false;
    P.idle = true;
    P.played = false;
    P.paused = false;
    document.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', +b.dataset.s === i));
    reset();
    defs[i].setup();
    const story = $('#story');
    if (story) story.innerHTML = defs[i].story || '';
    say((intro ? intro + ' ' : '') + 'Press <b>&#9654; Start</b> when you are ready.');
    syncCtl();
    tell(i, 'select');
  }
  // lets a page react when a step is selected, started or finished
  function tell(i, state) { document.dispatchEvent(new CustomEvent('net:step', { detail: { i, state } })); }

  async function start(i) {
    active = i;
    document.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', +b.dataset.s === i));
    const ctx = { id: ++P.run };
    P.gate = null;
    P.stepOnce = false;
    P.idle = false;
    P.played = true;
    P.paused = false;
    syncCtl();
    reset();
    defs[i].setup();
    tell(i, 'start');
    try {
      await defs[i].run(ctx);
      P.finished = ctx.id;
      P.idle = true;
      syncCtl();
      tell(i, 'done');
    } catch (e) { if (e !== CANCEL) console.error(e); }
  }

  return { mount, reset, group, node, set, get, flash, link, unlink, linkSet, send, wait, beat, say, bg, check, scenarios, P };
})();
