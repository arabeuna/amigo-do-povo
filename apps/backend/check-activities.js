const db = require('./config/database');
require('dotenv').config();

async function checkActivities() {
  try {
    console.log('🔍 Verificando atividades no banco de dados...');
    
    // Verificar todas as atividades
    const result = await db.query(`
      SELECT id, nome, descricao, tipo, valor_mensalidade, ativo, data_criacao 
      FROM atividades 
      ORDER BY data_criacao DESC
    `);
    
    console.log(`✅ Encontradas ${result.rows.length} atividades:`);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma atividade encontrada no banco');
    } else {
      result.rows.forEach((atividade, index) => {
        console.log(`\n📋 Atividade ${index + 1}:`);
        console.log(`   ID: ${atividade.id}`);
        console.log(`   Nome: ${atividade.nome}`);
        console.log(`   Tipo: ${atividade.tipo}`);
        console.log(`   Valor: ${atividade.valor_mensalidade}`);
        console.log(`   Ativo: ${atividade.ativo}`);
        console.log(`   Criada em: ${atividade.data_criacao}`);
        if (atividade.descricao) {
          console.log(`   Descrição: ${atividade.descricao}`);
        }
      });
    }
    
    // Verificar se há atividades inativas
    const inativas = await db.query(`
      SELECT COUNT(*) as count 
      FROM atividades 
      WHERE ativo = false
    `);
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Total de atividades: ${result.rows.length}`);
    console.log(`   Atividades ativas: ${result.rows.length - inativas.rows[0].count}`);
    console.log(`   Atividades inativas: ${inativas.rows[0].count}`);
    
  } catch (error) {
    console.error('💥 Erro ao verificar atividades:', error);
  } finally {
    process.exit(0);
  }
}

checkActivities(); 