import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  documentToPlainText,
  emptyDocument,
  parseDocument,
  walkSections,
} from './document.js';
import { richDemoDocument } from './fixtures.js';

describe('valid document acceptance', () => {
  it('accepts the rich demo document', () => {
    const result = parseDocument(richDemoDocument());
    expect(result.success, result.success ? '' : JSON.stringify(result.issues)).toBe(true);
  });

  it('accepts an empty document as the starting state for a new version', () => {
    expect(parseDocument(emptyDocument()).success).toBe(true);
  });

  it('accepts a section with no blocks — a heading-only container', () => {
    const document = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Container',
          anchor: 'container',
          blocks: [],
          children: [],
        },
      ],
    };

    expect(parseDocument(document).success).toBe(true);
  });
});

describe('invalid document rejection', () => {
  it('rejects a missing schemaVersion', () => {
    expect(parseDocument({ sections: [] }).success).toBe(false);
  });

  it('rejects an anchor that is not kebab-case', () => {
    const result = parseDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Bad Anchor',
          anchor: 'Not Kebab Case',
          blocks: [],
          children: [],
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]?.message).toContain('kebab-case');
  });

  it('rejects a non-UUID section id', () => {
    const result = parseDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [{ id: 'section-1', title: 'X', anchor: 'x', blocks: [], children: [] }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown field on a section', () => {
    const result = parseDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'X',
          anchor: 'x',
          blocks: [],
          children: [],
          collapsed: true,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe('error paths point at the failing block', () => {
  it('reports the section and block index of a nested failure', () => {
    const result = parseDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Parent',
          anchor: 'parent',
          blocks: [],
          children: [
            {
              id: '22222222-2222-4222-8222-222222222222',
              title: 'Child',
              anchor: 'child',
              blocks: [
                { type: 'paragraph', content: [{ type: 'text', text: 'fine' }] },
                { type: 'math', latex: '' },
              ],
              children: [],
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.issues[0]?.path).toContain('sections.0.children.0.blocks.1');
  });
});

describe('forward compatibility', () => {
  it('rejects a document declaring a newer schema version, with an actionable message', () => {
    const result = parseDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
      sections: [],
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.issues[0]?.path).toBe('schemaVersion');
    expect(result.issues[0]?.message).toContain('Upgrade the reader');
  });

  it('accepts a document from an older schema version', () => {
    // Backward compatibility: version 1 is current, so this asserts the policy
    // holds. When version 2 arrives, a migration runs before parsing and this
    // test gains a case per supported prior version.
    expect(parseDocument({ schemaVersion: 1, sections: [] }).success).toBe(true);
  });

  it('rejects schemaVersion zero or negative', () => {
    expect(parseDocument({ schemaVersion: 0, sections: [] }).success).toBe(false);
    expect(parseDocument({ schemaVersion: -1, sections: [] }).success).toBe(false);
  });
});

describe('serialization stability', () => {
  it('survives a JSON round trip unchanged', () => {
    const original = richDemoDocument();
    const revived: unknown = JSON.parse(JSON.stringify(original));

    const result = parseDocument(revived);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.document).toEqual(original);
  });

  it('parsing is idempotent', () => {
    const once = parseDocument(richDemoDocument());
    expect(once.success).toBe(true);
    if (!once.success) return;

    const twice = parseDocument(once.document);
    expect(twice.success).toBe(true);
    if (!twice.success) return;

    expect(twice.document).toEqual(once.document);
  });
});

describe('traversal', () => {
  it('walks sections depth-first in reading order', () => {
    const titles: string[] = [];
    walkSections(richDemoDocument().sections, (section) => titles.push(section.title));

    expect(titles).toEqual([
      'Introduction',
      'Scope and Boundaries',
      'Project Boundary',
      'Grid Emission Factor',
      'Reporting Requirements',
    ]);
  });

  it('reports depth correctly for nested sections', () => {
    const depths = new Map<string, number>();
    walkSections(richDemoDocument().sections, (section, depth) => depths.set(section.title, depth));

    expect(depths.get('Introduction')).toBe(0);
    expect(depths.get('Project Boundary')).toBe(1);
    expect(depths.get('Grid Emission Factor')).toBe(2);
  });

  it('flattens section titles for search indexing', () => {
    expect(documentToPlainText(richDemoDocument())).toContain('Grid Emission Factor');
  });
});
