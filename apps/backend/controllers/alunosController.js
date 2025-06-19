const { validationResult } = require('express-validator');
const db = require('../config/database');

const listarAlunos = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      busca = '', 
      ativo = true,
      responsavel_id 
    } = req.query;

    const offset = (pagina - 1) * limite;
    let whereConditions = ['a.ativo = $1'];
    let params = [ativo];
    let paramIndex = 2;

    if (busca) {
      whereConditions.push(`(a.nome ILIKE $${paramIndex} OR a.cpf ILIKE $${paramIndex})`);
      params.push(`%${busca}%`);
      paramIndex++;
    }

    if (responsavel_id) {
      whereConditions.push(`a.responsavel_id = $${paramIndex}`);
      params.push(responsavel_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) 
      FROM alunos a 
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id 
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query principal
    const query = `
      SELECT 
        a.*,
        r.nome as responsavel_nome,
        r.cpf as responsavel_cpf,
        r.telefone as responsavel_telefone
      FROM alunos a 
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id 
      WHERE ${whereClause}
      ORDER BY a.nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limite, offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        alunos: result.rows,
        paginacao: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total,
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarAlunoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.*,
        r.nome as responsavel_nome,
        r.cpf as responsavel_cpf,
        r.rg as responsavel_rg,
        r.data_nascimento as responsavel_data_nascimento,
        r.telefone as responsavel_telefone,
        r.celular as responsavel_celular,
        r.email as responsavel_email,
        r.endereco as responsavel_endereco,
        r.bairro as responsavel_bairro,
        r.cidade as responsavel_cidade,
        r.estado as responsavel_estado,
        r.cep as responsavel_cep
      FROM alunos a 
      LEFT JOIN responsaveis r ON a.responsavel_id = r.id 
      WHERE a.id = $1 AND a.ativo = true
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const criarAluno = async (req, res) => {
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
      cpf,
      rg,
      data_nascimento,
      sexo,
      telefone,
      celular,
      email,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      responsavel_id,
      observacoes
    } = req.body;

    // Verificar se CPF já existe
    if (cpf) {
      const cpfExistente = await db.query(
        'SELECT id FROM alunos WHERE cpf = $1 AND ativo = true',
        [cpf]
      );

      if (cpfExistente.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado'
        });
      }
    }

    const query = `
      INSERT INTO alunos (
        nome, cpf, rg, data_nascimento, sexo, telefone, celular, email,
        endereco, bairro, cidade, estado, cep, responsavel_id, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await db.query(query, [
      nome, cpf, rg, data_nascimento, sexo, telefone, celular, email,
      endereco, bairro, cidade, estado, cep, responsavel_id, observacoes
    ]);

    res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const atualizarAluno = async (req, res) => {
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
      cpf,
      rg,
      data_nascimento,
      sexo,
      telefone,
      celular,
      email,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      responsavel_id,
      observacoes
    } = req.body;

    // Verificar se aluno existe
    const alunoExistente = await db.query(
      'SELECT id FROM alunos WHERE id = $1 AND ativo = true',
      [id]
    );

    if (alunoExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se CPF já existe (exceto para o próprio aluno)
    if (cpf) {
      const cpfExistente = await db.query(
        'SELECT id FROM alunos WHERE cpf = $1 AND id != $2 AND ativo = true',
        [cpf, id]
      );

      if (cpfExistente.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro aluno'
        });
      }
    }

    const query = `
      UPDATE alunos SET 
        nome = $1, cpf = $2, rg = $3, data_nascimento = $4, sexo = $5,
        telefone = $6, celular = $7, email = $8, endereco = $9, bairro = $10,
        cidade = $11, estado = $12, cep = $13, responsavel_id = $14, observacoes = $15
      WHERE id = $16 AND ativo = true
      RETURNING *
    `;

    const result = await db.query(query, [
      nome, cpf, rg, data_nascimento, sexo, telefone, celular, email,
      endereco, bairro, cidade, estado, cep, responsavel_id, observacoes, id
    ]);

    res.json({
      success: true,
      message: 'Aluno atualizado com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deletarAluno = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se aluno existe
    const alunoExistente = await db.query(
      'SELECT id FROM alunos WHERE id = $1 AND ativo = true',
      [id]
    );

    if (alunoExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    // Soft delete - apenas marcar como inativo
    await db.query(
      'UPDATE alunos SET ativo = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Aluno removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const buscarMatriculasAluno = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        a.nome as atividade_nome,
        a.tipo as atividade_tipo,
        a.valor_mensalidade,
        u.nome as instrutor_nome
      FROM matriculas m
      JOIN atividades a ON m.atividade_id = a.id
      LEFT JOIN usuarios u ON a.instrutor_id = u.id
      WHERE m.aluno_id = $1 AND m.ativo = true
      ORDER BY m.data_matricula DESC
    `;

    const result = await db.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar matrículas do aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  listarAlunos,
  buscarAlunoPorId,
  criarAluno,
  atualizarAluno,
  deletarAluno,
  buscarMatriculasAluno
}; 