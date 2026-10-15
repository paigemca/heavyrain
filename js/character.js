// ── Character movement + main loop ───────────────────────────
function getGroundYPct(x) { return groundY - Math.sin((x / 100) * Math.PI) * HILL_AMP; }

function updateCharDimensions() {
  charW = charEl.offsetWidth  || 100;
  charH = charEl.offsetHeight || 200;
  refreshCloudWidth();
  refreshTitleSize();
}

function refreshTitleSize() {
  var scale = Math.min(gw() / 430, 1);
  var h = document.querySelector('#title img[alt="heavy"]');
  var r = document.querySelector('#title img[alt="rain"]');
  if (h) h.style.height = Math.round(66 * scale) + 'px';
  if (r) r.style.height = Math.round(55 * scale) + 'px';
}

function refreshCloudWidth() {
  elCloudCont.style.width = Math.round(gw() * 0.69) + 'px';
  elCloudCont.style.maxWidth = 'none';
}

function updateCloudRect() {
  cloudRect = elCloudImg.getBoundingClientRect();
}

function jump() {
  if (jumpsLeft > 0) { velY = JUMP_VEL; isOnGround = false; jumpsLeft--; }
}

function updateChar() {
  var ww = gw(), wh = gh();
  var cx = Math.round((charX / 100) * ww - charW / 2);
  var cy = Math.round(getGroundYPct(charX) * wh - charH - offsetY);
  charEl.style.transform = 'translate(' + cx + 'px,' + cy + 'px)' + (facingRight ? '' : ' scaleX(-1)');
}

// Frame-rate cap so game speed is consistent on 120Hz ProMotion displays
var lastFrameTime = 0;
function loop(ts) {
  if (ts - lastFrameTime < FRAME_MS * 0.9) { requestAnimationFrame(loop); return; }
  lastFrameTime = ts;

  if (!gamePaused) {
    if (pressedLeft)       charVelX = Math.max(charVelX - CHAR_ACCEL, -CHAR_MAX);
    else if (pressedRight) charVelX = Math.min(charVelX + CHAR_ACCEL,  CHAR_MAX);
    else                   charVelX *= CHAR_FRIC;
    if (Math.abs(charVelX) > 0.01) charX += charVelX;
    if (charVelX < -0.01) facingRight = false;
    if (charVelX >  0.01) facingRight = true;
  }
  charX = Math.max(5, Math.min(95, charX));
  if (!gamePaused && !isOnGround) {
    velY += GRAVITY; offsetY -= velY;
    if (offsetY <= 0) { offsetY = 0; velY = 0; isOnGround = true; jumpsLeft = 2; }
  }
  updateChar();
  if (gameActive && !gamePaused) updateDrops();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', function() { updateCharDimensions(); updateCloudRect(); });
charEl.addEventListener('load', function() { updateCharDimensions(); updateCloudRect(); });
