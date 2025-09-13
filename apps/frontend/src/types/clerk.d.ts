// Clerk types for window object
interface Window {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>;
      userId?: string;
    };
    user?: any;
    loaded?: boolean;
  };
}