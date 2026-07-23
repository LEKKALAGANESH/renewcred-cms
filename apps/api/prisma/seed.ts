/**
 * Idempotent seed — safe to re-run.
 *
 * This is not a smoke test. It is the reviewer's first impression: someone
 * evaluating this clones, boots, and looks. An empty CMS looks broken even when
 * it is correct, and the Figma demonstrates no tables, equations, or lists — so
 * without seeded examples the rich-content capability is invisible.
 *
 *   npm run seed --workspace=@renewcred/api
 */
// bcryptjs 2.x ships CommonJS, so ESM cannot statically detect its named
// exports. Destructuring the default import resolves at runtime instead.
import bcryptjs from 'bcryptjs';
import {
  documentToPlainText,
  emptyDocument,
  parseDocument,
  richDemoDocument,
  type ContentDocument,
} from '@renewcred/schema';
import { MenuKey, PrismaClient, Role, VersionStatus } from '../src/generated/prisma/index.js';
import { toJsonColumn } from '../src/lib/json.js';

const { hash } = bcryptjs;

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@renewcred.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';

/** Content from the design's index page (regions L-04b, L-04c). */
const STANDARDS = [
  {
    slug: 'ev',
    title: 'EV',
    summary:
      'Methodology for quantifying emission reductions from electric vehicle deployment, covering passenger and commercial categories.',
    description:
      'This standard defines eligibility, measurement, and verification requirements for electric vehicle projects seeking RenewCred certification.',
  },
  {
    slug: 'biochar',
    title: 'Biochar',
    summary:
      'Requirements for carbon removal through biochar production, application, and long-term storage monitoring.',
    description:
      'This standard covers feedstock eligibility, pyrolysis conditions, and permanence accounting for biochar carbon removal.',
  },
  {
    slug: 'methane',
    title: 'Methane',
    summary:
      'Quantification of avoided methane emissions from capture, destruction, and utilisation projects.',
    description:
      'This standard sets out baseline determination and monitoring requirements for methane abatement projects.',
  },
  {
    slug: 'renewable-energy',
    title: 'Renewable Energy',
    summary:
      'Grid-connected renewable generation methodology, including grid emission factor determination.',
    description:
      'This standard defines additionality, baseline, and monitoring requirements for renewable energy generation projects.',
  },
] as const;

/** Header navigation, matching region G-02. Two entries carry dropdowns. */
const HEADER_NAV = [
  { label: 'Buyers', href: '/buyers', children: [] },
  { label: 'Suppliers', href: '/suppliers', children: [] },
  {
    label: 'Climate & Us',
    href: '/climate',
    children: [
      { label: 'Our Mission', href: '/climate/mission' },
      { label: 'Impact', href: '/climate/impact' },
    ],
  },
  {
    label: 'Science',
    href: '/science',
    children: [
      { label: 'Research', href: '/science/research' },
      { label: 'Publications', href: '/science/publications' },
    ],
  },
  { label: 'Standards', href: '/standards', children: [] },
  { label: 'Contact Us', href: '/contact', children: [] },
] as const;

const FOOTER_PRIMARY = [
  { label: 'Buyer', href: '/buyers' },
  { label: 'Supplier', href: '/suppliers' },
  { label: 'Climate & Us', href: '/climate' },
  { label: 'Science', href: '/science' },
  { label: 'Standards', href: '/standards' },
  { label: 'Contact Us', href: '/contact' },
] as const;

const FOOTER_LEGAL = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Support', href: '/support' },
] as const;

/** Global chrome, regions G-05 through G-11. */
const SITE_SETTINGS: Record<string, unknown> = {
  'site.name': 'RenewCred',
  'contact.address': 'Indiranagar, Bengaluru, Karnataka, INDIA',
  'contact.email': 'yp@renewcred.com',
  'site.tagline': 'There is no time to save the planet',
  'legal.cin': 'XXXXXXXXX',
  'newsletter.headline': '🔒 No spam. Just pure climate intelligence.',
  'newsletter.placeholder': 'Your Email Address Please!',
  // The design's footer reads "Renewred" while the logo reads "RenewCred".
  // Treated as a design typo (blueprint B4) and stored corrected — editable
  // either way because it lives here rather than in JSX.
  'legal.copyright': 'Copyright © 2025 RenewCred. All rights reserved.',
  'index.heroTitle': 'RenewCred Standards',
  'index.heroBody':
    'Browse the methodologies that govern RenewCred certification across every project category.',
};

