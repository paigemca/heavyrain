// ── Game logic ───────────────────────────────────────────────
function renderHighScore() {
  var best = parseInt(localStorage.getItem('hrHighScore') || '0');
  elHighScore.textContent = best > 0 ? 'personal best: ' + best : '';
}

elPauseBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  gamePaused = !gamePaused;
  this.innerHTML = gamePaused ? '&#9654;' : '&#9646;&#9646;';
  var ps = gamePaused ? 'paused' : 'running';
  bgRainEls.forEach(function(el) { el.style.animationPlayState = ps; });
});

var flashTimer = 0;
function triggerFlash() {
  clearTimeout(flashTimer);
  elFlash.style.opacity = '0.85';
  flashTimer = setTimeout(function() {
    elFlash.style.opacity = '0';
    setTimeout(function() {
      elFlash.style.opacity = '0.35';
      setTimeout(function() { elFlash.style.opacity = '0'; }, 90);
    }, 60);
  }, 70);
}

function missedDrop() {
  lives--;
  if (elLives.lastChild) elLives.removeChild(elLives.lastChild);
  triggerFlash();
  if (lives <= 0) endGame();
}

function endGame() {
  gameActive = false;
  gamePaused = false;
  elPauseBtn.style.display   = 'none';
  elPauseBtn.innerHTML       = '&#9646;&#9646;';
  elFinalScore.textContent   = 'you caught ' + gameScore + ' stars';
  var prev = parseInt(localStorage.getItem('hrHighScore') || '0');
  var best = Math.max(prev, gameScore);
  localStorage.setItem('hrHighScore', best);
  elBestScore.textContent = best > gameScore
    ? 'personal best: ' + best + ' stars'
    : (gameScore > 0 ? 'new best!' : '');
  elNameWrap.style.display  = 'none';
  elHighScore.style.display = 'none';
  elLeaderBtn.style.display = 'none';
  elScore.style.display    = 'none';
  elSubmitMsg.textContent = '';
  elGameOver.style.display  = 'flex';
  document.getElementById('audioBtn').style.display = '';
  logMetric('game_over', gameScore);
  autoSubmitScore(gameScore, gameScore > prev);
}

document.getElementById('playAgain').addEventListener('click', function(e) {
  e.stopPropagation();
  elGameOver.style.display = 'none';
  elScore.style.display    = 'none';
  elLives.style.display    = 'none';
  gameActive  = false;
  gamePaused  = false;
  groundY     = GROUND_HOME;
  gameScore   = 0;
  charVelX    = 0;
  velY = 0; offsetY = 0; isOnGround = true; jumpsLeft = 2;
  elScoreNum.textContent     = '0';
  elStorm.style.opacity      = '0';
  elPauseBtn.innerHTML       = '&#9646;&#9646;';
  elPauseBtn.style.display   = 'none';
  activeDrops.forEach(function(d) { d.el.remove(); });
  activeDrops = [];
  bgRainEls.forEach(function(el) { el.style.animationPlayState = 'running'; });
  elHighScore.style.display = '';
  startGame();
});

function fadeOutTitle() {
  var t = document.getElementById('title');
  t.style.opacity = '0';
  setTimeout(function() { t.style.display = 'none'; }, 420);
}

function animateCloudToTop() {
  var container = elCloudCont;
  var img       = elCloudImg;
  var ratio     = img.naturalHeight / img.naturalWidth;
  var newW      = gw() * 1.15;
  var targetTop = gh() * 0.10 - newW * ratio;
  container.style.width    = Math.round(gw() * 1.15) + 'px';
  container.style.maxWidth = 'none';
  container.style.top      = Math.round(targetTop) + 'px';
  setTimeout(updateCloudRect, 750);  // refresh after CSS transition
}

function startGame() {
  if (gameActive) return;
  gameActive    = true;
  gameStartTime = Date.now();
  groundY       = GROUND_GAME;
  lives         = MAX_LIVES;
  gameScore     = 0;
  elScore.style.display    = 'flex';
  elHint.style.display       = 'none';
  if (showPicker) elCtrlPicker.style.display = 'none';
  elHighScore.style.display  = 'none';
  elNameWrap.style.display = 'none';
  elStartBtn.style.display = 'none';
  elLeaderBtn.style.display = 'none';
  elScoreNum.textContent   = '0';
  elGameOver.style.display = 'none';
  elPauseBtn.style.display = 'flex';
  document.getElementById('audioBtn').style.display = 'none';
  elLives.innerHTML = '';
  elLives.style.display = 'flex';
  for (var i = 0; i < MAX_LIVES; i++) {
    var li = document.createElement('img');
    li.src = heartSrc;
    elLives.appendChild(li);
  }
  logMetric('game_started', null);
  updateRainColors();
  fadeOutTitle();
  animateCloudToTop();
  spawnDrop();
  scheduleDrop();
  scheduleStormUpdate();
}

