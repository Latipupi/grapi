import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

import BranchesPage from './pages/BranchesPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import PurchasesPage from './pages/PurchasesPage';
import NewPurchasePage from './pages/NewPurchasePage';
import InventoryPage from './pages/InventoryPage';
import StockMovementsPage from './pages/StockMovementsPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ProfitLossPage from './pages/ProfitLossPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Landing Page as the entry point */}
        <Route path="/home" element={<LandingPage />} />

        {/* Root redirect logic */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />
        } />

        {/* Protected App Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="master" element={<Navigate to="branches" replace />} />
          <Route path="master/branches" element={<BranchesPage />} />
          <Route path="master/categories" element={<CategoriesPage />} />
          <Route path="master/products" element={<ProductsPage />} />
          <Route path="master/suppliers" element={<SuppliersPage />} />
          <Route path="master/customers" element={<CustomersPage />} />
          <Route path="master/users" element={<UsersPage />} />
          <Route path="purchasing" element={<PurchasesPage />} />
          <Route path="purchasing/new" element={<NewPurchasePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/movements" element={<StockMovementsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/profit-loss" element={<ProfitLossPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
