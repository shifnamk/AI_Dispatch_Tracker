import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Camera from './pages/Camera';
import CameraSettings from './pages/CameraSettings';
import Menu from './pages/Menu';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';
import ScheduleSettings from './pages/ScheduleSettings';
import ROISettings from './pages/ROISettings';
import Login from './pages/Login';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }
  
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// App Routes Component
function AppRoutes() {
  const { authenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={authenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/camera"
        element={
          <ProtectedRoute>
            <Layout><Camera /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/camera-settings"
        element={
          <ProtectedRoute>
            <Layout><CameraSettings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <Layout><Menu /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout><UserManagement /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Layout><ScheduleSettings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roi-settings"
        element={
          <ProtectedRoute>
            <Layout><ROISettings /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
