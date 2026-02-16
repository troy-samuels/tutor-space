/**
 * TutorLingua Heuristic Profile Scorer
 * 
 * Runs entirely client-side — no API calls needed for the basic score.
 * Analyses profile data extracted from the DOM and returns a breakdown.
 */

// ---------------------------------------------------------------------------
// Keyword dictionaries for different scoring dimensions
// ---------------------------------------------------------------------------
const HIGH_VALUE_KEYWORDS = [
  // Exam prep (highest intent)
  'ielts', 'toefl', 'toeic', 'cambridge', 'fce', 'cae', 'cpe', 'delf', 'dalf',
  'dele', 'jlpt', 'hsk', 'goethe', 'testdaf', 'celpe-bras', 'topik',
  // Business / professional
  'business english', 'business', 'corporate', 'professional', 'workplace',
  'interview preparation', 'interview prep', 'presentations', 'negotiations',
  // Academic
  'academic', 'university', 'essay writing', 'research', 'thesis',
  // Conversation / fluency
  'conversation', 'conversational', 'fluency', 'speaking practice', 'pronunciation',
  // Specific skills
  'grammar', 'writing', 'reading', 'listening', 'vocabulary',
  // Audience-specific
  'beginner', 'beginners', 'advanced', 'intermediate', 'children', 'kids', 'adults',
];

const DIFFERENTIATION_SIGNALS = [
  // Methodology
  'method', 'methodology', 'approach', 'technique', 'framework', 'system',
  'personalised', 'personalized', 'customised', 'customized', 'tailored',
  // Results
  'results', 'improvement', 'progress', 'achieve', 'success', 'goal',
  'score improvement', 'band score', 'passed', 'helped',
  // Credentials
  'certified', 'certificate', 'qualified', 'degree', 'masters', 'phd',
  'tefl', 'tesol', 'celta', 'delta', 'pgce', 'ma ', 'ba ',
  // Experience specifics
  'years of experience', 'years experience', 'taught over', 'more than',
  // Unique angles
  'native speaker', 'bilingual', 'polyglot', 'lived in', 'worked in',
  'specialise', 'specialize', 'focus on', 'expert in', 'passion',
];

const WEAK_BIO_SIGNALS = [
  'hello my name is', 'hi my name is', 'hi! my name is', 'hello! my name is',
  'i am a teacher', 'i am an english teacher', 'i love teaching',
  'i am passionate about teaching', 'i have been teaching',
  'feel free to', 'don\'t hesitate', 'book a trial', 'see you soon',
  'looking forward to', 'can\'t wait to',
];

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Score the headline/title (0-15 points)
 */
function scoreHeadline(headline) {
  if (!headline || headline.trim().length === 0) {
    return { score: 0, max: 15, feedback: 'No headline found. This is the first thing students see — a compelling headline can double your click-through rate.' };
  }

  let score = 0;
  const h = headline.toLowerCase().trim();
  const words = h.split(/\s+/);

  // Length check (5-15 words is ideal)
  if (words.length >= 5 && words.length <= 15) score += 3;
  else if (words.length >= 3) score += 1;

  // Contains a specific outcome or benefit
  const outcomes = ['help you', 'improve', 'achieve', 'master', 'boost', 'build', 'develop', 'gain', 'prepare', 'pass', 'ace'];
  if (outcomes.some(o => h.includes(o))) score += 4;

  // Contains a specific subject/niche
  const niches = HIGH_VALUE_KEYWORDS.filter(k => h.includes(k));
  if (niches.length > 0) score += 3;
  if (niches.length > 1) score += 1;

  // Avoids generic phrases
  const generic = ['experienced teacher', 'professional teacher', 'english teacher', 'language teacher', 'qualified teacher'];
  const isGeneric = generic.some(g => h.includes(g)) && !outcomes.some(o => h.includes(o));
  if (isGeneric) score = Math.max(score - 2, 0);

  // Has personality or unique angle
  if (h.includes('!') || h.includes('—') || h.includes('–') || h.includes(':')) score += 1;

  score = Math.min(score, 15);

  let feedback;
  if (score >= 12) feedback = 'Strong headline with a clear value proposition. Students can immediately see what you offer.';
  else if (score >= 8) feedback = 'Decent headline but could be more specific. Try leading with the outcome: what will students achieve?';
  else if (score >= 4) feedback = 'Your headline is too generic. "Experienced English teacher" describes 10,000 tutors. What makes YOU different? Lead with a specific result or niche.';
  else feedback = 'Your headline needs a complete rewrite. Focus on: WHO you help + WHAT result you deliver. Example: "Business English coach — nail your next presentation"';

  return { score, max: 15, feedback };
}

