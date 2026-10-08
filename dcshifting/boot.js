/* Upload screen: reads the runbook .xlsx locally (nothing leaves the device), stores the parsed model and starts the app. */
(function () {
  'use strict';

  var STORE = 'dcshifting.runbook.v1';

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var rd = new FileReader();
      rd.onload = function () { resolve(rd.result); };
      rd.onerror = function () { reject(new Error('Could not open that file.')); };
      rd.readAsArrayBuffer(file);
    });
  }

  // Parse a File into the runbook model and keep it in this browser.
  window.loadRunbookFile = function (file) {
    if (!/\.xls[xm]$/i.test(file.name)) return Promise.reject(new Error('Please choose the runbook .xlsx file.'));
    return readFile(file).then(function (buf) {
      var wb;
      try { wb = XLSX.read(new Uint8Array(buf), { type: 'array', dense: true, cellNF: true, cellDates: false }); }
      catch (e) { throw new Error('That file could not be read as an Excel workbook.'); }
      var R = window.parseRunbook(XLSX, wb, file.name);
      var meta = { at: new Date().toISOString(), size: file.size };
      var saved = true;
      try { localStorage.setItem(STORE, JSON.stringify({ meta: meta, R: R })); }
      catch (e) { saved = false; }
      meta.saved = saved;
      return { R: R, meta: meta };
    });
  };
  window.forgetRunbook = function () { try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ } };

  function stored() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE) || 'null');
      return o && o.R && o.R.tasks ? o : null;
    } catch (e) { return null; }
  }

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

  var o = stored();
  if (o) start(o); else box.hidden = false;

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
