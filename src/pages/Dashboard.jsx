import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { formatDateTime, statusClass } from '../utils/helpers';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ open: 0, draft: 0, completedToday: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/work-orders.php');
        const orders = res.data;

        const today = new Date().toISOString().split('T')[0];
        setStats({
          open: orders.filter(o => o.status === 'OPEN').length,
          draft: orders.filter(o => o.status === 'DRAFT').length,
          completedToday: orders.filter(o =>
            o.status === 'COMPLETED' && o.last_amend?.startsWith(today)
          ).length,
        });

        setRecent(orders.slice(0, 5));
      } catch {
        // Will show zeros if offline
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 min-h-[48px] px-3"
        >
          Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/work-orders?status=OPEN" className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {loading ? '-' : stats.open}
          </div>
          <div className="text-xs text-gray-500 mt-1">Open</div>
        </Link>
        <Link to="/work-orders?status=DRAFT" className="card text-center">
          <div className="text-2xl font-bold text-gray-600">
            {loading ? '-' : stats.draft}
          </div>
          <div className="text-xs text-gray-500 mt-1">Draft</div>
        </Link>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {loading ? '-' : stats.completedToday}
          </div>
          <div className="text-xs text-gray-500 mt-1">Done Today</div>
        </div>
      </div>

      {/* Quick Action */}
      <Link to="/work-orders/new" className="btn-primary block text-center">
        + New Work Order
      </Link>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h2>
        {loading ? (
          <div className="card animate-pulse h-20"></div>
        ) : recent.length === 0 ? (
          <div className="card text-center text-gray-500 text-sm py-8">
            No work orders yet
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(order => (
              <Link
                key={order.unique_id}
                to={`/work-orders/${order.unique_id}`}
                className="card flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{order.work_order}</span>
                    <span className={statusClass(order.status)}>{order.status}</span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {order.customer_name || 'No customer'}
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                  {formatDateTime(order.last_amend)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
