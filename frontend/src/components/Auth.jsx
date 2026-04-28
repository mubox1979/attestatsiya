import React, { useState } from 'react';
import { api } from '../api';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const data = await api('POST', '/auth/login', { username, password });
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user, data.token);
      } else {
        const data = await api('POST', '/auth/register', { username, email, password });
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1>{isLogin ? "Hush kelibsiz" : "Ro'yxatdan o'tish"}</h1>
        <p className="sub">
          {isLogin
            ? "Tizimga kirish uchun ma'lumotlaringizni kiriting"
            : "Yangi akkaunt yaratish uchun ma'lumotlarni to'ldiring"}
        </p>

        {error && <div className="error-msg show">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Foydalanuvchi nomi"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Elektron pochta"
              />
            </div>
          )}

          <div className="form-group">
            <label>Parol</label>
            <input
              className="form-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : (isLogin ? "Kirish" : "Ro'yxatdan o'tish")}
          </button>
        </form>

        <div className="auth-link">
          {isLogin ? "Akkauntingiz yo'qmi? " : "Akkauntingiz bormi? "}
          <a onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? "Ro'yxatdan o'tish" : "Kirish"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
