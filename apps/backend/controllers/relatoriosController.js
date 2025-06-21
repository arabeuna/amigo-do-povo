const { Pool } = require('pg');
const pool = require('../config/database');

// Dashboard com dados resumidos
const getDashboard = async (req, res) => {
  try {
    const { periodo, mes, ano, atividade_id } = req.query;
    
    // Determinar período baseado no filtro
    let dataInicio, dataFim;
    const hoje = new Date();
    
    switch (periodo) {
      case 'mes_atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'mes_anterior':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
        dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0);
        break;
      case 'semestre':
        dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 6) * 6, 1);
        dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 6) * 6 + 6, 0);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
      case 'personalizado':
        dataInicio = new Date(ano, mes - 1, 1);
        dataFim = new Date(ano, mes, 0);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    // Total de alunos
    const totalAlunosQuery = await pool.query(
      'SELECT COUNT(*) as total FROM alunos WHERE ativo = true'
    );
    const totalAlunos = parseInt(totalAlunosQuery.rows[0].total);

    // Total de atividades
    const totalAtividadesQuery = await pool.query(
      'SELECT COUNT(*) as total FROM atividades WHERE ativo = true'
    );
    const totalAtividades = parseInt(totalAtividadesQuery.rows[0].total);

    // Mensalidades por status
    const mensalidadesQuery = await pool.query(`
      SELECT 
        status,
        COUNT(*) as total,
        SUM(valor) as valor_total
      FROM mensalidades 
      WHERE data_criacao >= $1 AND data_criacao <= $2
      ${atividade_id ? 'AND atividade_id = $3' : ''}
      GROUP BY status
    `, atividade_id ? [dataInicio, dataFim, atividade_id] : [dataInicio, dataFim]);

    let mensalidadesPagas = 0;
    let mensalidadesPendentes = 0;
    let mensalidadesAtrasadas = 0;
    let arrecadacaoMensal = 0;

    mensalidadesQuery.rows.forEach(row => {
      if (row.status === 'pago') {
        mensalidadesPagas = parseInt(row.total);
        arrecadacaoMensal += parseFloat(row.valor_total || 0);
      } else if (row.status === 'pendente') {
        mensalidadesPendentes = parseInt(row.total);
      } else if (row.status === 'atrasado') {
        mensalidadesAtrasadas = parseInt(row.total);
      }
    });

    // Frequência média
    const frequenciaQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_registros,
        SUM(CASE WHEN presente = true THEN 1 ELSE 0 END) as total_presentes
      FROM frequencias 
      WHERE data_aula >= $1 AND data_aula <= $2
      ${atividade_id ? 'AND atividade_id = $3' : ''}
    `, atividade_id ? [dataInicio, dataFim, atividade_id] : [dataInicio, dataFim]);

    const totalRegistros = parseInt(frequenciaQuery.rows[0].total_registros || 0);
    const totalPresentes = parseInt(frequenciaQuery.rows[0].total_presentes || 0);
    const frequenciaMedia = totalRegistros > 0 ? (totalPresentes / totalRegistros) * 100 : 0;

    // Alunos por atividade
    const alunosPorAtividadeQuery = await pool.query(`
      SELECT 
        a.nome as atividade,
        COUNT(DISTINCT m.aluno_id) as alunos
      FROM atividades a
      LEFT JOIN matriculas m ON a.id = m.atividade_id AND m.status = 'ativa'
      WHERE a.ativo = true
      GROUP BY a.id, a.nome
      ORDER BY alunos DESC
    `);

    // Frequência por atividade
    const frequenciaPorAtividadeQuery = await pool.query(`
      SELECT 
        a.nome as atividade,
        COUNT(*) as total_registros,
        SUM(CASE WHEN f.presente = true THEN 1 ELSE 0 END) as total_presentes
      FROM atividades a
      LEFT JOIN frequencias f ON a.id = f.atividade_id 
        AND f.data_aula >= $1 AND f.data_aula <= $2
      WHERE a.ativo = true
      GROUP BY a.id, a.nome
      ORDER BY a.nome
    `, [dataInicio, dataFim]);

    const frequenciaPorAtividade = frequenciaPorAtividadeQuery.rows.map(row => ({
      atividade: row.atividade,
      frequencia: row.total_registros > 0 ? (parseInt(row.total_presentes) / parseInt(row.total_registros)) * 100 : 0
    }));

    res.json({
      success: true,
      data: {
        totalAlunos,
        totalAtividades,
        mensalidadesPagas,
        mensalidadesPendentes,
        mensalidadesAtrasadas,
        frequenciaMedia,
        arrecadacaoMensal,
        alunosPorAtividade: alunosPorAtividadeQuery.rows,
        frequenciaPorAtividade
      }
    });

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Relatório detalhado
const getRelatorioDetalhado = async (req, res) => {
  try {
    const { tipo_relatorio, periodo, mes, ano, atividade_id, status } = req.query;
    
    // Determinar período baseado no filtro
    let dataInicio, dataFim;
    const hoje = new Date();
    
    switch (periodo) {
      case 'mes_atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'mes_anterior':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
        dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0);
        break;
      case 'semestre':
        dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 6) * 6, 1);
        dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 6) * 6 + 6, 0);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
      case 'personalizado':
        dataInicio = new Date(ano, mes - 1, 1);
        dataFim = new Date(ano, mes, 0);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    let query, params = [];

    switch (tipo_relatorio) {
      case 'alunos':
        query = `
          SELECT 
            a.nome,
            a.cpf,
            a.telefone,
            a.email,
            a.ativo,
            STRING_AGG(DISTINCT at.nome, ', ') as atividades
          FROM alunos a
          LEFT JOIN matriculas m ON a.id = m.aluno_id AND m.status = 'ativa'
          LEFT JOIN atividades at ON m.atividade_id = at.id
          WHERE 1=1
          ${status ? 'AND a.ativo = $1' : ''}
          ${atividade_id ? `AND m.atividade_id = ${status ? '$2' : '$1'}` : ''}
          GROUP BY a.id, a.nome, a.cpf, a.telefone, a.email, a.ativo
          ORDER BY a.nome
        `;
        
        if (status) params.push(status === 'ativo');
        if (atividade_id) params.push(atividade_id);
        break;

      case 'frequencias':
        query = `
          SELECT 
            al.nome as aluno_nome,
            at.nome as atividade_nome,
            CONCAT(EXTRACT(MONTH FROM f.data_frequencia), '/', EXTRACT(YEAR FROM f.data_frequencia)) as periodo,
            ROUND(
              (SUM(CASE WHEN f.presente = true THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100, 2
            ) as frequencia
          FROM frequencias f
          JOIN alunos al ON f.aluno_id = al.id
          JOIN atividades at ON f.atividade_id = at.id
          WHERE f.data_frequencia >= $1 AND f.data_frequencia <= $2
          ${atividade_id ? 'AND f.atividade_id = $3' : ''}
          GROUP BY al.id, al.nome, at.id, at.nome, EXTRACT(MONTH FROM f.data_frequencia), EXTRACT(YEAR FROM f.data_frequencia)
          ORDER BY al.nome, at.nome
        `;
        
        params = [dataInicio, dataFim];
        if (atividade_id) params.push(atividade_id);
        break;

      case 'mensalidades':
        query = `
          SELECT 
            al.nome as aluno_nome,
            at.nome as atividade_nome,
            CONCAT(m.mes, '/', m.ano) as periodo,
            m.valor,
            m.status
          FROM mensalidades m
          JOIN alunos al ON m.aluno_id = al.id
          JOIN atividades at ON m.atividade_id = at.id
          WHERE m.data_criacao >= $1 AND m.data_criacao <= $2
          ${atividade_id ? 'AND m.atividade_id = $3' : ''}
          ${status ? `AND m.status = ${atividade_id ? '$4' : '$3'}` : ''}
          ORDER BY al.nome, at.nome, m.ano DESC, m.mes DESC
        `;
        
        params = [dataInicio, dataFim];
        if (atividade_id) params.push(atividade_id);
        if (status) params.push(status);
        break;

      case 'atividades':
        query = `
          SELECT 
            a.nome,
            a.descricao,
            a.valor_mensalidade,
            a.ativo,
            COUNT(DISTINCT m.aluno_id) as alunos_matriculados,
            a.vagas_maximas - COUNT(DISTINCT m.aluno_id) as vagas_disponiveis
          FROM atividades a
          LEFT JOIN matriculas m ON a.id = m.atividade_id AND m.status = 'ativa'
          WHERE 1=1
          ${status ? 'AND a.ativo = $1' : ''}
          GROUP BY a.id, a.nome, a.descricao, a.valor_mensalidade, a.ativo, a.vagas_maximas
          ORDER BY a.nome
        `;
        
        if (status) params.push(status === 'ativo');
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de relatório inválido'
        });
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao carregar relatório detalhado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Exportar relatório
const exportarRelatorio = async (req, res) => {
  try {
    const { formato, ...filtros } = req.query;
    
    // Por enquanto, retornamos um JSON simples
    // Em produção, você pode implementar geração de PDF/Excel
    const relatorioData = await getRelatorioDetalhado({ query: filtros }, { json: (data) => data });
    
    if (formato === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${filtros.tipo_relatorio}_${new Date().toISOString().split('T')[0]}.pdf`);
      // Aqui você implementaria a geração de PDF
      res.send('PDF placeholder');
    } else if (formato === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${filtros.tipo_relatorio}_${new Date().toISOString().split('T')[0]}.xlsx`);
      // Aqui você implementaria a geração de Excel
      res.send('Excel placeholder');
    } else {
      res.json(relatorioData);
    }

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getDashboard,
  getRelatorioDetalhado,
  exportarRelatorio
}; 