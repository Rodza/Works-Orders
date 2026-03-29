import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import PrintWorkOrder from '../components/PrintWorkOrder';
import { formatCurrency } from '../utils/helpers';

export default function WorkOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    status: 'DRAFT',
    order_date: new Date().toISOString().split('T')[0],
    customer_id: null,
    order_number: '',
    product: null,
    product_note: '',
    product_requested: '',
    order_qty: 0,
    manufactured: 0,
    note: '',
    price: '',
  });

  const [orderData, setOrderData] = useState(null); // Full order data for print
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [nextNumber, setNextNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPrint, setShowPrint] = useState(false);

  // Selected customer/product details
  const selectedCustomer = customers.find(c => c.customer_id === form.customer_id);
  const selectedProduct = products.find(p => p.size === form.product);
  const remaining = (form.order_qty || 0) - (form.manufactured || 0);

  useEffect(() => {
    // Fetch customers and products
    Promise.all([
      api.get('/customers.php'),
      api.get('/products.php'),
    ]).then(([custRes, prodRes]) => {
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    }).catch(() => {});

    if (isEdit) {
      setLoading(true);
      api.get(`/work-orders.php?id=${id}`)
        .then(res => {
          const o = res.data;
          setOrderData(o);
          setForm({
            status: o.status || 'DRAFT',
            order_date: o.order_date || '',
            customer_id: o.customer_id || null,
            order_number: o.order_number || '',
            product: o.product || null,
            product_note: o.product_note || '',
            product_requested: o.product_requested || '',
            order_qty: o.order_qty || 0,
            manufactured: o.manufactured || 0,
            note: o.note || '',
            price: o.price || '',
          });
        })
        .catch(() => setError('Failed to load work order'))
        .finally(() => setLoading(false));
    } else {
      api.get('/work-orders.php?action=next_number')
        .then(res => setNextNumber(res.data.next_number))
        .catch(() => {});
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        order_qty: parseInt(form.order_qty) || 0,
        manufactured: parseInt(form.manufactured) || 0,
      };

      if (isEdit) {
        const res = await api.put(`/work-orders.php?id=${id}`, payload);
        setOrderData(res.data);
      } else {
        await api.post('/work-orders.php', payload);
      }
      navigate('/work-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save work order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this work order?')) return;
    try {
      await api.delete(`/work-orders.php?id=${id}`);
      navigate('/work-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="card animate-pulse h-60"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? `WO #${orderData?.work_order}` : 'New Work Order'}
        </h1>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 min-h-[48px] px-3">
          Cancel
        </button>
      </div>

      {/* Work Order Number */}
      {!isEdit && nextNumber && (
        <div className="card bg-primary-50 border-primary-200">
          <span className="text-sm text-primary-700">Next Work Order #: </span>
          <span className="font-bold text-primary-800">{nextNumber}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field"
            >
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
            <input
              type="date"
              value={form.order_date}
              onChange={(e) => setForm({ ...form, order_date: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Customer & Order */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <SearchableSelect
              options={customers.map(c => ({ value: c.customer_id, label: c.customer_name }))}
              value={form.customer_id}
              onChange={(val) => setForm({ ...form, customer_id: val })}
              placeholder="Select customer..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input
              type="text"
              value={form.order_number}
              onChange={(e) => setForm({ ...form, order_number: e.target.value })}
              className="input-field"
              placeholder="Customer's order number"
            />
          </div>
        </div>

        {/* Product */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <SearchableSelect
              options={products.map(p => ({ value: p.size, label: p.size }))}
              value={form.product}
              onChange={(val) => setForm({ ...form, product: val })}
              placeholder="Select product..."
            />
          </div>

          {selectedProduct?.product_notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">Product Notes: </span>
              {selectedProduct.product_notes}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Note</label>
            <input
              type="text"
              value={form.product_note}
              onChange={(e) => setForm({ ...form, product_note: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Requested</label>
            <input
              type="text"
              value={form.product_requested}
              onChange={(e) => setForm({ ...form, product_requested: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Quantities */}
        <div className="card space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Qty</label>
              <input
                type="number"
                value={form.order_qty}
                onChange={(e) => setForm({ ...form, order_qty: e.target.value })}
                className="input-field text-center"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufactured</label>
              <input
                type="number"
                value={form.manufactured}
                onChange={(e) => setForm({ ...form, manufactured: e.target.value })}
                className="input-field text-center"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
              <div className={`input-field text-center flex items-center justify-center font-bold ${
                remaining > 0 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
              }`}>
                {remaining}
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Price */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (ZAR)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="input-field"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Product/Customer Flags (read-only) */}
        {(selectedProduct || selectedCustomer) && (
          <div className="card">
            <div className="text-sm font-medium text-gray-700 mb-2">Product & Customer Flags</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Mount Up', checked: selectedProduct?.mount_up == 1 },
                { label: 'Double Labels', checked: selectedProduct?.double_labels == 1 },
                { label: 'Own Label', checked: selectedCustomer?.own_label == 1 },
                { label: 'Courier', checked: selectedCustomer?.courier == 1 },
                { label: 'Weight List', checked: selectedProduct?.weight_list == 1 },
              ].map(({ label, checked }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                    checked ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-300'
                  }`}>
                    {checked ? '✓' : ''}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : isEdit ? 'Update Work Order' : 'Create Work Order'}
          </button>

          {isEdit && orderData && (
            <button
              type="button"
              onClick={() => setShowPrint(true)}
              className="btn-secondary w-full"
            >
              Print Work Order
            </button>
          )}

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full text-red-600 text-sm py-3 hover:text-red-800 min-h-[48px]"
            >
              Delete Work Order
            </button>
          )}
        </div>
      </form>

      {showPrint && orderData && (
        <PrintWorkOrder
          order={orderData}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
