import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Calculator from './Calculator';
import Modal from './Modal';

const TestInterface = ({ user, test, attemptId, initialQuestions, initialAnswers = {}, initialFinished = false, onFinish, onBackToDashboard }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
  const [finished, setFinished] = useState(initialFinished);
  const [showCalc, setShowCalc] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
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

  const handleSelectOption = (optionId) => {
    if (finished) return;
    const newAnswers = { ...answers, [currentIndex]: optionId };
    setAnswers(newAnswers);
  };

  const handleFinish = async () => {
    try {
      const formattedAnswers = Object.keys(answers).map(idx => ({
        question_id: questions[idx].id,
        selected_option_id: answers[idx]
      }));

      const data = await api('POST', `/tests/${test.id}/finish/${attemptId}`, {
        answers: formattedAnswers
      });

      // Update answers with correctness for grid highlighting
      const updatedAnswers = { ...answers };
      data.answers.forEach(ansResult => {
          const gIdx = questions.findIndex(q => q.id === ansResult.question_id);
          if (gIdx !== -1) {
              updatedAnswers[gIdx] = {
                  id: ansResult.selected_option_id,
                  correct: ansResult.is_correct
              };
          }
      });
      setAnswers(updatedAnswers);

      setResult(data);
      setFinished(true);
      setShowFinishModal(false);
    } catch (e) { alert(e.message); }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) return;
    setIsSubmittingComplaint(true);
    try {
      await api('POST', '/complaints/', {
        test_id: test.id,
        question_id: currentQuestion?.id,
        text: complaintText
      });
      alert('Shikoyatingiz qabul qilindi');
      setComplaintText('');
      setShowComplaintModal(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rs = s % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const subjectName = test?.subject_name || 'INFORMATIKA';

  const subjectQuestions = questions.filter(q => !q.is_pedagogy);
  const pedagogyQuestions = questions.filter(q => q.is_pedagogy);

  const getGlobalIndex = (qId) => questions.findIndex(q => q.id === qId);

  const currentQuestion = questions[currentIndex];

  const getQBtnClass = (idx) => {
    let cls = 'q-btn';
    if (currentIndex === idx) cls += ' current';

    if (finished) {
        const ans = answers[idx];
        if (ans) {
            if (typeof ans === 'object') {
                cls += ans.correct ? ' correct' : ' incorrect';
            } else {
                // This shouldn't happen with the way review answers are set, but for safety
                cls += ' answered';
            }
        }
    } else {
        if (answers[idx]) cls += ' answered';
    }
    return cls;
  };

  return (
    <div className="test-interface-root">
      <div className="test-topbar">
        <div className="user-badge">{user?.username || 'User'}</div>
        <div className="test-title-center">{test.title}</div>
        <div className="timer-box">
          <span role="img" aria-label="timer">⏰</span>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="test-main">
        <div className="test-sidebar-left">
          <div className="sidebar-section-title">
             <span style={{color: '#3b82f6'}}>■</span> {subjectName.toUpperCase()} ({subjectQuestions.length})
          </div>
          <div className="question-grid">
            {subjectQuestions.map((q, i) => {
                const gIdx = getGlobalIndex(q.id);
                return (
                  <button
                    key={q.id}
                    className={getQBtnClass(gIdx)}
                    onClick={() => setCurrentIndex(gIdx)}
                  >
                    {i + 1}
                  </button>
                );
            })}
          </div>

          <div className="sidebar-section-title">
             <span style={{color: '#10b981'}}>■</span> PEDAGOGIKA ({pedagogyQuestions.length})
          </div>
          <div className="question-grid">
            {pedagogyQuestions.map((q, i) => {
                const gIdx = getGlobalIndex(q.id);
                return (
                  <button
                    key={q.id}
                    className={getQBtnClass(gIdx)}
                    onClick={() => setCurrentIndex(gIdx)}
                  >
                    {subjectQuestions.length + i + 1}
                  </button>
                );
            })}
          </div>

          <div className="grid-legend">
             <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#bfdbfe', border: '1px solid #93c5fd'}}></div> Javobsiz</div>
             <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#22c55e'}}></div> Javoblandi</div>
          </div>
        </div>

        <div className="test-content-center">
          <div className="question-area">
            <div className="q-header-badges">
              <div className="badge-q-num">Savol {currentIndex + 1}</div>
              <div className="badge-subject">
                <span style={{color: '#3b82f6'}}>■</span> {currentQuestion?.is_pedagogy ? 'Pedagogika' : subjectName}
              </div>
            </div>

            <div className="question-text-display">
              {currentQuestion?.text || currentQuestion?.question_text}
            </div>

            {currentQuestion?.image_url && (
              <img src={currentQuestion.image_url} alt="Question" style={{ maxWidth: '100%', marginBottom: '1.5rem', borderRadius: '8px' }} />
            )}

            <div className="options-container">
              {currentQuestion?.options.map((opt) => {
                let optClass = 'option-item';
                const isSelected = (answers[currentIndex]?.id || answers[currentIndex]) === opt.id;
                if (isSelected) optClass += ' selected';

                if (finished) {
                    if (opt.is_correct) optClass += ' correct-review';
                    else if (isSelected && !opt.is_correct) optClass += ' incorrect-review';
                }

                return (
                  <div
                    key={opt.id}
                    className={optClass}
                    onClick={() => handleSelectOption(opt.id)}
                  >
                    <div className="option-radio"></div>
                    {opt.text || opt.option_text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="nav-footer">
            <button
              className="btn-nav"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              ◀ Oldingi
            </button>
            <div style={{fontWeight: 700, color: '#94a3b8'}}>{currentIndex + 1} / {questions.length}</div>
            <button
              className="btn-nav"
              style={{backgroundColor: '#108a55', color: '#fff'}}
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
            >
              Keyingisi ▶
            </button>
          </div>
        </div>

        <div className="test-sidebar-right">
           <div className="calc-btn-circle" onClick={() => setShowCalc(true)}>
              <span style={{fontSize: '1.5rem'}}>🖩</span>
              <span>Kalku-</span>
              <span>lyator</span>
           </div>

           <div className="shikoyat-btn" onClick={() => setShowComplaintModal(true)}>
              <div style={{fontSize: '1.2rem'}}>⚠️ Shikoyat</div>
              <div style={{fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px'}}>Savol bo'yicha shikoyat</div>
           </div>

           {!finished && (
             <button className="finish-test-btn" onClick={() => setShowFinishModal(true)}>
                <span style={{fontSize: '1.2rem'}}>✔️</span>
                <span>Testni</span>
                <span>tugatish</span>
             </button>
           )}
           {finished && (
             <button className="btn btn-primary" onClick={onBackToDashboard}>
                Chiqish
             </button>
           )}
        </div>
      </div>

      <Calculator isOpen={showCalc} onClose={() => setShowCalc(false)} />

      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Testni tugatish"
        footer={(
          <>
            <button className="btn" style={{background: '#e2e8f0'}} onClick={() => setShowFinishModal(false)}>Davom etish</button>
            <button className="btn btn-danger" onClick={handleFinish}>Ha, tugatish</button>
          </>
        )}
      >
        Haqiqatdan ham testni yakunlamoqchimisiz?
      </Modal>

      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="Savol bo'yicha shikoyat"
        footer={(
          <>
            <button className="btn" onClick={() => setShowComplaintModal(false)}>Bekor qilish</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmitComplaint}
              disabled={isSubmittingComplaint || !complaintText.trim()}
            >
              {isSubmittingComplaint ? <span className="spinner"></span> : 'Yuborish'}
            </button>
          </>
        )}
      >
        <div className="form-group">
          <label>Savol bo'yicha e'tirozingizni yozing:</label>
          <textarea
            className="form-input"
            rows="4"
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Shikoyat matni..."
          ></textarea>
        </div>
      </Modal>

      <Modal
        isOpen={finished && result !== null}
        onClose={onBackToDashboard}
        title="Test yakunlandi"
        footer={<button className="btn btn-primary" onClick={onBackToDashboard}>Natijalarni ko'rish</button>}
      >
        <div className="result-big" style={{textAlign: 'center', padding: '1rem'}}>
          <div className="result-score" style={{fontSize: '3rem', fontWeight: 800, color: '#108a55'}}>{result?.score} / {result?.total}</div>
          <p style={{fontSize: '1.2rem', fontWeight: 600, color: '#64748b'}}>Sizning natijangiz: {result?.percent}%</p>
        </div>
      </Modal>
    </div>
  );
};

export default TestInterface;
