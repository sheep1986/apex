// Mock authentication hook for development mode
export const useMockAuth = () => {
  const mockUser = {
    id: 'dev-user-1',
    firstName: 'Dev',
    lastName: 'User',
    primaryEmailAddress: {
      emailAddress: 'dev@example.com',
    },
    createdAt: new Date(),
  };

  const mockAuth = {
    getToken: async () => 'mock-dev-token',
    signOut: async () => console.log('Mock sign out'),
    isSignedIn: true,
    isLoaded: true,
  };

  return {
    user: mockUser,
    auth: mockAuth,
    isSignedIn: true,
    isLoaded: true,
  };
};
