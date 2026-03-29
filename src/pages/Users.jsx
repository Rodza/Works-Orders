import { useState, useEffect } from 'react';
import api from '../services/api';
import SearchableSelect from '../components/SearchableSelect';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    user_name: '',
    user_email: '',
    password: '',
    role: 'USER',
    company: null,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/users.php'),
      api.get('/customers.php'),
    ]).then(([usersRes, custRes]) => {
      setUsers(usersRes.data);
      setCustomers(custRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ user_name: '', user_email: '', password: '', role: 'USER', company: null });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (user) => {
    setForm({
      user_name: user.user_name,
      user_email: user.user_email,
      password: '',
      role: user.role,
      company: user.company,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/users.php?id=${editingId}`, payload);
      } else {
        if (!payload.password) {
          setError('Password is required for new users');
          setSaving(false);
          return;
        }
        await api.post('/users.php', payload);
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users.php?id=${userId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const roleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'USER': return 'bg-blue-100 text-blue-700';
      case 'CUSTOMER': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="text-sm text-primary-600 font-medium min-h-[48px] px-3"
          >
            + Add User
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold">{editingId ? 'Edit User' : 'New User'}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.user_name}
              onChange={(e) => setForm({ ...form, user_name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingId ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-field"
            >
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <SearchableSelect
              options={customers.map(c => ({ value: c.customer_id, label: c.customer_name }))}
              value={form.company}
              onChange={(val) => setForm({ ...form, company: val })}
              placeholder="Select company..."
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* User List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-16"></div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center text-gray-500 py-8">No users yet</div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="card flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{user.user_name}</span>
                  <span className={`badge ${roleBadge(user.role)}`}>{user.role}</span>
                </div>
                <div className="text-sm text-gray-500">{user.user_email}</div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="text-primary-600 text-sm min-h-[48px] min-w-[48px] flex items-center justify-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-500 text-sm min-h-[48px] min-w-[48px] flex items-center justify-center"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
