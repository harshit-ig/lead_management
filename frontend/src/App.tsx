import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import AllLeads from './pages/AllLeads';
import MyLeads from './pages/MyLeads';
import AddLead from './pages/AddLead';
import SmartImportLeads from './pages/SmartImportLeads';
import AssignLeads from './pages/AssignLeads';
import LeadDetails from './pages/LeadDetails';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-8 h-8 text-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (for login page)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-8 h-8 text-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};



const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Lead Management Routes */}
      <Route 
        path="/leads" 
        element={
          <ProtectedRoute>
            <Layout>
              <AllLeads />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/my-leads" 
        element={
          <ProtectedRoute>
            <Layout>
              <MyLeads />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <AddLead />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads/import" 
        element={
          <ProtectedRoute>
            <Layout>
              <SmartImportLeads />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads/import/smart" 
        element={
          <ProtectedRoute>
            <Layout>
              <SmartImportLeads />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads/assign" 
        element={
          <ProtectedRoute>
            <Layout>
              <AssignLeads />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <LeadDetails />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/users" 
        element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Not Found */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">❌</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                  <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                  <a href="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#059669',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;