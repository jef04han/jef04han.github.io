/* Writes CBS app progress back into the original runbook .xlsx.
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

  /* ---------------- CBS mapping ---------------- */
  // Date-time stored by the app as ISO → Excel number; numbers → numeric cells; everything else text.
  function valueEdit(ref, type, value, dateCol) {
    if (value == null || value === '') return { ref: ref, kind: 'clear' };
    if (type === 'date') {
      var v = serial(value);
      return v == null ? { ref: ref, kind: 'str', value: value } : { ref: ref, kind: 'num', value: v, dateStyleFromCol: dateCol };
    }
    if (type === 'num' && /^-?\d+(\.\d+)?$/.test(String(value).trim())) return { ref: ref, kind: 'num', value: +value };
    return { ref: ref, kind: 'str', value: String(value) };
  }

  function exportRunbook(XLSX, bytes, R, S) {
    var C = root.CBS, X = C.makeReader(XLSX);
    var zip = Zip(XLSX, bytes);
    var paths = sheetPaths(zip);
    var wb = XLSX.read(bytes, { type: 'array', dense: true, cellNF: true });
    var styles = Styles(zip);
    var summary = [];

    function rawStyle(xml, ref) { var m = new RegExp('<c r="' + ref + '"(?:\\s[^>]*?)?\\ss="(\\d+)"').exec(xml); return m ? m[1] : null; }
    function apply(name, edits) {
      if (!edits.length) return;
      var path = paths[name], xml = zip.text(path);
      edits.forEach(function (e) {
        if (e.headerStyleFromCol != null) e.s = rawStyle(xml, colName(e.headerStyleFromCol) + splitRef(e.ref).r);
        if (e.dateStyleFromCol != null) {
          var base = rawStyle(xml, e.ref) || rawStyle(xml, colName(e.dateStyleFromCol) + (splitRef(e.ref).r - 1));
          e.s = styles.dateTime(base);
        }
      });
      zip.put(path, patchSheet(xml, edits));
    }
    // Column index for a header label, adding the header after the last one when missing.
    function colFor(t, label, edits) {
      var n = C.norm(label);
      if (t.col[n] != null) return t.col[n];
      var last = -1;
      Object.keys(t.col).forEach(function (k) { last = Math.max(last, t.col[k]); });
      var c = last + 1;
      t.col[n] = c;
      edits.push({ ref: colName(c) + t.hr, kind: 'str', value: label, headerStyleFromCol: last });
      return c;
    }

    /* Cutover tasks */
    var cut = C.readTable(X, wb, { sheet: [/cut\s*over/i, /day\s*activit/i], header: ['Task ID', 'Description'], keyCols: ['Task ID'], sections: true });
    if (cut) {
      var te = [], tn = 0;
      cut.rows.forEach(function (r) {
        var st = S.tasks[r.key];
        if (!st) return;
        var cSt = cut.col[C.norm('Status')], cA = cut.col[C.norm('Actual Start Date/Time')], cE = cut.col[C.norm('Actual End Date/Time')];
        if (cSt != null && st.status) te.push({ ref: colName(cSt) + r._r, kind: 'str', value: C.STATUS_OUT[st.status] || st.status });
        if (cA != null) te.push(valueEdit(colName(cA) + r._r, 'date', st.aStart, cA));
        if (cE != null) te.push(valueEdit(colName(cE) + r._r, 'date', st.aEnd, cE));
        te.push(valueEdit(colName(colFor(cut, 'App Notes', te)) + r._r, 'text', st.note));
        tn++;
      });
      apply(cut.name, te);
      summary.push(tn + ' task(s)');
    }

    /* Devices */
    var scope = C.readTable(X, wb, { sheet: [/^scope\s*_?\s*devices$/i, /^scope$/i, /scope/i], header: ['Hostname', 'Movement Batch'],
      keyCols: ['Record Type', 'Hostname', 'Device Primary Serial Number', 'Device Sub Serial Number'] });
    if (scope) {
      var de = [], dn = 0;
      scope.rows.forEach(function (r) {
        var x = S.dev[r.key];
        if (!x) return;
        var cM = colFor(scope, 'Migration Status', de), cS = colFor(scope, 'Shutdown Status', de);
        if (x.mig) de.push(valueEdit(colName(cM) + r._r, 'text', x.mig));
        if (x.shut) de.push(valueEdit(colName(cS) + r._r, 'text', x.shut));
        var cU = colFor(scope, 'Status Updated', de);
        de.push(valueEdit(colName(cU) + r._r, 'date', x.at, cU));
        if (x.note != null) de.push(valueEdit(colName(colFor(scope, 'App Notes', de)) + r._r, 'text', x.note));
        if (x.cu != null) de.push(valueEdit(colName(colFor(scope, 'Copper Cables', de)) + r._r, 'num', x.cu));
        if (x.fc != null) de.push(valueEdit(colName(colFor(scope, 'FC Cables', de)) + r._r, 'num', x.fc));
        if (x.lbl != null) de.push(valueEdit(colName(colFor(scope, 'Labelled (Y/N)', de)) + r._r, 'text', x.lbl ? 'Y' : 'N'));
        dn++;
      });
      apply(scope.name, de);
      summary.push(dn + ' device(s)');
    }

    /* Trucks and every other tracked sheet */
    var rowsDone = 0;
    C.CONFIG.forEach(function (cfg) {
      var edits = S.sh && S.sh[cfg.id];
      if (!edits || !cfg.fields.length || !Object.keys(edits).length) return;
      var t = C.readTable(X, wb, { sheet: cfg.sheet, header: cfg.header, keyCols: cfg.keyCols, sections: !!cfg.sections });
      if (!t) return;
      var ge = [];
      t.rows.forEach(function (r) {
        var e = edits[r.key];
        if (!e) return;
        cfg.fields.forEach(function (f) {
          var n = C.norm(f.c);
          if (!(n in e)) return;
          var c = t.col[n];
          if (c == null) return;
          ge.push(valueEdit(colName(c) + r._r, f.t, e[n], c));
        });
        rowsDone++;
      });
      apply(t.name, ge);
    });
    if (rowsDone) summary.push(rowsDone + ' checklist / tracker row(s)');

    writeLogSheet(zip, paths, S.log || []);
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
  if (typeof module !== 'undefined') module.exports = { exportRunbook: exportRunbook, patchSheet: patchSheet };
})(typeof window !== 'undefined' ? window : globalThis);
