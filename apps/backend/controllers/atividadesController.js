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

    // Query principal com informações de horários
    const query = `
      SELECT 
        a.*,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        (SELECT COUNT(*) FROM matriculas m WHERE m.atividade_id = a.id AND m.status = 'ativa' AND m.ativo = true) as alunos_matriculados,
        (SELECT COUNT(*) FROM horarios_atividades h WHERE h.atividade_id = a.id AND h.ativo = true) as total_horarios,
        (SELECT COUNT(*) FROM horarios_atividades h WHERE h.atividade_id = a.id AND h.ativo = true AND h.vagas_disponiveis > 0) as horarios_disponiveis
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

    // Buscar atividade
    const atividadeQuery = `
      SELECT 
        a.*,
        u.nome as instrutor_nome,
        u.email as instrutor_email
      FROM atividades a 
      LEFT JOIN usuarios u ON a.instrutor_id = u.id 
      WHERE a.id = $1 AND a.ativo = true
    `;

    const atividadeResult = await db.query(atividadeQuery, [id]);

    if (atividadeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    // Buscar horários da atividade
    const horariosQuery = `
      SELECT 
        h.id,
        h.dia_semana,
        h.horario_inicio,
        h.horario_fim,
        h.vagas_disponiveis,
        h.ativo,
        CASE h.dia_semana
          WHEN 1 THEN 'Segunda-feira'
          WHEN 2 THEN 'Terça-feira'
          WHEN 3 THEN 'Quarta-feira'
          WHEN 4 THEN 'Quinta-feira'
          WHEN 5 THEN 'Sexta-feira'
          WHEN 6 THEN 'Sábado'
          WHEN 7 THEN 'Domingo'
        END as dia_nome
      FROM horarios_atividades h
      WHERE h.atividade_id = $1 AND h.ativo = true
      ORDER BY h.dia_semana, h.horario_inicio
    `;

    const horariosResult = await db.query(horariosQuery, [id]);

    const atividade = atividadeResult.rows[0];
    atividade.horarios = horariosResult.rows;

    res.json({
      success: true,
      data: atividade
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
      instrutor_id,
      vagas_totais,
      valor_mensalidade
    } = req.body;

    const query = `
      INSERT INTO atividades (
        nome, descricao, tipo, instrutor_id, vagas_totais, valor_mensalidade
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      nome, descricao, tipo, instrutor_id, vagas_totais || 30, valor_mensalidade
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
      instrutor_id,
      vagas_totais,
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

    // Construir query de atualização
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome !== undefined) {
      updates.push(`nome = $${paramCount++}`);
      values.push(nome);
    }

    if (descricao !== undefined) {
      updates.push(`descricao = $${paramCount++}`);
      values.push(descricao);
    }

    if (tipo !== undefined) {
      updates.push(`tipo = $${paramCount++}`);
      values.push(tipo);
    }

    if (instrutor_id !== undefined) {
      updates.push(`instrutor_id = $${paramCount++}`);
      values.push(instrutor_id);
    }

    if (vagas_totais !== undefined) {
      updates.push(`vagas_totais = $${paramCount++}`);
      values.push(vagas_totais);
    }

    if (valor_mensalidade !== undefined) {
      updates.push(`valor_mensalidade = $${paramCount++}`);
      values.push(valor_mensalidade);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo foi fornecido para atualização'
      });
    }

    values.push(id);
    const query = `
      UPDATE atividades 
      SET ${updates.join(', ')}, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

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

// Exportar atividades
const exportarAtividades = async (req, res) => {
  try {
    const { formato = 'excel', ...filtros } = req.query;
    
    // Construir query com filtros
    let whereConditions = ['a.ativo = $1'];
    let params = [true];
    let paramIndex = 2;

    if (filtros.busca) {
      whereConditions.push(`(a.nome ILIKE $${paramIndex} OR a.descricao ILIKE $${paramIndex})`);
      params.push(`%${filtros.busca}%`);
      paramIndex++;
    }

    if (filtros.tipo) {
      whereConditions.push(`a.tipo = $${paramIndex}`);
      params.push(filtros.tipo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        a.id,
        a.nome,
        a.descricao,
        a.tipo,
        a.dias_semana,
        a.horario_inicio,
        a.horario_fim,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        a.vagas_maximas,
        a.vagas_disponiveis,
        a.valor_mensalidade,
        a.ativo,
        a.data_criacao,
        (SELECT COUNT(*) FROM matriculas m WHERE m.atividade_id = a.id AND m.status = 'ativa' AND m.ativo = true) as alunos_matriculados
      FROM atividades a 
      LEFT JOIN usuarios u ON a.instrutor_id = u.id 
      WHERE ${whereClause}
      ORDER BY a.nome
    `;

    const result = await db.query(query, params);
    
    // Preparar dados para exportação
    const dados = result.rows.map(row => ({
      'ID': row.id,
      'Nome': row.nome,
      'Descrição': row.descricao || '',
      'Tipo': row.tipo,
      'Dias da Semana': row.dias_semana || '',
      'Horário Início': row.horario_inicio || '',
      'Horário Fim': row.horario_fim || '',
      'Instrutor': row.instrutor_nome || '',
      'Email Instrutor': row.instrutor_email || '',
      'Vagas Máximas': row.vagas_maximas,
      'Vagas Disponíveis': row.vagas_disponiveis,
      'Valor Mensalidade': row.valor_mensalidade,
      'Alunos Matriculados': row.alunos_matriculados,
      'Ativo': row.ativo ? 'Sim' : 'Não',
      'Data Criação': new Date(row.data_criacao).toLocaleDateString('pt-BR')
    }));

    if (formato === 'csv') {
      const csv = require('csv-stringify/sync');
      const csvData = csv.stringify(dados, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=atividades_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);
    } else {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Atividades');

      // Adicionar cabeçalhos
      const headers = Object.keys(dados[0] || {});
      worksheet.addRow(headers);

      // Adicionar dados
      dados.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Estilizar cabeçalhos
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Ajustar largura das colunas
      headers.forEach((header, index) => {
        worksheet.getColumn(index + 1).width = Math.max(header.length + 2, 15);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=atividades_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      await workbook.xlsx.write(res);
    }

  } catch (error) {
    console.error('Erro ao exportar atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar atividades'
    });
  }
};

