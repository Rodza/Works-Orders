import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import OfflineIndicator from './OfflineIndicator';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <OfflineIndicator />
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
