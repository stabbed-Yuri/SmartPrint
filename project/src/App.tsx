import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PrintingPage from './pages/PrintingPage';
import PrintersPage from './pages/PrintersPage';
import JobsPage from './pages/JobsPage';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPrintersPage from './pages/AdminPrintersPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              
              {/* Protected routes */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="printing"
                element={
                  <ProtectedRoute>
                    <PrintingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="printers"
                element={
                  <ProtectedRoute>
                    <PrintersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="jobs"
                element={
                  <ProtectedRoute>
                    <JobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/printers"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPrintersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/jobs"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;