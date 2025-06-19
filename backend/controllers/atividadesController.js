const { validationResult } = require('express-validator');
const db = require('../config/database');

const listarAtividades = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      busca = '', 
      ativo = true,
      tipo 
    } = req.query;

    const offset = (pagina - 1) * limite;
    let whereConditions = ['a.ativo = $1'];
    let params = [ativo];
    let paramIndex = 2;

    if (busca) {
      whereConditions.push(`(a.nome ILIKE $${paramIndex} OR a.descricao ILIKE $${paramIndex})`);
      params.push(`%${busca}%`);
      paramIndex++;
    }

    if (tipo) {
      whereConditions.push(`a.tipo = $${paramIndex}`);
      params.push(tipo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) 
      FROM atividades a 
      LEFT JOIN usuarios u ON a.instrutor_id = u.id 
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query principal
    const query = `
      SELECT 
        a.*,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        (SELECT COUNT(*) FROM matriculas m WHERE m.atividade_id = a.id AND m.status = 'ativa' AND m.ativo = true) as alunos_matriculados
      FROM atividades a 
      LEFT JOIN usuarios u ON a.instrutor_id = u.id 
      WHERE ${whereClause}
      ORDER BY a.nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limite, offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        atividades: result.rows,
        paginacao: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total,
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarAtividadePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.*,
        u.nome as instrutor_nome,
        u.email as instrutor_email
      FROM atividades a 
      LEFT JOIN usuarios u ON a.instrutor_id = u.id 
      WHERE a.id = $1 AND a.ativo = true
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const criarAtividade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      nome,
      descricao,
      tipo,
      dias_semana,
      horario_inicio,
      horario_fim,
      instrutor_id,
      vagas_maximas,
      valor_mensalidade
    } = req.body;

    const query = `
      INSERT INTO atividades (
        nome, descricao, tipo, dias_semana, horario_inicio, horario_fim,
        instrutor_id, vagas_maximas, vagas_disponiveis, valor_mensalidade
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      nome, descricao, tipo, dias_semana, horario_inicio, horario_fim,
      instrutor_id, vagas_maximas, valor_mensalidade
    ]);

    res.status(201).json({
      success: true,
      message: 'Atividade criada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const atualizarAtividade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo,
      dias_semana,
      horario_inicio,
      horario_fim,
      instrutor_id,
      vagas_maximas,
      valor_mensalidade
    } = req.body;

    // Verificar se atividade existe
    const atividadeExistente = await db.query(
      'SELECT id FROM atividades WHERE id = $1 AND ativo = true',
      [id]
    );

    if (atividadeExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    // Calcular vagas disponíveis
    const matriculasAtivas = await db.query(
      'SELECT COUNT(*) FROM matriculas WHERE atividade_id = $1 AND status = $2 AND ativo = true',
      [id, 'ativa']
    );
    
    const alunosMatriculados = parseInt(matriculasAtivas.rows[0].count);
    const vagasDisponiveis = Math.max(0, vagas_maximas - alunosMatriculados);

    const query = `
      UPDATE atividades SET 
        nome = $1, descricao = $2, tipo = $3, dias_semana = $4,
        horario_inicio = $5, horario_fim = $6, instrutor_id = $7,
        vagas_maximas = $8, vagas_disponiveis = $9, valor_mensalidade = $10
      WHERE id = $11 AND ativo = true
      RETURNING *
    `;

    const result = await db.query(query, [
      nome, descricao, tipo, dias_semana, horario_inicio, horario_fim,
      instrutor_id, vagas_maximas, vagasDisponiveis, valor_mensalidade, id
    ]);

    res.json({
      success: true,
      message: 'Atividade atualizada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deletarAtividade = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se atividade existe
    const atividadeExistente = await db.query(
      'SELECT id FROM atividades WHERE id = $1 AND ativo = true',
      [id]
    );

    if (atividadeExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    // Verificar se há alunos matriculados
    const matriculasAtivas = await db.query(
      'SELECT COUNT(*) FROM matriculas WHERE atividade_id = $1 AND status = $2 AND ativo = true',
      [id, 'ativa']
    );

    if (parseInt(matriculasAtivas.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar uma atividade que possui alunos matriculados'
      });
    }

    // Soft delete
    await db.query(
      'UPDATE atividades SET ativo = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Atividade removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarAlunosMatriculados = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        a.telefone as aluno_telefone,
        a.celular as aluno_celular,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone
      FROM matriculas m
      JOIN alunos a ON m.aluno_id = a.id
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id
      WHERE m.atividade_id = $1 AND m.ativo = true
      ORDER BY a.nome
    `;

    const result = await db.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar alunos matriculados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const listarTiposAtividades = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT tipo 
      FROM atividades 
      WHERE ativo = true 
      ORDER BY tipo
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => row.tipo)
    });

  } catch (error) {
    console.error('Erro ao listar tipos de atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  listarAtividades,
  buscarAtividadePorId,
  criarAtividade,
  atualizarAtividade,
  deletarAtividade,
  buscarAlunosMatriculados,
  listarTiposAtividades
}; 