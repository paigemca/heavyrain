// ── Audio panel (narrow screens; wide screens show the sidebar player) ─
elAudioBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  elAudioPanel.style.display = elAudioPanel.style.display === 'block' ? 'none' : 'block';
});

// ── Startup ──────────────────────────────────────────────────
initControls();
renderHighScore();
setupCssRain();
setupSplatCanvas();  // after the rain so splats paint on top
setTimeout(function() { updateCharDimensions(); refreshCloudWidth(); updateCloudRect(); fetchLeaderboard(); }, 50);
requestAnimationFrame(loop);
