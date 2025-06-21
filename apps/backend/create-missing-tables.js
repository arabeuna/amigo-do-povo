const { Pool } = require('pg');
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

async function createMissingTables() {
  let pool;
  
  try {
    console.log('🔧 Criando tabelas que estão faltando...');
    console.log(`📊 Configuração: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    
    // Tentar conectar ao banco
    pool = new Pool(poolConfig);
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    
    // Verificar se a tabela frequencias existe
    const frequenciasCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'frequencias'
    `);
    
    if (frequenciasCheck.rows.length === 0) {
      console.log('📋 Criando tabela frequencias...');
      
      // Criar tabela de frequências
      await pool.query(`
        CREATE TABLE IF NOT EXISTS frequencias (
          id SERIAL PRIMARY KEY,
          aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
          atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
          data_aula DATE NOT NULL,
          presente BOOLEAN DEFAULT false,
          justificativa TEXT,
          observacoes TEXT,
          registrado_por INTEGER REFERENCES usuarios(id),
          data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(aluno_id, atividade_id, data_aula)
        );
      `);
      
      console.log('✅ Tabela frequencias criada');
    } else {
      console.log('✅ Tabela frequencias já existe');
    }
    
    // Verificar se a tabela mensalidades existe
    const mensalidadesCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'mensalidades'
    `);
    
    if (mensalidadesCheck.rows.length === 0) {
      console.log('📋 Criando tabela mensalidades...');
      
      // Criar tabela de mensalidades
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mensalidades (
          id SERIAL PRIMARY KEY,
          aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
          atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
          mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
          ano INTEGER NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
          data_vencimento DATE,
          data_pagamento DATE,
          forma_pagamento VARCHAR(50),
          observacoes TEXT,
          ativo BOOLEAN DEFAULT true,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(aluno_id, atividade_id, mes, ano)
        );
      `);
      
      console.log('✅ Tabela mensalidades criada');
    } else {
      console.log('✅ Tabela mensalidades já existe');
    }
    
    console.log('🎉 Tabelas criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na criação das tabelas:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executar criação
createMissingTables(); 