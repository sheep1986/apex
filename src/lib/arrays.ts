/**
 * Array utility functions for safe array operations
 */

/**
 * Ensures a value is always an array
 * - If already an array, returns as-is
 * - If object, returns Object.values()
 * - Otherwise returns empty array
 */
export const asArray = <T = any>(v: unknown): T[] => {
  if (Array.isArray(v)) {
    return v as T[];
  }
  if (v && typeof v === 'object' && v !== null) {
    return Object.values(v as Record<string, any>) as T[];
  }
  return [];
};

/**
 * Safe filter operation that ensures value is an array first
 */
export const safeFilter = <T>(
  value: unknown,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] => {
  return asArray<T>(value).filter(predicate);
};

/**
 * Safe reduce operation that ensures value is an array first
 */
export const safeReduce = <T, R>(
  value: unknown,
  reducer: (acc: R, item: T, index: number, array: T[]) => R,
  initialValue: R
): R => {
  return asArray<T>(value).reduce(reducer, initialValue);
};