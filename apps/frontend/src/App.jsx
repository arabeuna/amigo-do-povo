import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Alunos from './components/Alunos';
import Atividades from './components/Atividades';
import Horarios from './components/Horarios';
import Frequencias from './components/Frequencias';
import Mensalidades from './components/Mensalidades';
import Relatorios from './components/Relatorios';
import Configuracoes from './components/Configuracoes';
import './index.css';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente principal da aplicação
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirecionar raiz para dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
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

        <Route
          path="/alunos"
          element={
            <ProtectedRoute>
              <Layout>
                <Alunos />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/atividades"
          element={
            <ProtectedRoute>
              <Layout>
                <Atividades />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/horarios"
          element={
            <ProtectedRoute>
              <Layout>
                <Horarios />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/frequencias"
          element={
            <ProtectedRoute>
              <Layout>
                <Frequencias />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/mensalidades"
          element={
            <ProtectedRoute>
              <Layout>
                <Mensalidades />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <Layout>
                <Relatorios />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracoes />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Rota 404 */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Página não encontrada</p>
                    <button
                      onClick={() => window.history.back()}
                      className="btn-primary"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

// Componente principal com providers
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App; 