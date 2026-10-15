// ── Constants ────────────────────────────────────────────────
var CHAR_MAX    = 0.90, CHAR_ACCEL = 0.11, CHAR_FRIC = 0.75;
var GRAVITY     = 0.75, JUMP_VEL   = -16;
var GROUND_HOME = 0.84, GROUND_GAME = 0.94, HILL_AMP = 0.04;
var MAX_LIVES   = 3,    HEART_CHANCE = 1 / 40;
var CATCH_X     = 0.6,  CATCH_Y    = 0.9;
var FRAME_MS    = 1000 / 60;  // target 60 fps on ProMotion displays
var MAX_DT      = 4;          // after a stall / tab switch, advance at most 4 frames' worth
var STORM_UPDATE_MS = 4000;   // storm opacity has a 3s CSS transition, so small steps are enough

// ── Supabase ─────────────────────────────────────────────────
// __SUPA_KEY__ is replaced at deploy time by .github/workflows/deploy.yml — never commit a real key
var SUPA_URL  = 'https://xalsozgsdssqxzwikrdm.supabase.co';
var SUPA_KEY  = '__SUPA_KEY__';
