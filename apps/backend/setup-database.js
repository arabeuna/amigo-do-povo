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
          perfil VARCHAR(20) DEFAULT 'admin',
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela usuarios criada');
      
      // Criar tabela de atividades
      await pool.query(`
        CREATE TABLE IF NOT EXISTS atividades (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT,
          tipo VARCHAR(50) NOT NULL,
          dias_semana VARCHAR(50),
          horario_inicio TIME,
          horario_fim TIME,
          instrutor_id INTEGER REFERENCES usuarios(id),
          vagas_maximas INTEGER DEFAULT 30,
          vagas_disponiveis INTEGER DEFAULT 30,
          valor_mensalidade DECIMAL(10,2),
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela atividades criada');
      
      // Criar tabela de alunos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS alunos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          cpf VARCHAR(14) UNIQUE,
          rg VARCHAR(20),
          data_nascimento DATE,
          sexo VARCHAR(1) CHECK (sexo IN ('M', 'F')),
          telefone VARCHAR(20),
          celular VARCHAR(20),
          email VARCHAR(100),
          endereco TEXT,
          bairro VARCHAR(100),
          cidade VARCHAR(100),
          estado VARCHAR(2),
          cep VARCHAR(10),
          observacoes TEXT,
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela alunos criada');
      
      // Criar tabela de matrículas
      await pool.query(`
        CREATE TABLE IF NOT EXISTS matriculas (
          id SERIAL PRIMARY KEY,
          aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
          atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'cancelada', 'concluida')),
          data_matricula DATE DEFAULT CURRENT_DATE,
          data_inicio DATE,
          data_fim DATE,
          observacoes TEXT,
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(aluno_id, atividade_id)
        );
      `);
      
      console.log('✅ Tabela matriculas criada');
      
    } else {
      console.log('✅ Tabelas já existem');
    }
    
    // Verificar se já existe um usuário admin
    const adminCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['admin@amigodopovo.com']);
    
    if (adminCheck.rows.length === 0) {
      // Criar usuário admin padrão
      const saltRounds = 12;
      const senhaCriptografada = await bcrypt.hash('101520_Amigo', saltRounds);
      
      await pool.query(`
        INSERT INTO usuarios (nome, email, senha, perfil) 
        VALUES ($1, $2, $3, $4)
      `, ['Administrador', 'admin@amigodopovo.com', senhaCriptografada, 'admin']);
      
      console.log('✅ Usuário admin criado com sucesso');
      console.log('📧 Email: admin@amigodopovo.com');
      console.log('🔑 Senha: 101520_Amigo');
      
      // Adicionar atividades de exemplo
      await pool.query(`
        INSERT INTO atividades (nome, descricao, tipo, valor_mensalidade) VALUES 
        ('Dança', 'Aulas de dança para todas as idades', 'dança', 50.00),
        ('Natação', 'Aulas de natação para iniciantes e avançados', 'natação', 80.00),
        ('Bombeiro Mirim', 'Curso de formação de bombeiro mirim', 'bombeiro_mirim', 60.00),
        ('Informática', 'Curso básico de informática', 'informática', 40.00),
        ('Hidroginástica', 'Aulas de hidroginástica', 'hidroginástica', 70.00),
        ('Funcional', 'Treinamento funcional', 'funcional', 60.00),
        ('Fisioterapia', 'Atendimento fisioterapêutico', 'fisioterapia', 100.00),
        ('Karatê', 'Aulas de karatê', 'karatê', 55.00)
      `);
      
      console.log('✅ Atividades de exemplo criadas');
      
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