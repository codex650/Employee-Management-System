import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/adminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes (Accessible only when logged out) */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />


        {/* Protected Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employee-dashboard" 
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback / Redirects */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              user?.role === 'manager' ? (
                <Navigate to="/admin-dashboard" replace />
              ) : (
                <Navigate to="/employee-dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;