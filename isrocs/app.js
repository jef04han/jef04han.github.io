/* ISRO CS prep — three modules (mind map, quiz, study) over static data files.
   Data files call ISRO.addQ / ISRO.addPYQ / ISRO.setMindmap / ISRO.addNotes before ISRO.start(). */
(function () {
  'use strict';

  var EXAM_DATE = new Date('2026-10-29T09:00:00+05:30');
  var TOTAL_TARGET = 1000;

  var SUBJECTS = [
    ['ds', 'Data Structures'],
    ['algo', 'Algorithms'],
    ['math', 'Discrete & Engg Maths'],
    ['toc', 'Theory of Computation'],
    ['cd', 'Compiler Design'],
    ['os', 'Operating Systems'],
    ['cn', 'Computer Networks'],
    ['dbms', 'DBMS'],
    ['coa', 'Computer Organization'],
    ['dl', 'Digital Logic'],
    ['prog', 'Programming & OOP'],
    ['se', 'Software Engineering'],
    ['sec', 'Information Security'],
    ['ai', 'AI & ML'],
    ['cloud', 'Cloud, Big Data & Virtualization'],
    ['apt', 'Aptitude & Reasoning']
  ];
  var SUBJ = {};
  SUBJECTS.forEach(function (s, i) { SUBJ[s[0]] = { key: s[0], name: s[1], hue: Math.round(i * 360 / SUBJECTS.length) }; });

  var QS = [];          // {id, s, q, o, a, e, src}
  var QBYID = {};
  var perSubjCount = {};
  var MINDMAP = '';
  var NOTES = [];       // {key, title, md}

  /* ---------- storage ---------- */
  function load(k, d) { try { var v = localStorage.getItem('isrocs.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('isrocs.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }

  /* ---------- data API ---------- */
  function pushQ(s, item, src, id) {
    var q = { id: id, s: s, q: item[0], o: item[1], a: item[2], e: item[3] || '', src: src || '' };
    if (QBYID[id]) { console.warn('duplicate id', id); return; }
    QBYID[id] = q; QS.push(q);
  }
  // Options in the bank are authored with the answer wherever it fell; a per-id seeded shuffle keeps
  // the order stable across visits without letting "it's usually (b)" become a strategy.
  // Options that refer to their siblings ("All of the above", "Both", "(a)") keep their authored order.
  var POSITIONAL = /\babove\b|\bboth\b|\bnone\b|\bneither\b|\ball four\b|\(a\)|\(b\)/i;
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  function shuffled(item, id) {
    if (item[1].some(function (o) { return POSITIONAL.test(o); }) || /\([a-d]\)/.test(item[3] || '')) return item;
    var rnd = seeded(id), idx = [0, 1, 2, 3].slice(0, item[1].length);
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return [item[0], idx.map(function (k) { return item[1][k]; }), idx.indexOf(item[2]), item[3]];
  }
  function addQ(s, list) {
    if (!SUBJ[s]) { console.warn('unknown subject', s); return; }
    list.forEach(function (item) {
      perSubjCount[s] = (perSubjCount[s] || 0) + 1;
      var id = s + '-' + perSubjCount[s];
      pushQ(s, shuffled(item, id), '', id);
    });
  }
  // PYQ rows: [year, qno, subject, question, options, answerIndex, explanation]
  function addPYQ(list) {
    list.forEach(function (r) {
      pushQ(r[2], [r[3], r[4], r[5], r[6]], 'ISRO ' + r[0] + ' · Q' + r[1], 'p' + r[0] + '-' + r[1]);
    });
  }

  /* ---------- formatting ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inline(s) {
    var codes = [];
    s = esc(s).replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\[\[([^\]]+)\]\]/g, '<mark>$1</mark>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return '<code>' + codes[+i] + '</code>'; });
  }
  // Question / explanation text: inline formatting + ```code``` blocks + newlines.
  function fmt(s) {
    return String(s).split('```').map(function (part, i) {
      if (i % 2) return '<pre>' + esc(part.replace(/^\n|\n$/g, '')) + '</pre>';
      return inline(part).replace(/\n/g, '<br>');
    }).join('');
  }
  // Tiny markdown for study notes: #, ##, ###, -, 1., |tables|, > tip, ``` blocks, paragraphs.
  // A "?? text" line explains the block (or table row) just above it in beginner terms; it renders as
  // a small ? button that reveals the explanation.
  var whyN = 0;
  function isWhy(line) { return /^\?\?\s/.test(line.trim()); }
  function whyText(line) { return line.trim().replace(/^\?\?\s/, ''); }
  function whyBtn(id) { return ' <button class="why" data-why="' + id + '" aria-label="Explain in simple words" title="Explain in simple words">?</button>'; }
  function whyBox(id, text) { return '<div class="why-box" id="why-' + id + '" hidden><b>In simple words:</b> ' + inline(text) + '</div>'; }
  function md(text) {
    var lines = text.replace(/\r/g, '').split('\n');
    var out = [], i = 0, para = [];
    function flush(why) {
      if (!para.length) return;
      var id = why ? ++whyN : 0;
      out.push('<p>' + inline(para.join(' ')) + (why ? whyBtn(id) : '') + '</p>' + (why ? whyBox(id, why) : ''));
      para = [];
    }
    // Explanation lines directly after a tip/table/paragraph attach to that block.
    function takeWhy() { return i < lines.length && isWhy(lines[i]) ? whyText(lines[i++]) : null; }
    while (i < lines.length) {
      var l = lines[i], t = l.trim(), m;
      if (t.indexOf('```') === 0) {
        flush(); var buf = []; i++;
        while (i < lines.length && lines[i].trim().indexOf('```') !== 0) buf.push(lines[i++]);
        out.push('<pre>' + esc(buf.join('\n')) + '</pre>'); i++; continue;
      }
      if (!t) { flush(); i++; continue; }
      if (isWhy(t)) { i++; flush(whyText(t)); continue; }
      if ((m = t.match(/^(#{1,3})\s+(.*)$/))) {
        flush(); var lv = m[1].length + 1;
        out.push('<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'); i++; continue;
      }
      if (t[0] === '|') {
        flush(); var rows = [];
        while (i < lines.length && (lines[i].trim()[0] === '|' || isWhy(lines[i]))) {
          if (isWhy(lines[i])) { if (rows.length) rows[rows.length - 1].why = whyText(lines[i]); }
          else rows.push({ r: lines[i].trim() });
          i++;
        }
        var html = '<div class="tbl"><table>', tableWhy = '';
        rows.forEach(function (row, ri) {
          if (/^\|[\s:|-]+\|$/.test(row.r)) return;
          var cells = row.r.replace(/^\||\|$/g, '').split('|');
          var tag = ri === 0 ? 'th' : 'td', id = row.why ? ++whyN : 0;
          html += '<tr>' + cells.map(function (c, ci) {
            return '<' + tag + '>' + inline(c.trim()) + (id && ci === cells.length - 1 ? whyBtn(id) : '') + '</' + tag + '>';
          }).join('') + '</tr>';
          if (!id) return;
          if (ri === 0) tableWhy = whyBox(id, row.why);
          else html += '<tr class="why-row" id="why-' + id + '" hidden><td colspan="' + cells.length + '"><div class="why-box"><b>In simple words:</b> ' + inline(row.why) + '</div></td></tr>';
        });
        out.push(html + '</table></div>' + tableWhy); continue;
      }
      if (t[0] === '>') {
        flush(); var tip = [];
        while (i < lines.length && lines[i].trim()[0] === '>') { tip.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        var tw = takeWhy(), tid = tw ? ++whyN : 0;
        out.push('<div class="tip">' + inline(tip.join(' ')) + (tw ? whyBtn(tid) + whyBox(tid, tw) : '') + '</div>'); continue;
      }
      if (/^([-*]|\d+\.)\s/.test(t)) {
        flush(); var ordered = /^\d+\./.test(t), items = [];
        while (i < lines.length && (/^\s*([-*]|\d+\.)\s/.test(lines[i]) || isWhy(lines[i]))) {
          if (isWhy(lines[i])) { if (items.length) items[items.length - 1][2] = whyText(lines[i]); i++; continue; }
          var depth = lines[i].match(/^\s*/)[0].length >= 2 ? 1 : 0;
          items.push([depth, lines[i].trim().replace(/^([-*]|\d+\.)\s/, ''), null]); i++;
        }
        var h = '', open = 0, tag = ordered ? 'ol' : 'ul';
        items.forEach(function (it) {
          if (it[0] > open) { h = h.replace(/<\/li>$/, ''); h += '<ul>'; open = 1; }
          else if (it[0] < open) { h += '</ul></li>'; open = 0; }
          var id = it[2] ? ++whyN : 0;
          h += '<li>' + inline(it[1]) + (id ? whyBtn(id) + whyBox(id, it[2]) : '') + '</li>';
        });
        if (open) h += '</ul></li>';
        out.push('<' + tag + '>' + h + '</' + tag + '>'); continue;
      }
      para.push(t); i++;
    }
    flush();
    return out.join('\n');
  }

  /* ---------- shell ---------- */
  var view, toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }
  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (html != null) el.innerHTML = html;
    return el;
  }
  function countdown() {
    var el = document.getElementById('countdown');
    var ms = EXAM_DATE - new Date();
    if (ms <= 0) { el.textContent = 'Exam day — all the best!'; return; }
    var d = Math.floor(ms / 864e5), hr = Math.floor(ms % 864e5 / 36e5);
    el.textContent = 'Exam 29 Oct · ' + d + 'd ' + hr + 'h left';
  }

  function route() {
    var hash = (location.hash || '#quiz').slice(1).split('/');
    var tab = ['map', 'quiz', 'study'].indexOf(hash[0]) >= 0 ? hash[0] : 'quiz';
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      b.setAttribute('aria-selected', b.getAttribute('data-tab') === tab);
    });
    save('tab', tab);
    view.innerHTML = '';
    if (tab === 'map') MindMap.render(hash[1]);
    else if (tab === 'quiz') Quiz.render(hash[1]);
    else Study.render(hash[1]);
    window.scrollTo(0, 0);
  }

  /* =====================================================================
     MODULE 1 — MIND MAP
     ===================================================================== */
  var MindMap = (function () {
    var tree = null, mastered = load('mastered', {}), open = load('mmopen', {});
    var mode = load('mmmode', window.innerWidth < 760 ? 'outline' : 'map');
    var focus = 'all', query = '';

    function parse() {
      var root = { t: 'ISRO CS', id: 'root', c: [], depth: -1 };
      var stack = [root];
      MINDMAP.replace(/\r/g, '').split('\n').forEach(function (line) {
        if (!line.trim() || line.trim()[0] === '#') return;
        var depth = Math.floor(line.match(/^ */)[0].length / 2);
        var body = line.trim(), note = '';
        var k = body.indexOf('::');
        if (k >= 0) { note = body.slice(k + 2).trim(); body = body.slice(0, k).trim(); }
        var key = null, m = body.match(/^\[(\w+)\]\s*(.*)$/);
        if (m) { key = m[1]; body = m[2]; }
        while (stack.length > depth + 1) stack.pop();
        var parent = stack[stack.length - 1];
        var node = { t: body, n: note, c: [], depth: depth, key: key || parent.key };
        node.id = (parent.id === 'root' ? '' : parent.id + '>') + body;
        parent.c.push(node);
        stack.push(node);
      });
      return root;
    }
    function leaves(n, acc) { acc = acc || []; if (!n.c.length) acc.push(n); else n.c.forEach(function (c) { leaves(c, acc); }); return acc; }
    function matches(n) {
      if (!query) return true;
      var hay = (n.t + ' ' + n.n).toLowerCase();
      if (hay.indexOf(query) >= 0) return true;
      return n.c.some(matches);
    }
    function isOpen(n) { return query ? true : !!open[n.id]; }

    function nodeHTML(n) {
      var hasKids = n.c.length > 0;
      var cls = 'mm-node d' + Math.min(n.depth, 3) + (hasKids ? ' has-kids' : ' leaf') + (hasKids && isOpen(n) ? ' open' : '');
      if (!hasKids && mastered[n.id]) cls += ' done';
      if (query && (n.t + ' ' + n.n).toLowerCase().indexOf(query) >= 0) cls += ' hit';
      var style = SUBJ[n.key] ? ' style="--h:' + SUBJ[n.key].hue + '"' : '';
      var count = '';
      if (hasKids) {
        var lv = leaves(n), dn = lv.filter(function (x) { return mastered[x.id]; }).length;
        count = '<span class="mm-count">' + dn + '/' + lv.length + '</span>';
      }
      var check = hasKids ? '' : '<span class="mm-check" data-check="' + esc(n.id) + '" title="Mark mastered"></span>';
      return '<div class="' + cls + '" data-id="' + esc(n.id) + '"' + style + '>' +
        '<div class="mm-t">' + check + '<span>' + inline(n.t) + '</span>' + count + (hasKids ? '<span class="mm-caret"></span>' : '') + '</div>' +
        (n.n ? '<div class="mm-n">' + inline(n.n) + '</div>' : '') + '</div>';
    }
    function branch(n) {
      if (!matches(n)) return '';
      var kids = n.c.length && isOpen(n) ? '<ul>' + n.c.map(function (c) { return branch(c); }).join('') + '</ul>' : '';
      return '<li>' + nodeHTML(n) + kids + '</li>';
    }

    function render(sub) {
      if (!tree) tree = parse();
      focus = sub && (SUBJ[sub] || sub === 'all') ? sub : load('mmfocus', 'all');
      save('mmfocus', focus);
      var all = leaves(tree), done = all.filter(function (x) { return mastered[x.id]; }).length;
      var wrap = h('section', { class: 'module' });
      var chips = '<button class="chip' + (focus === 'all' ? ' on' : '') + '" data-focus="all">All topics</button>' +
        tree.c.map(function (b) {
          return '<button class="chip' + (focus === b.key ? ' on' : '') + '" data-focus="' + b.key + '" style="--h:' + (SUBJ[b.key] ? SUBJ[b.key].hue : 0) + '">' + esc(b.t) + '</button>';
        }).join('');
      wrap.innerHTML =
        '<div class="mod-head"><div><h1>Mind Map</h1><p class="muted">Every topic the paper can touch — tap a branch to open it, tick a leaf once you can explain it without notes.</p></div>' +
        '<div class="stat"><b id="mmdone">' + done + '</b><span>/ ' + all.length + ' mastered</span></div></div>' +
        '<div class="bar"><i id="mmbar" style="width:' + (100 * done / all.length).toFixed(1) + '%"></i></div>' +
        '<div class="toolbar">' +
        '<input type="search" id="mmq" placeholder="Search topics (e.g. paging, BCNF, RSA)…" value="' + esc(query) + '">' +
        '<div class="seg"><button data-mode="map" class="' + (mode === 'map' ? 'on' : '') + '">Map</button><button data-mode="outline" class="' + (mode === 'outline' ? 'on' : '') + '">Outline</button></div>' +
        '<button class="btn ghost" id="mmexp">Expand all</button><button class="btn ghost" id="mmcol">Collapse</button></div>' +
        '<div class="chips">' + chips + '</div>' +
        '<div id="mmbox"></div>';
      view.appendChild(wrap);
      draw();

      wrap.querySelector('#mmq').addEventListener('input', function (e) { query = e.target.value.trim().toLowerCase(); draw(); });
      wrap.querySelectorAll('[data-mode]').forEach(function (b) {
        b.onclick = function () { mode = b.getAttribute('data-mode'); save('mmmode', mode); route(); };
      });
      var on = wrap.querySelector('.chip.on');
      if (on && on.scrollIntoView && window.innerWidth <= 560) on.scrollIntoView({ block: 'nearest', inline: 'center' });
      wrap.querySelectorAll('[data-focus]').forEach(function (b) {
        b.onclick = function () { location.hash = '#map/' + b.getAttribute('data-focus'); };
      });
      wrap.querySelector('#mmexp').onclick = function () { setAll(true); };
      wrap.querySelector('#mmcol').onclick = function () { setAll(false); };
    }
    function focused() { return tree.c.filter(function (b) { return b.key === focus; })[0]; }
    // Nodes drawn under the root: every subject, or the focused subject's own topics.
    function scope() { var b = focused(); return b ? b.c : tree.c; }
    function setAll(v) {
      (function walk(n) { if (n.c.length) { if (v) open[n.id] = true; else delete open[n.id]; n.c.forEach(walk); } })({ c: scope(), id: '_' });
      save('mmopen', open); draw();
    }
    function draw() {
      var box = document.getElementById('mmbox');
      var sc = box.querySelector('.mm-scroll'), pos = sc ? [sc.scrollLeft, sc.scrollTop] : null;
      var html = scope().map(branch).join('');
      if (!html) { box.innerHTML = '<p class="empty">No topic matches “' + esc(query) + '”.</p>'; return; }
      if (mode === 'map') {
        box.className = 'mm-map';
        var fb = focused();
        box.innerHTML = '<div class="mm-scroll"><ul class="mm-tree"><li><div class="mm-node root"><div class="mm-t"><span>' +
          (fb ? esc(fb.t) : 'ISRO CS 2026') + '</span></div></div><ul>' + html + '</ul></li></ul></div>';
      } else {
        box.className = 'mm-outline';
        box.innerHTML = '<ul class="mm-tree">' + html + '</ul>';
      }
      sc = box.querySelector('.mm-scroll');
      if (sc && pos) { sc.scrollLeft = pos[0]; sc.scrollTop = pos[1]; }
      var all = leaves(tree), done = all.filter(function (x) { return mastered[x.id]; }).length;
      document.getElementById('mmdone').textContent = done;
      document.getElementById('mmbar').style.width = (100 * done / all.length).toFixed(1) + '%';
      box.onclick = function (e) {
        var chk = e.target.closest('[data-check]');
        if (chk) {
          var id = chk.getAttribute('data-check');
          if (mastered[id]) delete mastered[id]; else mastered[id] = 1;
          save('mastered', mastered); draw(); return;
        }
        var node = e.target.closest('.mm-node.has-kids');
        if (node && !query) {
          var nid = node.getAttribute('data-id');
          if (open[nid]) delete open[nid]; else open[nid] = true;
          save('mmopen', open); draw();
        }
      };
    }
    return { render: render, count: function () { if (!tree) tree = parse(); return leaves(tree).length; } };
  })();

  /* =====================================================================
     MODULE 2 — QUIZ
     ===================================================================== */
  var Quiz = (function () {
    var st = load('quiz', { ans: {}, cur: null, filter: 'all', mode: 'new', stars: {} });
    st.ans = st.ans || {}; st.stars = st.stars || {};
    var picked = null; // choice for the current (review-mode) question

    function persist() { save('quiz', st); }
    function inFilter(q) {
      var f = st.filter;
      if (f === 'all') return true;
      if (f === 'pyq') return !!q.src;
      return q.s === f;
    }
    function pool() {
      return QS.filter(function (q) {
        if (!inFilter(q)) return false;
        var a = st.ans[q.id];
        if (st.mode === 'new') return !a;
        if (st.mode === 'wrong') return a && !a.ok;
        if (st.mode === 'starred') return !!st.stars[q.id];
        return true;
      });
    }
    function next() {
      // "fresh" lets the just-answered card survive a re-render; drop it when moving on.
      Object.keys(st.ans).forEach(function (k) { delete st.ans[k].fresh; });
      var p = pool();
      picked = null;
      if (st.mode !== 'new' && p.length > 1) p = p.filter(function (q) { return q.id !== st.cur; });
      st.cur = p.length ? p[Math.floor(Math.random() * p.length)].id : null;
      persist();
    }
    function stats() {
      var ans = 0, ok = 0;
      QS.forEach(function (q) { var a = st.ans[q.id]; if (a) { ans++; if (a.ok) ok++; } });
      return { ans: ans, ok: ok, bad: ans - ok };
    }

    function render() {
      var cur = QBYID[st.cur];
      var valid = cur && inFilter(cur) && (st.mode !== 'new' || !st.ans[cur.id] || st.ans[cur.id].fresh);
      if (st.mode === 'wrong' && cur && !(st.ans[cur.id] && !st.ans[cur.id].ok) && !picked) valid = false;
      if (st.mode === 'starred' && cur && !st.stars[cur.id]) valid = false;
      if (!valid) { next(); cur = QBYID[st.cur]; }

      var s = stats(), total = QS.length;
      var wrap = h('section', { class: 'module' });
      var opts = '<option value="all">All subjects</option><option value="pyq">Past papers only (2023 + 2025)</option>' +
        SUBJECTS.map(function (x) {
          var n = QS.filter(function (q) { return q.s === x[0]; }).length;
          var d = QS.filter(function (q) { return q.s === x[0] && st.ans[q.id]; }).length;
          return '<option value="' + x[0] + '">' + esc(x[1]) + ' (' + d + '/' + n + ')</option>';
        }).join('');
      var net = s.ok - s.bad / 3;
      wrap.innerHTML =
        '<div class="mod-head"><div><h1>Quiz</h1><p class="muted">Random order, every question once. Answered ones drop into the bucket.</p></div>' +
        '<div class="stat big"><b>' + s.ans + '</b><span>/ ' + total + ' answered</span></div></div>' +
        '<div class="bar"><i style="width:' + (100 * s.ans / total).toFixed(2) + '%"></i></div>' +
        '<div class="kpis"><div><b class="ok">' + s.ok + '</b><span>correct</span></div><div><b class="bad">' + s.bad + '</b><span>wrong</span></div>' +
        '<div><b>' + (s.ans ? Math.round(100 * s.ok / s.ans) : 0) + '%</b><span>accuracy</span></div>' +
        '<div><b>' + net.toFixed(1) + '</b><span>net (+1 / −⅓)</span></div></div>' +
        '<div class="toolbar"><select id="qf">' + opts + '</select>' +
        '<div class="seg"><button data-m="new">New</button><button data-m="wrong">Wrong (' + s.bad + ')</button><button data-m="starred">★ ' + Object.keys(st.stars).length + '</button></div></div>' +
        '<div id="qcard"></div>' +
        '<details class="breakdown"><summary>Subject-wise progress</summary><div id="qbd"></div>' +
        '<button class="btn danger" id="qreset">Reset all quiz progress</button></details>';
      view.appendChild(wrap);
      wrap.querySelector('#qf').value = st.filter;
      wrap.querySelectorAll('[data-m]').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-m') === st.mode);
        b.onclick = function () { st.mode = b.getAttribute('data-m'); next(); route(); };
      });
      wrap.querySelector('#qf').onchange = function (e) { st.filter = e.target.value; next(); route(); };
      wrap.querySelector('#qreset').onclick = function () {
        if (confirm('Clear all ' + s.ans + ' answered questions and start the 1000 again?')) {
          st.ans = {}; st.cur = null; next(); route(); toast('Quiz progress reset');
        }
      };
      wrap.querySelector('#qbd').innerHTML = SUBJECTS.map(function (x) {
        var qs = QS.filter(function (q) { return q.s === x[0]; });
        var d = 0, ok = 0; qs.forEach(function (q) { var a = st.ans[q.id]; if (a) { d++; if (a.ok) ok++; } });
        return '<div class="bd-row" style="--h:' + SUBJ[x[0]].hue + '"><span>' + esc(x[1]) + '</span><span class="bd-bar"><i style="width:' + (qs.length ? 100 * d / qs.length : 0) + '%"></i></span>' +
          '<span class="bd-n">' + d + '/' + qs.length + (d ? ' · ' + Math.round(100 * ok / d) + '%' : '') + '</span></div>';
      }).join('');
      card();
    }

    function card() {
      var box = document.getElementById('qcard');
      var q = QBYID[st.cur];
      if (!q) {
        var msg = st.mode === 'new' ? 'Every question in this set is answered. 🎉 Switch subject, review your wrong ones, or reset.' :
          st.mode === 'wrong' ? 'No wrong answers to review here.' : 'No starred questions yet — tap ☆ on a question to save it.';
        box.innerHTML = '<div class="card empty">' + msg + '</div>'; return;
      }
      var a = st.ans[q.id];
      var chosen = st.mode === 'new' ? (a ? a.c : null) : picked;
      var answered = chosen !== null && chosen !== undefined;
      var subj = SUBJ[q.s];
      var html = '<div class="card qcard" style="--h:' + subj.hue + '">' +
        '<div class="qmeta"><span class="tag">' + esc(subj.name) + '</span>' + (q.src ? '<span class="tag pyq">' + esc(q.src) + '</span>' : '') +
        (st.mode !== 'new' && a ? '<span class="tag ' + (a.ok ? 'okt' : 'badt') + '">first try: ' + (a.ok ? 'correct' : 'wrong') + '</span>' : '') +
        '<button class="star' + (st.stars[q.id] ? ' on' : '') + '" id="qstar" title="Star for revision">' + (st.stars[q.id] ? '★' : '☆') + '</button></div>' +
        '<div class="qtext">' + fmt(q.q) + '</div><div class="opts">' +
        q.o.map(function (o, i) {
          var cls = 'opt';
          if (answered) { if (i === q.a) cls += ' right'; else if (i === chosen) cls += ' wrong'; else cls += ' dim'; }
          return '<button class="' + cls + '" data-i="' + i + '"' + (answered ? ' disabled' : '') + '><span class="ol">' + 'abcd'[i] + '</span><span>' + fmt(o) + '</span></button>';
        }).join('') + '</div>';
      if (answered) {
        var ok = chosen === q.a;
        html += '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ Correct' : '✗ Wrong — answer is (' + 'abcd'[q.a] + ')') + '</div>' +
          (q.e ? '<div class="expl">' + fmt(q.e) + '</div>' : '');
      }
      html += '<div class="qnav">' + (answered ? '' : '<button class="btn ghost" id="qskip">Skip</button>') +
        '<button class="btn primary" id="qnext"' + (answered ? '' : ' disabled') + '>Next question →</button></div>' +
        '<p class="hint">Keys: 1–4 / a–d to answer · Enter or → for next</p></div>';
      box.innerHTML = html;
      box.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { choose(+b.getAttribute('data-i')); }; });
      var nb = box.querySelector('#qnext'); if (nb) nb.onclick = function () { next(); route(); };
      var sb = box.querySelector('#qskip'); if (sb) sb.onclick = function () { next(); route(); };
      box.querySelector('#qstar').onclick = function () {
        if (st.stars[q.id]) delete st.stars[q.id]; else st.stars[q.id] = 1;
        persist(); card();
      };
    }
    function choose(i) {
      var q = QBYID[st.cur];
      if (!q) return;
      if (st.mode === 'new') {
        if (st.ans[q.id]) return;
        st.ans[q.id] = { c: i, ok: i === q.a, t: Date.now(), fresh: 1 };
      } else {
        if (picked !== null) return;
        picked = i;
      }
      persist();
      var keep = window.scrollY; route(); window.scrollTo(0, keep);
    }
    document.addEventListener('keydown', function (e) {
      if (!document.querySelector('.qcard') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      var k = e.key.toLowerCase(), idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
      var q = QBYID[st.cur];
      if (idx >= 0 && k.length === 1 && q && idx < q.o.length) { choose(idx); e.preventDefault(); }
      else if ((k === 'enter' || k === 'arrowright') && document.querySelector('#qnext:not([disabled])')) { next(); route(); e.preventDefault(); }
    });

    return { render: render };
  })();

  /* =====================================================================
     MODULE 3 — STUDY
     ===================================================================== */
  var Study = (function () {
    var read = load('read', {});
    var q = '';
    function list() {
      return NOTES.concat([{ key: 'pyq23', title: 'Past paper 2023 (solved)' }, { key: 'pyq25', title: 'Past paper 2025 (solved)' }]);
    }
    function render(key) {
      var items = list();
      if (!key || !items.some(function (n) { return n.key === key; })) key = load('studykey', items[0].key);
      save('studykey', key);
      var wrap = h('section', { class: 'module study' });
      var doneN = NOTES.filter(function (n) { return read[n.key]; }).length;
      wrap.innerHTML =
        '<div class="mod-head"><div><h1>Study</h1><p class="muted">Concise exam notes for every subject, plus both past papers fully solved. Tap the ? after any line to have it explained in simple words.</p></div>' +
        '<div class="stat"><b>' + doneN + '</b><span>/ ' + NOTES.length + ' chapters revised</span></div></div>' +
        '<input type="search" id="sq" placeholder="Search all notes…" value="' + esc(q) + '">' +
        '<div class="study-grid"><nav class="toc" id="toc"></nav><article class="notes card" id="notes"></article></div>';
      view.appendChild(wrap);
      var toc = wrap.querySelector('#toc');
      toc.innerHTML = items.map(function (n) {
        var hue = SUBJ[n.key] ? SUBJ[n.key].hue : 210;
        return '<a href="#study/' + n.key + '" class="' + (n.key === key ? 'on' : '') + (read[n.key] ? ' read' : '') + '" style="--h:' + hue + '">' + esc(n.title) + '</a>';
      }).join('');
      var cur = toc.querySelector('a.on');
      if (cur && cur.scrollIntoView && window.innerWidth <= 820) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
      var input = wrap.querySelector('#sq');
      input.addEventListener('input', function () { q = input.value.trim(); show(key); });
      wrap.addEventListener('click', function (e) {
        var w = e.target.closest('.why');
        if (w) {
          var ex = document.getElementById('why-' + w.getAttribute('data-why'));
          ex.hidden = !ex.hidden; w.classList.toggle('on', !ex.hidden); return;
        }
        var a = e.target.closest('a.hit, .toc a');
        if (!a) return;
        q = '';
        if (a.getAttribute('href') === location.hash) { e.preventDefault(); route(); }
      });
      show(key);
    }
    function show(key) {
      var box = document.getElementById('notes');
      if (q.length >= 2) { box.innerHTML = search(q); return; }
      if (key === 'pyq23' || key === 'pyq25') { box.innerHTML = paper(key.slice(3)); return; }
      var n = NOTES.filter(function (x) { return x.key === key; })[0];
      var subjQ = QS.filter(function (x) { return x.s === key; }).length;
      box.innerHTML = '<div class="notes-head"><h1>' + esc(n.title) + '</h1>' +
        '<label class="readbox"><input type="checkbox" id="rd"' + (read[key] ? ' checked' : '') + '> Revised</label></div>' +
        md(n.md) +
        (SUBJ[key] ? '<div class="notes-foot"><a class="btn ghost" href="#map/' + key + '">Open in mind map</a>' +
          (subjQ ? '<button class="btn primary" id="practice">Practice ' + subjQ + ' questions →</button>' : '') + '</div>' : '');
      var rd = box.querySelector('#rd');
      if (rd) rd.onchange = function () { if (rd.checked) read[key] = 1; else delete read[key]; save('read', read); route(); };
      var pb = box.querySelector('#practice');
      if (pb) pb.onclick = function () {
        var st = load('quiz', {}); st.filter = key; st.mode = 'new'; st.cur = null; save('quiz', st); location.hash = '#quiz';
      };
    }
    function paper(yr) {
      var qs = QS.filter(function (x) { return x.id.indexOf('p' + yr + '-') === 0; })
        .sort(function (a, b) { return +a.id.split('-')[1] - +b.id.split('-')[1]; });
      return '<div class="notes-head"><h1>ISRO 20' + yr + ' — solved</h1></div>' +
        '<p class="muted">' + qs.length + ' questions reproduced (figure-only items left out). Tap “Show answer” to self-test. ' +
        'The same questions are in the quiz under “Past papers only”.</p>' +
        qs.map(function (x) {
          return '<div class="pq"><div class="qmeta"><span class="tag">Q' + x.id.split('-')[1] + '</span><span class="tag" style="--h:' + SUBJ[x.s].hue + '">' + esc(SUBJ[x.s].name) + '</span></div>' +
            '<div class="qtext">' + fmt(x.q) + '</div><ol type="a" class="pq-o">' +
            x.o.map(function (o) { return '<li>' + fmt(o) + '</li>'; }).join('') + '</ol>' +
            '<details><summary>Show answer</summary><p><b>(' + 'abcd'[x.a] + ') ' + fmt(x.o[x.a]) + '</b></p>' + (x.e ? '<div class="expl">' + fmt(x.e) + '</div>' : '') + '</details></div>';
        }).join('');
    }
    function search(term) {
      var t = term.toLowerCase(), out = [];
      NOTES.forEach(function (n) {
        var section = n.title;
        n.md.split('\n').forEach(function (line) {
          var m = line.match(/^#{1,3}\s+(.*)/);
          if (m) { section = m[1]; return; }
          if (line.toLowerCase().indexOf(t) >= 0 && out.length < 120) {
            var simple = isWhy(line);
            var safe = (simple ? '<i>In simple words:</i> ' : '') +
              inline((simple ? whyText(line) : line).replace(/^\s*([-*]|\d+\.|>|\|)\s*/, '').replace(/\|/g, ' · '));
            var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
            safe = ('>' + safe + '<').replace(/>([^<]*)</g, function (_, txt) { return '>' + txt.replace(re, '<mark>$1</mark>') + '<'; }).slice(1, -1);
            out.push('<a class="hit" href="#study/' + n.key + '"><small>' + esc(n.title) + ' › ' + esc(section) + '</small><div>' + safe + '</div></a>');
          }
        });
      });
      return '<div class="notes-head"><h1>Search: “' + esc(term) + '”</h1></div>' +
        (out.length ? out.join('') : '<p class="empty">Nothing in the notes mentions that. Try the mind-map search too.</p>');
    }
    return { render: render };
  })();

  /* ---------- boot ---------- */
  function start() {
    view = document.getElementById('view');
    document.querySelectorAll('.tab').forEach(function (b) {
      b.onclick = function () { location.hash = '#' + b.getAttribute('data-tab'); };
    });
    if (!location.hash) location.hash = '#' + load('tab', 'quiz');
    window.addEventListener('hashchange', route);
    countdown(); setInterval(countdown, 60000);
    if (QS.length !== TOTAL_TARGET) console.warn('Question bank has ' + QS.length + ' questions');
    route();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { });
  }

  window.ISRO = {
    addQ: addQ, addPYQ: addPYQ, start: start,
    setMindmap: function (t) { MINDMAP = t; },
    addNotes: function (key, title, text) { NOTES.push({ key: key, title: title, md: text }); },
    _qs: QS
  };
})();
