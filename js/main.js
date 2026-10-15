// ── Audio panel (narrow screens; wide screens show the sidebar player) ─
document.getElementById('audioBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  var panel = document.getElementById('audioPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});

// ── Startup ──────────────────────────────────────────────────
initControls();
renderHighScore();
setupCssRain();
setupSplatCanvas();  // after the rain so splats paint on top
setTimeout(function() { updateCharDimensions(); refreshCloudWidth(); updateCloudRect(); fetchLeaderboard(); }, 50);
requestAnimationFrame(loop);
