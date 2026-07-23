import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { findAccessibilityViolations } from '../test/axe.js';
import { Button } from './Button.js';

describe('activation', () => {
  it('calls onClick when enabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publish</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Publish
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Publish
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: /Publish/ }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type=button so it cannot submit a surrounding form by accident', () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});

describe('loading state', () => {
  it('stays focusable so a keyboard user does not lose their place', () => {
    const { rerender } = render(<Button>Publish</Button>);
    const button = screen.getByRole('button', { name: 'Publish' });
    button.focus();
    expect(button).toHaveFocus();

    rerender(<Button isLoading>Publish</Button>);
    // `disabled` would blur to <body>; aria-disabled refuses activation instead.
    expect(screen.getByRole('button', { name: /Publish/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: /Publish/ })).not.toBeDisabled();
  });

  it('marks itself busy and disabled to assistive technology', () => {
    render(<Button isLoading>Publish</Button>);
    const button = screen.getByRole('button', { name: /Publish/ });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the label rendered so the button does not resize mid-request', () => {
    render(<Button isLoading>Publish</Button>);
    expect(screen.getByRole('button', { name: /Publish/ })).toHaveTextContent('Publish');
  });

  it('hides decorative icons while loading', () => {
    render(
      <Button isLoading trailingIcon={<svg data-testid="icon" />}>
        Publish
      </Button>
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('announces an explicit loading label when given', () => {
    render(
      <Button isLoading loadingLabel="Publishing standard">
        Publish
      </Button>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Publishing standard');
  });
});

describe('variants carry the whole visual contract, not just the fill', () => {
  it('primary uses the 48px / r40 brand shape from the design', () => {
    render(<Button variant="primary">Subscribe</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-md');
    expect(cls).toContain('rounded-xl');
    expect(cls).toContain('bg-brand-primary');
    expect(cls).toContain('text-bodyBold');
  });

  it('outline uses the 40px / r8 stroked shape, not a recoloured primary', () => {
    render(<Button variant="outline">Standards</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-sm');
    expect(cls).toContain('rounded-md');
    expect(cls).toContain('border-strong');
    expect(cls).toContain('text-label');
  });

  it('ghost reuses outline geometry so the two cannot drift apart', () => {
    render(<Button variant="ghost">Cancel</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-sm');
    expect(cls).toContain('rounded-md');
    expect(cls).toContain('border-transparent');
  });

  it('expands the hit area on coarse pointers without changing the visual height', () => {
    render(<Button variant="outline">Standards</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('coarse:min-h-touch');
    expect(cls).toContain('h-sm');
  });

  it('gates hover styling so touch devices do not get stuck hovered', () => {
    render(<Button variant="outline">Standards</Button>);
    expect(screen.getByRole('button').className).toContain('hoverable:hover:');
  });

  it('always renders a visible focus ring', () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole('button').className).toContain('focus-visible:ring-2');
  });
});

describe('accessibility', () => {
  for (const variant of ['primary', 'outline', 'ghost'] as const) {
    it(`${variant} has no axe violations`, async () => {
      const { container } = render(<Button variant={variant}>Publish</Button>);
      expect(await findAccessibilityViolations(container)).toEqual([]);
    });
  }

  it('is reachable and activatable by keyboard alone', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publish</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });
});
