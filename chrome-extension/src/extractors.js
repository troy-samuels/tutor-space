/**
 * TutorLingua DOM Extractors
 * 
 * Extracts profile data from Preply and iTalki profile pages.
 * Each extractor reads the live DOM — no fetch calls needed.
 */

// ---------------------------------------------------------------------------
// Preply Extractor
// ---------------------------------------------------------------------------
function extractPreplyProfile() {
  const profile = {
    platform: 'preply',
    name: '',
    headline: '',
    bio: '',
    country: '',
    price: 0,
    currency: 'USD',
    rating: 0,
    reviews: 0,
    lessons: 0,
    students: 0,
    type: '',
    subjects: [],
    languages: [],
    profileUrl: window.location.href,
  };

  try {
    // Name — usually in h1 or a prominent heading
    const nameEl = document.querySelector('h1') ||
                   document.querySelector('[data-qa="tutor-name"]') ||
                   document.querySelector('[class*="TutorName"]');
    if (nameEl) profile.name = nameEl.textContent.trim();

    // Headline/title — usually a subtitle or tagline
    const headlineEl = document.querySelector('[data-qa="tutor-title"]') ||
                       document.querySelector('[class*="TutorTitle"]') ||
                       document.querySelector('[class*="headline"]') ||
                       document.querySelector('h2');
    if (headlineEl) profile.headline = headlineEl.textContent.trim();

    // Bio — the main description area
    const bioEl = document.querySelector('[data-qa="tutor-about"]') ||
                  document.querySelector('[class*="AboutSection"]') ||
                  document.querySelector('[class*="Description"]');
    if (bioEl) {
      profile.bio = bioEl.textContent.trim();
    } else {
      // Fallback: look for longest text block in the page
      const paragraphs = document.querySelectorAll('p, [class*="about"], [class*="bio"], [class*="description"]');
      let longest = '';
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text.length > longest.length && text.length > 50) longest = text;
      });
      profile.bio = longest;
    }

    // Price
    const priceEl = document.querySelector('[data-qa="tutor-price"]') ||
                    document.querySelector('[class*="Price"]') ||
                    document.querySelector('[class*="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent;
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) profile.price = parseFloat(priceMatch[0].replace(',', ''));
      if (priceText.includes('£')) profile.currency = 'GBP';
      else if (priceText.includes('€')) profile.currency = 'EUR';
      else profile.currency = 'USD';
    }

    // Rating
    const ratingEl = document.querySelector('[data-qa="tutor-rating"]') ||
                     document.querySelector('[class*="Rating"]') ||
                     document.querySelector('[class*="rating"]');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      if (ratingMatch) profile.rating = parseFloat(ratingMatch[1]);
    }

    // Reviews count
    const reviewEl = document.querySelector('[data-qa="tutor-reviews"]') ||
                     document.querySelector('[class*="review"]');
    if (reviewEl) {
      const reviewMatch = reviewEl.textContent.match(/(\d[\d,]*)/);
      if (reviewMatch) profile.reviews = parseInt(reviewMatch[1].replace(',', ''));
    }

    // Lessons count
    const statsEls = document.querySelectorAll('[class*="stat"], [class*="Stat"], [data-qa*="stat"]');
    const pageText = document.body.textContent;

    // Look for "X lessons" pattern anywhere
    const lessonsMatch = pageText.match(/([\d,]+)\s*lessons?\b/i);
    if (lessonsMatch) profile.lessons = parseInt(lessonsMatch[1].replace(',', ''));

    // Students count
    const studentsMatch = pageText.match(/([\d,]+)\s*(?:active\s+)?students?\b/i);
    if (studentsMatch) profile.students = parseInt(studentsMatch[1].replace(',', ''));

    // Type (Professional/Community)
    if (pageText.match(/professional\s+teacher/i)) profile.type = 'Professional';
    else if (pageText.match(/community\s+tutor/i)) profile.type = 'Community';

    // Subjects/specialties
    const subjectEls = document.querySelectorAll('[class*="Subject"], [class*="subject"], [class*="specialty"], [class*="Specialty"], [data-qa*="subject"]');
    subjectEls.forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 0 && text.length < 50) profile.subjects.push(text);
    });

    // Languages spoken
    const langEls = document.querySelectorAll('[class*="Language"], [class*="language"], [data-qa*="language"]');
    langEls.forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 0 && text.length < 80) profile.languages.push(text);
    });

    // Fallback: try __NEXT_DATA__ for Preply (Next.js app)
    const nextDataEl = document.getElementById('__NEXT_DATA__');
    if (nextDataEl) {
      try {
        const nextData = JSON.parse(nextDataEl.textContent);
        const pageProps = nextData?.props?.pageProps;
        if (pageProps) {
          const tutor = pageProps.tutor || pageProps.tutorData || pageProps;
          if (tutor.firstName) profile.name = profile.name || `${tutor.firstName} ${(tutor.lastName || '').charAt(0)}.`;
          if (tutor.title) profile.headline = profile.headline || tutor.title;
          if (tutor.aboutMe || tutor.description) profile.bio = profile.bio || tutor.aboutMe || tutor.description;
          if (tutor.price) profile.price = profile.price || tutor.price;
          if (tutor.rating) profile.rating = profile.rating || tutor.rating;
          if (tutor.reviewCount) profile.reviews = profile.reviews || tutor.reviewCount;
          if (tutor.lessonCount) profile.lessons = profile.lessons || tutor.lessonCount;
          if (tutor.studentCount) profile.students = profile.students || tutor.studentCount;
        }
      } catch (e) { /* ignore JSON parse errors */ }
    }

  } catch (e) {
    console.error('[TutorLingua] Preply extraction error:', e);
  }

  return profile;
}

