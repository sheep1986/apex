import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

export const QuickRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    console.log('QuickRedirect - User:', user);
    
    // For now, just redirect to platform if signed in
    // This bypasses the backend role check
    if (isSignedIn && user) {
      console.log('Redirecting to platform dashboard...');
      setTimeout(() => {
        navigate('/platform', { replace: true });
      }, 1000);
    }
  }, [isSignedIn, user, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#111',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
          Redirecting to Platform Dashboard...
        </h1>
        <p style={{ color: '#999' }}>
          {user?.emailAddresses?.[0]?.emailAddress}
        </p>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/platform')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Platform Now
          </button>
        </div>
      </div>
    </div>
  );
};