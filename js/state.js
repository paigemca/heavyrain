// ── Cached DOM refs ──────────────────────────────────────────
var charEl       = document.getElementById('character');
var gameAreaEl   = document.getElementById('gameArea');

// #gameArea size, re-measured on resize rather than every frame
var gameW = 0, gameH = 0;
function measureGameArea() { gameW = gameAreaEl.offsetWidth; gameH = gameAreaEl.offsetHeight; }
measureGameArea();
window.addEventListener('resize', measureGameArea);  // registered first, so other resize handlers see the new size
function gw() { return gameW; }
function gh() { return gameH; }
function gaLeft() { return gameAreaEl.getBoundingClientRect().left; }
var elPauseBtn   = document.getElementById('pauseBtn');
var elGameOver   = document.getElementById('gameOver');
var elLives      = document.getElementById('lives');
var elScore      = document.getElementById('score');
var elScoreNum   = document.getElementById('scoreNum');
var elHint       = document.getElementById('hint');
var elFlash      = document.getElementById('flash');
var elStorm      = document.getElementById('stormOverlay');
var elFinalScore  = document.getElementById('finalScore');
var elBestScore   = document.getElementById('bestScore');
var elSubmitMsg   = document.getElementById('submitMsg');
var elNameWrap    = document.getElementById('nameWrap');
var elNameInput   = document.getElementById('nameInput');
var elNameError   = document.getElementById('nameError');
var elStartBtn    = document.getElementById('startBtn');
var elHighScore   = document.getElementById('highScore');
var elLeaderPanel = document.getElementById('leaderboardPanel');
var elLeaderList  = document.getElementById('leaderboardList');
var elLeaderBtn   = document.getElementById('leaderboardBtn');
var elCloudImg    = document.getElementById('cloud');
var elCloudCont   = document.getElementById('cloudContainer');
var elCtrlPicker  = document.getElementById('ctrlPicker');
var elTiltDeniedModal = document.getElementById('tiltDeniedModal');
var elTitle       = document.getElementById('title');
var elPlayAgain   = document.getElementById('playAgain');
var elAudioBtn    = document.getElementById('audioBtn');
var elAudioPanel  = document.getElementById('audioPanel');
var elSidebarList = document.getElementById('sidebarList');

// ── Sprite images (hidden <img>s in heavyrain.html) ──────────
var dropSrcs   = [0,1,2,3,4].map(function(i) { return document.getElementById('drop'+i).src; });
var dropImages = [0,1,2,3,4].map(function(i) { return document.getElementById('drop'+i); });
var starSrcs   = [0,1,2,3].map(function(i) { return document.getElementById('star'+i).src; });
var heartSrc   = document.getElementById('heart').src;

// ── Character state ──────────────────────────────────────────
var charX     = 50, charVelX = 0, facingRight = true;
var pressedLeft = false, pressedRight = false;
var velY      = 0, offsetY = 0, isOnGround = true, jumpsLeft = 2;
var groundY   = GROUND_HOME;
var charW     = 100, charH = 200;  // cached dimensions
var activeDrops = [], bgRainEls = [], coloredRainEls = [];
var cloudRect  = null;  // cached cloud bounding rect
var splatTimes = new WeakMap();  // rate-limits splat events per element

// ── Game state ───────────────────────────────────────────────
var gameActive = false, gamePaused = false, gameScore = 0, lives = MAX_LIVES;
var gameTime   = 0;                  // ms of unpaused play this game; drives difficulty, spawning, storm
var nextDropAt = 0, nextStormAt = 0; // gameTime of the next drop spawn / storm update
