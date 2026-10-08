/* Writes app progress back into the original runbook .xlsx.
   The workbook is patched in place (only the touched cells change), so formatting, formulas,
   tables and drop-downs survive. Runs entirely in the browser. */
(function (root) {
  'use strict';

  var DEC = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
  var ENC = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
  var CT_SHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';
  var LOG_SHEET = 'App Event Log';
  var STATUS_OUT = { 'Done': 'Closed', 'N/A': 'Not Applicable' };

  function xmlEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; })
      // strip characters XML 1.0 does not allow
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }
  function xmlUnesc(s) {
    return String(s).replace(/&(amp|lt|gt|quot|apos);/g, function (m, e) { return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e]; });
  }
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function colIndex(name) { var n = 0; for (var i = 0; i < name.length; i++) n = n * 26 + (name.charCodeAt(i) - 64); return n - 1; }
  function splitRef(ref) { var m = /^([A-Z]+)(\d+)$/.exec(ref); return { c: colIndex(m[1]), r: +m[2] }; }

  // ISO timestamp → Excel serial in the device's local time.
  function serial(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return null;
    return (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) - Date.UTC(1899, 11, 30)) / 86400000;
  }
  function stamp(iso) {
    var d = new Date(iso), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------------- zip helpers ---------------- */
  function Zip(XLSX, bytes) {
    var CFB = XLSX.CFB, zip = CFB.read(bytes, { type: 'array' });
    function find(path) { return CFB.find(zip, '/' + path); }
    return {
      has: function (path) { return !!find(path); },
      text: function (path) { var f = find(path); return f ? DEC.decode(f.content instanceof Uint8Array ? f.content : new Uint8Array(f.content)) : null; },
      put: function (path, str) {
        var data = ENC.encode(str), f = find(path);
        if (f) { f.content = data; f.size = data.length; }
        else CFB.utils.cfb_add(zip, '/' + path, data);
      },
      out: function () { return CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }); }
    };
  }

  /* ---------------- workbook structure ---------------- */
  function sheetPaths(zip) {
    var wb = zip.text('xl/workbook.xml'), rels = zip.text('xl/_rels/workbook.xml.rels');
    var targets = {}, out = {};
    rels.replace(/<Relationship\b[^>]*>/g, function (tag) {
      var id = /\bId="([^"]+)"/.exec(tag), t = /\bTarget="([^"]+)"/.exec(tag);
      if (id && t) targets[id[1]] = t[1];
      return tag;
    });
    wb.replace(/<sheet\b[^>]*>/g, function (tag) {
      var name = /\bname="([^"]*)"/.exec(tag), rid = /\br:id="([^"]+)"/.exec(tag);
      if (name && rid && targets[rid[1]]) {
        var t = targets[rid[1]];
        out[xmlUnesc(name[1])] = t.charAt(0) === '/' ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
      }
      return tag;
    });
    return out;
  }

  /* ---------------- styles: add a date-time variant of an existing cell style ---------------- */
  function Styles(zip) {
    var xml = zip.text('xl/styles.xml'), cache = {}, fmtId = null, changed = false;
    function ensureFmt() {
      if (fmtId != null) return fmtId;
      var code = 'dd-mmm-yyyy hh:mm';
      var existing = /<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="dd-mmm-yyyy hh:mm"/.exec(xml);
      if (existing) return (fmtId = +existing[1]);
      var max = 163;
      xml.replace(/<numFmt\b[^>]*numFmtId="(\d+)"/g, function (m, id) { max = Math.max(max, +id); return m; });
      fmtId = max + 1;
      var tag = '<numFmt numFmtId="' + fmtId + '" formatCode="' + code + '"/>';
      if (/<numFmts\b[^>]*\/>/.test(xml)) xml = xml.replace(/<numFmts\b[^>]*\/>/, '<numFmts count="1">' + tag + '</numFmts>');
      else if (/<numFmts\b/.test(xml)) {
        xml = xml.replace(/<\/numFmts>/, tag + '</numFmts>').replace(/<numFmts\b([^>]*)count="(\d+)"/, function (m, a, n) { return '<numFmts' + a + 'count="' + (+n + 1) + '"'; });
      } else xml = xml.replace(/(<styleSheet\b[^>]*>)/, '$1<numFmts count="1">' + tag + '</numFmts>');
      changed = true;
      return fmtId;
    }
    return {
      dateTime: function (baseS) {
        baseS = +baseS || 0;
        if (cache[baseS] != null) return cache[baseS];
        var id = ensureFmt();
        var m = /<cellXfs\b([^>]*)>([\s\S]*?)<\/cellXfs>/.exec(xml);
        var xfs = m[2].match(/<xf\b[^>]*?(\/>|>[\s\S]*?<\/xf>)/g) || [];
        var base = xfs[baseS] || xfs[0] || '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>';
        if (new RegExp('numFmtId="' + id + '"').test(base)) return (cache[baseS] = baseS); // already our date-time style (re-export)
        var nx = base.replace(/\snumFmtId="\d+"/, '').replace(/\sapplyNumberFormat="\d"/, '').replace(/^<xf\b/, '<xf numFmtId="' + id + '" applyNumberFormat="1"');
        var idx = xfs.length;
        var repl = '<cellXfs' + m[1].replace(/count="\d+"/, 'count="' + (idx + 1) + '"') + '>' + m[2] + nx + '</cellXfs>';
        xml = xml.replace(m[0], function () { return repl; });
        changed = true;
        return (cache[baseS] = idx);
      },
      save: function () { if (changed) zip.put('xl/styles.xml', xml); }
    };
  }

  /* ---------------- sheet patching ---------------- */
  // edits: [{ref:'M6', kind:'str'|'num'|'clear', value, s (style index, optional), styleFrom: fn(oldS) }]
  function patchSheet(xml, edits) {
    if (!edits.length) return xml;
    var byRow = {};
    edits.forEach(function (e) { var p = splitRef(e.ref); e.c = p.c; e.r = p.r; (byRow[p.r] = byRow[p.r] || []).push(e); });
    var maxR = 0, maxC = 0;

    function cellXml(e, oldS) {
      var s = e.s != null ? e.s : (e.styleFrom ? e.styleFrom(oldS) : oldS);
      var sa = s != null && s !== '' ? ' s="' + s + '"' : '';
      if (e.kind === 'num') return '<c r="' + e.ref + '"' + sa + '><v>' + e.value + '</v></c>';
      if (e.kind === 'clear' || e.value === '' || e.value == null) return '<c r="' + e.ref + '"' + sa + '/>';
      return '<c r="' + e.ref + '"' + sa + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(e.value) + '</t></is></c>';
    }
    function patchRow(rowXml, list) {
      var open = /^<row\b[^>]*?(\/?)>/.exec(rowXml);
      var head = open[0].replace(/\s+spans="[^"]*"/, '').replace(/\/>$/, '>');
      var body = open[1] ? '' : rowXml.slice(open[0].length, rowXml.length - '</row>'.length);
      list.forEach(function (e) {
        maxR = Math.max(maxR, e.r); maxC = Math.max(maxC, e.c);
        var re = new RegExp('<c r="' + e.ref + '"(?:\\s[^>]*?)?(?:\\/>|>[\\s\\S]*?<\\/c>)');
        var cur = re.exec(body);
        if (cur) {
          var os = /\ss="(\d+)"/.exec(cur[0]);
          if (/<f[\s>]/.test(cur[0])) return; // never overwrite a formula
          var nc = cellXml(e, os ? os[1] : null);
          body = body.replace(cur[0], function () { return nc; });
          return;
        }
        // insert in column order
        var pos = body.length, m, cre = /<c r="([A-Z]+)\d+"/g;
        while ((m = cre.exec(body))) { if (colIndex(m[1]) > e.c) { pos = m.index; break; } }
        body = body.slice(0, pos) + cellXml(e, null) + body.slice(pos);
      });
      return head + body + '</row>';
    }

    var rows = Object.keys(byRow).map(Number).sort(function (a, b) { return a - b; });
    if (/<sheetData\s*\/>/.test(xml)) xml = xml.replace(/<sheetData\s*\/>/, '<sheetData></sheetData>');
    rows.forEach(function (r) {
      var re = new RegExp('<row r="' + r + '"(?:\\s[^>]*?)?(?:\\/>|>[\\s\\S]*?<\\/row>)');
      var cur = re.exec(xml);
      if (cur) { xml = xml.replace(cur[0], function () { return patchRow(cur[0], byRow[r]); }); return; }
      var nr = patchRow('<row r="' + r + '">' + '</row>', byRow[r]);
      var rre = /<row r="(\d+)"/g, m, at = -1;
      while ((m = rre.exec(xml))) { if (+m[1] > r) { at = m.index; break; } }
      if (at < 0) at = xml.indexOf('</sheetData>');
      xml = xml.slice(0, at) + nr + xml.slice(at);
    });
    // grow the used range if we wrote outside it
    xml = xml.replace(/<dimension ref="([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?"\s*\/>/, function (all, c1, r1, c2, r2) {
      c2 = c2 || c1; r2 = r2 || r1;
      var nc = Math.max(colIndex(c2), maxC), nr = Math.max(+r2, maxR);
      return '<dimension ref="' + c1 + r1 + ':' + colName(nc) + nr + '"/>';
    });
    return xml;
  }

  /* ---------------- locating rows/columns with the parser's reader ---------------- */
  function Locator(XLSX, wb, name) {
    var ws = wb.Sheets[name];
    var X = root.runbookReader(XLSX), g = X.grid(ws);
    var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9#&/]+/g, ' ').trim(); };
    return {
      g: g, val: X.val,
      header: function (labels) { return X.findHeader(g, labels); },
      cols: function (hr) { return (g[hr] || []).map(function (c) { return norm(X.val(c)); }); },
      col: function (hr, label) { return this.cols(hr).indexOf(norm(label)); },
      lastCol: function (hr) { var cs = g[hr] || [], last = -1; for (var i = 0; i < cs.length; i++) if (X.val(cs[i])) last = i; return last; }
    };
  }

  // Returns column index for label, creating a header cell after the last header if missing.
  function ensureCol(loc, hr, label, edits, created) {
    var c = loc.col(hr, label);
    if (c >= 0) return c;
    c = loc.lastCol(hr) + 1 + created.length;
    created.push(label);
    edits.push({ ref: colName(c) + (hr + 1), kind: 'str', value: label, styleFrom: function () { return null; }, headerStyleFromCol: loc.lastCol(hr) });
    return c;
  }

  function sheetNameMatching(names, patterns) {
    for (var p = 0; p < patterns.length; p++) for (var i = 0; i < names.length; i++) if (patterns[p].test(names[i])) return names[i];
    return null;
  }

  /* ---------------- main ---------------- */
  function exportRunbook(XLSX, bytes, R, S) {
    var zip = Zip(XLSX, bytes);
    var paths = sheetPaths(zip);
    var wb = XLSX.read(bytes, { type: 'array', dense: true, cellNF: true, cellStyles: false });
    var names = wb.SheetNames;
    var styles = Styles(zip);
    var summary = [];

    // Resolve header-cell styles lazily from the raw xml (SheetJS mini doesn't keep style indexes).
    function rawStyle(xml, ref) { var m = new RegExp('<c r="' + ref + '"(?:\\s[^>]*?)?\\ss="(\\d+)"').exec(xml); return m ? m[1] : null; }
    function apply(name, edits) {
      if (!edits.length) return;
      var path = paths[name], xml = zip.text(path);
      edits.forEach(function (e) {
        if (e.headerStyleFromCol != null) {
          var hr = splitRef(e.ref).r, s = rawStyle(xml, colName(e.headerStyleFromCol) + hr);
          e.s = s; delete e.styleFrom;
        }
        if (e.dateStyleFromCol != null) {
          var r = splitRef(e.ref).r;
          var base = rawStyle(xml, e.ref) || rawStyle(xml, colName(e.dateStyleFromCol) + r);
          e.s = styles.dateTime(base);
        }
      });
      zip.put(path, patchSheet(xml, edits));
    }
    function dateEdit(ref, iso, styleCol) {
      var v = iso ? serial(iso) : null;
      return v == null ? { ref: ref, kind: 'clear' } : { ref: ref, kind: 'num', value: v, dateStyleFromCol: styleCol };
    }

    /* Cutover tasks */
    var cutName = sheetNameMatching(names, [/cut\s*over/i, /day\s*activit/i]);
    if (cutName) {
      var L = Locator(XLSX, wb, cutName), hr = L.header(['Task ID', 'Description']);
      if (hr >= 0) {
        var edits = [], created = [];
        var cId = L.col(hr, 'Task ID'), cSt = L.col(hr, 'Status'), cAS = L.col(hr, 'Actual Start Date/Time'), cAE = L.col(hr, 'Actual End Date/Time');
        var cNote = ensureCol(L, hr, 'App Notes', edits, created);
        var n = 0;
        for (var r = hr + 1; r < L.g.length; r++) {
          var id = L.val((L.g[r] || [])[cId]);
          var st = id && S.tasks[id];
          if (!st) continue;
          var row = r + 1;
          if (cSt >= 0 && st.status) edits.push({ ref: colName(cSt) + row, kind: 'str', value: STATUS_OUT[st.status] || st.status });
          if (cAS >= 0) edits.push(dateEdit(colName(cAS) + row, st.aStart, cAS));
          if (cAE >= 0) edits.push(dateEdit(colName(cAE) + row, st.aEnd, cAE));
          edits.push({ ref: colName(cNote) + row, kind: 'str', value: st.note || '' });
          n++;
        }
        apply(cutName, edits);
        summary.push(n + ' task(s) updated');
      }
    }

    /* Devices (Run_Plan) */
    var rpName = sheetNameMatching(names, [/run\s*_?\s*plan/i]);
    if (rpName) {
      var D = Locator(XLSX, wb, rpName), dhr = D.header(['Hostname', 'Movement Batch']);
      if (dhr >= 0) {
        var de = [], dc = [];
        var cHost = D.col(dhr, 'Hostname'), cSer = D.col(dhr, 'Device Primary Serial Numbers'), cSn = D.col(dhr, 'SN');
        var cStage = ensureCol(D, dhr, 'Migration Stage', de, dc);
        var cAt = ensureCol(D, dhr, 'Stage Updated', de, dc);
        var cDN = ensureCol(D, dhr, 'App Notes', de, dc);
        var dn = 0;
        for (var dr = dhr + 1; dr < D.g.length; dr++) {
          var rowc = D.g[dr] || [], host = D.val(rowc[cHost]);
          if (!host) continue;
          var ser = D.val(rowc[cSer]);
          var key = root.deviceKey(ser, host, D.val(rowc[cSn]));
          var x = S.dev[key];
          if (!x) continue;
          var stage = x.stage >= 0 ? root.DEVICE_STAGES[x.stage] : '';
          var at = x.stage >= 0 && x.ts ? x.ts[x.stage] : null;
          de.push({ ref: colName(cStage) + (dr + 1), kind: 'str', value: stage });
          de.push(dateEdit(colName(cAt) + (dr + 1), at, cAt));
          de.push({ ref: colName(cDN) + (dr + 1), kind: 'str', value: x.note || '' });
          dn++;
        }
        apply(rpName, de);
        summary.push(dn + ' device(s) updated');
      }
    }

    /* Pre-event checklist */
    var preName = sheetNameMatching(names, [/pre\s*-?\s*event/i]);
    if (preName) {
      var P = Locator(XLSX, wb, preName), phr = P.header(['#', 'Description']);
      if (phr >= 0) {
        var pe = [], cPid = P.col(phr, '#'), cPst = P.col(phr, 'Status'), cPad = P.col(phr, 'Actual Date');
        for (var pr = phr + 1; pr < P.g.length; pr++) {
          var pid = P.val((P.g[pr] || [])[cPid]);
          if (!pid || S.pre[pid] == null) continue;
          if (cPst >= 0) pe.push({ ref: colName(cPst) + (pr + 1), kind: 'str', value: S.pre[pid] });
          if (cPad >= 0) pe.push(dateEdit(colName(cPad) + (pr + 1), S.pre[pid] === 'Closed' ? (S.preAt || {})[pid] : null, cPad));
        }
        apply(preName, pe);
      }
    }

    /* GO / NO-GO */
    var goName = sheetNameMatching(names, [/go\s*-?\s*no\s*-?\s*go/i]);
    if (goName) {
      var G = Locator(XLSX, wb, goName), ghr = G.header(['Sr. No.', 'Activities']);
      if (ghr >= 0) {
        var ge = [], sc = G.col(ghr, 'Sr. No.'), cSign = G.col(ghr, 'SignOff Received'), cDec = G.col(ghr, 'GO/NOGO');
        var i = -1;
        for (var gr = ghr + 1; gr < G.g.length; gr++) {
          var grow = G.g[gr] || [], label = G.val(grow[sc]);
          if (/^\d+$/.test(label)) {
            i++;
            var sg = S.go[i];
            if (cSign >= 0 && sg) ge.push({ ref: colName(cSign) + (gr + 1), kind: 'str', value: sg.signed ? 'Yes – ' + stamp(sg.at) : '' });
          } else if (cDec >= 0 && grow.some(function (c) { return /^decision$/i.test(G.val(c)); }) && S.decision !== undefined) {
            ge.push({ ref: colName(cDec) + (gr + 1), kind: 'str', value: S.decision === 'NOGO' ? 'NO-GO' : (S.decision || '') });
          }
        }
        apply(goName, ge);
      }
    }

    /* Event log as its own sheet */
    writeLogSheet(zip, paths, S.log || []);

    // Ask Excel to recalculate formulas (e.g. Actual Duration) when the file is opened.
    var wbx = zip.text('xl/workbook.xml');
    if (/<calcPr\b/.test(wbx)) {
      wbx = wbx.replace(/<calcPr\b([^>]*?)(\/?)>/, function (m, a, sl) { return '<calcPr' + a.replace(/\sfullCalcOnLoad="[^"]*"/, '') + ' fullCalcOnLoad="1"' + sl + '>'; });
    } else wbx = wbx.replace(/<\/sheets>/, '</sheets><calcPr fullCalcOnLoad="1"/>');
    zip.put('xl/workbook.xml', wbx);
    styles.save();
    summary.push((S.log || []).length + ' log entr' + ((S.log || []).length === 1 ? 'y' : 'ies'));
    return { bytes: zip.out(), summary: summary };
  }

  function writeLogSheet(zip, paths, log) {
    var rows = [['Time', 'Entry', 'By']].concat(log.slice().reverse().map(function (l) { return [stamp(l.t), l.m, l.by || '']; }));
    var body = rows.map(function (r, i) {
      return '<row r="' + (i + 1) + '">' + r.map(function (v, j) {
        return '<c r="' + colName(j) + (i + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
      }).join('') + '</row>';
    }).join('');
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="A1:C' + rows.length + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/></cols>' +
      '<sheetData>' + body + '</sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';

    if (paths[LOG_SHEET]) { zip.put(paths[LOG_SHEET], xml); return; }
    var n = 1;
    while (zip.has('xl/worksheets/sheet' + n + '.xml')) n++;
    var path = 'xl/worksheets/sheet' + n + '.xml';
    zip.put(path, xml);

    var rels = zip.text('xl/_rels/workbook.xml.rels'), rid = 1;
    while (rels.indexOf('Id="rId' + rid + '"') >= 0) rid++;
    zip.put('xl/_rels/workbook.xml.rels', rels.replace('</Relationships>', '<Relationship Id="rId' + rid + '" Type="' + NS_REL + '" Target="worksheets/sheet' + n + '.xml"/></Relationships>'));

    var wb = zip.text('xl/workbook.xml'), sid = 1;
    wb.replace(/<sheet\b[^>]*sheetId="(\d+)"/g, function (m, id) { sid = Math.max(sid, +id + 1); return m; });
    zip.put('xl/workbook.xml', wb.replace('</sheets>', '<sheet name="' + LOG_SHEET + '" sheetId="' + sid + '" r:id="rId' + rid + '"/></sheets>'));

    var ct = zip.text('[Content_Types].xml');
    zip.put('[Content_Types].xml', ct.replace('</Types>', '<Override PartName="/' + path + '" ContentType="' + CT_SHEET + '"/></Types>'));
  }

  root.exportRunbook = exportRunbook;
  root.runbookExportInternals = { patchSheet: patchSheet, serial: serial, colName: colName, colIndex: colIndex };
  if (typeof module !== 'undefined') module.exports = { exportRunbook: exportRunbook, patchSheet: patchSheet };
})(typeof window !== 'undefined' ? window : globalThis);