// Download template para importação de atividades
const downloadTemplateAtividades = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Atividades');

    // Cabeçalhos do template
    const headers = [
      'Nome',
      'Descrição',
      'Tipo (dança/natação/bombeiro_mirim/informática/hidroginástica/funcional/fisioterapia/karatê)',
      'Dias da Semana (ex: Segunda,Quarta,Sexta)',
      'Horário Início (HH:MM)',
      'Horário Fim (HH:MM)',
      'Instrutor (Email)',
      'Vagas Máximas',
      'Valor Mensalidade'
    ];

    worksheet.addRow(headers);

    // Estilizar cabeçalhos
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Adicionar exemplo
    worksheet.addRow([
      'Dança Contemporânea',
      'Aulas de dança contemporânea para jovens',
      'dança',
      'Segunda,Quarta,Sexta',
      '14:00',
      '15:30',
      'instrutor@amigodopovo.com',
      '25',
      '60.00'
    ]);

    // Ajustar largura das colunas
    headers.forEach((header, index) => {
      worksheet.getColumn(index + 1).width = Math.max(header.length + 2, 25);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_atividades.xlsx');
    
    await workbook.xlsx.write(res);

  } catch (error) {
    console.error('Erro ao gerar template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar template'
    });
  }
};

// Importar atividades
const importarAtividades = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo não fornecido'
      });
    }

    const { substituir = false } = req.body;
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const atividades = [];
    const erros = [];

    // Processar linhas (pular cabeçalho)
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowData = row.values;

      if (!rowData[1]) continue; // Linha vazia

      try {
        const nome = rowData[1]?.toString().trim();
        const descricao = rowData[2]?.toString().trim();
        const tipo = rowData[3]?.toString().toLowerCase().trim();
        const diasSemana = rowData[4]?.toString().trim();
        const horarioInicio = rowData[5]?.toString().trim();
        const horarioFim = rowData[6]?.toString().trim();
        const instrutorEmail = rowData[7]?.toString().trim();
        const vagasMaximas = parseInt(rowData[8]) || 30;
        const valorMensalidade = parseFloat(rowData[9]) || 0;

        // Validações básicas
        if (!nome || !tipo) {
          erros.push(`Linha ${i}: Nome e tipo são obrigatórios`);
          continue;
        }

        // Validar tipo de atividade
        const tiposValidos = ['dança', 'natação', 'bombeiro_mirim', 'informática', 'hidroginástica', 'funcional', 'fisioterapia', 'karatê'];
        if (!tiposValidos.includes(tipo)) {
          erros.push(`Linha ${i}: Tipo inválido: ${tipo}`);
          continue;
        }

        // Buscar instrutor se fornecido
        let instrutorId = null;
        if (instrutorEmail) {
          const instrutorResult = await db.query(
            'SELECT id FROM usuarios WHERE email = $1 AND ativo = true',
            [instrutorEmail]
          );

          if (instrutorResult.rows.length === 0) {
            erros.push(`Linha ${i}: Instrutor não encontrado: ${instrutorEmail}`);
            continue;
          }
          instrutorId = instrutorResult.rows[0].id;
        }

        // Verificar se já existe atividade com mesmo nome
        const atividadeExistente = await db.query(
          'SELECT id FROM atividades WHERE nome ILIKE $1 AND ativo = true',
          [nome]
        );

        if (atividadeExistente.rows.length > 0 && !substituir) {
          erros.push(`Linha ${i}: Atividade já existe: ${nome}`);
          continue;
        }

        // Processar horários
        let horarioInicioProcessado = null;
        let horarioFimProcessado = null;

        if (horarioInicio) {
          const [hora, minuto] = horarioInicio.split(':');
          horarioInicioProcessado = `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00`;
        }

        if (horarioFim) {
          const [hora, minuto] = horarioFim.split(':');
          horarioFimProcessado = `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00`;
        }

        atividades.push({
          nome,
          descricao,
          tipo,
          dias_semana: diasSemana,
          horario_inicio: horarioInicioProcessado,
          horario_fim: horarioFimProcessado,
          instrutor_id: instrutorId,
          vagas_maximas: vagasMaximas,
          valor_mensalidade: valorMensalidade,
          substituir: atividadeExistente.rows.length > 0
        });

      } catch (error) {
        erros.push(`Linha ${i}: Erro ao processar linha - ${error.message}`);
      }
    }

    // Inserir/atualizar atividades
    let inseridas = 0;
    let atualizadas = 0;

    for (const atividade of atividades) {
      try {
        if (atividade.substituir) {
          // Atualizar atividade existente
          await db.query(`
            UPDATE atividades SET
              descricao = $1,
              tipo = $2,
              dias_semana = $3,
              horario_inicio = $4,
              horario_fim = $5,
              instrutor_id = $6,
              vagas_maximas = $7,
              valor_mensalidade = $8
            WHERE nome ILIKE $9 AND ativo = true
          `, [
            atividade.descricao,
            atividade.tipo,
            atividade.dias_semana,
            atividade.horario_inicio,
            atividade.horario_fim,
            atividade.instrutor_id,
            atividade.vagas_maximas,
            atividade.valor_mensalidade,
            atividade.nome
          ]);
          atualizadas++;
        } else {
          // Inserir nova atividade
          await db.query(`
            INSERT INTO atividades (
              nome, descricao, tipo, dias_semana, horario_inicio, horario_fim,
              instrutor_id, vagas_maximas, vagas_disponiveis, valor_mensalidade
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
          `, [
            atividade.nome,
            atividade.descricao,
            atividade.tipo,
            atividade.dias_semana,
            atividade.horario_inicio,
            atividade.horario_fim,
            atividade.instrutor_id,
            atividade.vagas_maximas,
            atividade.valor_mensalidade
          ]);
          inseridas++;
        }
      } catch (error) {
        erros.push(`Erro ao salvar atividade: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Importação concluída: ${inseridas} inseridas, ${atualizadas} atualizadas`,
      data: {
        inseridas,
        atualizadas,
        erros: erros.length > 0 ? erros : undefined
      }
    });

  } catch (error) {
    console.error('Erro ao importar atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao importar atividades'
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
  listarTiposAtividades,
  exportarAtividades,
  downloadTemplateAtividades,
  importarAtividades
}; 