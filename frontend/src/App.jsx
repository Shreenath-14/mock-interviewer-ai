import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewDashboard from './pages/InterviewDashboard';
import InterviewSetup from './pages/InterviewSetup';
import ResumeReview from './pages/ResumeReview';
import TestSetup from './pages/TestSetup';
import TestArena from './pages/TestArena';
import BetaInterviewRoom from './pages/BetaInterviewRoom';
import BetaReport from './pages/BetaReport';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-review"
            element={
              <ProtectedRoute>
                <ResumeReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/setup"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/setup"
            element={
              <ProtectedRoute>
                <TestSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/start"
            element={
              <ProtectedRoute>
                <TestArena />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/beta-room"
            element={
              <ProtectedRoute>
                <BetaInterviewRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/report"
            element={
              <ProtectedRoute>
                <BetaReport />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
