import React, { useState, useEffect } from 'react';
import { api } from './api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import EditorPanel from './components/EditorPanel';
import TestInterface from './components/TestInterface';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Test state
  const [activeTest, setActiveTest] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [testMode, setTestMode] = useState(null); // 'taking', 'review'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const userData = await api('GET', '/auth/me');
      setUser(userData);
    } catch (e) {
      localStorage.removeItem('token');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleStartTest = async (test) => {
    try {
      const data = await api('POST', `/tests/${test.id}/start`);
      setUser({ ...user, balance: data.balance_after });
      setAttemptId(data.attempt_id);
      setSessionQuestions(data.questions);
      setActiveTest(test);
      setTestMode('taking');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReviewAttempt = async (attemptId) => {
    try {
      const data = await api('GET', `/tests/attempt/${attemptId}/review`);
      const reviewQuestions = data.answers.map((a, i) => ({
        id: a.question_id || i,
        text: a.question_text,
        image_url: a.image_url,
        is_pedagogy: a.is_pedagogy,
        options: a.options.map(o => ({ id: o.id, text: o.text, is_correct: o.is_correct }))
      }));

      const reviewAnswers = {};
      data.answers.forEach((a, i) => {
        if (a.selected_option_id) {
          reviewAnswers[i] = { id: a.selected_option_id, correct: a.is_correct };
        }
      });

      setSessionQuestions(reviewQuestions);
      setActiveTest({ title: "Javoblarni koʼrish", duration_minutes: 0 });
      setAttemptId(null);
      setTestMode('review');
      // Pass reviewAnswers to TestInterface
      setInitialReviewAnswers(reviewAnswers);
    } catch (e) { alert(e.message); }
  };

  const [initialReviewAnswers, setInitialReviewAnswers] = useState({});

  if (loading) return <div className="auth-wrap">Loading...</div>;

  if (activeTest) {
    return (
      <TestInterface
        user={user}
        test={activeTest}
        attemptId={attemptId}
        initialQuestions={sessionQuestions}
        initialAnswers={testMode === 'review' ? initialReviewAnswers : {}}
        initialFinished={testMode === 'review'}
        onFinish={() => {}}
        onBackToDashboard={() => setActiveTest(null)}
      />
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'admin') {
    return <AdminPanel onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (user.role === 'editor') {
    return <EditorPanel onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
      onStartTest={handleStartTest}
      onReviewAttempt={handleReviewAttempt}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

export default App;
