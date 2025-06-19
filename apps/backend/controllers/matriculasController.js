const { validationResult } = require('express-validator');
const db = require('../config/database');

const listarMatriculas = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      busca = '', 
      status = '',
      atividade_id,
      aluno_id
    } = req.query;

    const offset = (pagina - 1) * limite;
    let whereConditions = ['m.ativo = true'];
    let params = [];
    let paramIndex = 1;

    if (busca) {
      whereConditions.push(`(a.nome ILIKE $${paramIndex} OR at.nome ILIKE $${paramIndex})`);
      params.push(`%${busca}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`m.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (atividade_id) {
      whereConditions.push(`m.atividade_id = $${paramIndex}`);
      params.push(atividade_id);
      paramIndex++;
    }

    if (aluno_id) {
      whereConditions.push(`m.aluno_id = $${paramIndex}`);
      params.push(aluno_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) 
      FROM matriculas m
      JOIN alunos a ON m.aluno_id = a.id
      JOIN atividades at ON m.atividade_id = at.id
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query principal
    const query = `
      SELECT 
        m.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        a.telefone as aluno_telefone,
        a.celular as aluno_celular,
        at.nome as atividade_nome,
        at.tipo as atividade_tipo,
        at.valor_mensalidade,
        u.nome as instrutor_nome,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone
      FROM matriculas m
      JOIN alunos a ON m.aluno_id = a.id
      JOIN atividades at ON m.atividade_id = at.id
      LEFT JOIN usuarios u ON at.instrutor_id = u.id
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id
      WHERE ${whereClause}
      ORDER BY m.data_matricula DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limite, offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        matriculas: result.rows,
        paginacao: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total,
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarMatriculaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        a.telefone as aluno_telefone,
        a.celular as aluno_celular,
        a.email as aluno_email,
        at.nome as atividade_nome,
        at.tipo as atividade_tipo,
        at.valor_mensalidade,
        at.dias_semana,
        at.horario_inicio,
        at.horario_fim,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone,
        r.celular as responsavel_celular
      FROM matriculas m
      JOIN alunos a ON m.aluno_id = a.id
      JOIN atividades at ON m.atividade_id = at.id
      LEFT JOIN usuarios u ON at.instrutor_id = u.id
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id
      WHERE m.id = $1 AND m.ativo = true
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const criarMatricula = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      aluno_id,
      atividade_id,
      data_inicio,
      data_fim,
      observacoes
    } = req.body;

    // Verificar se aluno existe e está ativo
    const alunoExistente = await db.query(
      'SELECT id FROM alunos WHERE id = $1 AND ativo = true',
      [aluno_id]
    );

    if (alunoExistente.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se atividade existe e está ativa
    const atividadeExistente = await db.query(
      'SELECT id, vagas_disponiveis FROM atividades WHERE id = $1 AND ativo = true',
      [atividade_id]
    );

    if (atividadeExistente.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    // Verificar se há vagas disponíveis
    if (atividadeExistente.rows[0].vagas_disponiveis <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Não há vagas disponíveis para esta atividade'
      });
    }

    // Verificar se aluno já está matriculado nesta atividade
    const matriculaExistente = await db.query(
      'SELECT id FROM matriculas WHERE aluno_id = $1 AND atividade_id = $2 AND ativo = true',
      [aluno_id, atividade_id]
    );

    if (matriculaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Aluno já está matriculado nesta atividade'
      });
    }

    // Iniciar transação
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Inserir matrícula
      const matriculaQuery = `
        INSERT INTO matriculas (
          aluno_id, atividade_id, status, data_matricula, data_inicio, data_fim, observacoes
        ) VALUES ($1, $2, 'ativa', CURRENT_DATE, $3, $4, $5)
        RETURNING *
      `;

      const matriculaResult = await client.query(matriculaQuery, [
        aluno_id, atividade_id, data_inicio, data_fim, observacoes
      ]);

      // Atualizar vagas disponíveis
      await client.query(
        'UPDATE atividades SET vagas_disponiveis = vagas_disponiveis - 1 WHERE id = $1',
        [atividade_id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Matrícula realizada com sucesso',
        data: matriculaResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const atualizarMatricula = async (req, res) => {
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
      status,
      data_inicio,
      data_fim,
      observacoes
    } = req.body;

    // Verificar se matrícula existe
    const matriculaExistente = await db.query(
      'SELECT id, status, atividade_id FROM matriculas WHERE id = $1 AND ativo = true',
      [id]
    );

    if (matriculaExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    const matricula = matriculaExistente.rows[0];
    const statusAnterior = matricula.status;

    // Se está mudando de ativa para inativa, liberar vaga
    if (statusAnterior === 'ativa' && status === 'inativa') {
      await db.query(
        'UPDATE atividades SET vagas_disponiveis = vagas_disponiveis + 1 WHERE id = $1',
        [matricula.atividade_id]
      );
    }
    // Se está mudando de inativa para ativa, ocupar vaga
    else if (statusAnterior === 'inativa' && status === 'ativa') {
      // Verificar se há vagas disponíveis
      const atividade = await db.query(
        'SELECT vagas_disponiveis FROM atividades WHERE id = $1',
        [matricula.atividade_id]
      );

      if (atividade.rows[0].vagas_disponiveis <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Não há vagas disponíveis para reativar esta matrícula'
        });
      }

      await db.query(
        'UPDATE atividades SET vagas_disponiveis = vagas_disponiveis - 1 WHERE id = $1',
        [matricula.atividade_id]
      );
    }

    const query = `
      UPDATE matriculas SET 
        status = $1, data_inicio = $2, data_fim = $3, observacoes = $4
      WHERE id = $5 AND ativo = true
      RETURNING *
    `;

    const result = await db.query(query, [
      status, data_inicio, data_fim, observacoes, id
    ]);

    res.json({
      success: true,
      message: 'Matrícula atualizada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const cancelarMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Verificar se matrícula existe
    const matriculaExistente = await db.query(
      'SELECT id, status, atividade_id FROM matriculas WHERE id = $1 AND ativo = true',
      [id]
    );

    if (matriculaExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    const matricula = matriculaExistente.rows[0];

    // Se estava ativa, liberar vaga
    if (matricula.status === 'ativa') {
      await db.query(
        'UPDATE atividades SET vagas_disponiveis = vagas_disponiveis + 1 WHERE id = $1',
        [matricula.atividade_id]
      );
    }

    // Cancelar matrícula
    await db.query(
      'UPDATE matriculas SET status = $1, observacoes = $2 WHERE id = $3',
      ['cancelada', motivo, id]
    );

    res.json({
      success: true,
      message: 'Matrícula cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarFrequenciasMatricula = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        f.*,
        a.nome as aluno_nome,
        at.nome as atividade_nome
      FROM frequencias f
      JOIN matriculas m ON f.aluno_id = m.aluno_id AND f.atividade_id = m.atividade_id
      JOIN alunos a ON f.aluno_id = a.id
      JOIN atividades at ON f.atividade_id = at.id
      WHERE m.id = $1
      ORDER BY f.data_aula DESC
    `;

    const result = await db.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar frequências da matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  listarMatriculas,
  buscarMatriculaPorId,
  criarMatricula,
  atualizarMatricula,
  cancelarMatricula,
  buscarFrequenciasMatricula
}; 