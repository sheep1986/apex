import React, { useEffect } from 'react';

function App() {
              useEffect(() => {
                              // Redirect to the working authentication system
                            window.location.href = 'https://czzwajac.manus.space';
              }, []);

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
                                          Redirecting to Authentication...
                                        </p>p>
                                <div style={{
                                        display: 'inline-block',
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f3f3',
                                        borderTop: '4px solid #667eea',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                  }}></div>div>
                                <p style={{
                                        marginTop: '1rem',
                                        fontSize: '0.9rem',
                                        color: '#999'
                  }}>
                                          If you're not redirected automatically, 
                                          <a href="https://czzwajac.manus.space" style={{color: '#667eea', textDecoration: 'none'}}>
                                                      click here
                                                    </a>a>
                                        </p>p>
                              </div>div>
                        <style>{`
                                @keyframes spin {
                                          0% { transform: rotate(0deg); }
                                                    100% { transform: rotate(360deg); }
                                                            }
                                                                  `}</style>style>
                      </div>div>
                );
}

export default App;</div>
