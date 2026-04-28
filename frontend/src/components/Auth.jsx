import React, { useState } from 'react';
import { api } from '../api';

const Auth = ({ onLoginSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('POST', '/auth/login', {
        username: formData.loginUsername,
        password: formData.loginPassword
      });
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('POST', '/auth/register', {
        username: formData.regUsername,
        email: formData.regEmail,
        password: formData.regPassword
      });
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {mode === 'login' ? (
        <div className="auth-card">
          <div className="auth-logo">📋</div>
          <h1>Attestatsiya Testi</h1>
          <p className="sub">Akkauntingizga kiring</p>
          {error && <div className="error-msg show">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-input"
              id="loginUsername"
              placeholder="username"
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="form-group">
            <label>Parol</label>
            <input
              className="form-input"
              type="password"
              id="loginPassword"
              placeholder="••••••"
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className="btn btn-primary btn-full" id="btnLogin" disabled={loading} onClick={handleLogin}>
            {loading ? <div className="spinner"></div> : 'Kirish'}
          </button>
          <div className="auth-link">
            Akkaunt yo'qmi? <a onClick={() => { setMode('register'); setError(''); }}>Ro'yxatdan o'tish</a>
          </div>
        </div>
      ) : (
        <div className="auth-card">
          <div className="auth-logo">📋</div>
          <h1>Ro'yxatdan o'tish</h1>
          <p className="sub">Yangi akkaunt yarating</p>
          {error && <div className="error-msg show">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input className="form-input" id="regUsername" placeholder="username" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" id="regEmail" placeholder="email@example.com" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Parol (kamida 6 belgi)</label>
            <input className="form-input" type="password" id="regPassword" placeholder="••••••" onChange={handleChange} />
          </div>
          <button className="btn btn-primary btn-full" id="btnRegister" disabled={loading} onClick={handleRegister}>
            {loading ? <div className="spinner"></div> : "Ro'yxatdan o'tish"}
          </button>
          <div className="auth-link">
            Akkaunt bormi? <a onClick={() => { setMode('login'); setError(''); }}>Kirish</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