/**
 * Score the bio/about section (0-25 points)
 */
function scoreBio(bio) {
  if (!bio || bio.trim().length === 0) {
    return { score: 0, max: 25, feedback: 'No bio found. This is where you sell yourself — without it, students have nothing to go on.' };
  }

  let score = 0;
  const b = bio.toLowerCase();
  const wordCount = bio.split(/\s+/).length;

  // Length (100-500 words is ideal)
  if (wordCount >= 150 && wordCount <= 500) score += 5;
  else if (wordCount >= 80 && wordCount <= 600) score += 3;
  else if (wordCount >= 30) score += 1;

  // Structure (paragraphs, not one wall of text)
  const paragraphs = bio.split(/\n\n|\n/).filter(p => p.trim().length > 20);
  if (paragraphs.length >= 3) score += 3;
  else if (paragraphs.length >= 2) score += 1;

  // Student-focused language
  const youCount = (b.match(/\byou\b|\byour\b|\byou'll\b|\byou're\b/g) || []).length;
  const iCount = (b.match(/\bi\b|\bmy\b|\bi'm\b|\bi've\b/g) || []).length;
  const ratio = youCount / Math.max(iCount, 1);
  if (ratio > 0.5) score += 4;
  else if (ratio > 0.25) score += 2;

  // Contains differentiating keywords
  const diffMatches = DIFFERENTIATION_SIGNALS.filter(s => b.includes(s));
  score += Math.min(diffMatches.length, 5);

  // Contains high-value keywords
  const kwMatches = HIGH_VALUE_KEYWORDS.filter(k => b.includes(k));
  score += Math.min(kwMatches.length * 0.5, 3);

  // Penalise weak/generic openings
  const weakOpening = WEAK_BIO_SIGNALS.filter(s => b.startsWith(s) || b.includes(s));
  if (weakOpening.length > 2) score = Math.max(score - 3, 0);

  // Personality signals (questions, exclamations, storytelling)
  if ((b.match(/\?/g) || []).length >= 1) score += 1;
  if (bio.match(/["""]/)) score += 1; // Quotes suggest storytelling

  score = Math.min(Math.round(score), 25);

  let feedback;
  if (score >= 20) feedback = 'Excellent bio. Student-focused, well-structured, and packed with relevant detail.';
  else if (score >= 14) feedback = 'Good bio but could improve. Try: more "you/your" language (make it about the student), add specific results you\'ve achieved, and break into clear paragraphs.';
  else if (score >= 8) feedback = 'Your bio reads more like a CV than a conversation. Students want to know: What will I achieve? How will lessons feel? Why should I pick you over 100 others?';
  else feedback = 'Your bio needs significant work. It\'s either too short, too generic, or too self-focused. Rewrite with this structure: (1) Hook — who you help, (2) Credibility — why you\'re qualified, (3) Method — how you teach, (4) CTA — next step.';

  return { score, max: 25, feedback };
}

/**
 * Score differentiation (0-20 points)
 */
function scoreDifferentiation(profile) {
  const { headline = '', bio = '', subjects = [], languages = [] } = profile;
  const text = `${headline} ${bio}`.toLowerCase();
  let score = 0;

  // Niche specificity (not just "English")
  if (subjects.length > 0) {
    const specific = subjects.filter(s => 
      !['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'italian', 'russian', 'arabic'].includes(s.toLowerCase())
    );
    if (specific.length > 0) score += 4;
  }

  // Methodology mentioned
  const methodSignals = ['method', 'approach', 'technique', 'framework', 'system', 'personalised', 'personalized', 'customised', 'customized'];
  if (methodSignals.some(s => text.includes(s))) score += 3;

  // Specific results/outcomes mentioned
  const resultSignals = ['helped over', 'students have', 'average improvement', 'success rate', 'passed', 'achieved', 'score of', 'band '];
  if (resultSignals.some(s => text.includes(s))) score += 4;

  // Unique background/angle
  const uniqueSignals = ['lived in', 'worked in', 'background in', 'career in', 'industry', 'corporate', 'academic', 'research'];
  if (uniqueSignals.some(s => text.includes(s))) score += 3;

  // Multiple languages (polyglot advantage)
  if (languages.length >= 3) score += 2;
  else if (languages.length >= 2) score += 1;

  // Credentials
  const credSignals = ['certified', 'certificate', 'celta', 'delta', 'tefl', 'tesol', 'degree', 'masters', 'phd', 'pgce'];
  if (credSignals.some(s => text.includes(s))) score += 3;

  // Teaching style personality
  const styleSignals = ['fun', 'engaging', 'relaxed', 'structured', 'patient', 'dynamic', 'interactive', 'immersive'];
  const styleCount = styleSignals.filter(s => text.includes(s)).length;
  if (styleCount >= 2) score += 1;

  score = Math.min(score, 20);

  let feedback;
  if (score >= 16) feedback = 'You stand out clearly. Students can see exactly what makes you different and why they should choose you.';
  else if (score >= 10) feedback = 'Some differentiation but not enough to be memorable. The strongest profiles lead with a specific niche or proven results. What\'s the ONE thing only you can offer?';
  else if (score >= 5) feedback = 'Your profile blends in with thousands of others. You need a clear angle: a specific audience (e.g. "tech professionals"), a specific result (e.g. "IELTS 7+"), or a unique method.';
  else feedback = 'Nothing distinguishes you from other tutors. This is the #1 thing holding your profile back. Find your niche and make it impossible to ignore.';

  return { score, max: 20, feedback };
}

/**
 * Score pricing strategy (0-15 points)
 */
function scorePricing(profile) {
  const { price, currency = 'GBP', rating, reviews, lessons, type } = profile;

  if (!price || price === 0) {
    return { score: 5, max: 15, feedback: 'Could not detect your pricing. Ensure your price is visible and competitive for your experience level.' };
  }

  let score = 0;

  // Normalise to approximate USD for comparison
  const rates = { GBP: 1.27, EUR: 1.08, USD: 1 };
  const multiplier = rates[currency] || 1;
  const priceUSD = price * multiplier;

  // Price reasonableness based on experience
  if (lessons > 5000) {
    // Veteran — should charge premium
    if (priceUSD >= 25 && priceUSD <= 80) score += 6;
    else if (priceUSD >= 15 && priceUSD < 25) score += 3; // Undercharging
    else if (priceUSD > 80) score += 4; // Possibly too high but defensible
    else score += 1; // Way too cheap for experience
  } else if (lessons > 1000) {
    // Experienced
    if (priceUSD >= 15 && priceUSD <= 50) score += 6;
    else if (priceUSD >= 10) score += 3;
    else score += 1;
  } else {
    // Newer tutor
    if (priceUSD >= 10 && priceUSD <= 30) score += 6;
    else if (priceUSD >= 5) score += 3;
    else score += 1;
  }

  // Reviews support the price
  if (reviews > 50 && rating >= 4.8) score += 4;
  else if (reviews > 20 && rating >= 4.5) score += 3;
  else if (reviews > 5 && rating >= 4.0) score += 2;
  else if (reviews > 0) score += 1;

  // Professional vs Community tutor pricing
  if (type === 'Professional' && priceUSD >= 20) score += 2;
  else if (type === 'Professional' && priceUSD < 15) score += 0; // Undervaluing credentials
  else if (type === 'Community') score += 2; // Pricing matters less

  // Trial lesson discount (can't detect from listing data alone, give benefit of doubt)
  score += 1;

  score = Math.min(score, 15);

  let feedback;
  if (score >= 12) feedback = 'Your pricing is well-positioned for your experience and reviews. Students perceive good value.';
  else if (score >= 8) feedback = 'Pricing is acceptable but could be optimised. If you have strong reviews and high experience, consider raising your rate — underpricing signals lower quality to premium students.';
  else if (score >= 4) feedback = 'Your price may not match your experience level. Experienced tutors charging too little lose high-value students who equate price with quality. Consider a gradual increase.';
  else feedback = 'Pricing needs attention. Either too low for your experience (devaluing yourself) or too high without the reviews/credentials to justify it.';

  return { score, max: 15, feedback };
}

/**
 * Score keyword/discoverability (0-15 points)
 */
function scoreKeywords(profile) {
  const text = `${profile.headline || ''} ${profile.bio || ''} ${(profile.subjects || []).join(' ')}`.toLowerCase();
  let score = 0;

  if (text.length < 20) {
    return { score: 0, max: 15, feedback: 'Not enough content to evaluate discoverability. A detailed profile with relevant keywords helps students find you in search.' };
  }

  // High-value keyword coverage
  const matched = HIGH_VALUE_KEYWORDS.filter(k => text.includes(k));
  score += Math.min(matched.length * 1.5, 8);

  // Subject variety
  if ((profile.subjects || []).length >= 3) score += 2;
  else if ((profile.subjects || []).length >= 1) score += 1;

  // Language teaching mentioned alongside skills
  const langSkillCombos = ['business', 'exam', 'conversation', 'grammar', 'writing', 'pronunciation', 'academic'];
  const combos = langSkillCombos.filter(c => text.includes(c));
  if (combos.length >= 3) score += 3;
  else if (combos.length >= 1) score += 1;

  // Long-tail phrases (more specific = better discoverability)
  const longTail = ['interview preparation', 'exam preparation', 'ielts preparation', 'business english', 'academic writing', 'speaking practice'];
  const ltMatches = longTail.filter(lt => text.includes(lt));
  if (ltMatches.length >= 2) score += 2;
  else if (ltMatches.length >= 1) score += 1;

  score = Math.min(Math.round(score), 15);

  let feedback;
  if (score >= 12) feedback = `Excellent keyword coverage. You mention ${matched.length} high-value search terms that students actively look for.`;
  else if (score >= 8) feedback = `Decent discoverability with ${matched.length} keywords. Add more specific terms like exam names (IELTS, TOEFL), skill areas (pronunciation, writing), and audience types (beginner, business).`;
  else if (score >= 4) feedback = `Low keyword coverage (${matched.length} terms found). Students search for specific needs — "IELTS preparation", "business English", "conversation practice". Weave these naturally into your bio.`;
  else feedback = 'Almost no searchable keywords in your profile. Students can\'t find what you don\'t mention. List specific exams, skills, and audiences you serve.';

  return { score, max: 15, feedback };
}

/**
 * Score reviews/social proof (0-10 points)
 */
function scoreReviews(profile) {
  const { rating = 0, reviews = 0, lessons = 0, students = 0 } = profile;
  let score = 0;

  // Review quantity
  if (reviews >= 100) score += 4;
  else if (reviews >= 50) score += 3;
  else if (reviews >= 20) score += 2;
  else if (reviews >= 5) score += 1;

  // Rating quality
  if (rating >= 4.9) score += 3;
  else if (rating >= 4.7) score += 2;
  else if (rating >= 4.5) score += 1;

  // Active teaching (lessons/students ratio suggests retention)
  if (lessons > 0 && students > 0) {
    const avgLessonsPerStudent = lessons / students;
    if (avgLessonsPerStudent >= 10) score += 2; // Great retention
    else if (avgLessonsPerStudent >= 5) score += 1;
  }

  // Lesson volume as social proof
  if (lessons >= 5000) score += 1;

  score = Math.min(score, 10);

  let feedback;
  if (score >= 8) feedback = `Strong social proof: ${rating}/5 across ${reviews} reviews with ${lessons.toLocaleString()} lessons. This builds immediate trust.`;
  else if (score >= 5) feedback = `Solid reviews but room to grow. Encourage happy students to leave detailed reviews mentioning specific outcomes they achieved.`;
  else if (score >= 2) feedback = `Limited social proof (${reviews} reviews). New students hesitate without reviews. Focus on delivering exceptional trial lessons and asking for feedback.`;
  else feedback = 'Very few or no reviews. This is the biggest barrier for new students. Consider offering discounted initial sessions to build your review base quickly.';

  return { score, max: 10, feedback };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * @param {Object} profile - Extracted profile data
 * @param {string} profile.headline
 * @param {string} profile.bio
 * @param {string} profile.name
 * @param {string} profile.country
 * @param {string} profile.platform - 'preply' | 'italki'
 * @param {number} profile.price
 * @param {string} profile.currency
 * @param {number} profile.rating
 * @param {number} profile.reviews
 * @param {number} profile.lessons
 * @param {number} profile.students
 * @param {string} profile.type - 'Professional' | 'Community'
 * @param {string[]} profile.subjects
 * @param {string[]} profile.languages
 * @returns {Object} Full score breakdown
 */
function scoreProfile(profile) {
  const headline = scoreHeadline(profile.headline);
  const bio = scoreBio(profile.bio);
  const differentiation = scoreDifferentiation(profile);
  const pricing = scorePricing(profile);
  const keywords = scoreKeywords(profile);
  const reviews = scoreReviews(profile);

  const totalScore = headline.score + bio.score + differentiation.score + 
                     pricing.score + keywords.score + reviews.score;
  const totalMax = headline.max + bio.max + differentiation.max + 
                   pricing.max + keywords.max + reviews.max;
  const overallScore = Math.round((totalScore / totalMax) * 100);

  // Generate top recommendations sorted by impact
  const recommendations = [];

  if (headline.score < headline.max * 0.5) {
    recommendations.push({
      title: 'Rewrite your headline with a specific outcome',
      description: 'Your headline is your first impression. Replace generic phrases with a clear promise: WHO you help + WHAT result you deliver.',
      impact: 'high',
      priority: 1
    });
  }

  if (differentiation.score < differentiation.max * 0.4) {
    recommendations.push({
      title: 'Find your unique angle',
      description: 'Nothing sets you apart right now. Pick ONE thing — a specific exam, industry, or teaching method — and make it the centrepiece of your profile.',
      impact: 'high',
      priority: 2
    });
  }

  if (bio.score < bio.max * 0.5) {
    recommendations.push({
      title: 'Rewrite your bio for students, not yourself',
      description: 'Flip the focus: instead of "I am / I have", write "You will / You\'ll learn". Show the transformation, not just your CV.',
      impact: 'high',
      priority: 3
    });
  }

  if (keywords.score < keywords.max * 0.5) {
    recommendations.push({
      title: 'Add searchable keywords to your profile',
      description: 'Students search for specific needs. Naturally include terms like "IELTS preparation", "business English", "conversation practice" in your bio.',
      impact: 'medium',
      priority: 4
    });
  }

  if (reviews.score < reviews.max * 0.4) {
    recommendations.push({
      title: 'Build your review base',
      description: 'More reviews = more trust = more bookings. Ask happy students to leave reviews mentioning specific results they achieved.',
      impact: 'medium',
      priority: 5
    });
  }

  if (pricing.score < pricing.max * 0.5) {
    recommendations.push({
      title: 'Optimise your pricing strategy',
      description: 'Your pricing may not reflect your value. Experienced tutors who undercharge lose premium students who equate price with quality.',
      impact: 'medium',
      priority: 6
    });
  }

  // Take top 3
  recommendations.sort((a, b) => a.priority - b.priority);
  const topRecs = recommendations.slice(0, 3).map(({ title, description, impact }) => ({ title, description, impact }));

  // If fewer than 3 recs, add a generic one
  while (topRecs.length < 3) {
    topRecs.push({
      title: 'Keep up the good work',
      description: 'Your profile is solid in this area. Focus on the recommendations above for the biggest improvement.',
      impact: 'low'
    });
  }

  // Summary
  let summary;
  if (overallScore >= 80) {
    summary = `Strong profile scoring ${overallScore}/100. You're in the top tier of tutors on ${profile.platform || 'the platform'}. Fine-tune the areas below to push even higher.`;
  } else if (overallScore >= 60) {
    summary = `Decent profile at ${overallScore}/100, but you're leaving bookings on the table. The recommendations below could significantly increase your conversion rate.`;
  } else if (overallScore >= 40) {
    summary = `Your profile scores ${overallScore}/100 — below average. Students are scrolling past you. The good news: the fixes are straightforward and high-impact.`;
  } else {
    summary = `At ${overallScore}/100, your profile needs serious work. Most students won't book based on what they see. Focus on the top recommendations — even small changes will have a big effect.`;
  }

  return {
    tutorName: profile.name || 'Unknown Tutor',
    platform: profile.platform || 'unknown',
    overallScore,
    sections: {
      headline: { score: headline.score, maxScore: headline.max, feedback: headline.feedback },
      bio: { score: bio.score, maxScore: bio.max, feedback: bio.feedback },
      differentiation: { score: differentiation.score, maxScore: differentiation.max, feedback: differentiation.feedback },
      pricing: { score: pricing.score, maxScore: pricing.max, feedback: pricing.feedback },
      keywords: { score: keywords.score, maxScore: keywords.max, feedback: keywords.feedback },
      reviews: { score: reviews.score, maxScore: reviews.max, feedback: reviews.feedback }
    },
    topRecommendations: topRecs,
    summary
  };
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.TutorLinguaScoring = { scoreProfile };
}
