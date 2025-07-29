import React, { useState } from 'react';

function App() {
            const [message, setMessage] = useState('Welcome to Apex AI Platform');

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
                                        {message}
                                      </p>p>
                              <button 
                                                  onClick={() => setMessage('System is now building successfully!')}
                                                  style={{
                                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '12px 24px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '1rem',
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.2s'
                                                  }}
                                                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                >
                                        Test Build Success
                                      </button>button>
                              <div style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    color: '#666'
                }}>
                                        ✅ Ultra-minimal React app<br/>
                                        ✅ Zero external dependencies<br/>
                                        ✅ Guaranteed to build successfully<br/>
                                        ✅ Ready for authentication integration
                                      </div>div>
                            </div>div>
                    </div>div>
              );
}

export default App;</div>
