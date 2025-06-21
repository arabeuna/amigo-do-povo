const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testando conexão com Supabase...');
console.log('📊 Configuração:');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT);
console.log('  Database:', process.env.DB_NAME);
console.log('  User:', process.env.DB_USER);
console.log('  Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentado para 10 segundos
  ssl: {
    rejectUnauthorized: false // Importante para Supabase
  }
};

async function testConnection() {
  let pool;
  
  try {
    console.log('🔗 Tentando conectar...');
    pool = new Pool(poolConfig);
    
    // Testar conexão
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conectado com sucesso!');
    console.log('📅 Data/hora do servidor:', result.rows[0].now);
    
    // Verificar tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Tipo do erro:', error.name);
    
    if (error.code === 'ENETUNREACH') {
      console.log('\n💡 Erro ENETUNREACH - Possíveis soluções:');
      console.log('1. Verificar se o host está correto');
      console.log('2. Verificar se o Supabase permite conexões externas');
      console.log('3. Verificar se há firewall bloqueando');
      console.log('4. Tentar usar o pooler do Supabase');
    }
    
    if (error.code === '28P01') {
      console.log('\n💡 Erro de autenticação - Verificar senha');
    }
    
    if (error.code === '3D000') {
      console.log('\n💡 Banco não existe - Verificar nome do banco');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testConnection(); 