// Checks the alias, asks for iOS motion permission if needed, then starts
function tryStartGame() {
  var alias = playerAlias.trim();
  var errEl = elNameError;
  if (!alias) {
    errEl.textContent = 'please enter an alias first';
    elNameInput.focus();
    return;
  }
  errEl.textContent = '';
  if (needsTiltPermission && controlMode === 'tilt' && !tiltActive) {
    DeviceOrientationEvent.requestPermission().then(function(s) {
      if (s === 'granted') {
        attachTilt();
        localStorage.setItem('hrTiltGranted', '1');
        startGame();
      } else {
        localStorage.removeItem('hrTiltGranted');
        elTiltDeniedModal.style.display = 'flex';
      }
    }).catch(function() {
      localStorage.removeItem('hrTiltGranted');
      elTiltDeniedModal.style.display = 'flex';
    });
  } else {
    startGame();
  }
}

elStartBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  tryStartGame();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !gameActive && elGameOver.style.display !== 'flex') {
    tryStartGame();
  }
});

// ── Falling stars / hearts ───────────────────────────────────
function scheduleDrop() {
  if (!gameActive) return;
  if (gamePaused) { setTimeout(scheduleDrop, 200); return; }
  var elapsed = (Date.now() - gameStartTime) / 1000;
  var base    = Math.max(250, 1200 - elapsed * 14);
  setTimeout(function() { spawnDrop(); scheduleDrop(); }, base + Math.random() * base * 0.3);
}

var COLLECT_TYPES = [
  { type: 'gold', src: 'heart', filter: '' },
  { type: 'star', src: 'star', filter: 'brightness(1.15) saturate(1.1)' }
];

function spawnDrop() {
  if (!cloudRect) updateCloudRect();
  var cr   = cloudRect;
  var size = 22 + Math.floor(Math.random() * 16);
  var sf   = (size - 22) / 16;
  var spd  = (3.2 - sf * 1.8) + Math.min(gameScore * 0.03, 2.5) + Math.random() * 0.5;
  var x    = cr.left + cr.width * 0.15 + Math.random() * cr.width * 0.70;
  var y    = cr.bottom - 10;
  var type  = Math.random() < GOLD_CHANCE ? COLLECT_TYPES[0] : COLLECT_TYPES[1];
  var srcs  = type.src === 'star' ? starSrcs : (type.src === 'heart' ? null : dropSrcs);
  if (type.src === 'star')  size = Math.round(size * 1.6);
  if (type.src === 'heart') size = Math.round(size * 1.5);
  var el    = document.createElement('img');
  el.src    = type.src === 'heart' ? heartSrc : srcs[Math.floor(Math.random() * srcs.length)];
  el.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:auto;'
    + 'pointer-events:none;z-index:5;opacity:0.9;will-change:transform;'
    + (type.filter ? 'filter:' + type.filter + ';' : '')
    + 'transform:translate(' + (x - size / 2) + 'px,' + y + 'px);';
  gameAreaEl.appendChild(el);
  activeDrops.push({ el: el, x: x, y: y, spd: spd, size: size, type: type.type });
}

function updateDrops() {
  var wh  = gh(), ww = gw();
  var cx  = (charX / 100) * ww;
  var cb  = getGroundYPct(charX) * wh - offsetY;
  var cl  = cx - charW * CATCH_X, cr2 = cx + charW * CATCH_X, ct = cb - charH * CATCH_Y;

  activeDrops = activeDrops.filter(function(d) {
    d.y += d.spd;
    d.el.style.transform = 'translate(' + (d.x - d.size * 0.5) + 'px,' + d.y + 'px)';

    if (d.y + d.size * 0.5 >= getGroundYPct((d.x / ww) * 100) * wh) {
      d.el.remove();
      if (d.type === 'star') missedDrop();
      return false;
    }

    var dl = d.x - d.size * 0.5, dr = d.x + d.size * 0.5, db = d.y + d.size;
    if (dr > cl && dl < cr2 && db > ct && d.y < cb) {
      if (d.type === 'gold') {
        lives++;
        var li = document.createElement('img');
        li.src = heartSrc;
        elLives.appendChild(li);
      } else {
        gameScore++;
        elScoreNum.textContent = gameScore;
      }
      d.el.style.transition = 'opacity 0.15s';
      d.el.style.opacity    = '0';
      setTimeout(function(el) { el.remove(); }.bind(null, d.el), 160);
      return false;
    }
    return true;
  });
}
