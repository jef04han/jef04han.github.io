/* DC Shift runbook app. R is the model built by parser.js from the uploaded runbook; progress is kept in localStorage. */
window.startRunbookApp = function (R, meta) {
  'use strict';

  var KEY = 'dcshifting.progress.v1';
  var STATUSES = ['Open', 'In Progress', 'Done', 'Blocked', 'N/A'];
  var STAGES = window.DEVICE_STAGES;
  var ROUTE_KEY = 'dcshifting.lastRoute';
  var PAGE = 60;

  /* ---------------- state ---------------- */
  function defaults() { return { tasks: {}, dev: {}, go: {}, pre: {}, preAt: {}, decision: '', log: [], who: '' }; }
  var S = (function () {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return defaults(); }
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save on this device'); } }
  function log(msg) {
    S.log.unshift({ t: new Date().toISOString(), m: msg, by: S.who || '' });
    if (S.log.length > 1000) S.log.length = 1000;
  }

  /* ---------------- data prep ---------------- */
  var tasks = R.tasks.map(function (t, i) {
    var st = t.start ? new Date(t.start) : null;
    var en = st ? new Date(st.getTime() + t.dur * 60000) : null;
    return Object.assign({}, t, { idx: i, s: st, e: en });
  });
  var taskById = {};
  tasks.forEach(function (t) { taskById[t.id] = t; });
  var gates = [];
  tasks.forEach(function (t) { if (gates.indexOf(t.gate) < 0) gates.push(t.gate); });

  var devices = R.devices.map(function (row, i) {
    var o = { idx: i };
    R.devKeys.forEach(function (k, j) { o[k] = row[j]; });
    o.key = window.deviceKey(o.serial, o.host, o.sn);
    o.name = isNA(o.host) ? (o.model || o.type || 'Device') : o.host;
    o.hay = [o.host, o.serial, o.subSerial, o.ip, o.mgmtIp, o.srcRack, o.srcU, o.dstRack, o.model, o.type, o.app, o.appGroup, o.physHost, o.truck]
      .join(' ').toLowerCase();
    return o;
  });
  var devBySn = {};
  devices.forEach(function (d) { if (devBySn[d.key]) d.key += '#' + d.idx; devBySn[d.key] = d; });
  // Progress carried inside the uploaded workbook (from an earlier export) fills in anything
  // this device hasn't recorded yet; what was recorded here always wins.
  (function seedFromWorkbook() {
    var n = 0, nowIso = new Date().toISOString();
    tasks.forEach(function (t) {
      if (S.tasks[t.id] || (t.status === 'Open' && !t.aStart && !t.aEnd && !t.note)) return;
      var o = { status: t.status };
      if (t.aStart) o.aStart = t.aStart;
      if (t.aEnd) o.aEnd = t.aEnd;
      if (t.note) o.note = t.note;
      S.tasks[t.id] = o; n++;
    });
    devices.forEach(function (d) {
      if (S.dev[d.key] || ((d.stage == null || d.stage < 0) && !d.note)) return;
      var st = d.stage >= 0 ? d.stage : -1, ts = {};
      for (var i = 0; i <= st; i++) ts[i] = d.stageAt || nowIso;
      S.dev[d.key] = { stage: st, ts: ts };
      if (d.note) S.dev[d.key].note = d.note;
      n++;
    });
    R.gonogo.forEach(function (g, i) { if (g.signed && !S.go[i]) { S.go[i] = { signed: true, at: g.signedAt || nowIso }; n++; } });
    if (!S.decision && R.decision) { S.decision = R.decision; n++; }
    S.preAt = S.preAt || {};
    R.pre.forEach(function (p) { if (p.at && !S.preAt[p.id]) { S.preAt[p.id] = p.at; n++; } });
    if (!S.log.length && R.log && R.log.length) { S.log = R.log.slice(); n++; }
    if (n) save();
  })();

  var batches = [];
  devices.forEach(function (d) { if (batches.indexOf(d.batch) < 0) batches.push(d.batch); });
  batches.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });

  /* ---------------- helpers ---------------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl(v) { return esc(v).replace(/\\n|\n/g, '<br>'); }
  function isNA(v) { return !v || /^(na|n\/a|not applicable|no ip assigned|-)$/i.test(String(v).trim()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fTime(d) { return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '—'; }
  function fDay(d) { return d ? d.getDate() + ' ' + MON[d.getMonth()] : ''; }
  function fDT(d) { return d ? fDay(d) + ' ' + fTime(d) : '—'; }
  function fDur(min) {
    min = Math.round(min);
    var neg = min < 0; min = Math.abs(min);
    var h = Math.floor(min / 60), m = min % 60;
    var s = h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm';
    return (neg ? '-' : '') + s;
  }
  function hm(s) { return String(s || '').replace(/(\d{1,2}:\d{2}):00\b/g, '$1'); }
  function stKey(s) { return String(s).replace(/[^A-Za-z]/g, ''); }
  function pill(s) { return '<span class="pill st-' + stKey(s) + '">' + esc(s) + '</span>'; }
  function now() { return new Date(); }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }
  var ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    dash: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
    circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>'
  };

  // Turn "9505935000; someone@bank.com" into tap-to-call / tap-to-mail chips.
  function contactLinks(str) {
    if (!str) return '';
    var out = [], seen = {};
    String(str).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, function (m) {
      if (!seen[m]) { seen[m] = 1; out.push('<a href="mailto:' + esc(m) + '">✉ ' + esc(m) + '</a>'); }
      return ' ';
    }).replace(/(\+?91[\s-]?)?\d[\d\s-]{8,12}\d/g, function (m) {
      var n = m.replace(/[^\d+]/g, '');
      if (n.length >= 10 && !seen[n]) { seen[n] = 1; out.push('<a href="tel:' + esc(n) + '">☎ ' + esc(n) + '</a>'); }
      return m;
    });
    return out.length ? '<div class="links">' + out.join('') + '</div>' : '';
  }

  /* ---------------- task logic ---------------- */
  function tState(t) { return S.tasks[t.id] || {}; }
  function tStatus(t) { return tState(t).status || (t.status === 'Open' ? 'Open' : t.status); }
  function isClosed(s) { return s === 'Done' || s === 'N/A'; }
  function isOverdue(t, n) { return t.e && !isClosed(tStatus(t)) && t.e < (n || now()); }
  function setTaskStatus(t, status) {
    var st = S.tasks[t.id] || (S.tasks[t.id] = {});
    var prev = st.status || 'Open';
    if (prev === status) return;
    st.status = status;
    var ts = new Date().toISOString();
    if (status === 'In Progress' && !st.aStart) st.aStart = ts;
    if (status === 'Done') { if (!st.aStart) st.aStart = ts; st.aEnd = ts; }
    if (status === 'Open') { delete st.aStart; delete st.aEnd; }
    if (status !== 'Done' && status !== 'Open') delete st.aEnd;
    log(t.id + ' → ' + status);
    save();
  }
  function counts(list) {
    var c = { total: list.length, Open: 0, 'In Progress': 0, Done: 0, Blocked: 0, 'N/A': 0, overdue: 0 };
    var n = now();
    list.forEach(function (t) { c[tStatus(t)]++; if (isOverdue(t, n)) c.overdue++; });
    c.closed = c.Done + c['N/A'];
    return c;
  }
  function bar(c) {
    var tot = c.total || 1;
    return '<div class="bar" role="img" aria-label="' + c.closed + ' of ' + c.total + ' complete">' +
      '<i class="d" style="width:' + (c.closed / tot * 100) + '%"></i>' +
      '<i class="p" style="width:' + ((c['In Progress'] || 0) / tot * 100) + '%"></i>' +
      '<i class="b" style="width:' + ((c.Blocked || 0) / tot * 100) + '%"></i></div>';
  }

  /* ---------------- device logic ---------------- */
  function dStage(d) { var x = S.dev[d.key]; return x ? x.stage : -1; }
  function setStage(d, stage, silent) {
    var x = S.dev[d.key] || (S.dev[d.key] = { stage: -1, ts: {} });
    x.stage = stage;
    var ts = new Date().toISOString();
    for (var i = 0; i <= stage; i++) if (!x.ts[i]) x.ts[i] = ts;
    for (var j = stage + 1; j < STAGES.length; j++) delete x.ts[j];
    if (stage < 0) delete S.dev[d.key];
    if (!silent) { log(d.name + ' (' + d.serial + ') → ' + (stage < 0 ? 'reset' : STAGES[stage])); save(); }
  }
  function stageDots(d) {
    var s = dStage(d), h = '<span class="stage-dots" aria-label="' + (s < 0 ? 'Not started' : STAGES[s]) + '">';
    for (var i = 0; i < STAGES.length; i++) h += '<i class="' + (i <= s ? 'on' : '') + '"></i>';
    return h + '</span>';
  }

  /* ---------------- routing ---------------- */
  var view = $('#view');
  var ui = { gate: 'All', status: 'All', q: '', sort: 'batch', dBatch: 'All', dStage: 'All', dq: '', dLimit: PAGE };

  function route() {
    try { localStorage.setItem(ROUTE_KEY, location.hash || '#home'); } catch (e) { /* ignore */ }
    var h = (location.hash || '#home').slice(1).split('/');
    var tab = h[0] || 'home';
    $$('#tabbar a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });
    closeSheet(true);
    var fn = { home: renderHome, tasks: renderTasks, batches: renderBatches, devices: renderDevices, more: renderMore }[tab] || renderHome;
    fn(h[1] ? decodeURIComponent(h[1]) : '');
    window.scrollTo(0, 0);
  }
  function rerender() {
    var y = window.scrollY;
    var h = (location.hash || '#home').slice(1).split('/');
    var fn = { home: renderHome, tasks: renderTasks, batches: renderBatches, devices: renderDevices, more: renderMore }[h[0]] || renderHome;
    fn(h[1] ? decodeURIComponent(h[1]) : '', true);
    window.scrollTo(0, y);
  }

  /* ---------------- HOME ---------------- */
  function renderHome() {
    var n = now(), c = counts(tasks);
    var dv = devices.filter(function (d) { return dStage(d) === STAGES.length - 1; }).length;
    var moving = devices.filter(function (d) { var s = dStage(d); return s >= 0 && s < STAGES.length - 1; }).length;
    var dec = S.decision;
    var goSigned = R.gonogo.filter(function (g, i) { return (S.go[i] || {}).signed; }).length;

    var h = '';
    h += '<div class="card decision" data-go="#more/gonogo" style="cursor:pointer">' +
      '<div style="flex:1"><div class="muted small">GO / NO-GO decision</div>' +
      '<div class="big ' + (dec === 'GO' ? 'go' : dec === 'NOGO' ? 'nogo' : 'pending') + '">' +
      (dec === 'GO' ? 'GO' : dec === 'NOGO' ? 'NO-GO' : 'Pending') + '</div>' +
      '<div class="muted small">' + goSigned + ' of ' + R.gonogo.length + ' sign-offs received</div></div>' +
      '<span class="chev">' + ICON.chev + '</span></div>';

    h += '<div class="stats">' +
      stat(c.closed + '<small class="muted" style="font-size:14px">/' + c.total + '</small>', 'Tasks complete') +
      stat(c['In Progress'], 'In progress') +
      stat('<span style="color:var(--block)">' + c.Blocked + '</span>', 'Blocked') +
      stat('<span style="color:' + (c.overdue ? 'var(--warn)' : 'inherit') + '">' + c.overdue + '</span>', 'Behind plan') +
      stat(dv + '<small class="muted" style="font-size:14px">/' + devices.length + '</small>', 'Devices validated') +
      stat(moving, 'Devices in flight') +
      stat(R.summary[0] ? esc(R.summary[0].value) : devices.length, 'Total devices') +
      stat(R.trucks.length, 'Truck movements') +
      '</div>';
    h += '<div class="card" style="margin-top:10px">' + bar(c) +
      '<div class="row small muted" style="margin-top:6px"><span>' + Math.round(c.closed / c.total * 100) + '% of runbook done</span><span class="spacer"></span><span>' + esc(R.version) + '</span></div></div>';

    var active = tasks.filter(function (t) { return tStatus(t) === 'In Progress' || tStatus(t) === 'Blocked'; });
    var due = tasks.filter(function (t) {
      return tStatus(t) === 'Open' && t.s && t.s <= n && t.e > n;
    });
    var now1 = active.concat(due).sort(byStart);
    h += '<h2>Happening now</h2>' + (now1.length ? now1.slice(0, 10).map(taskCard).join('') +
      (now1.length > 10 ? moreLink('#tasks', now1.length - 10) : '') : '<div class="card empty">Nothing in progress right now.</div>');

    var od = tasks.filter(function (t) { return isOverdue(t, n) && tStatus(t) !== 'In Progress' && tStatus(t) !== 'Blocked'; }).sort(byStart);
    if (od.length) {
      h += '<h2>Behind plan (' + od.length + ')</h2>' + od.slice(0, 6).map(taskCard).join('') +
        (od.length > 6 ? '<a class="btn block" href="#tasks/overdue">See all ' + od.length + ' overdue tasks</a>' : '');
    }

    var next = tasks.filter(function (t) { return t.s && t.s > n && tStatus(t) === 'Open'; }).sort(byStart).slice(0, 6);
    h += '<h2>Up next</h2>' + (next.length ? next.map(taskCard).join('') : '<div class="card empty">No upcoming tasks.</div>');

    h += '<h2>Progress by batch</h2><div class="list">' + gates.map(function (g) {
      var gc = counts(tasks.filter(function (t) { return t.gate === g; }));
      return '<div class="li" data-go="#tasks/' + encodeURIComponent(g) + '"><div class="grow"><div class="row"><span class="title">' + esc(g) + '</span><span class="spacer"></span>' +
        '<span class="small muted">' + gc.closed + '/' + gc.total + (gc.Blocked ? ' · <span style="color:var(--block)">' + gc.Blocked + ' blocked</span>' : '') + '</span></div>' +
        '<div style="margin-top:6px">' + bar(gc) + '</div></div><span class="chev">' + ICON.chev + '</span></div>';
    }).join('') + '</div>';

    h += '<div class="btn-grid" style="margin-top:16px"><button class="btn primary" data-act="xlsx">Export Excel</button><button class="btn" data-act="share">Share status</button></div>' +
      (S.exportedAt ? '<p class="small muted" style="text-align:center">Last Excel export ' + fDT(new Date(S.exportedAt)) + '</p>' : '');
    view.innerHTML = h;
  }
  function stat(v, l) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function byStart(a, b) { return (a.s ? a.s.getTime() : 0) - (b.s ? b.s.getTime() : 0) || a.idx - b.idx; }
  function moreLink(href, n) { return '<a class="btn block" href="' + href + '">+' + n + ' more</a>'; }

  function taskCard(t) {
    var s = tStatus(t), st = tState(t), k = stKey(s);
    var late = isOverdue(t);
    var icon = s === 'Done' ? ICON.check : s === 'In Progress' ? ICON.check : s === 'Blocked' ? ICON.x : s === 'N/A' ? ICON.dash : ICON.play;
    return '<div class="task s-' + k + '" data-task="' + esc(t.id) + '">' +
      '<div class="t-main"><div class="t-top"><span class="t-id">' + esc(t.id) + '</span>' +
      '<span class="t-time">' + (t.s ? fDay(t.s) + ' ' + fTime(t.s) + '–' + fTime(t.e) : '') + ' · ' + fDur(t.dur) + '</span>' +
      (s !== 'Open' ? pill(s) : '') + (late ? '<span class="tag late">late</span>' : '') + (st.note ? '<span class="tag">note</span>' : '') +
      '</div><div class="t-desc">' + nl(firstLine(t.desc)) + '</div>' +
      '<div class="t-team">' + esc(t.loc) + ' · ' + esc(t.team) + '</div></div>' +
      '<button class="qbtn s-' + k + '" data-quick="' + esc(t.id) + '" aria-label="' +
      (s === 'Open' ? 'Start task' : s === 'In Progress' ? 'Mark done' : 'Change status') + '">' + icon + '</button></div>';
  }
  function firstLine(s) { return String(s).split(/\\n|\n/)[0]; }

  /* ---------------- TASKS ---------------- */
  function renderTasks(arg, keep) {
    if (!keep && arg) {
      if (arg === 'overdue') { ui.status = 'Overdue'; ui.gate = 'All'; }
      else if (gates.indexOf(arg) >= 0) { ui.gate = arg; ui.status = 'All'; }
    }
    var q = ui.q.toLowerCase();
    var n = now();
    var list = tasks.filter(function (t) {
      if (ui.gate !== 'All' && t.gate !== ui.gate) return false;
      var s = tStatus(t);
      if (ui.status === 'Overdue') { if (!isOverdue(t, n)) return false; }
      else if (ui.status === 'Active') { if (s !== 'In Progress' && s !== 'Blocked') return false; }
      else if (ui.status !== 'All' && s !== ui.status) return false;
      if (q && (t.id + ' ' + t.desc + ' ' + t.team + ' ' + t.loc + ' ' + t.app + ' ' + t.comments).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var h = '<div class="sticky-tools"><input class="search" type="search" id="tq" placeholder="Search tasks, teams, apps…" value="' + esc(ui.q) + '">' +
      '<div class="chips">' + ['All'].concat(gates).map(function (g) {
        return '<button class="chip' + (ui.gate === g ? ' on' : '') + '" data-gate="' + esc(g) + '">' + esc(g) + '</button>';
      }).join('') + '</div>' +
      '<div class="chips">' + ['All', 'Active', 'Open', 'In Progress', 'Done', 'Blocked', 'Overdue'].map(function (s) {
        return '<button class="chip' + (ui.status === s ? ' on' : '') + '" data-tstatus="' + s + '">' + s + '</button>';
      }).join('') +
      '<span style="flex:none;width:8px"></span><button class="chip" data-sort="1">' + (ui.sort === 'batch' ? 'By batch' : 'By time') + ' ⇅</button></div></div>';

    if (!list.length) { view.innerHTML = h + '<div class="empty">No tasks match.</div>'; bindTaskTools(); return; }
    if (ui.sort === 'time') {
      var lastDay = '';
      list.slice().sort(byStart).forEach(function (t) {
        var d = t.s ? fDay(t.s) : 'Unscheduled';
        if (d !== lastDay) { h += '<div class="group-h"><b>' + esc(d) + '</b></div>'; lastDay = d; }
        h += taskCard(t);
      });
    } else {
      gates.forEach(function (g) {
        var gl = list.filter(function (t) { return t.gate === g; });
        if (!gl.length) return;
        var gc = counts(tasks.filter(function (t) { return t.gate === g; }));
        h += '<div class="group-h"><b>' + esc(g) + '</b><span class="small muted">' + gc.closed + '/' + gc.total + '</span><span class="spacer"></span>' + bar(gc) + '</div>';
        h += gl.map(taskCard).join('');
      });
    }
    view.innerHTML = h;
    bindTaskTools();
  }
  function bindTaskTools() {
    var q = $('#tq');
    if (q) q.addEventListener('input', debounce(function () { ui.q = q.value; renderTasks('', true); var nq = $('#tq'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }, 200));
  }

  function openTask(id) {
    var t = taskById[id]; if (!t) return;
    var s = tStatus(t), st = tState(t);
    var h = '<div class="row"><span class="t-id" style="font-size:15px">' + esc(t.id) + '</span>' + pill(s) +
      (isOverdue(t) ? '<span class="tag late">behind plan</span>' : '') + '<span class="spacer"></span><span class="tag">' + esc(t.gate) + '</span></div>' +
      '<h3>' + nl(t.desc) + '</h3>';

    h += '<div class="seg" style="margin:12px 0">' + STATUSES.map(function (x) {
      return '<button class="' + (x === s ? 'on' : '') + '" data-setstatus="' + esc(x) + '" data-id="' + esc(t.id) + '">' + esc(x) + '</button>';
    }).join('') + '</div>';

    var var_ = '';
    if (st.aStart && st.aEnd) {
      var actual = (new Date(st.aEnd) - new Date(st.aStart)) / 60000;
      var_ = fDur(actual) + ' actual (' + (actual - t.dur >= 0 ? '+' : '') + fDur(actual - t.dur) + ' vs plan)';
    }
    var sheetEnd = t.endSheet && t.e && t.endSheet.slice(-5) !== fTime(t.e);
    h += '<div class="kv">' +
      kv('Planned', t.s ? fDT(t.s) + ' → ' + fDT(t.e) : '—') +
      kv('Duration', fDur(t.dur)) +
      (sheetEnd ? kv('Sheet end', '<span class="tag warn">' + esc(t.endSheet) + '</span> <span class="small muted">differs from start + duration</span>') : '') +
      kv('Actual start', st.aStart ? fDT(new Date(st.aStart)) : '—') +
      kv('Actual end', st.aEnd ? fDT(new Date(st.aEnd)) : '—') +
      (var_ ? kv('Variance', esc(var_)) : '') +
      kv('Location', esc(t.loc)) +
      kv('Team', esc(t.team)) +
      (t.res ? kv('Resource', esc(t.res)) : '') +
      kv('Depends on', t.deps ? t.deps.split(/[,;\s]+/).filter(Boolean).map(function (d) {
        var dt = taskById[d];
        return dt ? '<a href="#" data-task-link="' + esc(d) + '">' + esc(d) + '</a> ' + pill(tStatus(dt)) : esc(d);
      }).join('<br>') : '—') +
      (t.comments ? kv('Comments', nl(t.comments)) : '') +
      '</div>';

    var dependents = tasks.filter(function (x) { return (x.deps || '').split(/[,;\s]+/).indexOf(t.id) >= 0; });
    if (dependents.length) {
      h += '<div class="section-t">Unblocks</div><div class="row wrap">' + dependents.map(function (x) {
        return '<a href="#" class="chip" data-task-link="' + esc(x.id) + '">' + esc(x.id) + '</a>';
      }).join('') + '</div>';
    }

    h += '<div class="section-t">Notes</div><textarea id="tnote" placeholder="Add a note for this task…">' + esc(st.note || '') + '</textarea>';

    if (t.app || t.spoc) {
      var apps = splitLines(t.app), groups = splitLines(t.appGroup), spocs = splitLines(t.spoc), sc = splitLines(t.spocContact),
        vs = splitLines(t.vendor), vc = splitLines(t.vendorContact);
      h += '<div class="section-t">Application contacts</div><div class="card" style="padding:4px 14px">';
      var max = Math.max(spocs.length, vs.length);
      for (var i = 0; i < max; i++) {
        h += '<div class="contact"><b>' + esc(apps[i] || groups[i] || 'Application') + '</b>' +
          (spocs[i] ? '<div class="small">Bank SPOC: ' + esc(spocs[i]) + '</div>' + contactLinks(sc[i]) : '') +
          (vs[i] ? '<div class="small" style="margin-top:6px">Vendor: ' + esc(vs[i]) + '</div>' + contactLinks(vc[i]) : '') + '</div>';
      }
      h += '</div>';
    }
    var g = t.gate.replace('Batch ', '');
    if (batches.indexOf(g) >= 0) h += '<a class="btn block" style="margin-top:12px" href="#devices/' + encodeURIComponent(g) + '">View Batch ' + esc(g) + ' devices</a>';

    openSheet(h, function () {
      var ta = $('#tnote');
      ta.addEventListener('input', debounce(function () {
        var o = S.tasks[t.id] || (S.tasks[t.id] = {});
        if (ta.value) o.note = ta.value; else delete o.note;
        save();
      }, 400));
    });
  }
  function splitLines(s) { return String(s || '').split(/\\n|\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function kv(k, v) { return '<div>' + esc(k) + '</div><div>' + v + '</div>'; }

  /* ---------------- TRUCKS / BATCHES ---------------- */
  function renderBatches() {
    var h = '<div class="stats">' + R.summary.map(function (s) {
      return stat(esc(s.value), esc(s.label));
    }).join('') + '</div>';
    var win = R.summary.filter(function (s) { return s.truck; });
    if (win.length) {
      h += '<div class="card small" style="margin-top:10px"><b>Truck windows</b>' + win.map(function (s) {
        return '<div class="row"><span>' + esc(s.truck) + '</span><span class="spacer"></span><span class="muted">' + esc(s.window) + '</span></div>';
      }).join('') + '</div>';
    }
    h += '<h2>Truck movements</h2>';
    R.trucks.forEach(function (tr) {
      var b = tr.batch, devs = b ? devices.filter(function (d) { return d.batch === b; }) : [];
      var gt = b ? tasks.filter(function (t) { return t.gate === 'Batch ' + b; }) : [];
      var gc = counts(gt);
      var val = devs.filter(function (d) { return dStage(d) === STAGES.length - 1; }).length;
      var cur = devs.length ? Math.min.apply(null, devs.map(dStage)) : -1;
      h += '<div class="card truck"><div class="head"><div class="num">' + esc(b || '–') + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700">' + (b ? 'Batch ' + esc(b) : 'Unassigned batch') + ' <span class="muted small">· Truck #' + esc(tr.sn) + ' · ' + esc(tr.ft) + ' ft</span></div>' +
        '<div class="small">' + esc(tr.desc) + '</div></div></div>' +
        '<div class="timeline3"><div><small>Handover to Royal</small><b>' + esc(hm(tr.handover) || '—') + '</b></div>' +
        '<div><small>Leaves ITI</small><b>' + esc(hm(tr.start) || '—') + '</b></div>' +
        '<div><small>Reaches STT</small><b>' + esc(hm(tr.reach) || '—') + '</b></div></div>' +
        '<div class="row wrap small">' +
        (tr.devices ? '<span class="tag">' + esc(tr.devices) + ' devices (plan)</span>' : '') +
        (tr.racks ? '<span class="tag">' + esc(tr.racks) + ' racks</span>' : '') +
        (devs.length ? '<span class="tag">' + devs.length + ' in run plan</span>' : '') + '</div>' +
        (tr.remarks ? '<div class="small muted" style="margin-top:8px">' + nl(tr.remarks) + '</div>' : '') +
        (b && gt.length ? '<div style="margin-top:10px">' + bar(gc) + '<div class="row small muted" style="margin-top:4px"><span>Tasks ' + gc.closed + '/' + gc.total + '</span><span class="spacer"></span><span>Devices validated ' + val + '/' + devs.length + '</span></div></div>' : '') +
        (b ? '<div class="btn-grid" style="margin-top:10px"><a class="btn" href="#tasks/' + encodeURIComponent('Batch ' + b) + '">Tasks</a>' +
          '<a class="btn" href="#devices/' + encodeURIComponent(b) + '">Devices</a></div>' +
          (devs.length ? '<button class="btn block" style="margin-top:8px" data-bulk="' + esc(b) + '">Update all devices · ' + (cur < 0 ? 'not started' : esc(STAGES[cur])) + '</button>' : '') : '') +
        '</div>';
    });
    view.innerHTML = h;
  }
  function openBulk(b) {
    var devs = devices.filter(function (d) { return d.batch === b; });
    var h = '<h3>Batch ' + esc(b) + ' · ' + devs.length + ' devices</h3><p class="muted small">Set every device in this batch to a stage. Individual devices can still be adjusted afterwards.</p>' +
      '<div class="stepper">' + STAGES.map(function (s, i) {
        var n = devs.filter(function (d) { return dStage(d) >= i; }).length;
        return '<button class="step' + (n === devs.length ? ' done' : '') + '" data-bulkset="' + i + '" data-b="' + esc(b) + '"><span class="dot">' + (n === devs.length ? ICON.check : '') + '</span><span class="lbl">' + esc(s) + '</span><span class="ts">' + n + '/' + devs.length + '</span></button>';
      }).join('') + '</div><button class="btn block" data-bulkset="-1" data-b="' + esc(b) + '">Reset batch</button>';
    openSheet(h);
  }

  /* ---------------- DEVICES ---------------- */
  function renderDevices(arg, keep) {
    if (!keep) { ui.dLimit = PAGE; if (arg && batches.indexOf(arg) >= 0) ui.dBatch = arg; }
    var q = ui.dq.toLowerCase().trim();
    var base = devices.filter(function (d) {
      if (ui.dBatch !== 'All' && d.batch !== ui.dBatch) return false;
      return !q || d.hay.indexOf(q) >= 0;
    });
    // devices per stage (-1 = not started) within the chosen batch / search
    var cnt = {};
    base.forEach(function (d) { var s = dStage(d); cnt[s] = (cnt[s] || 0) + 1; });
    if (ui.dStage !== 'All' && !/^-?\d+$/.test(ui.dStage)) ui.dStage = 'All';
    var list = ui.dStage === 'All' ? base : base.filter(function (d) { return String(dStage(d)) === ui.dStage; });
    var last = STAGES.length - 1, notStarted = cnt[-1] || 0, validated = cnt[last] || 0;
    var inFlight = base.length - notStarted - validated;
    var opts = [['All', 'All', base.length], ['-1', 'Not started', notStarted]].concat(STAGES.map(function (s, i) { return [String(i), s, cnt[i] || 0]; }));
    var h = '<div class="sticky-tools"><input class="search" type="search" id="dq" placeholder="Hostname, serial, IP, rack, app…" value="' + esc(ui.dq) + '">' +
      '<div class="chips">' + ['All'].concat(batches).map(function (b) {
        return '<button class="chip' + (ui.dBatch === b ? ' on' : '') + '" data-dbatch="' + esc(b) + '">' + (b === 'All' ? 'All batches' : 'B' + esc(b)) + '</button>';
      }).join('') + '</div>' +
      '<div class="dev-sum" aria-live="polite"><div class="row small"><b>' + base.length + ' devices</b><span class="muted">· ' + notStarted + ' not started · ' + inFlight + ' in flight · ' +
      '<span style="color:var(--done)">' + validated + ' validated</span></span></div>' +
      bar({ total: base.length, closed: validated, 'In Progress': inFlight, Blocked: 0 }) + '</div>' +
      '<div class="chips">' + opts.map(function (o) {
        return '<button class="chip' + (ui.dStage === o[0] ? ' on' : '') + (o[2] ? '' : ' zero') + '" data-dstage="' + o[0] + '">' + esc(o[1]) + '<b class="cnt">' + o[2] + '</b></button>';
      }).join('') + '</div></div>';
    if (!list.length) h += '<div class="empty">No devices match.</div>';
    else {
      h += '<div class="list">' + list.slice(0, ui.dLimit).map(function (d) {
        return '<div class="li" data-dev="' + esc(d.key) + '"><div class="grow"><div class="title">' + esc(d.name) + '</div>' +
          '<div class="sub">B' + esc(d.batch) + ' · ' + esc(d.type || d.type1) + ' · ' + esc(d.serial) + '</div>' +
          '<div class="sub">' + esc(d.srcU || d.srcRack) + ' → ' + esc(d.dstRack) + (d.dstU ? ' U' + esc(d.dstU) : '') + (isNA(d.ip) ? '' : ' · ' + esc(d.ip)) + '</div></div>' +
          '<div class="stage-col">' + stageDots(d) + '<small' + (dStage(d) === last ? ' class="ok"' : '') + '>' + esc(dStage(d) < 0 ? 'Not started' : STAGES[dStage(d)]) + '</small></div></div>';
      }).join('') + '</div>';
      if (list.length > ui.dLimit) h += '<button class="btn more-btn" data-dmore="1">Show more (' + (list.length - ui.dLimit) + ' left)</button>';
    }
    view.innerHTML = h;
    var inp = $('#dq');
    inp.addEventListener('input', debounce(function () {
      ui.dq = inp.value; ui.dLimit = PAGE; renderDevices('', true);
      var n = $('#dq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length);
    }, 200));
  }

  function openDevice(sn) {
    var d = devBySn[sn]; if (!d) return;
    var x = S.dev[d.key] || { stage: -1, ts: {} }, s = x.stage;
    var h = '<div class="row"><span class="tag">Batch ' + esc(d.batch) + '</span><span class="tag">Truck ' + esc(d.truck) + '</span>' +
      (d.crit ? '<span class="tag' + (/high/i.test(d.crit) ? ' warn' : '') + '">' + esc(d.crit) + '</span>' : '') + '</div>' +
      '<h3>' + esc(d.name) + '</h3><div class="muted small">' + esc([d.oem, d.model].filter(Boolean).join(' ')) + '</div>';

    h += '<div class="section-t">Movement</div><div class="stepper">' + STAGES.map(function (st, i) {
      var done = i <= s;
      return '<button class="step' + (done ? ' done' : '') + '" data-stage="' + i + '" data-sn="' + esc(d.key) + '">' +
        '<span class="dot">' + (done ? ICON.check : '') + '</span><span class="lbl">' + esc(st) + '</span>' +
        '<span class="ts">' + (x.ts && x.ts[i] ? fDT(new Date(x.ts[i])) : '') + '</span></button>';
    }).join('') + '</div>';
    if (s >= 0) h += '<button class="btn block" data-stage="-1" data-sn="' + esc(d.key) + '">Reset progress</button>';

    h += '<div class="section-t">Location</div><div class="kv">' +
      kv('Source rack / U', esc(d.srcRack) + ' · ' + esc(d.srcU) + ' (' + esc(d.hall) + ')') +
      kv('Target rack / U', '<b>' + esc(d.dstRack) + '</b> · U ' + esc(d.dstU)) +
      kv('U size', esc(d.uSize)) +
      kv('Power', esc(d.psu) + (d.cord ? ' × ' + esc(d.cord) : '')) + '</div>';

    h += '<div class="section-t">Schedule</div><div class="kv">' +
      kv('Shutdown', esc(d.shutDate) + ' ' + esc(d.shutTime)) +
      kv('Royal handover', esc(d.handover)) +
      kv('Truck moves', esc(d.truckTime)) + '</div>';

    h += '<div class="section-t">Device</div><div class="kv">' +
      kv('Hostname', '<span class="mono">' + esc(d.host) + '</span>') +
      kv('Serial', '<span class="mono">' + esc(d.serial) + (d.subSerial && d.subSerial !== d.serial ? ' / ' + esc(d.subSerial) : '') + '</span>') +
      kv('Internal IP', '<span class="mono">' + esc(d.ip) + '</span>') +
      (!isNA(d.mgmtIp) ? kv('Mgmt IP (ILO)', '<span class="mono">' + esc(d.mgmtIp) + '</span>') : '') +
      kv('Type', esc([d.type1, d.type].filter(Boolean).join(' · '))) +
      kv('Role / Env', esc(d.role) + ' · ' + esc(d.env)) +
      kv('Hypervisor', esc(d.hyp) + (!isNA(d.physHost) ? ' on ' + esc(d.physHost) : '')) +
      (!isNA(d.os) ? kv('OS', esc(d.os) + ' ' + esc(isNA(d.osVer) ? '' : d.osVer)) : '') +
      kv('SAN', esc(d.san)) +
      kv('HW / CBS', esc(d.hw) + ' · ' + esc(d.cbs)) + '</div>';

    h += '<div class="section-t">Application</div><div class="card" style="padding:4px 14px"><div class="contact"><b>' + esc(d.app) + '</b><div class="small muted">' + esc(d.appGroup) + '</div></div>' +
      (d.spoc ? '<div class="contact"><div class="small">Bank SPOC: ' + esc(d.spoc) + '</div>' + contactLinks(d.spocContact) + '</div>' : '') +
      (d.vendor ? '<div class="contact"><div class="small">Vendor: ' + esc(d.vendor) + '</div>' + contactLinks(d.vendorContact) + '</div>' : '') + '</div>';

    h += '<div class="section-t">Notes</div><textarea id="dnote" placeholder="Note for this device…">' + esc((S.dev[d.key] || {}).note || '') + '</textarea>';
    openSheet(h, function () {
      var ta = $('#dnote');
      ta.addEventListener('input', debounce(function () {
        var o = S.dev[d.key] || (S.dev[d.key] = { stage: -1, ts: {} });
        if (ta.value) o.note = ta.value; else delete o.note;
        save();
      }, 400));
    });
  }

  /* ---------------- MORE ---------------- */
  function renderMore(sub) {
    var fn = { gonogo: moreGoNoGo, pre: morePre, contacts: moreContacts, comms: moreComms, log: moreLog, data: moreData, changes: moreChanges, runbook: moreRunbook }[sub];
    if (fn) { view.innerHTML = '<a href="#more" class="small">‹ More</a>' + fn(); afterMore(sub); return; }
    var preDone = R.pre.filter(function (p) { return preStatus(p) === 'Closed'; }).length;
    var items = [
      ['gonogo', 'GO / NO-GO checklist', (S.decision ? 'Decision: ' + (S.decision === 'NOGO' ? 'NO-GO' : 'GO') : 'Decision pending')],
      ['pre', 'Pre-event checklist', preDone + ' of ' + R.pre.length + ' closed'],
      ['contacts', 'Contacts', 'Migration squad, management, app SPOCs & vendors'],
      ['comms', 'Command centre', 'Bridge, checkpoints & communication plan'],
      ['log', 'Event log', S.log.length + ' entries'],
      ['runbook', 'Runbook file & Excel export', (R.source || 'Uploaded runbook') + (meta && meta.at ? ' · loaded ' + fDT(new Date(meta.at)) : '')],
      ['changes', 'Runbook change log', R.version + ' · ' + R.changelog.length + ' change(s)'],
      ['data', 'Your name, export & backup', S.who ? 'Name: ' + S.who : 'Progress is saved on this device']
    ];
    view.innerHTML = '<h2>Runbook</h2><div class="list">' + items.map(function (it) {
      return '<div class="li" data-go="#more/' + it[0] + '"><div class="grow"><div class="title">' + esc(it[1]) + '</div><div class="sub">' + esc(it[2]) + '</div></div><span class="chev">' + ICON.chev + '</span></div>';
    }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:16px">' + esc(R.title) + ' · Source: ' + esc(R.source) + '</p>';
  }

  function moreGoNoGo() {
    var h = '<h2>Decision</h2><div class="card"><div class="seg">' +
      '<button class="' + (S.decision === 'GO' ? 'on' : '') + '" data-decision="GO" style="' + (S.decision === 'GO' ? 'color:var(--done)' : '') + '">GO</button>' +
      '<button class="' + (!S.decision ? 'on' : '') + '" data-decision="">Pending</button>' +
      '<button class="' + (S.decision === 'NOGO' ? 'on' : '') + '" data-decision="NOGO" style="' + (S.decision === 'NOGO' ? 'color:var(--block)' : '') + '">NO-GO</button></div>' +
      (S.decisionAt ? '<div class="small muted" style="margin-top:8px">Recorded ' + fDT(new Date(S.decisionAt)) + (S.decisionBy ? ' by ' + esc(S.decisionBy) : '') + '</div>' : '') +
      '</div>';
    var sec = '';
    R.gonogo.forEach(function (g, i) {
      if (g.section !== sec) { h += (sec ? '</div>' : '') + '<h2>' + esc(g.section) + '</h2><div class="list">'; sec = g.section; }
      var st = S.go[i] || {};
      h += '<div class="li" data-gotoggle="' + i + '"><span class="qbtn' + (st.signed ? ' s-Done' : '') + '">' + (st.signed ? ICON.check : '') + '</span>' +
        '<div class="grow"><div class="title" style="white-space:normal">' + esc(g.item) + '</div><div class="sub" style="white-space:normal">' + esc(g.by) + ' · ' + esc(g.who) + '</div>' +
        (st.signed ? '<div class="sub" style="color:var(--done)">Sign-off received ' + fDT(new Date(st.at)) + '</div>' : '') + '</div></div>';
    });
    return h + '</div>';
  }
  function preStatus(p) { return S.pre[p.id] || p.status; }
  function morePre() {
    var h = '<h2>Wave 2 pre-event checklist</h2><p class="small muted">Tap an item to toggle Open / Closed.</p><div class="list">';
    R.pre.forEach(function (p) {
      var s = preStatus(p);
      h += '<div class="li" data-pretoggle="' + esc(p.id) + '"><span class="qbtn' + (s === 'Closed' ? ' s-Done' : '') + '">' + (s === 'Closed' ? ICON.check : '') + '</span>' +
        '<div class="grow"><div class="row"><b class="small">' + esc(p.id) + '</b><span class="tag">' + esc(p.phase) + '</span><span class="spacer"></span>' + pill(s) + '</div>' +
        '<div style="font-size:14px;margin-top:3px">' + esc(p.desc) + '</div>' +
        '<div class="sub" style="white-space:normal">' + esc(p.owner) + ' · ' + esc(p.scope) + ' · ' + esc(p.loc) + '</div></div></div>';
    });
    return h + '</div>';
  }
  function moreContacts() {
    var h = '<input class="search" type="search" id="cq" placeholder="Search people, apps, vendors…" style="margin-top:10px"><div id="clist">' + contactsHTML('') + '</div>';
    return h;
  }
  var appContacts = (function () {
    var seen = {}, out = [];
    devices.forEach(function (d) {
      var k = d.app + '|' + d.spoc + '|' + d.vendor;
      if (seen[k] || (!d.spoc && !d.vendor)) return;
      seen[k] = 1;
      out.push(d);
    });
    return out.sort(function (a, b) { return a.app.localeCompare(b.app); });
  })();
  function contactsHTML(q) {
    q = q.toLowerCase();
    var h = '', grp = '';
    var squad = R.contacts.filter(function (c) { return !q || (c.group + c.name + c.role + c.phone + c.email).toLowerCase().indexOf(q) >= 0; });
    squad.forEach(function (c) {
      if (c.group !== grp) { h += (grp ? '</div>' : '') + '<h2>' + esc(c.group) + '</h2><div class="card" style="padding:4px 14px">'; grp = c.group; }
      h += '<div class="contact"><b>' + esc(c.name) + '</b>' + (c.role ? ' <span class="small muted">· ' + esc(c.role) + '</span>' : '') + contactLinks(c.phone + ' ' + c.email) + '</div>';
    });
    if (grp) h += '</div>';
    var apps = appContacts.filter(function (d) { return !q || (d.app + d.appGroup + d.spoc + d.spocContact + d.vendor + d.vendorContact).toLowerCase().indexOf(q) >= 0; });
    if (apps.length) {
      h += '<h2>Application SPOCs & vendors</h2><div class="card" style="padding:4px 14px">' + apps.map(function (d) {
        return '<div class="contact"><b>' + esc(d.app) + '</b> <span class="small muted">· ' + esc(d.appGroup) + '</span>' +
          (d.spoc ? '<div class="small" style="margin-top:4px">Bank SPOC: ' + esc(d.spoc) + '</div>' + contactLinks(d.spocContact) : '') +
          (d.vendor ? '<div class="small" style="margin-top:6px">Vendor: ' + esc(d.vendor) + '</div>' + contactLinks(d.vendorContact) : '') + '</div>';
      }).join('') + '</div>';
    }
    return h || '<div class="empty">No contacts match.</div>';
  }
  function moreComms() {
    var c = R.comms;
    var h = '<h2>Command centre</h2><div class="card"><div>' + nl(c.intro) + '</div>' +
      (c.bridge ? '<div class="card" style="margin:10px 0 0;background:var(--chip);border:0"><pre class="note">' + nl(c.bridge) + '</pre></div>' : '') + '</div>';
    h += c.methods.map(function (m) {
      return '<div class="card"><b>' + nl(m.method) + '</b><div class="small muted" style="margin:4px 0">' + nl(m.purpose) + '</div>' +
        '<div style="font-size:14px">' + nl(m.desc) + '</div>' +
        '<div class="section-t">Key participants</div><div class="small">' + nl(m.leads) + '</div>' +
        (m.audience ? '<div class="section-t">Audience</div><div class="small">' + nl(m.audience) + '</div>' : '') + '</div>';
    }).join('');
    return h;
  }
  function moreLog() {
    var h = '<h2>Add entry</h2><div class="card"><textarea id="lognew" placeholder="Issue, decision, checkpoint update…"></textarea>' +
      '<div class="btn-grid" style="margin-top:8px"><button class="btn primary" data-act="addlog">Add to log</button><button class="btn" data-act="sharelog">Share log</button></div></div>';
    h += '<h2>Event log</h2><div class="card">' + (S.log.length ? S.log.slice(0, 300).map(function (l) {
      return '<div class="log-item"><time>' + fDT(new Date(l.t)) + '</time>' + esc(l.m) + (l.by ? ' <span class="muted small">— ' + esc(l.by) + '</span>' : '') + '</div>';
    }).join('') : '<div class="empty">No entries yet. Status changes are logged automatically.</div>') + '</div>';
    return h;
  }
  function moreChanges() {
    return '<h2>Change log · ' + esc(R.version) + '</h2><div class="card">' + R.changelog.map(function (c) {
      return '<div class="log-item"><b>' + esc(c.item) + '</b> · ' + esc(c.tab) + '<div>' + esc(c.desc) + '</div><div class="small muted">' + esc(c.by) + ' · ' + esc(c.date) + '</div></div>';
    }).join('') + '</div>';
  }
  function moreRunbook() {
    var w = R.warnings || [];
    return '<h2>Loaded runbook</h2><div class="card"><b>' + esc(R.source || 'Runbook') + '</b>' +
      '<div class="small muted">' + esc(R.title) + '</div>' +
      (meta && meta.at ? '<div class="small muted">Loaded ' + fDT(new Date(meta.at)) + '</div>' : '') +
      '<div class="row wrap" style="margin-top:8px"><span class="tag">' + tasks.length + ' tasks</span><span class="tag">' + devices.length + ' devices</span>' +
      '<span class="tag">' + R.trucks.length + ' trucks</span><span class="tag">' + R.contacts.length + ' contacts</span><span class="tag">' + R.pre.length + ' checklist items</span></div>' +
      (w.length ? '<div class="section-t">Warnings</div>' + w.map(function (x) { return '<div class="small" style="color:var(--warn)">• ' + esc(x) + '</div>'; }).join('') : '') +
      '</div>' +
      '<h2>Export</h2><div class="card"><p class="small muted" style="margin-top:0">Download the runbook with your progress written into it: task Status and Actual Start/End, device Migration Stage, checklist sign-offs, the GO/NO-GO decision, notes and an “App Event Log” sheet. Formatting and formulas are kept.</p>' +
      '<button class="btn primary block" data-act="xlsx">Export updated Excel</button>' +
      (S.exportedAt ? '<div class="small muted" style="margin-top:6px">Last exported ' + fDT(new Date(S.exportedAt)) + '</div>' : '') + '</div>' +
      '<h2>Update</h2><div class="card"><p class="small muted" style="margin-top:0">Upload a newer version with the same format. Task and device progress is kept — tasks are matched by Task ID and devices by serial number + hostname.</p>' +
      '<label class="btn primary block">Upload new runbook version<input type="file" id="reupload" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label></div>' +
      '<h2>Remove</h2><div class="card"><p class="small muted" style="margin-top:0">Deletes the runbook data stored in this browser. Progress is kept unless you also clear it under “Your name, export & backup”.</p>' +
      '<button class="btn bad block" data-act="unload">Remove runbook from this device</button></div>';
  }
  function moreData() {
    return '<h2>Your name</h2><div class="card"><input type="text" id="who" placeholder="Shown on log entries" value="' + esc(S.who) + '"></div>' +
      '<h2>Share & export</h2><div class="card"><p class="small muted" style="margin-top:0">Progress is stored only in this browser. Use backup / restore to move it to another phone, or share a status update with the bridge.</p>' +
      '<button class="btn primary block" data-act="xlsx" style="margin-bottom:8px">Export updated Excel</button>' +
      '<div class="btn-grid"><button class="btn" data-act="share">Share status</button><button class="btn" data-act="csv">Tasks CSV</button>' +
      '<button class="btn" data-act="backup">Backup (JSON)</button><label class="btn">Restore<input type="file" id="restore" accept="application/json,.json" hidden></label></div></div>' +
      '<h2>Reset</h2><div class="card"><button class="btn bad block" data-act="reset">Clear all progress on this device</button></div>';
  }
  function afterMore(sub) {
    if (sub === 'runbook') {
      $('#reupload').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        toast('Reading ' + f.name + '…');
        window.loadRunbookFile(f).then(function () { location.hash = '#home'; location.reload(); }, function (err) { toast(err.message || 'Could not read that file'); });
      });
    }
    if (sub === 'contacts') {
      var q = $('#cq');
      q.addEventListener('input', debounce(function () { $('#clist').innerHTML = contactsHTML(q.value); }, 150));
    }
    if (sub === 'data') {
      $('#who').addEventListener('input', debounce(function (e) { S.who = e.target.value.trim(); save(); }, 300));
      $('#restore').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var o = JSON.parse(rd.result);
            if (!o || typeof o !== 'object' || !o.tasks) throw new Error('bad');
            if (!confirm('Replace progress on this device with the backup?')) return;
            S = Object.assign(defaults(), o); save(); toast('Backup restored'); rerender();
          } catch (err) { toast('That file is not a DC Shift backup'); }
        };
        rd.readAsText(f);
      });
    }
  }

  /* ---------------- share / export ---------------- */
  function statusText() {
    var n = now(), c = counts(tasks), L = [];
    L.push('*' + R.title + '* — status ' + fDT(n));
    L.push('Decision: ' + (S.decision === 'GO' ? 'GO' : S.decision === 'NOGO' ? 'NO-GO' : 'Pending'));
    L.push('Tasks: ' + c.closed + '/' + c.total + ' done, ' + c['In Progress'] + ' in progress, ' + c.Blocked + ' blocked, ' + c.overdue + ' behind plan');
    var dv = devices.filter(function (d) { return dStage(d) === STAGES.length - 1; }).length;
    L.push('Devices validated: ' + dv + '/' + devices.length);
    L.push('');
    gates.forEach(function (g) {
      var gt = tasks.filter(function (t) { return t.gate === g; }), gc = counts(gt);
      var cur = gt.filter(function (t) { return tStatus(t) === 'In Progress'; }).map(function (t) { return t.id; });
      L.push(g + ': ' + gc.closed + '/' + gc.total + (cur.length ? ' · now ' + cur.join(', ') : '') + (gc.Blocked ? ' · ' + gc.Blocked + ' BLOCKED' : ''));
    });
    var bl = tasks.filter(function (t) { return tStatus(t) === 'Blocked'; });
    if (bl.length) {
      L.push(''); L.push('Blocked:');
      bl.forEach(function (t) { L.push('- ' + t.id + ' ' + firstLine(t.desc) + (tState(t).note ? ' — ' + tState(t).note : '')); });
    }
    return L.join('\n');
  }
  function shareText(text, title) {
    if (navigator.share) { navigator.share({ title: title, text: text }).catch(function () {}); return; }
    copy(text);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('Copied to clipboard'); }, function () { fallbackCopy(text); });
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied to clipboard'); } catch (e) { toast('Copy failed'); }
    ta.remove();
  }
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function tasksCSV() {
    var rows = [['Gate', 'Task ID', 'Location', 'Description', 'Responsible Team', 'Planned Start', 'Planned End', 'Planned Minutes', 'Status', 'Actual Start', 'Actual End', 'Dependencies', 'Note']];
    tasks.forEach(function (t) {
      var st = tState(t);
      rows.push([t.gate, t.id, t.loc, t.desc.replace(/\\n/g, ' '), t.team, fDT(t.s), fDT(t.e), t.dur, tStatus(t),
        st.aStart ? fDT(new Date(st.aStart)) : '', st.aEnd ? fDT(new Date(st.aEnd)) : '', t.deps, st.note || '']);
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }
  function stamp() { var n = now(); return n.getFullYear() + pad(n.getMonth() + 1) + pad(n.getDate()) + '-' + pad(n.getHours()) + pad(n.getMinutes()); }

  /* ---------------- Excel export ---------------- */
  var exporting = false;
  function exportExcel() {
    if (exporting) return;
    exporting = true;
    toast('Building Excel…');
    setTimeout(function () {
      window.exportUpdatedExcel(R, S).then(function (res) {
        exporting = false;
        S.exportedAt = new Date().toISOString();
        log('Exported ' + res.name);
        save();
        showExport(res);
      }, function (err) {
        exporting = false;
        if (err && err.needOriginal) return askOriginal();
        toast((err && err.message) || 'Export failed');
      });
    }, 30);
  }
  function showExport(res) {
    $('#toast').hidden = true;
    var url = URL.createObjectURL(res.blob);
    var file = typeof File !== 'undefined' ? new File([res.blob], res.name, { type: res.blob.type }) : null;
    var canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    openSheet('<h3>Excel ready</h3><p class="small muted" style="margin-top:2px">' + esc(res.name) + '</p>' +
      '<div class="card small" style="background:var(--chip);border:0">' + res.summary.map(esc).join(' · ') + '</div>' +
      '<div class="btn-grid"><a class="btn primary" href="' + url + '" download="' + esc(res.name) + '">Download</a>' +
      (canShare ? '<button class="btn" id="shareXlsx">Share…</button>' : '<span></span>') + '</div>' +
      '<p class="small muted">Re-uploading this file later (here or on another phone) brings the progress back.</p>', function () {
      var b = $('#shareXlsx');
      if (b) b.addEventListener('click', function () { navigator.share({ files: [file], title: res.name }).catch(function () {}); });
    });
  }
  function askOriginal() {
    openSheet('<h3>Original runbook needed</h3><p class="small muted">This device has the runbook data but not the original Excel file (it was loaded with an older version of the app). Pick the same runbook .xlsx once — your progress is kept — and the export will continue.</p>' +
      '<label class="btn primary block">Choose runbook file<input type="file" id="origFile" accept=".xlsx,.xlsm" hidden></label>', function () {
      $('#origFile').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        window.attachOriginalFile(f, R).then(function () { closeSheet(); exportExcel(); }, function (err) { toast(err.message || 'Could not use that file'); });
      });
    });
  }

  /* ---------------- global search ---------------- */
  function openSearch() {
    openSheet('<input class="search" type="search" id="gq" placeholder="Search tasks, devices, contacts…" autocomplete="off"><div id="gres" class="small muted" style="padding:8px 2px">Type a hostname, serial, IP, rack, task ID or name.</div>', function () {
      var q = $('#gq'); setTimeout(function () { q.focus(); }, 50);
      q.addEventListener('input', debounce(function () {
        var v = q.value.toLowerCase().trim(), out = $('#gres');
        if (v.length < 2) { out.innerHTML = 'Type at least 2 characters.'; return; }
        var tl = tasks.filter(function (t) { return (t.id + ' ' + t.desc + ' ' + t.team).toLowerCase().indexOf(v) >= 0; }).slice(0, 8);
        var dl = devices.filter(function (d) { return d.hay.indexOf(v) >= 0; }).slice(0, 15);
        var cl = R.contacts.filter(function (c) { return (c.name + c.role + c.phone + c.email).toLowerCase().indexOf(v) >= 0; }).slice(0, 6);
        var h = '';
        if (tl.length) h += '<div class="section-t">Tasks</div><div class="list">' + tl.map(function (t) {
          return '<div class="li" data-task-link="' + esc(t.id) + '"><div class="grow"><div class="title">' + esc(t.id) + ' ' + pill(tStatus(t)) + '</div><div class="sub">' + esc(firstLine(t.desc)) + '</div></div></div>';
        }).join('') + '</div>';
        if (dl.length) h += '<div class="section-t">Devices</div><div class="list">' + dl.map(function (d) {
          return '<div class="li" data-dev="' + esc(d.key) + '"><div class="grow"><div class="title">' + esc(d.name) + '</div><div class="sub">B' + esc(d.batch) + ' · ' + esc(d.serial) + ' · ' + esc(d.srcRack) + ' → ' + esc(d.dstRack) + '</div></div>' + stageDots(d) + '</div>';
        }).join('') + '</div>';
        if (cl.length) h += '<div class="section-t">People</div><div class="card" style="padding:4px 14px">' + cl.map(function (c) {
          return '<div class="contact"><b>' + esc(c.name) + '</b> <span class="small muted">' + esc(c.role) + '</span>' + contactLinks(c.phone + ' ' + c.email) + '</div>';
        }).join('') + '</div>';
        out.innerHTML = h || '<div class="empty">No matches.</div>';
        out.classList.remove('small', 'muted');
      }, 150));
    });
  }

  /* ---------------- sheet ---------------- */
  var sheet = $('#sheet'), backdrop = $('#sheetBackdrop'), sheetOpen = false;
  function openSheet(html, after) {
    $('#sheetBody').innerHTML = html;
    $('#sheetBody').scrollTop = 0;
    sheet.hidden = false; backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
    if (after) after();
  }
  function closeSheet(fromNav) {
    if (sheet.hidden) return;
    sheet.hidden = true; backdrop.hidden = true;
    document.body.style.overflow = '';
    if (sheetOpen && !fromNav) { sheetOpen = false; history.back(); return; }
    sheetOpen = false;
  }
  backdrop.addEventListener('click', function () { closeSheet(); rerender(); });
  window.addEventListener('popstate', function () {
    if (sheetOpen) { sheetOpen = false; closeSheet(true); rerender(); }
  });
  // Swipe the sheet down to dismiss.
  (function () {
    var y0 = null, dy = 0, body = $('#sheetBody');
    sheet.addEventListener('touchstart', function (e) { if (body.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (y0 == null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    sheet.addEventListener('touchend', function () {
      sheet.style.transform = '';
      if (y0 != null && dy > 110) { closeSheet(); rerender(); }
      y0 = null;
    });
  })();

  /* ---------------- events ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-quick],[data-task],[data-task-link],[data-dev],[data-go],[data-gate],[data-tstatus],[data-sort],[data-dbatch],[data-dstage],[data-dmore],[data-setstatus],[data-stage],[data-bulk],[data-bulkset],[data-decision],[data-gotoggle],[data-pretoggle],[data-act]');
    if (!el) return;
    var ds = el.dataset;
    if (ds.quick) {
      e.stopPropagation();
      var t = taskById[ds.quick], s = tStatus(t);
      if (s === 'Open') { setTaskStatus(t, 'In Progress'); toast(t.id + ' started'); rerender(); }
      else if (s === 'In Progress') { setTaskStatus(t, 'Done'); toast(t.id + ' done'); rerender(); }
      else openTask(t.id);
      return;
    }
    if (ds.task) return openTask(ds.task);
    if (ds.taskLink) { e.preventDefault(); return openTask(ds.taskLink); }
    if (ds.dev) return openDevice(ds.dev);
    if (ds.go) { location.hash = ds.go; return; }
    if (ds.gate) { ui.gate = ds.gate; return renderTasks('', true); }
    if (ds.tstatus) { ui.status = ds.tstatus; return renderTasks('', true); }
    if (ds.sort) { ui.sort = ui.sort === 'batch' ? 'time' : 'batch'; return renderTasks('', true); }
    if (ds.dbatch) { ui.dBatch = ds.dbatch; ui.dLimit = PAGE; return renderDevices('', true); }
    if (ds.dstage) { ui.dStage = ds.dstage; ui.dLimit = PAGE; return renderDevices('', true); }
    if (ds.dmore) { ui.dLimit += PAGE * 2; return renderDevices('', true); }
    if (ds.setstatus) { setTaskStatus(taskById[ds.id], ds.setstatus); return openTask(ds.id); }
    if (ds.stage) {
      var d = devBySn[ds.sn], i = +ds.stage;
      if (i >= 0 && dStage(d) === i) i = i - 1; // tapping the current last stage steps back
      setStage(d, i); return openDevice(d.key);
    }
    if (ds.bulk) return openBulk(ds.bulk);
    if (ds.bulkset) {
      var b = ds.b, k = +ds.bulkset;
      devices.forEach(function (x) { if (x.batch === b) setStage(x, k, true); });
      log('Batch ' + b + ' devices → ' + (k < 0 ? 'reset' : STAGES[k])); save();
      toast('Batch ' + b + ' updated'); return openBulk(b);
    }
    if (ds.decision !== undefined) {
      S.decision = ds.decision; S.decisionAt = new Date().toISOString(); S.decisionBy = S.who;
      log('GO/NO-GO decision: ' + (ds.decision === 'NOGO' ? 'NO-GO' : ds.decision || 'pending')); save(); return rerender();
    }
    if (ds.gotoggle) {
      var gi = ds.gotoggle, cur = S.go[gi] || {};
      S.go[gi] = cur.signed ? {} : { signed: true, at: new Date().toISOString() };
      log('Sign-off ' + (cur.signed ? 'withdrawn' : 'received') + ': ' + R.gonogo[gi].item); save(); return rerender();
    }
    if (ds.pretoggle) {
      var p = R.pre.filter(function (x) { return x.id === ds.pretoggle; })[0];
      S.pre[p.id] = preStatus(p) === 'Closed' ? 'Open' : 'Closed';
      S.preAt = S.preAt || {};
      if (S.pre[p.id] === 'Closed') S.preAt[p.id] = new Date().toISOString(); else delete S.preAt[p.id];
      log('Pre-event ' + p.id + ' → ' + S.pre[p.id]); save(); return rerender();
    }
    switch (ds.act) {
      case 'xlsx': return exportExcel();
      case 'share': return shareText(statusText(), 'DC Shift status');
      case 'csv': return download('dcshift-tasks-' + stamp() + '.csv', tasksCSV(), 'text/csv');
      case 'backup': return download('dcshift-backup-' + stamp() + '.json', JSON.stringify(S, null, 1), 'application/json');
      case 'unload':
        if (confirm('Remove the runbook data from this device? You will need to upload it again.')) { window.forgetRunbook().then(function () { history.replaceState(null, '', location.pathname); try { localStorage.removeItem(ROUTE_KEY); } catch (e) { /* ignore */ } location.reload(); }); }
        return;
      case 'reset':
        if (confirm('Clear all task, device and checklist progress on this device?')) { var who = S.who; S = defaults(); S.who = who; save(); toast('Progress cleared'); rerender(); }
        return;
      case 'addlog':
        var v = $('#lognew').value.trim(); if (!v) return;
        log(v); save(); return rerender();
      case 'sharelog':
        return shareText(S.log.map(function (l) { return fDT(new Date(l.t)) + ' ' + l.m + (l.by ? ' — ' + l.by : ''); }).join('\n'), 'DC Shift log');
    }
  });
  $('#searchBtn').addEventListener('click', openSearch);
  window.addEventListener('hashchange', route);

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

  /* ---------------- clock ---------------- */
  var kick = taskById['EVT-01'] && taskById['EVT-01'].s;
  function tick() {
    var n = now(), txt = fDay(n) + ' ' + fTime(n);
    if (kick) {
      var m = (kick - n) / 60000;
      txt += m > 0 ? ' · cutover starts in ' + fDur(m) : ' · T+' + fDur(-m);
    }
    $('#clock').textContent = txt;
  }
  tick(); setInterval(tick, 30000);

  $('.brand-title').textContent = R.short || 'DC Shift';
  document.title = (R.short || 'DC Shift') + ' Runbook';
  function measure() { document.documentElement.style.setProperty('--topbar-h', $('.topbar').offsetHeight + 'px'); }
  measure(); window.addEventListener('resize', measure);

  if (!location.hash) {
    var last = null;
    try { last = localStorage.getItem(ROUTE_KEY); } catch (e) { /* ignore */ }
    if (last && last !== '#home') history.replaceState(null, '', last);
  }
  route();

};
