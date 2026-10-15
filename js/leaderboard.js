// ── Leaderboard + metrics (Supabase) ─────────────────────────
var playerAlias = localStorage.getItem('hrAlias') || '';

function supaHeaders(withContent) {
  var h = { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY };
  if (withContent) h['Content-Type'] = 'application/json';
  return h;
}

function logMetric(event, score) {
  var alias = playerAlias.trim() || null;
  fetch(SUPA_URL + '/rest/v1/metrics', {
    method: 'POST',
    headers: supaHeaders(true),
    body: JSON.stringify({ event: event, alias: alias, score: score || null, controls: getEffectiveControls() })
  }).catch(function() {});  // silent fail — never blocks gameplay
}

function autoSubmitScore(score, isNewBest) {
  var alias = playerAlias.trim();
  if (!alias || score <= 0) return;
  var msg = elSubmitMsg;
  fetch(SUPA_URL + '/rest/v1/rpc/upsert_high_score', {
    method: 'POST',
    headers: supaHeaders(true),
    body: JSON.stringify({ p_alias: alias, p_score: score })
  }).then(function(r) {
    if (r.ok) {
      if (isNewBest) msg.textContent = 'new high score saved for "' + alias + '"!';
      fetchLeaderboard();
    } else {
      r.text().then(function(t) { msg.textContent = 'error: ' + t.substring(0, 80); });
    }
  }).catch(function() { msg.textContent = 'network error — check connection'; });
}

// Aliases come from other players — set them as text, never as HTML
function renderLeaderboardRows(listEl, rows) {
  listEl.textContent = '';
  rows.forEach(function(row, i) {
    var li = document.createElement('li');
    if (row.alias === playerAlias) li.className = 'me';
    [i + 1, row.alias, row.score].forEach(function(val, col) {
      var span = document.createElement('span');
      if (col === 0) span.className = 'rank';
      span.textContent = val;
      li.appendChild(span);
    });
    listEl.appendChild(li);
  });
}

function leaderboardMessage(text) {
  return '<li class="lb-msg">' + text + '</li>';
}

function fetchLeaderboard() {
  var list = elLeaderList;
  var sidebar = elSidebarList;
  list.innerHTML = sidebar.innerHTML = leaderboardMessage('loading…');
  fetch(SUPA_URL + '/rest/v1/leaderboard?select=alias,score&order=score.desc&limit=100', {
    headers: supaHeaders(false)
  }).then(function(r) { return r.json(); })
    .then(function(rows) {
      if (!rows || !rows.length) {
        list.innerHTML = sidebar.innerHTML = leaderboardMessage('no scores yet — be first!');
        return;
      }
      renderLeaderboardRows(list, rows);
      renderLeaderboardRows(sidebar, rows);
    }).catch(function() {
      list.innerHTML = leaderboardMessage('could not load');
    });
}

// Name input — save to localStorage, stop propagation so it doesn't trigger game start
elNameInput.textContent = playerAlias;
elNameInput.addEventListener('input', function() {
  if (this.textContent.length > 20) this.textContent = this.textContent.slice(0, 20);
  playerAlias = this.textContent;
  localStorage.setItem('hrAlias', playerAlias);
});
elNameInput.addEventListener('paste', function(e) {
  e.preventDefault();
  var text = (e.clipboardData || window.clipboardData).getData('text/plain').slice(0, 20);
  document.execCommand('insertText', false, text);
});
elNameInput.addEventListener('keydown', function(e) {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); tryStartGame(); }
});
elNameInput.addEventListener('pointerdown', function(e) { e.stopPropagation(); });

// ── Leaderboard panel open / close ───────────────────────────
document.getElementById('gameOverLeaderboardBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  elLeaderPanel.style.display = 'block';
  elPlayAgain.disabled = true;
  fetchLeaderboard();
});

elLeaderBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  elLeaderPanel.style.display = 'block';
  elStartBtn.disabled = true;
  fetchLeaderboard();
});

document.getElementById('closeLeaderboard').addEventListener('click', function(e) {
  e.stopPropagation();
  elLeaderPanel.style.display = 'none';
  elStartBtn.disabled = false;
  elPlayAgain.disabled = false;
});
