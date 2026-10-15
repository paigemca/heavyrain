// ── Tilt controls (mobile) ────────────────────────────────────
var controlMode = 'tilt';
var tiltListenerAttached = false;
var tiltActive = false;
var showPicker = false;

var IS_TOUCH = 'ontouchstart' in window;

var needsTiltPermission = IS_TOUCH &&
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission === 'function' &&
  window.isSecureContext;

var tiltAvailable = IS_TOUCH &&
  typeof DeviceOrientationEvent !== 'undefined' &&
  (typeof DeviceOrientationEvent.requestPermission !== 'function' || window.isSecureContext);

var HINT_TILT  = '<small>tilt left / right to move &nbsp;&bull;&nbsp; tap to jump</small>';
var HINT_ZONES = '<small>tap left / right to move &nbsp;&bull;&nbsp; tap center to jump</small>';
var HINT_KEYS  = '<small>&#8592; &#8594; arrow keys to move &nbsp;&bull;&nbsp; &#8593; or Space to jump</small>';

document.getElementById('tiltDeniedZonesBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  elTiltDeniedModal.style.display = 'none';
  setControlMode('zones');
});

function attachTilt() {
  if (tiltListenerAttached) return;
  tiltListenerAttached = true;
  tiltActive = true;
  window.addEventListener('deviceorientation', function(e) {
    if (!gameActive || gamePaused || controlMode !== 'tilt') return;
    var gamma = e.gamma || 0;
    pressedLeft  = gamma < -5;
    pressedRight = gamma >  5;
  }, { passive: true });
}

function setControlMode(mode) {
  controlMode = mode;
  localStorage.setItem('hrCtrl', mode);
  var btns = elCtrlPicker.querySelectorAll('.ctrl-opt');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].getAttribute('data-mode') === mode);
  }
  elHint.innerHTML = mode === 'tilt' ? HINT_TILT : HINT_ZONES;
  if (mode === 'tilt' && !needsTiltPermission && typeof DeviceOrientationEvent !== 'undefined') {
    attachTilt();
  }
  if (mode === 'zones') { pressedLeft = false; pressedRight = false; }
}

// Pick the default control scheme for this device and show the matching hint
function initControls() {
  if (!IS_TOUCH) {
    elHint.innerHTML = HINT_KEYS;
  } else if (tiltAvailable) {
    showPicker = true;
    elCtrlPicker.style.display = 'flex';
    setControlMode(localStorage.getItem('hrCtrl') || 'tilt');
  } else {
    elHint.innerHTML = HINT_ZONES;
    if (typeof DeviceOrientationEvent !== 'undefined' && !window.isSecureContext) {
      console.warn('[heavyrain] Tilt requires HTTPS. Run: brew install cloudflared && cloudflared tunnel --url http://localhost:8080');
    }
  }
}

function getEffectiveControls() {
  if (!IS_TOUCH) return 'keyboard';
  return controlMode;
}

var pickerBtns = elCtrlPicker.querySelectorAll('.ctrl-opt');
for (var i = 0; i < pickerBtns.length; i++) {
  pickerBtns[i].addEventListener('click', (function(btn) {
    return function(e) { e.stopPropagation(); setControlMode(btn.getAttribute('data-mode')); };
  })(pickerBtns[i]));
}

document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// ── Keyboard controls ────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft'  || e.key === 'a') { pressedLeft  = true;  e.preventDefault(); }
  if (e.key === 'ArrowRight' || e.key === 'd') { pressedRight = true;  e.preventDefault(); }
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === ' ') { jump(); e.preventDefault(); }
  if (e.key === 'Enter' && !gameActive && elGameOver.style.display !== 'flex') tryStartGame();
});
document.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowLeft'  || e.key === 'a') pressedLeft  = false;
  if (e.key === 'ArrowRight' || e.key === 'd') pressedRight = false;
});

// ── Touch controls: tilt active → tap anywhere to jump; fallback → zones ─
var zonePointers = {};
function zoneHasPointer(z) { for (var id in zonePointers) { if (zonePointers[id] === z) return true; } return false; }

document.addEventListener('pointerdown', function(e) {
  if (e.target !== elNameInput && document.activeElement === elNameInput) elNameInput.blur();
  if (e.target.tagName === 'BUTTON') return;
  if (!gameActive) return;
  if (controlMode === 'tilt') { jump(); return; }
  var relX = e.clientX - gaLeft();
  var third = gw() / 3;
  if (relX < third)          { zonePointers[e.pointerId] = 'left';  pressedLeft = true; }
  else if (relX > third * 2) { zonePointers[e.pointerId] = 'right'; pressedRight = true; }
  else                       { zonePointers[e.pointerId] = 'jump';  jump(); }
});
function onZonePointerEnd(e) {
  if (e.target.tagName === 'BUTTON') return;
  var z = zonePointers[e.pointerId];
  delete zonePointers[e.pointerId];
  if (z === 'left')  pressedLeft  = zoneHasPointer('left');
  if (z === 'right') pressedRight = zoneHasPointer('right');
}
document.addEventListener('pointerup',     onZonePointerEnd);
document.addEventListener('pointercancel', onZonePointerEnd);
