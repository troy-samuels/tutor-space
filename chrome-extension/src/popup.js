/**
 * Popup script — shows stats and current page status
 */
(function () {
  'use strict';

  // Check if current tab is on a supported profile page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.url) return;

    const isPreply = /preply\.com\/.*\/tutor\/\d+/.test(tab.url);
    const isITalki = /italki\.com\/.*\/teacher\/\d+/.test(tab.url);
    const isProfile = isPreply || isITalki;

    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (isProfile) {
      dot.classList.remove('inactive');
      dot.classList.add('active');
      const platform = isPreply ? 'Preply' : 'iTalki';
      text.innerHTML = `<strong>Active</strong> — scoring this ${platform} profile`;
    } else {
      text.textContent = 'Navigate to a Preply or iTalki tutor profile to see their score';
    }
  });

  // Load stats from storage
  chrome.storage?.local?.get(null, (items) => {
    if (!items) return;

    const scores = [];
    for (const [key, val] of Object.entries(items)) {
      if (key.startsWith('tl_score_') && val?.result?.overallScore) {
        scores.push(val.result.overallScore);
      }
    }

    if (scores.length > 0) {
      const statsEl = document.getElementById('stats');
      if (statsEl) statsEl.style.display = 'grid';

      const scoredEl = document.getElementById('stat-scored');
      if (scoredEl) scoredEl.textContent = scores.length;

      const avgEl = document.getElementById('stat-avg');
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      if (avgEl) avgEl.textContent = avg;
    }
  });
})();
