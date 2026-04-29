import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import Modal from './Modal';

const AdminPanel = ({ user, onLogout, theme, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddEditor, setShowAddEditor] = useState(false);
  const [showTopupUser, setShowTopupUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSubjects(); // Load subjects once for use in modals
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
    if (activeTab === 'subjects') loadSubjects();
    if (activeTab === 'editors') loadEditors();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadStats = async () => {
    setLoading(true);
    try { const data = await api('GET', '/admin/stats'); setStats(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try { const data = await api('GET', '/admin/subjects'); setSubjects(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadEditors = async () => {
    setLoading(true);
    try { const data = await api('GET', '/admin/editors'); setEditors(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try { const data = await api('GET', '/admin/users'); setUsers(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAddSubject = async () => {
    if (!formData.newSubjectName) return alert('Nomini kiriting');
    setLoading(true);
    try {
      await api('POST', '/admin/subjects', { name: formData.newSubjectName, description: formData.newSubjectDesc });
      setShowAddSubject(false);
      loadSubjects();
    } catch (e) { alert(e.message); }
  };

  const handleAddEditor = async () => {
    if (!formData.newEdUsername || !formData.newEdSubject) return alert('Barcha maydonlarni to\'ldiring');
    setLoading(true);
    try {
      await api('POST', '/admin/editors', {
        username: formData.newEdUsername,
        email: formData.newEdEmail,
        password: formData.newEdPassword,
        subject_id: parseInt(formData.newEdSubject)
      });
      setShowAddEditor(false);
      loadEditors();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleTopupUser = async () => {
    setLoading(true);
    try {
      await api('POST', `/admin/users/${selectedUser.id}/topup`, { amount: parseFloat(formData.topupUserAmount), description: 'Admin' });
      setShowTopupUser(false);
      loadUsers();
    } catch (e) { alert(e.message); }
  };

  const toggleUser = async (user) => {
    try {
      await api('PATCH', `/admin/users/${user.id}`, { is_active: !user.is_active });
      loadUsers();
    } catch (e) { alert(e.message); }
  };

  const menuItems = [
    { id: 'stats', label: 'Statistika', active: activeTab === 'stats', onClick: () => setActiveTab('stats') },
    { id: 'subjects', label: 'Fanlar', active: activeTab === 'subjects', onClick: () => setActiveTab('subjects') },
    { id: 'editors', label: 'Muharrirlar', active: activeTab === 'editors', onClick: () => setActiveTab('editors') },
    { id: 'users', label: 'Foydalanuvchilar', active: activeTab === 'users', onClick: () => setActiveTab('users') },
  ];

  return (
    <div id="pageAdmin">
      <Navbar brand="⚙️ Admin Panel" menuItems={menuItems} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="container">
        {loading && <div className="loading-bar"></div>}
        {activeTab === 'stats' && stats && (
          <div id="adminTabStats">
            <div className="page-title">📊 Umumiy statistika</div>
            <div className="grid-4">
              <div className="stat-card"><div className="stat-val">{stats.total_users}</div><div className="stat-lbl">👥 Foydalanuvchilar</div></div>
              <div className="stat-card"><div className="stat-val">{stats.total_editors}</div><div className="stat-lbl">✏️ Muharrirlar</div></div>
              <div className="stat-card"><div className="stat-val">{stats.total_subjects}</div><div className="stat-lbl">📚 Fanlar</div></div>
              <div className="stat-card"><div className="stat-val">{stats.total_attempts}</div><div className="stat-lbl">📝 Testlar</div></div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div id="adminTabSubjects">
            <div className="page-title" style={{ justifyContent: 'space-between' }}>
              📚 Fanlar
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubject(true)}>+ Fan qo'shish</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Fan nomi</th><th>Tavsif</th><th></th></tr></thead>
                  <tbody>
                    {subjects.map((s, i) => (
                      <tr key={s.id}><td>{i + 1}</td><td><strong>{s.name}</strong></td><td>{s.description}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={async () => { if (confirm('O\'chirish?')) { await api('DELETE', `/admin/subjects/${s.id}`); loadSubjects(); } }}>O'chirish</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editors' && (
          <div id="adminTabEditors">
            <div className="page-title" style={{ justifyContent: 'space-between' }}>
              ✏️ Muharrirlar
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddEditor(true)}>+ Muharrir qo'shish</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Username</th><th>Email</th><th>Fan</th><th>Holat</th></tr></thead>
                  <tbody>
                    {editors.map(e => (
                      <tr key={e.id}>
                        <td><strong>{e.username}</strong></td>
                        <td>{e.email}</td>
                        <td>{e.subject_name || `Fan #${e.subject_id}`}</td>
                        <td><span className={`badge ${e.is_active ? 'badge-active' : 'badge-blocked'}`}>{e.is_active ? 'Faol' : 'Blok'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div id="adminTabUsers">
            <div className="page-title">👥 Foydalanuvchilar</div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Username</th><th>Email</th><th>Rol / Fan</th><th>Balans</th><th>Holat</th><th>Amallar</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.role === 'editor' ? `Muharrir (${u.subject_name})` : 'Foydalanuvchi'}</td>
                        <td>{(u.balance || 0).toLocaleString()} soʼm</td>
                        <td><span className={`badge ${u.is_active ? 'badge-active' : 'badge-blocked'}`}>{u.is_active ? 'Faol' : 'Blok'}</span></td>
                        <td style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-sm btn-accent" onClick={() => { setSelectedUser(u); setShowTopupUser(true); }}>💰 Toʼldirish</button>
                          <button className="btn btn-sm" style={{ background: u.is_active ? '#ffebee' : '#e8f5e9', color: u.is_active ? 'var(--danger)' : 'var(--success)' }} onClick={() => toggleUser(u)}>{u.is_active ? 'Bloklash' : 'Faol'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal id="modalAddSubject" isOpen={showAddSubject} onClose={() => setShowAddSubject(false)} title="📚 Yangi fan qo'shish" footer={<><button className="btn" onClick={() => setShowAddSubject(false)}>Bekor</button><button className="btn btn-primary" disabled={loading} onClick={handleAddSubject}>{loading ? <span className="spinner"></span> : 'Saqlash'}</button></>}>
        <div className="form-group"><label>Fan nomi</label><input className="form-input" onChange={(e) => setFormData({ ...formData, newSubjectName: e.target.value })} /></div>
        <div className="form-group"><label>Tavsif</label><input className="form-input" onChange={(e) => setFormData({ ...formData, newSubjectDesc: e.target.value })} /></div>
      </Modal>

      <Modal id="modalAddEditor" isOpen={showAddEditor} onClose={() => setShowAddEditor(false)} title="✏️ Yangi muharrir qo'shish" footer={<><button className="btn" onClick={() => setShowAddEditor(false)}>Bekor</button><button className="btn btn-primary" disabled={loading} onClick={handleAddEditor}>{loading ? <span className="spinner"></span> : 'Saqlash'}</button></>}>
        <div className="form-group"><label>Username</label><input className="form-input" onChange={(e) => setFormData({ ...formData, newEdUsername: e.target.value })} /></div>
        <div className="form-group"><label>Email</label><input className="form-input" onChange={(e) => setFormData({ ...formData, newEdEmail: e.target.value })} /></div>
        <div className="form-group"><label>Parol</label><input className="form-input" type="password" onChange={(e) => setFormData({ ...formData, newEdPassword: e.target.value })} /></div>
        <div className="form-group"><label>Fan</label>
          <select className="form-input" onChange={(e) => setFormData({ ...formData, newEdSubject: e.target.value })}>
            <option value="">-- Tanlang --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </Modal>

      <Modal id="modalTopupUser" isOpen={showTopupUser} onClose={() => setShowTopupUser(false)} title="💰 Toʼldirish" footer={<><button className="btn" onClick={() => setShowTopupUser(false)}>Bekor</button><button className="btn btn-primary" disabled={loading} onClick={handleTopupUser}>{loading ? <span className="spinner"></span> : 'Toʼldirish'}</button></>}>
        <div className="form-group"><label>Summa</label><input className="form-input" type="number" onChange={(e) => setFormData({ ...formData, topupUserAmount: e.target.value })} /></div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
