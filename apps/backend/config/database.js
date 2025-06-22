const { Pool } = require('pg');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Configuração simplificada para funcionar no Render
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  // Forçar IPv4 para evitar problemas de conectividade
  family: 4,
  // Configurações adicionais para melhorar conectividade
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

// Only add password if it's not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

console.log('🔧 Configuração do banco:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  isProduction: process.env.NODE_ENV === 'production',
  originalHost: process.env.DB_HOST,
  family: poolConfig.family,
  ssl: poolConfig.ssl ? 'enabled' : 'disabled',
  sslMode: poolConfig.ssl?.sslmode || 'disabled'
});

// Criar pool de conexões
const pool = new Pool(poolConfig);

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err.message);
  
  if (err.code === '28P01') {
    console.log('💡 Dica: Configure uma senha para o usuário postgres ou deixe DB_PASSWORD vazio');
  }
  
  if (err.code === 'ECONNREFUSED') {
    console.log('💡 Dica: Verifique se o PostgreSQL está rodando');
  }
  
  if (err.code === 'ENETUNREACH') {
    console.log('💡 Dica: Erro de rede - verifique host e configurações de SSL');
  }
});

// Função para testar conexão
const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com banco...');
    console.log('📊 Ambiente:', process.env.NODE_ENV);
    console.log('🔗 Host:', process.env.DB_HOST);
    console.log('🗄️ Database:', process.env.DB_NAME);
    console.log('👤 User:', process.env.DB_USER);
    console.log('🔐 Password definido:', !!process.env.DB_PASSWORD);
    
    // Query simples igual ao health check
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco estabelecida:', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com o banco:', error.message);
    console.error('🔍 Detalhes do erro:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
}; 