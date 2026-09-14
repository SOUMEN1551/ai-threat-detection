import { useState } from 'react';
import axios from 'axios';

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
      axios.post('http://127.0.0.1:8000/register', { username, password })
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
      axios.post('http://127.0.0.1:8000/login', { username, password })
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
      height: '100vh', fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ width: '320px', padding: '30px', border: '1px solid #444', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center' }}>🛡️ {isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        {message && <p style={{ marginTop: '10px', color: '#ffaa00', fontSize: '14px' }}>{message}</p>}

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}
            style={{ color: '#4488ff', cursor: 'pointer' }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;