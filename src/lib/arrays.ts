/**
 * Array utility functions for safe array operations
 */

// Type guard for array checking
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

// Type for extracting array element type
type ArrayElement<T> = T extends readonly (infer U)[] ? U : T;

/**
 * Ensures a value is always an array with proper type inference
 * - If already an array, returns as-is with proper typing
 * - If object, returns Object.values()
 * - Otherwise returns empty array
 * 
 * @example
 * const data: unknown = await api.get('/users');
 * const users = asArray<User>(data); // User[]
 */
export function asArray<T>(value: T[]): T[];
export function asArray<T>(value: Record<string, T>): T[];
export function asArray<T>(value: unknown): T[];
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, any>) as T[];
  }
  return [];
}

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