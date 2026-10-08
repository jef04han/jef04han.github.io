/* Upload screen + on-device storage. The runbook .xlsx is read locally (nothing leaves the device);
   the parsed runbook and the original file are kept in IndexedDB so the app reopens where it left off
   and can write progress back into the original workbook on export. */
(function () {
  'use strict';

  var LEGACY_KEY = 'dcshifting.runbook.v1';   // localStorage copy used by the first release
  var DB = 'dcshifting', STORE = 'kv';

  /* ---------------- IndexedDB (falls back to localStorage) ---------------- */
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no indexedDB'));
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(STORE, mode), st = t.objectStore(STORE), req = fn(st);
        t.oncomplete = function () { resolve(req && req.result); };
        t.onerror = t.onabort = function () { reject(t.error || new Error('storage failed')); };
      });
    });
  }
  function idbGet(k) { return tx('readonly', function (s) { return s.get(k); }); }
  function idbSet(k, v) { return tx('readwrite', function (s) { return s.put(v, k); }); }
  function idbDel(k) { return tx('readwrite', function (s) { return s.delete(k); }); }

  function persist() {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var rd = new FileReader();
      rd.onload = function () { resolve(rd.result); };
      rd.onerror = function () { reject(new Error('Could not open that file.')); };
      rd.readAsArrayBuffer(file);
    });
  }
  function parse(buf, name) {
    if (!/\.xls[xm]$/i.test(name)) throw new Error('Please choose the runbook .xlsx file.');
    var wb;
    try { wb = XLSX.read(new Uint8Array(buf), { type: 'array', dense: true, cellNF: true, cellDates: false }); }
    catch (e) { throw new Error('That file could not be read as an Excel workbook.'); }
    return window.parseRunbook(XLSX, wb, name);
  }

  // Parse a File into the runbook model and keep it (and the original bytes) on this device.
  window.loadRunbookFile = function (file) {
    if (!/\.xls[xm]$/i.test(file.name)) return Promise.reject(new Error('Please choose the runbook .xlsx file.'));
    return readFile(file).then(function (buf) {
      var R = parse(buf, file.name);
      var meta = { at: new Date().toISOString(), size: file.size };
      return idbSet('runbook', { meta: meta, R: R })
        .then(function () { return idbSet('file', { name: file.name, bytes: buf }); })
        .then(function () {
          try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
          meta.saved = true;
        }, function () {
          try { localStorage.setItem(LEGACY_KEY, JSON.stringify({ meta: meta, R: R })); meta.saved = true; }
          catch (e) { meta.saved = false; }
        })
        .then(function () { persist(); return { R: R, meta: meta }; });
    });
  };

  // Supply the original workbook for a runbook that was loaded before files were kept.
  window.attachOriginalFile = function (file, R) {
    return readFile(file).then(function (buf) {
      var R2 = parse(buf, file.name);
      var ids = {}, same = 0;
      R.tasks.forEach(function (t) { ids[t.id] = 1; });
      R2.tasks.forEach(function (t) { if (ids[t.id]) same++; });
      if (same < Math.min(R.tasks.length, R2.tasks.length) * 0.5) throw new Error('That looks like a different runbook — pick the one you loaded.');
      return idbSet('file', { name: file.name, bytes: buf });
    });
  };

  window.exportUpdatedExcel = function (R, S) {
    return idbGet('file').catch(function () { return null; }).then(function (f) {
      if (!f || !f.bytes) { var e = new Error('Original file missing'); e.needOriginal = true; throw e; }
      var res = window.exportRunbook(XLSX, new Uint8Array(f.bytes), R, S);
      var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
      var base = (f.name || R.source || 'runbook').replace(/\.xls[xm]$/i, '').replace(/_updated_\d{8}-\d{4}$/, '');
      var name = base + '_updated_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.xlsx';
      var blob = new Blob([res.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      return { blob: blob, name: name, summary: res.summary };
    });
  };

  window.forgetRunbook = function () {
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
    return Promise.all([idbDel('runbook'), idbDel('file')]).catch(function () {});
  };

  function stored() {
    return idbGet('runbook').catch(function () { return null; }).then(function (o) {
      if (o && o.R && o.R.tasks) return o;
      var legacy = null;
      try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch (e) { /* ignore */ }
      if (!legacy || !legacy.R || !legacy.R.tasks) return null;
      // move the first release's copy into IndexedDB
      return idbSet('runbook', legacy).then(function () {
        try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
        return legacy;
      }, function () { return legacy; });
    });
  }

  /* ---------------- upload screen ---------------- */
  function start(o) {
    document.getElementById('upload').hidden = true;
    document.getElementById('app').hidden = false;
    window.startRunbookApp(o.R, o.meta);
  }

  var box = document.getElementById('upload');
  var input = document.getElementById('file');
  var msg = document.getElementById('uploadMsg');
  var drop = document.getElementById('drop');

  function handle(file) {
    if (!file) return;
    msg.className = 'up-msg';
    msg.textContent = 'Reading ' + file.name + ' on this device…';
    drop.classList.add('busy');
    // Let the message paint before the (synchronous) parse.
    setTimeout(function () {
      window.loadRunbookFile(file).then(function (o) {
        if (!o.meta.saved) alert('The runbook loaded, but this browser would not store it (private mode or storage full). You will need to upload it again next time.');
        start(o);
      }, function (err) {
        drop.classList.remove('busy');
        msg.className = 'up-msg err';
        msg.textContent = err.message || 'Could not read that file.';
      });
    }, 30);
  }

  input.addEventListener('change', function () { handle(input.files[0]); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { handle(e.dataTransfer.files[0]); });

  stored().then(function (o) {
    if (o) { persist(); start(o); } else box.hidden = false;
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