// ---------------------------------------------------------------------------
// iTalki Extractor
// ---------------------------------------------------------------------------
function extractITalkiProfile() {
  const profile = {
    platform: 'italki',
    name: '',
    headline: '',
    bio: '',
    country: '',
    price: 0,
    currency: 'USD',
    rating: 0,
    reviews: 0,
    lessons: 0,
    students: 0,
    type: '',
    subjects: [],
    languages: [],
    profileUrl: window.location.href,
  };

  try {
    // Name
    const nameEl = document.querySelector('h1') ||
                   document.querySelector('[class*="teacher-name"]') ||
                   document.querySelector('[class*="TeacherName"]');
    if (nameEl) profile.name = nameEl.textContent.trim();

    // Headline — iTalki uses "short_signature" or intro text
    const headlineEl = document.querySelector('[class*="teacher-title"]') ||
                       document.querySelector('[class*="intro"]') ||
                       document.querySelector('[class*="tagline"]');
    if (headlineEl) profile.headline = headlineEl.textContent.trim();

    // Bio
    const bioEl = document.querySelector('[class*="about-me"]') ||
                  document.querySelector('[class*="AboutMe"]') ||
                  document.querySelector('[class*="teacher-about"]') ||
                  document.querySelector('[class*="description"]');
    if (bioEl) {
      profile.bio = bioEl.textContent.trim();
    }

    // Stats from page text
    const pageText = document.body.textContent;

    // Rating
    const ratingMatch = pageText.match(/(\d+\.?\d*)\s*(?:\/\s*5|stars?)/i) ||
                        pageText.match(/rating[:\s]*(\d+\.?\d*)/i);
    if (ratingMatch) profile.rating = parseFloat(ratingMatch[1]);

    // Lessons
    const lessonsMatch = pageText.match(/([\d,]+)\s*(?:lessons?|sessions?)\s*(?:completed|taught)?/i);
    if (lessonsMatch) profile.lessons = parseInt(lessonsMatch[1].replace(',', ''));

    // Students
    const studentsMatch = pageText.match(/([\d,]+)\s*students?/i);
    if (studentsMatch) profile.students = parseInt(studentsMatch[1].replace(',', ''));

    // Price
    const priceEls = document.querySelectorAll('[class*="price"], [class*="Price"]');
    priceEls.forEach(el => {
      if (profile.price > 0) return;
      const text = el.textContent;
      const match = text.match(/[\$£€]?\s*([\d,.]+)/);
      if (match) {
        profile.price = parseFloat(match[1].replace(',', ''));
        if (text.includes('£')) profile.currency = 'GBP';
        else if (text.includes('€')) profile.currency = 'EUR';
      }
    });

    // Type
    if (pageText.match(/professional\s+teacher/i)) profile.type = 'Professional';
    else if (pageText.match(/community\s+tutor/i)) profile.type = 'Community';

    // Languages
    const langSection = document.querySelector('[class*="language"], [class*="Language"]');
    if (langSection) {
      const items = langSection.querySelectorAll('span, li, div');
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text.length > 2 && text.length < 50) profile.languages.push(text);
      });
    }

    // Try to get data from any embedded JSON/script
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data.name) profile.name = profile.name || data.name;
        if (data.description) profile.bio = profile.bio || data.description;
        if (data.aggregateRating) {
          profile.rating = profile.rating || parseFloat(data.aggregateRating.ratingValue);
          profile.reviews = profile.reviews || parseInt(data.aggregateRating.reviewCount);
        }
      } catch (e) { /* ignore */ }
    });

  } catch (e) {
    console.error('[TutorLingua] iTalki extraction error:', e);
  }

  return profile;
}

// ---------------------------------------------------------------------------
// Platform detection and main extract
// ---------------------------------------------------------------------------
function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes('preply.com')) return 'preply';
  if (host.includes('italki.com')) return 'italki';
  return null;
}

function extractProfile() {
  const platform = detectPlatform();
  if (platform === 'preply') return extractPreplyProfile();
  if (platform === 'italki') return extractITalkiProfile();
  return null;
}

if (typeof window !== 'undefined') {
  window.TutorLinguaExtractors = { extractProfile, detectPlatform };
}
