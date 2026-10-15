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
  elAudioBtn.style.display  = '';
  logMetric('game_over', gameScore);
  autoSubmitScore(gameScore, gameScore > prev);
}

elPlayAgain.addEventListener('click', function(e) {
  e.stopPropagation();
  startGame();
});

function fadeOutTitle() {
  elTitle.style.opacity = '0';
  setTimeout(function() { elTitle.style.display = 'none'; }, 420);
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

// Clears everything left over from a previous game (character motion, drops, storm, pause)
function resetGame() {
  gamePaused = false;
  gameScore  = 0;
  lives      = MAX_LIVES;
  charVelX   = 0;
  velY = 0; offsetY = 0; isOnGround = true; jumpsLeft = 2;
  activeDrops.forEach(function(d) { d.el.remove(); });
  activeDrops = [];
  elScoreNum.textContent = '0';
  elStorm.style.opacity  = '0';
  elPauseBtn.innerHTML   = '&#9646;&#9646;';
  bgRainEls.forEach(function(el) { el.style.animationPlayState = 'running'; });
}

function startGame() {
  if (gameActive) return;
  resetGame();
  gameActive    = true;
  gameStartTime = Date.now();
  groundY       = GROUND_GAME;
  elScore.style.display    = 'flex';
  elHint.style.display       = 'none';
  if (showPicker) elCtrlPicker.style.display = 'none';
  elHighScore.style.display  = 'none';
  elNameWrap.style.display = 'none';
  elStartBtn.style.display = 'none';
  elLeaderBtn.style.display = 'none';
  elGameOver.style.display = 'none';
  elPauseBtn.style.display = 'flex';
  elAudioBtn.style.display = 'none';
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
        startGame();
      } else {
        elTiltDeniedModal.style.display = 'flex';
      }
    }).catch(function() {
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

// ── Falling stars / hearts ───────────────────────────────────
function scheduleDrop() {
  if (!gameActive) return;
  if (gamePaused) { setTimeout(scheduleDrop, 200); return; }
  var elapsed = (Date.now() - gameStartTime) / 1000;
  var base    = Math.max(250, 1200 - elapsed * 14);
  setTimeout(function() { spawnDrop(); scheduleDrop(); }, base + Math.random() * base * 0.3);
}

// Stars score a point (and cost a life if missed); hearts give an extra life
// Each drop gets the CSS classes "falling <type>"
var COLLECT_TYPES = {
  heart: { scale: 1.5 },
  star:  { scale: 1.6 }
};

function spawnDrop() {
  if (!cloudRect) updateCloudRect();
  var cr   = cloudRect;
  var size = 22 + Math.floor(Math.random() * 16);
  var sf   = (size - 22) / 16;
  var spd  = (3.2 - sf * 1.8) + Math.min(gameScore * 0.03, 2.5) + Math.random() * 0.5;
  var x    = cr.left + cr.width * 0.15 + Math.random() * cr.width * 0.70;
  var y    = cr.bottom - 10;
  var type = Math.random() < HEART_CHANCE ? 'heart' : 'star';
  size = Math.round(size * COLLECT_TYPES[type].scale);
  var el    = document.createElement('img');
  el.src    = type === 'heart' ? heartSrc : starSrcs[Math.floor(Math.random() * starSrcs.length)];
  el.className       = 'falling ' + type;
  el.style.width     = size + 'px';
  el.style.transform = 'translate(' + (x - size / 2) + 'px,' + y + 'px)';
  gameAreaEl.appendChild(el);
  activeDrops.push({ el: el, x: x, y: y, spd: spd, size: size, type: type });
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
      if (d.type === 'heart') {
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