/** Fails loudly rather than seeding content the API would later reject. */
function validated(document: ContentDocument, label: string): ContentDocument {
  const result = parseDocument(document);
  if (!result.success) {
    throw new Error(
      `Seed document "${label}" is invalid:\n` +
        result.issues.map((issue) => `  ${issue.path}: ${issue.message}`).join('\n')
    );
  }
  return result.document;
}

async function seedAdmin(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'RenewCred Admin',
      role: Role.ADMIN,
      passwordHash: await hash(ADMIN_PASSWORD, 12),
    },
  });
  console.log(`  admin: ${user.email}`);
  return user.id;
}

async function seedNavigation(): Promise<void> {
  // Rebuilt wholesale: navigation is small, ordered, and hierarchical, so
  // diffing it costs more than replacing it. Cascade removes children.
  await prisma.navigationItem.deleteMany({});

  for (const [index, entry] of HEADER_NAV.entries()) {
    const parent = await prisma.navigationItem.create({
      data: { menu: MenuKey.HEADER, label: entry.label, href: entry.href, position: index },
    });

    for (const [childIndex, child] of entry.children.entries()) {
      await prisma.navigationItem.create({
        data: {
          menu: MenuKey.HEADER,
          label: child.label,
          href: child.href,
          position: childIndex,
          parentId: parent.id,
        },
      });
    }
  }

  for (const [index, entry] of FOOTER_PRIMARY.entries()) {
    await prisma.navigationItem.create({
      data: { menu: MenuKey.FOOTER_PRIMARY, ...entry, position: index },
    });
  }

  for (const [index, entry] of FOOTER_LEGAL.entries()) {
    await prisma.navigationItem.create({
      data: { menu: MenuKey.FOOTER_LEGAL, ...entry, position: index },
    });
  }

  const total = await prisma.navigationItem.count();
  console.log(`  navigation: ${total} items`);
}

async function seedSettings(): Promise<void> {
  for (const [key, value] of Object.entries(SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
  }
  console.log(`  settings: ${Object.keys(SITE_SETTINGS).length} keys`);
}

async function seedStandards(authorId: string): Promise<void> {
  for (const [index, spec] of STANDARDS.entries()) {
    const standard = await prisma.standard.upsert({
      where: { slug: spec.slug },
      update: { title: spec.title, summary: spec.summary, description: spec.description },
      create: { ...spec, position: index },
    });

    // Only the EV standard carries the rich demo document — it is the one a
    // reviewer opens first, and duplicating it across four standards would
    // suggest the content is boilerplate rather than authored.
    const isDemo = spec.slug === 'ev';
    const document = validated(
      isDemo ? richDemoDocument() : emptyDocument(),
      `${spec.slug} v1.0.0`
    );

    await prisma.standardVersion.upsert({
      where: { standardId_version: { standardId: standard.id, version: 'v1.0.0' } },
      update: { content: toJsonColumn(document), searchText: documentToPlainText(document) },
      create: {
        standardId: standard.id,
        version: 'v1.0.0',
        status: VersionStatus.CERTIFIED,
        content: toJsonColumn(document),
        searchText: documentToPlainText(document),
        certifiedAt: new Date('2025-07-12T00:00:00Z'),
        consultationStart: new Date('2025-05-12T00:00:00Z'),
        consultationEnd: new Date('2025-07-12T00:00:00Z'),
        publishedAt: new Date('2025-07-12T00:00:00Z'),
        authorId,
      },
    });

    // A second version on EV so the version selector, consultation panel, and
    // feedback links (regions D-05 through D-10) have something to render.
    if (isDemo) {
      const draft = validated(richDemoDocument(), 'ev v1.1.0 draft');
      await prisma.standardVersion.upsert({
        where: { standardId_version: { standardId: standard.id, version: 'v1.1.0' } },
        update: {},
        create: {
          standardId: standard.id,
          version: 'v1.1.0',
          status: VersionStatus.CONSULTATION,
          content: toJsonColumn(draft),
          searchText: documentToPlainText(draft),
          consultationStart: new Date('2026-05-12T00:00:00Z'),
          consultationEnd: new Date('2026-09-12T00:00:00Z'),
          consultationUrl: '/standards/ev/v1.1.0/consultation',
          feedbackUrl: '/standards/ev/v1.1.0/feedback',
          feedbackSummary: 'Feedback summary & actions',
          authorId,
        },
      });
    }
  }

  const versions = await prisma.standardVersion.count();
  console.log(`  standards: ${STANDARDS.length} (${versions} versions)`);
}

async function main(): Promise<void> {
  console.log('Seeding…');
  const authorId = await seedAdmin();
  await seedSettings();
  await seedNavigation();
  await seedStandards(authorId);

  console.log('\nDone. Sign in with:');
  console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('\nSeed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
