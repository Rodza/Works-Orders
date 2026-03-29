import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products.php')
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.size.toLowerCase().includes(search.toLowerCase()) ||
    (p.product_notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Products</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
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
          {search ? 'No products match your search' : 'No products yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <Link
              key={product.size}
              to={`/products/${encodeURIComponent(product.size)}`}
              className="card block"
            >
              <div className="font-medium">{product.size}</div>
              {product.product_notes && (
                <div className="text-sm text-gray-500 truncate">{product.product_notes}</div>
              )}
              <div className="flex gap-2 mt-1 flex-wrap">
                {product.mount_up == 1 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Mount Up</span>
                )}
                {product.double_labels == 1 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Double Labels</span>
                )}
                {product.weight_list == 1 && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">Weight List</span>
                )}
                {product.rein_bonded == 1 && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">Rein Bonded</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link to="/products/new" className="fab" aria-label="Add product">+</Link>
    </div>
  );
}
