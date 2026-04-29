import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import Modal from './Modal';

const Dashboard = ({ user, onLogout, onUpdateUser, onStartTest, onReviewAttempt, theme, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupStatus, setTopupStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'tests') loadTests();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/tests/');
      setTests(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/tests/my-attempts');
      setHistory(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleTopup = async () => {
    setLoading(true);
    setTopupStatus({ error: '', success: '' });
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 1000) {
      setTopupStatus({ error: 'Kamida 1000 soʼm kiriting', success: '' });
      return;
    }
    try {
      const data = await api('POST', '/auth/topup', { amount });
      onUpdateUser({ ...user, balance: data.balance });
      setTopupStatus({ error: '', success: data.message });
      setTopupAmount('');
    } catch (e) {
      setTopupStatus({ error: e.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'tests', label: 'Testlar', active: activeTab === 'tests', onClick: () => setActiveTab('tests') },
    { id: 'topup', label: 'Hisob to\'ldirish', active: activeTab === 'topup', onClick: () => setActiveTab('topup') },
    { id: 'history', label: 'Natijalarim', active: activeTab === 'history', onClick: () => setActiveTab('history') },
  ];

  const rightContent = (
    <div className="balance-badge">💰 <span>{(user.balance || 0).toLocaleString()}</span> so'm</div>
  );

  return (
    <div id="pageUser">
      <Navbar brand="📋 Attestatsiya" menuItems={menuItems} rightContent={rightContent} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="container">
        {loading && <div className="loading-bar"></div>}
        {activeTab === 'tests' && (
          <div id="tabTests">
            <div className="page-title">📚 Mavjud testlar</div>
            <div id="testsList" className="grid-3">
              {tests.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>Hozircha test mavjud emas.</p>
              ) : (
                tests.map(t => (
                  <div key={t.id} className="test-card" onClick={() => { setSelectedTest(t); setShowStartModal(true); }}>
                    <div className="test-subject">📚 {t.subject_name || `Fan #${t.subject_id}`}</div>
                    <div className="test-title">{t.title}</div>
                    <div className="test-meta">
                      <span>⏱ {t.duration_minutes} daqiqa</span>
                      <span>📝 {t.question_count || 0} ta savol</span>
                    </div>
                    <div className="test-price">💰 {(t.price || 5000).toLocaleString()} soʼm</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'topup' && (
          <div id="tabTopup">
            <div className="page-title">💳 Hisob to'ldirish</div>
            <div className="card" style={{ maxWidth: '480px' }}>
              <div className="card-title">Summa tanlang</div>
              <div className="topup-options">
                {[10000, 25000, 50000, 100000, 200000, 500000].map(amt => (
                  <div key={amt} className={`topup-opt ${topupAmount == amt ? 'selected' : ''}`} onClick={() => setTopupAmount(amt)}>
                    {amt.toLocaleString()} so'm
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Yoki o'zingiz kiriting</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Summa (so'm)"
                  min="1000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                />
              </div>
              {topupStatus.success && <div className="success-msg show">{topupStatus.success}</div>}
              {topupStatus.error && <div className="error-msg show">{topupStatus.error}</div>}
              <button className="btn btn-primary btn-full" disabled={loading} onClick={handleTopup}>
                {loading ? <span className="spinner"></span> : "✅ To'ldirish"}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
                * Demo rejimda to'lov avtomatik qo'shiladi.<br />Haqiqiy tizimda to'lov tizimi ulanadi.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div id="tabHistory">
            <div className="page-title">📊 Mening natijalarim</div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Test</th><th>Ball</th><th>%</th><th>Sana</th><th></th></tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>Hali test ishlanmagan</td></tr>
                    ) : (
                      history.map(a => {
                        const pct = a.total ? Math.round(a.score / a.total * 100) : 0;
                        return (
                          <tr key={a.id}>
                            <td>{a.test_title}</td>
                            <td><strong>{a.score || 0}/{a.total || 0}</strong></td>
                            <td>{pct}%</td>
                            <td>{a.started_at ? new Date(a.started_at).toLocaleDateString('uz') : ''}</td>
                            <td><button className="btn btn-sm" style={{ background: '#e2e8f0' }} onClick={() => onReviewAttempt(a.id)}>Koʼrish</button></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        id="modalStartTest"
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="🚀 Testni boshlash"
        footer={(
          <>
            <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowStartModal(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={() => { setShowStartModal(false); onStartTest(selectedTest); }}>Boshlash</button>
          </>
        )}
      >
        {selectedTest && (
          <div id="startTestInfo">
            <p><strong>{selectedTest.title}</strong></p>
            <br />
            <p>⏱ Vaqt: <strong>{selectedTest.duration_minutes} daqiqa</strong></p>
            <p>💰 Narxi: <strong>{(selectedTest.price || 5000).toLocaleString()} soʼm</strong></p>
            <p>💳 Sizning balansingiz: <strong>{(user.balance || 0).toLocaleString()} soʼm</strong></p>
            <br />
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Test boshlanishi bilan balansingizdan {(selectedTest.price || 5000).toLocaleString()} soʼm yechiladi.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
