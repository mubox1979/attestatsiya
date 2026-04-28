import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';

const EditorPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    addQText: '',
    addQImage: '',
    options: ['', '', '', ''],
    correctOpt: null
  });

  useEffect(() => {
    loadEditorData();
  }, []);

  useEffect(() => {
    if (selectedTestId) loadEditorQuestions();
  }, [selectedTestId]);

  const loadEditorData = async () => {
    try {
      const data = await api('GET', '/tests/my-subject');
      setTests(data);
    } catch (e) { console.error(e); }
  };

  const loadEditorQuestions = async () => {
    try {
      const data = await api('GET', `/questions/test/${selectedTestId}`);
      setQuestions(data);
    } catch (e) { alert(e.message); }
  };

  const handleSubmitQuestion = async () => {
    const { addQText, addQImage, options, correctOpt } = formData;
    if (!selectedTestId || !addQText || correctOpt === null) return alert('Barcha maydonlarni toʼldiring');

    const finalOptions = options.map((txt, i) => ({
      option_text: txt,
      is_correct: i === parseInt(correctOpt)
    }));

    try {
      await api('POST', '/questions/', {
        test_id: parseInt(selectedTestId),
        question_text: addQText,
        image_url: addQImage || null,
        options: finalOptions
      });
      alert('Savol saqlandi');
      setFormData({ addQText: '', addQImage: '', options: ['', '', '', ''], correctOpt: null });
    } catch (e) { alert(e.message); }
  };

  const menuItems = [
    { id: 'questions', label: 'Savollar', active: activeTab === 'questions', onClick: () => setActiveTab('questions') },
    { id: 'addQuestion', label: '+ Savol qo\'shish', active: activeTab === 'addQuestion', onClick: () => setActiveTab('addQuestion') },
  ];

  return (
    <div id="pageEditor">
      <Navbar brand="✏️ Muharrir Panel" menuItems={menuItems} onLogout={onLogout} />
      <div className="container">
        {activeTab === 'questions' && (
          <div id="editorTabQuestions">
            <div className="page-title">📝 Savollar bazasi</div>
            <div id="editorTestSelect" style={{ marginBottom: '16px' }}>
              <select className="form-input" style={{ maxWidth: '300px' }} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                <option value="">-- Test tanlang --</option>
                {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div id="questionsList">
              {questions.map(q => (
                <div key={q.id} className="q-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="q-item-text">{q.question_text}</div>
                    <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm('O\'chirish?')) { await api('DELETE', `/questions/${q.id}`); loadEditorQuestions(); } }}>O'chirish</button>
                  </div>
                  <div className="q-options">
                    {q.options.map((o, idx) => (
                      <div key={idx} className={`q-option ${o.is_correct ? 'correct' : ''}`}>{o.is_correct ? '✅' : '○'} {o.text}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'addQuestion' && (
          <div id="editorTabAddQuestion">
            <div className="page-title">➕ Yangi savol qo'shish</div>
            <div className="card" style={{ maxWidth: '600px' }}>
              <div className="form-group">
                <label>Test</label>
                <select className="form-input" value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                  <option value="">-- Test tanlang --</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Savol matni</label>
                <textarea className="form-input" rows="3" value={formData.addQText} onChange={(e) => setFormData({ ...formData, addQText: e.target.value })}></textarea>
              </div>
              <div className="form-group">
                <label>Rasm URL</label>
                <input className="form-input" value={formData.addQImage} onChange={(e) => setFormData({ ...formData, addQImage: e.target.value })} />
              </div>
              <div className="card-title">Javoblar</div>
              {formData.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input type="radio" name="correctOpt" value={i} checked={formData.correctOpt == i} onChange={(e) => setFormData({ ...formData, correctOpt: e.target.value })} />
                  <input className="form-input" style={{ flex: 1 }} value={opt} onChange={(e) => {
                    const newOpts = [...formData.options];
                    newOpts[i] = e.target.value;
                    setFormData({ ...formData, options: newOpts });
                  }} />
                </div>
              ))}
              <button className="btn btn-primary btn-full" onClick={handleSubmitQuestion}>✅ Saqlash</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
