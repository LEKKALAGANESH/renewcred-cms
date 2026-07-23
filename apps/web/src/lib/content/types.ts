import type { ContentDocument } from '@renewcred/schema';

/**
 * The read contract the public site depends on.
 *
 * Shaped to match the eventual HTTP API (`docs/API_CONVENTIONS.md`) rather than
 * the mock that currently implements it, so swapping in the real client is a
 * change of one binding in `index.ts` and nothing else. Nothing in the UI may
 * import a mock directly — that is what makes the swap safe.
 */

export type VersionStatus = 'DRAFT' | 'CONSULTATION' | 'CERTIFIED' | 'ARCHIVED';

export interface StandardSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  position: number;
}

export interface StandardVersionSummary {
  id: string;
  version: string;
  status: VersionStatus;
  publishedAt: string | null;
  certifiedAt: string | null;
}

export interface StandardDetail extends StandardSummary {
  version: StandardVersionSummary;
  /** Every version of this standard, newest first — drives the version switcher. */
  versions: StandardVersionSummary[];
  content: ContentDocument;
  consultationUrl: string | null;
  feedbackUrl: string | null;
  feedbackSummary: string | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  children: NavigationItem[];
}

export interface SearchHit {
  slug: string;
  title: string;
  /** Plain-text excerpt with the match in context. */
  excerpt: string;
  sectionAnchor: string | null;
}

/**
 * Every method may reject. Callers are required to handle it — the pages render
 * a real error state rather than an empty one, because "no results" and "the
 * request failed" are different things to a reader.
 */
export interface ContentRepository {
  listStandards(): Promise<StandardSummary[]>;
  /** Latest certified version unless `version` is given. Null when not found. */
  getStandard(slug: string, version?: string): Promise<StandardDetail | null>;
  getNavigation(menu: 'HEADER' | 'FOOTER_PRIMARY' | 'FOOTER_LEGAL'): Promise<NavigationItem[]>;
  search(query: string, slug?: string): Promise<SearchHit[]>;
}
