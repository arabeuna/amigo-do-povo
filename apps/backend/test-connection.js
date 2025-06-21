const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Testando conexão com banco de dados...');
console.log('📊 Configuração:');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT);
console.log('  Database:', process.env.DB_NAME);
console.log('  User:', process.env.DB_USER);
console.log('  Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('  Password (first 5 chars):', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.substring(0, 5) + '...' : 'undefined');

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

console.log('🔧 Pool config:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  passwordLength: poolConfig.password ? poolConfig.password.length : 0
});

async function testConnection() {
  let pool;
  
  try {
    console.log('🔗 Tentando conectar...');
    pool = new Pool(poolConfig);
    
    // Testar conexão
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conectado com sucesso!');
    console.log('📅 Data/hora do servidor:', result.rows[0].now);
    
    // Verificar se o banco existe
    const dbCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log('📋 Nenhuma tabela encontrada - banco vazio');
    } else {
      console.log('✅ Tabelas já existem');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Tipo do erro:', error.name);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testConnection(); 