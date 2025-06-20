import axios from 'axios';

// Configuração base do axios
// Usa URL relativa quando servido pelo backend, ou localhost em desenvolvimento
const getBaseURL = () => {
  // Se estamos em produção e sendo servidos pelo backend, usa URL relativa
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  // Em desenvolvimento, usa localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('🚨 Erro na requisição:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔒 Erro 401 detectado - NÃO fazendo logout automático por enquanto');
      console.log('📋 Detalhes do erro:', error.response?.data);
      
      // Comentar temporariamente o logout automático para resolver problema de autenticação
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// AUTENTICAÇÃO
// =====================================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/registrar', userData),
  me: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/alterar-senha', passwordData),
};

// =====================================================
// ALUNOS
// =====================================================

export const alunosAPI = {
  listar: (params = {}) => api.get('/alunos', { params }),
  buscarPorId: (id) => api.get(`/alunos/${id}`),
  criar: (alunoData) => api.post('/alunos', alunoData),
  atualizar: (id, alunoData) => api.put(`/alunos/${id}`, alunoData),
  deletar: (id) => api.delete(`/alunos/${id}`),
  buscarMatriculas: (id) => api.get(`/alunos/${id}/matriculas`),
};

// =====================================================
// RESPONSÁVEIS
// =====================================================

export const responsaveisAPI = {
  listar: (params = {}) => api.get('/responsaveis', { params }),
  buscarPorId: (id) => api.get(`/responsaveis/${id}`),
  criar: (responsavelData) => api.post('/responsaveis', responsavelData),
  atualizar: (id, responsavelData) => api.put(`/responsaveis/${id}`, responsavelData),
  deletar: (id) => api.delete(`/responsaveis/${id}`),
};

// =====================================================
// ATIVIDADES
// =====================================================

export const atividadesAPI = {
  listar: (params = {}) => api.get('/atividades', { params }),
  buscarPorId: (id) => api.get(`/atividades/${id}`),
  criar: (atividadeData) => api.post('/atividades', atividadeData),
  atualizar: (id, atividadeData) => api.put(`/atividades/${id}`, atividadeData),
  deletar: (id) => api.delete(`/atividades/${id}`),
};

// =====================================================
// MATRÍCULAS
// =====================================================

export const matriculasAPI = {
  listar: (params = {}) => api.get('/matriculas', { params }),
  buscarPorId: (id) => api.get(`/matriculas/${id}`),
  criar: (matriculaData) => api.post('/matriculas', matriculaData),
  atualizar: (id, matriculaData) => api.put(`/matriculas/${id}`, matriculaData),
  deletar: (id) => api.delete(`/matriculas/${id}`),
};

// =====================================================
// FREQUÊNCIAS
// =====================================================

export const frequenciasAPI = {
  listar: (params = {}) => api.get('/frequencias', { params }),
  buscarPorId: (id) => api.get(`/frequencias/${id}`),
  criar: (frequenciaData) => api.post('/frequencias', frequenciaData),
  atualizar: (id, frequenciaData) => api.put(`/frequencias/${id}`, frequenciaData),
  deletar: (id) => api.delete(`/frequencias/${id}`),
  registrarPresenca: (data) => api.post('/frequencias/registrar', data),
  registrarPresencaEmLote: (data) => api.post('/frequencias/registrar-lote', data),
};

// =====================================================
// MENSALIDADES
// =====================================================

export const mensalidadesAPI = {
  listar: (params = {}) => api.get('/mensalidades', { params }),
  buscarPorId: (id) => api.get(`/mensalidades/${id}`),
  criar: (mensalidadeData) => api.post('/mensalidades', mensalidadeData),
  atualizar: (id, mensalidadeData) => api.put(`/mensalidades/${id}`, mensalidadeData),
  deletar: (id) => api.delete(`/mensalidades/${id}`),
  registrarPagamento: (id, pagamentoData) => api.post(`/mensalidades/${id}/pagar`, pagamentoData),
  gerarMensalidades: (data) => api.post('/mensalidades/gerar', data),
};

// =====================================================
// RELATÓRIOS
// =====================================================

export const relatoriosAPI = {
  exportarAlunos: (params = {}) => api.get('/relatorios/alunos/exportar', { 
    params,
    responseType: 'blob'
  }),
  exportarFrequencias: (params = {}) => api.get('/relatorios/frequencias/exportar', { 
    params,
    responseType: 'blob'
  }),
  exportarMensalidades: (params = {}) => api.get('/relatorios/mensalidades/exportar', { 
    params,
    responseType: 'blob'
  }),
  dashboard: () => api.get('/relatorios/dashboard'),
};

// =====================================================
// USUÁRIOS
// =====================================================

export const usuariosAPI = {
  listar: (params = {}) => api.get('/usuarios', { params }),
  buscarPorId: (id) => api.get(`/usuarios/${id}`),
  criar: (usuarioData) => api.post('/usuarios', usuarioData),
  atualizar: (id, usuarioData) => api.put(`/usuarios/${id}`, usuarioData),
  deletar: (id) => api.delete(`/usuarios/${id}`),
};

// =====================================================
// UTILITÁRIOS
// =====================================================

export const utilsAPI = {
  health: () => api.get('/health'),
};

export default api; 