const { validationResult } = require('express-validator');
const db = require('../config/database');

const listarFrequencias = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      data_inicio,
      data_fim,
      atividade_id,
      aluno_id,
      presente
    } = req.query;

    const offset = (pagina - 1) * limite;
    let whereConditions = ['f.id IS NOT NULL'];
    let params = [];
    let paramIndex = 1;

    if (data_inicio) {
      whereConditions.push(`f.data_aula >= $${paramIndex}`);
      params.push(data_inicio);
      paramIndex++;
    }

    if (data_fim) {
      whereConditions.push(`f.data_aula <= $${paramIndex}`);
      params.push(data_fim);
      paramIndex++;
    }

    if (atividade_id) {
      whereConditions.push(`f.atividade_id = $${paramIndex}`);
      params.push(atividade_id);
      paramIndex++;
    }

    if (aluno_id) {
      whereConditions.push(`f.aluno_id = $${paramIndex}`);
      params.push(aluno_id);
      paramIndex++;
    }

    if (presente !== undefined && presente !== '') {
      whereConditions.push(`f.presente = $${paramIndex}`);
      params.push(presente === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) 
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      JOIN atividades at ON f.atividade_id = at.id
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query principal
    const query = `
      SELECT 
        f.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        at.nome as atividade_nome,
        at.tipo as atividade_tipo,
        u.nome as registrado_por_nome
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      JOIN atividades at ON f.atividade_id = at.id
      LEFT JOIN usuarios u ON f.registrado_por = u.id
      WHERE ${whereClause}
      ORDER BY f.data_aula DESC, a.nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limite, offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        frequencias: result.rows,
        paginacao: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total,
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar frequências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarFrequenciaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        f.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        at.nome as atividade_nome,
        at.tipo as atividade_tipo,
        u.nome as registrado_por_nome
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      JOIN atividades at ON f.atividade_id = at.id
      LEFT JOIN usuarios u ON f.registrado_por = u.id
      WHERE f.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Frequência não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const registrarFrequencia = async (req, res) => {
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
      data_aula,
      presente,
      justificativa
    } = req.body;

    const registrado_por = req.user.id;

    // Verificar se aluno está matriculado na atividade
    const matricula = await db.query(
      'SELECT id FROM matriculas WHERE aluno_id = $1 AND atividade_id = $2 AND status = $3 AND ativo = true',
      [aluno_id, atividade_id, 'ativa']
    );

    if (matricula.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aluno não está matriculado nesta atividade'
      });
    }

    // Verificar se já existe frequência para esta data
    const frequenciaExistente = await db.query(
      'SELECT id FROM frequencias WHERE aluno_id = $1 AND atividade_id = $2 AND data_aula = $3',
      [aluno_id, atividade_id, data_aula]
    );

    if (frequenciaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Frequência já registrada para esta data'
      });
    }

    const query = `
      INSERT INTO frequencias (
        aluno_id, atividade_id, data_aula, presente, justificativa, registrado_por
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      aluno_id, atividade_id, data_aula, presente, justificativa, registrado_por
    ]);

    res.status(201).json({
      success: true,
      message: 'Frequência registrada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao registrar frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const registrarFrequenciaEmLote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { atividade_id, data_aula, frequencias } = req.body;
    const registrado_por = req.user.id;

    // Verificar se atividade existe
    const atividade = await db.query(
      'SELECT id FROM atividades WHERE id = $1 AND ativo = true',
      [atividade_id]
    );

    if (atividade.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const resultados = [];

      for (const freq of frequencias) {
        const { aluno_id, presente, justificativa } = freq;

        // Verificar se aluno está matriculado
        const matricula = await client.query(
          'SELECT id FROM matriculas WHERE aluno_id = $1 AND atividade_id = $2 AND status = $3 AND ativo = true',
          [aluno_id, atividade_id, 'ativa']
        );

        if (matricula.rows.length === 0) {
          resultados.push({
            aluno_id,
            sucesso: false,
            mensagem: 'Aluno não está matriculado nesta atividade'
          });
          continue;
        }

        // Verificar se já existe frequência
        const frequenciaExistente = await client.query(
          'SELECT id FROM frequencias WHERE aluno_id = $1 AND atividade_id = $2 AND data_aula = $3',
          [aluno_id, atividade_id, data_aula]
        );

        if (frequenciaExistente.rows.length > 0) {
          // Atualizar frequência existente
          await client.query(
            'UPDATE frequencias SET presente = $1, justificativa = $2, registrado_por = $3 WHERE aluno_id = $4 AND atividade_id = $5 AND data_aula = $6',
            [presente, justificativa, registrado_por, aluno_id, atividade_id, data_aula]
          );
        } else {
          // Inserir nova frequência
          await client.query(
            'INSERT INTO frequencias (aluno_id, atividade_id, data_aula, presente, justificativa, registrado_por) VALUES ($1, $2, $3, $4, $5, $6)',
            [aluno_id, atividade_id, data_aula, presente, justificativa, registrado_por]
          );
        }

        resultados.push({
          aluno_id,
          sucesso: true,
          mensagem: 'Frequência registrada com sucesso'
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Frequências processadas com sucesso',
        data: resultados
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao registrar frequências em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const atualizarFrequencia = async (req, res) => {
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
      presente,
      justificativa
    } = req.body;

    const registrado_por = req.user.id;

    // Verificar se frequência existe
    const frequenciaExistente = await db.query(
      'SELECT id FROM frequencias WHERE id = $1',
      [id]
    );

    if (frequenciaExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Frequência não encontrada'
      });
    }

    const query = `
      UPDATE frequencias SET 
        presente = $1, justificativa = $2, registrado_por = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(query, [
      presente, justificativa, registrado_por, id
    ]);

    res.json({
      success: true,
      message: 'Frequência atualizada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deletarFrequencia = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se frequência existe
    const frequenciaExistente = await db.query(
      'SELECT id FROM frequencias WHERE id = $1',
      [id]
    );

    if (frequenciaExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Frequência não encontrada'
      });
    }

    await db.query('DELETE FROM frequencias WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Frequência removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarFrequenciasPorAtividade = async (req, res) => {
  try {
    const { atividade_id, data_aula } = req.params;

    const query = `
      SELECT 
        f.*,
        a.nome as aluno_nome,
        a.cpf as aluno_cpf,
        m.status as status_matricula
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      JOIN matriculas m ON f.aluno_id = m.aluno_id AND f.atividade_id = m.atividade_id
      WHERE f.atividade_id = $1 AND f.data_aula = $2
      ORDER BY a.nome
    `;

    const result = await db.query(query, [atividade_id, data_aula]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar frequências por atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarRelatorioFrequencia = async (req, res) => {
  try {
    const { 
      aluno_id, 
      atividade_id, 
      data_inicio, 
      data_fim 
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    if (aluno_id) {
      whereConditions.push(`f.aluno_id = $${paramIndex}`);
      params.push(aluno_id);
      paramIndex++;
    }

    if (atividade_id) {
      whereConditions.push(`f.atividade_id = $${paramIndex}`);
      params.push(atividade_id);
      paramIndex++;
    }

    if (data_inicio) {
      whereConditions.push(`f.data_aula >= $${paramIndex}`);
      params.push(data_inicio);
      paramIndex++;
    }

    if (data_fim) {
      whereConditions.push(`f.data_aula <= $${paramIndex}`);
      params.push(data_fim);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        f.data_aula,
        a.nome as aluno_nome,
        at.nome as atividade_nome,
        f.presente,
        f.justificativa,
        u.nome as registrado_por
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      JOIN atividades at ON f.atividade_id = at.id
      LEFT JOIN usuarios u ON f.registrado_por = u.id
      WHERE ${whereClause}
      ORDER BY f.data_aula DESC, a.nome
    `;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const total = result.rows.length;
    const presentes = result.rows.filter(f => f.presente).length;
    const ausentes = total - presentes;
    const percentualPresenca = total > 0 ? ((presentes / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        frequencias: result.rows,
        estatisticas: {
          total,
          presentes,
          ausentes,
          percentualPresenca: parseFloat(percentualPresenca)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar relatório de frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  listarFrequencias,
  buscarFrequenciaPorId,
  registrarFrequencia,
  registrarFrequenciaEmLote,
  atualizarFrequencia,
  deletarFrequencia,
  buscarFrequenciasPorAtividade,
  buscarRelatorioFrequencia
}; 