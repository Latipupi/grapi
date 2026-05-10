import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';

import BranchesPage from './pages/BranchesPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="master" element={<Navigate to="/master/branches" />} />
          <Route path="master/branches" element={<BranchesPage />} />
          <Route path="master/categories" element={<CategoriesPage />} />
          <Route path="master/products" element={<ProductsPage />} />
          {/* Tambahkan route lainnya di sini */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const Dashboard = () => {
  const { fullName } = useSelector((state: RootState) => state.auth);
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Selamat Datang, {fullName}! 👋</h1>
          <p className="text-sm md:text-base text-slate-500">Berikut adalah ringkasan apotek Anda hari ini.</p>
        </div>
        <div className="hidden lg:block">
           {/* Placeholder for an illustration or more stats */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Penjualan Hari Ini', value: 'Rp 1.250.000', color: 'bg-blue-600' },
          { label: 'Transaksi', value: '24', color: 'bg-emerald-600' },
          { label: 'Obat Expired', value: '5', color: 'bg-rose-600' },
          { label: 'Stok Menipis', value: '12', color: 'bg-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <div className={`h-1.5 w-full ${stat.color} rounded-full mt-4 opacity-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
