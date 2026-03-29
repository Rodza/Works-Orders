import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customers.php')
      .then(res => setCustomers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Customers</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers..."
        className="input-field"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-16"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-gray-500 py-8">
          {search ? 'No customers match your search' : 'No customers yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(customer => (
            <Link
              key={customer.customer_id}
              to={`/customers/${customer.customer_id}`}
              className="card block"
            >
              <div className="font-medium">{customer.customer_name}</div>
              <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
              <div className="flex gap-3 mt-1">
                {customer.own_label == 1 && (
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Own Label</span>
                )}
                {customer.courier == 1 && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Courier</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link to="/customers/new" className="fab" aria-label="Add customer">+</Link>
    </div>
  );
}
