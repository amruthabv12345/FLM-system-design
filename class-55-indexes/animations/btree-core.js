// Shared B+ tree engine, step-by-step animations and renderer for the class 55 index pages.
const BT = (() => {
  const $ = s => document.querySelector(s);

  // ---------- tree helpers ----------
  let uid = 0;
  const newNode = leaf => ({ id: 'n' + (++uid), leaf, keys: [], rows: [], children: [], next: null });
  const clone = o => JSON.parse(JSON.stringify(o));
  const cmp = (a, b) => {
    if (Array.isArray(a)) {
      for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; }
      return 0;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  };
  const kt = k => Array.isArray(k) ? k.join(' · ') : String(k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const size = n => n.leaf ? n.rows.length : n.keys.length;
  const childIndex = (n, k) => { let i = 0; while (i < n.keys.length && cmp(k, n.keys[i]) >= 0) i++; return i; };
  const countRows = T => Object.values(T.nodes).reduce((s, n) => s + (n.leaf ? n.rows.length : 0), 0);
  function height(T) { let h = 1, n = T.nodes[T.root]; while (!n.leaf) { h++; n = T.nodes[n.children[0]]; } return h; }
  function leftmost(T) { let n = T.nodes[T.root]; while (!n.leaf) n = T.nodes[n.children[0]]; return n; }
  const tok = (text, node, kind) => ({ text: String(text), node, kind: kind || '' });
  const isPri = T => T.kind !== 'secondary';

  // T.keyType: 'num' (id), 'pair' (class, roll_no) or 'str' (name). T.kind: 'primary' or 'secondary'.
  function newTree(M, opts) {
    const T = Object.assign({ nodes: {}, root: null, M, keyType: 'num', kind: 'primary', unique: true }, opts);
    const r = newNode(true);
    T.nodes[r.id] = r;
    T.root = r.id;
    return T;
  }

  function branchMsg(n, i, label, T) {
    const ks = n.keys.map(kt);
    const num = T.keyType === 'num';
    const before = num ? 'is smaller than' : 'comes before';
    const after = num ? 'is equal to or bigger than' : 'is the same as or comes after';
    const az = T.keyType === 'str' ? ' (A to Z)' : '';
    let where;
    if (i === 0) where = 'the <b>left</b> branch';
    else if (i === ks.length) where = 'the <b>right</b> branch';
    else where = n.children.length > 3 ? `branch <b>${i + 1}</b>` : 'the <b>middle</b> branch';
    let s = `Top node [ ${ks.join(' | ')} ]: <b>${label}</b> `;
    if (i === 0) s += `${before} ${ks[0]}${az}`;
    else if (i === ks.length) s += `${after} ${ks[ks.length - 1]}${az}`;
    else s += `is between ${ks[i - 1]} and ${ks[i]}${az}`;
    return s + `, so go down ${where}. The other branches are skipped.`;
  }

  // ---------- animations: each yields frames { tree, msg, hl, rows, token, spawn, stats, fast, error } ----------
  function* insertGen(T, row) {
    const k = row.key, K = kt(k), sub = esc(row.sub);
    const F = (msg, o = {}) => Object.assign({ tree: clone(T), msg }, o);
    const path = [], hl = {};
    let n = T.nodes[T.root];
    yield F(isPri(T)
      ? `Inserting row <b>${K}</b> (${sub}). Every insert starts at the root and finds where this key belongs.`
      : `Adding <b>${K} → ${sub}</b> to the index. It starts at the root, like any insert.`,
      { token: tok(K, n.id), hl: { [n.id]: 'current' } });
    while (!n.leaf) {
      const i = childIndex(n, k);
      yield F(branchMsg(n, i, K, T), { token: tok(K, n.id), hl: Object.assign({}, hl, { [n.id]: 'current' }) });
      hl[n.id] = 'visit';
      path.push({ node: n, i });
      n = T.nodes[n.children[i]];
    }
    if (T.unique && n.rows.some(r => cmp(r.key, k) === 0)) {
      yield F(`Duplicate entry '${K}' for key 'PRIMARY'. A primary key must be unique, so MySQL <b>rejects</b> this row.`,
        { token: tok(K, n.id, 'bad'), hl: Object.assign({}, hl, { [n.id]: 'overflow' }), error: true });
      return false;
    }
    let pos = 0;
    while (pos < n.rows.length && cmp(n.rows[pos].key, k) <= 0) pos++;
    n.rows.splice(pos, 0, clone(row));
    yield F(isPri(T)
      ? `Reached a leaf. The <b>full row</b> (${K}, ${sub}) is stored here, in sorted order.`
      : `Reached a leaf of the index. Only <b>${K} → ${sub}</b> is stored here, <b>not the full row</b>.`,
      { hl: Object.assign({}, hl, { [n.id]: 'current' }), rows: { [n.id + ':' + pos]: 'found' } });

    let child = n;
    while (size(child) > T.M) {
      const leaf = child.leaf;
      yield F(leaf
        ? `This leaf now has <b>${child.rows.length}</b> entries, but the limit is <b>${T.M}</b>. It is too full, so it <b>splits in two</b>.`
        : `This top node now has <b>${child.keys.length}</b> keys, but the limit is <b>${T.M}</b>. It is too full, so it <b>splits too</b>.`,
        { hl: { [child.id]: 'overflow' } });
      const right = newNode(leaf);
      T.nodes[right.id] = right;
      let sep;
      if (leaf) {
        const cut = Math.ceil(child.rows.length / 2);
        right.rows = child.rows.splice(cut);
        right.next = child.next;
        child.next = right.id;
        sep = right.rows[0].key;
      } else {
        const mid = Math.floor(child.keys.length / 2);
        sep = child.keys[mid];
        right.keys = child.keys.splice(mid + 1);
        child.keys.splice(mid, 1);
        right.children = child.children.splice(mid + 1);
      }
      const S = `<b>${kt(sep)}</b>`;
      const up = leaf
        ? `The first key of the new right leaf, ${S}, is <b>copied up</b> so the node above knows where to send future searches.`
        : `The middle key ${S} <b>moves up</b> to the node above.`;
      const pe = path.pop();
      if (!pe) {
        const root = newNode(false);
        root.children = [child.id, right.id];
        T.nodes[root.id] = root;
        T.root = root.id;
        yield F(`Split done. ${up} There is no node above, so a <b>new root</b> is created.`,
          { hl: { [child.id]: 'new', [right.id]: 'new' }, spawn: { [right.id]: child.id }, token: tok(kt(sep), right.id, 'up') });
        root.keys = [sep];
        yield F(`${S} is now in the new root. The tree just grew <b>one level taller</b>. A B+ tree only grows from the top, so every leaf stays at the same depth.`,
          { hl: { [root.id]: 'new' }, token: tok(kt(sep), root.id, 'up') });
        break;
      }
      const p = pe.node;
      p.children.splice(pe.i + 1, 0, right.id);
      yield F(`Split done. ${up}`, { hl: { [child.id]: 'new', [right.id]: 'new' }, spawn: { [right.id]: child.id }, token: tok(kt(sep), right.id, 'up') });
      p.keys.splice(pe.i, 0, sep);
      yield F(`The node above now holds [ ${p.keys.map(kt).join(' | ')} ].`, { hl: { [p.id]: 'new' }, token: tok(kt(sep), p.id, 'up') });
      child = p;
    }
    const h = height(T), c = countRows(T);
    yield F(isPri(T)
      ? `Done. The table has <b>${c}</b> rows and the tree has <b>${h}</b> level${h > 1 ? 's' : ''}.`
      : `Done. The index has <b>${c}</b> entries and <b>${h}</b> level${h > 1 ? 's' : ''}.`);
    return true;
  }

  // Walks from the root to the leaf that holds k. Returns { reads, row }.
  function* searchGen(T, k, o = {}) {
    const K = o.label || kt(k);
    const F = (msg, x = {}) => Object.assign({ tree: clone(T), msg }, x);
    const hl = {};
    let n = T.nodes[T.root], reads = 0;
    for (;;) {
      reads++;
      if (n.leaf) break;
      const i = childIndex(n, k);
      yield F(`Read node ${reads}. ` + branchMsg(n, i, K, T),
        { token: tok(K, n.id), hl: Object.assign({}, hl, { [n.id]: 'current' }), stats: { reads, mode: 'index' } });
      hl[n.id] = 'visit';
      n = T.nodes[n.children[i]];
    }
    const idx = n.rows.findIndex(r => cmp(r.key, k) === 0);
    const row = idx >= 0 ? n.rows[idx] : null;
    const note = o.note === false ? '' : ` Only <b>${reads}</b> node${reads > 1 ? 's' : ''} read. Without the tree, MySQL could have checked up to <b>${countRows(T)}</b> rows.`;
    if (row) {
      yield F(`Read node ${reads}: a leaf. ` + (isPri(T)
        ? `Row found: <b>${kt(k)}, ${esc(row.sub)}</b>.`
        : `Found <b>${kt(k)} → ${esc(row.sub)}</b>.`) + note,
        { token: tok(K, n.id), hl: Object.assign({}, hl, { [n.id]: 'found' }), rows: { [n.id + ':' + idx]: 'found' }, stats: { reads, mode: 'index' } });
    } else {
      yield F(`Read node ${reads}: a leaf. If ${kt(k)} existed, it would be in this leaf. It is not here, so the answer is "no rows". Still only <b>${reads}</b> node${reads > 1 ? 's' : ''} read.`,
        { token: tok(K, n.id, 'bad'), hl: Object.assign({}, hl, { [n.id]: 'current' }), stats: { reads, mode: 'index' }, error: true });
    }
    return { reads, row };
  }

  // Full table scan: walk every leaf left to right and check every row.
  function* scanGen(T, pred, why, what) {
    const F = (msg, o = {}) => Object.assign({ tree: clone(T), msg }, o);
    const rows = {};
    let leaf = leftmost(T), checked = 0, found = 0;
    yield F(`${why} So MySQL starts at the <b>first leaf</b> and checks <b>every row</b>, one by one.`,
      { hl: { [leaf.id]: 'current' }, stats: { checked: 0, mode: 'scan' } });
    while (leaf) {
      for (let i = 0; i < leaf.rows.length; i++) {
        checked++;
        const r = leaf.rows[i], m = pred(r), key = leaf.id + ':' + i;
        rows[key] = 'checking' + (m ? ' match' : '');
        yield F(`Checking row ${kt(r.key)} (${esc(r.sub)})... ${m ? '<b>match</b>' : 'no'}. Rows checked: <b>${checked}</b>`,
          { rows: Object.assign({}, rows), hl: { [leaf.id]: 'current' }, fast: true, stats: { checked, mode: 'scan' } });
        rows[key] = m ? 'found' : 'checked';
        if (m) found++;
      }
      leaf = leaf.next ? T.nodes[leaf.next] : null;
    }
    yield F(`Scan finished. MySQL checked <b>all ${checked}</b> rows to answer ${what}, and found <b>${found}</b>. This is a <b>full table scan</b>: the work grows with every row you add.`,
      { rows: Object.assign({}, rows), stats: { checked, mode: 'scan' } });
  }

  // Composite key (class, roll_no): find all rows of one class using the first column only.
  function* prefixGen(T, c) {
    const k = [c, -Infinity], label = `class ${c}`;
    const F = (msg, o = {}) => Object.assign({ tree: clone(T), msg }, o);
    const hl = {}, rows = {};
    let n = T.nodes[T.root], reads = 0, found = 0;
    yield F(`Rows are sorted by class first, so all <b>class ${c}</b> rows sit <b>next to each other</b>. Use the tree to jump to where class ${c} starts.`,
      { token: tok(label, n.id), hl: { [n.id]: 'current' }, stats: { reads: 0, mode: 'index' } });
    for (;;) {
      reads++;
      if (n.leaf) break;
      const i = childIndex(n, k);
      yield F(`Read node ${reads}. ` + branchMsg(n, i, `the start of class ${c}`, T),
        { token: tok(label, n.id), hl: Object.assign({}, hl, { [n.id]: 'current' }), stats: { reads, mode: 'index' } });
      hl[n.id] = 'visit';
      n = T.nodes[n.children[i]];
    }
    let i = n.rows.findIndex(r => r.key[0] >= c);
    if (i < 0) i = n.rows.length;
    outer:
    for (;;) {
      for (; i < n.rows.length; i++) {
        const r = n.rows[i], key = n.id + ':' + i;
        if (r.key[0] === c) {
          found++;
          rows[key] = 'found';
          yield F(`Row ${kt(r.key)} (${esc(r.sub)}) is in class ${c}: <b>keep it</b>.`,
            { rows: Object.assign({}, rows), hl: Object.assign({}, hl, { [n.id]: 'current' }), token: tok(label, n.id), stats: { reads, mode: 'index' } });
        } else {
          rows[key] = 'checking';
          yield F(`Row ${kt(r.key)} is already class ${r.key[0]}. Since rows are sorted, no more class ${c} rows can come after this, so <b>stop</b>.`,
            { rows: Object.assign({}, rows), hl: Object.assign({}, hl, { [n.id]: 'current' }), token: tok(label, n.id), stats: { reads, mode: 'index' } });
          rows[key] = 'checked';
          break outer;
        }
      }
      if (!n.next) break;
      hl[n.id] = 'visit';
      n = T.nodes[n.next];
      i = 0;
      reads++;
      yield F(`End of this leaf. Class ${c} rows may continue, so follow the <b>link</b> to the next leaf on the right.`,
        { rows: Object.assign({}, rows), hl: Object.assign({}, hl, { [n.id]: 'current' }), token: tok(label, n.id), stats: { reads, mode: 'index' } });
    }
    yield F(`Found <b>${found}</b> row${found === 1 ? '' : 's'} for class ${c} by reading only <b>${reads}</b> nodes, out of ${countRows(T)} rows in the table. The tree still helps because <b>class</b> is the <b>first</b> column of the key.`,
      { rows: Object.assign({}, rows), hl, stats: { reads, mode: 'index' } });
  }

  // Wraps a single-tree generator so its frames target one named view.
  function* inView(gen, name, extra) {
    let r = gen.next();
    while (!r.done) {
      const f = r.value;
      yield Object.assign({ msg: f.msg, error: f.error, fast: f.fast, quick: f.quick, views: { [name]: f } }, extra);
      r = gen.next();
    }
    return r.value;
  }

  // ---------- renderer: one TreeView per tree on screen ----------
  const LH = 124, TOP = 50, GAP = 26;
  const views = new Set();
  let raf = 0, edgesUntil = 0;

  function slotW(T, n) {
    if (T.keyType === 'pair') return n.leaf ? 88 : 70;
    if (T.keyType === 'str') return n.leaf ? 76 : 64;
    return n.leaf ? 66 : 48;
  }

  // Each slot is at least as wide as its longest label, so long keys like "Mumbai · 15" never spill out.
  function nodeW(T, n) {
    const labels = n.leaf ? n.rows.map(r => r.label !== undefined ? String(r.label) : kt(r.key)) : n.keys.map(kt);
    const subs = n.leaf ? n.rows.map(r => String(r.sub)) : [];
    const longest = Math.max(0, ...labels.map(s => s.length * (n.leaf ? 9.5 : 10.5)), ...subs.map(s => s.length * 6.5));
    const slot = Math.max(slotW(T, n), longest + 14);
    const cnt = Math.max(1, labels.length);
    return cnt * slot + (cnt - 1) * 4 + 14;
  }

  function layout(T) {
    const pos = {};
    let x = 0, maxD = 0;
    const place = (id, d) => {
      const n = T.nodes[id];
      maxD = Math.max(maxD, d);
      const w = nodeW(T, n);
      if (n.leaf) { const p = { x, y: TOP + d * LH, w }; x += w + GAP; pos[id] = p; return p; }
      const cs = n.children.map(c => place(c, d + 1));
      const l = cs[0].x, r = cs[cs.length - 1].x + cs[cs.length - 1].w;
      const p = { x: (l + r) / 2 - w / 2, y: TOP + d * LH, w };
      pos[id] = p;
      return p;
    };
    place(T.root, 0);
    let minX = Infinity, maxX = -Infinity;
    for (const id in pos) { minX = Math.min(minX, pos[id].x); maxX = Math.max(maxX, pos[id].x + pos[id].w); }
    for (const id in pos) pos[id].x -= minX;
    return { pos, W: maxX - minX, H: TOP + maxD * LH + 80 };
  }

  class TreeView {
    constructor(stage, o = {}) {
      this.stage = stage;
      this.o = Object.assign({ minH: 420, maxScale: 1.35, rowsLabel: 'Rows', empty: '' }, o);
      const mid = 'ah' + (++uid);
      stage.classList.add('tv');
      if (o.secondary) stage.classList.add('secondary');
      stage.innerHTML = `<div class="tv-stats"></div><div class="tv-empty">${this.o.empty}</div>
        <div class="tv-world"><svg class="tv-edges"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs><g></g></svg><div class="tv-token"></div></div>`;
      this.mid = mid;
      this.world = stage.querySelector('.tv-world');
      this.svg = stage.querySelector('.tv-edges');
      this.eg = this.svg.querySelector('g');
      this.token = stage.querySelector('.tv-token');
      this.statsEl = stage.querySelector('.tv-stats');
      this.emptyEl = stage.querySelector('.tv-empty');
      this.els = {};
      this.vf = null;
      stage.style.height = this.o.minH + 'px';
      views.add(this);
    }

    clear(msg) {
      for (const id in this.els) this.els[id].remove();
      this.els = {};
      this.vf = null;
      this.eg.innerHTML = '';
      this.token.className = 'tv-token';
      this.statsEl.innerHTML = '';
      this.world.style.transform = 'scale(1)';
      this.stage.style.height = this.o.minH + 'px';
      this.emptyEl.innerHTML = msg === undefined ? this.o.empty : msg;
      this.emptyEl.style.display = 'flex';
    }

    nodeHTML(n, f) {
      if (!n.leaf) return n.keys.length ? n.keys.map(k => `<div class="k">${kt(k)}</div>`).join('') : '<div class="empty">...</div>';
      if (!n.rows.length) return '<div class="empty">empty</div>';
      return n.rows.map((r, i) => {
        const c = (f.rows && f.rows[n.id + ':' + i]) || '';
        return `<div class="r ${c}"><b>${r.label !== undefined ? esc(r.label) : kt(r.key)}</b><span>${esc(r.sub)}</span></div>`;
      }).join('');
    }

    render(f) {
      this.vf = f;
      if (!f || !f.tree) { this.clear(); return; }
      this.emptyEl.style.display = 'none';
      const T = f.tree, L = layout(T), world = this.world, els = this.els;
      for (const id in els) {
        if (!L.pos[id]) { const el = els[id]; el.classList.add('gone'); setTimeout(() => el.remove(), 350); delete els[id]; }
      }
      const fresh = [];
      for (const id in L.pos) {
        const n = T.nodes[id];
        let el = els[id];
        if (!el) {
          el = document.createElement('div');
          world.appendChild(el);
          els[id] = el;
          const src = f.spawn && f.spawn[id] && els[f.spawn[id]];
          const p = src ? { x: parseFloat(src.style.left), y: parseFloat(src.style.top), w: parseFloat(src.style.width) } : L.pos[id];
          el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.style.width = p.w + 'px';
          if (!src) fresh.push(el);
        }
        el.className = 'node ' + (n.leaf ? 'leaf' : 'top') + (f.hl && f.hl[id] ? ' ' + f.hl[id] : '');
        el.innerHTML = this.nodeHTML(n, f);
      }
      fresh.forEach(el => el.classList.add('appear'));
      void world.offsetWidth;
      for (const id in L.pos) {
        const p = L.pos[id], el = els[id];
        el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.style.width = p.w + 'px';
      }
      world.style.width = L.W + 'px';
      world.style.height = L.H + 'px';
      this.svg.setAttribute('width', L.W);
      this.svg.setAttribute('height', L.H);
      const sw = this.stage.clientWidth;
      const s = Math.min(this.o.maxScale, (sw - 40) / Math.max(L.W, 1));
      world.style.transform = `scale(${s})`;
      world.style.left = Math.max(20, (sw - L.W * s) / 2) + 'px';
      this.stage.style.height = Math.max(this.o.minH, L.H * s + 40) + 'px';

      if (f.token && L.pos[f.token.node]) {
        const p = L.pos[f.token.node];
        this.token.textContent = f.token.text;
        this.token.className = 'tv-token show ' + f.token.kind;
        this.token.style.left = (p.x + p.w / 2) + 'px';
        this.token.style.top = (p.y - 38) + 'px';
      } else {
        this.token.className = 'tv-token';
      }

      let h = `<span class="pill">${this.o.rowsLabel} <b>${countRows(T)}</b></span><span class="pill">Levels <b>${height(T)}</b></span>`;
      if (f.stats) {
        h += f.stats.mode === 'index'
          ? `<span class="pill hi">Nodes read <b>${f.stats.reads}</b></span>`
          : `<span class="pill lo">Rows checked <b>${f.stats.checked}</b></span>`;
      }
      this.statsEl.innerHTML = h;
    }

    drawEdges() {
      const f = this.vf;
      if (!f || !f.tree) { this.eg.innerHTML = ''; return; }
      const T = f.tree, wr = this.world.getBoundingClientRect(), s = wr.width / (this.world.offsetWidth || 1);
      const rect = id => {
        const el = this.els[id];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: (r.left - wr.left) / s, y: (r.top - wr.top) / s, w: r.width / s, h: r.height / s };
      };
      const on = id => f.hl && ['visit', 'current', 'found'].includes(f.hl[id]);
      let h = '';
      for (const id in this.els) {
        const n = T.nodes[id];
        if (!n) continue;
        const a = rect(id);
        if (!n.leaf) {
          n.children.forEach((c, i) => {
            const b = rect(c);
            if (!b) return;
            const sx = a.x + a.w * (i + 0.5) / n.children.length;
            h += `<line x1="${sx}" y1="${a.y + a.h}" x2="${b.x + b.w / 2}" y2="${b.y}" class="${on(id) && on(c) ? 'on' : ''}"/>`;
          });
        } else if (n.next && this.els[n.next]) {
          const b = rect(n.next), y = a.y + a.h / 2;
          h += `<line x1="${a.x + a.w + 2}" y1="${y}" x2="${b.x - 3}" y2="${y}" class="link" marker-end="url(#${this.mid})"/>`;
        }
      }
      this.eg.innerHTML = h;
    }
  }

  function animateEdges(ms) {
    edgesUntil = performance.now() + ms;
    if (!raf) {
      const loop = () => {
        views.forEach(v => v.drawEdges());
        if (performance.now() < edgesUntil) raf = requestAnimationFrame(loop);
        else { raf = 0; views.forEach(v => v.drawEdges()); }
      };
      raf = requestAnimationFrame(loop);
    }
  }

  // Marks every frame of a generator as quick (plays at a faster pace).
  function* quick(gen) {
    let r = gen.next();
    while (!r.done) { yield Object.assign({}, r.value, { quick: true }); r = gen.next(); }
    return r.value;
  }

  // ---------- player: plays frames { msg, error, fast, quick, views: { name: frame } } ----------
  const P = { views: {}, onFrame: null, turbo: false, busy: false, paused: false, gate: null };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function say(msg, err) { $('#msgText').innerHTML = msg; $('#msg').classList.toggle('err', !!err); }

  function frameDelay(f) {
    let d = (f.fast ? 650 : 1900) / +$('#speed').value;
    if (P.turbo || f.quick) d *= 0.3;
    return d;
  }

  function show(f, instant) {
    const dur = instant ? 0 : Math.min(750, frameDelay(f) * 0.6);
    document.documentElement.style.setProperty('--dur', dur + 'ms');
    for (const name in f.views) P.views[name].render(f.views[name]);
    say(f.msg, f.error);
    animateEdges(dur + 150);
  }

  // Pause / play / next step.
  function syncPause() {
    $('#bPause').innerHTML = P.paused ? '&#9654; Play' : '&#10074;&#10074; Pause';
    $('#bPause').classList.toggle('primary', P.paused);
    $('#bStep').disabled = !(P.paused && P.gate);
  }
  function setPaused(v) {
    P.paused = v;
    if (!v && P.gate) { const g = P.gate; P.gate = null; g(); }
    syncPause();
  }
  function nextStep() {
    if (P.gate) { const g = P.gate; P.gate = null; g(); syncPause(); }
  }

  async function run(gen) {
    let res;
    for (;;) {
      const { value, done } = gen.next();
      if (done) { res = value; break; }
      show(value);
      if (P.onFrame) P.onFrame(value);
      const d = frameDelay(value);
      for (let t = 0; t < d && !P.paused; t += 50) await sleep(50);
      if (P.paused) {
        await new Promise(r => { P.gate = r; syncPause(); });
      }
    }
    return res;
  }

  function setup(o) {
    P.views = o.views;
    P.onFrame = o.onFrame || null;
    $('#bPause').onclick = () => setPaused(!P.paused);
    $('#bStep').onclick = nextStep;
    syncPause();
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ') { e.preventDefault(); setPaused(!P.paused); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextStep(); }
    });
    window.addEventListener('resize', () => {
      document.documentElement.style.setProperty('--dur', '0ms');
      Object.values(P.views).forEach(v => { if (v.vf) v.render(v.vf); });
      animateEdges(50);
    });
  }

  // Field helper for the toolbars.
  const field = (id, label, type, value) =>
    `<label class="in"><span>${label}</span><input id="${id}" type="${type}"${value !== undefined ? ` value="${value}"` : ''} autocomplete="off"></label>`;

  return { newNode, newTree, clone, cmp, kt, esc, countRows, height, leftmost, tok, insertGen, searchGen, scanGen, prefixGen, inView,
    TreeView, P, run, show, say, setup, field, quick };
})();
