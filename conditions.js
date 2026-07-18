/* ============================================================
   CCWHEELERS LIVE CONDITIONS
   ------------------------------------------------------------
   CREEK STATUS is now AUTOMATIC: it follows the live NOAA tide.
     - Near high tide  -> "Use Caution"
     - Otherwise       -> "Crossable" (low-tide window)

   TO OVERRIDE (park announces a closure, storm flow, etc.),
   change mode below from 'auto' to 'open', 'caution', or 'closed',
   and set note + updated. Set mode back to 'auto' when done.
   ============================================================ */
var CCW_CREEK = {
  mode: 'auto',
  note: '',
  updated: ''
};
/* ================= no edits needed below ==================== */

document.addEventListener('DOMContentLoaded', function () {
  var CLASSES = { open: 'status-open', closed: 'status-closed', caution: 'status-warning' };
  var ALL = ['status-open', 'status-closed', 'status-warning'];

  function setText(el, text) { if (el) el.textContent = text; }
  function setStatus(el, kind, label) {
    if (!el) return;
    el.textContent = label;
    ALL.forEach(function (c) { el.classList.remove(c); });
    if (CLASSES[kind]) el.classList.add(CLASSES[kind]);
  }

  var els = {
    creekStrip: document.getElementById('creekStatus'),
    creekStripNote: document.getElementById('creekUpdated'),
    creekInline: document.querySelector('[data-cond="creek"]'),
    creekInlineNote: document.querySelector('[data-cond="creek-note"]'),
    creekPageTitle: document.getElementById('creekPageTitle'),
    creekPageSub: document.getElementById('creekPageSub'),
    creekLight: document.getElementById('creekLight'),
    tideStrip: document.getElementById('tideStatus'),
    tideStripNote: document.getElementById('tideDetail'),
    tideInline: document.querySelector('[data-cond="tide"]'),
    tideInlineNote: document.querySelector('[data-cond="tide-note"]')
  };

  function renderCreek(kind, label, shortNote, longNote) {
    setStatus(els.creekStrip, kind, label);
    setText(els.creekStripNote, shortNote);
    setStatus(els.creekInline, kind, label);
    setText(els.creekInlineNote, shortNote);
    if (els.creekPageTitle) els.creekPageTitle.textContent = label;
    if (els.creekPageSub) els.creekPageSub.textContent = longNote + ' Status is an estimate from live NOAA tides; conditions on the beach always win. See our Facebook page for photos when the river is running.';
    if (els.creekLight) {
      els.creekLight.className = 'status-light' +
        (kind === 'caution' ? ' light-warning' : kind === 'closed' ? ' light-closed' : kind === 'open' ? '' : ' light-neutral');
    }
  }

  function autoMode() { return CCW_CREEK.mode === 'auto'; }

  /* ---- Manual override path ---- */
  var MANUAL = {
    open:    { label: 'Open',        long: 'The creek is low and crossable.' },
    caution: { label: 'Use Caution', long: 'Cross carefully and only if you are sure of conditions.' },
    closed:  { label: 'Closed',      long: 'The crossing is closed. Crossing a closed creek is a ticket, no exceptions.' }
  };
  if (!autoMode() && MANUAL[CCW_CREEK.mode]) {
    var m = MANUAL[CCW_CREEK.mode];
    var note = (CCW_CREEK.note ? CCW_CREEK.note + ' · ' : '') + 'Updated ' + (CCW_CREEK.updated || 'recently');
    renderCreek(CCW_CREEK.mode, m.label, note, (CCW_CREEK.note ? CCW_CREEK.note + '. ' : '') + m.long);
  }

  /* ---- Tides (live from NOAA, Port San Luis station 9412110) ---- */
  function tideFallback() {
    setText(els.tideStrip, 'Unavailable');
    setText(els.tideStripNote, 'See the tides page for the schedule');
    setText(els.tideInline, 'Unavailable');
    setText(els.tideInlineNote, 'Tide feed is down right now');
    if (autoMode()) {
      renderCreek('', 'Check On-Site', 'Live estimate unavailable', 'The live tide feed is down, so we cannot estimate the crossing right now. Judge conditions on the beach.');
    }
  }

  function fmtDate(d) {
    var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
    return '' + y + m + day;
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  try {
    var now = new Date();
    var start = new Date(now.getTime() - 24 * 3600 * 1000);
    var end = new Date(now.getTime() + 36 * 3600 * 1000);
    var url = '/api/tides?interval=hilo&begin_date=' + fmtDate(start) + '&end_date=' + fmtDate(end);

    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.predictions || !data.predictions.length) { tideFallback(); return; }
      var events = data.predictions.map(function (p) {
        return { time: new Date(p.t.replace(' ', 'T')), height: parseFloat(p.v), type: p.type };
      });

      /* Current tide height (cosine interpolation between the
         surrounding high/low, the standard tide approximation) */
      var prev = null, next = null;
      for (var i = 0; i < events.length; i++) {
        if (events[i].time > now) { next = events[i]; prev = events[i - 1] || null; break; }
      }
      if (!next) { tideFallback(); return; }
      var kind = next.type === 'H' ? 'High' : 'Low';
      var nextStr = kind + ' ' + fmtTime(next.time) + ' (' + next.height.toFixed(1) + ' ft)';

      if (prev) {
        var frac = (now - prev.time) / (next.time - prev.time);
        var nowHt = prev.height + (next.height - prev.height) * (1 - Math.cos(Math.PI * frac)) / 2;
        var rising = next.height > prev.height;
        setText(els.tideStrip, nowHt.toFixed(1) + ' ft · ' + (rising ? 'Rising' : 'Falling'));
        setText(els.tideStripNote, 'Next: ' + nextStr);
        setText(els.tideInline, nowHt.toFixed(1) + ' ft ' + (rising ? '↑' : '↓'));
        setText(els.tideInlineNote, (rising ? 'Rising' : 'Falling') + ' · Next: ' + nextStr);
      } else {
        setText(els.tideStrip, kind + ' ' + fmtTime(next.time));
        setText(els.tideStripNote, next.height.toFixed(1) + ' ft · Port San Luis');
        setText(els.tideInline, kind + ' Tide ' + fmtTime(next.time));
        setText(els.tideInlineNote, next.height.toFixed(1) + ' ft · NOAA Port San Luis');
      }

      /* Creek estimate from proximity to high tide */
      if (autoMode()) {
        var inHighWindow = false, windowHigh = null;
        events.forEach(function (e) {
          if (e.type !== 'H') return;
          var before = 2.5, after = 2.0;                          // hours around a high tide
          if (e.height >= 5.5) { before += 0.5; after += 0.5; }   // big highs get a wider window
          var from = e.time.getTime() - before * 3600 * 1000;
          var to = e.time.getTime() + after * 3600 * 1000;
          if (now.getTime() >= from && now.getTime() <= to) { inHighWindow = true; windowHigh = e; }
        });

        if (inHighWindow) {
          var big = windowHigh.height >= 5.5;
          renderCreek('caution', 'Use Caution',
            (big ? 'Big high tide' : 'High tide window') + ' · verify at the beach',
            'We are near ' + (big ? 'a big ' : '') + 'high tide (' + windowHigh.height.toFixed(1) + ' ft at ' + fmtTime(windowHigh.time) + '), when the creek runs deepest. Wait for the tide to drop, or check conditions in person before crossing.');
        } else {
          renderCreek('open', 'Crossable',
            'Low-tide window (est.) · as of ' + fmtTime(now),
            'The tide is in its low window, when the creek is normally at its shallowest and generally crossable. This is a live estimate, not a guarantee.');
        }
      }
    }).catch(tideFallback);
  } catch (e) { tideFallback(); }

  /* ---- Weather & wind (Open-Meteo, live at the dunes) ---- */
  var wEl = document.getElementById('weatherStatus');
  var wDet = document.getElementById('weatherDetail');
  if (wEl) {
    var DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    fetch('https://api.open-meteo.com/v1/forecast?latitude=35.0894&longitude=-120.6296' +
      '&current=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
      '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Los_Angeles')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var c = d && d.current;
        if (!c) throw new Error('no data');
        var dir = DIRS[Math.round(((c.wind_direction_10m % 360) + 360) % 360 / 45) % 8];
        var wind = Math.round(c.wind_speed_10m);
        var gusts = Math.round(c.wind_gusts_10m);
        wEl.textContent = Math.round(c.temperature_2m) + '° · ' + dir + ' ' + wind + ' mph';
        var det = gusts > wind + 4 ? 'Gusts to ' + gusts + ' mph' : 'Feels like ' + Math.round(c.apparent_temperature) + '°';
        if (gusts >= 30) {
          wEl.classList.add('status-warning');
          det = 'Gusts to ' + gusts + ' mph · sandblasting likely';
        }
        wDet.textContent = det;
      })
      .catch(function () {
        wEl.textContent = 'Unavailable';
        wDet.textContent = 'Weather feed is down right now';
      });
  }

  /* ---- Gas prices (our /api/gas function -> AAA SLO county) ---- */
  var gEl = document.getElementById('gasStatus');
  var gDet = document.getElementById('gasDetail');
  if (gEl) {
    fetch('/api/gas')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.regular) throw new Error(d && d.error || 'no data');
        gEl.textContent = '$' + d.regular.toFixed(2) + ' Regular';
        gDet.textContent = 'Diesel $' + d.diesel.toFixed(2) + ' · SLO county avg (AAA)';
      })
      .catch(function () {
        gEl.textContent = 'Unavailable';
        gDet.textContent = 'Tap for current AAA prices';
      });
  }

  /* ---- Latest news band (homepage) ---- */
  var nb = document.getElementById('latestNews');
  if (nb && window.CCW_NEWS && window.CCW_NEWS.length) {
    var TAGS = { park: 'Park News', event: 'Event', community: 'Community' };
    var items = window.CCW_NEWS.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; }).slice(0, 3);
    nb.innerHTML = items.map(function (n) {
      var d = new Date(n.date + 'T12:00:00');
      var ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return '<a class="nb-item" href="news.html"><div class="nb-meta">' + (TAGS[n.tag] || 'News') +
        '<span>' + ds + '</span></div><h3>' + n.title + '</h3></a>';
    }).join('');
  }
});
