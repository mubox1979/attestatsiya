import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';

const EditorPanel = ({ user, onLogout, theme, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    addQText: '',
    addQImage: '',
    isPedagogy: false,
    options: ['', '', '', ''],
    correctOpt: null,
    // Test data
    testTitle: '',
    testDesc: '',
    testPrice: 5000,
    testDuration: 120,
    testInfoCount: 40,
    testPedCount: 10
  });

  useEffect(() => {
    loadEditorData();
  }, []);

  useEffect(() => {
    if (selectedTestId) loadEditorQuestions();
  }, [selectedTestId]);

  const loadEditorData = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/tests/my-subject');
      setTests(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadEditorQuestions = async () => {
    setLoading(true);
    try {
      const data = await api('GET', `/questions/test/${selectedTestId}`);
      setQuestions(data);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleSubmitQuestion = async () => {
    const { addQText, addQImage, isPedagogy, options, correctOpt } = formData;
    if (!selectedTestId || !addQText || correctOpt === null) return alert('Barcha maydonlarni toʼldiring');

    const finalOptions = options.map((txt, i) => ({
      option_text: txt,
      is_correct: i === parseInt(correctOpt)
    }));

    setLoading(true);
    try {
      await api('POST', '/questions/', {
        test_id: parseInt(selectedTestId),
        question_text: addQText,
        image_url: addQImage || null,
        is_pedagogy: isPedagogy,
        options: finalOptions
      });
      alert('Savol saqlandi');
      setFormData({ ...formData, addQText: '', addQImage: '', isPedagogy: false, options: ['', '', '', ''], correctOpt: null });
      loadEditorQuestions();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleCreateTestReal = async () => {
    const { testTitle, testDesc, testPrice, testDuration, testInfoCount, testPedCount } = formData;
    if (!testTitle) return alert('Test nomini kiriting');
    setLoading(true);
    try {
        await api('POST', '/tests/', {
            subject_id: user.subject_id,
            title: testTitle,
            description: testDesc,
            price: testPrice,
            duration_minutes: testDuration,
            info_count: testInfoCount,
            ped_count: testPedCount
        });
        alert('Test yaratildi');
        setActiveTab('tests');
        loadEditorData();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const menuItems = [
    { id: 'questions', label: 'Savollar', active: activeTab === 'questions', onClick: () => setActiveTab('questions') },
    { id: 'addQuestion', label: '+ Savol qo\'shish', active: activeTab === 'addQuestion', onClick: () => setActiveTab('addQuestion') },
    { id: 'tests', label: 'Testlarim', active: activeTab === 'tests', onClick: () => setActiveTab('tests') },
    { id: 'addTest', label: '+ Test yaratish', active: activeTab === 'addTest', onClick: () => setActiveTab('addTest') },
  ];

  return (
    <div id="pageEditor">
      <Navbar brand="✏️ Muharrir Panel" menuItems={menuItems} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="container">
        {loading && <div className="loading-bar"></div>}
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
                    <div>
                      <div className="q-item-text">{q.question_text}</div>
                      {q.is_pedagogy && <span className="badge" style={{ background: '#e2e8f0', color: '#475569', fontSize: '10px' }}>Pedagogika</span>}
                    </div>
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="isPedagogy" checked={formData.isPedagogy} onChange={(e) => setFormData({ ...formData, isPedagogy: e.target.checked })} />
                <label htmlFor="isPedagogy" style={{ marginBottom: 0 }}>Pedagogika savoli</label>
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
              <button className="btn btn-primary btn-full" disabled={loading} onClick={handleSubmitQuestion}>{loading ? <span className="spinner"></span> : '✅ Saqlash'}</button>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div id="editorTabTests">
             <div className="page-title">📚 Mening testlarim</div>
             <div className="card">
                <div className="table-wrap">
                   <table>
                      <thead><tr><th>Nomi</th><th>Narxi</th><th>Vaqt</th><th>Savollar</th><th>Amallar</th></tr></thead>
                      <tbody>
                         {tests.map(t => (
                           <tr key={t.id}>
                              <td><strong>{t.title}</strong></td>
                              <td>{t.price.toLocaleString()} so'm</td>
                              <td>{t.duration_minutes} daq</td>
                              <td>{t.question_count} ta</td>
                              <td><button className="btn btn-danger btn-sm" onClick={async () => { if (confirm('O\'chirish?')) { await api('DELETE', `/tests/${t.id}`); loadEditorData(); } }}>O'chirish</button></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'addTest' && (
          <div id="editorTabAddTest">
            <div className="page-title">➕ Yangi test yaratish</div>
            <div className="card" style={{ maxWidth: '600px' }}>
              <div className="form-group"><label>Test nomi</label><input className="form-input" value={formData.testTitle} onChange={(e) => setFormData({...formData, testTitle: e.target.value})} /></div>
              <div className="form-group"><label>Tavsif</label><textarea className="form-input" rows="2" value={formData.testDesc} onChange={(e) => setFormData({...formData, testDesc: e.target.value})}></textarea></div>
              <div className="grid-2">
                 <div className="form-group"><label>Narxi (so'm)</label><input type="number" className="form-input" value={formData.testPrice} onChange={(e) => setFormData({...formData, testPrice: e.target.value})} /></div>
                 <div className="form-group"><label>Vaqti (daqiqa)</label><input type="number" className="form-input" value={formData.testDuration} onChange={(e) => setFormData({...formData, testDuration: e.target.value})} /></div>
              </div>
              <div className="grid-2">
                 <div className="form-group"><label>Mutaxassislik savollari (ta)</label><input type="number" className="form-input" value={formData.testInfoCount} onChange={(e) => setFormData({...formData, testInfoCount: e.target.value})} /></div>
                 <div className="form-group"><label>Pedagogika savollari (ta)</label><input type="number" className="form-input" value={formData.testPedCount} onChange={(e) => setFormData({...formData, testPedCount: e.target.value})} /></div>
              </div>
              <button className="btn btn-primary btn-full" disabled={loading} onClick={handleCreateTestReal}>{loading ? <span className="spinner"></span> : '✅ Yaratish'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
