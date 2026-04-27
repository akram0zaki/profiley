import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn (tailwind class merger)', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', false && 'c', undefined, 'd')).toBe('a b d');
  });

  it('lets later utility classes win via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-blue-500');
  });

  it('handles array and object inputs', () => {
    expect(cn(['p-1', { 'm-2': true, hidden: false }])).toBe('p-1 m-2');
  });
});
