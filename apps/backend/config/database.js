const { Pool } = require('pg');
require('dotenv').config();

// Usar pooler do Supabase se estiver em produção
const isProduction = process.env.NODE_ENV === 'production';
const usePooler = isProduction && process.env.DB_HOST && process.env.DB_HOST.includes('supabase');

let poolConfig;

if (usePooler) {
  // Configuração para pooler do Supabase (mais compatível com Render)
  poolConfig = {
    host: process.env.DB_HOST.replace('db.', 'aws-0-sa-east-1.pooler.supabase.com'),
    port: 6543, // Porta do pooler
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Configuração normal
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'amigo_do_povo',
    user: process.env.DB_USER || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

// Only add password if it's not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

console.log('🔧 Configuração do banco:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  usePooler,
  isProduction
});

// For development, if no password is set, try without password
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
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com o banco:', error.message);
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
}; 