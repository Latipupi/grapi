import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';

import BranchesPage from './pages/BranchesPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import PurchasesPage from './pages/PurchasesPage';
import NewPurchasePage from './pages/NewPurchasePage';
import PurchaseDetailPage from './pages/PurchaseDetailPage';
import InventoryPage from './pages/InventoryPage';
import StockMovementsPage from './pages/StockMovementsPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ProfitLossPage from './pages/ProfitLossPage';
import SettingsPage from './pages/SettingsPage';
import ExpensesPage from './pages/ExpensesPage';
import DebtsPage from './pages/DebtsPage';
import ShiftsReportPage from './pages/ShiftsReportPage';
import StockOpnamePage from './pages/StockOpnamePage';
import StockTransferPage from './pages/StockTransferPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role || '')) return <Navigate to="/dashboard" />;
  
  return children;
};

const SuperAdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, role, tenantId } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (tenantId !== 'SYSTEM' || !['ADMIN', 'OWNER'].includes(role || '')) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
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
          <Route path="pos" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'CASHIER', 'KASIR']}>
              <POSPage />
            </RoleProtectedRoute>
          } />
          <Route path="master" element={<Navigate to="products" replace />} />
          <Route path="master/branches" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <BranchesPage />
            </RoleProtectedRoute>
          } />
          <Route path="master/categories" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <CategoriesPage />
            </RoleProtectedRoute>
          } />
          <Route path="master/products" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <ProductsPage />
            </RoleProtectedRoute>
          } />
          <Route path="master/suppliers" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <SuppliersPage />
            </RoleProtectedRoute>
          } />
          <Route path="master/customers" element={<CustomersPage />} />
          <Route path="master/users" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <UsersPage />
            </RoleProtectedRoute>
          } />
          <Route path="purchasing" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <PurchasesPage />
            </RoleProtectedRoute>
          } />
          <Route path="purchasing/new" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <NewPurchasePage />
            </RoleProtectedRoute>
          } />
          <Route path="purchasing/:id" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <PurchaseDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/opname" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <StockOpnamePage />
            </RoleProtectedRoute>
          } />
          <Route path="inventory/movements" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <StockMovementsPage />
            </RoleProtectedRoute>
          } />
          <Route path="inventory/transfer" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <StockTransferPage />
            </RoleProtectedRoute>
          } />
          <Route path="reports" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF']}>
              <ReportsPage />
            </RoleProtectedRoute>
          } />
          <Route path="reports/shifts" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <ShiftsReportPage />
            </RoleProtectedRoute>
          } />
          <Route path="reports/profit-loss" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <ProfitLossPage />
            </RoleProtectedRoute>
          } />
          <Route path="finance/expenses" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <ExpensesPage />
            </RoleProtectedRoute>
          } />
          <Route path="debts" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR']}>
              <DebtsPage />
            </RoleProtectedRoute>
          } />
          <Route path="settings" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <SettingsPage />
            </RoleProtectedRoute>
          } />
          <Route path="super-admin" element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboardPage />
            </SuperAdminProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
