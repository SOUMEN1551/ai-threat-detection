import { useState } from 'react';
import axios from 'axios';
import { API_URL } from './api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegistering) {
      axios.post(`${API_URL}/register`, { username, password })
        .then(() => {
          setMessage('Registered successfully! You can now log in.');
          setIsRegistering(false);
          setLoading(false);
        })
        .catch((err) => {
          setMessage(err.response?.data?.detail || 'Registration failed.');
          setLoading(false);
        });
    } else {
      axios.post(`${API_URL}/login`, { username, password })
        .then((response) => {
          onLoginSuccess(response.data.access_token, username);
          setLoading(false);
        })
        .catch((err) => {
          setMessage(err.response?.data?.detail || 'Login failed.');
          setLoading(false);
        });
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', fontFamily: 'Arial, sans-serif',
      backgroundColor: '#121212', color: '#e0e0e0'
    }}>
      <div style={{
        width: '340px', padding: '35px', border: '1px solid #333',
        borderRadius: '10px', backgroundColor: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>
          🛡️ {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '-8px', marginBottom: '20px' }}>
          Threat Detection Dashboard
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', boxSizing: 'border-box',
                backgroundColor: '#2a2a2a', border: '1px solid #444',
                borderRadius: '6px', color: '#fff', fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', boxSizing: 'border-box',
                backgroundColor: '#2a2a2a', border: '1px solid #444',
                borderRadius: '6px', color: '#fff', fontSize: '14px'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', cursor: 'pointer',
              backgroundColor: '#4488ff', border: 'none', borderRadius: '6px',
              color: '#fff', fontSize: '15px', fontWeight: 'bold'
            }}
          >
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: '15px', padding: '8px', textAlign: 'center',
            color: '#ffaa00', fontSize: '13px', backgroundColor: '#2a2110', borderRadius: '5px'
          }}>
            {message}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#aaa' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}
            style={{ color: '#4488ff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;