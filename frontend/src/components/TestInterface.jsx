import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Calculator from './Calculator';
import Modal from './Modal';

const TestInterface = ({ test, attemptId, initialQuestions, initialAnswers = {}, initialFinished = false, onFinish, onBackToDashboard }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
  const [finished, setFinished] = useState(initialFinished);
  const [showCalc, setShowCalc] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!finished && !initialFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [finished, initialFinished]);

  const handleSelectOption = async (optionId) => {
    if (finished) return;
    const newAnswers = { ...answers, [currentIndex]: optionId };
    setAnswers(newAnswers);

    try {
      await api('POST', `/tests/attempt/${attemptId}/answer`, {
        question_id: questions[currentIndex].id,
        option_id: optionId
      });
    } catch (e) { console.error(e); }
  };

  const handleFinish = async () => {
    try {
      const data = await api('POST', `/tests/attempt/${attemptId}/finish`);
      setResult(data);
      setFinished(true);
      setShowFinishModal(false);
    } catch (e) { alert(e.message); }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="test-interface-root">
      <div className="test-topbar">
        <div className="navbar-brand">📝 {test.title}</div>
        {!finished && (
          <div className={`timer-box ${timeLeft < 300 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="navbar-right">
          <button className="btn btn-sm btn-ghost" onClick={() => setShowCalc(!showCalc)}>🧮 Kalkulyator</button>
          <button className="btn btn-sm btn-primary" onClick={onBackToDashboard}>Dashboard</button>
        </div>
      </div>

      <div className="test-main">
        <div className="test-left">
          <div className="subject-label">Savollar</div>
          <div className="question-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`q-btn ${currentIndex === i ? 'current' : ''} ${answers[i] ? 'answered' : ''}`}
                onClick={() => setCurrentIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            {!finished && (
              <button className="btn btn-danger btn-full" onClick={() => setShowFinishModal(true)}>
                Tugatish
              </button>
            )}
          </div>
        </div>

        <div className="test-center">
          <div className="question-card">
            <div className="q-badge">Savol #{currentIndex + 1}</div>
            <div className="question-text">{currentQuestion?.text}</div>
            {currentQuestion?.image_url && (
              <img src={currentQuestion.image_url} alt="Question" style={{ maxWidth: '100%', marginBottom: '1.5rem', borderRadius: '8px' }} />
            )}
            <div className="answers-list">
              {currentQuestion?.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`answer-opt ${answers[currentIndex] === opt.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(opt.id)}
                >
                  <div className="radio"></div>
                  {opt.text}
                </div>
              ))}
            </div>
          </div>

          <div className="test-nav">
            <button
              className="btn btn-ghost"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              ⬅️ Oldingi
            </button>
            <button
              className="btn btn-primary"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
            >
              Keyingisi ➡️
            </button>
          </div>
        </div>
      </div>

      <Calculator isOpen={showCalc} onClose={() => setShowCalc(false)} />

      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Testni tugatish"
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setShowFinishModal(false)}>Davom etish</button>
            <button className="btn btn-danger" onClick={handleFinish}>Ha, tugatish</button>
          </>
        )}
      >
        Haqiqatdan ham testni yakunlamoqchimisiz?
      </Modal>

      <Modal
        isOpen={finished && result !== null}
        onClose={onBackToDashboard}
        title="Test yakunlandi"
        footer={<button className="btn btn-primary" onClick={onBackToDashboard}>Yopish</button>}
      >
        <div className="result-big">
          <div className="result-score">{result?.score} / {result?.total}</div>
          <p>Sizning natijangiz</p>
          <div className="result-stats">
            <span className="badge badge-active">To'g'ri: {result?.score}</span>
            <span className="badge badge-blocked">Xato: {result?.total - result?.score}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestInterface;
