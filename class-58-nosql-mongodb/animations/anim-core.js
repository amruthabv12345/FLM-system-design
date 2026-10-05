// Shared engine for the class 58 animations: scenario buttons, narration,
// Start / Pause / Next step, plus views for SQL tables, MongoDB documents and a console.
const A = (() => {
  const $ = s => document.querySelector(s);
  const CANCEL = { cancelled: true };
  const P = { paused: false, stepOnce: false, gate: null, run: 0, idle: true, played: false };
  let defs = [], active = 0;

  const speed = () => +$('#speed').value;
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const since = prev => Math.min(performance.now() - prev, 1000);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- timing ----------
  function check(ctx) { if (ctx.id !== P.run) throw CANCEL; }

  async function wait(ctx, ms) {
    let left = ms, prev = performance.now();
    while (left > 0) {
      check(ctx);
      await tick(30);
      if (!P.paused) left -= since(prev) * speed();
      prev = performance.now();
    }
    check(ctx);
  }

  // A narration pause: waits when playing, or until Next / Play when paused.
  async function beat(ctx, ms = 2600) {
    check(ctx);
    if (P.stepOnce) { P.stepOnce = false; P.paused = true; syncCtl(); }
    let left = ms, prev = performance.now();
    while (left > 0 && !P.paused) {
      await tick(30);
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

  // ---------- controls ----------
  function syncCtl() {
    $('#bPause').innerHTML = P.idle ? (P.played ? '&#8635; Replay' : '&#9654; Start') : P.paused ? '&#9654; Play' : '&#10074;&#10074; Pause';
    $('#bPause').classList.toggle('primary', P.idle || P.paused);
    $('#bStep').disabled = P.idle || !P.paused;
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
  function mainButton() {
    if (P.idle) start(active);
    else setPaused(!P.paused);
  }

  // list: [{ group, label, setup(), run(ctx) }]. Buttons are grouped into rows by `group`.
  function scenarios(list, intro) {
    defs = list;
    const groups = [];
    list.forEach((d, i) => {
      let g = groups.find(x => x.name === (d.group || ''));
      if (!g) { g = { name: d.group || '', items: [] }; groups.push(g); }
      g.items.push(i);
    });
    $('#scen').innerHTML = groups.map(g =>
      `<div class="sg">${g.name ? `<span class="sg-t">${g.name}</span>` : ''}${g.items.map(i => `<button data-s="${i}">${esc(list[i].label)}</button>`).join('')}</div>`).join('');
    document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => start(+b.dataset.s));
    $('#bRestart').onclick = () => start(active);
    $('#bPause').onclick = mainButton;
    $('#bStep').onclick = next;
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); mainButton(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });
    active = 0;
    highlight();
    syncCtl();
    list[0].setup();
    say(intro + ' Press <b>&#9654; Start</b> to play the highlighted one.');
  }

  function highlight() {
    document.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', +b.dataset.s === active));
  }

  async function start(i) {
    active = i;
    highlight();
    const ctx = { id: ++P.run };
    P.gate = null;
    P.stepOnce = false;
    P.idle = false;
    P.played = true;
    P.paused = false;
    syncCtl();
    defs[i].setup();
    try {
      await defs[i].run(ctx);
      P.finished = ctx.id;
      P.idle = true;
      syncCtl();
    } catch (e) { if (e !== CANCEL) console.error(e); }
  }

  // ---------- formatting: always multi-line, quoted keys ----------
  // Values written as 'ObjectId("...")' are printed without quotes, like mongosh does.
  // `lead` is the length of the key in front of the value, so one-line objects never get too wide.
  function fmt(v, ind = 0, lead = 0) {
    const pad = n => ' '.repeat(n);
    if (v === null) return 'null';
    if (typeof v === 'string') return v.startsWith('ObjectId(') ? v : JSON.stringify(v);
    if (typeof v !== 'object') return String(v);
    if (Array.isArray(v)) {
      const flat = '[' + v.map(x => fmt(x)).join(', ') + ']';
      if (v.every(x => typeof x !== 'object' || x === null) && flat.length + ind + lead < 38) return flat;
      if (!v.length) return '[]';
      return '[\n' + v.map(x => pad(ind + 2) + fmt(x, ind + 2)).join(',\n') + '\n' + pad(ind) + ']';
    }
    const keys = Object.keys(v);
    if (!keys.length) return '{}';
    if (ind > 0 && keys.every(k => typeof v[k] !== 'object' || v[k] === null)) {
      const flat = '{ ' + keys.map(k => JSON.stringify(k) + ': ' + fmt(v[k])).join(', ') + ' }';
      if (flat.length + ind + lead < 38) return flat;
    }
    return '{\n' + keys.map(k => pad(ind + 2) + JSON.stringify(k) + ': ' + fmt(v[k], ind + 2, JSON.stringify(k).length + 2)).join(',\n') + '\n' + pad(ind) + '}';
  }

  const lines = (text, test, cls) => text.split('\n').map(l => `<span class="ln ${test && test(l) ? cls : ''}">${esc(l) || ' '}</span>`).join('');

  // ---------- view: a SQL table ----------
  function table(host, name, cols) {
    const el = document.createElement('div');
    el.className = 'tbl';
    host.appendChild(el);
    let rows = [], marks = {}, cells = {};
    const render = () => {
      el.innerHTML = `<div class="tbl-t">${esc(name)}</div><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`
        + rows.map((r, i) => `<tr class="${marks[i] || ''}">${r.map((v, j) => `<td class="${cells[i + ':' + j] || ''}">${esc(v)}</td>`).join('')}</tr>`).join('')
        + '</tbody></table>';
    };
    const t = {
      set(r) { rows = clone(r); marks = {}; cells = {}; render(); return t; },
      mark(i, cls) { marks[i] = cls; render(); },
      cell(i, j, v) { rows[i][j] = v; cells[i + ':' + j] = 'chg'; render(); },
      remove(i) { rows.splice(i, 1); const m = {}; Object.keys(marks).forEach(k => { if (+k < i) m[k] = marks[k]; if (+k > i) m[k - 1] = marks[k]; }); marks = m; render(); },
      find(fn) { return rows.map((r, i) => fn(r) ? i : -1).filter(i => i >= 0); },
      get rows() { return rows; }
    };
    return t;
  }

  // ---------- view: a MongoDB collection ----------
  function docs(host, name, opts = {}) {
    const el = document.createElement('div');
    el.className = 'dc';
    host.appendChild(el);
    let list = [], marks = {}, badges = {}, hl = {};
    const render = () => {
      el.innerHTML = `<div class="dc-t">${esc(name)} <span>${list.length} document${list.length === 1 ? '' : 's'}</span></div><div class="cards${opts.grid ? ' grid' : ''}">`
        + (list.length ? list.map((d, i) => `<div class="doc ${marks[i] || ''}">${badges[i] ? `<span class="badge ${badges[i][1] || ''}">${esc(badges[i][0])}</span>` : ''}<pre>${lines(fmt(d), hl[i] && hl[i][0], hl[i] && hl[i][1])}</pre></div>`).join('')
          : '<div class="empty">empty: no documents yet</div>')
        + '</div>';
    };
    const shift = (obj, i) => { const o = {}; Object.keys(obj).forEach(k => { if (+k < i) o[k] = obj[k]; if (+k > i) o[k - 1] = obj[k]; }); return o; };
    const c = {
      set(l) { list = clone(l); marks = {}; badges = {}; hl = {}; render(); return c; },
      mark(i, cls) { marks[i] = cls; render(); },
      badge(i, text, cls) { badges[i] = [text, cls]; render(); },
      lines(i, test, cls) { hl[i] = [test, cls || 'chg']; render(); },
      replace(i, doc, test) { list[i] = clone(doc); hl[i] = test ? [test, 'chg'] : null; render(); },
      insert(doc) { list.push(clone(doc)); marks[list.length - 1] = 'new'; render(); },
      remove(i) { list.splice(i, 1); marks = shift(marks, i); badges = shift(badges, i); hl = shift(hl, i); render(); },
      get list() { return list; }
    };
    return c;
  }

  // ---------- view: a result box that is built up piece by piece ----------
  function result(host, title) {
    const el = document.createElement('div');
    el.className = 'result';
    host.appendChild(el);
    const c = {
      set(obj, test) { el.innerHTML = `<div class="result-t">${esc(title)}</div><pre>${obj === null ? '<span class="ln">(nothing yet)</span>' : lines(fmt(obj), test, 'chg')}</pre>`; },
    };
    c.set(null);
    return c;
  }

  // ---------- view: a console ----------
  function term(el) {
    const add = (html, cls) => {
      const pre = document.createElement('pre');
      pre.className = cls || '';
      pre.innerHTML = html;
      el.appendChild(pre);
      el.scrollTop = el.scrollHeight;
      return pre;
    };
    return {
      clear() { el.innerHTML = ''; },
      print(text, cls) { add(esc(text), cls); },
      // Types the text out character by character (pauses with the Pause button).
      async type(ctx, prompt, text) {
        const pre = add('');
        let shown = 0, prev = performance.now();
        while (shown < text.length) {
          await tick(30);
          check(ctx);
          const dt = since(prev);
          prev = performance.now();
          if (!P.paused) shown = Math.min(text.length, shown + Math.max(1, Math.round(dt * speed() / 28)));
          pre.innerHTML = `<span class="prompt">${esc(prompt)}</span>${esc(text.slice(0, shown))}<span class="cursor"></span>`;
          el.scrollTop = el.scrollHeight;
        }
        pre.innerHTML = `<span class="prompt">${esc(prompt)}</span>${esc(text)}`;
      }
    };
  }

  // ---------- view: the "bookshelf" — each B+ tree on disk is a book; opening one costs page reads ----------
  function shelf(host, title, names) {
    const el = document.createElement('div');
    el.className = 'shelf';
    host.appendChild(el);
    const pages = names.map(() => 0), on = names.map(() => false);
    const render = () => {
      el.innerHTML = `<div class="shelf-t">${esc(title)}</div><div class="books">`
        + names.map((n, i) => `<div class="book ${on[i] ? 'on' : ''}"><div class="book-n">${esc(n)}</div><div class="book-p">pages read: <b>${pages[i]}</b></div></div>`).join('')
        + '</div>';
    };
    render();
    return {
      open(i, p = 3) { on[i] = true; pages[i] += p; render(); },
      get places() { return pages.filter(p => p > 0).length; },
      get pages() { return pages.reduce((a, b) => a + b, 0); }
    };
  }

  return { P, check, wait, beat, say, scenarios, fmt, esc, clone, table, docs, result, term, shelf };
})();
