import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('handles tailwind conflicts via tailwind-merge', () => {
    expect(cn('px-2 px-4', 'text-red-500 text-blue-500')).toBe('px-4 text-blue-500');
  });

  it('handles conditional classes properly', () => {
    expect(cn('btn', false && 'hidden', true && 'visible')).toBe('btn visible');
  });
});

