/* CBS Shift runbook app. R is the model built by parser.js from the uploaded runbook; progress is kept on the device. */
window.startRunbookApp = function (R, meta) {
  'use strict';

  var C = window.CBS;
  var KEY = 'cbsshift.progress.v1';
  var ROUTE_KEY = 'cbsshift.lastRoute';
  var STATUSES = C.TASK_STATUSES;
  var MIG = C.MIG_STATES, SHUT = C.SHUT_STATES, TRUCK = C.TRUCK_STATES;
  var PAGE = 60;
  var DONE_WORDS = /^(y|yes|done|closed|completed|go|validated|arrived|unloaded|powered off|os down|not applicable|not required|mitigated|accepted)$/i;

  /* ---------------- state ---------------- */
  function defaults() { return { tasks: {}, dev: {}, sh: {}, log: [], who: '' }; }
  var S = (function () {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return defaults(); }
  })();
  if (!S.log.length && R.log && R.log.length) S.log = R.log.slice();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save on this device'); } }
  function log(msg) {
    S.log.unshift({ t: new Date().toISOString(), m: msg, by: S.who || '' });
    if (S.log.length > 2000) S.log.length = 2000;
  }

  /* ---------------- data prep ---------------- */
  var tasks = R.tasks.map(function (t, i) {
    var st = t.start ? new Date(t.start) : null;
    var en = t.end ? new Date(t.end) : (st ? new Date(st.getTime() + t.dur * 60000) : null);
    return Object.assign({}, t, { idx: i, s: st, e: en });
  });
  var taskById = {};
  tasks.forEach(function (t) { taskById[t.id] = t; });
  var gates = [];
  tasks.forEach(function (t) { if (gates.indexOf(t.gate) < 0) gates.push(t.gate); });

  var devices = R.devices.map(function (row, i) {
    var o = { idx: i };
    R.devKeys.forEach(function (k, j) { o[k] = row[j]; });
    o.kind = /lpar/i.test(o.hw) ? 'AIX LPAR' : /vm|virtual/i.test(o.hw) ? 'Hyper-V VM' : 'Physical';
    o.virtual = o.kind !== 'Physical';
    o.name = !isNA(o.host) ? o.host : (o.model || o.type || 'Device') + (isNA(o.serial) ? '' : ' · ' + o.serial);
    o.hay = [o.host, o.serial, o.subSerial, o.ip, o.mgmtIp, o.srcRack, o.dstRack, o.model, o.type, o.app, o.appGroup, o.phys, o.truck, o.kind]
      .join(' ').toLowerCase();
    return o;
  });
  var devByKey = {};
  devices.forEach(function (d) { devByKey[d.key] = d; });
  var batches = [];
  devices.forEach(function (d) { if (d.batch && batches.indexOf(d.batch) < 0) batches.push(d.batch); });
  batches.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
  var KINDS = ['Physical', 'AIX LPAR', 'Hyper-V VM'];

  var cfgById = {};
  C.CONFIG.forEach(function (c) { cfgById[c.id] = c; });
  var truckRow = {};
  ((R.sheets.trucks || {}).rows || []).forEach(function (r) { truckRow[r.key] = r; });
  var trucks = R.trucks;

  /* ---------------- helpers ---------------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl(v) { return esc(v).replace(/\\n|\n/g, '<br>'); }
  function isNA(v) { return C.isNA(v); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fTime(d) { return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '—'; }
  function fDay(d) { return d ? d.getDate() + ' ' + MON[d.getMonth()] : ''; }
  function fDT(d) { return d ? fDay(d) + ' ' + fTime(d) : '—'; }
  // "2026-10-24 12:30" (sheet text) or ISO → Date
  function toDate(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    var d = new Date(s);
    return isNaN(d) ? null : d;
  }
  function fAny(s) { var d = toDate(s); return d ? fDT(d) : esc(s); }
  function fDur(min) {
    min = Math.round(min);
    var neg = min < 0; min = Math.abs(min);
    var h = Math.floor(min / 60), m = min % 60;
    var s = h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm';
    return (neg ? '-' : '') + s;
  }
  function stKey(s) { return String(s).replace(/[^A-Za-z]/g, ''); }
  function pill(s) { return '<span class="pill st-' + stKey(s) + '">' + esc(s) + '</span>'; }
  function now() { return new Date(); }
  function nowIso() { return new Date().toISOString(); }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function stat(v, l, go) { return '<div class="stat"' + (go ? ' data-go="' + go + '" style="cursor:pointer"' : '') + '><b>' + v + '</b><span>' + l + '</span></div>'; }
  function of(n, d) { return n + '<small class="muted" style="font-size:14px">/' + d + '</small>'; }
  function kv(k, v) { return '<div>' + esc(k) + '</div><div>' + v + '</div>'; }
  function splitLines(s) { return String(s || '').split(/\\n|\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function firstLine(s) { return String(s).split(/\\n|\n/)[0]; }
  var ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    dash: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>'
  };

  // Turn "Name | 9505935000 | someone@bank.com" into tap-to-call / tap-to-mail chips.
  function contactLinks(str) {
    if (!str) return '';
    var out = [], seen = {};
    String(str).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, function (m) {
      if (!seen[m.toLowerCase()]) { seen[m.toLowerCase()] = 1; out.push('<a href="mailto:' + esc(m) + '">✉ ' + esc(m) + '</a>'); }
      return ' ';
    }).replace(/(\+?91[\s-]?)?\d[\d\s-]{8,12}\d/g, function (m) {
      var n = m.replace(/[^\d+]/g, '');
      if (n.length >= 10 && n.length <= 13 && !seen[n]) { seen[n] = 1; out.push('<a href="tel:' + esc(n) + '">☎ ' + esc(n) + '</a>'); }
      return m;
    });
    return out.length ? '<div class="links">' + out.join('') + '</div>' : '';
  }
  function bar(c) {
    var tot = c.total || 1;
    return '<div class="bar" role="img" aria-label="' + c.closed + ' of ' + c.total + ' complete">' +
      '<i class="d" style="width:' + (c.closed / tot * 100) + '%"></i>' +
      '<i class="p" style="width:' + ((c['In Progress'] || 0) / tot * 100) + '%"></i>' +
      '<i class="b" style="width:' + ((c.Blocked || 0) / tot * 100) + '%"></i></div>';
  }

  /* ---------------- generic sheet values ---------------- */
  function shRows(id) { return (R.sheets[id] || {}).rows || []; }
  function shVal(id, row, label) {
    var n = C.norm(label), e = S.sh[id] && S.sh[id][row.key];
    if (e && n in e) return e[n];
    return row.v[n] || '';
  }
  function setSh(id, key, label, value, quiet) {
    var n = C.norm(label);
    var t = S.sh[id] || (S.sh[id] = {});
    var e = t[key] || (t[key] = {});
    e[n] = value;
    if (!quiet) log((cfgById[id] ? cfgById[id].title : id) + ' · ' + key.split('|')[0] + ' · ' + label + ' → ' + (value ? (/^\d{4}-\d{2}-\d{2}T/.test(value) ? fDT(new Date(value)) : value) : 'cleared'));
    save();
  }

  /* ---------------- tasks ---------------- */
  function tState(t) { return S.tasks[t.id] || { status: t.status, aStart: t.aStart, aEnd: t.aEnd, note: t.note }; }
  function tEdit(t) { if (!S.tasks[t.id]) S.tasks[t.id] = Object.assign({}, tState(t)); return S.tasks[t.id]; }
  function tStatus(t) { return tState(t).status || 'Open'; }
  function isClosed(s) { return s === 'Done' || s === 'N/A'; }
  function isOverdue(t, n) { return t.e && !isClosed(tStatus(t)) && t.e < (n || now()); }
  function setTaskStatus(t, status) {
    var st = tEdit(t);
    if ((st.status || 'Open') === status) return;
    st.status = status;
    var ts = nowIso();
    if (status === 'In Progress' && !st.aStart) st.aStart = ts;
    if (status === 'Done') { if (!st.aStart) st.aStart = ts; st.aEnd = ts; }
    if (status === 'Open') { st.aStart = ''; st.aEnd = ''; }
    if (status !== 'Done' && status !== 'Open') st.aEnd = '';
    log(t.id + ' → ' + status);
    save();
  }
  function counts(list) {
    var c = { total: list.length, Open: 0, 'In Progress': 0, Done: 0, Blocked: 0, 'N/A': 0, overdue: 0 };
    var n = now();
    list.forEach(function (t) { c[tStatus(t)] = (c[tStatus(t)] || 0) + 1; if (isOverdue(t, n)) c.overdue++; });
    c.closed = c.Done + c['N/A'];
    return c;
  }
  function byStart(a, b) { return (a.s ? a.s.getTime() : 0) - (b.s ? b.s.getTime() : 0) || a.idx - b.idx; }

  /* ---------------- devices ---------------- */
  function dMig(d) { var x = S.dev[d.key]; return (x && x.mig) || d.mig || 'Pending'; }
  function dShut(d) { var x = S.dev[d.key]; return (x && x.shut) || d.shut || 'Pending'; }
  function setDev(d, field, value, quiet) {
    var x = S.dev[d.key] || (S.dev[d.key] = {});
    x[field] = value; x.at = nowIso();
    if (!quiet) { log(d.name + ' · ' + (field === 'mig' ? 'movement' : 'shutdown') + ' → ' + value); save(); }
  }
  function migIdx(s) { return MIG.indexOf(s); }
  // cabling & labelling (physical devices)
  function dCab(d, f) { var x = S.dev[d.key]; if (x && f in x) return x[f] == null ? '' : x[f]; return d[f] == null ? '' : d[f]; }
  function dLbl(d) { var x = S.dev[d.key]; if (x && x.lbl != null) return !!x.lbl; return /^y/i.test(d.lbl || ''); }
  function cabled(d) { return dCab(d, 'cu') !== '' || dCab(d, 'fc') !== ''; }
  function setCab(d, f, v) { var x = S.dev[d.key] || (S.dev[d.key] = {}); x[f] = v; x.at = nowIso(); save(); }
  function uFmt(u) { return u && !isNA(u) ? (/^u/i.test(String(u).trim()) ? '' : 'U') + String(u).trim() : ''; }
  function uTop(u) { var n = String(u || '').match(/\d+/g); return n ? Math.max.apply(null, n.map(Number)) : -1; }
  function rackSort(a, b) { return a.localeCompare(b, undefined, { numeric: true }); }
  function cabCtl(d) {
    var k = esc(d.key);
    function num(f, label) {
      return '<div class="cab"><span>' + label + '</span><div class="stepper-n"><button class="mini" data-cabstep="' + f + '" data-step="-1" data-key="' + k + '" aria-label="Fewer ' + label + '">−</button>' +
        '<input class="cab-in" type="number" inputmode="numeric" min="0" placeholder="–" data-cabin="' + f + '" data-key="' + k + '" value="' + esc(dCab(d, f)) + '">' +
        '<button class="mini" data-cabstep="' + f + '" data-step="1" data-key="' + k + '" aria-label="More ' + label + '">+</button></div></div>';
    }
    return '<div class="cab-row">' + num('cu', 'Copper') + num('fc', 'FC') +
      '<button class="lblb' + (dLbl(d) ? ' on' : '') + '" data-lbl="' + k + '" aria-pressed="' + dLbl(d) + '">' + ICON.check + '<span>Label</span></button></div>';
  }

  /* ---------------- trucks ---------------- */
  function tkVal(tr, label) { var r = truckRow[tr.id]; return r ? shVal('trucks', r, label) : ''; }
  function tkSet(tr, label, value, quiet) { if (truckRow[tr.id]) setSh('trucks', tr.id, label, value, quiet); }
  function tkStatus(tr) { return tkVal(tr, 'Status') || 'Planned'; }
  function arrived(s) { return /^(arrived|unloaded|closed)$/i.test(s); }

  /* ---------------- GO / NO-GO ---------------- */
  function decisionOf(rows) {
    var vals = rows.map(function (r) { return (shVal('gonogo', r, 'GO / NO-GO') || 'Pending').toUpperCase(); });
    if (!vals.length) return 'PENDING';
    if (vals.some(function (v) { return v === 'NO-GO'; })) return 'NO-GO';
    if (vals.some(function (v) { return v !== 'GO'; })) return 'PENDING';
    return 'GO';
  }
  function decClass(d) { return d === 'GO' ? 'go' : d === 'NO-GO' ? 'nogo' : 'pending'; }

  /* ---------------- routing ---------------- */
  var view = $('#view');
  var ui = { gate: 'All', status: 'All', q: '', sort: 'batch', dBatch: 'All', dKind: 'All', dState: 'All', dView: 'mig', dq: '', dLimit: PAGE,
    tBatch: 'All', g: {}, dMode: 'list', rSide: 'src', rBatch: 'All', rq: '' };
  var RENDER = { home: renderHome, tasks: renderTasks, trucks: renderTrucks, devices: renderDevices, cables: renderCables, more: renderMore };

  function route() {
    try { localStorage.setItem(ROUTE_KEY, location.hash || '#home'); } catch (e) { /* ignore */ }
    var h = (location.hash || '#home').slice(1).split('/');
    var tab = h[0] || 'home';
    $$('#tabbar a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });
    closeSheet(true);
    (RENDER[tab] || renderHome)(h.slice(1).map(decodeURIComponent));
    window.scrollTo(0, 0);
  }
  function rerender() {
    var y = window.scrollY;
    var h = (location.hash || '#home').slice(1).split('/');
    (RENDER[h[0]] || renderHome)(h.slice(1).map(decodeURIComponent), true);
    window.scrollTo(0, y);
  }

  /* ---------------- HOME ---------------- */
  function renderHome() {
    var n = now(), c = counts(tasks);
    var go = shRows('gonogo');
    var dec = decisionOf(go);
    var signed = go.filter(function (r) { return /^y/i.test(shVal('gonogo', r, 'Sign-off Received')); }).length;
    var phys = devices.filter(function (d) { return !d.virtual; });
    var valid = phys.filter(function (d) { return dMig(d) === 'Validated'; }).length;
    var moving = phys.filter(function (d) { var i = migIdx(dMig(d)); return i > 0 && dMig(d) !== 'Validated'; }).length;
    var down = devices.filter(function (d) { return /powered off|os down/i.test(dShut(d)); }).length;
    var tArr = trucks.filter(function (t) { return arrived(tkStatus(t)); }).length;
    var tMove = trucks.filter(function (t) { return /in transit/i.test(tkStatus(t)); }).length;
    var issues = shRows('issues').filter(function (r) { return shVal('issues', r, 'Issue Summary') && !/closed/i.test(shVal('issues', r, 'Issue Status')); }).length;
    var w = R.wave || {};

    var h = '<div class="card decision" data-go="#more/s/gonogo" style="cursor:pointer">' +
      '<div style="flex:1"><div class="muted small">' + esc(w.name || 'CBS wave') + ' · GO / NO-GO</div>' +
      '<div class="big ' + decClass(dec) + '">' + dec + '</div>' +
      '<div class="muted small">' + signed + ' of ' + go.length + ' gates signed off' + (w.start ? ' · window ' + fAny(w.start) + ' → ' + fAny(w.end) : '') + '</div></div>' +
      '<span class="chev">' + ICON.chev + '</span></div>';

    h += '<div class="stats">' +
      stat(of(c.closed, c.total), 'Tasks complete', '#tasks') +
      stat(c['In Progress'], 'In progress', '#tasks/Active') +
      stat('<span style="color:var(--block)">' + c.Blocked + '</span>', 'Blocked', '#tasks/Blocked') +
      stat('<span style="color:' + (c.overdue ? 'var(--warn)' : 'inherit') + '">' + c.overdue + '</span>', 'Behind plan', '#tasks/overdue') +
      stat(of(tArr, trucks.length), 'Trucks arrived', '#trucks') +
      stat(tMove, 'Trucks on the road', '#trucks') +
      stat(of(valid, phys.length), 'Physical validated', '#devices') +
      stat(moving, 'Physical in flight', '#devices') +
      stat(of(down, devices.length), 'Devices shut down', '#devices') +
      stat('<span style="color:' + (issues ? 'var(--block)' : 'inherit') + '">' + issues + '</span>', 'Open issues', '#more/s/issues') +
      '</div>';

    h += '<h2>Batches</h2>';
    gates.forEach(function (g) {
      var gt = tasks.filter(function (t) { return t.gate === g; }), gc = counts(gt);
      var b = /^Batch (.+)$/.exec(g), wb = b ? (w.batches || []).filter(function (x) { return x.batch === b[1]; })[0] : null;
      var bt = b ? trucks.filter(function (t) { return t.batch === b[1]; }) : [];
      var bd = b ? phys.filter(function (d) { return d.batch === b[1]; }) : [];
      h += '<div class="card" data-go="#tasks/' + encodeURIComponent(g) + '" style="cursor:pointer"><div class="row"><b>' + esc(g) + '</b><span class="spacer"></span>' +
        '<span class="small muted">' + gc.closed + '/' + gc.total + ' tasks' + (gc.Blocked ? ' · <span style="color:var(--block)">' + gc.Blocked + ' blocked</span>' : '') + '</span></div>' +
        (wb ? '<div class="small muted" style="margin:2px 0 6px">' + esc(wb.theme.replace(/^Batch \d+\s*–\s*/, '')) + '<br>' + fAny(wb.start) + ' → ' + fAny(wb.end) + '</div>' : '') +
        bar(gc) +
        (b ? '<div class="row wrap small muted" style="margin-top:6px"><span>' + ICON.truck.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-3px"') + ' ' +
          bt.filter(function (t) { return arrived(tkStatus(t)); }).length + '/' + bt.length + ' arrived</span><span>· ' +
          bd.filter(function (d) { return dMig(d) === 'Validated'; }).length + '/' + bd.length + ' physical validated</span></div>' : '') +
        '</div>';
    });

    var active = tasks.filter(function (t) { return tStatus(t) === 'In Progress' || tStatus(t) === 'Blocked'; });
    var due = tasks.filter(function (t) { return tStatus(t) === 'Open' && t.s && t.s <= n && t.e > n; });
    var now1 = active.concat(due).sort(byStart);
    h += '<h2>Happening now</h2>' + (now1.length ? now1.slice(0, 10).map(taskCard).join('') +
      (now1.length > 10 ? '<a class="btn block" href="#tasks/Active">See all</a>' : '') : '<div class="card empty">Nothing in progress right now.</div>');

    var od = tasks.filter(function (t) { return isOverdue(t, n) && tStatus(t) === 'Open'; }).sort(byStart);
    if (od.length) h += '<h2>Behind plan (' + od.length + ')</h2>' + od.slice(0, 5).map(taskCard).join('') +
      (od.length > 5 ? '<a class="btn block" href="#tasks/overdue">See all ' + od.length + ' overdue tasks</a>' : '');

    var next = tasks.filter(function (t) { return t.s && t.s > n && tStatus(t) === 'Open'; }).sort(byStart).slice(0, 5);
    h += '<h2>Up next</h2>' + (next.length ? next.map(taskCard).join('') : '<div class="card empty">No upcoming tasks.</div>');

    var chk = tasks.filter(function (t) { return t.chk && !isClosed(tStatus(t)); }).sort(byStart).slice(0, 6);
    if (chk.length) h += '<h2>Next checkpoints</h2><div class="list">' + chk.map(function (t) {
      return '<div class="li" data-task="' + esc(t.id) + '"><div class="grow"><div class="title">' + esc(t.chk) + '</div><div class="sub">' + esc(t.id) + ' · ' + fDT(t.s) + ' · ' + esc(firstLine(t.desc)) + '</div></div>' + pill(tStatus(t)) + '</div>';
    }).join('') + '</div>';

    h += '<div class="btn-grid" style="margin-top:16px"><button class="btn primary" data-act="xlsx">Export Excel</button><button class="btn" data-act="share">Share status</button></div>' +
      (S.exportedAt ? '<p class="small muted" style="text-align:center">Last Excel export ' + fDT(new Date(S.exportedAt)) + '</p>' : '');
    view.innerHTML = h;
  }

  function taskCard(t) {
    var s = tStatus(t), st = tState(t), k = stKey(s);
    var icon = s === 'Done' ? ICON.check : s === 'In Progress' ? ICON.check : s === 'Blocked' ? ICON.x : s === 'N/A' ? ICON.dash : ICON.play;
    return '<div class="task s-' + k + '" data-task="' + esc(t.id) + '">' +
      '<div class="t-main"><div class="t-top"><span class="t-id">' + esc(t.id) + '</span>' +
      '<span class="t-time">' + (t.s ? fDay(t.s) + ' ' + fTime(t.s) + '–' + fTime(t.e) : '') + ' · ' + fDur(t.dur) + '</span>' +
      (s !== 'Open' ? pill(s) : '') + (isOverdue(t) ? '<span class="tag late">late</span>' : '') + (t.truck ? '<span class="tag">' + esc(t.truck) + '</span>' : '') +
      (t.chk ? '<span class="tag warn">' + esc(t.chk.split(/[:\s]/)[0]) + '</span>' : '') + (st.note ? '<span class="tag">note</span>' : '') +
      '</div><div class="t-desc">' + nl(firstLine(t.desc)) + '</div>' +
      '<div class="t-team">' + esc(t.loc) + ' · ' + esc(t.team) + '</div></div>' +
      '<button class="qbtn s-' + k + '" data-quick="' + esc(t.id) + '" aria-label="' +
      (s === 'Open' ? 'Start task' : s === 'In Progress' ? 'Mark done' : 'Change status') + '">' + icon + '</button></div>';
  }

  /* ---------------- TASKS ---------------- */
  function renderTasks(args, keep) {
    var arg = args && args[0];
    if (!keep && arg) {
      if (arg === 'overdue') { ui.status = 'Overdue'; ui.gate = 'All'; }
      else if (arg === 'Active' || arg === 'Blocked') { ui.status = arg; ui.gate = 'All'; }
      else if (gates.indexOf(arg) >= 0) { ui.gate = arg; ui.status = 'All'; }
    }
    var q = ui.q.toLowerCase(), n = now();
    var list = tasks.filter(function (t) {
      if (ui.gate !== 'All' && t.gate !== ui.gate) return false;
      var s = tStatus(t);
      if (ui.status === 'Overdue') { if (!isOverdue(t, n)) return false; }
      else if (ui.status === 'Active') { if (s !== 'In Progress' && s !== 'Blocked') return false; }
      else if (ui.status !== 'All' && s !== ui.status) return false;
      if (q && (t.id + ' ' + t.desc + ' ' + t.team + ' ' + t.loc + ' ' + t.app + ' ' + t.appGroup + ' ' + t.truck + ' ' + t.comments).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var h = '<div class="sticky-tools"><input class="search" type="search" id="tq" placeholder="Search tasks, teams, apps, trucks…" value="' + esc(ui.q) + '">' +
      '<div class="chips">' + ['All'].concat(gates).map(function (g) {
        return '<button class="chip' + (ui.gate === g ? ' on' : '') + '" data-gate="' + esc(g) + '">' + esc(g) + '</button>';
      }).join('') + '</div>' +
      '<div class="chips">' + ['All', 'Active', 'Open', 'In Progress', 'Done', 'Blocked', 'Overdue'].map(function (s) {
        return '<button class="chip' + (ui.status === s ? ' on' : '') + '" data-tstatus="' + s + '">' + s + '</button>';
      }).join('') +
      '<span style="flex:none;width:8px"></span><button class="chip" data-sort="1">' + (ui.sort === 'batch' ? 'By section' : 'By time') + ' ⇅</button></div></div>';

    if (!list.length) h += '<div class="empty">No tasks match.</div>';
    else if (ui.sort === 'time') {
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
        var sec = gl[0].section;
        if (sec && sec !== g) h += '<div class="small muted" style="margin:-4px 2px 8px">' + esc(sec) + '</div>';
        var ph = null;
        gl.forEach(function (t) {
          if (t.phase !== ph) { ph = t.phase; if (ph) h += '<div class="phase-h">' + esc(ph) + '</div>'; }
          h += taskCard(t);
        });
      });
    }
    view.innerHTML = h;
    var inp = $('#tq');
    inp.addEventListener('input', debounce(function () { ui.q = inp.value; renderTasks(null, true); refocus('#tq'); }, 200));
  }
  function refocus(sel) { var n = $(sel); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }

  function openTask(id) {
    remember(openTask, [id]);
    var t = taskById[id]; if (!t) return;
    var s = tStatus(t), st = tState(t);
    var h = '<div class="row"><span class="t-id" style="font-size:15px">' + esc(t.id) + '</span>' + pill(s) +
      (isOverdue(t) ? '<span class="tag late">behind plan</span>' : '') + '<span class="spacer"></span><span class="tag">' + esc(t.gate) + '</span></div>' +
      '<h3>' + nl(t.desc) + '</h3>' + (t.phase ? '<div class="small muted">' + esc(t.phase) + '</div>' : '');
    h += '<div class="seg" style="margin:12px 0">' + STATUSES.map(function (x) {
      return '<button class="' + (x === s ? 'on' : '') + '" data-setstatus="' + esc(x) + '" data-id="' + esc(t.id) + '">' + esc(x) + '</button>';
    }).join('') + '</div>';
    var variance = '';
    if (st.aStart && st.aEnd) {
      var actual = (new Date(st.aEnd) - new Date(st.aStart)) / 60000;
      variance = fDur(actual) + ' actual (' + (actual - t.dur >= 0 ? '+' : '') + fDur(actual - t.dur) + ' vs plan)';
    }
    h += '<div class="kv">' +
      kv('Planned', t.s ? fDT(t.s) + ' → ' + fDT(t.e) : '—') + kv('Duration', fDur(t.dur)) +
      kv('Actual start', st.aStart ? fDT(new Date(st.aStart)) : '—') + kv('Actual end', st.aEnd ? fDT(new Date(st.aEnd)) : '—') +
      (variance ? kv('Variance', esc(variance)) : '') +
      kv('Location', esc(t.loc)) + kv('Team', esc(t.team)) + (t.res ? kv('Resource', esc(t.res)) : '') +
      (t.truck ? kv('Truck', '<a href="#" data-truck="' + esc(t.truck) + '">' + esc(t.truck) + '</a>') : '') +
      (t.chk ? kv('Checkpoint', esc(t.chk)) : '') +
      kv('Depends on', t.deps ? t.deps.split(/[,;\s]+/).filter(Boolean).map(function (d) {
        var dt = taskById[d];
        return dt ? '<a href="#" data-task-link="' + esc(d) + '">' + esc(d) + '</a> ' + pill(tStatus(dt)) : esc(d);
      }).join('<br>') : '—') +
      (t.comments ? kv('Comments', nl(t.comments)) : '') + '</div>';
    var dependents = tasks.filter(function (x) { return (x.deps || '').split(/[,;\s]+/).indexOf(t.id) >= 0; });
    if (dependents.length) h += '<div class="section-t">Unblocks</div><div class="row wrap">' + dependents.map(function (x) {
      return '<a href="#" class="chip" data-task-link="' + esc(x.id) + '">' + esc(x.id) + '</a>';
    }).join('') + '</div>';
    h += '<div class="section-t">Notes</div><textarea id="tnote" placeholder="Add a note for this task…">' + esc(st.note || '') + '</textarea>';
    if (t.app || t.spoc || t.appGroup) {
      h += '<div class="section-t">Application contacts</div><div class="card" style="padding:4px 14px"><div class="contact"><b>' + esc(t.app || t.appGroup) + '</b>' +
        (t.spoc ? '<div class="small">SPOC: ' + esc(t.spoc) + '</div>' + contactLinks(t.spoc + ' ' + t.spocContact) : '') +
        (t.vendor ? '<div class="small" style="margin-top:6px">Vendor: ' + esc(t.vendor) + '</div>' + contactLinks(t.vendorContact) : '') + '</div></div>';
    }
    openSheet(h, function () {
      var ta = $('#tnote');
      ta.addEventListener('input', debounce(function () { tEdit(t).note = ta.value; save(); }, 400));
    });
  }

  /* ---------------- TRUCKS ---------------- */
  var NEXT = { 'Planned': ['Loading', 'Start loading'], 'Loading': ['In Transit', 'Departed ITI'], 'Delayed': ['In Transit', 'Departed ITI'],
    'In Transit': ['Arrived', 'Arrived at STT'], 'Arrived': ['Unloaded', 'Unloaded'], 'Unloaded': ['Closed', 'Close truck'] };
  function truckAdvance(tr) {
    var s = tkStatus(tr), nx = NEXT[s];
    if (!nx) return;
    tkSet(tr, 'Status', nx[0], true);
    if (nx[0] === 'In Transit' && !tkVal(tr, 'Actual Departure')) tkSet(tr, 'Actual Departure', nowIso(), true);
    if (nx[0] === 'Arrived' && !tkVal(tr, 'Actual Arrival')) tkSet(tr, 'Actual Arrival', nowIso(), true);
    log(tr.id + ' → ' + nx[0]); save();
    toast(tr.id + ' · ' + nx[0]);
  }
  function variance(planned, actual) {
    var p = toDate(planned), a = toDate(actual);
    if (!p || !a) return '';
    var m = Math.round((a - p) / 60000);
    return '<span class="tag' + (m > 15 ? ' late' : '') + '">' + (m >= 0 ? '+' : '') + fDur(m) + '</span>';
  }
  function renderTrucks(args, keep) {
    var counts2 = {};
    trucks.forEach(function (t) { var s = tkStatus(t); counts2[s] = (counts2[s] || 0) + 1; });
    var tb = ['All'].concat(batches);
    var list = trucks.filter(function (t) { return ui.tBatch === 'All' || t.batch === ui.tBatch; });
    var h = '<div class="dev-sum"><div class="row small"><b>' + trucks.length + ' trucks</b><span class="muted">· ' + TRUCK.filter(function (s) { return counts2[s]; }).map(function (s) {
      return counts2[s] + ' ' + s.toLowerCase();
    }).join(' · ') + '</span></div>' +
      bar({ total: trucks.length, closed: trucks.filter(function (t) { return arrived(tkStatus(t)); }).length, 'In Progress': (counts2['In Transit'] || 0) + (counts2.Loading || 0), Blocked: counts2.Delayed || 0 }) + '</div>' +
      '<div class="chips">' + tb.map(function (b) {
        return '<button class="chip' + (ui.tBatch === b ? ' on' : '') + '" data-tbatch="' + esc(b) + '">' + (b === 'All' ? 'All batches' : 'Batch ' + esc(b)) + '</button>';
      }).join('') + '</div>';
    if (!truckRow[(trucks[0] || {}).id]) h += '<div class="card small" style="color:var(--warn)">Truck_Tracker sheet not found in this runbook — truck progress can’t be recorded.</div>';
    list.forEach(function (tr) {
      var s = tkStatus(tr), nx = NEXT[s];
      var dep = tkVal(tr, 'Actual Departure'), arr = tkVal(tr, 'Actual Arrival');
      var tt = tasks.filter(function (t) { return t.truck === tr.id; }), tc = counts(tt);
      h += '<div class="card truck"><div class="head"><div class="num">' + esc(tr.id.replace(/^TR-?/i, '')) + '</div>' +
        '<div style="flex:1;min-width:0"><div class="row"><b>' + esc(tr.id) + '</b><span class="muted small">Batch ' + esc(tr.batch) + (tr.boxes ? ' · ' + esc(tr.boxes) + '/45 boxes' : '') + '</span><span class="spacer"></span>' + pill(s) + '</div>' +
        '<div class="small">' + esc(tr.scope || tr.loose) + '</div></div></div>' +
        '<div class="timeline3"><div><small>Load start</small><b>' + fAny(tr.loadStart) + '</b></div>' +
        '<div><small>Depart ITI</small><b>' + fAny(tr.depart) + '</b>' + (dep ? '<small class="ok-t">✓ ' + fAny(dep) + ' ' + variance(tr.depart, dep) + '</small>' : '') + '</div>' +
        '<div><small>Arrive STT</small><b>' + fAny(tr.arrive) + '</b>' + (arr ? '<small class="ok-t">✓ ' + fAny(arr) + ' ' + variance(tr.arrive, arr) + '</small>' : '') + '</div></div>' +
        '<div class="row wrap small">' + (tr.oemRacks && tr.oemRacks !== '—' ? '<span class="tag">OEM racks: ' + esc(tr.oemRacks) + '</span>' : '') +
        (tr.emptyRacks && tr.emptyRacks !== '—' ? '<span class="tag">Empty racks: ' + esc(tr.emptyRacks) + '</span>' : '') +
        (tr.loose && tr.loose !== '—' ? '<span class="tag">Loose: ' + esc(tr.loose) + '</span>' : '') +
        (tkVal(tr, 'Vehicle No') ? '<span class="tag">🚚 ' + esc(tkVal(tr, 'Vehicle No')) + '</span>' : '') + '</div>' +
        (tt.length ? '<div style="margin-top:8px">' + bar(tc) + '<div class="small muted" style="margin-top:3px">Tasks ' + tc.closed + '/' + tc.total + '</div></div>' : '') +
        '<div class="btn-grid" style="margin-top:10px">' + (nx ? '<button class="btn primary" data-tadv="' + esc(tr.id) + '">' + esc(nx[1]) + '</button>' : '<span></span>') +
        '<button class="btn" data-truck="' + esc(tr.id) + '">Details</button></div></div>';
    });
    view.innerHTML = h;
  }
  function trById(id) { return trucks.filter(function (t) { return t.id === id; })[0]; }
  function openTruck(id) {
    remember(openTruck, [id]);
    var tr = trById(id); if (!tr) return;
    var s = tkStatus(tr), editable = !!truckRow[tr.id];
    var load = shRows('load').filter(function (r) { return (r.v[C.norm('Truck No')] || '') === tr.id; });
    var devs = devices.filter(function (d) { return d.truck === tr.id; });
    var physDevs = devs.filter(function (d) { return !d.virtual; });
    var h = '<div class="row"><b style="font-size:18px">' + esc(tr.id) + '</b>' + pill(s) + '<span class="spacer"></span><span class="tag">Batch ' + esc(tr.batch) + '</span></div>' +
      '<div class="small muted" style="margin-top:4px">' + esc(tr.plan || tr.scope) + '</div>';
    if (editable) {
      h += '<div class="section-t">Status</div><div class="chips wrap-chips">' + TRUCK.map(function (x) {
        return '<button class="chip' + (x === s ? ' on' : '') + '" data-tkstatus="' + esc(x) + '" data-id="' + esc(tr.id) + '">' + esc(x) + '</button>';
      }).join('') + '</div>';
      h += '<div class="kv">' +
        kv('Planned load', fAny(tr.loadStart)) +
        kv('Planned depart', fAny(tr.depart)) + kv('Actual depart', dtEditor('trucks', tr.id, 'Actual Departure', tkVal(tr, 'Actual Departure')) + variance(tr.depart, tkVal(tr, 'Actual Departure'))) +
        kv('Planned arrive', fAny(tr.arrive)) + kv('Actual arrive', dtEditor('trucks', tr.id, 'Actual Arrival', tkVal(tr, 'Actual Arrival')) + variance(tr.arrive, tkVal(tr, 'Actual Arrival'))) +
        (tr.mount ? kv('Mounting', fAny(tr.mount)) : '') + (tr.powerOn ? kv('Power-on', fAny(tr.powerOn)) : '') + '</div>';
      h += '<div class="section-t">Documents</div><div class="form-grid">' + ['Vehicle No', 'Gate Pass No', 'E-Way Bill No', 'Seal No', 'Escort / Driver'].map(function (f) {
        return '<label><span>' + esc(f) + '</span><input type="text" data-shtext="trucks" data-key="' + esc(tr.id) + '" data-col="' + esc(f) + '" value="' + esc(tkVal(tr, f)) + '"></label>';
      }).join('') + '<label class="full"><span>Remarks</span><textarea data-shtext="trucks" data-key="' + esc(tr.id) + '" data-col="Remarks">' + esc(tkVal(tr, 'Remarks')) + '</textarea></label></div>';
    }
    h += '<div class="section-t">Racks</div><div class="kv">' + kv('From (ITI)', esc(tr.srcRacks || '—')) + kv('To (STT)', esc(tr.dstRacks || '—')) +
      kv('OEM loaded', esc(tr.oemRacks || '—')) + kv('Empty', esc(tr.emptyRacks || '—')) + kv('Loose', esc(tr.loose || '—')) + '</div>';
    if (load.length) {
      var ld = load.filter(function (r) { return /^y/i.test(shVal('load', r, 'Loaded at Source (Y/N)')); }).length;
      var rc = load.filter(function (r) { return /^y/i.test(shVal('load', r, 'Received at Target (Y/N)')); }).length;
      h += '<div class="section-t">Load plan · ' + ld + '/' + load.length + ' loaded · ' + rc + '/' + load.length + ' received</div>' +
        '<div class="btn-grid" style="margin-bottom:8px"><button class="btn" data-loadall="loaded" data-id="' + esc(tr.id) + '">All loaded</button><button class="btn" data-loadall="received" data-id="' + esc(tr.id) + '">All received</button></div>' +
        '<div class="list">' + load.map(function (r) {
          var L = shVal('load', r, 'Loaded at Source (Y/N)'), Rv = shVal('load', r, 'Received at Target (Y/N)');
          return '<div class="li static"><div class="grow"><div class="title" style="white-space:normal">' + esc(r.v[C.norm('Load Seq')] || '') + '. ' + esc(r.v[C.norm('Load Item')] || '') +
            ' <span class="muted small">' + esc(r.v[C.norm('Source Rack')] || '') + '</span></div>' +
            '<div class="sub" style="white-space:normal">' + esc(r.v[C.norm('Hostname')] || r.v[C.norm('Serial(s)')] || '') + '</div>' +
            '<div class="sub">→ ' + esc(r.v[C.norm('Target Rack / Note')] || '') + '</div></div>' +
            '<div class="yn-col"><button class="ynb' + (/^y/i.test(L) ? ' on' : '') + '" data-yn="load" data-key="' + esc(r.key) + '" data-col="Loaded at Source (Y/N)" data-truck-ref="' + esc(tr.id) + '">Loaded</button>' +
            '<button class="ynb' + (/^y/i.test(Rv) ? ' on' : '') + '" data-yn="load" data-key="' + esc(r.key) + '" data-col="Received at Target (Y/N)" data-truck-ref="' + esc(tr.id) + '">Received</button></div></div>';
        }).join('') + '</div>';
    }
    if (devs.length) {
      h += '<div class="section-t">Devices on this truck · ' + physDevs.length + ' physical' + (devs.length > physDevs.length ? ' + ' + (devs.length - physDevs.length) + ' virtual' : '') + '</div>' +
        '<a class="btn block" href="#devices/truck/' + encodeURIComponent(tr.id) + '">Open device list</a>' +
        '<button class="btn block" style="margin-top:8px" data-bulk="truck" data-id="' + esc(tr.id) + '">Set movement status for all ' + physDevs.length + ' physical devices…</button>';
    }
    var tt = tasks.filter(function (t) { return t.truck === tr.id; });
    if (tt.length) h += '<div class="section-t">Truck tasks</div>' + tt.map(taskCard).join('');
    openSheet(h, bindSheetEditors);
  }

  /* shared editors (used by truck details and generic sheets) */
  function dtEditor(id, key, col, value) {
    var d = value ? toDate(value) : null;
    var local = d ? d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : '';
    return '<span class="dt-ed"><input type="datetime-local" value="' + local + '" data-shdate="' + esc(id) + '" data-key="' + esc(key) + '" data-col="' + esc(col) + '">' +
      '<button class="mini" data-shnow="' + esc(id) + '" data-key="' + esc(key) + '" data-col="' + esc(col) + '">Now</button></span>';
  }
  function bindSheetEditors() {
    $$('[data-shtext]').forEach(function (el) {
      el.addEventListener('input', debounce(function () { setSh(el.dataset.shtext, el.dataset.key, el.dataset.col, el.value, true); }, 400));
      el.addEventListener('change', function () { setSh(el.dataset.shtext, el.dataset.key, el.dataset.col, el.value); });
    });
    $$('[data-shdate]').forEach(function (el) {
      el.addEventListener('change', function () { setSh(el.dataset.shdate, el.dataset.key, el.dataset.col, el.value ? new Date(el.value).toISOString() : ''); });
    });
    $$('[data-shnum]').forEach(function (el) {
      el.addEventListener('change', function () { setSh(el.dataset.shnum, el.dataset.key, el.dataset.col, el.value); });
    });
  }

  /* ---------------- DEVICES ---------------- */
  function renderDevices(args, keep) {
    if (args && args[0] === 'racks') ui.dMode = 'racks';
    else if (!keep) ui.dMode = 'list';
    if (ui.dMode === 'racks') return renderRacks();
    if (!keep) {
      ui.dLimit = PAGE;
      if (args && args[0] === 'truck' && args[1]) { ui.dq = args[1]; ui.dBatch = 'All'; ui.dState = 'All'; }
      else if (args && batches.indexOf(args[0]) >= 0) ui.dBatch = args[0];
    }
    var q = ui.dq.toLowerCase().trim();
    var base0 = devices.filter(function (d) {
      if (ui.dBatch !== 'All' && d.batch !== ui.dBatch) return false;
      if (q && /^tr-\d/.test(q)) return (d.truck || '').toLowerCase() === q;
      return !q || d.hay.indexOf(q) >= 0;
    });
    var kc = {};
    base0.forEach(function (d) { kc[d.kind] = (kc[d.kind] || 0) + 1; });
    var base = base0.filter(function (d) { return ui.dKind === 'All' || d.kind === ui.dKind; });
    var STATES = ui.dView === 'mig' ? MIG.concat(['Issue']) : SHUT;
    var getS = ui.dView === 'mig' ? dMig : dShut;
    var cnt = {};
    base.forEach(function (d) { var s = getS(d); cnt[s] = (cnt[s] || 0) + 1; });
    if (ui.dState !== 'All' && STATES.indexOf(ui.dState) < 0) ui.dState = 'All';
    var list = ui.dState === 'All' ? base : base.filter(function (d) { return getS(d) === ui.dState; });
    var doneN = ui.dView === 'mig' ? (cnt.Validated || 0) : base.filter(function (d) { return /powered off|os down|not applicable/i.test(dShut(d)); }).length;
    var pend = cnt.Pending || 0;

    var h = modeSeg() + '<div class="sticky-tools"><input class="search" type="search" id="dq" placeholder="Hostname, serial, IP, rack, app, TR-2.4…" value="' + esc(ui.dq) + '">' +
      '<div class="chips">' + ['All'].concat(batches).map(function (b) {
        return '<button class="chip' + (ui.dBatch === b ? ' on' : '') + '" data-dbatch="' + esc(b) + '">' + (b === 'All' ? 'All batches' : 'B' + esc(b)) + '</button>';
      }).join('') + '<span style="flex:none;width:6px"></span>' + ['All'].concat(KINDS).map(function (k) {
        return '<button class="chip' + (ui.dKind === k ? ' on' : '') + '" data-dkind="' + esc(k) + '">' + (k === 'All' ? 'All types' : esc(k)) + '<b class="cnt">' + (k === 'All' ? base0.length : (kc[k] || 0)) + '</b></button>';
      }).join('') + '</div>' +
      '<div class="seg" style="margin-bottom:8px"><button class="' + (ui.dView === 'mig' ? 'on' : '') + '" data-dview="mig">Movement status</button><button class="' + (ui.dView === 'shut' ? 'on' : '') + '" data-dview="shut">Shutdown status</button></div>' +
      '<div class="dev-sum" aria-live="polite"><div class="row small"><b>' + base.length + ' devices</b><span class="muted">· ' + pend + ' pending · ' + (base.length - pend - doneN) + ' in progress · ' +
      '<span style="color:var(--done)">' + doneN + (ui.dView === 'mig' ? ' validated' : ' down') + '</span></span></div>' +
      bar({ total: base.length, closed: doneN, 'In Progress': base.length - pend - doneN, Blocked: ui.dView === 'mig' ? (cnt.Issue || 0) : 0 }) + '</div>' +
      '<div class="chips">' + [['All', base.length]].concat(STATES.map(function (s) { return [s, cnt[s] || 0]; })).map(function (o) {
        return '<button class="chip' + (ui.dState === o[0] ? ' on' : '') + (o[1] ? '' : ' zero') + '" data-dstate="' + esc(o[0]) + '">' + esc(o[0]) + '<b class="cnt">' + o[1] + '</b></button>';
      }).join('') + '</div></div>';
    if (!list.length) h += '<div class="empty">No devices match.</div>';
    else {
      h += '<button class="btn block" style="margin-bottom:8px" data-bulk="list">Update all ' + list.length + ' listed devices…</button>';
      h += '<div class="list">' + list.slice(0, ui.dLimit).map(devRow).join('') + '</div>';
      if (list.length > ui.dLimit) h += '<button class="btn more-btn" data-dmore="1">Show more (' + (list.length - ui.dLimit) + ' left)</button>';
    }
    view.innerHTML = h;
    renderDevices.list = list;
    var inp = $('#dq');
    inp.addEventListener('input', debounce(function () { ui.dq = inp.value; ui.dLimit = PAGE; renderDevices(null, true); refocus('#dq'); }, 250));
  }
  function modeSeg() {
    return '<div class="seg" style="margin-bottom:10px"><button class="' + (ui.dMode !== 'racks' ? 'on' : '') + '" data-dmode="list">Device list</button>' +
      '<button class="' + (ui.dMode === 'racks' ? 'on' : '') + '" data-dmode="racks">Racks</button></div>';
  }

  /* ---------------- CABLE CHECK (fast entry, one device at a time) ---------------- */
  var CKEY = 'cbsshift.cables';
  var CU_OPTS = [0, 1, 2, 3, 4, 5, 6, 8], FC_OPTS = [0, 1, 2, 3, 4, 6, 8];
  var cs = (function () {
    var d = { by: 'src', val: '', idx: 0, pending: true, auto: true };
    try { return Object.assign(d, JSON.parse(localStorage.getItem(CKEY) || '{}')); } catch (e) { return d; }
  })();
  function saveCs() { try { localStorage.setItem(CKEY, JSON.stringify(cs)); } catch (e) { /* ignore */ } }
  function cabScopes(by) {
    var f = by === 'dst' ? 'dstRack' : by === 'truck' ? 'truck' : 'srcRack', m = {};
    devices.forEach(function (d) { if (d.virtual || isNA(d[f])) return; (m[d[f]] = m[d[f]] || []).push(d); });
    return m;
  }
  function cabList() {
    var phys = devices.filter(function (d) { return !d.virtual; });
    var list, uf = cs.by === 'dst' ? 'dstU' : 'srcU';
    if (cs.by === 'all') list = phys.slice();
    else list = (cabScopes(cs.by)[cs.val] || []).slice();
    return list.sort(function (a, b) {
      var ra = cs.by === 'dst' ? a.dstRack : a.srcRack, rb = cs.by === 'dst' ? b.dstRack : b.srcRack;
      return (cs.by === 'src' || cs.by === 'dst' ? 0 : rackSort(ra || '', rb || '')) || uTop(b[uf]) - uTop(a[uf]) || a.idx - b.idx;
    });
  }
  function cabDone(d) { return dCab(d, 'cu') !== '' && dCab(d, 'fc') !== ''; }
  function renderCables() {
    var scopes = cs.by === 'all' ? null : cabScopes(cs.by);
    var names = scopes ? Object.keys(scopes).sort(rackSort) : [];
    if (scopes && names.indexOf(cs.val) < 0) {
      // start on the first rack / truck that still has work
      cs.val = names.filter(function (n) { return scopes[n].some(function (d) { return !cabDone(d); }); })[0] || names[0] || '';
      startScope();
    }
    var list = cabList();
    if (cs.idx >= list.length) cs.idx = Math.max(0, list.length - 1);
    saveCs();
    var done = list.filter(cabDone).length;
    var h = '<div class="seg cab-by">' + [['src', 'Source rack'], ['dst', 'Target rack'], ['truck', 'Truck'], ['all', 'All']].map(function (o) {
      return '<button class="' + (cs.by === o[0] ? 'on' : '') + '" data-cby="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div>';
    if (scopes) h += '<select class="search cab-sel" id="cabsel" aria-label="Choose ' + (cs.by === 'truck' ? 'truck' : 'rack') + '">' + names.map(function (n) {
      var ds = scopes[n], k = ds.filter(cabDone).length;
      return '<option value="' + esc(n) + '"' + (n === cs.val ? ' selected' : '') + '>' + esc(n) + ' — ' + k + '/' + ds.length + (k === ds.length ? ' ✓' : '') + '</option>';
    }).join('') + '</select>';
    h += '<div class="row small" style="margin:2px 2px 6px"><b>' + done + ' / ' + list.length + ' done</b><span class="spacer"></span>' +
      '<button class="chip' + (cs.pending ? ' on' : '') + '" data-ctog="pending">Skip done</button>' +
      '<button class="chip' + (cs.auto ? ' on' : '') + '" data-ctog="auto">Auto-next</button></div>' +
      bar({ total: list.length, closed: done, 'In Progress': 0, Blocked: 0 });
    if (!list.length) { view.innerHTML = h + '<div class="empty">No physical devices here.</div>'; bindCabSel(); return; }
    var d = list[cs.idx], uf = cs.by === 'dst' ? 'dstU' : 'srcU', cu = dCab(d, 'cu'), fc = dCab(d, 'fc');
    h += '<div class="cab-card' + (cabDone(d) ? ' done' : '') + '">' +
      '<div class="row"><span class="u-badge">' + (cs.by === 'dst' ? esc(d.dstRack) : esc(d.srcRack)) + (d[uf] && !isNA(d[uf]) ? ' · ' + esc(uFmt(d[uf])) : '') + '</span>' +
      '<span class="spacer"></span><span class="small muted">' + (cs.idx + 1) + ' of ' + list.length + '</span></div>' +
      '<div class="cab-name" data-dev="' + esc(d.key) + '">' + esc(d.name) + '</div>' +
      '<div class="sub">' + esc([d.type, d.model].filter(function (v) { return !isNA(v); }).join(' · ')) + ' · <span class="mono">' + esc(d.serial) + '</span></div>' +
      '<div class="sub">' + esc(d.srcRack) + (d.srcU ? ' ' + esc(uFmt(d.srcU)) : '') + ' → ' + esc(d.dstRack || '—') + (d.dstU ? ' ' + esc(uFmt(d.dstU)) : '') + ' · ' + esc(d.truck || '') + '</div>' +
      padRow('cu', 'Copper', CU_OPTS, cu, d) + padRow('fc', 'FC', FC_OPTS, fc, d) +
      '<button class="lblb wide' + (dLbl(d) ? ' on' : '') + '" data-clbl="' + esc(d.key) + '">' + ICON.check + '<span>' + (dLbl(d) ? 'Labelled' : 'Mark labelled') + '</span></button>' +
      '</div>' +
      '<div class="cab-nav"><button class="btn" data-cnav="-1"' + (cs.idx ? '' : ' disabled') + '>‹ Prev</button>' +
      '<button class="btn primary" data-cnav="1">' + (cs.idx < list.length - 1 ? 'Next ›' : 'Finish ✓') + '</button></div>' +
      '<div class="cab-strip" aria-label="Devices in this ' + (cs.by === 'truck' ? 'truck' : 'rack') + '">' + list.map(function (x, i) {
        return '<button class="' + (cabDone(x) ? 'ok' : (dCab(x, 'cu') !== '' || dCab(x, 'fc') !== '') ? 'part' : '') + (i === cs.idx ? ' cur' : '') + '" data-cjump="' + i + '" title="' + esc(x.name) + '">' + (i + 1) + '</button>';
      }).join('') + '</div>';
    view.innerHTML = h;
    bindCabSel();
  }
  function padRow(f, label, opts, cur, d) {
    var curS = cur === '' ? '' : String(cur);
    var custom = curS !== '' && opts.indexOf(+curS) < 0;
    return '<div class="pad"><div class="pad-h"><span>' + label + '</span><b>' + (curS === '' ? '–' : esc(curS)) + '</b></div><div class="pad-k">' +
      opts.map(function (n) { return '<button class="' + (curS === String(n) ? 'on' : '') + '" data-cset="' + f + '" data-v="' + n + '" data-key="' + esc(d.key) + '">' + n + '</button>'; }).join('') +
      '<input type="number" inputmode="numeric" min="0" placeholder="#" class="' + (custom ? 'on' : '') + '" data-cabin="' + f + '" data-key="' + esc(d.key) + '" value="' + (custom ? esc(curS) : '') + '" aria-label="Other ' + label + ' count"></div></div>';
  }
  function bindCabSel() {
    var s = $('#cabsel');
    if (s) s.addEventListener('change', function () { cs.val = s.value; startScope(); saveCs(); renderCables(); window.scrollTo(0, 0); });
  }
  // When a rack / truck is picked, start at its first device still missing counts.
  function startScope() {
    cs.idx = 0;
    if (!cs.pending) return;
    var nx = nextPending(cabList(), -1);
    if (nx > 0) cs.idx = nx;
  }
  function nextPending(list, from) {
    for (var i = from + 1; i < list.length; i++) if (!cabDone(list[i])) return i;
    return -1;
  }
  var advT = null;
  function scheduleNext() { clearTimeout(advT); advT = setTimeout(cabNext, 280); }
  function cabNext() {
    clearTimeout(advT); advT = null;
    var list = cabList();
    var nx = cs.pending ? nextPending(list, cs.idx) : cs.idx + 1;
    if (nx < 0 || nx >= list.length) {
      // this rack / truck is finished — offer the next one with work left
      var left = list.filter(function (d) { return !cabDone(d); }).length;
      if (left) toast(left + ' device(s) here still need counts');
      else if (cs.by === 'all') toast('All devices complete ✓');
      else {
        var scopes = cabScopes(cs.by), names = Object.keys(scopes).sort(rackSort), was = cs.val;
        var after = names.slice(names.indexOf(cs.val) + 1).concat(names.slice(0, names.indexOf(cs.val)));
        var nxt = after.filter(function (n) { return scopes[n].some(function (d) { return !cabDone(d); }); })[0];
        if (nxt) { cs.val = nxt; startScope(); toast(was + ' complete ✓ — now ' + nxt); }
        else toast(was + ' complete ✓ — everything is counted');
      }
    } else cs.idx = nx;
    saveCs(); renderCables(); window.scrollTo(0, 0);
  }

  /* ---------------- RACKS ---------------- */
  function rackField() { return ui.rSide === 'dst' ? 'dstRack' : 'srcRack'; }
  function rackDevices(side, rack) {
    var f = side === 'dst' ? 'dstRack' : 'srcRack', uf = side === 'dst' ? 'dstU' : 'srcU';
    return devices.filter(function (d) { return !d.virtual && d[f] === rack; })
      .sort(function (a, b) { return uTop(b[uf]) - uTop(a[uf]) || a.idx - b.idx; });
  }
  function renderRacks() {
    var f = rackField(), q = (ui.rq || '').toLowerCase().trim();
    var by = {};
    devices.forEach(function (d) {
      if (d.virtual || isNA(d[f])) return;
      if (ui.rBatch !== 'All' && d.batch !== ui.rBatch) return;
      (by[d[f]] = by[d[f]] || []).push(d);
    });
    var racks = Object.keys(by).sort(rackSort).filter(function (r) {
      return !q || r.toLowerCase().indexOf(q) >= 0 || by[r].some(function (d) { return d.hay.indexOf(q) >= 0; });
    });
    var all = [];
    racks.forEach(function (r) { all = all.concat(by[r]); });
    var lb = all.filter(dLbl).length, cb = all.filter(cabled).length;
    var cu = 0, fc = 0;
    all.forEach(function (d) { cu += +dCab(d, 'cu') || 0; fc += +dCab(d, 'fc') || 0; });
    var h = modeSeg() + '<div class="sticky-tools"><div class="seg" style="margin-bottom:8px"><button class="' + (ui.rSide !== 'dst' ? 'on' : '') + '" data-rside="src">Source racks (ITI)</button>' +
      '<button class="' + (ui.rSide === 'dst' ? 'on' : '') + '" data-rside="dst">Target racks (STT)</button></div>' +
      '<input class="search" type="search" id="rq" placeholder="Rack (e.g. C2, G-15) or device…" value="' + esc(ui.rq || '') + '">' +
      '<div class="chips">' + ['All'].concat(batches).map(function (b) {
        return '<button class="chip' + (ui.rBatch === b ? ' on' : '') + '" data-rbatch="' + esc(b) + '">' + (b === 'All' ? 'All batches' : 'Batch ' + esc(b)) + '</button>';
      }).join('') + '</div>' +
      '<div class="dev-sum"><div class="row small wrap"><b>' + racks.length + ' racks · ' + all.length + ' devices</b><span class="muted">· labelled ' + lb + ' · cables counted ' + cb +
      ' · ' + cu + ' copper · ' + fc + ' FC</span></div>' + bar({ total: all.length, closed: lb, 'In Progress': 0, Blocked: 0 }) + '</div></div>';
    if (!racks.length) h += '<div class="empty">No racks match.</div>';
    else h += '<div class="list">' + racks.map(function (r) {
      var ds = by[r], l = ds.filter(dLbl).length, c = ds.filter(cabled).length;
      var trk = [], bt = [];
      ds.forEach(function (d) { if (d.truck && trk.indexOf(d.truck) < 0) trk.push(d.truck); if (bt.indexOf(d.batch) < 0) bt.push(d.batch); });
      var other = [];
      ds.forEach(function (d) { var o = ui.rSide === 'dst' ? d.srcRack : d.dstRack; if (o && !isNA(o) && other.indexOf(o) < 0) other.push(o); });
      return '<div class="li" data-rack="' + esc(r) + '"><div class="rack-badge">' + esc(r) + '</div><div class="grow">' +
        '<div class="title">' + ds.length + ' device' + (ds.length === 1 ? '' : 's') + ' <span class="muted small">· B' + esc(bt.join(', B')) + ' · ' + esc(trk.slice(0, 3).join(', ')) + (trk.length > 3 ? '…' : '') + '</span></div>' +
        '<div class="sub">' + (ui.rSide === 'dst' ? 'from ' : '→ ') + esc(other.slice(0, 5).join(', ')) + (other.length > 5 ? '…' : '') + '</div>' +
        '<div class="sub"><span class="' + (l === ds.length ? 'ok-c' : '') + '">✓ labelled ' + l + '/' + ds.length + '</span> · <span class="' + (c === ds.length ? 'ok-c' : '') + '">cables ' + c + '/' + ds.length + '</span></div></div>' +
        '<span class="chev">' + ICON.chev + '</span></div>';
    }).join('') + '</div>';
    view.innerHTML = h;
    var inp = $('#rq');
    inp.addEventListener('input', debounce(function () { ui.rq = inp.value; renderRacks(); refocus('#rq'); }, 250));
  }
  function rackInfo(side, rack) {
    var row, rows;
    if (side === 'src') {
      row = shRows('rackmove').filter(function (r) { return r.key === rack; })[0];
      rows = [['Moves to', 'Destination @ STT'], ['Disposition', 'Rack Disposition'], ['Rack type', 'Rack Type'], ['Ships in batch', 'Rack Ships in Batch'], ['Truck', 'Rack Truck']];
    } else {
      row = shRows('stt').filter(function (r) { return r.key === rack; })[0];
      rows = [['Rack', 'Recommended Rack'], ['Movement', 'Rack Movement'], ['Truck', 'Rack Truck'], ['Socket', 'Socket Type'], ['Power circuit', 'Required Power Circuit'], ['PDU', 'Remarks (PDU)']];
    }
    if (!row) return '';
    var cells = rows.map(function (x) { var v = row.v[C.norm(x[1])]; return v ? kv(x[0], esc(v)) : ''; }).join('');
    return cells ? '<div class="kv">' + cells + '</div>' : '';
  }
  function openRack(side, rack) {
    remember(openRack, [side, rack]);
    var ds = rackDevices(side, rack), uf = side === 'dst' ? 'dstU' : 'srcU';
    var l = ds.filter(dLbl).length, c = ds.filter(cabled).length, cu = 0, fc = 0;
    ds.forEach(function (d) { cu += +dCab(d, 'cu') || 0; fc += +dCab(d, 'fc') || 0; });
    var h = '<div class="row"><span class="rack-badge big">' + esc(rack) + '</span><div style="flex:1"><div class="small muted">' + (side === 'dst' ? 'Target rack @ STT' : 'Source rack @ ITI') + '</div>' +
      '<b>' + ds.length + ' devices</b> <span class="small muted">· labelled ' + l + '/' + ds.length + ' · cables ' + c + '/' + ds.length + ' · ' + cu + ' copper · ' + fc + ' FC</span></div></div>' +
      rackInfo(side, rack) +
      '<div class="btn-grid" style="margin:10px 0"><button class="btn" data-lblall="' + esc(rack) + '" data-side="' + side + '" data-v="1">Label all ✓</button><button class="btn" data-lblall="' + esc(rack) + '" data-side="' + side + '" data-v="0">Clear labels</button></div>' +
      ds.map(function (d) {
        var u = d[uf];
        return '<div class="rack-dev' + (dLbl(d) ? ' done' : '') + '"><div class="row" data-dev="' + esc(d.key) + '" style="cursor:pointer"><span class="u-badge">' + (u && !isNA(u) ? esc(uFmt(u)) : '—') + '</span>' +
          '<div style="flex:1;min-width:0"><div class="title-s">' + esc(d.name) + '</div><div class="sub">' + esc([d.type, d.model].filter(function (v) { return !isNA(v); }).join(' · ')) + ' · ' + esc(d.serial) + '</div>' +
          '<div class="sub">' + (side === 'dst' ? 'from ' + esc(d.srcRack) + (d.srcU ? ' ' + esc(uFmt(d.srcU)) : '') : '→ ' + esc(d.dstRack || '—') + (d.dstU ? ' ' + esc(uFmt(d.dstU)) : '')) + ' · ' + esc(d.truck || '') + ' · ' + esc(dMig(d)) + '</div></div>' +
          '<span class="chev">' + ICON.chev + '</span></div>' + cabCtl(d) + '</div>';
      }).join('');
    openSheet(h);
  }

  function devRow(d) {
    var m = dMig(d), s = dShut(d), i = migIdx(m);
    var dots = '<span class="stage-dots">';
    for (var k = 1; k < MIG.length; k++) dots += '<i class="' + (k <= i ? 'on' : '') + '"></i>';
    dots += '</span>';
    var main = ui.dView === 'mig' ? m : s;
    return '<div class="li" data-dev="' + esc(d.key) + '"><div class="grow"><div class="title">' + esc(d.name) + '</div>' +
      '<div class="sub">B' + esc(d.batch) + ' · ' + esc(d.truck || '—') + ' · ' + esc(d.kind) + (d.virtual ? ' on ' + esc(d.phys) : ' · ' + esc(d.type)) + '</div>' +
      '<div class="sub">' + (d.virtual ? esc(d.app || d.appGroup) : esc(d.srcRack) + (d.srcU ? ' ' + esc(uFmt(d.srcU)) : '') + ' → ' + esc(d.dstRack || '—') + (d.dstU ? ' ' + esc(uFmt(d.dstU)) : '')) + (isNA(d.ip) ? '' : ' · ' + esc(d.ip)) + '</div></div>' +
      '<div class="stage-col">' + (d.virtual && ui.dView === 'mig' ? '' : (ui.dView === 'mig' ? dots : '')) +
      '<small class="' + (/validated|powered off|os down/i.test(main) ? 'ok' : /issue/i.test(main) ? 'bad' : '') + '">' + esc(main) + '</small></div></div>';
  }

  function openDevice(key) {
    remember(openDevice, [key]);
    var d = devByKey[key]; if (!d) return;
    var x = S.dev[d.key] || {}, m = dMig(d), s = dShut(d), mi = migIdx(m);
    var h = '<div class="row wrap"><span class="tag">Batch ' + esc(d.batch) + '</span>' + (d.truck ? '<a href="#" class="tag" data-truck="' + esc(d.truck) + '">' + esc(d.truck) + '</a>' : '') +
      '<span class="tag">' + esc(d.kind) + '</span>' + (d.crit && !isNA(d.crit) ? '<span class="tag' + (/high/i.test(d.crit) ? ' warn' : '') + '">' + esc(d.crit) + '</span>' : '') +
      (d.cbs ? '<span class="tag">' + esc(d.cbs) + '</span>' : '') + '</div>' +
      '<h3>' + esc(d.name) + '</h3><div class="muted small">' + esc([d.oem, d.model].filter(function (v) { return !isNA(v); }).join(' ')) + '</div>';

    h += '<div class="section-t">Shutdown status</div><div class="chips wrap-chips">' + SHUT.map(function (st) {
      return '<button class="chip' + (st === s ? ' on' : '') + '" data-devshut="' + esc(st) + '" data-key="' + esc(d.key) + '">' + esc(st) + '</button>';
    }).join('') + '</div>';
    h += '<div class="section-t">Movement status' + (d.virtual ? ' <span class="muted">(moves with host)</span>' : '') + '</div><div class="stepper">' + MIG.slice(1).map(function (st, j) {
      var i = j + 1, done = i <= mi;
      return '<button class="step' + (done ? ' done' : '') + '" data-devmig="' + i + '" data-key="' + esc(d.key) + '">' +
        '<span class="dot">' + (done ? ICON.check : '') + '</span><span class="lbl">' + esc(st) + '</span></button>';
    }).join('') + '</div>' +
      '<div class="btn-grid"><button class="btn' + (m === 'Issue' ? ' bad' : '') + '" data-devmig="issue" data-key="' + esc(d.key) + '">' + (m === 'Issue' ? 'Issue flagged' : 'Flag issue') + '</button>' +
      '<button class="btn" data-devmig="0" data-key="' + esc(d.key) + '">Reset to Pending</button></div>' +
      (x.at ? '<div class="small muted" style="margin-top:6px">Updated ' + fDT(new Date(x.at)) + '</div>' : '');

    if (!d.virtual) h += '<div class="section-t">Cabling & labels</div>' + cabCtl(d) +
      '<div class="small muted" style="margin-top:4px">Racks: <a href="#" data-rackgo="src" data-r="' + esc(d.srcRack) + '">' + esc(d.srcRack) + '</a> → <a href="#" data-rackgo="dst" data-r="' + esc(d.dstRack) + '">' + esc(d.dstRack || '—') + '</a></div>';
    if (!d.virtual) h += '<div class="section-t">Location</div><div class="kv">' +
      kv('Source rack / U', esc(d.srcRack) + (d.srcU ? ' · ' + esc(uFmt(d.srcU)) : '') + (d.uSize ? ' (' + esc(d.uSize) + 'U)' : '')) +
      kv('Transport', esc(d.mode || '—')) +
      kv('Target rack / U', '<b>' + esc(d.dstRack || '—') + '</b>' + (d.dstU ? ' · ' + esc(uFmt(d.dstU)) : '')) +
      (d.eqRack ? kv('Rack', esc(d.eqRack)) : '') + '</div>';
    h += '<div class="section-t">Schedule</div><div class="kv">' +
      kv('Shutdown', esc(d.shutDate) + ' ' + esc(d.shutTime)) + kv('Royal handover', esc(d.handover)) + kv('Truck moves', esc(d.truckTime)) +
      kv('Migration date', esc(d.migDate)) + '</div>';
    h += '<div class="section-t">Device</div><div class="kv">' +
      kv('Hostname', '<span class="mono">' + esc(d.host) + '</span>') +
      kv('Serial', '<span class="mono">' + esc(d.serial) + (d.subSerial && d.subSerial !== d.serial ? ' / ' + esc(d.subSerial) : '') + '</span>') +
      (!isNA(d.ip) ? kv('Internal IP', '<span class="mono">' + esc(d.ip) + '</span>') : '') +
      (!isNA(d.mgmtIp) ? kv('Mgmt IP (ILO)', '<span class="mono">' + esc(d.mgmtIp) + '</span>') : '') +
      kv('Type', esc([d.hw, d.type, d.arch].filter(function (v) { return !isNA(v); }).join(' · '))) +
      (d.virtual ? kv('Runs on', '<a href="#" data-host="' + esc(d.phys) + '">' + esc(d.phys) + '</a>') : '') +
      (!isNA(d.os) ? kv('OS', esc(d.os) + ' ' + esc(isNA(d.osVer) ? '' : d.osVer)) : '') +
      kv('Environment', esc(d.env)) +
      (!isNA(d.vlan) || !isNA(d.zone) ? kv('Network', esc([d.vlan, d.zone].filter(function (v) { return !isNA(v); }).join(' · '))) : '') +
      kv('SAN', esc(d.san) + (d.fabric ? ' · fabric ' + esc(d.fabric) : '') + (d.sanSw ? '<br><span class="small muted">' + esc(d.sanSw) + '</span>' : '')) +
      (d.w2w ? kv('Power (W2W)', esc(d.w2w)) : '') +
      (d.scrap ? kv('Scrap / OOS', esc(d.scrap)) : '') + '</div>';
    if (!d.virtual) {
      var vms = devices.filter(function (v) { return v.virtual && (v.phys || '').toLowerCase() === (d.host || '').toLowerCase() && d.host; });
      if (vms.length) h += '<div class="section-t">' + vms.length + ' LPAR / VM on this host</div><div class="list">' + vms.slice(0, 40).map(function (v) {
        return '<div class="li" data-dev="' + esc(v.key) + '"><div class="grow"><div class="title">' + esc(v.name) + '</div><div class="sub">' + esc(v.kind) + ' · ' + esc(v.app || v.appGroup) + '</div></div><small>' + esc(dShut(v)) + '</small></div>';
      }).join('') + '</div>';
    }
    h += '<div class="section-t">Application</div><div class="card" style="padding:4px 14px"><div class="contact"><b>' + esc(isNA(d.app) ? d.appGroup : d.app) + '</b><div class="small muted">' + esc(d.appGroup) + '</div></div>' +
      (d.spoc && !isNA(d.spoc) ? '<div class="contact"><div class="small">Bank SPOC: ' + esc(d.spoc) + '</div>' + contactLinks(d.spoc) + '</div>' : '') +
      (d.vendor ? '<div class="contact"><div class="small">Vendor: ' + esc(d.vendor) + '</div>' + contactLinks(d.vendorContact) + '</div>' : '') +
      (d.oemContacts && !isNA(d.oemContacts) ? '<div class="contact"><div class="small">OEM: ' + esc(d.hwVendor || '') + '</div>' + contactLinks(d.oemContacts) + '</div>' : '') + '</div>';
    if (d.reason) h += '<div class="section-t">Movement reason</div><div class="small">' + esc(d.reason) + '</div>';
    if (d.remarks) h += '<div class="section-t">Remarks</div><div class="small">' + nl(d.remarks) + '</div>';
    h += '<div class="section-t">Notes</div><textarea id="dnote" placeholder="Note for this device…">' + esc(x.note != null ? x.note : d.note) + '</textarea>';
    openSheet(h, function () {
      var ta = $('#dnote');
      ta.addEventListener('input', debounce(function () { var o = S.dev[d.key] || (S.dev[d.key] = {}); o.note = ta.value; save(); }, 400));
    });
  }

  // Bulk status for a list of devices (current filter, or a truck's physical devices).
  var bulkList = [];
  function openBulk(list, title) {
    bulkList = list;
    var h = '<h3>' + esc(title) + '</h3><p class="muted small">Sets the status on every device listed. Individual devices can still be changed afterwards.</p>' +
      '<div class="section-t">Movement status</div><div class="chips wrap-chips">' + MIG.concat(['Issue']).map(function (s) {
        var n = list.filter(function (d) { return dMig(d) === s; }).length;
        return '<button class="chip" data-bulkset="mig" data-v="' + esc(s) + '">' + esc(s) + '<b class="cnt">' + n + '</b></button>';
      }).join('') + '</div>' +
      '<div class="section-t">Shutdown status</div><div class="chips wrap-chips">' + SHUT.map(function (s) {
        var n = list.filter(function (d) { return dShut(d) === s; }).length;
        return '<button class="chip" data-bulkset="shut" data-v="' + esc(s) + '">' + esc(s) + '<b class="cnt">' + n + '</b></button>';
      }).join('') + '</div>';
    openSheet(h);
  }

  /* ---------------- MORE ---------------- */
  function sheetProgress(id) {
    var cfg = cfgById[id], rows = shRows(id);
    if (!cfg || !cfg.fields.length) return rows.length + ' rows';
    if (cfg.addable) {
      var open = rows.filter(function (r) { return shVal(id, r, cfg.addable); });
      return open.length + ' logged';
    }
    var f = cfg.fields.filter(function (x) { return x.t === 'enum'; })[0];
    if (!f) {
      var f1 = cfg.fields[0];
      return rows.filter(function (r) { return shVal(id, r, f1.c); }).length + ' of ' + rows.length + ' · ' + f1.c + ' filled';
    }
    var done = rows.filter(function (r) { return DONE_WORDS.test(shVal(id, r, f.c)); }).length;
    return done + ' of ' + rows.length + ' · ' + f.c.replace(/\s*\(Y\/N\)/, '');
  }
  function renderMore(args) {
    var sub = args && args[0];
    if (sub === 's' && args[1] && R.sheets[args[1]]) return renderSheet(args[1], args.length > 2);
    var fn = { contacts: moreContacts, comms: moreComms, log: moreLog, data: moreData, changes: moreChanges, runbook: moreRunbook }[sub];
    if (fn) { view.innerHTML = '<a href="#more" class="small">‹ More</a>' + fn(); afterMore(sub); return; }
    var groups = [
      ['Readiness', ['gonogo', 'pre', 'calls', 'apps', 'changes']],
      ['Event execution', ['network', 'seq', 'load', 'rackmove', 'stt', 'readiness', 'san']],
      ['Logs', ['issues', 'actions', 'risks', 'lessons', 'assumptions']]
    ];
    var h = '';
    groups.forEach(function (g) {
      var ids = g[1].filter(function (id) { return R.sheets[id]; });
      if (!ids.length) return;
      h += '<h2>' + esc(g[0]) + '</h2><div class="list">' + ids.map(function (id) {
        var extra = id === 'gonogo' ? 'Decision: ' + decisionOf(shRows('gonogo')) + ' · ' : '';
        return '<div class="li" data-go="#more/s/' + id + '"><div class="grow"><div class="title">' + esc(cfgById[id].title) + '</div><div class="sub">' + esc(extra + sheetProgress(id)) + '</div></div><span class="chev">' + ICON.chev + '</span></div>';
      }).join('') + '</div>';
    });
    var items = [
      ['contacts', 'Contacts & escalation', 'Migration squad, escalation matrix, app SPOCs'],
      ['comms', 'Command centre', 'Communication plan & checkpoint schedule'],
      ['log', 'Event log', S.log.length + ' entries'],
      ['runbook', 'Runbook file & Excel export', (R.source || 'Uploaded runbook') + (meta && meta.at ? ' · loaded ' + fDT(new Date(meta.at)) : '')],
      ['changes', 'Runbook change log', (R.version || '') + ' · ' + R.changelog.length + ' change(s)'],
      ['data', 'Your name, backup & reset', S.who ? 'Name: ' + S.who : 'Progress is saved on this device']
    ];
    h += '<h2>Team & app</h2><div class="list">' + items.map(function (it) {
      return '<div class="li" data-go="#more/' + it[0] + '"><div class="grow"><div class="title">' + esc(it[1]) + '</div><div class="sub">' + esc(it[2]) + '</div></div><span class="chev">' + ICON.chev + '</span></div>';
    }).join('') + '</div><p class="small muted" style="margin-top:16px">' + esc(R.title) + ' · ' + esc(R.source) + '</p>';
    view.innerHTML = h;
  }

  /* generic sheet list */
  function renderSheet(id, keep) {
    var cfg = cfgById[id], sh = R.sheets[id], st = ui.g[id] || (ui.g[id] = { q: '', grp: 'All', f: 'All', limit: PAGE });
    if (!keep) st.limit = PAGE;
    var rows = sh.rows;
    if (cfg.addable) rows = rows.filter(function (r) { return shVal(id, r, cfg.addable); });
    var grpOf = function (r) { return cfg.sections ? r.sec : (cfg.groupCol ? (r.v[C.norm(cfg.groupCol)] || '—') : ''); };
    var grps = [];
    rows.forEach(function (r) { var g = grpOf(r); if (g && grps.indexOf(g) < 0) grps.push(g); });
    var f0 = cfg.fields[0];
    var q = st.q.toLowerCase();
    var list = rows.filter(function (r) {
      if (st.grp !== 'All' && grpOf(r) !== st.grp) return false;
      if (st.f !== 'All' && f0) { var v = shVal(id, r, f0.c) || '—'; if (v !== st.f) return false; }
      if (q) { var hay = Object.keys(r.v).map(function (k) { return r.v[k]; }).join(' ').toLowerCase(); if (hay.indexOf(q) < 0) return false; }
      return true;
    });
    var h = '<a href="#more" class="small">‹ More</a><h2 style="margin-top:8px">' + esc(cfg.title) + '</h2>';
    if (id === 'gonogo') {
      var dec = decisionOf(sh.rows);
      h += '<div class="card decision"><div style="flex:1"><div class="muted small">Overall decision (as the sheet calculates it)</div><div class="big ' + decClass(dec) + '">' + dec + '</div>' +
        '<div class="small muted">' + grps.map(function (g) { return esc(g.replace(/\s*\(.*\)/, '')) + ': <b class="' + decClass(decisionOf(sh.rows.filter(function (r) { return r.sec === g; }))) + '">' + decisionOf(sh.rows.filter(function (r) { return r.sec === g; })) + '</b>'; }).join('<br>') + '</div></div></div>';
    }
    var tools = '<div class="sticky-tools">' + (sh.rows.length > 12 ? '<input class="search" type="search" id="gq2" placeholder="Search ' + esc(cfg.title.toLowerCase()) + '…" value="' + esc(st.q) + '">' : '');
    if (grps.length > 1 && grps.length < 60) tools += '<div class="chips">' + ['All'].concat(grps).map(function (g) {
      return '<button class="chip' + (st.grp === g ? ' on' : '') + '" data-ggrp="' + esc(g) + '" data-id="' + id + '">' + esc(g === 'All' ? 'All' : g.length > 34 ? g.slice(0, 32) + '…' : g) + '</button>';
    }).join('') + '</div>';
    if (f0 && (f0.t === 'enum')) {
      var fc = {};
      rows.forEach(function (r) { var v = shVal(id, r, f0.c) || '—'; fc[v] = (fc[v] || 0) + 1; });
      var opts = f0.o.slice(); Object.keys(fc).forEach(function (v) { if (opts.indexOf(v) < 0) opts.push(v); });
      tools += '<div class="chips"><span class="chip" style="border:0;background:transparent;padding-left:0">' + esc(f0.c.replace(/\s*\(Y\/N\)/, '')) + ':</span>' + [['All', rows.length]].concat(opts.map(function (o) { return [o, fc[o] || 0]; })).map(function (o) {
        return '<button class="chip' + (st.f === o[0] ? ' on' : '') + (o[1] ? '' : ' zero') + '" data-gf="' + esc(o[0]) + '" data-id="' + id + '">' + esc(o[0]) + '<b class="cnt">' + o[1] + '</b></button>';
      }).join('') + '</div>';
    }
    h += tools + '</div>';
    if (cfg.addable) h += '<button class="btn primary block" style="margin-bottom:10px" data-gadd="' + id + '">+ New ' + esc(cfg.title.replace(/ log$/i, '').toLowerCase()) + '</button>';
    if (!list.length) h += '<div class="empty">' + (cfg.addable && !rows.length ? 'Nothing logged yet.' : 'Nothing matches.') + '</div>';
    var lastG = null;
    h += list.slice(0, st.limit).map(function (r) {
      var g = grpOf(r), head = '';
      if (g !== lastG && st.grp === 'All' && grps.length > 1) { head = '<div class="phase-h">' + esc(g) + '</div>'; }
      lastG = g;
      return head + genericRow(id, cfg, r);
    }).join('');
    if (list.length > st.limit) h += '<button class="btn more-btn" data-gmore="' + id + '">Show more (' + (list.length - st.limit) + ' left)</button>';
    view.innerHTML = h;
    var inp = $('#gq2');
    if (inp) inp.addEventListener('input', debounce(function () { st.q = inp.value; st.limit = PAGE; renderSheet(id, true); refocus('#gq2'); }, 250));
  }
  function genericRow(id, cfg, r) {
    var title = r.v[C.norm(cfg.titleCol)] || shVal(id, r, cfg.titleCol) || r.key;
    var badge = cfg.badgeCol ? (r.v[C.norm(cfg.badgeCol)] || '') : '';
    var sub = (cfg.subCols || []).map(function (c) { var v = shVal(id, r, c); return v && !/^-+$/.test(v) ? (toDate(v) && /^\d{4}-/.test(v) ? fAny(v) : v) : ''; }).filter(Boolean).join(' · ');
    var pills = cfg.fields.filter(function (f) { return f.t === 'enum'; }).map(function (f) {
      var v = shVal(id, r, f.c);
      if (!v) return '';
      var label = f.o === undefined ? v : (f.o.length === 2 && f.o[0] === 'Y' ? f.c.replace(/\s*\(Y\/N\)/, '').replace(/^Sign-off Received$/, 'Signed') + ': ' + v : v);
      return '<span class="pill ' + (DONE_WORDS.test(v) && !/^n$/i.test(v) ? 'st-Done' : /no-?go|blocked|red|issue|failed|delayed/i.test(v) ? 'st-Blocked' : /progress|amber|loading|transit/i.test(v) ? 'st-InProgress' : 'st-Open') + '">' + esc(label) + '</span>';
    }).join('');
    return '<div class="task gen" data-grow="' + esc(r.key) + '" data-id="' + id + '"><div class="t-main"><div class="t-top">' + (badge ? '<span class="t-id">' + esc(badge) + '</span>' : '') + pills + '</div>' +
      '<div class="t-desc">' + nl(firstLine(title)) + '</div>' + (sub ? '<div class="t-team">' + esc(sub) + '</div>' : '') + '</div></div>';
  }
  function openGeneric(id, key) {
    remember(openGeneric, [id, key]);
    var cfg = cfgById[id], r = shRows(id).filter(function (x) { return x.key === key; })[0];
    if (!r) return;
    var fieldN = cfg.fields.map(function (f) { return C.norm(f.c); });
    var title = shVal(id, r, cfg.titleCol) || r.key;
    var h = '<div class="row">' + (cfg.badgeCol ? '<span class="t-id">' + esc(r.v[C.norm(cfg.badgeCol)] || '') + '</span>' : '') + '<span class="spacer"></span><span class="tag">' + esc(cfg.title) + '</span></div>' +
      '<h3>' + nl(title) + '</h3>' + (r.sec ? '<div class="small muted">' + esc(r.sec) + '</div>' : '');
    if (cfg.fields.length) {
      h += '<div class="section-t">Update</div><div class="form-grid">';
      cfg.fields.forEach(function (f) {
        var v = shVal(id, r, f.c);
        if (f.t === 'enum') {
          h += '<div class="full"><span class="lbl-s">' + esc(f.c) + '</span><div class="chips wrap-chips">' + f.o.map(function (o) {
            return '<button class="chip' + (o === v ? ' on' : '') + '" data-genum="' + esc(o) + '" data-id="' + id + '" data-key="' + esc(key) + '" data-col="' + esc(f.c) + '">' + esc(o) + '</button>';
          }).join('') + (v && f.o.indexOf(v) < 0 ? '<span class="chip on">' + esc(v) + '</span>' : '') + '</div></div>';
        } else if (f.t === 'date') {
          h += '<div class="full"><span class="lbl-s">' + esc(f.c) + '</span>' + dtEditor(id, key, f.c, v) + '</div>';
        } else if (f.t === 'num') {
          h += '<label><span>' + esc(f.c) + '</span><input type="number" inputmode="decimal" data-shnum="' + id + '" data-key="' + esc(key) + '" data-col="' + esc(f.c) + '" value="' + esc(v) + '"></label>';
        } else {
          var long = /summary|remark|comment|notes|action$|minutes|description|items/i.test(f.c);
          h += '<label class="' + (long ? 'full' : '') + '"><span>' + esc(f.c) + '</span>' + (long ? '<textarea data-shtext="' + id + '" data-key="' + esc(key) + '" data-col="' + esc(f.c) + '">' + esc(v) + '</textarea>'
            : '<input type="text" data-shtext="' + id + '" data-key="' + esc(key) + '" data-col="' + esc(f.c) + '" value="' + esc(v) + '">') + '</label>';
        }
      });
      h += '</div>';
    }
    var info = R.sheets[id].headers.filter(function (hd) { return fieldN.indexOf(hd[0]) < 0 && r.v[hd[0]]; });
    if (info.length) h += '<div class="section-t">Details</div><div class="kv">' + info.map(function (hd) {
      var v = r.v[hd[0]];
      return kv(hd[1], (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(v) ? fAny(v) : nl(v)) + (/\d{10}|@/.test(v) ? contactLinks(v) : ''));
    }).join('') + '</div>';
    openSheet(h, bindSheetEditors);
  }
  function newGenericRow(id) {
    var cfg = cfgById[id];
    var free = shRows(id).filter(function (r) { return !shVal(id, r, cfg.addable); })[0];
    if (!free) { toast('No empty rows left in the sheet — add rows in Excel'); return; }
    var tbl = S.sh[id] || (S.sh[id] = {});
    var e = tbl[free.key] || (tbl[free.key] = {});
    cfg.fields.forEach(function (f) {
      var n = C.norm(f.c);
      if (f.t === 'date' && /^date$/i.test(f.c)) e[n] = nowIso();
      if (/^raised by$/i.test(f.c) && S.who) e[n] = S.who;
      if (/^(issue status|status)$/i.test(f.c)) e[n] = 'Open';
    });
    save();
    openGeneric(id, free.key);
    setTimeout(function () { var ta = $('[data-col="' + cfg.addable + '"]'); if (ta) ta.focus(); }, 80);
  }

  function moreContacts() {
    return '<input class="search" type="search" id="cq" placeholder="Search people, teams, apps…" style="margin-top:10px"><div id="clist">' + contactsHTML('') + '</div>';
  }
  function contactsHTML(q) {
    q = q.toLowerCase();
    var h = '', grp = '';
    function match(s) { return !q || s.toLowerCase().indexOf(q) >= 0; }
    var e = R.escalation || { notes: [], people: [] };
    if (!q && e.notes.length) h += '<h2>Escalation</h2><div class="card small">' + e.notes.map(function (n) { return '<p style="margin:0 0 6px">' + esc(n) + '</p>'; }).join('') + '</div>';
    e.people.filter(function (p) { return match([p.group, p.name, p.role, p.org, p.phone].join(' ')); }).forEach(function (p) {
      if (p.group !== grp) { h += (grp ? '</div>' : '') + '<h2>' + esc(p.group || 'Escalation') + '</h2><div class="card" style="padding:4px 14px">'; grp = p.group; }
      h += '<div class="contact"><b>' + esc(p.name || p.role) + '</b> <span class="small muted">' + esc([p.role, p.org, p.where, p.level].filter(Boolean).join(' · ')) + '</span>' + contactLinks(p.phone) + '</div>';
    });
    if (grp) h += '</div>';
    grp = '';
    R.contacts.filter(function (c) { return match([c.group, c.name, c.role, c.phone, c.email].join(' ')); }).forEach(function (c) {
      if (c.group !== grp) { h += (grp ? '</div>' : '') + '<h2>' + esc(c.group) + '</h2><div class="card" style="padding:4px 14px">'; grp = c.group; }
      h += '<div class="contact"><b>' + esc(c.name) + '</b>' + (c.role ? ' <span class="small muted">· ' + esc(c.role) + '</span>' : '') + contactLinks(c.phone + ' ' + c.email) + '</div>';
    });
    if (grp) h += '</div>';
    var apps = shRows('apps').filter(function (r) { return r.v[C.norm('Application Bank SPOC(s)')] && match(Object.keys(r.v).map(function (k) { return r.v[k]; }).join(' ')); });
    if (apps.length) h += '<h2>Application SPOCs</h2><div class="card" style="padding:4px 14px">' + apps.map(function (r) {
      var spoc = r.v[C.norm('Application Bank SPOC(s)')];
      return '<div class="contact"><b>' + esc(r.key) + '</b> <span class="small muted">· ' + esc(r.v[C.norm('Applications')] || '') + '</span><div class="small" style="margin-top:3px">' + esc(spoc) + '</div>' + contactLinks(spoc) + '</div>';
    }).join('') + '</div>';
    (R.stakeholders || []).filter(function (p) { return match([p.name, p.role, p.org].join(' ')); }).forEach(function (p, i) {
      if (!i) h += '<h2>Stakeholders</h2><div class="card" style="padding:4px 14px">';
      h += '<div class="contact"><b>' + esc(p.name) + '</b> <span class="small muted">' + esc([p.role, p.org].filter(Boolean).join(' · ')) + '</span>' + contactLinks(p.phone + ' ' + p.email) + '</div>';
    });
    if ((R.stakeholders || []).length) h += '</div>';
    return h || '<div class="empty">No contacts match.</div>';
  }
  function moreComms() {
    var c = R.comms || { methods: [] };
    var h = '<h2>Command centre</h2><div class="card">' + nl(c.intro) + (R.info && R.info['conference bridge'] ? '<div class="small" style="margin-top:8px"><b>Bridge:</b> ' + esc(R.info['conference bridge']) + '</div>' : '') + '</div>';
    h += c.methods.map(function (m) {
      return '<div class="card"><b>' + nl(m.method) + '</b><div class="small muted" style="margin:4px 0">' + nl(m.purpose) + '</div><div style="font-size:14px">' + nl(m.desc) + '</div>' +
        (m.leads ? '<div class="section-t">Key participants</div><div class="small">' + nl(m.leads) + '</div>' : '') +
        (m.audience ? '<div class="section-t">Audience</div><div class="small">' + nl(m.audience) + '</div>' : '') +
        (m.details ? '<div class="section-t">Details</div><div class="small">' + nl(m.details) + '</div>' : '') + '</div>';
    }).join('');
    var chk = tasks.filter(function (t) { return t.chk; }).sort(byStart);
    if (chk.length) h += '<h2>Checkpoints & notifications</h2><div class="list">' + chk.map(function (t) {
      return '<div class="li" data-task="' + esc(t.id) + '"><div class="grow"><div class="title">' + esc(t.chk) + '</div><div class="sub">' + esc(t.id) + ' · ' + esc(t.gate) + ' · ' + fDT(t.s) + '</div></div>' + pill(tStatus(t)) + '</div>';
    }).join('') + '</div>';
    return h;
  }
  function moreLog() {
    var h = '<h2>Add entry</h2><div class="card"><textarea id="lognew" placeholder="Decision, checkpoint update, observation…"></textarea>' +
      '<div class="btn-grid" style="margin-top:8px"><button class="btn primary" data-act="addlog">Add to log</button><button class="btn" data-act="sharelog">Share log</button></div></div>';
    h += '<h2>Event log</h2><div class="card">' + (S.log.length ? S.log.slice(0, 400).map(function (l) {
      return '<div class="log-item"><time>' + fDT(new Date(l.t)) + '</time>' + esc(l.m) + (l.by ? ' <span class="muted small">— ' + esc(l.by) + '</span>' : '') + '</div>';
    }).join('') : '<div class="empty">No entries yet. Status changes are logged automatically.</div>') + '</div>';
    return h;
  }
  function moreChanges() {
    return '<h2>Change log ' + esc(R.version) + '</h2>' + (R.info && R.info.version ? '<div class="card small">' + esc(R.info.version) + '</div>' : '') + '<div class="card">' + R.changelog.map(function (c) {
      return '<div class="log-item"><b>' + esc(c.item) + '</b> · ' + esc(c.tab) + '<div>' + esc(c.desc) + '</div><div class="small muted">' + esc(c.by) + ' · ' + esc(c.date) + '</div></div>';
    }).join('') + '</div>';
  }
  function moreRunbook() {
    var w = R.warnings || [];
    return '<h2>Loaded runbook</h2><div class="card"><b>' + esc(R.source || 'Runbook') + '</b><div class="small muted">' + esc(R.title) + '</div>' +
      (meta && meta.at ? '<div class="small muted">Loaded ' + fDT(new Date(meta.at)) + '</div>' : '') +
      '<div class="row wrap" style="margin-top:8px"><span class="tag">' + tasks.length + ' tasks</span><span class="tag">' + devices.length + ' devices</span>' +
      '<span class="tag">' + trucks.length + ' trucks</span><span class="tag">' + Object.keys(R.sheets).length + ' tracked sheets</span></div>' +
      (w.length ? '<div class="section-t">Warnings</div>' + w.map(function (x) { return '<div class="small" style="color:var(--warn)">• ' + esc(x) + '</div>'; }).join('') : '') + '</div>' +
      '<h2>Export</h2><div class="card"><p class="small muted" style="margin-top:0">Download your original runbook with all progress written in: task Status & Actual Start/End, device Movement / Shutdown status, truck actuals & documents, checklist and tracker columns, issues, notes and an “App Event Log” sheet. Formatting, formulas and drop-downs are kept.</p>' +
      '<button class="btn primary block" data-act="xlsx">Export updated Excel</button>' +
      (S.exportedAt ? '<div class="small muted" style="margin-top:6px">Last exported ' + fDT(new Date(S.exportedAt)) + '</div>' : '') + '</div>' +
      '<h2>Update</h2><div class="card"><p class="small muted" style="margin-top:0">Upload a newer version with the same format. Progress recorded here is kept and matched by Task ID, device hostname + serial, truck number and row IDs.</p>' +
      '<label class="btn primary block">Upload new runbook version<input type="file" id="reupload" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label></div>' +
      '<h2>Remove</h2><div class="card"><p class="small muted" style="margin-top:0">Deletes the runbook data stored in this browser. Progress is kept unless you also clear it under “Your name, backup & reset”.</p>' +
      '<button class="btn bad block" data-act="unload">Remove runbook from this device</button></div>';
  }
  function moreData() {
    return '<h2>Your name</h2><div class="card"><input type="text" id="who" placeholder="Shown on log entries" value="' + esc(S.who) + '"></div>' +
      '<h2>Share & backup</h2><div class="card"><p class="small muted" style="margin-top:0">Progress is stored only in this browser. Export the Excel (or a backup) to hand over to another phone.</p>' +
      '<button class="btn primary block" data-act="xlsx" style="margin-bottom:8px">Export updated Excel</button>' +
      '<div class="btn-grid"><button class="btn" data-act="share">Share status</button><button class="btn" data-act="csv">Tasks CSV</button>' +
      '<button class="btn" data-act="backup">Backup (JSON)</button><label class="btn">Restore<input type="file" id="restore" accept="application/json,.json" hidden></label></div></div>' +
      '<h2>Reset</h2><div class="card"><button class="btn bad block" data-act="reset">Clear all progress on this device</button></div>';
  }
  function afterMore(sub) {
    if (sub === 'runbook') $('#reupload').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      toast('Reading ' + f.name + '…');
      window.loadRunbookFile(f).then(function () { location.hash = '#home'; location.reload(); }, function (err) { toast(err.message || 'Could not read that file'); });
    });
    if (sub === 'contacts') { var q = $('#cq'); q.addEventListener('input', debounce(function () { $('#clist').innerHTML = contactsHTML(q.value); }, 150)); }
    if (sub === 'data') {
      $('#who').addEventListener('input', debounce(function (e) { S.who = e.target.value.trim(); save(); }, 300));
      $('#restore').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var o = JSON.parse(rd.result);
            if (!o || typeof o !== 'object' || !o.tasks || !o.sh) throw new Error('bad');
            if (!confirm('Replace progress on this device with the backup?')) return;
            S = Object.assign(defaults(), o); save(); toast('Backup restored'); rerender();
          } catch (err) { toast('That file is not a CBS Shift backup'); }
        };
        rd.readAsText(f);
      });
    }
  }

  /* ---------------- share / export ---------------- */
  function statusText() {
    var n = now(), c = counts(tasks), L = [];
    L.push('*' + ((R.wave && R.wave.name) || R.title) + '* — status ' + fDT(n));
    L.push('GO/NO-GO: ' + decisionOf(shRows('gonogo')));
    L.push('Tasks: ' + c.closed + '/' + c.total + ' done, ' + c['In Progress'] + ' in progress, ' + c.Blocked + ' blocked, ' + c.overdue + ' behind plan');
    var tc = {};
    trucks.forEach(function (t) { var s = tkStatus(t); tc[s] = (tc[s] || 0) + 1; });
    L.push('Trucks: ' + TRUCK.filter(function (s) { return tc[s]; }).map(function (s) { return tc[s] + ' ' + s.toLowerCase(); }).join(', '));
    var phys = devices.filter(function (d) { return !d.virtual; });
    L.push('Physical devices validated: ' + phys.filter(function (d) { return dMig(d) === 'Validated'; }).length + '/' + phys.length);
    L.push('');
    gates.forEach(function (g) {
      var gt = tasks.filter(function (t) { return t.gate === g; }), gc = counts(gt);
      var cur = gt.filter(function (t) { return tStatus(t) === 'In Progress'; }).map(function (t) { return t.id; });
      L.push(g + ': ' + gc.closed + '/' + gc.total + (cur.length ? ' · now ' + cur.slice(0, 6).join(', ') + (cur.length > 6 ? '…' : '') : '') + (gc.Blocked ? ' · ' + gc.Blocked + ' BLOCKED' : ''));
    });
    var bl = tasks.filter(function (t) { return tStatus(t) === 'Blocked'; });
    if (bl.length) { L.push(''); L.push('Blocked:'); bl.forEach(function (t) { L.push('- ' + t.id + ' ' + firstLine(t.desc).slice(0, 90) + (tState(t).note ? ' — ' + tState(t).note : '')); }); }
    var iss = shRows('issues').filter(function (r) { return shVal('issues', r, 'Issue Summary') && !/closed/i.test(shVal('issues', r, 'Issue Status')); });
    if (iss.length) { L.push(''); L.push('Open issues:'); iss.forEach(function (r) { L.push('- ' + r.key + ' ' + shVal('issues', r, 'Issue Summary') + (shVal('issues', r, 'Owner') ? ' (' + shVal('issues', r, 'Owner') + ')' : '')); }); }
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
    var rows = [['Batch', 'Task ID', 'Location', 'Description', 'Responsible Team', 'Truck', 'Planned Start', 'Planned End', 'Planned Minutes', 'Status', 'Actual Start', 'Actual End', 'Dependencies', 'Note']];
    tasks.forEach(function (t) {
      var st = tState(t);
      rows.push([t.gate, t.id, t.loc, t.desc.replace(/\n/g, ' '), t.team, t.truck, fDT(t.s), fDT(t.e), t.dur, tStatus(t),
        st.aStart ? fDT(new Date(st.aStart)) : '', st.aEnd ? fDT(new Date(st.aEnd)) : '', t.deps, st.note || '']);
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }
  function stamp() { var n = now(); return n.getFullYear() + pad(n.getMonth() + 1) + pad(n.getDate()) + '-' + pad(n.getHours()) + pad(n.getMinutes()); }

  var exporting = false;
  function exportExcel() {
    if (exporting) return;
    exporting = true;
    toast('Building Excel…');
    setTimeout(function () {
      window.exportUpdatedExcel(R, S).then(function (res) {
        exporting = false;
        S.exportedAt = nowIso(); log('Exported ' + res.name); save();
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
      '<div class="card small" style="background:var(--chip);border:0">Updated: ' + res.summary.map(esc).join(' · ') + '</div>' +
      '<div class="btn-grid"><a class="btn primary" href="' + url + '" download="' + esc(res.name) + '">Download</a>' +
      (canShare ? '<button class="btn" id="shareXlsx">Share…</button>' : '<span></span>') + '</div>' +
      '<p class="small muted">Re-uploading this file later (here or on another phone) brings the progress back.</p>', function () {
      var b = $('#shareXlsx');
      if (b) b.addEventListener('click', function () { navigator.share({ files: [file], title: res.name }).catch(function () {}); });
    });
  }
  function askOriginal() {
    openSheet('<h3>Original runbook needed</h3><p class="small muted">This device has the runbook data but not the original Excel file. Pick the same runbook .xlsx once — your progress is kept — and the export will continue.</p>' +
      '<label class="btn primary block">Choose runbook file<input type="file" id="origFile" accept=".xlsx,.xlsm" hidden></label>', function () {
      $('#origFile').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        window.attachOriginalFile(f, R).then(function () { closeSheet(); exportExcel(); }, function (err) { toast(err.message || 'Could not use that file'); });
      });
    });
  }

  /* ---------------- global search ---------------- */
  function openSearch() {
    openSheet('<input class="search" type="search" id="gq" placeholder="Search tasks, devices, trucks, people…" autocomplete="off"><div id="gres" class="small muted" style="padding:8px 2px">Type a hostname, serial, IP, rack, truck, task ID or name.</div>', function () {
      var q = $('#gq'); setTimeout(function () { q.focus(); }, 50);
      q.addEventListener('input', debounce(function () {
        var v = q.value.toLowerCase().trim(), out = $('#gres');
        if (v.length < 2) { out.innerHTML = 'Type at least 2 characters.'; return; }
        var trl = trucks.filter(function (t) { return t.id.toLowerCase() === v || (t.id + ' ' + t.srcRacks + ' ' + t.dstRacks).toLowerCase().indexOf(v) >= 0; }).slice(0, 5);
        var tl = tasks.filter(function (t) { return (t.id + ' ' + t.desc + ' ' + t.team).toLowerCase().indexOf(v) >= 0; }).slice(0, 8);
        var dl = devices.filter(function (d) { return d.hay.indexOf(v) >= 0; }).slice(0, 15);
        var cl = R.contacts.concat((R.escalation || { people: [] }).people).filter(function (c) { return [c.name, c.role, c.phone, c.email, c.org].join(' ').toLowerCase().indexOf(v) >= 0; }).slice(0, 6);
        var h = '';
        if (trl.length) h += '<div class="section-t">Trucks</div><div class="list">' + trl.map(function (t) {
          return '<div class="li" data-truck="' + esc(t.id) + '"><div class="grow"><div class="title">' + esc(t.id) + ' ' + pill(tkStatus(t)) + '</div><div class="sub">' + esc(t.scope) + '</div></div></div>';
        }).join('') + '</div>';
        if (tl.length) h += '<div class="section-t">Tasks</div><div class="list">' + tl.map(function (t) {
          return '<div class="li" data-task-link="' + esc(t.id) + '"><div class="grow"><div class="title">' + esc(t.id) + ' ' + pill(tStatus(t)) + '</div><div class="sub">' + esc(firstLine(t.desc)) + '</div></div></div>';
        }).join('') + '</div>';
        if (dl.length) h += '<div class="section-t">Devices</div><div class="list">' + dl.map(devRow).join('') + '</div>';
        if (cl.length) h += '<div class="section-t">People</div><div class="card" style="padding:4px 14px">' + cl.map(function (c) {
          return '<div class="contact"><b>' + esc(c.name) + '</b> <span class="small muted">' + esc(c.role || '') + '</span>' + contactLinks((c.phone || '') + ' ' + (c.email || '')) + '</div>';
        }).join('') + '</div>';
        out.innerHTML = h || '<div class="empty">No matches.</div>';
        out.classList.remove('small', 'muted');
      }, 150));
    });
  }

  /* ---------------- bottom sheet ---------------- */
  var sheet = $('#sheet'), backdrop = $('#sheetBackdrop'), sheetOpen = false;
  function openSheet(html, after) {
    $('#sheetBody').innerHTML = html;
    $('#sheetBody').scrollTop = 0;
    sheet.hidden = false; backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
    if (after) after();
  }
  function reopen(fn) { var y = $('#sheetBody').scrollTop; fn(); $('#sheetBody').scrollTop = y; }
  var lastOpen = null;
  function remember(fn, args) { lastOpen = [fn, args]; }
  function closeSheet(fromNav) {
    if (sheet.hidden) return;
    sheet.hidden = true; backdrop.hidden = true;
    document.body.style.overflow = '';
    if (sheetOpen && !fromNav) { sheetOpen = false; history.back(); return; }
    sheetOpen = false;
  }
  backdrop.addEventListener('click', function () { closeSheet(); rerender(); });
  window.addEventListener('popstate', function () { if (sheetOpen) { sheetOpen = false; closeSheet(true); rerender(); } });
  (function () {
    var y0 = null, dy = 0, body = $('#sheetBody');
    sheet.addEventListener('touchstart', function (e) { if (body.scrollTop <= 0 && !/INPUT|TEXTAREA/.test(e.target.tagName)) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sheet.addEventListener('touchmove', function (e) { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    sheet.addEventListener('touchend', function () { sheet.style.transform = ''; if (y0 != null && dy > 110) { closeSheet(); rerender(); } y0 = null; });
  })();

  /* ---------------- events ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-quick],[data-task],[data-task-link],[data-dev],[data-go],[data-gate],[data-tstatus],[data-sort],[data-dbatch],[data-dkind],[data-dstate],[data-dview],[data-dmore],' +
      '[data-setstatus],[data-devmig],[data-devshut],[data-bulk],[data-bulkset],[data-truck],[data-tadv],[data-tbatch],[data-tkstatus],[data-yn],[data-loadall],[data-shnow],[data-genum],' +
      '[data-grow],[data-ggrp],[data-gf],[data-gmore],[data-gadd],[data-host],[data-dmode],[data-rside],[data-rbatch],[data-rack],[data-rackgo],[data-cabstep],[data-lbl],[data-lblall],[data-cby],[data-ctog],[data-cset],[data-clbl],[data-cnav],[data-cjump],[data-act]');
    if (!el) return;
    var ds = el.dataset;
    if (ds.quick) {
      e.stopPropagation();
      var t = taskById[ds.quick], s = tStatus(t);
      if (s === 'Open') { setTaskStatus(t, 'In Progress'); toast(t.id + ' started'); }
      else if (s === 'In Progress') { setTaskStatus(t, 'Done'); toast(t.id + ' done'); }
      else return openTask(t.id);
      return sheetOpen && lastOpen ? reopen(function () { lastOpen[0].apply(null, lastOpen[1]); }) : rerender();
    }
    if (ds.cby) { cs.by = ds.cby; cs.val = ''; startScope(); saveCs(); return renderCables(); }
    if (ds.ctog) { cs[ds.ctog] = !cs[ds.ctog]; saveCs(); return renderCables(); }
    if (ds.cset) {
      var cdv = devByKey[ds.key], same = String(dCab(cdv, ds.cset)) === ds.v;
      setCab(cdv, ds.cset, same ? '' : +ds.v);
      if (cs.auto && !same && cabDone(cdv)) { renderCables(); scheduleNext(); return; }
      return renderCables();
    }
    if (ds.clbl) { var lv = devByKey[ds.clbl]; setCab(lv, 'lbl', !dLbl(lv)); return renderCables(); }
    if (ds.cnav) {
      clearTimeout(advT);
      if (ds.cnav === '1') return cabNext();
      cs.idx = Math.max(0, cs.idx - 1); saveCs(); renderCables(); return window.scrollTo(0, 0);
    }
    if (ds.cjump) { clearTimeout(advT); cs.idx = +ds.cjump; saveCs(); renderCables(); return window.scrollTo(0, 0); }
    if (ds.cabstep) {
      var cd = devByKey[ds.key], cur0 = parseInt(dCab(cd, ds.cabstep), 10) || 0;
      var nv = Math.max(0, cur0 + (+ds.step));
      setCab(cd, ds.cabstep, nv);
      var box = el.parentNode.querySelector('input');
      if (box) box.value = nv;
      return;
    }
    if (ds.lbl) {
      var ld = devByKey[ds.lbl], on = !dLbl(ld);
      setCab(ld, 'lbl', on);
      if (on) log(ld.name + ' · labelled');
      save();
      return lastOpen ? reopen(function () { lastOpen[0].apply(null, lastOpen[1]); }) : null;
    }
    if (ds.lblall) {
      var on2 = ds.v === '1', list2 = rackDevices(ds.side, ds.lblall);
      list2.forEach(function (x) { var o = S.dev[x.key] || (S.dev[x.key] = {}); o.lbl = on2; o.at = nowIso(); });
      log('Rack ' + ds.lblall + ' · ' + list2.length + ' devices ' + (on2 ? 'labelled' : 'labels cleared')); save();
      return reopen(function () { openRack(ds.side, ds.lblall); });
    }
    if (ds.dmode) { location.hash = ds.dmode === 'racks' ? '#devices/racks' : '#devices'; return; }
    if (ds.rside) { ui.rSide = ds.rside; return renderRacks(); }
    if (ds.rbatch) { ui.rBatch = ds.rbatch; return renderRacks(); }
    if (ds.rack) return openRack(ui.rSide === 'dst' ? 'dst' : 'src', ds.rack);
    if (ds.rackgo) { e.preventDefault(); if (!ds.r || isNA(ds.r)) return; return openRack(ds.rackgo, ds.r); }
    if (ds.task) return openTask(ds.task);
    if (ds.taskLink) { e.preventDefault(); return openTask(ds.taskLink); }
    if (ds.truck) { e.preventDefault(); return openTruck(ds.truck); }
    if (ds.host) {
      e.preventDefault();
      var host = devices.filter(function (d) { return !d.virtual && (d.host || '').toLowerCase() === ds.host.toLowerCase(); })[0];
      return host ? openDevice(host.key) : toast('Host not found in scope');
    }
    if (ds.dev) return openDevice(ds.dev);
    if (ds.go) { location.hash = ds.go; return; }
    if (ds.gate) { ui.gate = ds.gate; return renderTasks(null, true); }
    if (ds.tstatus) { ui.status = ds.tstatus; return renderTasks(null, true); }
    if (ds.sort) { ui.sort = ui.sort === 'batch' ? 'time' : 'batch'; return renderTasks(null, true); }
    if (ds.dbatch) { ui.dBatch = ds.dbatch; ui.dLimit = PAGE; return renderDevices(null, true); }
    if (ds.dkind) { ui.dKind = ds.dkind; ui.dLimit = PAGE; return renderDevices(null, true); }
    if (ds.dstate) { ui.dState = ds.dstate; ui.dLimit = PAGE; return renderDevices(null, true); }
    if (ds.dview) { ui.dView = ds.dview; ui.dState = 'All'; return renderDevices(null, true); }
    if (ds.dmore) { ui.dLimit += PAGE * 2; return renderDevices(null, true); }
    if (ds.setstatus) { setTaskStatus(taskById[ds.id], ds.setstatus); return reopen(function () { openTask(ds.id); }); }
    if (ds.devshut) { setDev(devByKey[ds.key], 'shut', ds.devshut); return reopen(function () { openDevice(ds.key); }); }
    if (ds.devmig) {
      var d = devByKey[ds.key], cur = migIdx(dMig(d)), i = ds.devmig === 'issue' ? -2 : +ds.devmig;
      var val = i === -2 ? (dMig(d) === 'Issue' ? 'Pending' : 'Issue') : (i > 0 && cur === i ? MIG[i - 1] : MIG[i]);
      setDev(d, 'mig', val);
      return reopen(function () { openDevice(ds.key); });
    }
    if (ds.bulk) {
      if (ds.bulk === 'list') return openBulk(renderDevices.list || [], (renderDevices.list || []).length + ' listed devices');
      var trk = ds.id;
      return openBulk(devices.filter(function (x) { return x.truck === trk && !x.virtual; }), trk + ' · physical devices');
    }
    if (ds.bulkset) {
      bulkList.forEach(function (x) { setDev(x, ds.bulkset, ds.v, true); });
      log(bulkList.length + ' devices · ' + (ds.bulkset === 'mig' ? 'movement' : 'shutdown') + ' → ' + ds.v); save();
      toast(bulkList.length + ' devices → ' + ds.v);
      return reopen(function () { openBulk(bulkList, bulkList.length + ' devices'); });
    }
    if (ds.tadv) { truckAdvance(trById(ds.tadv)); return rerender(); }
    if (ds.tbatch) { ui.tBatch = ds.tbatch; return renderTrucks(null, true); }
    if (ds.tkstatus) {
      var tr = trById(ds.id);
      tkSet(tr, 'Status', ds.tkstatus);
      if (ds.tkstatus === 'In Transit' && !tkVal(tr, 'Actual Departure')) tkSet(tr, 'Actual Departure', nowIso(), true);
      if (ds.tkstatus === 'Arrived' && !tkVal(tr, 'Actual Arrival')) tkSet(tr, 'Actual Arrival', nowIso(), true);
      return reopen(function () { openTruck(ds.id); });
    }
    if (ds.yn) {
      var r0 = shRows(ds.yn).filter(function (r) { return r.key === ds.key; })[0];
      setSh(ds.yn, ds.key, ds.col, /^y/i.test(shVal(ds.yn, r0, ds.col)) ? 'N' : 'Y');
      return reopen(function () { openTruck(ds.truckRef); });
    }
    if (ds.loadall) {
      var col = ds.loadall === 'loaded' ? 'Loaded at Source (Y/N)' : 'Received at Target (Y/N)';
      shRows('load').filter(function (r) { return r.v[C.norm('Truck No')] === ds.id; }).forEach(function (r) { setSh('load', r.key, col, 'Y', true); });
      log(ds.id + ' · all items ' + ds.loadall); save();
      return reopen(function () { openTruck(ds.id); });
    }
    if (ds.shnow) {
      e.preventDefault();
      setSh(ds.shnow, ds.key, ds.col, nowIso());
      var inp = el.parentNode.querySelector('input');
      var d2 = new Date();
      if (inp) inp.value = d2.getFullYear() + '-' + pad(d2.getMonth() + 1) + '-' + pad(d2.getDate()) + 'T' + pad(d2.getHours()) + ':' + pad(d2.getMinutes());
      toast(ds.col + ' set');
      return;
    }
    if (ds.genum) {
      var rr = shRows(ds.id).filter(function (r) { return r.key === ds.key; })[0];
      var curV = shVal(ds.id, rr, ds.col);
      setSh(ds.id, ds.key, ds.col, curV === ds.genum ? '' : ds.genum);
      return reopen(function () { openGeneric(ds.id, ds.key); });
    }
    if (ds.grow) return openGeneric(ds.id, ds.grow);
    if (ds.ggrp) { ui.g[ds.id].grp = ds.ggrp; ui.g[ds.id].limit = PAGE; return renderSheet(ds.id, true); }
    if (ds.gf) { ui.g[ds.id].f = ds.gf; ui.g[ds.id].limit = PAGE; return renderSheet(ds.id, true); }
    if (ds.gmore) { ui.g[ds.gmore].limit += PAGE * 2; return renderSheet(ds.gmore, true); }
    if (ds.gadd) return newGenericRow(ds.gadd);
    switch (ds.act) {
      case 'xlsx': return exportExcel();
      case 'share': return shareText(statusText(), 'CBS Shift status');
      case 'csv': return download('cbsshift-tasks-' + stamp() + '.csv', tasksCSV(), 'text/csv');
      case 'backup': return download('cbsshift-backup-' + stamp() + '.json', JSON.stringify(S, null, 1), 'application/json');
      case 'unload':
        if (confirm('Remove the runbook data from this device? You will need to upload it again.')) window.forgetRunbook().then(function () {
          history.replaceState(null, '', location.pathname);
          try { localStorage.removeItem(ROUTE_KEY); } catch (e2) { /* ignore */ }
          location.reload();
        });
        return;
      case 'reset':
        if (confirm('Clear all task, device, truck and checklist progress on this device?')) { var who = S.who; S = defaults(); S.who = who; save(); toast('Progress cleared'); rerender(); }
        return;
      case 'addlog':
        var v = $('#lognew').value.trim(); if (!v) return;
        log(v); save(); return rerender();
      case 'sharelog':
        return shareText(S.log.map(function (l) { return fDT(new Date(l.t)) + ' ' + l.m + (l.by ? ' — ' + l.by : ''); }).join('\n'), 'CBS Shift log');
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.cabin) return;
    var v = el.value === '' ? '' : Math.max(0, parseInt(el.value, 10) || 0);
    setCab(devByKey[el.dataset.key], el.dataset.cabin, v);
    if (v !== '') el.value = v;
    if (el.closest('.pad')) {
      var dd = devByKey[el.dataset.key];
      renderCables();
      if (cs.auto && cabDone(dd)) scheduleNext();
    }
  });
  $('#searchBtn').addEventListener('click', openSearch);
  window.addEventListener('hashchange', route);

  /* ---------------- clock ---------------- */
  var kick = toDate((R.wave && R.wave.start) || '') || (tasks.filter(function (t) { return t.gate !== 'Pre-Event' && t.s; }).sort(byStart)[0] || {}).s;
  function tick() {
    var n = now(), txt = fDay(n) + ' ' + fTime(n);
    if (kick) { var m = (kick - n) / 60000; txt += m > 0 ? ' · cutover starts in ' + fDur(m) : ' · T+' + fDur(-m); }
    $('#clock').textContent = txt;
  }
  tick(); setInterval(tick, 30000);

  $('.brand-title').textContent = R.short || 'CBS Shift';
  document.title = (R.short || 'CBS Shift') + ' Runbook';
  function measure() { document.documentElement.style.setProperty('--topbar-h', $('.topbar').offsetHeight + 'px'); }
  measure(); window.addEventListener('resize', measure);

  if (!location.hash) {
    var last = null;
    try { last = localStorage.getItem(ROUTE_KEY); } catch (e) { /* ignore */ }
    if (last && last !== '#home') history.replaceState(null, '', last);
  }
  route();
};
