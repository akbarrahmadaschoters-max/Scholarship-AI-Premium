import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Diagnostic } from '../pages/Diagnostic';
import { Outcome } from '../pages/Outcome';
import { Profiling } from '../pages/Profiling';
import { PremiumDashboard } from '../pages/PremiumDashboard';
import { InterviewPage } from '../pages/InterviewPage';
import { ScholarshipsPage } from '../pages/ScholarshipsPage';
import { UniversitiesPage } from '../pages/UniversitiesPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

export const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return null; // Or a global loader

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diagnostic" element={<Diagnostic />} />
        <Route path="/profiling" element={<Profiling />} />
        <Route path="/outcome" element={<Outcome />} />
        <Route path="/premium-dashboard" element={<PremiumDashboard />} />
        <Route path="/interviews" element={<InterviewPage />} />
        <Route path="/scholarships" element={<ScholarshipsPage />} />
        <Route path="/universities" element={<UniversitiesPage />} />
      </Route>

      
      <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};
