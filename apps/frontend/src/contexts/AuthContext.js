import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Verificar se há um token válido ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verificar se o token ainda é válido
          const response = await authAPI.me();
          if (response.data.success) {
            setUser(response.data.data.usuario);
            localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
          } else {
            // Token inválido, limpar dados
            logout();
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, senha) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, senha });
      
      if (response.data.success) {
        const { token: newToken, usuario } = response.data.data;
        
        setToken(newToken);
        setUser(usuario);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        toast.success('Login realizado com sucesso!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Erro no login');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        const { token: newToken, usuario } = response.data.data;
        
        setToken(newToken);
        setUser(usuario);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        toast.success('Usuário registrado com sucesso!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Erro no registro');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      const message = error.response?.data?.message || 'Erro ao registrar usuário';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logout realizado com sucesso!');
  };

  const changePassword = async (senhaAtual, novaSenha) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword({ senhaAtual, novaSenha });
      
      if (response.data.success) {
        toast.success('Senha alterada com sucesso!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Erro ao alterar senha');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Verificar permissões baseadas no perfil
    const permissions = {
      admin: ['admin', 'instrutor', 'financeiro', 'aluno'],
      instrutor: ['instrutor'],
      financeiro: ['financeiro'],
      aluno: ['aluno']
    };

    return permissions[user.perfil]?.includes(permission) || false;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    changePassword,
    updateUser,
    isAuthenticated,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 