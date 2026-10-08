/* Turns the migration runbook workbook into the data model the app uses.
   Runs entirely in the browser; sheets and columns are located by name so
   re-ordered or extra rows/columns in a new runbook version still parse. */
(function (root) {
  'use strict';

  var DEVICE_STAGES = ['Shut down', 'Handed to Royal', 'In transit', 'Received at STT', 'Racked & cabled', 'Powered on', 'Validated'];
  function isNA(v) { return !v || /^(na|n\/a|not applicable|no ip assigned|-)$/i.test(String(v).trim()); }
  // Stable device identity across runbook versions (shared by the app and the exporter).
  function deviceKey(serial, host, sn) { return !isNA(serial) ? serial + '|' + host : 'sn:' + sn; }
  var STATUS_IN = { 'open': 'Open', 'in progress': 'In Progress', 'wip': 'In Progress', 'closed': 'Done', 'done': 'Done', 'complete': 'Done', 'completed': 'Done',
    'blocked': 'Blocked', 'not applicable': 'N/A', 'n/a': 'N/A', 'na': 'N/A' };

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\\n/g, ' ').replace(/[^a-z0-9#&/]+/g, ' ').trim(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function makeReader(XLSX) {
    function isDateCell(c) { return c && c.t === 'n' && c.z && XLSX.SSF.is_date(c.z); }
    function dateParts(v) { return XLSX.SSF.parse_date_code(v); }

    // Cell → display string (same rules the Python extractor used).
    function val(c) {
      if (!c || c.v == null) return '';
      if (c.t === 'n') {
        if (isDateCell(c)) {
          var p = dateParts(c.v);
          if (!p) return '';
          if (c.v < 1) return pad(p.H) + ':' + pad(p.M);
          var d = p.y + '-' + pad(p.m) + '-' + pad(p.d);
          return (p.H || p.M) ? d + ' ' + pad(p.H) + ':' + pad(p.M) : d;
        }
        return String(c.v);
      }
      if (c.t === 'b') return c.v ? 'True' : 'False';
      if (c.t === 'e') return '';
      return String(c.v).trim();
    }

    function grid(ws) {
      var data = ws['!data'] || [];
      var out = [];
      for (var r = 0; r < data.length; r++) {
        var row = data[r] || [];
        var o = [];
        for (var c = 0; c < row.length; c++) o.push(row[c] || null);
        out.push(o);
      }
      return out;
    }

    // Find the first row containing every one of the given header labels.
    function findHeader(g, labels) {
      var want = labels.map(norm);
      for (var r = 0; r < g.length; r++) {
        var cells = (g[r] || []).map(function (c) { return norm(val(c)); });
        if (want.every(function (w) { return cells.indexOf(w) >= 0; })) return r;
      }
      return -1;
    }

    // Rows below a header row as objects keyed by normalised header text.
    function rows(g, hr) {
      var hdr = (g[hr] || []).map(function (c) { return norm(val(c)); });
      var res = [];
      for (var r = hr + 1; r < g.length; r++) {
        var row = g[r] || [];
        var any = false, o = {};
        for (var i = 0; i < hdr.length; i++) {
          if (!hdr[i]) continue;
          o[hdr[i]] = row[i] || null;
          if (val(row[i])) any = true;
        }
        for (var j = hdr.length; j < row.length && !any; j++) if (val(row[j])) any = true;
        if (any) { o.__row = row; o.__hdr = hdr; res.push(o); }
      }
      return res;
    }
    function get(o, name) { return val(o[norm(name)]); }
    function cell(o, name) { return o[norm(name)]; }

    // Date cell or "YYYY-MM-DD HH:MM" text → ISO timestamp (local time), else ''.
    function iso(c) {
      var y, mo, d, H = 0, M = 0;
      if (isDateCell(c) && c.v >= 1) {
        // round to the nearest minute: Excel's fractional days drift by fractions of a second
        var days = Math.floor(c.v), mins = Math.round((c.v - days) * 1440);
        if (mins >= 1440) { days++; mins -= 1440; }
        var p = dateParts(days); y = p.y; mo = p.m; d = p.d; H = Math.floor(mins / 60); M = mins % 60;
      }
      else {
        var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(val(c));
        if (!m) return '';
        y = +m[1]; mo = +m[2]; d = +m[3]; H = +(m[4] || 0); M = +(m[5] || 0);
      }
      return new Date(y, mo - 1, d, H, M).toISOString();
    }

    return { iso: iso, val: val, grid: grid, findHeader: findHeader, rows: rows, get: get, cell: cell, isDateCell: isDateCell, dateParts: dateParts };
  }

  function findSheet(wb, patterns) {
    var names = wb.SheetNames;
    for (var p = 0; p < patterns.length; p++) {
      for (var i = 0; i < names.length; i++) {
        if (patterns[p].test(names[i])) return wb.Sheets[names[i]];
      }
    }
    return null;
  }

  function parseRunbook(XLSX, wb, fileName) {
    var X = makeReader(XLSX), val = X.val, get = X.get;
    var warnings = [];

    /* ---- Cutover tasks ---- */
    var cutWs = findSheet(wb, [/cut\s*over/i, /day\s*activit/i]);
    if (!cutWs) throw new Error('Could not find the "Cutover - Day Activities" sheet.');
    var cg = X.grid(cutWs);
    var chr = X.findHeader(cg, ['Task ID', 'Description']);
    if (chr < 0) throw new Error('Cutover sheet has no header row with "Task ID" and "Description".');
    var title = '';
    for (var tr = 0; tr < chr && !title; tr++) (cg[tr] || []).forEach(function (c) { if (!title && val(c)) title = val(c); });

    function startOf(dc, tc) {
      if (!dc || dc.t !== 'n') return '';
      var d = X.dateParts(dc.v);
      if (!d) return '';
      var H, M;
      if (tc && tc.t === 'n') { var mins = Math.round((tc.v % 1) * 1440) % 1440; H = Math.floor(mins / 60); M = mins % 60; }
      else {
        var m = /^(\d{1,2}):(\d{2})/.exec(val(tc));
        if (!m) return '';
        H = +m[1]; M = +m[2];
      }
      return d.y + '-' + pad(d.m) + '-' + pad(d.d) + 'T' + pad(H) + ':' + pad(M);
    }

    var tasks = [];
    X.rows(cg, chr).forEach(function (r) {
      var id = get(r, 'Task ID');
      if (!id) return;
      tasks.push({
        gate: get(r, 'Gate'), id: id, loc: get(r, 'Location'), desc: get(r, 'Description'),
        team: get(r, 'Responsible Team'), res: get(r, 'Allocated Resource'),
        dur: parseInt(get(r, 'Planned Duration (Minutes)'), 10) || 0,
        start: startOf(X.cell(r, 'Planned Start Date'), X.cell(r, 'Planned Start Time')),
        endSheet: (get(r, 'Planned End Date').slice(0, 10) + ' ' + get(r, 'Planned End Time')).trim(),
        status: STATUS_IN[get(r, 'Status').toLowerCase()] || get(r, 'Status') || 'Open',
        aStart: X.iso(X.cell(r, 'Actual Start Date/Time')), aEnd: X.iso(X.cell(r, 'Actual End Date/Time')), note: get(r, 'App Notes'), deps: get(r, 'Dependencies'), comments: get(r, 'Comments'),
        appGroup: get(r, 'App Owner Group'), app: get(r, 'Application Name'),
        spoc: get(r, 'Application SPOC Name'), spocContact: get(r, 'Application Scope Contact'),
        vendor: get(r, 'Application Vendor Name'), vendorContact: get(r, 'Application Vendor Contact')
      });
    });
    if (!tasks.length) throw new Error('No tasks found in the cutover sheet.');
    var noStart = tasks.filter(function (t) { return !t.start; }).length;
    if (noStart) warnings.push(noStart + ' task(s) have no planned start date/time.');

    /* ---- High level / trucks ---- */
    var summary = [], trucks = [];
    var hlWs = findSheet(wb, [/high\s*-?\s*level/i]);
    if (hlWs) {
      var hg = X.grid(hlWs);
      for (var r0 = 0; r0 < hg.length; r0++) {
        var row0 = hg[r0] || [], c0 = -1;
        for (var k = 0; k < row0.length; k++) if (/^total devices$/i.test(val(row0[k]))) c0 = k;
        if (c0 < 0) continue;
        for (var r1 = r0; r1 < hg.length; r1++) {
          var rr = hg[r1] || [];
          if (!val(rr[c0])) break;
          summary.push({ label: val(rr[c0]), value: val(rr[c0 + 1]), truck: val(rr[c0 + 3]), window: val(rr[c0 + 4]) });
        }
        break;
      }
      var hhr = X.findHeader(hg, ['S#', 'Batch']);
      if (hhr >= 0) {
        X.rows(hg, hhr).forEach(function (r) {
          if (!get(r, 'S#')) return;
          var ri = r.__hdr.indexOf(norm('Remarks'));
          var extra = ri >= 0 ? val(r.__row[ri + 1]) : '';
          trucks.push({
            batch: get(r, 'Batch'), sn: get(r, 'S#'), ft: get(r, 'Truck Ft'), desc: get(r, 'Movement Duration'),
            handover: get(r, 'Handover to RI'), start: get(r, 'Start Time _ITI'), reach: get(r, 'Reach Time _STT'),
            devices: get(r, 'Devices'), racks: get(r, 'Racks'), remarks: get(r, 'Remarks') + (extra ? ' — ' + extra : '')
          });
        });
      }
    } else warnings.push('HIGH-LEVEL sheet not found — truck schedule will be empty.');

    /* ---- Devices: Run_Plan, enriched from Scope ---- */
    var rpWs = findSheet(wb, [/run\s*_?\s*plan/i]);
    if (!rpWs) throw new Error('Could not find the "Run_Plan" sheet.');
    var rg = X.grid(rpWs);
    var rhr = X.findHeader(rg, ['Hostname', 'Movement Batch']);
    if (rhr < 0) throw new Error('Run_Plan has no header row with "Hostname" and "Movement Batch".');

    var scope = {};
    var scWs = findSheet(wb, [/^\s*scope\s*$/i, /scope/i]);
    if (scWs) {
      var sg = X.grid(scWs);
      var shr = X.findHeader(sg, ['Hostname', 'Device Primary Serial Numbers']);
      if (shr >= 0) X.rows(sg, shr).forEach(function (r) {
        var k = get(r, 'Hostname') + '|' + get(r, 'Device Primary Serial Numbers');
        if (!(k in scope)) scope[k] = r;
      });
    } else warnings.push('Scope sheet not found — device contacts, OS and management IPs will be blank.');

    var rpCols = ['SN', 'Hostname', 'Movement Batch', 'Truck No', 'Shutdown Date', 'Shutdown Time', 'Royal Handover Time', 'Truck Movement Time',
      'Hypervisor', 'Physical Hostname for VM', 'Device Primary Serial Numbers', 'Device Sub Serial Number', 'HW Type', 'CBS/Non-CBS',
      'Data Hall', 'Rack Number', 'U Position', 'Device U Size', 'Destination Rack', 'Target U-position', 'Device Type 1', 'Device Type',
      'Device (OEM)', 'Device Model', 'Device Role', 'Environment', 'Criticality', 'App Owner Group', 'Application Name', 'Internal IP', 'SAN Connected'];
    var scCols = ['Management IP (ILO)', 'OS Type', 'OS Version', 'Count of Power Connections', 'Power Cord Type (C13/C19)',
      'Application SPOC Name', 'Application Scope Contact', 'Application Vendor Name', 'Application Vendor Contact'];
    var keys = ['sn', 'host', 'batch', 'truck', 'shutDate', 'shutTime', 'handover', 'truckTime', 'hyp', 'physHost', 'serial', 'subSerial', 'hw', 'cbs',
      'hall', 'srcRack', 'srcU', 'uSize', 'dstRack', 'dstU', 'type1', 'type', 'oem', 'model', 'role', 'env', 'crit', 'appGroup', 'app', 'ip', 'san',
      'mgmtIp', 'os', 'osVer', 'psu', 'cord', 'spoc', 'spocContact', 'vendor', 'vendorContact', 'stage', 'stageAt', 'note'];
    var devices = [];
    X.rows(rg, rhr).forEach(function (r) {
      if (!get(r, 'Hostname')) return;
      var sr = scope[get(r, 'Hostname') + '|' + get(r, 'Device Primary Serial Numbers')] || {};
      var vals = rpCols.map(function (c) { return get(r, c); }).concat(scCols.map(function (c) { return get(sr, c); }));
      var stage = DEVICE_STAGES.map(function (s) { return s.toLowerCase(); }).indexOf(get(r, 'Migration Stage').toLowerCase());
      vals.push(stage, stage >= 0 ? X.iso(X.cell(r, 'Stage Updated')) : '', get(r, 'App Notes'));
      vals[4] = vals[4].slice(0, 10);
      devices.push(vals);
    });
    if (!devices.length) throw new Error('No devices found in Run_Plan.');

    /* ---- GO / NO-GO ---- */
    var gonogo = [], decision = '';
    var gWs = findSheet(wb, [/go\s*-?\s*no\s*-?\s*go/i]);
    if (gWs) {
      var gg = X.grid(gWs), ghr = X.findHeader(gg, ['Sr. No.', 'Activities']);
      if (ghr >= 0) {
        var sc = (gg[ghr] || []).map(function (c) { return norm(val(c)); }).indexOf(norm('Sr. No.'));
        var hdr = (gg[ghr] || []).map(function (c) { return norm(val(c)); });
        var cSign = hdr.indexOf(norm('SignOff Received')), cDec = hdr.indexOf(norm('GO/NOGO'));
        var section = 'Readiness';
        for (var gr = ghr + 1; gr < gg.length; gr++) {
          var g = gg[gr] || [];
          var label = val(g[sc]);
          if (/must\s*have/i.test(label)) { section = 'GO – Must Haves'; continue; }
          if (/^\d+$/.test(label)) {
            var sv = cSign >= 0 ? val(g[cSign]) : '', sm = /(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2})/.exec(sv);
            gonogo.push({ section: section, n: label, item: val(g[sc + 1]), by: val(g[sc + 3]), who: val(g[sc + 4]),
              signed: !!sv && !/^no\b/i.test(sv), signedAt: sm ? X.iso({ v: sm[1], t: 's' }) : '' });
          } else if (cDec >= 0 && g.some(function (c) { return /^decision$/i.test(val(c)); })) {
            var dv = val(g[cDec]).toUpperCase().replace(/[^A-Z]/g, '');
            if (dv === 'GO' || dv === 'NOGO') decision = dv;
          }
        }
      }
    }

    /* ---- Pre-event checklist ---- */
    var pre = [];
    var pWs = findSheet(wb, [/pre\s*-?\s*event/i]);
    if (pWs) {
      var pg = X.grid(pWs), phr = X.findHeader(pg, ['#', 'Description']);
      if (phr >= 0) X.rows(pg, phr).forEach(function (r) {
        if (!get(r, '#')) return;
        pre.push({ id: get(r, '#'), phase: get(r, 'Phase'), loc: get(r, 'Location'), scope: get(r, 'Scope / Application'),
          desc: get(r, 'Description'), owner: get(r, 'Owner'), status: get(r, 'Status') || 'Open', at: X.iso(X.cell(r, 'Actual Date')), freq: get(r, 'Frequency') });
      });
    }

    /* ---- Contacts ---- */
    var contacts = [];
    var mWs = findSheet(wb, [/migration\s*squad/i, /contact/i]);
    if (mWs) {
      var group = '';
      X.grid(mWs).forEach(function (row) {
        var v = [0, 1, 2, 3, 4].map(function (i) { return val(row[i]); });
        if (/^(migration squad|management team|application\/team\s+name)$/i.test(v[0])) return;
        if (v[0]) group = v[0];
        if (!v[1]) return;
        contacts.push({ group: group, name: v[1], role: v[2], phone: v[3], email: v[4] });
      });
    }

    /* ---- Command centre ---- */
    var comms = { intro: '', bridge: '', methods: [] };
    var ccWs = findSheet(wb, [/command\s*cent/i]);
    if (ccWs) {
      var ccg = X.grid(ccWs);
      ccg.forEach(function (row) {
        (row || []).forEach(function (c) {
          var s = val(c);
          if (!comms.intro && /command cent(re|er) is set up/i.test(s)) comms.intro = s;
          if (!comms.bridge && /^command cent(re|er)\s*:/i.test(s)) comms.bridge = s;
        });
      });
      var cchr = X.findHeader(ccg, ['Communication Method']);
      if (cchr >= 0) {
        var mc = (ccg[cchr] || []).map(function (c) { return norm(val(c)); }).indexOf(norm('Communication Method'));
        for (var cr = cchr + 1; cr < ccg.length; cr++) {
          var m = ccg[cr] || [];
          if (val(m[mc])) comms.methods.push({ method: val(m[mc]), purpose: val(m[mc + 1]), desc: val(m[mc + 2]), leads: val(m[mc + 3]), audience: val(m[mc + 4]) });
        }
      }
    }

    /* ---- Change log ---- */
    var changelog = [];
    var clWs = findSheet(wb, [/change\s*log/i]);
    if (clWs) {
      var clg = X.grid(clWs), clhr = X.findHeader(clg, ['Item #']);
      if (clhr >= 0) for (var lr = clhr + 1; lr < clg.length; lr++) {
        var v = [0, 1, 2, 3, 4].map(function (i) { return val((clg[lr] || [])[i]); });
        if (v.some(Boolean)) changelog.push({ item: v[0], tab: v[1], desc: v[2], by: v[3], date: v[4].slice(0, 10) });
      }
    }

    /* ---- App event log (written by a previous export) ---- */
    var log = [];
    var lWs = findSheet(wb, [/^app event log$/i]);
    if (lWs) {
      var lg = X.grid(lWs);
      for (var li = 1; li < lg.length; li++) {
        var lrow = lg[li] || [];
        var when = X.iso(lrow[0]);
        if (when && val(lrow[1])) log.unshift({ t: when, m: val(lrow[1]), by: val(lrow[2]) });
      }
    }

    var wave = /wave\s*0*(\d+)/i.exec(title + ' ' + fileName);
    var ver = /v\d+(\.\d+)*/i.exec(fileName || '');
    return {
      title: title || 'DC Migration Runbook', short: 'DC Shift' + (wave ? ' · Wave ' + wave[1] : ''),
      version: ver ? ver[0] : '', source: fileName || '',
      tasks: tasks, summary: summary, trucks: trucks, devKeys: keys, devices: devices,
      gonogo: gonogo, decision: decision, log: log, pre: pre, contacts: contacts, comms: comms, changelog: changelog, warnings: warnings
    };
  }

  root.parseRunbook = parseRunbook;
  root.runbookReader = makeReader;
  root.deviceKey = deviceKey;
  root.DEVICE_STAGES = DEVICE_STAGES;
  if (typeof module !== 'undefined') module.exports = { parseRunbook: parseRunbook, runbookReader: makeReader, deviceKey: deviceKey, DEVICE_STAGES: DEVICE_STAGES };
})(typeof window !== 'undefined' ? window : globalThis);
