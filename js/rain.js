// ── Background rain (CSS-animated, GPU-composited) ───────────
function setupCssRain() {
  for (var i = 0; i < 100; i++) {
    var el      = document.createElement('img');
    var size    = Math.random() < 0.65 ? 8 + Math.floor(Math.random() * 12) : 22 + Math.floor(Math.random() * 24);
    var dur     = 1.6 + Math.random() * 4.8;
    var colored  = i < 10;
    var isStar   = colored && i >= 5;  // slots 5-9 are stars
    var isHeart  = colored && i < 5;   // slots 0-4 are hearts
    var filter   = isStar ? 'brightness(1.15) saturate(1.1)' : '';
    var starSize = isStar ? Math.round(size * 1.6) : isHeart ? Math.round(size * 1.5) : size;

    el.src = isStar ? starSrcs[Math.floor(Math.random() * starSrcs.length)]
           : isHeart ? heartSrc
           : dropSrcs[Math.floor(Math.random() * dropSrcs.length)];
    el.className           = 'bg-rain';
    el.style.width         = starSize + 'px';
    el.style.left          = (Math.random() * 103 - 1).toFixed(1) + '%';
    el.style.opacity       = (0.18 + Math.random() * 0.52).toFixed(2);
    el.style.animationDuration = dur.toFixed(2) + 's';
    el.style.animationDelay    = (-Math.random() * 7).toFixed(2) + 's';
    if (filter) el.style.filter = filter;
    if (colored) coloredRainEls.push(el);

    el.addEventListener('animationiteration', function() {
      if (gamePaused) return;
      var now = Date.now();
      if (now - (splatTimes.get(this) || 0) < 150) return;
      splatTimes.set(this, now);
      var xPct   = parseFloat(this.style.left);
      var splatY = getGroundYPct(xPct) * bgSplatCanvas.height;
      var sz     = parseFloat(this.style.width);
      var splatX = xPct / 100 * bgSplatCanvas.width;
      var img    = dropImages[Math.floor(Math.random() * dropImages.length)];
      bgSplatCtx.save();
      bgSplatCtx.globalAlpha = parseFloat(this.style.opacity) * 0.6;
      if (this.style.filter) bgSplatCtx.filter = this.style.filter;
      if (img && img.complete) bgSplatCtx.drawImage(img, splatX - sz, splatY - sz * 0.2, sz * 2, sz * 0.45);
      bgSplatCtx.restore();
      setTimeout(function(x, y, w, h) {
        bgSplatCtx.clearRect(x - 2, y - 2, w + 4, h + 4);
      }.bind(null, splatX - sz, splatY - sz * 0.2, sz * 2, sz * 0.45), 400);
    }.bind(el));

    gameAreaEl.appendChild(el);
    bgRainEls.push(el);
  }

  for (var j = 0; j < 45; j++) {
    var s    = document.createElement('div');
    var sDur = 0.5 + Math.random() * 1.2;
    s.className                = 'rain-streak';
    s.style.width              = (1 + Math.random() * 2).toFixed(1) + 'px';
    s.style.height             = (12 + Math.floor(Math.random() * 20)) + 'px';
    s.style.left               = (Math.random() * 102 - 1).toFixed(1) + '%';
    s.style.animationDuration  = sDur.toFixed(2) + 's';
    s.style.animationDelay     = (-Math.random() * 3).toFixed(2) + 's';
    gameAreaEl.appendChild(s);
    bgRainEls.push(s);
  }
}

// Canvas for the little splashes where background drops land.
// Must be appended after setupCssRain() so it paints on top of the rain.
var bgSplatCanvas, bgSplatCtx;
function resizeSplatCanvas() { bgSplatCanvas.width = gw(); bgSplatCanvas.height = gh(); }
function setupSplatCanvas() {
  bgSplatCanvas = document.createElement('canvas');
  bgSplatCanvas.id = 'splatCanvas';
  gameAreaEl.appendChild(bgSplatCanvas);
  bgSplatCtx = bgSplatCanvas.getContext('2d');
  resizeSplatCanvas();
  window.addEventListener('resize', resizeSplatCanvas);
}

function updateRainColors() {
  var hide = gameActive;
  coloredRainEls.forEach(function(el) { el.style.display = hide ? 'none' : ''; });
}

// ── Storm intensity (recursive setTimeout — self-correcting) ─
function scheduleStormUpdate() {
  setTimeout(function() {
    if (!gameActive) return;
    var t = Math.min((Date.now() - gameStartTime) / 1000 / 180, 1);
    elStorm.style.opacity = (t * 0.28).toFixed(3);
    scheduleStormUpdate();
  }, 4000);
}
