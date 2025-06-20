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
      console.log('🔄 Iniciando verificação de autenticação...');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('📦 Dados armazenados:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser 
      });

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          console.log('✅ Dados carregados do localStorage');
          
          // Comentar temporariamente a verificação de token para debug
          console.log('⏸️ Verificação de token desabilitada temporariamente');
          /*
          // Verificar se o token ainda é válido
          console.log('🔍 Verificando validade do token...');
          const response = await authAPI.me();
          if (response.data.success) {
            console.log('✅ Token válido, atualizando dados do usuário');
            setUser(response.data.data.usuario);
            localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
          } else {
            console.log('❌ Token inválido, fazendo logout');
            logout();
          }
          */
        } catch (error) {
          console.error('💥 Erro ao verificar autenticação:', error);
          // Comentar logout temporariamente
          // console.log('❌ Erro na verificação, fazendo logout');
          // logout();
        }
      } else {
        console.log('❌ Nenhum token ou usuário encontrado no localStorage');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, senha) => {
    try {
      console.log('🔐 Iniciando login...', { email });
      setLoading(true);
      const response = await authAPI.login({ email, senha });
      
      console.log('📡 Resposta do login:', response.data);
      
      if (response.data.success) {
        const { token: newToken, usuario } = response.data.data;
        
        console.log('✅ Login bem-sucedido, configurando dados...', { usuario });
        
        setToken(newToken);
        setUser(usuario);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        console.log('💾 Dados salvos no localStorage');
        
        toast.success('Login realizado com sucesso!');
        return { success: true };
      } else {
        console.log('❌ Login falhou:', response.data.message);
        toast.error(`Login falhou: ${response.data.message}`);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('💥 Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      const status = error.response?.status;
      const details = `Status: ${status} - ${message}`;
      
      toast.error(`Erro no login: ${details}`);
      console.log('📋 Detalhes completos do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
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
    const authenticated = !!token && !!user;
    console.log('🔍 Verificando autenticação:', { 
      hasToken: !!token, 
      hasUser: !!user, 
      authenticated 
    });
    return authenticated;
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