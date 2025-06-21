const db = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas no banco de dados...');
    
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas existentes:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar tabelas específicas
    const tablesToCheck = ['usuarios', 'alunos', 'atividades', 'matriculas', 'frequencias', 'mensalidades'];
    
    console.log('\n🔍 Verificando tabelas específicas:');
    for (const table of tablesToCheck) {
      try {
        const checkResult = await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`  ✅ ${table}: EXISTE`);
      } catch (error) {
        console.log(`  ❌ ${table}: NÃO EXISTE (${error.code})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables(); 