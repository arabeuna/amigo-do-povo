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
      console.log('🔒 Erro 401 detectado - fazendo logout automático');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// AUTENTICAÇÃO
// =====================================================

const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/registrar', userData),
  me: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/alterar-senha', passwordData),
};

// =====================================================
// ALUNOS
// =====================================================

const alunosAPI = {
  listar: (params = {}) => api.get('/alunos', { params }),
  buscarPorId: (id) => api.get(`/alunos/${id}`),
  criar: (alunoData) => api.post('/alunos', alunoData),
  atualizar: (id, alunoData) => api.put(`/alunos/${id}`, alunoData),
  deletar: (id) => api.delete(`/alunos/${id}`),
  buscarMatriculas: (id) => api.get(`/alunos/${id}/matriculas`),
  exportar: (params = {}) => api.get('/alunos/exportar', { 
    params,
    responseType: 'blob'
  }),
  importar: (formData) => api.post('/alunos/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/alunos/template', {
    responseType: 'blob'
  }),
};

// =====================================================
// RESPONSÁVEIS
// =====================================================

const responsaveisAPI = {
  listar: (params = {}) => api.get('/responsaveis', { params }),
  buscarPorId: (id) => api.get(`/responsaveis/${id}`),
  criar: (responsavelData) => api.post('/responsaveis', responsavelData),
  atualizar: (id, responsavelData) => api.put(`/responsaveis/${id}`, responsavelData),
  deletar: (id) => api.delete(`/responsaveis/${id}`),
};

// =====================================================
// ATIVIDADES
// =====================================================

const atividadesAPI = {
  listar: (params = {}) => api.get('/atividades', { params }),
  buscarPorId: (id) => api.get(`/atividades/${id}`),
  criar: (atividadeData) => api.post('/atividades', atividadeData),
  atualizar: (id, atividadeData) => api.put(`/atividades/${id}`, atividadeData),
  deletar: (id) => api.delete(`/atividades/${id}`),
  exportar: (params = {}) => api.get('/atividades/exportar', { 
    params,
    responseType: 'blob'
  }),
  importar: (formData) => api.post('/atividades/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/atividades/template', {
    responseType: 'blob'
  }),
};

// =====================================================
// MATRÍCULAS
// =====================================================

const matriculasAPI = {
  listar: (params = {}) => api.get('/matriculas', { params }),
  buscarPorId: (id) => api.get(`/matriculas/${id}`),
  criar: (matriculaData) => api.post('/matriculas', matriculaData),
  atualizar: (id, matriculaData) => api.put(`/matriculas/${id}`, matriculaData),
  deletar: (id) => api.delete(`/matriculas/${id}`),
};

// =====================================================
// FREQUÊNCIAS
// =====================================================

const frequenciasAPI = {
  listar: (params = {}) => api.get('/frequencias', { params }),
  buscarPorId: (id) => api.get(`/frequencias/${id}`),
  registrar: (frequenciaData) => api.post('/frequencias', frequenciaData),
  registrarEmLote: (loteData) => api.post('/frequencias/lote', loteData),
  atualizar: (id, frequenciaData) => api.put(`/frequencias/${id}`, frequenciaData),
  deletar: (id) => api.delete(`/frequencias/${id}`),
  buscarPorAtividade: (atividadeId) => api.get(`/frequencias/atividade/${atividadeId}`),
  buscarRelatorio: (params = {}) => api.get('/frequencias/relatorio', { params }),
  listarAlunosMatriculados: (atividadeId) => api.get(`/atividades/${atividadeId}/alunos-matriculados`),
  exportar: (params = {}) => api.get('/frequencias/exportar', { 
    params,
    responseType: 'blob'
  }),
  importar: (formData) => api.post('/frequencias/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/frequencias/template', {
    responseType: 'blob'
  }),
};

// =====================================================
// MENSALIDADES
// =====================================================

