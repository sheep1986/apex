export const TestPlatform = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Platform Dashboard
      </h1>
      <p>Welcome to the platform owner dashboard!</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/dashboard" style={{ color: '#10b981', textDecoration: 'underline' }}>
          Go to Client Dashboard
        </a>
      </div>
    </div>
  );
};