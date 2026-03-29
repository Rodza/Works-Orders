import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    own_label: false,
    courier: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/customers.php?id=${id}`)
        .then(res => {
          setForm({
            customer_name: res.data.customer_name || '',
            email: res.data.email || '',
            own_label: res.data.own_label == 1,
            courier: res.data.courier == 1,
          });
        })
        .catch(() => setError('Failed to load customer'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await api.put(`/customers.php?id=${id}`, form);
      } else {
        await api.post('/customers.php', form);
      }
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers.php?id=${id}`);
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  if (loading) {
    return <div className="card animate-pulse h-40"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Edit Customer' : 'New Customer'}
        </h1>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 min-h-[48px] px-3">
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center min-h-[48px] cursor-pointer">
            <div className={`relative w-11 h-6 rounded-full transition-colors ${form.own_label ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <input
                type="checkbox"
                checked={form.own_label}
                onChange={(e) => setForm({ ...form, own_label: e.target.checked })}
                className="sr-only"
              />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.own_label ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-2 text-sm">Own Label</span>
          </label>

          <label className="flex items-center min-h-[48px] cursor-pointer">
            <div className={`relative w-11 h-6 rounded-full transition-colors ${form.courier ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <input
                type="checkbox"
                checked={form.courier}
                onChange={(e) => setForm({ ...form, courier: e.target.checked })}
                className="sr-only"
              />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.courier ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-2 text-sm">Courier</span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-red-600 text-sm py-3 hover:text-red-800 min-h-[48px]"
          >
            Delete Customer
          </button>
        )}
      </form>
    </div>
  );
}
