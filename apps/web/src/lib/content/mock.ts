import { documentToPlainText, emptyDocument, richDemoDocument } from '@renewcred/schema';
import type {
  ContentRepository,
  NavigationItem,
  SearchHit,
  StandardDetail,
  StandardSummary,
} from './types';

/**
 * In-memory implementation of {@link ContentRepository}.
 *
 * Content mirrors the seed (`apps/api/prisma/seed.ts`) so the mocked site and
 * the seeded database show the same thing — a mock that disagrees with the seed
 * makes the eventual swap look like a regression.
 *
 * `LATENCY_MS` is deliberate: with instant resolution, loading and skeleton
 * states never render during development and ship untested.
 */
const LATENCY_MS = 300;

const settle = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

const SUMMARY =
  'Lorem ipsum dolor sit amet consectetur. Gravida faucibus commodo leo eget commodo. Sit quis dolor non sed enim scelerisque.';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet consectetur. Massa nec vulputate amet enim turpis elit odio fusce. Nunc cursus aliquet arcu vitae dolor ac rutrum pulvinar orci. Tristique nulla sed at nisl justo ipsum accumsan sed a. Enim amet varius ligula egestas. Integer vestibulum elementum non fermentum.';

const STANDARDS: StandardSummary[] = [
  { id: '1', slug: 'ev', title: 'EV', summary: SUMMARY, description: DESCRIPTION, position: 0 },
  {
    id: '2',
    slug: 'biochar',
    title: 'Biochar',
    summary: SUMMARY,
    description: DESCRIPTION,
    position: 1,
  },
  {
    id: '3',
    slug: 'methane',
    title: 'Methane',
    summary: SUMMARY,
    description: DESCRIPTION,
    position: 2,
  },
  {
    id: '4',
    slug: 'renewable-energy',
    title: 'Renewable Energy',
    summary: SUMMARY,
    description: DESCRIPTION,
    position: 3,
  },
];

/** Only EV carries the rich demo document; the rest are empty, exactly as seeded. */
const DOCUMENTS: Record<string, ReturnType<typeof emptyDocument>> = {
  ev: richDemoDocument(),
};

const HEADER_NAV: NavigationItem[] = [
  { id: 'h1', label: 'Buyers', href: '/buyers', children: [] },
  { id: 'h2', label: 'Suppliers', href: '/suppliers', children: [] },
  {
    id: 'h3',
    label: 'Climate & Us',
    href: '/climate',
    children: [
      { id: 'h3a', label: 'View consultation', href: '/climate/consultation', children: [] },
      { id: 'h3b', label: 'View Feedback', href: '/climate/feedback', children: [] },
    ],
  },
  { id: 'h4', label: 'Science', href: '/science', children: [] },
  {
    id: 'h5',
    label: 'Standards',
    href: '/standards',
    children: STANDARDS.map((s) => ({
      id: `h5-${s.slug}`,
      label: s.title,
      href: `/standards/${s.slug}`,
      children: [],
    })),
  },
  { id: 'h6', label: 'Contact Us', href: '/contact', children: [] },
];

const FOOTER_PRIMARY: NavigationItem[] = [
  { id: 'f1', label: 'Buyer', href: '/buyers', children: [] },
  { id: 'f2', label: 'Supplier', href: '/suppliers', children: [] },
  { id: 'f3', label: 'Climate & Us', href: '/climate', children: [] },
  { id: 'f4', label: 'Science', href: '/science', children: [] },
  { id: 'f5', label: 'Standards', href: '/standards', children: [] },
  { id: 'f6', label: 'Contact Us', href: '/contact', children: [] },
];

const FOOTER_LEGAL: NavigationItem[] = [
  { id: 'l1', label: 'Privacy Policy', href: '/privacy', children: [] },
  { id: 'l2', label: 'Terms & Conditions', href: '/terms', children: [] },
  { id: 'l3', label: 'Support', href: '/support', children: [] },
];

function detailFor(standard: StandardSummary, version?: string): StandardDetail {
  const versions = [
    {
      id: `${standard.id}-v110`,
      version: 'v1.1.0',
      status: 'CONSULTATION' as const,
      publishedAt: null,
      certifiedAt: null,
    },
    {
      id: `${standard.id}-v100`,
      version: 'v1.0.0',
      status: 'CERTIFIED' as const,
      publishedAt: '2025-07-12T00:00:00.000Z',
      certifiedAt: '2025-07-12T00:00:00.000Z',
    },
  ];
  // Certified is the default view; a reader landing on a standard should never
  // see a draft unless they asked for that version explicitly.
  const selected = versions.find((v) => v.version === version) ?? versions[1]!;

  return {
    ...standard,
    version: selected,
    versions: standard.slug === 'ev' ? versions : [versions[1]!],
    content: DOCUMENTS[standard.slug] ?? emptyDocument(),
    consultationUrl: selected.status === 'CONSULTATION' ? '/climate/consultation' : null,
    feedbackUrl: null,
    feedbackSummary: null,
  };
}

export const mockContentRepository: ContentRepository = {
  listStandards: () => settle([...STANDARDS].sort((a, b) => a.position - b.position)),

  getStandard: (slug, version) => {
    const standard = STANDARDS.find((s) => s.slug === slug);
    return settle(standard ? detailFor(standard, version) : null);
  },

  getNavigation: (menu) =>
    settle(
      menu === 'HEADER' ? HEADER_NAV : menu === 'FOOTER_PRIMARY' ? FOOTER_PRIMARY : FOOTER_LEGAL
    ),

  search: (query, slug) => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return settle<SearchHit[]>([]);

    const scope = slug === undefined ? STANDARDS : STANDARDS.filter((s) => s.slug === slug);
    const hits = scope.flatMap((standard) => {
      const document = DOCUMENTS[standard.slug];
      const haystack = `${standard.title} ${standard.summary} ${
        document ? documentToPlainText(document) : ''
      }`;
      const at = haystack.toLowerCase().indexOf(needle);
      if (at === -1) return [];
      return [
        {
          slug: standard.slug,
          title: standard.title,
          excerpt: `…${haystack.slice(Math.max(0, at - 60), at + 100).trim()}…`,
          sectionAnchor: null,
        } satisfies SearchHit,
      ];
    });
    return settle(hits);
  },
};
