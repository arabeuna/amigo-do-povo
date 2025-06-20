const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do banco de dados
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'amigo_do_povo',
  user: process.env.DB_USER || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Only add password if it's not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

async function setupDatabase() {
  let pool;
  
  try {
    console.log('🔧 Configurando banco de dados...');
    console.log(`📊 Configuração: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    console.log(`👤 Usuário: ${poolConfig.user}`);
    
    // Tentar conectar ao banco
    pool = new Pool(poolConfig);
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    
    // Verificar se o banco existe
    const dbCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log('📋 Criando tabelas...');
      
      // Criar tabela de usuários
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          perfil VARCHAR(20) DEFAULT 'usuario',
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela usuarios criada');
    } else {
      console.log('✅ Tabelas já existem');
    }
    
    // Verificar se já existe um usuário admin
    const adminCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['admin@amigodopovo.com']);
    
    if (adminCheck.rows.length === 0) {
      // Criar usuário admin padrão
      const saltRounds = 12;
      const senhaCriptografada = await bcrypt.hash('admin123', saltRounds);
      
      await pool.query(`
        INSERT INTO usuarios (nome, email, senha, perfil) 
        VALUES ($1, $2, $3, $4)
      `, ['Administrador', 'admin@amigodopovo.com', senhaCriptografada, 'admin']);
      
      console.log('✅ Usuário admin criado com sucesso');
      console.log('📧 Email: admin@amigodopovo.com');
      console.log('🔑 Senha: admin123');
    } else {
      console.log('✅ Usuário admin já existe');
    }
    
    console.log('🎉 Configuração do banco concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL não está rodando. Para resolver:');
      console.log('1. Instale o PostgreSQL: https://www.postgresql.org/download/');
      console.log('2. Inicie o serviço PostgreSQL');
      console.log('3. Ou use um banco online (Render, Railway, etc.)');
    }
    
    if (error.code === '28P01') {
      console.log('\n💡 Erro de autenticação. Para resolver:');
      console.log('1. Configure uma senha para o usuário postgres');
      console.log('2. Ou deixe DB_PASSWORD vazio no config.env');
      console.log('3. Ou use outro usuário do PostgreSQL');
    }
    
    if (error.code === '3D000') {
      console.log('\n💡 Banco de dados não existe. Para resolver:');
      console.log('1. Crie o banco: CREATE DATABASE amigo_do_povo;');
      console.log('2. Ou configure outro banco no config.env');
    }
    
    console.log('\n🔧 Para desenvolvimento rápido, você pode:');
    console.log('1. Instalar PostgreSQL Desktop');
    console.log('2. Criar um banco chamado "amigo_do_povo"');
    console.log('3. Deixar a senha vazia no config.env');
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executar setup
setupDatabase(); 