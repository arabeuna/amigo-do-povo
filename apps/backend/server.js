const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { auth, authorize } = require('./middleware/auth');
const authController = require('./controllers/authController');
const alunosController = require('./controllers/alunosController');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARES DE SEGURANÇA E PERFORMANCE
// =====================================================

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  }
});

app.use(limiter);

// Segurança
app.use(helmet());

// Compressão
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// SERVIÇO DE ARQUIVOS ESTÁTICOS (FRONTEND)
// =====================================================

// Servir arquivos estáticos do frontend build
app.use(express.static(path.join(__dirname, 'frontend')));

// =====================================================
// ROTAS PÚBLICAS
// =====================================================

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema Amigo do Povo - Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      alunos: '/api/alunos'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema Amigo do Povo - Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Autenticação
app.post('/api/auth/login', authController.login);
app.post('/api/auth/registrar', authController.registrar);

// =====================================================
// ROTAS PROTEGIDAS
// =====================================================

// Middleware de autenticação para todas as rotas abaixo
app.use('/api', auth);

// Dados do usuário logado
app.get('/api/auth/me', authController.me);
app.put('/api/auth/alterar-senha', authController.alterarSenha);

// Alunos
app.get('/api/alunos', authorize('admin', 'instrutor', 'financeiro'), alunosController.listarAlunos);
app.get('/api/alunos/:id', authorize('admin', 'instrutor', 'financeiro'), alunosController.buscarAlunoPorId);
app.post('/api/alunos', authorize('admin'), alunosController.criarAluno);
app.put('/api/alunos/:id', authorize('admin'), alunosController.atualizarAluno);
app.delete('/api/alunos/:id', authorize('admin'), alunosController.deletarAluno);
app.get('/api/alunos/:id/matriculas', authorize('admin', 'instrutor', 'financeiro'), alunosController.buscarMatriculasAluno);

// =====================================================
// ROTA DE FALLBACK PARA SPA (SINGLE PAGE APPLICATION)
// =====================================================

// Para todas as outras rotas, servir o index.html do React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
}); 