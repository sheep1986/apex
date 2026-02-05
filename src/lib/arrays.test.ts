import { describe, it, expect } from 'vitest';
import { asArray, safeFilter, safeReduce } from './arrays';

describe('Array Utilities', () => {
  describe('asArray', () => {
    it('returns array as-is when input is already an array', () => {
      const input = [1, 2, 3];
      expect(asArray(input)).toBe(input);
      expect(asArray(input)).toEqual([1, 2, 3]);
    });

    it('returns Object.values() when input is an object', () => {
      const input = { a: 1, b: 2, c: 3 };
      expect(asArray(input)).toEqual([1, 2, 3]);
    });

    it('returns empty array for null', () => {
      expect(asArray(null)).toEqual([]);
    });

    it('returns empty array for undefined', () => {
      expect(asArray(undefined)).toEqual([]);
    });

    it('returns empty array for primitive values', () => {
      expect(asArray(123)).toEqual([]);
      expect(asArray('string')).toEqual([]);
      expect(asArray(true)).toEqual([]);
    });

    it('handles nested objects correctly', () => {
      const input = { a: { id: 1 }, b: { id: 2 } };
      const result = asArray(input);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('safeFilter', () => {
    it('filters array normally when input is array', () => {
      const input = [1, 2, 3, 4, 5];
      const result = safeFilter(input, (n: number) => n > 2);
      expect(result).toEqual([3, 4, 5]);
    });

    it('converts object to array then filters', () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = safeFilter(input, (n: number) => n > 1);
      expect(result).toEqual([2, 3]);
    });

    it('returns empty array when filtering null/undefined', () => {
      expect(safeFilter(null, () => true)).toEqual([]);
      expect(safeFilter(undefined, () => true)).toEqual([]);
    });

    it('provides correct index and array to predicate', () => {
      const input = [10, 20, 30];
      const indices: number[] = [];
      const arrays: any[] = [];
      
      safeFilter(input, (item, index, array) => {
        indices.push(index);
        arrays.push(array);
        return true;
      });

      expect(indices).toEqual([0, 1, 2]);
      expect(arrays[0]).toBe(input);
    });
  });

  describe('safeReduce', () => {
    it('reduces array normally when input is array', () => {
      const input = [1, 2, 3, 4];
      const result = safeReduce(input, (acc: number, n: number) => acc + n, 0);
      expect(result).toBe(10);
    });

    it('converts object to array then reduces', () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = safeReduce(input, (acc: number, n: number) => acc + n, 0);
      expect(result).toBe(6);
    });

    it('returns initial value for null/undefined', () => {
      expect(safeReduce(null, (acc, item) => acc, 'initial')).toBe('initial');
      expect(safeReduce(undefined, (acc, item) => acc, 42)).toBe(42);
    });

    it('handles complex reduction operations', () => {
      const input = [
        { name: 'Alice', score: 10 },
        { name: 'Bob', score: 20 },
        { name: 'Charlie', score: 15 }
      ];
      
      const result = safeReduce(
        input,
        (acc: number, person: any) => acc + person.score,
        0
      );
      
      expect(result).toBe(45);
    });

    it('provides correct index and array to reducer', () => {
      const input = ['a', 'b', 'c'];
      const indices: number[] = [];
      
      safeReduce(input, (acc, item, index) => {
        indices.push(index);
        return acc;
      }, null);

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('Edge cases', () => {
    it('handles empty arrays correctly', () => {
      expect(asArray([])).toEqual([]);
      expect(safeFilter([], () => true)).toEqual([]);
      expect(safeReduce([], (acc) => acc, 'initial')).toBe('initial');
    });

    it('handles empty objects correctly', () => {
      expect(asArray({})).toEqual([]);
      expect(safeFilter({}, () => true)).toEqual([]);
      expect(safeReduce({}, (acc) => acc, 'initial')).toBe('initial');
    });

    it('maintains type safety with generics', () => {
      interface User { id: number; name: string; }
      const users: User[] = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      const filtered = safeFilter<User>(users, user => user.id > 1);
      expect(filtered[0].name).toBe('Bob');

      const names = safeReduce<User, string[]>(
        users,
        (acc, user) => [...acc, user.name],
        []
      );
      expect(names).toEqual(['Alice', 'Bob']);
    });
  });
});