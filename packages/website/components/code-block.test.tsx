import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from '@/components/code-block';

describe('documentation code block', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copies the visible command and confirms the action', async () => {
    render(<CodeBlock code="pnpm build" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pnpm build');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();
  });
});
