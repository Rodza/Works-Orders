import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import WorkOrderForm from './pages/WorkOrderForm';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Users from './pages/Users';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="work-orders/new" element={<WorkOrderForm />} />
        <Route path="work-orders/:id" element={<WorkOrderForm />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
