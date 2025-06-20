const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'amigo_do_povo',
  user: process.env.DB_USER || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Only add password if it's not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

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