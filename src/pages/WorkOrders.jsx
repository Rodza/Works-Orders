import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { statusClass, nextStatus, formatDate } from '../utils/helpers';

const TABS = ['All', 'DRAFT', 'OPEN', 'COMPLETED'];

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'All');

  // Swipe state
  const [swipeId, setSwipeId] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get('/work-orders.php')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.product || '').toLowerCase().includes(q) ||
        String(o.work_order).includes(q)
      );
    }
    return true;
  });

  const handleSwipeStart = (id, e) => {
    touchStartRef.current = { x: e.touches[0].clientX, id };
  };

  const handleSwipeMove = (id, e) => {
    if (!touchStartRef.current || touchStartRef.current.id !== id) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (dx > 0) {
      setSwipeId(id);
      setSwipeX(Math.min(dx, 100));
    }
  };

  const handleSwipeEnd = async (order) => {
    if (swipeX > 60) {
      const next = nextStatus(order.status);
      if (next) {
        try {
          await api.put(`/work-orders.php?id=${order.unique_id}`, { status: next });
          fetchOrders();
        } catch {}
      }
    }
    setSwipeId(null);
    setSwipeX(0);
    touchStartRef.current = null;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ status: tab });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Work Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors min-h-[40px] ${
              activeTab === tab
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search orders..."
        className="input-field"
      />

      {/* Order List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-20"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-gray-500 py-8">
          {search || activeTab !== 'All' ? 'No matching work orders' : 'No work orders yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div
              key={order.unique_id}
              className="relative overflow-hidden rounded-xl"
              onTouchStart={(e) => handleSwipeStart(order.unique_id, e)}
              onTouchMove={(e) => handleSwipeMove(order.unique_id, e)}
              onTouchEnd={() => handleSwipeEnd(order)}
            >
              {/* Swipe background */}
              {swipeId === order.unique_id && nextStatus(order.status) && (
                <div className="absolute inset-0 bg-green-500 flex items-center pl-4">
                  <span className="text-white font-medium text-sm">
                    {nextStatus(order.status) === 'OPEN' ? 'Open' : 'Complete'}
                  </span>
                </div>
              )}

              <Link
                to={`/work-orders/${order.unique_id}`}
                className="card block relative"
                style={{
                  transform: swipeId === order.unique_id ? `translateX(${swipeX}px)` : 'none',
                  transition: swipeId === order.unique_id ? 'none' : 'transform 0.2s',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">#{order.work_order}</span>
                      <span className={statusClass(order.status)}>{order.status}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 truncate mt-1">
                      {order.customer_name || 'No customer'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {order.product || 'No product'} &middot; Qty: {order.order_qty}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-2 text-right whitespace-nowrap">
                    {formatDate(order.order_date)}
                    {order.order_number && (
                      <div className="text-gray-500">#{order.order_number}</div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Link to="/work-orders/new" className="fab" aria-label="New work order">+</Link>
    </div>
  );
}
