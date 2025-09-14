import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const DirectRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to platform dashboard
    navigate('/platform', { replace: true });
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
          Redirecting to Platform...
        </h1>
      </div>
    </div>
  );
};