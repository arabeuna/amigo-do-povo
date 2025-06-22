const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const { auth, authorize } = require('./middleware/auth');
const authController = require('./controllers/authController');
const alunosController = require('./controllers/alunosController');
const atividadesController = require('./controllers/atividadesController');
const frequenciasController = require('./controllers/frequenciasController');
const mensalidadesController = require('./controllers/mensalidadesController');
const relatoriosController = require('./controllers/relatoriosController');
const configuracoesController = require('./controllers/configuracoesController');
const horariosController = require('./controllers/horariosController');
const { validarCriarAluno, validarAtualizarAluno } = require('./validations/alunosValidation');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// CONFIGURAÇÃO PARA PRODUÇÃO (RENDER)
// =====================================================

// Configurar para confiar no proxy do Render
app.set('trust proxy', 1);

// =====================================================
// CORS - DEVE VIR PRIMEIRO
// =====================================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.1.5:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// =====================================================
// MIDDLEWARES DE SEGURANÇA E PERFORMANCE
// =====================================================

// Rate limiting mais permissivo para produção
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Aumentado para 1000 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  // Excluir arquivos estáticos do rate limiting
  skip: (req) => {
    // Não aplicar rate limiting para arquivos estáticos
    const shouldSkip = req.path.includes('.') || 
           req.path === '/favicon.ico' || 
           req.path === '/manifest.json' ||
           req.path.startsWith('/static/') ||
           req.path.startsWith('/assets/');
    
    if (shouldSkip) {
      console.log(`🚫 Rate limiting pulado para: ${req.path}`);
    }
    
    return shouldSkip;
  },
  // Headers personalizados para debug
  standardHeaders: true,
  legacyHeaders: false,
  // Log quando rate limit é atingido
  handler: (req, res) => {
    console.log(`⚠️ Rate limit atingido para IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente em alguns minutos.'
    });
  }
});

// Aplicar rate limiting apenas nas rotas da API
app.use('/api', limiter);

// Rate limiting mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
});

// Aplicar rate limiting específico para autenticação
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/registrar', authLimiter);

// Segurança
app.use(helmet());

// Compressão
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// MIDDLEWARE PARA REQUISIÇÕES OPTIONS (PREFLIGHT)
// =====================================================

app.options('*', cors());

// =====================================================
// CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS PARA PRODUÇÃO
// =====================================================

// Em produção, servir arquivos estáticos do frontend
if (process.env.NODE_ENV === 'production') {
  // Servir arquivos estáticos do build do React
  app.use(express.static(path.join(__dirname, 'frontend')));
  
  // Servir arquivos CSS e JS do build
  app.use('/static', express.static(path.join(__dirname, 'frontend/static')));
  
  console.log('📁 Configurado para servir arquivos estáticos do frontend');
}

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
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Sistema Amigo do Povo - Backend funcionando!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        db_host: process.env.DB_HOST || 'localhost',
        db_name: process.env.DB_NAME || 'amigo_do_povo'
      }
    });
  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
    res.status(503).json({
      success: false,
      message: 'Erro no health check',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message
    });
  }
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

// Endpoint de teste para debug
app.get('/api/test-auth', (req, res) => {
  console.log('🧪 Endpoint de teste chamado');
  console.log('👤 Usuário autenticado:', req.user);
  res.json({
    success: true,
    message: 'Autenticação funcionando!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de teste sem autenticação
app.get('/api/test-public', (req, res) => {
  console.log('🌐 Endpoint público chamado');
  res.json({
    success: true,
    message: 'Endpoint público funcionando!',
    timestamp: new Date().toISOString(),
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
  });
});

// Configuração do multer para upload de arquivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Alunos
app.get('/api/alunos', authorize('admin', 'instrutor', 'financeiro'), alunosController.listarAlunos);

// Importação e Exportação de Alunos (DEVE VIR ANTES das rotas com :id)
app.get('/api/alunos/exportar', authorize('admin', 'instrutor', 'financeiro'), alunosController.exportarAlunos);
app.post('/api/alunos/importar', authorize('admin'), upload.single('arquivo'), alunosController.importarAlunos);
app.get('/api/alunos/template', authorize('admin', 'instrutor', 'financeiro'), alunosController.downloadTemplate);

// Rotas de alunos com parâmetros (DEVEM VIR DEPOIS das rotas específicas)
app.get('/api/alunos/:id', authorize('admin', 'instrutor', 'financeiro'), alunosController.buscarAlunoPorId);
app.post('/api/alunos', authorize('admin'), validarCriarAluno, alunosController.criarAluno);
app.put('/api/alunos/:id', authorize('admin'), validarAtualizarAluno, alunosController.atualizarAluno);
app.delete('/api/alunos/:id', authorize('admin'), alunosController.deletarAluno);
app.get('/api/alunos/:id/matriculas', authorize('admin', 'instrutor', 'financeiro'), alunosController.buscarMatriculasAluno);

// Atividades
app.get('/api/atividades', authorize('admin', 'instrutor', 'financeiro'), atividadesController.listarAtividades);

// Importação e Exportação de Atividades (DEVE VIR ANTES das rotas com :id)
app.get('/api/atividades/exportar', authorize('admin', 'instrutor', 'financeiro'), atividadesController.exportarAtividades);
app.post('/api/atividades/importar', authorize('admin'), upload.single('arquivo'), atividadesController.importarAtividades);
app.get('/api/atividades/template', authorize('admin', 'instrutor', 'financeiro'), atividadesController.downloadTemplateAtividades);

app.get('/api/atividades/:id', authorize('admin', 'instrutor', 'financeiro'), atividadesController.buscarAtividadePorId);
app.post('/api/atividades', authorize('admin'), atividadesController.criarAtividade);
app.put('/api/atividades/:id', authorize('admin'), atividadesController.atualizarAtividade);
app.delete('/api/atividades/:id', authorize('admin'), atividadesController.deletarAtividade);
app.get('/api/atividades/tipos', authorize('admin', 'instrutor', 'financeiro'), atividadesController.listarTiposAtividades);

// Horários de Atividades
app.get('/api/horarios', authorize('admin', 'instrutor', 'financeiro'), horariosController.listarHorarios);

// Importação e Exportação de Horários (DEVE VIR ANTES das rotas com :id)
app.get('/api/horarios/exportar', authorize('admin', 'instrutor', 'financeiro'), horariosController.exportarHorarios);
app.post('/api/horarios/importar', authorize('admin'), upload.single('arquivo'), horariosController.importarHorarios);
app.get('/api/horarios/template', authorize('admin', 'instrutor', 'financeiro'), horariosController.downloadTemplate);

app.get('/api/horarios/disponiveis', authorize('admin', 'instrutor', 'financeiro'), horariosController.listarHorariosDisponiveis);
app.get('/api/horarios/dias-semana', authorize('admin', 'instrutor', 'financeiro'), horariosController.getDiasSemana);
app.get('/api/horarios/:id', authorize('admin', 'instrutor', 'financeiro'), horariosController.buscarHorarioPorId);
app.post('/api/horarios', authorize('admin'), horariosController.criarHorario);
app.put('/api/horarios/:id', authorize('admin'), horariosController.atualizarHorario);
app.delete('/api/horarios/:id', authorize('admin'), horariosController.deletarHorario);

// Horários por atividade
app.get('/api/atividades/:atividade_id/horarios', authorize('admin', 'instrutor', 'financeiro'), horariosController.listarHorarios);

// Frequências
app.get('/api/frequencias', authorize('admin', 'instrutor'), frequenciasController.listarFrequencias);

// Importação e Exportação de Frequências (DEVE VIR ANTES das rotas com :id)
app.get('/api/frequencias/exportar', authorize('admin', 'instrutor'), frequenciasController.exportarFrequencias);
app.post('/api/frequencias/importar', authorize('admin', 'instrutor'), upload.single('arquivo'), frequenciasController.importarFrequencias);
app.get('/api/frequencias/template', authorize('admin', 'instrutor'), frequenciasController.downloadTemplate);

// Rotas de frequências com parâmetros (DEVEM VIR DEPOIS das rotas específicas)
app.get('/api/frequencias/:id', authorize('admin', 'instrutor'), frequenciasController.buscarFrequenciaPorId);
app.post('/api/frequencias', authorize('admin', 'instrutor'), frequenciasController.registrarFrequencia);
app.post('/api/frequencias/lote', authorize('admin', 'instrutor'), frequenciasController.registrarFrequenciaEmLote);
app.put('/api/frequencias/:id', authorize('admin', 'instrutor'), frequenciasController.atualizarFrequencia);
app.delete('/api/frequencias/:id', authorize('admin'), frequenciasController.deletarFrequencia);
app.get('/api/frequencias/atividade/:atividade_id', authorize('admin', 'instrutor'), frequenciasController.buscarFrequenciasPorAtividade);
app.get('/api/frequencias/relatorio', authorize('admin', 'instrutor'), frequenciasController.buscarRelatorioFrequencia);
app.get('/api/atividades/:atividade_id/alunos-matriculados', authorize('admin', 'instrutor'), frequenciasController.listarAlunosMatriculados);

// Mensalidades
app.get('/api/mensalidades', authorize('admin', 'financeiro'), mensalidadesController.listarMensalidades);

// Importação e Exportação de Mensalidades (DEVE VIR ANTES das rotas com :id)
app.get('/api/mensalidades/exportar', authorize('admin', 'financeiro'), mensalidadesController.exportarMensalidades);
app.post('/api/mensalidades/importar', authorize('admin', 'financeiro'), upload.single('arquivo'), mensalidadesController.importarMensalidades);
app.get('/api/mensalidades/template', authorize('admin', 'financeiro'), mensalidadesController.downloadTemplate);

app.get('/api/mensalidades/:id', authorize('admin', 'financeiro'), mensalidadesController.buscarMensalidadePorId);
app.post('/api/mensalidades/gerar', authorize('admin'), mensalidadesController.gerarMensalidades);
app.put('/api/mensalidades/:id/pagamento', authorize('admin', 'financeiro'), mensalidadesController.registrarPagamento);
app.put('/api/mensalidades/atualizar-vencidas', authorize('admin'), mensalidadesController.atualizarStatusVencidas);
app.get('/api/mensalidades/relatorio', authorize('admin', 'financeiro'), mensalidadesController.relatorioFinanceiro);

// Relatórios
app.get('/api/relatorios/dashboard', authorize('admin', 'financeiro'), relatoriosController.getDashboard);
app.get('/api/relatorios/detalhado', authorize('admin', 'financeiro'), relatoriosController.getRelatorioDetalhado);
app.get('/api/relatorios/exportar', authorize('admin', 'financeiro'), relatoriosController.exportarRelatorio);

// Configurações
app.get('/api/configuracoes', authorize('admin'), configuracoesController.getConfiguracoes);
app.put('/api/usuarios/perfil', authorize('admin', 'instrutor', 'financeiro'), configuracoesController.atualizarPerfil);
app.put('/api/configuracoes/sistema', authorize('admin'), configuracoesController.salvarConfiguracoesSistema);
app.put('/api/configuracoes/seguranca', authorize('admin'), configuracoesController.salvarConfiguracoesSeguranca);
app.put('/api/configuracoes/backup', authorize('admin'), configuracoesController.salvarConfiguracoesBackup);
app.post('/api/configuracoes/backup/manual', authorize('admin'), configuracoesController.iniciarBackupManual);
app.post('/api/configuracoes/backup/restore', authorize('admin'), configuracoesController.restaurarBackup);
app.get('/api/configuracoes/backup/status', authorize('admin'), configuracoesController.getStatusBackup);

// =====================================================
// ROTA DE FALLBACK PARA SPA (SINGLE PAGE APPLICATION)
// =====================================================

// Para todas as outras rotas, servir o index.html do React
app.get('*', (req, res) => {
  // Em produção, servir o index.html do frontend
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
  } else {
    // Em desenvolvimento, redirecionar para o frontend
    res.redirect('http://localhost:3000');
  }
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

const startServer = async () => {
  try {
    // Iniciar servidor imediatamente (sem testes de banco)
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      
      // Verificar variáveis de ambiente importantes
      console.log(`🔑 JWT_SECRET definido: ${process.env.JWT_SECRET ? 'Sim' : 'NÃO'}`);
      if (process.env.JWT_SECRET) {
        console.log(`🔑 JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
        console.log(`🔑 JWT_SECRET (primeiros 10 chars): ${process.env.JWT_SECRET.substring(0, 10)}...`);
      }
      
      console.log(`🗄️ DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`🗄️ DB_NAME: ${process.env.DB_NAME || 'amigo_do_povo'}`);
      console.log(`🗄️ DB_USER: ${process.env.DB_USER || 'postgres'}`);
      console.log(`🗄️ DB_PASSWORD definido: ${process.env.DB_PASSWORD ? 'Sim' : 'NÃO'}`);
    });
  } catch (error) {
    console.error('💥 Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
}); 