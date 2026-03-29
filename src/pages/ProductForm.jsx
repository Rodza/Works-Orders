import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    size: '',
    product_notes: '',
    double_labels: false,
    mount_up: false,
    rein_bonded: false,
    weight_list: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/products.php?id=${encodeURIComponent(id)}`)
        .then(res => {
          setForm({
            size: res.data.size || '',
            product_notes: res.data.product_notes || '',
            double_labels: res.data.double_labels == 1,
            mount_up: res.data.mount_up == 1,
            rein_bonded: res.data.rein_bonded == 1,
            weight_list: res.data.weight_list == 1,
          });
        })
        .catch(() => setError('Failed to load product'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await api.put(`/products.php?id=${encodeURIComponent(id)}`, form);
      } else {
        await api.post('/products.php', form);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products.php?id=${encodeURIComponent(id)}`);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  if (loading) {
    return <div className="card animate-pulse h-40"></div>;
  }

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center min-h-[48px] cursor-pointer">
      <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
      <span className="ml-2 text-sm">{label}</span>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'New Product'}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
          <input
            type="text"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="input-field"
            required
            disabled={isEdit}
            placeholder="e.g. 350x80x127 Type 7 32A46L2B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Notes</label>
          <textarea
            value={form.product_notes}
            onChange={(e) => setForm({ ...form, product_notes: e.target.value })}
            className="input-field min-h-[80px]"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Toggle
            label="Double Labels"
            checked={form.double_labels}
            onChange={(e) => setForm({ ...form, double_labels: e.target.checked })}
          />
          <Toggle
            label="Mount Up"
            checked={form.mount_up}
            onChange={(e) => setForm({ ...form, mount_up: e.target.checked })}
          />
          <Toggle
            label="Rein Bonded"
            checked={form.rein_bonded}
            onChange={(e) => setForm({ ...form, rein_bonded: e.target.checked })}
          />
          <Toggle
            label="Weight List"
            checked={form.weight_list}
            onChange={(e) => setForm({ ...form, weight_list: e.target.checked })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-red-600 text-sm py-3 hover:text-red-800 min-h-[48px]"
          >
            Delete Product
          </button>
        )}
      </form>
    </div>
  );
}