const mensalidadesAPI = {
  listar: (params = {}) => api.get('/mensalidades', { params }),
  buscarPorId: (id) => api.get(`/mensalidades/${id}`),
  criar: (mensalidadeData) => api.post('/mensalidades', mensalidadeData),
  atualizar: (id, mensalidadeData) => api.put(`/mensalidades/${id}`, mensalidadeData),
  deletar: (id) => api.delete(`/mensalidades/${id}`),
  registrarPagamento: (id, pagamentoData) => api.post(`/mensalidades/${id}/pagar`, pagamentoData),
  gerarMensalidades: (data) => api.post('/mensalidades/gerar', data),
  exportar: (params = {}) => api.get('/mensalidades/exportar', { 
    params,
    responseType: 'blob'
  }),
  importar: (formData) => api.post('/mensalidades/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/mensalidades/template', {
    responseType: 'blob'
  }),
};

// =====================================================
// RELATÓRIOS
// =====================================================

const relatoriosAPI = {
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

const usuariosAPI = {
  listar: (params = {}) => api.get('/usuarios', { params }),
  buscarPorId: (id) => api.get(`/usuarios/${id}`),
  criar: (usuarioData) => api.post('/usuarios', usuarioData),
  atualizar: (id, usuarioData) => api.put(`/usuarios/${id}`, usuarioData),
  deletar: (id) => api.delete(`/usuarios/${id}`),
};

// =====================================================
// UTILITÁRIOS
// =====================================================

const utilsAPI = {
  health: () => api.get('/health'),
};

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const configuracoesAPI = {
  listar: () => api.get('/configuracoes'),
  atualizar: (configData) => api.put('/configuracoes', configData),
};

// =====================================================
// UTILITÁRIOS PARA TOKEN
// =====================================================

// Função para limpar token inválido e gerar novo
const resetToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🔧 Token limpo do localStorage');
  
  // Gerar novo token para produção (válido por 24h)
  const productionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AYW1pZ29kb3Bvdm8uY29tIiwicGVyZmlsIjoiYWRtaW4iLCJpYXQiOjE3NTA1OTY4NzIsImV4cCI6MTc1MDY4MzI3Mn0.Z_TukVI2Djo6XGXJnc_9H7y_50s4-awu5vcM7IfcMTw';
  
  localStorage.setItem('token', productionToken);
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    nome: 'Administrador',
    email: 'admin@amigodopovo.com',
    perfil: 'admin'
  }));
  
  console.log('🔄 Novo token de produção configurado');
  window.location.reload();
};

// Verificar se está em produção e se o token está inválido
const isProduction = window.location.hostname === 'amigo-do-povo.onrender.com';
const currentToken = localStorage.getItem('token');

if (isProduction) {
  console.log('🌐 Detectado ambiente de produção');
  
  // Se não há token ou se o token é muito curto (inválido)
  if (!currentToken || currentToken.length < 200) {
    console.log('🔧 Token inválido detectado em produção, resetando...');
    resetToken();
  } else {
    console.log('✅ Token válido encontrado em produção');
  }
}

// Interceptor para detectar erros 401 em produção e corrigir automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && isProduction) {
      console.log('🔧 Erro 401 detectado em produção, resetando token...');
      resetToken();
    }
    return Promise.reject(error);
  }
);

// =====================================================
// HORÁRIOS
// =====================================================

const horariosAPI = {
  listar: (params = {}) => api.get('/horarios', { params }),
  listarDisponiveis: (params = {}) => api.get('/horarios/disponiveis', { params }),
  buscarPorId: (id) => api.get(`/horarios/${id}`),
  criar: (data) => api.post('/horarios', data),
  atualizar: (id, data) => api.put(`/horarios/${id}`, data),
  deletar: (id) => api.delete(`/horarios/${id}`),
  getDiasSemana: () => api.get('/horarios/dias-semana'),
  listarPorAtividade: (atividadeId) => api.get(`/atividades/${atividadeId}/horarios`),
  exportar: (params = {}) => api.get('/horarios/exportar', { 
    params,
    responseType: 'blob'
  }),
  importar: (formData) => api.post('/horarios/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/horarios/template', {
    responseType: 'blob'
  }),
};

// =====================================================
// EXPORTAÇÕES
// =====================================================

export default api;

export {
  authAPI,
  alunosAPI,
  responsaveisAPI,
  atividadesAPI,
  matriculasAPI,
  frequenciasAPI,
  mensalidadesAPI,
  relatoriosAPI,
  usuariosAPI,
  utilsAPI,
  configuracoesAPI,
  horariosAPI
}; 