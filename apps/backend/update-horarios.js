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

async function updateHorarios() {
  let pool;
  
  try {
    console.log('🔧 Atualizando estrutura de horários...');
    console.log(`📊 Configuração: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    
    // Conectar ao banco
    pool = new Pool(poolConfig);
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    
    // 1. Criar tabela de horários
    console.log('📋 Criando tabela horarios_atividades...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS horarios_atividades (
        id SERIAL PRIMARY KEY,
        atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
        dia_semana INTEGER NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7),
        horario_inicio TIME NOT NULL,
        horario_fim TIME NOT NULL,
        vagas_disponiveis INTEGER DEFAULT 30,
        ativo BOOLEAN DEFAULT true,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(atividade_id, dia_semana, horario_inicio)
      );
    `);
    
    // 2. Criar índices
    console.log('📊 Criando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_horarios_atividade_id ON horarios_atividades(atividade_id);
      CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios_atividades(dia_semana);
      CREATE INDEX IF NOT EXISTS idx_horarios_ativo ON horarios_atividades(ativo);
    `);
    
    // 3. Verificar se as colunas existem antes de remover
    console.log('🔍 Verificando estrutura atual...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'atividades' 
      AND column_name IN ('dias_semana', 'horario_inicio', 'horario_fim', 'vagas_disponiveis')
    `);
    
    // 4. Remover colunas antigas se existirem
    for (const column of columnsCheck.rows) {
      console.log(`🗑️ Removendo coluna: ${column.column_name}`);
      await pool.query(`ALTER TABLE atividades DROP COLUMN IF EXISTS ${column.column_name}`);
    }
    
    // 5. Adicionar nova coluna
    console.log('➕ Adicionando coluna vagas_totais...');
    await pool.query(`
      ALTER TABLE atividades ADD COLUMN IF NOT EXISTS vagas_totais INTEGER DEFAULT 30;
    `);
    
    // 6. Adicionar colunas nas tabelas relacionadas
    console.log('🔗 Atualizando tabelas relacionadas...');
    await pool.query(`
      ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE;
      ALTER TABLE frequencias ADD COLUMN IF NOT EXISTS horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE;
    `);
    
    // 7. Criar funções e triggers
    console.log('⚙️ Criando funções e triggers...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION atualizar_vagas_disponiveis()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE horarios_atividades 
        SET vagas_disponiveis = vagas_disponiveis - 1
        WHERE id = NEW.horario_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION restaurar_vagas_disponiveis()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE horarios_atividades 
        SET vagas_disponiveis = vagas_disponiveis + 1
        WHERE id = OLD.horario_id;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // 8. Criar triggers
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_atualizar_vagas_matricula ON matriculas;
      CREATE TRIGGER trigger_atualizar_vagas_matricula
        AFTER INSERT ON matriculas
        FOR EACH ROW
        WHEN (NEW.horario_id IS NOT NULL)
        EXECUTE FUNCTION atualizar_vagas_disponiveis();
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_restaurar_vagas_matricula ON matriculas;
      CREATE TRIGGER trigger_restaurar_vagas_matricula
        AFTER DELETE ON matriculas
        FOR EACH ROW
        WHEN (OLD.horario_id IS NOT NULL)
        EXECUTE FUNCTION restaurar_vagas_disponiveis();
    `);
    
    // 9. Inserir horários de exemplo
    console.log('📅 Inserindo horários de exemplo...');
    await pool.query(`
      INSERT INTO horarios_atividades (atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis) VALUES
      -- Informática: Segunda 8h, Terça 9h, Quarta 14h
      (4, 1, '08:00:00', '09:00:00', 15),
      (4, 2, '09:00:00', '10:00:00', 15),
      (4, 3, '14:00:00', '15:00:00', 15),
      
      -- Dança: Segunda 14h, Quarta 16h, Sexta 18h
      (1, 1, '14:00:00', '15:00:00', 20),
      (1, 3, '16:00:00', '17:00:00', 20),
      (1, 5, '18:00:00', '19:00:00', 20),
      
      -- Natação: Terça 7h, Quinta 8h, Sábado 9h
      (2, 2, '07:00:00', '08:00:00', 10),
      (2, 4, '08:00:00', '09:00:00', 10),
      (2, 6, '09:00:00', '10:00:00', 10),
      
      -- Bombeiro Mirim: Sábado 14h, Domingo 9h
      (3, 6, '14:00:00', '16:00:00', 25),
      (3, 7, '09:00:00', '11:00:00', 25),
      
      -- Hidroginástica: Segunda 7h, Quarta 7h, Sexta 7h
      (5, 1, '07:00:00', '08:00:00', 12),
      (5, 3, '07:00:00', '08:00:00', 12),
      (5, 5, '07:00:00', '08:00:00', 12),
      
      -- Funcional: Terça 18h, Quinta 18h
      (6, 2, '18:00:00', '19:00:00', 15),
      (6, 4, '18:00:00', '19:00:00', 15),
      
      -- Fisioterapia: Segunda a Sexta 8h-17h
      (7, 1, '08:00:00', '17:00:00', 5),
      (7, 2, '08:00:00', '17:00:00', 5),
      (7, 3, '08:00:00', '17:00:00', 5),
      (7, 4, '08:00:00', '17:00:00', 5),
      (7, 5, '08:00:00', '17:00:00', 5),
      
      -- Karatê: Terça 19h, Quinta 19h, Sábado 10h
      (8, 2, '19:00:00', '20:00:00', 20),
      (8, 4, '19:00:00', '20:00:00', 20),
      (8, 6, '10:00:00', '11:00:00', 20)
      ON CONFLICT (atividade_id, dia_semana, horario_inicio) DO NOTHING;
    `);
    
    console.log('🎉 Atualização de horários concluída com sucesso!');
    
    // 10. Mostrar estatísticas
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_horarios,
        COUNT(DISTINCT atividade_id) as atividades_com_horarios
      FROM horarios_atividades;
    `);
    
    console.log('📊 Estatísticas:');
    console.log(`   - Total de horários: ${stats.rows[0].total_horarios}`);
    console.log(`   - Atividades com horários: ${stats.rows[0].atividades_com_horarios}`);
    
  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executar atualização
updateHorarios(); 