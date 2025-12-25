/**
 * Reserved usernames that cannot be used for user registration
 * These protect existing routes and prevent conflicts
 */
export const RESERVED_USERNAMES = new Set([
  // Auth & Account routes
  'signup',
  'login',
  'logout',
  'auth',
  'forgot-password',
  'reset-password',
  'email-unsubscribe',
  'verify-email',
  'student-auth',

  // Public routes
  'privacy',
  'terms',
  'about',
  'contact',
  'help',
  'support',
  'pricing',
  'blog',
  'docs',
  'documentation',

  // Feature routes
  'book',
  'booking',
  'bookings',
  'dashboard',
  'settings',
  'profile',
  'bio',
  'page',
  'pages',
  'products',
  'product',
  'site',
  'sites',

  // Admin & System
  'admin',
  'administrator',
  'root',
  'system',
  'api',
  'www',
  'app',
  'mail',
  'email',

  // Marketing & SEO
  'tutor',
  'tutors',
  'student',
  'students',
  'teacher',
  'teachers',
  'learn',
  'teach',
  'lessons',
  'lesson',

  // Feature-specific routes
  'analytics',
  'marketing',
  'ai',
  'studio',
  'onboarding',
  'availability',
  'services',
  'service',
  'invoices',
  'invoice',
  'payments',
  'payment',
  'leads',
  'lead',

  // Reserved for future use
  'upgrade',
  'pro',
  'premium',
  'enterprise',
  'business',
  'subscribe',
  'subscription',
  'billing',
  'plans',
  'plan',

  // Common social/brand protection
  'tutorlingua',
  'official',
  'verified',
  'staff',
  'team',
  'careers',
  'jobs',
  'press',
  'media',
  'news',

  // Prevent abuse
  'test',
  'demo',
  'example',
  'sample',
  'null',
  'undefined',
  'admin123',
  'user',
  'guest',

  // File extensions that could cause issues
  'js',
  'css',
  'html',
  'xml',
  'json',
  'ico',
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'pdf',
  'txt',
]);

/**
 * Check if a username is reserved
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

/**
 * Validate username format and availability
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Basic format validation
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }

  // Only allow alphanumeric and hyphens/underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }

  // Must start with a letter or number
  if (!/^[a-zA-Z0-9]/.test(username)) {
    return { valid: false, error: 'Username must start with a letter or number' };
  }

  // Check if reserved
  if (isReservedUsername(username)) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}
