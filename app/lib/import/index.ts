/**
 * Profile Import Engine — Public API
 *
 * Usage:
 *   import { resolvePlatform, scrapeProfile, mapToPageBuilder, reUploadAssets } from '@/lib/import';
 */

// Types
export type {
  Platform,
  ImportStatus,
  NormalisedProfile,
  NormalisedLanguage,
  NormalisedReview,
  NormalisedService,
  NormalisedSocialLink,
  MappedPageBuilderData,
  MappedProfile,
  MappedSite,
  MappedService,
  MappedReview,
  MappedResource,
  ProfileImportRecord,
  ScrapeResult,
  PlatformScraper,
} from "./types";

export { PLATFORMS, IMPORT_STATUSES } from "./types";

// URL resolver
export {
  resolvePlatform,
  looksLikePlatformUrl,
  PLATFORM_LABELS,
  SUPPORTED_DOMAINS,
} from "./resolve-platform";
export type { ResolvedPlatform } from "./resolve-platform";

// Scrapers
export { scrapeProfile, isSupportedForScraping } from "./scrapers";

// Mapper
export { mapToPageBuilder, mergeEdits } from "./mapper";

// Asset pipeline
export { reUploadAssets } from "./assets";
export type { AssetUploadResult } from "./assets";
