/**
 * TutorLingua Chrome Extension — Content Script
 * 
 * Injected on Preply and iTalki tutor profile pages.
 * Extracts profile data, scores it client-side, and shows a floating badge.
 */

(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('tl-score-root')) return;

  // ---------------------------------------------------------------------------
  // Load scoring + extractors (bundled as separate files in manifest)
  // We inline them here for a single content script approach
  // ---------------------------------------------------------------------------

  // Wait for DOM to be ready enough to extract
  const EXTRACT_DELAY_MS = 2000; // Give SPAs time to hydrate

  // ---------------------------------------------------------------------------
  // SVG icons
  // ---------------------------------------------------------------------------
  const ICONS = {
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12l4-4-4-4"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    chevron: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6l4 4 4-4"/></svg>',
    share: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8M11 4L8 1M8 1L5 4M8 1v9"/></svg>',
    sparkle: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l1.5 4.5L14 6l-4.5 1.5L8 12 6.5 7.5 2 6l4.5-1.5z"/></svg>',
  };

  // ---------------------------------------------------------------------------
  // Score colour helpers
  // ---------------------------------------------------------------------------
  function scoreClass(score, max) {
    const pct = max ? (score / max) * 100 : score;
    if (pct >= 70) return 'high';
    if (pct >= 40) return 'mid';
    return 'low';
  }

  function scoreColour(score, max) {
    const cls = scoreClass(score, max);
    if (cls === 'high') return '#10B981';
    if (cls === 'mid') return '#F59E0B';
    return '#EF4444';
  }

  // ---------------------------------------------------------------------------
  // Create the score ring SVG
  // ---------------------------------------------------------------------------
  function createRingSVG(score, size = 56) {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colour = scoreColour(score, 100);

    return `
      <svg width="${size}" height="${size}">
        <circle class="tl-ring-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}" />
        <circle class="tl-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}" 
                stroke="${colour}" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${offset}" />
      </svg>
      <span class="tl-panel-score-value">${score}</span>
    `;
  }

  // ---------------------------------------------------------------------------
  // Build section HTML
  // ---------------------------------------------------------------------------
  function buildSectionHTML(key, label, data) {
    const pct = (data.score / data.maxScore) * 100;
    const cls = scoreClass(data.score, data.maxScore);

    return `
      <div class="tl-section" data-section="${key}">
        <button class="tl-section-toggle" aria-expanded="false">
          <span class="tl-section-label">${label}</span>
          <span class="tl-section-score">${data.score}/${data.maxScore}</span>
          <span class="tl-section-chevron">${ICONS.chevron}</span>
        </button>
        <div class="tl-section-bar">
          <div class="tl-section-fill tl-fill-${cls}" style="width: ${pct}%"></div>
        </div>
        <p class="tl-section-feedback">${data.feedback}</p>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Build recommendation HTML
  // ---------------------------------------------------------------------------
  function buildRecHTML(rec, index) {
    return `
      <div class="tl-rec tl-rec-${rec.impact}">
        <span class="tl-rec-num">${index + 1}</span>
        <div class="tl-rec-content">
          <div class="tl-rec-title">${rec.title}</div>
          <p class="tl-rec-desc">${rec.description}</p>
          <span class="tl-rec-impact tl-impact-${rec.impact}">${rec.impact} impact</span>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Build the full panel HTML
  // ---------------------------------------------------------------------------
  function buildPanelHTML(result) {
    const platform = result.platform === 'preply' ? 'Preply' : 
                     result.platform === 'italki' ? 'iTalki' : 'Tutor';

    const sectionLabels = {
      headline: 'Headline',
      bio: 'Bio Quality',
      differentiation: 'Differentiation',
      pricing: 'Pricing Strategy',
      keywords: 'Keywords & SEO',
      reviews: 'Reviews & Social Proof',
    };

    const sectionsHTML = Object.entries(result.sections)
      .map(([key, data]) => buildSectionHTML(key, sectionLabels[key] || key, data))
      .join('');

    const recsHTML = result.topRecommendations
      .map((rec, i) => buildRecHTML(rec, i))
      .join('');

    return `
      <div class="tl-panel-header">
        <div class="tl-panel-score-ring">
          ${createRingSVG(result.overallScore)}
        </div>
        <div class="tl-panel-meta">
          <div class="tl-panel-name">${result.tutorName}</div>
          <div class="tl-panel-subtitle">${platform} Profile Score</div>
        </div>
        <button class="tl-panel-close" id="tl-close-btn" title="Close">
          ${ICONS.close}
        </button>
      </div>
      <div class="tl-panel-body">
        <p class="tl-summary">${result.summary}</p>
        ${sectionsHTML}
        <div class="tl-recs-title">Top Recommendations</div>
        ${recsHTML}
        <a href="https://tutorlingua.com/signup?ref=extension&score=${result.overallScore}" 
           target="_blank" 
           rel="noopener" 
           class="tl-cta">
          Build a 90+ profile on TutorLingua →
        </a>
        <p class="tl-cta-sub">Free • 0% commission • AI-powered</p>
      </div>
      <div class="tl-panel-footer">
        <a href="https://tutorlingua.com?ref=extension" target="_blank" rel="noopener" class="tl-branding">
          <span class="tl-branding-icon">${ICONS.sparkle}</span>
          TutorLingua
        </a>
        <button class="tl-share-btn" id="tl-share-btn">
          ${ICONS.share} Share score
        </button>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let panelOpen = false;
  let scoreResult = null;

  // ---------------------------------------------------------------------------
  // Create DOM elements
  // ---------------------------------------------------------------------------
  function createRoot() {
    const root = document.createElement('div');
    root.id = 'tl-score-root';

    // Badge (collapsed)
    const badge = document.createElement('div');
    badge.id = 'tl-score-badge';
    badge.classList.add('tl-badge-loading');
    badge.innerHTML = `
      <div class="tl-score-circle">
        <span style="font-size: 14px; opacity: 0.6">...</span>
      </div>
      <div class="tl-badge-text">
        <span class="tl-badge-label">Profile Score</span>
        <span class="tl-badge-title">Analysing...</span>
      </div>
      <span class="tl-badge-arrow">${ICONS.arrow}</span>
    `;
    badge.addEventListener('click', togglePanel);

    // Panel (expanded)
    const panel = document.createElement('div');
    panel.id = 'tl-score-panel';

    root.appendChild(badge);
    root.appendChild(panel);
    document.body.appendChild(root);

    return { root, badge, panel };
  }

  // ---------------------------------------------------------------------------
  // Update badge with score
  // ---------------------------------------------------------------------------
  function updateBadge(badge, result) {
    const cls = scoreClass(result.overallScore, 100);
    badge.classList.remove('tl-badge-loading');
    badge.innerHTML = `
      <div class="tl-score-circle tl-score-${cls}">
        ${result.overallScore}
      </div>
      <div class="tl-badge-text">
        <span class="tl-badge-label">Profile Score</span>
        <span class="tl-badge-title">${result.overallScore >= 70 ? 'Strong' : result.overallScore >= 40 ? 'Needs Work' : 'Weak'}</span>
      </div>
      <span class="tl-badge-arrow">${ICONS.arrow}</span>
    `;
  }

  // ---------------------------------------------------------------------------
  // Toggle panel
  // ---------------------------------------------------------------------------
  function togglePanel() {
    const badge = document.getElementById('tl-score-badge');
    const panel = document.getElementById('tl-score-panel');
    if (!badge || !panel || !scoreResult) return;

    panelOpen = !panelOpen;

    if (panelOpen) {
      badge.style.display = 'none';
      panel.innerHTML = buildPanelHTML(scoreResult);
      panel.classList.add('tl-visible');

      // Wire up close button
      document.getElementById('tl-close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
      });

      // Wire up section toggles
      panel.querySelectorAll('.tl-section-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const section = btn.closest('.tl-section');
          section.classList.toggle('tl-expanded');
          btn.setAttribute('aria-expanded', section.classList.contains('tl-expanded'));
        });
      });

      // Wire up share button
      document.getElementById('tl-share-btn')?.addEventListener('click', () => {
        const shareUrl = `https://tutorlingua.com/profile-analyser?ref=share`;
        const shareText = `My tutor profile scored ${scoreResult.overallScore}/100 on TutorLingua! Check yours:`;

        if (navigator.share) {
          navigator.share({ title: 'TutorLingua Profile Score', text: shareText, url: shareUrl }).catch(() => {});
        } else {
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
            const btn = document.getElementById('tl-share-btn');
            if (btn) {
              btn.textContent = '✓ Copied!';
              setTimeout(() => { btn.innerHTML = `${ICONS.share} Share score`; }, 2000);
            }
          }).catch(() => {});
        }
      });
    } else {
      panel.classList.remove('tl-visible');
      badge.style.display = 'flex';
    }
  }

  // ---------------------------------------------------------------------------
  // Main init
  // ---------------------------------------------------------------------------
  function init() {
    const { badge } = createRoot();

    // Wait for SPA hydration, then extract and score
    setTimeout(() => {
      const profile = window.TutorLinguaExtractors
        ? window.TutorLinguaExtractors.extractProfile()
        : extractProfileFallback();

      if (!profile || (!profile.name && !profile.bio && !profile.headline)) {
        // Couldn't extract — remove badge silently
        document.getElementById('tl-score-root')?.remove();
        return;
      }

      // Score the profile
      const result = window.TutorLinguaScoring
        ? window.TutorLinguaScoring.scoreProfile(profile)
        : scoreProfileFallback(profile);

      scoreResult = result;
      updateBadge(badge, result);

      // Cache the score
      try {
        const cacheKey = `tl_score_${profile.platform}_${window.location.pathname}`;
        chrome.storage?.local?.set({ [cacheKey]: { result, timestamp: Date.now() } });
      } catch (e) { /* storage not available */ }

    }, EXTRACT_DELAY_MS);
  }

  // ---------------------------------------------------------------------------
  // Fallback extractor (if extractors.js didn't load)
  // ---------------------------------------------------------------------------
  function extractProfileFallback() {
    const host = window.location.hostname;
    const platform = host.includes('preply') ? 'preply' : host.includes('italki') ? 'italki' : null;
    if (!platform) return null;

    const pageText = document.body.textContent || '';
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';

    // Try to get bio from the longest text block
    let bio = '';
    document.querySelectorAll('p, div, section').forEach(el => {
      const text = el.textContent?.trim() || '';
      if (text.length > bio.length && text.length > 100 && text.length < 5000) {
        bio = text;
      }
    });

    const lessonsMatch = pageText.match(/([\d,]+)\s*lessons?/i);
    const reviewsMatch = pageText.match(/([\d,]+)\s*reviews?/i);
    const ratingMatch = pageText.match(/(\d+\.?\d*)\s*(?:\/\s*5|★)/i);
    const studentsMatch = pageText.match(/([\d,]+)\s*students?/i);

    return {
      platform,
      name: h1,
      headline: document.querySelector('h2')?.textContent?.trim() || '',
      bio,
      country: '',
      price: 0,
      currency: 'USD',
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
      reviews: reviewsMatch ? parseInt(reviewsMatch[1].replace(',', '')) : 0,
      lessons: lessonsMatch ? parseInt(lessonsMatch[1].replace(',', '')) : 0,
      students: studentsMatch ? parseInt(studentsMatch[1].replace(',', '')) : 0,
      type: '',
      subjects: [],
      languages: [],
      profileUrl: window.location.href,
    };
  }

  // ---------------------------------------------------------------------------
  // Fallback scorer (if scoring.js didn't load)
  // ---------------------------------------------------------------------------
  function scoreProfileFallback(profile) {
    // Simplified scoring
    let score = 30; // Base
    if (profile.bio && profile.bio.length > 200) score += 15;
    if (profile.headline && profile.headline.length > 20) score += 10;
    if (profile.rating >= 4.5) score += 10;
    if (profile.reviews > 20) score += 10;
    if (profile.lessons > 1000) score += 10;
    score = Math.min(score, 95);

    return {
      tutorName: profile.name || 'Tutor',
      platform: profile.platform,
      overallScore: score,
      sections: {
        headline: { score: 5, maxScore: 15, feedback: 'Install the full extension for detailed analysis.' },
        bio: { score: 10, maxScore: 25, feedback: 'Install the full extension for detailed analysis.' },
        differentiation: { score: 5, maxScore: 20, feedback: 'Install the full extension for detailed analysis.' },
        pricing: { score: 7, maxScore: 15, feedback: 'Install the full extension for detailed analysis.' },
        keywords: { score: 5, maxScore: 15, feedback: 'Install the full extension for detailed analysis.' },
        reviews: { score: 5, maxScore: 10, feedback: 'Install the full extension for detailed analysis.' },
      },
      topRecommendations: [
        { title: 'Detailed analysis available', description: 'Click "Build a 90+ profile" below for a complete AI-powered breakdown.', impact: 'high' }
      ],
      summary: `Profile scored ${score}/100. Open the full panel for detailed recommendations.`,
    };
  }

  // ---------------------------------------------------------------------------
  // Watch for SPA navigation (Preply and iTalki are both SPAs)
  // ---------------------------------------------------------------------------
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Check if we're still on a tutor profile page
      const isProfile = /\/tutor\/\d+|\/teacher\/\d+/.test(window.location.pathname);
      if (isProfile) {
        // Remove old badge and re-init
        document.getElementById('tl-score-root')?.remove();
        panelOpen = false;
        scoreResult = null;
        setTimeout(init, 500);
      } else {
        document.getElementById('tl-score-root')?.remove();
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Go
  init();

})();
