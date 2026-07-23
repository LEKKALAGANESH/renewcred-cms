import { mockContentRepository } from './mock';
import type { ContentRepository } from './types';

/**
 * The single binding the rest of the app resolves content through.
 *
 * Phase 2 replaces the right-hand side with an HTTP client implementing the same
 * interface; no page, component, or test changes, because none of them import a
 * concrete repository.
 */
export const contentRepository: ContentRepository = mockContentRepository;

export type {
  ContentRepository,
  NavigationItem,
  SearchHit,
  StandardDetail,
  StandardSummary,
  StandardVersionSummary,
  VersionStatus,
} from './types';
