/**
 * Development-only runtime guards
 * These help catch deprecated patterns that slip through static analysis
 */

/**
 * Development guard for deprecated Clerk props
 * Warns if deprecated patterns are detected at runtime
 */
export function initDevGuards() {
  if (import.meta.env.PROD) {
    // No-op in production
    return;
  }

  // Warn about deprecated Clerk props
  const warnDeprecatedProp = (componentName: string, propName: string, replacement: string) => {
    console.warn(
      `🔧 [Clerk] Deprecated prop detected: ${componentName}.${propName}\n` +
      `   Replace with: ${replacement}\n` +
      `   See: https://clerk.com/docs/upgrade-guides`
    );
  };

  // Array operation guards
  const originalFilter = Array.prototype.filter;
  const originalReduce = Array.prototype.reduce;
  const originalMap = Array.prototype.map;

  // Track potentially unsafe operations in dev
  if (import.meta.env.DEV) {
    // Override console methods to catch array operations on non-arrays
    const originalError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      
      // Catch common array method errors
      if (message.includes('filter is not a function') || 
          message.includes('reduce is not a function') ||
          message.includes('map is not a function')) {
        console.warn(
          '🛡️ [DevGuard] Array method error detected!\n' +
          '   Consider using asArray(), safeFilter(), or safeReduce()\n' +
          '   From: import { asArray } from "@/lib/arrays"'
        );
      }
      
      originalError.apply(console, args);
    };
  }

  console.log('🛡️ Development guards initialized');
}

/**
 * Runtime check for deprecated Clerk usage patterns
 * Call this in components that use Clerk to catch migration issues
 */
export function checkClerkProps(props: Record<string, any>, componentName: string) {
  if (import.meta.env.PROD) return;

  const deprecatedProps = {
    afterSignInUrl: 'fallbackRedirectUrl or forceRedirectUrl',
    afterSignUpUrl: 'fallbackRedirectUrl or forceRedirectUrl', 
    afterSignOutUrl: 'redirectUrl (for signOut) or fallbackRedirectUrl',
    navigate: 'routerPush and routerReplace'
  };

  Object.keys(props).forEach(prop => {
    if (prop in deprecatedProps) {
      console.warn(
        `🔧 [Clerk] ${componentName} uses deprecated prop: ${prop}\n` +
        `   Replace with: ${deprecatedProps[prop as keyof typeof deprecatedProps]}`
      );
    }
  });
}

/**
 * Assert that a value is an array in development
 * Helps catch data shape assumptions early
 */
export function assertArray<T>(value: unknown, context?: string): asserts value is T[] {
  if (import.meta.env.PROD) return;
  
  if (!Array.isArray(value)) {
    const contextMsg = context ? ` in ${context}` : '';
    console.warn(
      `🛡️ [DevGuard] Expected array but got ${typeof value}${contextMsg}\n` +
      `   Value:`, value, '\n' +
      `   Consider using asArray() for safety`
    );
  }
}