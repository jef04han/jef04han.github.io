/* Turns the CBS migration runbook workbook into the data model the app uses.
   Runs entirely in the browser. Sheets and columns are found by name, so extra or
   re-ordered rows/columns in a new runbook version still parse. */
(function (root) {
  'use strict';

  var TASK_STATUSES = ['Open', 'In Progress', 'Done', 'Blocked', 'N/A'];
  var STATUS_IN = { 'open': 'Open', 'in progress': 'In Progress', 'wip': 'In Progress', 'closed': 'Done', 'done': 'Done', 'complete': 'Done', 'completed': 'Done',
    'blocked': 'Blocked', 'not applicable': 'N/A', 'n/a': 'N/A', 'na': 'N/A' };
  var STATUS_OUT = { 'Done': 'Closed', 'N/A': 'Not Applicable' };
  // Values offered by the drop-downs in the Scope_Devices sheet.
  var MIG_STATES = ['Pending', 'Unracked', 'Packed', 'Loaded', 'In Transit', 'Received', 'Mounted', 'Cabled', 'Powered On', 'Validated'];
  var SHUT_STATES = ['Pending', 'App Stopped', 'DB Stopped', 'OS Down', 'Powered Off', 'Not Applicable'];
  var TRUCK_STATES = ['Planned', 'Loading', 'In Transit', 'Arrived', 'Unloaded', 'Closed', 'Delayed'];
  var YN = ['Y', 'N'];

  /* Every other sheet the team updates during the event. `fields` are the columns the app edits
     (written back on export); everything else is shown read-only. */
  var CONFIG = [
    { id: 'trucks', hidden: true, title: 'Truck tracker', sheet: [/truck\s*_?\s*tracker/i], header: ['Truck No', 'Planned Departure (ITI)'], keyCols: ['Truck No'],
      fields: [{ c: 'Status', t: 'enum', o: TRUCK_STATES }, { c: 'Actual Departure', t: 'date' }, { c: 'Actual Arrival', t: 'date' }, { c: 'Vehicle No', t: 'text' },
        { c: 'Gate Pass No', t: 'text' }, { c: 'E-Way Bill No', t: 'text' }, { c: 'Seal No', t: 'text' }, { c: 'Escort / Driver', t: 'text' }, { c: 'Remarks', t: 'text' }] },
    { id: 'gonogo', title: 'GO / NO-GO checklist', sheet: [/go\s*-?\s*no\s*-?\s*go/i], header: ['Sr. No.', 'Gates'], keyCols: ['Sr. No.'],
      sections: true, titleCol: 'Gates', badgeCol: 'Sr. No.', subCols: ['Description', 'Approved By'],
      fields: [{ c: 'Sign-off Received', t: 'enum', o: YN }, { c: 'GO / NO-GO', t: 'enum', o: ['GO', 'NO-GO', 'Pending'] }, { c: 'Notes', t: 'text' }] },
    { id: 'pre', title: 'Pre-event checklist', sheet: [/pre\s*-?\s*event/i], header: ['#', 'Description'], keyCols: ['#'],
      titleCol: 'Description', badgeCol: '#', subCols: ['Phase', 'Owner'], groupCol: 'Phase',
      fields: [{ c: 'Status', t: 'enum', o: ['Open', 'In Progress', 'Closed', 'Blocked', 'Not Applicable'] }, { c: '% Completion', t: 'num' },
        { c: 'RAG', t: 'enum', o: ['Green', 'Amber', 'Red'] }, { c: 'Actual Date', t: 'date' }, { c: 'Comments', t: 'text' }] },
    { id: 'network', title: 'Network runbook', sheet: [/network\s*runbook/i], header: ['Task Activity', 'Activity'], keyCols: ['Task Activity', 'SR. NO', 'Activity'],
      titleCol: 'Activity', badgeCol: 'SR. NO', subCols: ['Owner', 'Target Date'], groupCol: 'Task Activity',
      fields: [{ c: 'Status', t: 'enum', o: ['Open', 'In Progress', 'Completed', 'Blocked', 'Not Applicable'] }, { c: 'Dependancy/Remark', t: 'text' }] },
    { id: 'load', title: 'Truck load plan', sheet: [/truck\s*_?\s*load/i], header: ['Truck No', 'Load Seq'], keyCols: ['Truck No', 'Load Seq'],
      titleCol: 'Load Item', badgeCol: 'Load Seq', subCols: ['Source Rack', 'Hostname', 'Target Rack / Note'], groupCol: 'Truck No',
      fields: [{ c: 'Loaded at Source (Y/N)', t: 'enum', o: YN }, { c: 'Received at Target (Y/N)', t: 'enum', o: YN }] },
    { id: 'rackmove', title: 'Rack movement plan', sheet: [/rack\s*_?\s*movement/i], header: ['Source Rack', 'Destination @ STT'], keyCols: ['Source Rack'],
      titleCol: 'Source Rack', subCols: ['Destination @ STT', 'Rack Disposition', 'Rack Truck'], groupCol: 'Rack Ships in Batch',
      fields: [{ c: 'Target Position Ready (Y/N)', t: 'enum', o: YN }, { c: 'Rack Received (Y/N)', t: 'enum', o: YN }] },
    { id: 'stt', title: 'Target racks @ STT', sheet: [/racks\s*for\s*cbs/i], header: ['Destination Rack @ STT', 'Recommendation'], keyCols: ['Destination Rack @ STT'],
      titleCol: 'Destination Rack @ STT', subCols: ['Recommended Rack', 'Rack Movement', 'Rack Truck'], groupCol: 'Rack Ships in Batch',
      fields: [{ c: 'Rack & PDU Ready at STT (Y/N)', t: 'enum', o: YN }] },
    { id: 'readiness', title: 'Target rack readiness', sheet: [/target\s*_?\s*rack\s*_?\s*readiness/i], header: ['Primary Serial', 'Target Rack'], keyCols: ['Primary Serial', 'Hostname'],
      titleCol: 'Hostname', badgeCol: 'Device Truck', subCols: ['Primary Serial', 'Target Rack', 'Target U', 'Result'], groupCol: 'Device Batch',
      fields: [{ c: 'Confirmed by STT/Bank (Y/N)', t: 'enum', o: YN }] },
    { id: 'san', title: 'SAN fabric', sheet: [/san\s*_?\s*fabric/i], header: ['Switch Name', 'Switch Serial'], keyCols: ['Switch Serial', 'Switch Name'],
      titleCol: 'Switch Name', badgeCol: 'Fabric', subCols: ['Source Rack', 'Target Rack', 'Truck No', 'ISL Peers (SAN-MAP) & Batch'], groupCol: 'Movement Batch',
      fields: [{ c: 'ISL Verified at Target (Y/N)', t: 'enum', o: YN }, { c: 'Fabric Health OK (Y/N)', t: 'enum', o: YN }] },
    { id: 'apps', title: 'Applications', sheet: [/batch\s*_?\s*app/i], header: ['App Owner Group', 'Applications'], keyCols: ['App Owner Group'],
      titleCol: 'App Owner Group', subCols: ['Applications', 'Application Bank SPOC(s)'],
      fields: [{ c: 'Runbook Walkthrough Done (Y/N)', t: 'enum', o: YN }, { c: 'App Sign-off at Target (Y/N)', t: 'enum', o: YN }] },
    { id: 'seq', title: 'Shutdown & startup sequence', sheet: [/shutdown\s*_?\s*startup/i], header: ['Shutdown Seq Group', 'Hostname'], keyCols: ['Hostname', 'Serial Number', 'IP'],
      titleCol: 'Hostname', badgeCol: 'Physical / Virtual', subCols: ['Application', 'Physical Host Name', 'IP'], groupCol: 'Shutdown Seq Group', batchCol: 'Movement Batch',
      fields: [{ c: 'Shutdown Status', t: 'enum', o: ['Pending', 'In Progress', 'Done', 'Not Applicable'] }, { c: 'Startup Status', t: 'enum', o: ['Pending', 'In Progress', 'Done', 'Not Applicable'] }] },
    { id: 'calls', title: 'Runbook walkthrough calls', sheet: [/runbook\s*calls/i], header: ['Session', 'App Owner Group'], keyCols: ['Batch', 'App Owner Group'],
      titleCol: 'App Owner Group', subCols: ['Applications', 'Bank SPOC'], groupCol: 'Batch',
      fields: [{ c: 'Status', t: 'enum', o: ['Planned', 'Done', 'Re-schedule', 'Not Required'] }, { c: 'Date', t: 'date' }, { c: 'Minutes / Remarks', t: 'text' }] },
    { id: 'issues', title: 'Issue log', sheet: [/issue\s*log/i], header: ['ID', 'Issue Summary'], keyCols: ['ID'], addable: 'Issue Summary',
      titleCol: 'Issue Summary', badgeCol: 'ID', subCols: ['Owner', 'Issue Status', 'Batch', 'Task ID'],
      fields: [{ c: 'Issue Summary', t: 'text' }, { c: 'Date', t: 'date' }, { c: 'Raised by', t: 'text' }, { c: 'Phase / Tower / Area', t: 'text' },
        { c: 'Batch', t: 'text' }, { c: 'Task ID', t: 'text' }, { c: 'Priority (L/M/H)', t: 'enum', o: ['L', 'M', 'H'] }, { c: 'Action', t: 'text' },
        { c: 'Owner', t: 'text' }, { c: 'Target Resolution Date', t: 'date' }, { c: 'Action Status', t: 'text' },
        { c: 'Issue Status', t: 'enum', o: ['Open', 'In Progress', 'Closed'] }, { c: 'Date Closed', t: 'date' }, { c: 'Remarks', t: 'text' }] },
    { id: 'actions', title: 'Action log', sheet: [/action\s*log/i], header: ['S No', 'Action Items'], keyCols: ['S No'],
      titleCol: 'Action Items', badgeCol: 'S No', subCols: ['Owner', 'Status'],
      fields: [{ c: 'Owner', t: 'text' }, { c: 'Target Date', t: 'date' }, { c: 'Status', t: 'enum', o: ['Open', 'In Progress', 'Closed'] }, { c: 'Comments', t: 'text' }] },
    { id: 'risks', title: 'Risk log', sheet: [/risk\s*log/i], header: ['ID', 'Risk Description'], keyCols: ['ID'],
      titleCol: 'Risk Description', badgeCol: 'ID', subCols: ['Risk Category / Phase', 'Risk Rating', 'Owner', 'Risk Status'],
      fields: [{ c: 'Risk Status', t: 'enum', o: ['Open', 'Mitigated', 'Closed', 'Accepted'] }, { c: 'Action Status', t: 'text' }, { c: 'Remarks', t: 'text' }] },
    { id: 'changes', title: 'Change records', sheet: [/change\s*records/i], header: ['Sr #', 'Change record'], keyCols: ['Sr #'],
      titleCol: 'Description', badgeCol: 'Batch', subCols: ['Change record', 'Status'],
      fields: [{ c: 'Change record', t: 'text' }, { c: 'Status', t: 'text' }] },
    { id: 'lessons', title: 'Lessons learnt', sheet: [/lessons/i], header: ['S.No.', 'Short Description'], keyCols: ['S.No.'],
      titleCol: 'Short Description', subCols: ['Actions Needed', 'Source Event'], fields: [] },
    { id: 'assumptions', title: 'Assumptions', sheet: [/assumption/i], header: ['Item', 'Assumption / Basis'], keyCols: ['Item'],
      titleCol: 'Item', subCols: ['Assumption / Basis'], fields: [] }
  ];

  function isNA(v) { return !v || /^(na|n\/a|not applicable|no ip assigned|to be confirmed|-|—)$/i.test(String(v).trim()); }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\\n/g, ' ').replace(/[^a-z0-9#&/%@]+/g, ' ').trim(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function makeReader(XLSX) {
    function isDateCell(c) { return c && c.t === 'n' && c.z && XLSX.SSF.is_date(c.z); }
    function dateParts(v) { return XLSX.SSF.parse_date_code(v); }
    function val(c) {
      if (!c || c.v == null) return '';
      if (c.t === 'n') {
        if (isDateCell(c)) {
          var days = Math.floor(c.v), mins = Math.round((c.v - days) * 1440);
          if (mins >= 1440) { days++; mins -= 1440; }
          var H = Math.floor(mins / 60), M = mins % 60;
          if (c.v < 1) return pad(H) + ':' + pad(M);
          var p = dateParts(days);
          if (!p) return '';
          var d = p.y + '-' + pad(p.m) + '-' + pad(p.d);
          return (H || M) ? d + ' ' + pad(H) + ':' + pad(M) : d;
        }
        return String(Math.round(c.v * 1e6) / 1e6);
      }
      if (c.t === 'b') return c.v ? 'True' : 'False';
      if (c.t === 'e') return '';
      return String(c.v).trim();
    }
    function grid(ws) {
      var data = ws['!data'] || [], out = [];
      for (var r = 0; r < data.length; r++) {
        var row = data[r] || [], o = [];
        for (var c = 0; c < row.length; c++) o.push(row[c] || null);
        out.push(o);
      }
      return out;
    }
    function findHeader(g, labels) {
      var want = labels.map(norm);
      for (var r = 0; r < g.length; r++) {
        var cells = (g[r] || []).map(function (c) { return norm(val(c)); });
        if (want.every(function (w) { return cells.indexOf(w) >= 0; })) return r;
      }
      return -1;
    }
    // Date cell or "YYYY-MM-DD[ HH:MM]" text → ISO timestamp (local time), else ''.
    function iso(c) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(val(c));
      if (!m) return '';
      return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)).toISOString();
    }
    return { val: val, grid: grid, findHeader: findHeader, iso: iso, isDateCell: isDateCell };
  }

  function findSheetName(wb, patterns) {
    for (var p = 0; p < patterns.length; p++)
      for (var i = 0; i < wb.SheetNames.length; i++) if (patterns[p].test(wb.SheetNames[i])) return wb.SheetNames[i];
    return null;
  }

  /* A sheet as a table: header row located by labels, one entry per data row with its Excel
     row number, a stable key and (optionally) the section heading it sits under.
     Duplicate header names keep the first column. */
  function readTable(X, wb, opts) {
    var name = findSheetName(wb, opts.sheet);
    if (!name) return null;
    var g = X.grid(wb.Sheets[name]);
    var hr = X.findHeader(g, opts.header);
    if (hr < 0) return null;
    var hdrRow = g[hr] || [], headers = [], col = {};
    for (var i = 0; i < hdrRow.length; i++) {
      var label = X.val(hdrRow[i]).replace(/\s+/g, ' ').trim(), n = norm(label);
      if (!n || n in col) continue;
      col[n] = i; headers.push({ n: n, label: label, i: i });
    }
    var keyIdx = opts.keyCols.map(function (k) { return col[norm(k)]; }).filter(function (x) { return x != null; });
    var rows = [], seen = {}, sec = '', phase = '';
    for (var r = hr + 1; r < g.length; r++) {
      var row = g[r] || [];
      var texts = [];
      for (var j = 0; j < row.length; j++) { var t = X.val(row[j]); if (t) texts.push(t); }
      if (!texts.length) continue;
      var keyParts = keyIdx.map(function (k) { return X.val(row[k]); });
      var heading = opts.sections && texts.length === 1 && /[A-Za-z]{3}/.test(texts[0]) && !/^\w{1,3}-?\d+$/.test(texts[0]);
      if (heading || !keyParts.some(Boolean)) {
        // heading rows: one text only (e.g. "BATCH 1 – …", "▸ Source – …", "Batch 1 gates")
        if (heading) {
          if (/^▸/.test(texts[0])) phase = texts[0].replace(/^▸\s*/, '');
          else { sec = texts[0]; phase = ''; }
        }
        continue;
      }
      var key = keyParts.join('|').slice(0, 160);
      seen[key] = (seen[key] || 0) + 1;
      if (seen[key] > 1) key += '#' + seen[key];
      var v = {}, c = {};
      headers.forEach(function (h) { var x = X.val(row[h.i]); if (x) v[h.n] = x; c[h.n] = row[h.i]; });
      rows.push({ _r: r + 1, key: key, sec: sec, phase: phase, v: v, c: c });
    }
    return { name: name, hr: hr + 1, headers: headers, col: col, rows: rows };
  }

  function deviceKey(v) {
    return [v['record type'], v['hostname'], v['device primary serial number'], v['device sub serial number']].map(function (x) { return x || ''; }).join('|');
  }

  function parseRunbook(XLSX, wb, fileName) {
    var X = makeReader(XLSX), warnings = [];
    function get(row, label) { return row.v[norm(label)] || ''; }

    /* ---- Cutover tasks ---- */
    var cut = readTable(X, wb, { sheet: [/cut\s*over/i, /day\s*activit/i], header: ['Task ID', 'Description'], keyCols: ['Task ID'], sections: true });
    if (!cut) throw new Error('Could not find the "Cutover - Day Activities" sheet with "Task ID" and "Description" columns.');
    var tasks = cut.rows.map(function (r) {
      var b = get(r, 'Movement Batch');
      var start = X.iso(r.c[norm('Planned Start (Date-Time)')]);
      if (!start) {
        var d = get(r, 'Planned Start Date').slice(0, 10), t = get(r, 'Planned Start Time');
        if (d && /^\d{1,2}:\d{2}/.test(t)) start = new Date(d + 'T' + (t.length === 4 ? '0' + t : t.slice(0, 5))).toISOString();
      }
      var end = X.iso(r.c[norm('Planned End (Date-Time)')]);
      return {
        id: r.key, seq: get(r, 'Sl. No.'), batch: b, gate: /^\d/.test(b) ? 'Batch ' + b : (b || 'Other'),
        section: r.sec, phase: r.phase, loc: get(r, 'Location'), desc: get(r, 'Description'), team: get(r, 'Responsible Team'),
        res: get(r, 'Allocated Resource'), dur: parseInt(get(r, 'Planned Duration (Minutes)'), 10) || 0, start: start, end: end,
        status: STATUS_IN[get(r, 'Status').toLowerCase()] || 'Open',
        aStart: X.iso(r.c[norm('Actual Start Date/Time')]), aEnd: X.iso(r.c[norm('Actual End Date/Time')]),
        deps: get(r, 'Dependencies'), comments: get(r, 'Comments'), appGroup: get(r, 'App Owner Group'), app: get(r, 'Application Name'),
        spoc: get(r, 'Application SPOC Name'), spocContact: get(r, 'Application Scope Contact'), vendor: get(r, 'Application Vendor Name'),
        vendorContact: get(r, 'Application Vendor Contact'), truck: get(r, 'Truck No'), chk: get(r, 'Checkpoint / Notification'), note: get(r, 'App Notes'),
        _r: r._r
      };
    }).filter(function (t) { return /\w/.test(t.id); });
    if (!tasks.length) throw new Error('No tasks found in the cutover sheet.');
    var title = '';
    (function () {
      var g = X.grid(wb.Sheets[cut.name]);
      for (var r = 0; r < cut.hr - 1 && !title; r++) (g[r] || []).forEach(function (c) { if (!title && X.val(c)) title = X.val(c); });
    })();

    /* ---- Devices (Scope_Devices) ---- */
    var scope = readTable(X, wb, { sheet: [/^scope\s*_?\s*devices$/i, /^scope$/i, /scope/i], header: ['Hostname', 'Movement Batch'],
      keyCols: ['Record Type', 'Hostname', 'Device Primary Serial Number', 'Device Sub Serial Number'] });
    if (!scope) throw new Error('Could not find the "Scope_Devices" sheet with "Hostname" and "Movement Batch" columns.');
    var DF = { sn: 'SN', rec: 'Record Type', hw: 'HW Type', host: 'Hostname', phys: 'Physical Host (Base Machine)', batch: 'Movement Batch', truck: 'Truck No',
      mode: 'Transport Mode', shutDate: 'Shutdown Date', shutTime: 'Shutdown Time', migDate: 'Migration Date', handover: 'Royal Handover Time',
      truckTime: 'Truck Movement Time', serial: 'Device Primary Serial Number', subSerial: 'Device Sub Serial Number', cbs: 'CBS/Non-CBS',
      env: 'Environment', appGroup: 'App Owner Group', app: 'Application Name', spoc: 'Application Bank SPOC', vendor: 'Application Vendor Name',
      vendorContact: 'Application Vendor Contact', crit: 'Criticality', type: 'Device Type', role: 'Device Role', oem: 'OEM Make', model: 'Device Model',
      arch: 'x86 / IBM Power', os: 'OS Type', osVer: 'OS Version', ip: 'Internal IP', mgmtIp: 'Management IP (ILO)', vlan: 'VLAN Name', zone: 'NW Zone',
      srcRack: 'Source Rack', srcU: 'Source U Position', uSize: 'Device U Size', rackMoving: 'Source Rack Moving (Y/N)', dstRow: 'Target Row',
      dstRack: 'Target Rack', dstU: 'Target U Position', eqRack: 'Equivalent Source Rack', san: 'SAN Connected', sanSw: 'SAN Switches (Batch)',
      fabric: 'Fabric Coverage', oemContacts: 'OEM Contacts', hwVendor: 'HW Vendor', w2w: 'W2W Power Status', devStatus: 'Device Status',
      scrap: 'Scrap / OOS Flag', reason: 'Movement Reason', shut: 'Shutdown Status', mig: 'Migration Status', remarks: 'Remarks',
      note: 'App Notes', updAt: 'Status Updated' };
    var devKeys = Object.keys(DF);
    var devices = scope.rows.map(function (r) {
      var o = devKeys.map(function (k) { return get(r, DF[k]); });
      o.push(r.key);
      return o;
    });
    devKeys.push('key');
    if (!devices.length) throw new Error('No devices found in the Scope sheet.');

    /* ---- Trucks: tracker + high-level plan ---- */
    var tracker = readTable(X, wb, { sheet: [/truck\s*_?\s*tracker/i], header: ['Truck No', 'Planned Departure (ITI)'], keyCols: ['Truck No'] });
    var hl = readTable(X, wb, { sheet: [/high\s*-?\s*level/i], header: ['Truck No', 'Scope'], keyCols: ['Truck No'] });
    var hlBy = {};
    if (hl) hl.rows.forEach(function (r) { hlBy[r.key] = r; });
    var trucks = (tracker ? tracker.rows : (hl ? hl.rows : [])).filter(function (r) { return /^TR/i.test(r.key); }).map(function (r) {
      var h = hlBy[r.key] || { v: {}, c: {} };
      function H(l) { return get(h, l); }
      return {
        id: r.key, batch: get(r, 'Batch') || H('Batch'), emptyRacks: get(r, 'Empty Racks'), oemRacks: get(r, 'OEM Loaded Racks'),
        loose: get(r, 'Loose Devices'), boxes: get(r, 'Boxes Used (of 45)'),
        loadStart: get(r, 'Planned Load Start'), depart: get(r, 'Planned Departure (ITI)') || H('Start Time _ITI'), arrive: get(r, 'Planned Arrival (STT)') || H('Reach Time _STT'),
        scope: H('Scope'), activity: H('Start of Activity'), handover: H('Handover to RI'), mount: H('Unpack/ Mounting'), powerOn: H('PowerOn/ Troubleshoot'),
        devices: H('Devices'), racks: H('Racks'), srcRacks: H('Source Rack'), dstRacks: H('Target Rack'), plan: H('Remarks'),
        v: r.v
      };
    });
    if (!tracker) warnings.push('Truck_Tracker sheet not found — truck actuals cannot be recorded.');

    /* ---- Generic tracked sheets ---- */
    var sheets = {};
    CONFIG.forEach(function (cfg) {
      var t = readTable(X, wb, { sheet: cfg.sheet, header: cfg.header, keyCols: cfg.keyCols, sections: !!cfg.sections });
      if (!t) return;
      sheets[cfg.id] = { headers: t.headers.map(function (h) { return [h.n, h.label]; }), rows: t.rows.map(function (r) { return { key: r.key, sec: r.sec, v: r.v }; }) };
    });

    /* ---- Wave dashboard ---- */
    var wave = { batches: [] };
    var dash = readTable(X, wb, { sheet: [/wave\s*dashboard/i], header: ['Batch', 'Theme'], keyCols: ['Batch'] });
    if (dash) dash.rows.forEach(function (r) {
      if (!/^\d/.test(r.key)) return;
      wave.batches.push({ batch: r.key, theme: get(r, 'Theme'), physical: get(r, 'Physical Rows'), lpars: get(r, 'AIX LPARs'), vms: get(r, 'Hyper-V VMs'),
        trucks: get(r, 'Trucks'), emptyRacks: get(r, 'Empty Racks'), oemRacks: get(r, 'OEM Loaded Racks'), start: get(r, 'Planned Start'), end: get(r, 'Planned End') });
    });
    var dname = findSheetName(wb, [/wave\s*dashboard/i]);
    if (dname) X.grid(wb.Sheets[dname]).forEach(function (row) {
      for (var i = 0; i + 1 < (row || []).length; i++) {
        var k = norm(X.val(row[i])), v = X.val(row[i + 1]);
        if (!v) continue;
        if (k === 'planned cutover start') wave.start = v;
        else if (k === 'planned cutover end') wave.end = v;
        else if (k === 'hypercare until') wave.hypercare = v;
        else if (k === 'source dc') wave.source = v;
        else if (k === 'target dc') wave.target = v;
        else if (/^downtime starts/.test(k)) wave.downtime = v;
        else if (k === 'wave number') wave.name = v;
      }
    });

    /* ---- Contacts ---- */
    var contacts = [];
    var sq = findSheetName(wb, [/migration\s*squad/i]);
    if (sq) {
      var group = '', g = X.grid(wb.Sheets[sq]), shr = X.findHeader(g, ['Name', 'Role']);
      for (var r = shr + 1; shr >= 0 && r < g.length; r++) {
        var v = [0, 1, 2, 3, 4].map(function (i) { return X.val((g[r] || [])[i]); });
        if (v[0]) group = v[0];
        if (!v[1] && !v[2]) continue;
        contacts.push({ group: group, name: v[1] || v[2], role: v[1] ? v[2] : '', phone: v[3], email: v[4] });
      }
    }
    var esc = findSheetName(wb, [/escalation/i]);
    var escalation = { notes: [], people: [] };
    if (esc) {
      var eg = X.grid(wb.Sheets[esc]), egroup = '', inTable = false;
      eg.forEach(function (row) {
        var v = [0, 1, 2, 3, 4, 5].map(function (i) { return X.val((row || [])[i]); });
        var filled = v.filter(Boolean).length;
        if (!filled) { inTable = false; return; }
        if (norm(v[0]) === 'name') { inTable = true; return; }
        if (!inTable) { if (filled === 1 && v[0].length < 80) egroup = v[0]; else if (filled === 1) escalation.notes.push(v[0]); return; }
        if (v[0] || v[2]) escalation.people.push({ group: egroup, name: v[0], where: v[1], phone: v[2], role: v[3], org: v[4], level: v[5] });
      });
    }
    var stake = readTable(X, wb, { sheet: [/stakeholder/i], header: ['Name', 'Role'], keyCols: ['Name'] });
    var stakeholders = stake ? stake.rows.map(function (r) {
      return { name: get(r, 'Name'), email: get(r, 'Email Id'), phone: get(r, 'Mobile Number'), role: get(r, 'Role'), org: get(r, 'Organisation') };
    }) : [];

    /* ---- Command centre ---- */
    var comms = { intro: '', methods: [] };
    var cc = findSheetName(wb, [/command\s*cent/i]);
    if (cc) {
      var cg = X.grid(wb.Sheets[cc]);
      cg.forEach(function (row) { (row || []).forEach(function (c) { var s = X.val(c); if (!comms.intro && /command cent(re|er) is set up/i.test(s)) comms.intro = s; }); });
      var mt = readTable(X, wb, { sheet: [/command\s*cent/i], header: ['Communication Method', 'Purpose'], keyCols: ['Communication Method'] });
      var stop = false;
      if (mt) mt.rows.forEach(function (r) {
        if (norm(r.key) === 'task id') stop = true;
        if (stop) return;
        comms.methods.push({ method: r.key, purpose: get(r, 'Purpose'), desc: get(r, 'Description'), leads: get(r, 'Key Participants / Leads'), audience: get(r, 'Audience'), details: get(r, 'Details') });
      });
      comms.methods = comms.methods.filter(function (m) { return m.purpose || m.desc; });
    }

    /* ---- Change log & index ---- */
    var changelog = [];
    var cl = readTable(X, wb, { sheet: [/change\s*log/i], header: ['Item #', 'Change Description'], keyCols: ['Item #'] });
    if (cl) changelog = cl.rows.map(function (r) { return { item: r.key, tab: get(r, 'App or Tab'), desc: get(r, 'Change Description'), by: get(r, 'Change by'), date: get(r, 'Date').slice(0, 10) }; });
    var info = {};
    var ix = findSheetName(wb, [/^index$/i]);
    if (ix) X.grid(wb.Sheets[ix]).forEach(function (row) {
      for (var i = 0; i + 1 < (row || []).length; i++) {
        var k = norm(X.val(row[i])), v = X.val(row[i + 1]);
        if (v && /^(project name|event|source → target|source target|migration window|version|conference bridge|primary contact|secondary contact)$/.test(k)) info[k] = v;
      }
    });

    /* ---- App event log (written by an earlier export) ---- */
    var log = [];
    var lt = readTable(X, wb, { sheet: [/^app event log$/i], header: ['Time', 'Entry'], keyCols: ['Time', 'Entry'] });
    if (lt) lt.rows.forEach(function (r) {
      var when = X.iso(r.c[norm('Time')]);
      if (when && get(r, 'Entry')) log.unshift({ t: when, m: get(r, 'Entry'), by: get(r, 'By') });
    });

    var ver = /v\d+(\.\d+)*/i.exec(fileName || '');
    return {
      kind: 'cbs', title: title || 'CBS Migration Runbook', short: 'CBS Shift', version: ver ? ver[0] : '', source: fileName || '',
      info: info, wave: wave, tasks: tasks, devKeys: devKeys, devices: devices, trucks: trucks, sheets: sheets,
      log: log, contacts: contacts, escalation: escalation, stakeholders: stakeholders, comms: comms, changelog: changelog, warnings: warnings
    };
  }

  var api = {
    parseRunbook: parseRunbook, makeReader: makeReader, readTable: readTable, findSheetName: findSheetName, deviceKey: deviceKey, norm: norm, isNA: isNA,
    CONFIG: CONFIG, TASK_STATUSES: TASK_STATUSES, STATUS_OUT: STATUS_OUT, MIG_STATES: MIG_STATES, SHUT_STATES: SHUT_STATES, TRUCK_STATES: TRUCK_STATES
  };
  root.CBS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
