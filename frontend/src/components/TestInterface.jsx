import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Calculator from './Calculator';
import Modal from './Modal';

const TestInterface = ({ test, attemptId, initialQuestions, initialAnswers, initialFinished, onFinish, onBackToDashboard }) => {
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [curIdx, setCurIdx] = useState(0);
  const [finished, setFinished] = useState(initialFinished || false);
  const [timerSec, setTimerSec] = useState(test ? test.duration_minutes * 60 : 0);
  const [showCalc, setShowCalc] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let interval;
    if (!finished && timerSec > 0) {
      interval = setInterval(() => {
        setTimerSec((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [finished, timerSec]);

  const handleFinish = async () => {
    setShowFinishModal(false);
    setFinished(true);
    const finalAnswers = questions.map((q, i) => ({
      question_id: q.id,
      selected_option_id: answers[i]?.id || null
    }));

    try {
      const res = await api('POST', `/tests/${test.id}/finish/${attemptId}`, { answers: finalAnswers });
      setResult(res);
    } catch (e) {
      alert('Yakunlashda xatolik: ' + e.message);
    }
  };

  const handleSelectOption = (opt) => {
    if (finished) return;
    setAnswers({ ...answers, [curIdx]: { id: opt.id, correct: opt.is_correct } });
  };

  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(timerSec / 3600), m = Math.floor((timerSec % 3600) / 60), s = timerSec % 60;

  const timerClass = `timer-box ${timerSec <= 300 ? 'danger' : timerSec <= 600 ? 'warning' : ''}`;

  const currentQ = questions[curIdx];

  return (
    <div id="testInterface" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="test-topbar">
        <div className="test-topbar-user">Foydalanuvchi</div>
        <div style={{ fontWeight: 700, fontSize: '15px', opacity: 0.9 }}>{test?.title || 'Review'}</div>
        <div className={timerClass} id="timerBox">
          ⏱ <span>{finished ? '--:--:--' : `${pad(h)}:${pad(m)}:${pad(s)}`}</span>
        </div>
      </div>
      <div className="test-main">
        <div className="test-left">
          <div className="subject-label">📘 Savollar</div>
          <div className="question-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`q-btn ${finished ? (answers[i] === undefined ? 'r-skip' : answers[i].correct ? 'r-correct' : 'r-wrong') : (answers[i] !== undefined ? 'answered' : '')} ${i === curIdx ? 'current' : ''}`}
                onClick={() => setCurIdx(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="test-center">
          <div className="question-card">
            <div className="question-header">
              <span className="q-badge">Savol {curIdx + 1}</span>
            </div>
            <div className="question-body">
              {currentQ?.image_url && (
                <img src={currentQ.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} alt="question" />
              )}
              <div className="question-text">{currentQ?.text}</div>
              <div className="answers-list">
                {currentQ?.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`answer-opt ${finished ? (opt.is_correct ? 'opt-correct' : (answers[curIdx]?.id === opt.id ? 'opt-wrong' : 'opt-dim')) : (answers[curIdx]?.id === opt.id ? 'selected' : '')}`}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <div className="radio"></div>
                    <span>{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="test-nav">
            <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setCurIdx(Math.max(0, curIdx - 1))}>◀ Oldingi</button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>{curIdx + 1} / {questions.length}</span>
            <button className="btn btn-primary" onClick={() => setCurIdx(Math.min(questions.length - 1, curIdx + 1))}>Keyingi ▶</button>
          </div>
        </div>
        <div className="test-right">
          {!finished && <button className="calc-toggle" onClick={() => setShowCalc(!showCalc)}>🖩<br />Kalku-<br />lyator</button>}
          <div style={{ flex: 1 }}></div>
          <div style={{ width: '100%' }}>
            {finished ? (
              <button className="right-btn" onClick={onBackToDashboard}>🏠 Dashboard</button>
            ) : (
              <button className="right-btn finish-btn" onClick={() => setShowFinishModal(true)}>✅ Testni<br />tugatish</button>
            )}
          </div>
        </div>
      </div>

      <Calculator isOpen={showCalc} onClose={() => setShowCalc(false)} />

      <Modal
        id="modalFinish"
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="✅ Testni yakunlash"
        footer={(
          <>
            <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowFinishModal(false)}>Davom etish</button>
            <button className="btn btn-danger" onClick={handleFinish}>Ha, yakunlash</button>
          </>
        )}
      >
        <p><strong>{questions.length - Object.keys(answers).length}</strong> ta savolga javob berilmagan. Testni yakunlashni tasdiqlaysizmi?</p>
      </Modal>

      {result && (
        <Modal id="modalResult" isOpen={!!result} onClose={() => setResult(null)} title="Test Natijasi">
          <div className="result-big">
            <div className="result-score">{result.score}</div>
            <div style={{ fontSize: '15px', color: 'var(--muted)', margin: '6px 0 16px' }}>ball to'plandi</div>
            <div className="result-stats">
              <div className="stat-card"><div className="stat-val" style={{ color: 'var(--success)' }}>{result.score}</div><div className="stat-lbl">✅ To'g'ri</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: 'var(--danger)' }}>{result.total - result.score}</div><div className="stat-lbl">❌ Xato/Skip</div></div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setResult(null)}>📋 Javoblarni ko'rish</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TestInterface;
