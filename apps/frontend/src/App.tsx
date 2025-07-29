import React from 'react';

function App() {
    return (
          <div style={{
                  minHeight: '100vh',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Arial, sans-serif'
          }}>
                <div style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '90%'
          }}>
                        <h1 style={{
                      color: '#333',
                      marginBottom: '1rem',
                      fontSize: '2.5rem'
          }}>
                                  🚀 Apex AI
                                </h1>h1>
                        <p style={{
                      color: '#666',
                      marginBottom: '2rem',
                      fontSize: '1.2rem'
          }}>
                                  AI Calling Platform
                                </p>p>
                        <button 
                                    onClick={() => window.location.href = 'https://czzwajac.manus.space'}
                                    style={{
                                                  background: '#667eea',
                                                  color: 'white',
                                                  border: 'none',
                                                  padding: '1rem 2rem',
                                                  borderRadius: '8px',
                                                  fontSize: '1.1rem',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#5a67d8'}
                                    onMouseOut={(e) => e.target.style.background = '#667eea'}
                                  >
                                  Access Authentication
                                </button>button>
                        <p style={{
                      marginTop: '1rem',
                      fontSize: '0.9rem',
                      color: '#999'
          }}>
                                  Click above to access the secure login system
                                </p>p>
                      </div>div>
              </div>div>
        );
}

export default App;</div>
