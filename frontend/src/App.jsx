import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import CreateTeam from './pages/CreateMatch';
import ViewerDashboard from './components/ViewerDashboard';
import AdminScorerDashboard from './components/AdminScorerDashboard';
import StartMatch from './pages/StartMatch';
import ScoringComponent from './components/ScoringComponent';
import ManageMatches from './components/ManageMatches';
import MatchSummary from './components/MatchSummary';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user role if they don't have access to current route
    if (user.role === 'Viewer') {
      return <Navigate to="/viewer-dashboard" />;
    } else if (['Admin', 'Scorer'].includes(user.role)) {
      return <Navigate to="/dashboard" />;
    }
    return <Navigate to="/" />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  // If user is already logged in, redirect them to their appropriate dashboard
  if (user) {
    if (user.role === 'Viewer') {
      return <Navigate to="/viewer-dashboard" />;
    } else if (['Admin', 'Scorer'].includes(user.role)) {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin']}>
            <AdminScorerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/create-team" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin']}>
            <CreateTeam />
          </ProtectedRoute>
        } />

        <Route path="/viewer-dashboard" element={
          <ProtectedRoute allowedRoles={['Viewer']}>
            <ViewerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/match/start/:id" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin']}>
            <StartMatch />
          </ProtectedRoute>
        } />
        <Route path="/manage-matches" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin']}>
            <ManageMatches />
          </ProtectedRoute>
        } />
        <Route path="/scoring/:id" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin']}>
            <ScoringComponent />
          </ProtectedRoute>
        } />
        <Route path="/match-summary/:matchId" element={
          <ProtectedRoute allowedRoles={['Scorer', 'Admin', 'Viewer']}>
            <MatchSummary />
          </ProtectedRoute>
        } />
        

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;