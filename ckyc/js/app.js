/* CKYC 2.0 Hub — demo console UI. */
(function () {
  'use strict';
  const H = window.Hub;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal-root');
  const $toasts = document.getElementById('toasts');

  // ---------- small utils ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ckycHubDemo.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { if (v == null) localStorage.removeItem('ckycHubDemo.' + k); else localStorage.setItem('ckycHubDemo.' + k, v); } catch (e) { /* ignore */ } },
  };
  const fmtTime = (t) => { if (!t) return '—'; const d = new Date(t); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };
  const ago = (t) => { const s = (Date.now() - Date.parse(t)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; };
  const json = (o) => esc(JSON.stringify(o, null, 2));
  const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind; el.textContent = msg;
    $toasts.appendChild(el);
    while ($toasts.children.length > 3) $toasts.firstChild.remove();
    setTimeout(() => el.remove(), 4200);
  }

  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    channels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    create: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><path d="M19 8v6M16 11h6"/></svg>',
    update: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M6 9v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9M12 13v2"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h9"/></svg>',
    otp: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    form: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    face: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c.8-1.6 2.3-2.5 4-2.5s3.2.9 4 2.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };
  const MARK = '<span class="mark"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 12.5l4 4L18 8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  // ---------- session ----------
  H.load();
  let user = null;
  function currentUser() {
    const u = store.get('user', null);
    return u ? H.state.users.find((x) => x.username === u) || null : null;
  }
  user = currentUser();
  const isStaff = () => user && user.role !== 'BRANCH';
  const canAct = () => user && user.role !== 'VIEWER';
  const roleLabel = (u) => ({ ADMIN: 'Admin', OPERATOR: 'Operator', VIEWER: 'Viewer (read-only)', BRANCH: 'Branch ' + (u.dp || '') }[u.role]);
  function applyTheme() { document.documentElement.setAttribute('data-theme', store.get('theme', 'default') === 'classic' ? 'classic' : 'light'); }
  applyTheme();

  // ---------- routing ----------
  function route() {
    const raw = (location.hash || '#/overview').slice(1);
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { parts, q };
  }
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
  window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

  // UI state that survives re-renders within a page
  const ui = { acctTab: {}, cmp: {}, apiResp: null, apiBody: null, adminTab: 'simulate', lastKey: null };

  // ---------- counts ----------
  function counts(list) {
    const c = { CREATE: { action: 0, waiting: 0, done: 0, rejected: 0, total: 0 }, UPDATE: { action: 0, waiting: 0, done: 0, rejected: 0, total: 0 } };
    list.forEach((a) => { const b = H.STATUS[a.status].bucket; c[a.queue][b] += 1; c[a.queue].total += 1; });
    return c;
  }
  const pill = (status) => `<span class="pill ${H.STATUS[status].bucket}">${esc(H.STATUS[status].label)}</span>`;
  const chName = (code) => (H.CHANNELS.find((c) => c.code === code) || { name: code }).name;

  // ---------- layout ----------
  function layout(active, inner) {
    const vis = H.visibleAccounts(user);
    const c = counts(vis);
    const nav = [
      ['overview', 'Overview', ICON.home, null],
      ['channels', 'Channels', ICON.channels, null],
      ['queue/create', 'Create Requests', ICON.create, c.CREATE.action + c.CREATE.rejected],
      ['queue/update', 'Update Requests', ICON.update, c.UPDATE.action + c.UPDATE.rejected],
    ];
    if (isStaff()) nav.push(['api', 'Data Fetch API', ICON.api, null]);
    if (user.role === 'ADMIN') nav.push(['admin', 'Administration', ICON.admin, null]);
    const navHtml = nav.map(([h, l, i, n]) => `<a href="#/${h}" class="${active === h ? 'active' : ''}">${i}<span>${l}</span>${n ? `<span class="count">${n}</span>` : ''}</a>`).join('');
    return `
      <header class="topbar">
        <a class="brand" href="#/overview">${MARK}<span class="txt">CKYC 2.0 Hub</span></a>
        <span class="spacer"></span>
        <button class="iconbtn" data-act="theme" title="Switch theme (default / classic MIS)" aria-label="Switch theme">${ICON.palette}</button>
        <div class="userchip"><span class="avatar">${esc(initials(user.name))}</span><span class="who">${esc(user.name)}<small>${esc(roleLabel(user))}</small></span></div>
        <button class="iconbtn" data-act="logout" title="Sign out" aria-label="Sign out">${ICON.logout}</button>
      </header>
      <div class="shell">
        <nav class="sidenav">
          <div class="label">Work</div>
          ${navHtml}
          <div class="sep"></div>
          <div class="label">Demo</div>
          <a href="#/guide" class="${active === 'guide' ? 'active' : ''}">${ICON.guide}<span>Demo guide</span></a>
          <a href="#/process" class="${active === 'process' ? 'active' : ''}">${ICON.flow}<span>How it works</span></a>
        </nav>
        <main>${inner}</main>
      </div>`;
  }

  // ---------- views ----------
  function viewLogin() {
    const chips = H.state.users.filter((u) => ['branch.0123', 'branch.0456', 'branch.0789', 'branch.0234', 'branch.0345', 'admin'].includes(u.username)).map((u) => `
      <button class="acct-chip" data-act="fill-login" data-u="${esc(u.username)}" data-p="${esc(u.password)}" type="button">
        <code>${esc(u.username)}</code><span class="pill plain">${esc(roleLabel(u))}</span>
        <small>${{ OPERATOR: 'Full workflow across all branches', BRANCH: `Sees only branch ${esc(u.dp)} (${esc((H.BRANCHES[u.dp] || {}).name || '')})`, ADMIN: 'Channels, API keys, users, statistics, simulate pushes', VIEWER: 'Read-only, all branches' }[u.role]}</small>
      </button>`).join('');
    return `
      <div class="login">
        <section class="hero">
          <div class="hero-mark">${MARK}</div>
          <h1>CKYC 2.0 Hub</h1>
        </section>
        <section class="form">
          <div class="box">
            <h2 style="font-size:20px">Sign in</h2>
            <p class="muted" style="margin:6px 0 0">Select your login.</p>
            <div class="acct-chips">${chips}</div>
            <form id="login-form" class="stack" autocomplete="off">
              <label class="field">Username<input name="u" id="lu" required /></label>
              <label class="field">Password<input name="p" id="lp" type="password" required /></label>
              <div id="login-err" class="small" style="color:var(--err)"></div>
              <button class="btn primary" style="width:100%" type="submit">Sign in</button>
            </form>
          </div>
        </section>
      </div>`;
  }

  function viewOverview() {
    const vis = H.visibleAccounts(user);
    const c = counts(vis);
    const tiles = (q) => {
      const k = q.toLowerCase();
      return [
        ['action', 'Need action', '#d98a00'], ['waiting', 'Awaiting registry', '#1d5fbf'], ['done', 'Done', '#18794e'], ['rejected', 'Rejected', '#b42318'],
      ].map(([b, l, col]) => `<a class="kpi" href="#/queue/${k}?b=${b}"><div class="l"><span class="dot" style="background:${col}"></span>${l}</div><div class="n">${c[q][b]}</div></a>`).join('');
    };
    const chCards = H.CHANNELS.map((ch) => {
      const list = vis.filter((a) => a.channel === ch.code);
      const cc = counts(list);
      return `<a class="card chcard" href="#/channel/${ch.code}"><div class="code">${ch.code}</div><h3>${esc(ch.name)}</h3>
        <div class="counts"><div><b>${cc.CREATE.action + cc.CREATE.rejected}</b>create to work</div><div><b>${cc.UPDATE.action + cc.UPDATE.rejected}</b>update to work</div></div></a>`;
    }).join('');
    const recent = [];
    vis.forEach((a) => a.timeline.slice(0, 4).forEach((t) => recent.push({ a, t })));
    recent.sort((x, y) => Date.parse(y.t.at) - Date.parse(x.t.at));
    const recentHtml = recent.slice(0, 8).map(({ a, t }) => `<li class="${t.kind}"><a href="#/account/${a.id}"><b>${esc(H.summary(a).name)}</b></a> — ${esc(t.text)}<div class="meta">${esc(t.actor)} · ${ago(t.at)}</div></li>`).join('');
    return layout('overview', `
      <div class="pagehead"><div><h1>Overview</h1><p>${user.role === 'BRANCH' ? `Branch ${esc(user.dp)} — ${esc((H.BRANCHES[user.dp] || {}).name || '')}` : 'Bank-wide CKYC work across all account-opening channels'}</p></div>
        <a class="btn" href="#/guide">${ICON.guide} Demo guide</a></div>
      ${H.state.settings.gatewayDown ? '<div class="banner err"><b>Gateway outage simulation is ON.</b>&nbsp;Registry calls will fail with 503 until an admin turns it off.</div>' : ''}
      <div class="section-title"><span class="qtag create">CREATE</span><h2>Create Requests — customers with no CKYC number yet</h2></div>
      <div class="grid g4">${tiles('CREATE')}</div>
      <div class="section-title"><span class="qtag update">UPDATE</span><h2>Update Requests — CKYC number known, registry needs our data</h2></div>
      <div class="grid g4">${tiles('UPDATE')}</div>
      <div class="section-title"><h2>Channels</h2></div>
      <div class="grid g3">${chCards}</div>
      <div class="section-title"><h2>Recent activity</h2></div>
      <div class="card card-pad"><ul class="timeline">${recentHtml || '<li>No activity yet.</li>'}</ul></div>
    `);
  }

  function viewChannels() {
    const vis = H.visibleAccounts(user);
    const cards = H.state.channels.map((ch) => {
      const cc = counts(vis.filter((a) => a.channel === ch.code));
      return `<a class="card chcard" href="#/channel/${ch.code}">
        <div class="row between"><span class="code">${ch.code}</span>${ch.enabled ? '<span class="pill done">Live</span>' : '<span class="pill rejected">Disabled</span>'}</div>
        <h3 style="margin-top:4px">${esc(ch.name)}</h3><div class="small muted">${esc(ch.product)} · ${esc(ch.types)}</div>
        <div class="counts"><div><b>${cc.CREATE.total}</b>Create requests · ${cc.CREATE.action + cc.CREATE.rejected} open</div><div><b>${cc.UPDATE.total}</b>Update requests · ${cc.UPDATE.action + cc.UPDATE.rejected} open</div></div></a>`;
    }).join('');
    return layout('channels', `<div class="pagehead"><div><h1>Channels</h1><p>Every account-opening application pushes to the same Data Fetch API with its own API key.</p></div></div><div class="grid g3">${cards}</div>`);
  }

  function viewChannel(code) {
    const ch = H.state.channels.find((c) => c.code === code);
    if (!ch) return layout('channels', '<p>Unknown channel.</p>');
    const list = H.visibleAccounts(user).filter((a) => a.channel === code);
    const cc = counts(list);
    const box = (q, label, sub) => `<a class="card card-pad chcard" href="#/queue/${q.toLowerCase()}?ch=${code}">
      <span class="qtag ${q.toLowerCase()}">${q}</span><h2 style="margin-top:8px">${label}</h2><p class="small muted" style="margin:4px 0 0">${sub}</p>
      <div class="counts" style="grid-template-columns:repeat(4,1fr)"><div><b>${cc[q].action}</b>action</div><div><b>${cc[q].waiting}</b>waiting</div><div><b>${cc[q].done}</b>done</div><div><b>${cc[q].rejected}</b>rejected</div></div></a>`;
    const events = isStaff() ? H.state.intake.filter((e) => e.channel === code).slice(0, 8) : [];
    return layout('channels', `
      <div class="crumbs"><a href="#/channels">Channels</a> / ${code}</div>
      <div class="pagehead"><div><h1>${esc(ch.name)}</h1><p>${esc(ch.product)} · ${esc(ch.types)}</p></div></div>
      <div class="grid g2">${box('CREATE', 'Create Requests', 'Search → create → poll → adjudicate')}${box('UPDATE', 'Update Requests', 'Fetch from registry → compare tags → update')}</div>
      ${events.length ? `<div class="section-title"><h2>Recent Data Fetch API calls</h2></div>
      <div class="card table-wrap"><table class="rows"><thead><tr><th>Time</th><th>eventType</th><th>Outcome</th><th>HTTP</th></tr></thead><tbody>
      ${events.map((e) => `<tr><td data-label="Time">${fmtTime(e.at)}</td><td data-label="eventType" class="mono">${esc(e.eventType || '—')}</td><td data-label="Outcome">${outcomePill(e.outcome)}</td><td data-label="HTTP" class="mono">${e.http}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
    `);
  }
  const outcomePill = (o) => `<span class="pill ${{ CREATED: 'done', UPDATED: 'waiting', DUPLICATE: '', REJECTED: 'rejected' }[o] || ''}">${esc(o)}</span>`;

  function viewQueue(queue, q) {
    const Q = queue.toUpperCase();
    let list = H.visibleAccounts(user).filter((a) => a.queue === Q);
    const all = list;
    if (q.ch) list = list.filter((a) => a.channel === q.ch);
    const byBucket = { all: list.length, action: 0, waiting: 0, done: 0, rejected: 0 };
    list.forEach((a) => { byBucket[H.STATUS[a.status].bucket] += 1; });
    const b = q.b || 'all';
    if (b !== 'all') list = list.filter((a) => H.STATUS[a.status].bucket === b);
    if (q.st) list = list.filter((a) => a.status === q.st);
    if (q.t) list = list.filter((a) => a.customerType === q.t);
    if (q.s) {
      const s = q.s.toLowerCase();
      list = list.filter((a) => { const m = H.summary(a); return [a.accountNumber, m.name, a.payload.account.customerId, m.mobile, m.pan, a.ckycNo].some((v) => String(v || '').toLowerCase().includes(s)); });
    }
    list.sort((x, y) => Date.parse(y.updatedAt) - Date.parse(x.updatedAt));
    const statuses = Object.keys(H.STATUS).filter((k) => H.STATUS[k].queue === Q || H.STATUS[k].queue === '*');
    const link = (patch) => { const n = Object.assign({}, q, patch); Object.keys(n).forEach((k) => { if (!n[k]) delete n[k]; }); const s = Object.keys(n).map((k) => k + '=' + encodeURIComponent(n[k])).join('&'); return `#/queue/${queue}${s ? '?' + s : ''}`; };
    const chips = [['all', 'All'], ['action', 'Needs action'], ['waiting', 'Awaiting registry'], ['done', 'Done'], ['rejected', 'Rejected']]
      .map(([k, l]) => `<a class="chip ${b === k ? 'on' : ''}" href="${link({ b: k === 'all' ? '' : k, st: '' })}">${l}<span class="c">${byBucket[k]}</span></a>`).join('');
    const rows = list.map((a) => {
      const m = H.summary(a);
      return `<tr class="click" data-href="#/account/${a.id}">
        <td class="lead" data-label="Customer"><b>${esc(m.name)}</b><span class="sub">${a.customerType === 'LEGAL' ? 'Legal entity' : 'Individual'} · ${esc(a.payload.account.customerId || '')}</span></td>
        <td data-label="Account" class="mono">${esc(a.accountNumber)}</td>
        <td data-label="Channel">${esc(a.channel)}</td>
        <td data-label="Branch">${esc(a.branchCode)}<span class="sub">${esc((H.BRANCHES[a.branchCode] || {}).name || '')}</span></td>
        <td data-label="Status">${pill(a.status)}</td>
        <td data-label="CKYC no." class="mono">${esc(a.ckycNo || (a.ckycRefNo ? 'ref ' + a.ckycRefNo : '—'))}</td>
        <td data-label="Updated" class="nowrap">${ago(a.updatedAt)}</td></tr>`;
    }).join('');
    return layout('queue/' + queue, `
      ${q.ch ? `<div class="crumbs"><a href="#/channels">Channels</a> / <a href="#/channel/${q.ch}">${q.ch}</a> / ${Q === 'CREATE' ? 'Create' : 'Update'} Requests</div>` : ''}
      <div class="pagehead"><div><h1><span class="qtag ${queue}" style="vertical-align:middle;margin-right:8px">${Q}</span>${Q === 'CREATE' ? 'Create Requests' : 'Update Requests'}</h1>
        <p>${Q === 'CREATE' ? 'Accounts whose customer has no CKYC number yet.' : 'Accounts whose CKYC number is known — the registry needs the bank\'s latest data.'} ${q.ch ? 'Channel: ' + esc(chName(q.ch)) : 'All channels'}${user.role === 'BRANCH' ? ' · branch ' + esc(user.dp) + ' only' : ''}</p></div></div>
      <div class="card">
        <div class="card-head" style="gap:12px">
          <div class="chips">${chips}</div>
          <div class="row">
            <select data-filter="ch" aria-label="Channel"><option value="">All channels</option>${H.CHANNELS.map((c) => `<option value="${c.code}" ${q.ch === c.code ? 'selected' : ''}>${c.code}</option>`).join('')}</select>
            <select data-filter="st" aria-label="Status"><option value="">Any status</option>${statuses.map((s) => `<option value="${s}" ${q.st === s ? 'selected' : ''}>${H.STATUS[s].label}</option>`).join('')}</select>
            <select data-filter="t" aria-label="Customer type"><option value="">Any type</option><option value="INDIVIDUAL" ${q.t === 'INDIVIDUAL' ? 'selected' : ''}>Individual</option><option value="LEGAL" ${q.t === 'LEGAL' ? 'selected' : ''}>Legal entity</option></select>
            <input type="search" data-filter="s" placeholder="Account, name, CIF, mobile, PAN, CKYC no." value="${esc(q.s || '')}" style="width:250px;max-width:100%" />
          </div>
        </div>
        <div class="table-wrap"><table class="rows"><thead><tr><th>Customer</th><th>Account</th><th>Channel</th><th>Branch</th><th>Status</th><th>CKYC no.</th><th>Updated</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="muted" style="padding:28px;text-align:center">No accounts match. ${all.length ? '' : 'Nothing in this queue yet.'}</td></tr>`}</tbody></table></div>
      </div>`);
  }

  // ---------- account page ----------
  function photoOf(a) {
    const face = a.payload.documents.find((d) => d.slot === 'FACE_CAPTURE' && d.preview);
    if (face) return `<img src="${esc(face.preview)}" alt="" />`;
    return esc(initials(H.summary(a).name));
  }
  const disabledAttr = () => (canAct() ? '' : 'disabled title="Read-only role"');

  function stepsFor(a) {
    if (a.queue === 'CREATE') {
      const order = ['RECEIVED', 'SEARCHED', 'CREATE_PENDING', 'OUTCOME'];
      const labels = ['Received', 'Searched', 'Submitted', 'Outcome'];
      let cur = { RECEIVED: 0, SEARCHED: 1, CREATE_PENDING: 2, PROBABLE_MATCH: 3, CONFIRMED_MATCH: 3, CKYC_CREATED: 4, REJECTED: 3 }[a.status];
      return order.map((_, k) => `<span class="step ${k < cur ? 'done' : k === cur ? 'cur' : ''}">${labels[k]}</span>`).join('');
    }
    const labels = ['Fetched from registry', 'Tags compared', 'Submitted', 'Updated'];
    let cur = a.status === 'CKYC_UPDATED' ? 4 : a.status === 'UPDATE_PENDING' ? 3 : a.fetched ? 1 : 0;
    return labels.map((l, k) => `<span class="step ${k < cur ? 'done' : k === cur ? 'cur' : ''}">${l}</span>`).join('');
  }

  function readinessHtml(a) {
    const r = H.readiness(a.payload);
    const items = r.block.map((x) => `<li><span class="i bad">✕</span>${esc(x)}</li>`).concat(r.adv.map((x) => `<li><span class="i adv">!</span>${esc(x)}</li>`));
    return `<div><h3 style="margin-bottom:6px">CKYC readiness</h3>
      ${r.ready ? '<ul class="checklist"><li><span class="i ok">✓</span>All mandatory data and documents present</li>' + r.adv.map((x) => `<li><span class="i adv">!</span>${esc(x)}</li>`).join('') + '</ul>'
        : `<ul class="checklist">${items.join('')}</ul><p class="small muted" style="margin:8px 0 0">Create stays disabled until the channel re-sends complete data. The push was not rejected — activation is never blocked.</p>`}</div>`;
  }

  function actionPanel(a) {
    const s = a.status;
    const dis = disabledAttr();
    const r = H.readiness(a.payload);
    if (a.queue === 'CREATE') {
      if (s === 'RECEIVED' || s === 'SEARCHED' || s === 'REJECTED') {
        const hit = a.search && a.search.results.length;
        const searchBlock = a.search ? `
          <div class="banner ${hit ? 'warn' : 'ok'}" style="margin:12px 0 0"><div><b>${hit ? 'Existing CKYC record found' : 'No existing record'}</b> — ${esc(a.search.option)} search ${ago(a.search.at)}; searchKey <span class="mono">${esc(a.searchKey)}</span> (valid 15 days).
          ${hit ? `<div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>ckycRefNo</th><th>Name</th><th>DOB</th><th>PAN</th><th>Matched on</th></tr></thead><tbody>${a.search.results.map((x) => `<tr><td class="mono">${esc(x.ckycRefNo)}</td><td>${esc(x.name)}</td><td class="mono">${esc(x.dob)}</td><td class="mono">${esc(x.pan)}</td><td>${esc(x.matchedOn)}</td></tr>`).join('')}</tbody></table></div>
            <p style="margin:8px 0 0">The customer probably exists — download with consent to obtain the CKYC number instead of creating a duplicate.</p>` : ''}</div></div>` : '';
        return `
          ${s === 'REJECTED' ? `<div class="banner err"><div><b>Registry rejected the create:</b> ${esc(a.rejectReason)}<br/>Fix at source: the channel corrects the data and re-sends, then search and create again.</div></div>` : ''}
          ${readinessHtml(a)}
          ${searchBlock}
          <div class="row" style="margin-top:14px">
            ${s === 'REJECTED' ? `<button class="btn primary" data-act="resend" data-kind="CORRECTED" ${dis}>Simulate channel re-send (corrected)</button>`
              : `<button class="btn ${a.search ? '' : 'primary'}" data-act="search" ${dis}>${a.search ? 'Search again' : '1 · Search registry (de-dupe)'}</button>
                 <button class="btn ${a.search && !hit ? 'primary' : ''}" data-act="create" ${!canAct() || !a.search || !r.ready ? 'disabled' : ''} title="${!a.search ? 'Search first' : !r.ready ? 'Data not CKYC-ready' : ''}">2 · Create CKYC record</button>
                 ${hit ? `<button class="btn primary" data-act="download" data-purpose="OBTAIN_CKYC" ${dis}>Download with consent</button><button class="btn" data-act="link" ${dis}>Link CKYC number…</button>` : ''}
                 ${!r.ready ? `<button class="btn" data-act="resend" data-kind="COMPLETE" ${dis}>Simulate channel re-send (complete data)</button>` : ''}`}
          </div>`;
      }
      if (s === 'CREATE_PENDING') {
        const wait = Math.max(0, Math.ceil((H.POLL_DELAY_MS - (Date.now() - Date.parse(a.submittedAt))) / 1000));
        return `<div class="banner"><div><b>Submitted to the registry</b> — ackNo <span class="mono">${esc(a.ackNo)}</span> at ${fmtTime(a.submittedAt)}. The registry processes creates asynchronously; check the status to pick up the outcome.${wait ? ` <span class="faint">(Simulated registry answers in ~${wait}s.)</span>` : ''}</div></div>
          <button class="btn primary" data-act="poll" ${dis}>Check status</button>`;
      }
      if (s === 'PROBABLE_MATCH') {
        const d = ui.cmp[a.id + ':adj'] || {};
        return `<div class="banner warn"><div><b>Probable match.</b> The registry found look-alike records. Compare each with the customer and mark it MATCH (same person) or NO_MATCH. If every candidate is NO_MATCH the registry creates a new record.</div></div>
          ${a.candidates.map((c, k) => `<div class="cand"><div><div class="mono small">${esc(c.ckycRefNo)}</div><b>${esc(c.name)}</b><div class="small muted">Matched on ${esc(c.criteria)}</div></div>
            <div style="text-align:right"><div class="score">${c.score}%</div><div class="seg" role="group"><button class="m ${d[k] === 'MATCH' ? 'on' : ''}" data-act="adj" data-k="${k}" data-v="MATCH" ${dis}>Match</button><button class="n ${d[k] === 'NO_MATCH' ? 'on' : ''}" data-act="adj" data-k="${k}" data-v="NO_MATCH" ${dis}>No match</button></div></div></div>`).join('')}
          <button class="btn primary" data-act="adj-submit" ${!canAct() || a.candidates.some((_, k) => !d[k]) ? 'disabled' : ''}>Submit decisions</button>`;
      }
      if (s === 'CONFIRMED_MATCH') {
        return `<div class="banner warn"><div><b>Confirmed match</b> — this customer already has a CKYC record (ref <span class="mono">${esc(a.ckycRefNo)}</span>). No duplicate was created. Obtain the CKYC number by a consented download, or link a number the customer supplied. The account then moves to Update Requests.</div></div>
          <div class="row"><button class="btn primary" data-act="download" data-purpose="OBTAIN_CKYC" ${dis}>Download with consent</button><button class="btn" data-act="link" ${dis}>Link CKYC number…</button></div>`;
      }
      if (s === 'CKYC_CREATED') {
        return `<div class="banner ok"><div><b>CKYC number ${esc(a.ckycNo)} issued.</b> The channel / CBS can read it back via <span class="mono">GET /api/v1/accounts/${esc(a.accountNumber)}/ckyc-status</span>.</div></div>
          <button class="btn" data-act="resend" data-kind="CHANGE" ${dis}>Simulate customer data change (channel re-send)</button>`;
      }
    }
    // UPDATE queue
    if (s === 'UPDATE_PENDING') {
      const wait = Math.max(0, Math.ceil((H.POLL_DELAY_MS - (Date.now() - Date.parse(a.submittedAt))) / 1000));
      const sub = a.submissions[0];
      return `<div class="banner"><div><b>Update submitted</b> — ackNo <span class="mono">${esc(a.ackNo)}</span> with ${sub && sub.tags ? sub.tags.length : '?'} tag(s).${wait ? ` <span class="faint">(Simulated registry answers in ~${wait}s.)</span>` : ''}</div></div>
        <button class="btn primary" data-act="poll-update" ${dis}>Check status</button>`;
    }
    if (s === 'CKYC_UPDATED') {
      return `<div class="banner ok"><div><b>Registry record is up to date</b> with the bank's data (CKYC ${esc(a.ckycNo)}).</div></div>
        <button class="btn" data-act="resend" data-kind="CHANGE" ${dis}>Simulate customer data change (channel re-send)</button>`;
    }
    // UPDATE_REQUIRED or REJECTED(update)
    const rej = s === 'REJECTED' ? `<div class="banner err"><div><b>Registry rejected the update:</b> ${esc(a.rejectReason)}. Correct the data (or the tag selection) and update again.</div></div>` : '';
    if (!a.fetched) {
      return `${rej}<p style="margin-top:0">Per CKYC 2.0, an update carries only the changed fields. First fetch the customer's current registry record, then compare it tag-by-tag with the bank's data.</p>
        <p class="small muted">${a.consentOnFile ? 'Download consent is already on file — no customer prompt needed.' : 'The first download needs customer consent: OTP, signed physical form or face authentication.'}</p>
        <button class="btn primary" data-act="download" data-purpose="FETCH_FOR_UPDATE" ${dis}>1 · Fetch from registry</button>`;
    }
    return rej + compareHtml(a);
  }

  function compareHtml(a) {
    const rows = H.compare(a);
    const st = ui.cmp[a.id] || (ui.cmp[a.id] = { sel: new Set(rows.filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').map((r) => r.tag)), filter: 'diff', q: '' });
    const diffN = rows.filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').length;
    let shown = rows;
    if (st.filter === 'diff') shown = shown.filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY');
    if (st.filter === 'sel') shown = shown.filter((r) => st.sel.has(r.tag));
    if (st.q) { const q = st.q.toLowerCase(); shown = shown.filter((r) => (r.tag + ' ' + r.label + ' ' + r.group).toLowerCase().includes(q)); }
    const badge = (s) => ({ SAME: '<span class="pill done">Same</span>', DIFFERENT: '<span class="pill action">Different</span>', NOT_IN_REGISTRY: '<span class="pill violet">Not in registry</span>', NOT_RETURNED: '<span class="pill plain">Not returned</span>' }[s] || '');
    let lastGroup = '';
    const body = shown.map((r) => {
      const g = r.group !== lastGroup ? `<tr class="grp"><td colspan="5">${esc(r.group)}</td></tr>` : '';
      lastGroup = r.group;
      return `${g}<tr class="${r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY' ? 'diff' : ''}">
        <td data-label="Send" style="width:44px"><input type="checkbox" class="check" data-act="tag" data-tag="${esc(r.tag)}" ${st.sel.has(r.tag) ? 'checked' : ''} ${canAct() ? '' : 'disabled'} aria-label="Select ${esc(r.label)}" /></td>
        <td class="lead" data-label="Tag"><b>${esc(r.label)}</b><span class="sub mono">${esc(r.tag)}</span></td>
        <td class="v" data-label="Bank (channel)">${esc(H.fmtVal(r.ours)) || '<span class="faint">—</span>'}</td>
        <td class="v" data-label="Registry">${r.cmp ? esc(H.fmtVal(r.theirs)) || '<span class="faint">—</span>' : '<span class="faint">not returned</span>'}</td>
        <td data-label="Result">${badge(r.state)}</td></tr>`;
    }).join('');
    return `
      <div class="row between" style="margin-bottom:10px"><div class="small muted">Registry record fetched ${ago(a.fetched.at)} · ${diffN} tag(s) differ · ${st.sel.size} selected</div>
        <button class="btn sm" data-act="download" data-purpose="FETCH_FOR_UPDATE" ${disabledAttr()}>Re-fetch</button></div>
      <div class="row" style="margin-bottom:10px">
        <div class="chips">${[['diff', 'Different from registry'], ['all', 'All tags'], ['sel', 'Selected only']].map(([k, l]) => `<button class="chip ${st.filter === k ? 'on' : ''}" data-act="cmp-filter" data-v="${k}">${l}</button>`).join('')}</div>
        <input type="search" data-act="cmp-q" placeholder="Search tags…" value="${esc(st.q)}" style="flex:1;min-width:160px" />
        <button class="btn sm" data-act="cmp-all" ${disabledAttr()}>Select all different</button><button class="btn sm ghost" data-act="cmp-none" ${disabledAttr()}>Clear</button>
      </div>
      <div class="card table-wrap" style="box-shadow:none"><table class="rows cmp"><thead><tr><th></th><th>Tag</th><th>Bank (channel)</th><th>Registry</th><th>Result</th></tr></thead><tbody>${body || '<tr><td colspan="5" class="muted" style="padding:20px;text-align:center">No tags in this view.</td></tr>'}</tbody></table></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" data-act="update" ${!canAct() || !st.sel.size ? 'disabled' : ''}>Send update (${st.sel.size} tag${st.sel.size === 1 ? '' : 's'})</button>
      <span class="small muted">Only the selected leaves plus ckycNo are sent.</span></div>`;
  }

  function dataHtml(a) {
    const p = a.payload;
    const kv = (pairs) => `<div class="kv">${pairs.filter(([, v]) => v !== undefined).map(([k, v]) => `<div>${esc(k)}</div><div>${v === '' || v == null ? '<span class="faint">—</span>' : esc(v)}</div>`).join('')}</div>`;
    const acct = kv([['Account number', p.account.accountNumber], ['Customer ID (CIF)', p.account.customerId], ['Product', p.account.productName], ['Branch', p.account.branchCode + ' — ' + p.account.branchName], ['Activated', fmtTime(p.account.activatedAt)], ['Event', p.eventType + ' · ' + p.eventId]]);
    const att = kv([['Official', p.attestation.employee.name + ' (' + p.attestation.employee.code + ')'], ['KYC mode', p.attestation.kycVerification.mode], ['Carried out', p.attestation.kycVerification.carriedOutDate], ['Consent given', H.fmtVal(p.ckyc.consentGiven)], ['CKYC no. from channel', p.ckyc.ckycNo || '']]);
    let party;
    if (p.customerType === 'INDIVIDUAL') {
      const i = p.individual; const ad = i.addressAsPerOvd;
      party = kv([['Name', [i.name.title, i.name.firstName, i.name.middleName, i.name.lastName].filter(Boolean).join(' ')], ["Father's name", [i.fatherName.firstName, i.fatherName.lastName].join(' ')], ["Mother's name", i.motherName ? [i.motherName.firstName, i.motherName.lastName].join(' ') : ''], ['Date of birth', i.dob], ['Gender', i.gender], ['PAN', i.pan && i.pan.number], ['Residential status', i.residentialStatus], ['Identity proofs', H.fmtVal(i.identityProofs)], ['Address as per OVD', [ad.line1, ad.line2, ad.city, ad.state, ad.pincode].filter(Boolean).join(', ')], ['Current address', i.currentAddress.sameAsAddressAsPerOvd ? 'Same as OVD address' : H.fmtVal(i.currentAddress)], ['Mobile', i.contact.mobile.number ? i.contact.mobile.countryCode + ' ' + i.contact.mobile.number : ''], ['Email', i.contact.email.address]]);
    } else {
      const l = p.legal; const ad = l.registeredAddress;
      party = kv([['Entity name', l.entity.name], ['Constitution', l.entity.constitutionType], ['Date of registration', l.entity.dateOfRegistration], ['PAN', l.pan.number], ['GSTIN', l.taxIdentification && l.taxIdentification.number], [l.identityProof.type, l.identityProof.number], ['Registered address', [ad.line1, ad.city, ad.state, ad.pincode].join(', ')], ['Mobile', l.contact.primary.mobile.number], ['Email', l.contact.primary.email.address], ['Related parties', H.fmtVal(l.relatedParties)]]);
    }
    return `<div class="grid g2"><div><h3 style="margin-bottom:8px">${p.customerType === 'LEGAL' ? 'Entity' : 'Customer'}</h3>${party}</div><div class="stack"><div><h3 style="margin-bottom:8px">Account</h3>${acct}</div><div><h3 style="margin-bottom:8px">Attestation &amp; consent</h3>${att}</div></div></div>
      <details style="margin-top:16px"><summary class="small" style="cursor:pointer;color:var(--primary)">Show raw JSON as received (data version ${a.dataVersion})</summary><pre class="json" style="margin-top:8px">${json(p)}</pre></details>`;
  }

  function docsHtml(a) {
    const name = H.summary(a).name;
    return `<div class="docs">${a.payload.documents.map((d) => {
      let thumb = ICON.doc;
      if (d.preview) thumb = `<img src="${esc(d.preview)}" alt="" />`;
      else if (d.slot === 'PHOTO') thumb = `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#dfe7f7"/><circle cx="50" cy="40" r="17" fill="#9fb3dd"/><path d="M18 100c0-19 14-32 32-32s32 13 32 32z" fill="#9fb3dd"/><text x="50" y="45" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Inter,sans-serif">${esc(initials(name))}</text></svg>`;
      return `<div class="doc"><div class="thumb">${thumb}</div><div class="cap"><b>${esc(d.slot)}${d.ovdType ? ' · ' + esc(d.ovdType) : ''}</b>${esc(d.fileName)}${d.hubAdded ? '<div class="faint">added by Hub (consent evidence)</div>' : ''}</div></div>`;
    }).join('') || '<p class="muted">No documents.</p>'}</div>
    <p class="small faint" style="margin-top:12px">Demo: document images are placeholders. In the Hub, documents arrive as base64 in the Data Fetch API push and are placed into the registry payload by slot.</p>`;
  }

  function consentsHtml(a) {
    if (!a.consents.length) return `<p class="muted">No download consents yet. ${a.consentOnFile ? 'Consent is on file from the registry create — downloads need no prompt.' : ''}</p>`;
    return `<div class="table-wrap"><table class="rows"><thead><tr><th>When</th><th>Mode</th><th>Purpose</th><th>Auth factor</th><th>Evidence</th><th>Status</th><th>By</th></tr></thead><tbody>
      ${a.consents.map((c) => `<tr><td data-label="When">${fmtTime(c.at)}</td><td data-label="Mode"><b>${esc(c.mode)}</b></td><td data-label="Purpose">${c.purpose === 'OBTAIN_CKYC' ? 'Obtain CKYC no.' : 'Fetch for update'}</td><td data-label="Auth factor" class="mono">${esc(c.authFactor || '—')}</td><td data-label="Evidence">${esc(c.evidence || '—')}</td><td data-label="Status"><span class="pill ${c.status === 'VERIFIED' ? 'done' : c.status === 'FAILED' ? 'rejected' : 'waiting'}">${c.status}</span></td><td data-label="By">${esc(c.user)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function submissionsHtml(a) {
    if (!a.submissions.length) return '<p class="muted">Nothing submitted to the registry yet.</p>';
    return `<div class="table-wrap"><table class="rows"><thead><tr><th>When</th><th>Kind</th><th>ackNo</th><th>Status</th><th>Result</th><th>Tags</th><th>By</th></tr></thead><tbody>
      ${a.submissions.map((s) => `<tr><td data-label="When">${fmtTime(s.at)}</td><td data-label="Kind"><span class="qtag ${s.kind.toLowerCase()}">${s.kind}</span></td><td data-label="ackNo" class="mono">${esc(s.ackNo)}</td><td data-label="Status">${esc(s.status)}</td><td data-label="Result">${esc(s.result || '—')}</td><td data-label="Tags" class="small">${s.tags ? esc(s.tags.length + ': ' + s.tags.slice(0, 4).join(', ') + (s.tags.length > 4 ? '…' : '')) : '—'}</td><td data-label="By">${esc(s.user)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function wireHtml(a) {
    if (!a.wire.length) return '<p class="muted">No registry calls yet.</p>';
    return `<p class="small muted" style="margin-top:0">Every call through the API gateway, decoded (on the wire the body is JWE-encrypted and RSA-signed). Document bytes are redacted.</p>
      ${a.wire.map((w) => `<details class="wire"><summary><span class="pill ${w.http === 200 ? 'done' : 'rejected'} plain">${w.http}</span><span class="ep">POST ${esc(w.endpoint.replace('https://gateway.example', ''))}</span><span class="faint small">${fmtTime(w.at)} · ${w.latency} ms · ${esc(w.user)}</span></summary>
        <div class="panes"><div><h4>Request (decrypted)</h4><pre class="json">${json(w.request)}</pre></div><div><h4>Response (decrypted)</h4><pre class="json">${json(w.response)}</pre></div></div></details>`).join('')}`;
  }

  function viewAccount(id) {
    const a = H.findAccount(id);
    if (!a || (user.role === 'BRANCH' && a.branchCode !== user.dp)) return layout('', '<div class="card card-pad"><h2>Account not found</h2><p class="muted">It may belong to another branch.</p></div>');
    const m = H.summary(a);
    const tabs = [['data', 'Customer data'], ['docs', 'Documents', a.payload.documents.length], ['consent', 'Consent log', a.consents.length], ['timeline', 'Timeline', a.timeline.length], ['subs', 'Submissions', a.submissions.length]];
    if (isStaff()) tabs.push(['wire', 'Registry wire log', a.wire.length]);
    const tab = ui.acctTab[id] || 'timeline';
    const tabBody = { data: dataHtml, docs: docsHtml, consent: consentsHtml, timeline: (x) => `<ul class="timeline">${x.timeline.map((t) => `<li class="${t.kind}">${esc(t.text)}<div class="meta">${esc(t.actor)} · ${fmtTime(t.at)}</div></li>`).join('')}</ul>`, subs: submissionsHtml, wire: wireHtml }[tab](a);
    const q = a.queue.toLowerCase();
    return layout('queue/' + q, `
      <div class="crumbs"><a href="#/channel/${a.channel}">${a.channel}</a> / <a href="#/queue/${q}?ch=${a.channel}">${a.queue === 'CREATE' ? 'Create' : 'Update'} Requests</a> / ${esc(a.accountNumber)}</div>
      <div class="card card-pad" style="margin-bottom:16px">
        <div class="acct-head"><div class="photo">${photoOf(a)}</div>
          <div><div class="row"><h1 style="margin-right:4px">${esc(m.name)}</h1><span class="qtag ${q}">${a.queue}</span>${pill(a.status)}</div>
          <div class="facts"><span>Account <b>${esc(a.accountNumber)}</b></span><span>Channel <b>${esc(a.channel)}</b></span><span>Branch <b>${esc(a.branchCode)}</b></span><span>CKYC no. <b>${esc(a.ckycNo || '—')}</b></span>${a.ckycRefNo ? `<span>Ref <b>${esc(a.ckycRefNo)}</b></span>` : ''}${a.ackNo ? `<span>Last ack <b>${esc(a.ackNo)}</b></span>` : ''}<span>Data v<b>${a.dataVersion}</b></span></div></div></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><h2>${a.queue === 'CREATE' ? 'Create request' : 'Update request'}</h2><div class="steps" style="margin:0">${stepsFor(a)}</div></div>
        <div class="card-body">${actionPanel(a)}</div>
      </div>
      <div class="card">
        <div class="tabs" role="tablist">${tabs.map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="acct-tab" data-v="${k}" role="tab">${l}${n != null ? `<span class="c">${n}</span>` : ''}</button>`).join('')}</div>
        <div class="card-body">${tabBody}
          ${tab === 'timeline' && canAct() ? `<form class="row" id="note-form" style="margin-top:8px"><input name="note" placeholder="Add a note to the timeline…" style="flex:1" /><button class="btn sm" type="submit">Add note</button></form>` : ''}
        </div>
      </div>`);
  }

  // ---------- Data Fetch API page ----------
  function sampleBody(kind) {
    const ch = 'TAB_SB';
    const p = H.randomIndividual(ch, '0123');
    if (kind === 'invalid') {
      p.individual.dob = '1990/07/15';
      p.individual.identityProofs[0].ovdNo = '123456789012';
      p.individual.pan.number = 'ABCD1234';
      p.documents.push({ slot: 'SELFIE', fileName: 'x.jpg', contentType: 'gif', b64Content: 'demo' });
    }
    if (kind === 'incomplete') { p.documents = p.documents.filter((d) => d.slot !== 'PHOTO'); p.individual.contact.mobile.number = ''; }
    if (kind === 'existing') p.ckyc.ckycNo = H.digits(14);
    return JSON.stringify(p, null, 2);
  }
  function viewApi() {
    if (!isStaff()) return layout('', '<p>Not available for branch users.</p>');
    if (ui.apiBody == null) ui.apiBody = sampleBody('valid');
    const tagRows = (t) => H.TAGS[t].map((x) => `<tr><td class="mono small">${esc(x.tag)}</td><td class="mono small">${esc(x.src)}</td><td>${x.cmp ? 'Yes' : '<span class="faint">No</span>'}</td></tr>`).join('');
    const r = ui.apiResp;
    return layout('api', `
      <div class="pagehead"><div><h1>Data Fetch API</h1><p>The single contract every account-opening channel implements. Try it live below — the response comes from the in-browser Hub.</p></div></div>
      <div class="grid g2">
        <div class="card"><div class="card-head"><h2>Endpoint</h2></div><div class="card-body">
          <div class="kv"><div>Method</div><div class="mono">POST</div><div>URL</div><div class="mono">https://&lt;ckyc-hub&gt;/api/v1/accounts/activated</div><div>Auth</div><div class="mono">X-Api-Key: &lt;channel key&gt;</div><div>Body</div><div>Canonical JSON + documents (base64), up to 25 MB</div><div>Read-back</div><div class="mono">GET /api/v1/accounts/{no}/ckyc-status</div></div>
          <h3 style="margin:16px 0 6px">Rules</h3>
          <ul class="small" style="margin:0;padding-left:18px">
            <li><b>(channel, eventId)</b> is unique — replays are a safe no-op (200 duplicate).</li>
            <li><b>(channel, accountNumber)</b> identifies the account — a new eventId refreshes the data and bumps dataVersion.</li>
            <li>ckycNo supplied → <b>Update Requests</b>; otherwise <b>Create Requests</b>.</li>
            <li>Dates DD-MM-YYYY; Aadhaar: last 4 digits only.</li>
            <li>Structural errors → 400 with <span class="mono">{path, message}</span>. Missing CKYC data does <b>not</b> reject — it shows as readiness items.</li>
          </ul></div></div>
        <div class="card"><div class="card-head"><h2>Responses</h2></div><div class="card-body table-wrap"><table><tbody>
          <tr><td class="mono">201</td><td>New account stored and queued</td></tr><tr><td class="mono">200</td><td>Duplicate eventId (nothing changed) or existing account refreshed</td></tr><tr><td class="mono">400</td><td>Validation failed — list of errors</td></tr><tr><td class="mono">401 / 403</td><td>Unknown API key / channel disabled</td></tr><tr><td class="mono">413</td><td>Body larger than the limit</td></tr></tbody></table></div></div>
      </div>

      <div class="card" style="margin-top:16px"><div class="card-head"><h2>Try it</h2>
        <div class="row"><button class="btn sm" data-act="api-sample" data-v="valid">New customer</button><button class="btn sm" data-act="api-sample" data-v="incomplete">Incomplete data</button><button class="btn sm" data-act="api-sample" data-v="existing">With CKYC no.</button><button class="btn sm" data-act="api-sample" data-v="invalid">Invalid</button></div></div>
        <div class="card-body grid g2">
          <div><div class="row" style="margin-bottom:8px"><span class="mono small">POST /api/v1/accounts/activated</span><span class="spacer" style="flex:1"></span>
            <label class="small muted">X-Api-Key of&nbsp;<select id="api-ch">${H.state.channels.map((c) => `<option value="${c.code}" ${c.code === 'TAB_SB' ? 'selected' : ''}>${c.code}</option>`).join('')}</select></label></div>
            <textarea id="api-body" rows="22" spellcheck="false">${esc(ui.apiBody)}</textarea>
            <div class="row" style="margin-top:10px"><button class="btn primary" data-act="api-send" ${disabledAttr()}>Send</button><span class="small muted">Send twice to see idempotency.</span></div></div>
          <div><div class="small muted" style="margin-bottom:8px">Response</div>
            ${r ? `<div class="row" style="margin-bottom:8px"><span class="pill ${r.http < 300 ? 'done' : 'rejected'} plain">HTTP ${r.http}</span>${r.body.account ? `<a class="btn sm" href="#/account/${r.body.account.id}">Open account →</a>` : ''}</div><pre class="json">${json(r.body)}</pre>` : '<div class="banner">Pick a sample (or edit the JSON) and press Send.</div>'}
            <div style="margin-top:16px"><div class="small muted" style="margin-bottom:6px">Status read-back</div>
              <form class="row" id="readback"><input name="no" placeholder="Account number" class="mono" style="flex:1" /><button class="btn sm" type="submit">GET ckyc-status</button></form>
              ${ui.readback ? `<pre class="json" style="margin-top:8px">${json(ui.readback)}</pre>` : ''}</div>
          </div>
        </div></div>

      <div class="grid g2" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>Document slots</h2></div><div class="card-body table-wrap"><table><thead><tr><th>Type</th><th>Slots</th></tr></thead><tbody>
          ${Object.entries(H.DOC_SLOTS).map(([k, v]) => `<tr><td>${k}</td><td class="mono small">${v.join(', ')}</td></tr>`).join('')}
          <tr><td>OVD types</td><td class="small">${Object.entries(H.OVD_TYPES).map(([k, v]) => `${k} ${v}`).join(' · ')}</td></tr></tbody></table></div></div>
        <div class="card"><div class="card-head"><h2>Work queues &amp; statuses</h2></div><div class="card-body table-wrap"><table><tbody>
          ${Object.entries(H.STATUS).map(([k, v]) => `<tr><td>${pill(k)}</td><td class="small">${esc(v.desc)}</td></tr>`).join('')}</tbody></table></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="card-head"><h2>Updatable CKYC tags</h2><span class="small muted">Drives the compare table and partial update payload</span></div>
        <div class="card-body table-wrap"><table><thead><tr><th>Update tag</th><th>Fed by intake field</th><th>Comparable</th></tr></thead><tbody>
        <tr class="grp"><td colspan="3"><b>Individual</b></td></tr>${tagRows('INDIVIDUAL')}<tr class="grp"><td colspan="3"><b>Legal entity</b></td></tr>${tagRows('LEGAL')}</tbody></table></div></div>
    `);
  }

  // ---------- Administration ----------
  function viewAdmin() {
    if (user.role !== 'ADMIN') return layout('', '<p>Administrators only.</p>');
    const t = ui.adminTab;
    const tabs = [['simulate', 'Simulate a push'], ['channels', 'Channels & API keys'], ['users', 'Users'], ['stats', 'Statistics'], ['settings', 'Demo settings']];
    let body = '';
    if (t === 'simulate') {
      body = `<form id="sim-form" class="grid g3" style="align-items:end">
        <label class="field">Channel<select name="ch">${H.state.channels.map((c) => `<option value="${c.code}">${c.code} — ${esc(c.name)}</option>`).join('')}</select></label>
        <label class="field">Branch (DP code)<select name="br">${Object.entries(H.BRANCHES).map(([k, v]) => `<option value="${k}">${k} — ${esc(v.name)}</option>`).join('')}</select></label>
        <label class="field">Registry outcome to simulate<select name="sc"><option value="APPROVED">Approved (CKYC no. issued)</option><option value="PROBABLE_MATCH">Probable match</option><option value="CONFIRMED_MATCH">Confirmed match (already on registry)</option><option value="REJECTED">Rejected</option><option value="EXISTING">Customer already has CKYC no. (update)</option></select></label>
        <label class="check"><input type="checkbox" name="inc" /> Incomplete data (no photo / mobile)</label>
        <div></div>
        <button class="btn primary" type="submit">Push account</button></form>
        <p class="small muted" style="margin-top:12px">Generates a fictional customer and calls the Data Fetch API exactly as a channel would. In a real deployment the registry decides the outcome; here you choose it so every path can be shown.</p>
        ${ui.simResult ? `<pre class="json" style="margin-top:12px">${json(ui.simResult)}</pre>` : ''}`;
    } else if (t === 'channels') {
      body = `${ui.lastKey ? `<div class="banner warn"><div><b>New API key for ${esc(ui.lastKey.code)}</b> — shown once: <span class="mono">${esc(ui.lastKey.key)}</span><br/><span class="small">Stored only as a SHA-256 hash (<span class="mono">${esc(ui.lastKey.hash.slice(0, 16))}…</span>).</span></div></div>` : ''}
        <div class="table-wrap"><table class="rows"><thead><tr><th>Channel</th><th>Key</th><th>Rotated</th><th>Status</th><th></th></tr></thead><tbody>
        ${H.state.channels.map((c) => `<tr><td class="lead" data-label="Channel"><b>${c.code}</b><span class="sub">${esc(c.name)}</span></td><td data-label="Key" class="mono">${esc(c.keyPrefix)}••••</td><td data-label="Rotated">${fmtTime(c.keyRotatedAt)}</td><td data-label="Status">${c.enabled ? '<span class="pill done">Enabled</span>' : '<span class="pill rejected">Disabled</span>'}</td>
          <td data-label=""><div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="rotate" data-v="${c.code}">Rotate key</button><button class="btn sm ${c.enabled ? 'danger' : ''}" data-act="toggle-ch" data-v="${c.code}">${c.enabled ? 'Disable' : 'Enable'}</button></div></td></tr>`).join('')}
        </tbody></table></div><p class="small muted">Disable a channel, then push from it (Simulate or Data Fetch API) to see the 403.</p>`;
    } else if (t === 'users') {
      body = `<div class="table-wrap"><table class="rows"><thead><tr><th>User</th><th>Role</th><th>DP code</th><th></th></tr></thead><tbody>
        ${H.state.users.map((u) => `<tr><td class="lead" data-label="User"><b class="mono">${esc(u.username)}</b><span class="sub">${esc(u.name)}</span></td><td data-label="Role">${esc(u.role)}</td><td data-label="DP code">${esc(u.dp || '—')}</td><td data-label="">${['admin', 'branch.0123', 'branch.0456', 'branch.0789', 'branch.0234', 'branch.0345'].includes(u.username) ? '<span class="faint small">built-in</span>' : `<button class="btn sm danger" data-act="del-user" data-v="${esc(u.username)}">Remove</button>`}</td></tr>`).join('')}
        </tbody></table></div>
        <h3 style="margin:18px 0 8px">Add user</h3>
        <form id="user-form" class="grid g4" style="align-items:end"><label class="field">Username<input name="u" required pattern="[a-z0-9._]+" /></label><label class="field">Name<input name="n" required /></label>
        <label class="field">Role<select name="r"><option>OPERATOR</option><option>BRANCH</option><option>VIEWER</option><option>ADMIN</option></select></label>
        <label class="field">DP code (branch)<select name="dp"><option value="">—</option>${Object.keys(H.BRANCHES).map((k) => `<option>${k}</option>`).join('')}</select></label>
        <label class="field">Password<input name="p" required value="user123" /></label><button class="btn primary" type="submit">Add user</button></form>`;
    } else if (t === 'stats') {
      const bars = (obj) => { const max = Math.max(1, ...Object.values(obj)); return `<div class="bars">${Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar"><span class="mono small">${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><b>${v}</b></div>`).join('') || '<p class="muted">No data.</p>'}</div>`; };
      const tally = (arr, f) => arr.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
      body = `<div class="grid g2">
        <div><h3 style="margin-bottom:8px">Intake by outcome</h3>${bars(tally(H.state.intake, (e) => e.outcome))}</div>
        <div><h3 style="margin-bottom:8px">Intake by channel</h3>${bars(tally(H.state.intake, (e) => e.channel))}</div>
        <div><h3 style="margin-bottom:8px">Registry calls by endpoint</h3>${bars(tally(H.state.stats.calls, (e) => e.endpoint))}</div>
        <div><h3 style="margin-bottom:8px">Registry calls by user</h3>${bars(tally(H.state.stats.calls, (e) => e.user))}</div></div>
        <h3 style="margin:18px 0 8px">Rejected pushes</h3>
        <div class="table-wrap"><table class="rows"><thead><tr><th>Time</th><th>Channel</th><th>HTTP</th><th>Errors</th></tr></thead><tbody>
        ${H.state.intake.filter((e) => e.outcome === 'REJECTED').slice(0, 10).map((e) => `<tr><td data-label="Time">${fmtTime(e.at)}</td><td data-label="Channel">${e.channel}</td><td data-label="HTTP" class="mono">${e.http}</td><td data-label="Errors" class="small">${esc((e.errors || []).map((x) => x.path + ': ' + x.message).join(' · ') || '—')}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">None.</td></tr>'}</tbody></table></div>`;
    } else {
      body = `<div class="stack">
        <label class="check"><input type="checkbox" data-act="gw-down" ${H.state.settings.gatewayDown ? 'checked' : ''} /> Simulate gateway outage (registry calls return 503; statuses stay unchanged)</label>
        <div><button class="btn danger" data-act="reset">Reset demo data</button><p class="small muted">Restores the original sample accounts. Your demo data lives only in this browser.</p></div></div>`;
    }
    return layout('admin', `<div class="pagehead"><div><h1>Administration</h1><p>Channels, API keys, users and usage — plus tools to drive the demo.</p></div></div>
      <div class="card"><div class="tabs">${tabs.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="admin-tab" data-v="${k}">${l}</button>`).join('')}</div><div class="card-body">${body}</div></div>`);
  }

  // ---------- guide & process ----------
  function findBy(name) { return H.state.accounts.find((a) => H.summary(a).name.startsWith(name)); }
  function viewGuide() {
    const sc = [
      ['Rohan Bose', 'Happy path create', 'Search the registry (no hit) → create → wait a few seconds → check status → CKYC number issued. Then simulate a customer data change: the account moves to Update Requests.'],
      ['Meera Pillai', 'Incomplete data', 'The channel push was accepted but the photo and mobile are missing — Create is disabled. Simulate a complete re-send and carry on.'],
      ['Sneha Iyer', 'Probable match', 'The registry returned two look-alikes. Mark both "No match" and submit → the registry creates a new record on the next status check. (Mark one "Match" to see the confirmed-match path.)'],
      ['Suresh Menon', 'Already on the registry', 'The de-dupe search finds an existing record. Download with consent (OTP 123456, or physical form / face auth) to obtain the CKYC number — no duplicate is created.'],
      ['Vikram Rao', 'Confirmed match', 'The create came back CONFIRMED_MATCH. Obtain the CKYC number by consented download, or link one manually.'],
      ['Karan Malhotra', 'Rejected', 'The registry rejected the create. Simulate the channel\'s corrected re-send, then search and create again.'],
      ['Deepak Verma', 'Tag-level update', 'The channel sent a CKYC number, so this landed in Update Requests. Fetch the registry record (consent needed), compare tag by tag — differing tags are pre-selected — and send only those.'],
      ['Fatima Sheikh', 'Rejected update', 'First update attempt is rejected by the registry; resubmit and it goes through.'],
      ['Sunrise Agro Foods', 'Legal entity', 'Company account from DMS: CIN/PAN search, entity create.'],
    ];
    const items = sc.map(([n, t, d], k) => { const a = findBy(n); return `<div class="scen"><span class="num">${k + 1}</span><div><h3>${esc(t)}</h3><p class="small muted" style="margin:4px 0 0">${esc(d)}</p></div>${!a ? '<span class="faint small">changed</span>' : (user.role !== 'BRANCH' || a.branchCode === user.dp) ? `<a class="btn sm" href="#/account/${a.id}">${esc(n)} →</a>` : `<span class="small muted" style="text-align:right">${esc(n)}<br/>sign in as <span class="mono">branch.${esc(a.branchCode)}</span></span>`}</div>`; }).join('');
    return layout('guide', `<div class="pagehead"><div><h1>Demo guide</h1><p>Each sample account is set up to show one path through the CKYC 2.0 process.</p></div></div>
      <div class="banner"><div><b>Tips:</b> each <span class="mono">branch.xxxx</span> login sees only its own branch; sign in as <span class="mono">admin</span> to push new accounts, rotate API keys or simulate a gateway outage. The palette icon switches to the classic MIS theme. ${user.role === 'ADMIN' ? '' : 'Reset the data from Administration (admin).'}</div></div>
      <div class="card guide">${items}</div>`);
  }

  function viewProcess() {
    const box = (x, y, w, h, t, sub, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/><text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 4)}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#182033">${t}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 13}" text-anchor="middle" font-size="10.5" fill="#5d6880">${sub}</text>` : ''}`;
    const arr = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a93a8" stroke-width="1.5" marker-end="url(#ah)"/>`;
    const svg = `<svg viewBox="0 0 900 330" width="100%" role="img" aria-label="Architecture: channels push to the CKYC Hub, which calls the registry through the API gateway" style="min-width:640px">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a93a8"/></marker></defs>
      ${['DMS_CA', 'TAB_CA', 'CPH_SB', 'TAB_SB', 'VCIP'].map((c, k) => box(10, 20 + k * 60, 130, 44, c, 'account activated', '#f8f9fc', '#cfd6e3') + arr(140, 42 + k * 60, 220, 165)).join('')}
      <rect x="225" y="10" width="360" height="310" rx="12" fill="#f4f7fe" stroke="#1d3f8f" stroke-dasharray="5 4"/>
      <text x="240" y="32" font-size="13" font-weight="700" fill="#1d3f8f">CKYC Hub</text>
      ${box(240, 45, 330, 46, 'Data Fetch API', 'validate · idempotent · store data + documents', '#fff', '#1d3f8f')}
      ${box(240, 105, 160, 60, 'Create Requests', 'search → create → poll', '#e6f0fd', '#1d5fbf')}
      ${box(410, 105, 160, 60, 'Update Requests', 'compare tags → update', '#efeafd', '#5b3cc4')}
      ${box(240, 180, 330, 44, 'Consent module', 'OTP · physical form · face auth', '#fff', '#cfd6e3')}
      ${box(240, 236, 160, 70, 'Operator console', 'roles · branch scoping', '#fff', '#cfd6e3')}
      ${box(410, 236, 160, 70, 'Registry adapter', 'simulator | gateway', '#fff', '#cfd6e3')}
      ${arr(570, 271, 640, 200)}
      ${box(645, 140, 240, 84, 'Bank API gateway', 'JWE · RSA signature · mTLS', '#fff7dc', '#d98a00')}
      ${arr(765, 224, 765, 244)}
      ${box(645, 246, 240, 70, 'CKYC registry 2.0', 'search · create · update · download', '#e4f4ec', '#18794e')}
    </svg>`;
    return layout('process', `<div class="pagehead"><div><h1>How it works</h1><p>Five channels, one integration. The Hub owns all CKYC logic, consent and audit.</p></div></div>
      <div class="card card-pad table-wrap" style="margin-bottom:16px">${svg}</div>
      <div class="grid g2">
        <div class="card"><div class="card-head"><h2><span class="qtag create">CREATE</span> Create Request</h2></div><div class="card-body"><ol style="margin:0;padding-left:18px">
          <li>Operator reviews data, documents and the readiness checklist.</li>
          <li><b>Search</b> — the strongest available search (PAN/Aadhaar/OVD, else demographic; CIN/LLPIN/PAN for entities). searchKey stored.</li>
          <li>Hit → link or download instead of creating a duplicate. No hit → <b>Create</b> with the searchKey; ackNo stored.</li>
          <li><b>Poll</b>: APPROVED → CKYC no. · PROBABLE_MATCH → adjudicate each candidate · CONFIRMED_MATCH → consented download / link · REJECTED → fix at source.</li></ol></div></div>
        <div class="card"><div class="card-head"><h2><span class="qtag update">UPDATE</span> Update Request</h2></div><div class="card-body"><ol style="margin:0;padding-left:18px">
          <li><b>Fetch</b> the registry record (customer consent on first download).</li>
          <li><b>Compare</b> every updatable tag: Same / Different / Not in registry / not returned.</li>
          <li><b>Select</b> tags — differing ones pre-selected.</li>
          <li><b>Update</b> with only those leaves + ckycNo; poll → CKYC_UPDATED. A later channel re-send re-opens it.</li></ol></div></div>
        <div class="card"><div class="card-head"><h2>Customer consent</h2></div><div class="card-body small">
          <p style="margin-top:0">Needed the first time the bank downloads a customer's record. Search, create and update are covered by the bank's attestation and the consent captured by the channel.</p>
          <div class="kv"><div>OTP</div><div>OTP to registered mobile/email → operator enters it</div><div>Physical</div><div>Identity check + signed consent form (sent by channel or scanned)</div><div>Face auth</div><div>Identity check + live face capture with the desk camera</div></div></div></div>
        <div class="card"><div class="card-head"><h2>Security &amp; audit</h2></div><div class="card-body small"><div class="kv">
          <div>Channels</div><div>Per-channel API key, stored hashed; rotate / disable</div><div>Console</div><div>Roles Admin / Operator / Viewer / Branch (own DP code only)</div><div>Gateway</div><div>JWE A256KW / A128CBC-HS256, RSASHA256 signature, mTLS, IP whitelist</div><div>Privacy</div><div>Aadhaar last 4 only; auth factors masked; documents never logged</div><div>Audit</div><div>Timeline, decoded wire log, submissions, consent log per account</div></div></div></div>
      </div>`);
  }

  // ---------- consent modal ----------
  let modal = null; let camStream = null;
  function closeModal() { if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } modal = null; $modal.innerHTML = ''; }
  function openDownload(a, purpose) {
    let init;
    try { init = H.downloadInitiate(a, user.username); } catch (e) { toast(e.message, 'err'); render(); return; }
    if (!init.consentCheck) {
      H.downloadOnFile(a, user.username, purpose);
      delete ui.cmp[a.id];
      toast(purpose === 'OBTAIN_CKYC' ? 'Consent on file — CKYC number obtained' : 'Consent on file — registry record fetched', 'ok');
      render(); return;
    }
    modal = { a, purpose, step: 'choose', mode: null, consent: null, factorType: a.customerType === 'LEGAL' ? 'DOI' : 'DOB', factorOk: false, err: '', evidence: 'channel', photo: null };
    renderModal();
  }
  function factorHint(a, t) {
    const p = a.payload; const g = H.getPath;
    return { DOB: g(p, 'individual.dob'), DOI: g(p, 'legal.entity.dateOfRegistration'), RELATION: g(p, 'individual.fatherName.firstName'), YOB_PIN: String(g(p, 'individual.dob') || '').slice(-4) + '+' + g(p, 'individual.addressAsPerOvd.pincode') }[t];
  }
  function renderModal() {
    if (!modal) return;
    const m = modal; const a = m.a;
    const title = m.purpose === 'OBTAIN_CKYC' ? 'Download with consent — obtain CKYC number' : 'Fetch registry record — customer consent';
    let body = ''; let foot = '';
    if (m.step === 'choose') {
      body = `<p class="muted" style="margin-top:0">The registry reports <span class="mono">consentCheck: true</span> — this is the bank's first download of this customer. Choose how the customer consents:</p>
        <div class="modes">
          ${a.customerType === 'INDIVIDUAL' ? `<button class="mode" data-act="m-mode" data-v="OTP"><span class="ic">${ICON.otp}</span><span><b>OTP</b><small>Sent to the customer's registered mobile ••••${esc(String(H.summary(a).mobile).slice(-4))}</small></span></button>` : ''}
          <button class="mode" data-act="m-mode" data-v="PHYSICAL"><span class="ic">${ICON.form}</span><span><b>Physical consent form</b><small>Identity check + the signed form sent by the channel, or a scan</small></span></button>
          <button class="mode" data-act="m-mode" data-v="FACEAUTH"><span class="ic">${ICON.face}</span><span><b>Face authentication</b><small>Identity check + live capture with the desk camera</small></span></button>
        </div>`;
    } else if (m.step === 'otp') {
      body = `<p style="margin-top:0">OTP sent to <b>+91 ••••••${esc(String(H.summary(a).mobile).slice(-4))}</b>. Ask the customer to read it out.</p>
        <input class="otp" id="otp" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code" />
        <div class="banner" style="margin:12px 0 0">Demo OTP: <b class="mono">&nbsp;123456</b></div>${m.err ? `<p class="small" style="color:var(--err)">${esc(m.err)}</p>` : ''}`;
      foot = '<button class="btn primary" data-act="m-otp">Verify OTP</button>';
    } else if (m.step === 'factor') {
      const opts = a.customerType === 'LEGAL' ? [['DOI', 'Date of incorporation (DD-MM-YYYY)']] : [['DOB', 'Date of birth (DD-MM-YYYY)'], ['RELATION', "Father's / mother's first name"], ['YOB_PIN', 'Birth year + PIN code (YYYY+PIN)']];
      body = `<p style="margin-top:0">Identity check for <b>${m.mode === 'PHYSICAL' ? 'physical consent' : 'face authentication'}</b>: ask the customer for one auth factor.</p>
        <div class="grid" style="gap:10px"><label class="field">Auth factor<select id="ftype">${opts.map(([k, l]) => `<option value="${k}" ${m.factorType === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field">Value given by customer<input id="fval" autocomplete="off" /></label></div>
        <div class="banner" style="margin:12px 0 0">Demo hint: on file it is <b class="mono">&nbsp;${esc(factorHint(a, m.factorType))}</b></div>${m.err ? `<p class="small" style="color:var(--err)">${esc(m.err)}</p>` : ''}`;
      foot = '<button class="btn primary" data-act="m-factor">Verify</button>';
    } else if (m.step === 'physical') {
      const hasForm = a.payload.documents.some((d) => d.slot === 'CONSENT_FORM' && !d.hubAdded);
      body = `<p style="margin-top:0">Identity check passed. Provide the customer's signed consent form:</p>
        <div class="stack">${hasForm ? `<label class="check"><input type="radio" name="ev" value="channel" ${m.evidence === 'channel' ? 'checked' : ''} data-act="m-ev" /> Use <b>CONSENT_FORM</b> sent by the channel (ckyc_consent.pdf)</label>` : ''}
        <label class="check"><input type="radio" name="ev" value="upload" ${m.evidence === 'upload' || !hasForm ? 'checked' : ''} data-act="m-ev" /> Upload a scanned signed form</label>
        <input type="file" id="evfile" accept="image/*,application/pdf" ${m.evidence === 'upload' || !hasForm ? '' : 'disabled'} style="height:auto;padding:8px" /></div>${m.err ? `<p class="small" style="color:var(--err)">${esc(m.err)}</p>` : ''}`;
      foot = '<button class="btn primary" data-act="m-physical">Upload consent &amp; download</button>';
    } else if (m.step === 'face') {
      body = `<p style="margin-top:0">Identity check passed. Capture the customer's face.</p>
        <div class="cam" id="cam">${m.photo ? `<img src="${m.photo}" alt="Capture" />` : '<span class="small">Camera off</span>'}</div>
        <div class="row" style="margin-top:10px">${m.photo ? '<button class="btn sm" data-act="m-retake">Retake</button>' : '<button class="btn sm" data-act="m-cam">Start camera</button><button class="btn sm" data-act="m-snap" id="snap" disabled>Capture</button>'}
        <button class="btn sm ghost" data-act="m-demo-photo">Use demo capture</button></div>${m.err ? `<p class="small" style="color:var(--err)">${esc(m.err)}</p>` : ''}
        <p class="small faint">The capture stays in this browser.</p>`;
      foot = `<button class="btn primary" data-act="m-face" ${m.photo ? '' : 'disabled'}>Submit face auth &amp; download</button>`;
    }
    $modal.innerHTML = `<div class="overlay" data-act="m-close-bg"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="mh"><h2>${esc(title)}</h2><button class="iconbtn" data-act="m-close" aria-label="Close">${ICON.close}</button></div>
      <div class="mb">${body}</div>${foot ? `<div class="mf"><button class="btn ghost" data-act="m-close">Cancel</button>${foot}</div>` : ''}</div></div>`;
    const f = $modal.querySelector('#otp, #fval'); if (f) f.focus();
  }
  function finishConsent(proof) {
    const m = modal;
    try {
      H.consentComplete(m.a, user.username, m.consent.id, proof);
      delete ui.cmp[m.a.id];
      closeModal();
      toast(m.purpose === 'OBTAIN_CKYC' ? 'Consent verified — CKYC number obtained, moved to Update Requests' : 'Consent verified — registry record fetched', 'ok');
      render();
    } catch (e) { m.err = e.message; renderModal(); }
  }
  function demoCapture(name) {
    const c = document.createElement('canvas'); c.width = 240; c.height = 180;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 240, 180); g.addColorStop(0, '#2c5bc4'); g.addColorStop(1, '#13306e');
    x.fillStyle = g; x.fillRect(0, 0, 240, 180);
    x.fillStyle = '#c9d6f2'; x.beginPath(); x.arc(120, 74, 34, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(120, 180, 66, 52, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#13306e'; x.font = 'bold 22px Inter, sans-serif'; x.textAlign = 'center'; x.fillText(initials(name), 120, 82);
    return c.toDataURL('image/jpeg', 0.7);
  }

  // ---------- render ----------
  function render() {
    if (!user) { $app.innerHTML = viewLogin(); return; }
    const { parts, q } = route();
    let html;
    switch (parts[0]) {
      case 'channels': html = viewChannels(); break;
      case 'channel': html = viewChannel(parts[1]); break;
      case 'queue': html = viewQueue(parts[1] === 'update' ? 'update' : 'create', q); break;
      case 'account': html = viewAccount(parts[1]); break;
      case 'api': html = viewApi(); break;
      case 'admin': html = viewAdmin(); break;
      case 'guide': html = viewGuide(); break;
      case 'process': html = viewProcess(); break;
      default: html = viewOverview();
    }
    $app.innerHTML = html;
  }

  // ---------- events ----------
  function curAccount() { const { parts } = route(); return parts[0] === 'account' ? H.findAccount(parts[1]) : null; }
  function run(fn, okMsg) {
    try { const r = fn(); if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg, 'ok'); } catch (e) { toast(e.message, 'err'); }
    render();
  }

  document.addEventListener('click', (ev) => {
    const row = ev.target.closest('tr[data-href]');
    if (row && !ev.target.closest('a,button,input')) { go(row.getAttribute('data-href')); return; }
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.getAttribute('data-act');
    const v = el.getAttribute('data-v');
    const a = curAccount();
    const U = user && user.username;
    switch (act) {
      case 'fill-login': document.getElementById('lu').value = el.dataset.u; document.getElementById('lp').value = el.dataset.p; document.getElementById('login-form').requestSubmit(); break;
      case 'logout': store.set('user', null); user = null; location.hash = '#/overview'; render(); break;
      case 'theme': store.set('theme', store.get('theme', 'default') === 'classic' ? 'default' : 'classic'); applyTheme(); break;
      case 'acct-tab': ui.acctTab[a.id] = v; render(); break;
      case 'search': run(() => H.actSearch(a, U), () => (a.search && a.search.results.length ? 'Existing CKYC record found' : 'Search done — no existing record')); break;
      case 'create': run(() => H.actCreate(a, U), 'Create submitted to the registry'); break;
      case 'poll': run(() => H.actPollCreate(a, U), (s) => (s === 'PENDING' ? 'Still processing — try again in a few seconds' : 'Registry outcome: ' + (H.STATUS[s] ? H.STATUS[s].label : s))); break;
      case 'poll-update': run(() => H.actPollUpdate(a, U), (s) => (s === 'PENDING' ? 'Still processing — try again in a few seconds' : 'Registry outcome: ' + (H.STATUS[s] ? H.STATUS[s].label : s))); break;
      case 'adj': { const d = ui.cmp[a.id + ':adj'] || (ui.cmp[a.id + ':adj'] = {}); d[el.dataset.k] = v; render(); break; }
      case 'adj-submit': { const d = ui.cmp[a.id + ':adj'] || {}; run(() => H.actAdjudicate(a, U, a.candidates.map((_, k) => d[k])), 'Decisions sent — check status for the outcome'); break; }
      case 'link': { const n = prompt('CKYC number supplied by the customer (14 digits):', ''); if (n != null) run(() => H.actLink(a, U, n.trim()), 'CKYC number linked — moved to Update Requests'); break; }
      case 'download': if (canAct()) openDownload(a, el.dataset.purpose); break;
      case 'resend': run(() => { const r = H.simulateResend(a, el.dataset.kind); if (r.http >= 300) throw new Error('Push refused: HTTP ' + r.http + ' ' + (r.body.message || '')); delete ui.cmp[a.id]; return r; }, (r) => `Channel re-sent the data (HTTP ${r.http}, ${r.body.outcome})`); break;
      case 'tag': { const st = ui.cmp[a.id]; if (el.checked) st.sel.add(el.dataset.tag); else st.sel.delete(el.dataset.tag); render(); break; }
      case 'cmp-filter': ui.cmp[a.id].filter = v; render(); break;
      case 'cmp-all': H.compare(a).forEach((r) => { if (r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY') ui.cmp[a.id].sel.add(r.tag); }); render(); break;
      case 'cmp-none': ui.cmp[a.id].sel.clear(); render(); break;
      case 'update': { const sel = Array.from(ui.cmp[a.id].sel); run(() => { H.actUpdate(a, U, sel); delete ui.cmp[a.id]; }, `Update submitted with ${sel.length} tag(s)`); break; }
      // API page
      case 'api-sample': ui.apiBody = sampleBody(v); ui.apiResp = null; render(); break;
      case 'api-send': {
        const txt = document.getElementById('api-body').value; ui.apiBody = txt;
        let body; try { body = JSON.parse(txt); } catch (e) { ui.apiResp = { http: 400, body: { accepted: false, message: 'Malformed JSON: ' + e.message } }; render(); break; }
        ui.apiResp = H.intake(document.getElementById('api-ch').value, body); render(); break;
      }
      // admin
      case 'admin-tab': ui.adminTab = v; render(); break;
      case 'rotate': {
        const c = H.state.channels.find((x) => x.code === v); const key = 'ck_' + v.toLowerCase() + '_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
        H.sha256(key).then((hash) => { c.keyPrefix = key.slice(0, c.code.length + 8); c.keyRotatedAt = H.iso(); c.keyHash = hash; H.save(); ui.lastKey = { code: v, key, hash }; render(); });
        break;
      }
      case 'toggle-ch': { const c = H.state.channels.find((x) => x.code === v); c.enabled = !c.enabled; H.save(); toast(`${v} ${c.enabled ? 'enabled' : 'disabled'}`); render(); break; }
      case 'del-user': H.state.users = H.state.users.filter((u) => u.username !== v); H.save(); render(); break;
      case 'gw-down': H.state.settings.gatewayDown = el.checked; H.save(); toast(el.checked ? 'Gateway outage simulation ON' : 'Gateway back to normal'); break;
      case 'reset': if (confirm('Reset all demo data in this browser?')) { H.reset(); ui.cmp = {}; ui.simResult = null; toast('Demo data reset', 'ok'); go('#/overview'); } break;
      // modal
      case 'm-close': closeModal(); break;
      case 'm-close-bg': if (ev.target === el) closeModal(); break;
      case 'm-mode':
        modal.mode = v; modal.err = '';
        if (v === 'OTP') { modal.consent = H.consentStart(modal.a, U, 'OTP', modal.purpose); modal.step = 'otp'; } else modal.step = 'factor';
        renderModal(); break;
      case 'm-otp':
        if (modal.consent.status === 'FAILED') modal.consent = H.consentStart(modal.a, U, 'OTP', modal.purpose);
        finishConsent({ otp: document.getElementById('otp').value.trim() }); break;
      case 'm-factor': {
        const t = document.getElementById('ftype').value; const val = document.getElementById('fval').value;
        modal.factorType = t;
        const masked = t + ' ' + (val.length > 4 ? '•'.repeat(val.length - 4) + val.slice(-4) : '••••');
        modal.consent = H.consentStart(modal.a, U, modal.mode, modal.purpose, { factorType: t, authFactor: masked });
        if (!H.factorOk(modal.a, t, val)) { H.consentFail(modal.a, U, modal.consent.id, 'auth factor did not match'); modal.err = 'Auth factor does not match the registry record — attempt logged as FAILED. Try again.'; renderModal(); break; }
        modal.err = ''; modal.step = modal.mode === 'PHYSICAL' ? 'physical' : 'face'; renderModal(); break;
      }
      case 'm-ev': modal.evidence = el.value; renderModal(); break;
      case 'm-physical': {
        const hasForm = modal.a.payload.documents.some((d) => d.slot === 'CONSENT_FORM' && !d.hubAdded);
        if (modal.evidence === 'channel' && hasForm) { finishConsent({ document: true, evidenceName: 'ckyc_consent.pdf (from channel)' }); break; }
        const f = document.getElementById('evfile').files[0];
        if (!f) { modal.err = 'Choose the scanned form first.'; renderModal(); break; }
        finishConsent({ document: true, evidenceName: f.name }); break;
      }
      case 'm-cam': {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { modal.err = 'Camera not available here — use the demo capture.'; renderModal(); break; }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then((s) => {
          camStream = s; const box = document.getElementById('cam'); if (!box) { s.getTracks().forEach((t) => t.stop()); return; }
          box.innerHTML = '<video autoplay playsinline muted></video>'; box.querySelector('video').srcObject = s;
          const b = document.getElementById('snap'); if (b) b.disabled = false;
        }).catch(() => { modal.err = 'Camera permission denied or unavailable — use the demo capture.'; renderModal(); });
        break;
      }
      case 'm-snap': {
        const vid = document.querySelector('#cam video'); if (!vid) break;
        const c = document.createElement('canvas'); const w = 240; c.width = w; c.height = Math.round(w * (vid.videoHeight || 3) / (vid.videoWidth || 4));
        c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
        modal.photo = c.toDataURL('image/jpeg', 0.7);
        if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
        renderModal(); break;
      }
      case 'm-retake': modal.photo = null; renderModal(); break;
      case 'm-demo-photo': if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } modal.photo = demoCapture(H.summary(modal.a).name); renderModal(); break;
      case 'm-face': finishConsent({ photo: true, evidenceName: 'face_capture.jpg', preview: modal.photo }); break;
      default: break;
    }
  });

  document.addEventListener('change', (ev) => {
    const f = ev.target.closest('[data-filter]');
    if (f) {
      const { parts, q } = route();
      q[f.dataset.filter] = f.value;
      if (f.dataset.filter === 'st' && f.value) delete q.b;
      Object.keys(q).forEach((k) => { if (!q[k]) delete q[k]; });
      go('#/' + parts.join('/') + (Object.keys(q).length ? '?' + Object.keys(q).map((k) => k + '=' + encodeURIComponent(q[k])).join('&') : ''));
      return;
    }
    if (ev.target.id === 'ftype' && modal) { modal.factorType = ev.target.value; modal.err = ''; renderModal(); }
  });

  let searchTimer = null;
  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.matches('input[data-filter="s"]')) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const { parts, q } = route(); q.s = t.value; if (!q.s) delete q.s;
        const pos = t.selectionStart;
        history.replaceState(null, '', '#/' + parts.join('/') + (Object.keys(q).length ? '?' + Object.keys(q).map((k) => k + '=' + encodeURIComponent(q[k])).join('&') : ''));
        render();
        const n = document.querySelector('input[data-filter="s"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
      }, 220);
    }
    if (t.matches('input[data-act="cmp-q"]')) {
      const a = curAccount(); ui.cmp[a.id].q = t.value;
      const pos = t.selectionStart; render();
      const n = document.querySelector('input[data-act="cmp-q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
    }
    if (t.id === 'api-body') ui.apiBody = t.value;
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target; ev.preventDefault();
    if (f.id === 'login-form') {
      const u = H.state.users.find((x) => x.username === f.u.value.trim() && x.password === f.p.value);
      if (!u) { document.getElementById('login-err').textContent = 'Wrong username or password.'; return; }
      user = u; store.set('user', u.username);
      if (!location.hash || location.hash === '#/' || location.hash === '#/overview') render(); else render();
      return;
    }
    if (f.id === 'note-form') { const a = curAccount(); const t = f.note.value.trim(); if (t) { H.addNote(a, user.username, t); render(); } return; }
    if (f.id === 'readback') {
      const no = f.no.value.trim(); const acc = H.state.accounts.find((x) => x.accountNumber === no);
      ui.readback = acc ? H.statusReadBack(acc.channel, no).body : { found: false };
      render(); return;
    }
    if (f.id === 'sim-form') {
      const ch = f.ch.value; const br = f.br.value; const sc = f.sc.value;
      const p = H.randomIndividual(ch, br, sc === 'EXISTING' ? { ckycNo: H.digits(14) } : {});
      if (f.inc.checked) { p.documents = p.documents.filter((d) => d.slot !== 'PHOTO'); p.individual.contact.mobile.number = ''; }
      const r = H.intake(ch, p, { sim: { create: sc === 'EXISTING' ? 'APPROVED' : sc } });
      ui.simResult = { http: r.http, ...r.body };
      toast(r.http < 300 ? `Pushed ${H.displayName(p)} from ${ch} (HTTP ${r.http})` : `Refused: HTTP ${r.http}`, r.http < 300 ? 'ok' : 'err');
      render(); return;
    }
    if (f.id === 'user-form') {
      const u = f.u.value.trim();
      if (H.state.users.some((x) => x.username === u)) { toast('Username exists', 'err'); return; }
      if (f.r.value === 'BRANCH' && !f.dp.value) { toast('Branch users need a DP code', 'err'); return; }
      H.state.users.push({ username: u, name: f.n.value.trim(), role: f.r.value, dp: f.dp.value || undefined, password: f.p.value });
      H.save(); toast('User added — they can sign in now', 'ok'); render();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modal) closeModal();
    if (ev.key === 'Enter' && modal && (ev.target.id === 'otp' || ev.target.id === 'fval')) { ev.preventDefault(); document.querySelector(ev.target.id === 'otp' ? '[data-act="m-otp"]' : '[data-act="m-factor"]').click(); }
  });

  render();
})();
