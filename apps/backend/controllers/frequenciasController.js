const { validationResult } = require('express-validator');
const db = require('../config/database');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');

const frequenciasController = {
  // Listar frequências com filtros
  async listarFrequencias(req, res) {
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
  },

  // Buscar frequência por ID
  async buscarFrequenciaPorId(req, res) {
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
  },

  // Registrar frequência
  async registrarFrequencia(req, res) {
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

      res.json({
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
  },

  // Registrar frequência em lote
  async registrarFrequenciaEmLote(req, res) {
    try {
      const { atividade_id, data_frequencia, frequencias } = req.body;
    const registrado_por = req.user.id;

      if (!atividade_id || !data_frequencia || !frequencias || !Array.isArray(frequencias)) {
      return res.status(400).json({
        success: false,
          message: 'Dados inválidos para registro em lote'
        });
      }

      const results = [];

      for (const freq of frequencias) {
        const { aluno_id, presente, justificativa, observacoes } = freq;
        
        try {
          // Verificar se a matrícula existe
          const matriculaCheck = await db.query(
            'SELECT id FROM matriculas WHERE aluno_id = $1 AND atividade_id = $2 AND status = $3',
          [aluno_id, atividade_id, 'ativa']
        );

          if (matriculaCheck.rows.length === 0) {
            results.push({
            aluno_id,
              success: false,
              message: 'Aluno não matriculado ou matrícula inativa'
          });
          continue;
        }

          // Verificar se já existe registro
          const existingCheck = await db.query(
            'SELECT id FROM frequencias WHERE aluno_id = $1 AND atividade_id = $2 AND data_frequencia = $3',
            [aluno_id, atividade_id, data_frequencia]
          );

          if (existingCheck.rows.length > 0) {
            // Atualizar
            const result = await db.query(
              `UPDATE frequencias 
               SET presente = $1, justificativa = $2, observacoes = $3, registrado_por = $4
               WHERE aluno_id = $5 AND atividade_id = $6 AND data_frequencia = $7
               RETURNING *`,
              [presente, justificativa, observacoes, registrado_por, aluno_id, atividade_id, data_frequencia]
            );
            
            results.push({
              aluno_id,
              success: true,
              message: 'Frequência atualizada',
              data: result.rows[0]
            });
        } else {
            // Inserir novo
            const result = await db.query(
              `INSERT INTO frequencias (aluno_id, atividade_id, data_frequencia, presente, justificativa, observacoes, registrado_por)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *`,
              [aluno_id, atividade_id, data_frequencia, presente, justificativa, observacoes, registrado_por]
            );
            
            results.push({
              aluno_id,
              success: true,
              message: 'Frequência registrada',
              data: result.rows[0]
            });
          }
        } catch (error) {
          results.push({
            aluno_id,
            success: false,
            message: error.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Processamento em lote concluído',
        results
      });
    } catch (error) {
      console.error('Erro no registro em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
  },

  // Atualizar frequência
  async atualizarFrequencia(req, res) {
    try {
    const { id } = req.params;
      const { presente, justificativa, observacoes } = req.body;

      const query = `
        UPDATE frequencias 
        SET presente = $1, justificativa = $2, observacoes = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await db.query(query, [presente, justificativa, observacoes, id]);

      if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Frequência não encontrada'
      });
    }

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
  },

  // Deletar frequência
  async deletarFrequencia(req, res) {
  try {
    const { id } = req.params;

      const result = await db.query('DELETE FROM frequencias WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Frequência não encontrada'
      });
    }

    res.json({
      success: true,
        message: 'Frequência deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
  },

  // Buscar frequências por atividade
  async buscarFrequenciasPorAtividade(req, res) {
    try {
      const { atividade_id } = req.params;
      const { data } = req.query;

      if (!data) {
        return res.status(400).json({
          success: false,
          message: 'Data é obrigatória'
        });
      }

    const query = `
      SELECT 
        f.*,
        a.nome as aluno_nome,
          a.cpf as aluno_cpf
      FROM frequencias f
      JOIN alunos a ON f.aluno_id = a.id
      WHERE f.atividade_id = $1 AND f.data_aula = $2
      ORDER BY a.nome
    `;

      const result = await db.query(query, [atividade_id, data]);

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
  },

  // Buscar relatório de frequência
  async buscarRelatorioFrequencia(req, res) {
    try {
      const { aluno_id, atividade_id, mes, ano } = req.query;

      if (!aluno_id || !atividade_id || !mes || !ano) {
        return res.status(400).json({
          success: false,
          message: 'Aluno ID, atividade ID, mês e ano são obrigatórios'
        });
      }

      const query = `
        SELECT 
          f.data_aula,
          f.presente,
          f.justificativa,
          EXTRACT(DOW FROM f.data_aula) as dia_semana
        FROM frequencias f
        WHERE f.aluno_id = $1 
          AND f.atividade_id = $2 
          AND EXTRACT(MONTH FROM f.data_aula) = $3
          AND EXTRACT(YEAR FROM f.data_aula) = $4
        ORDER BY f.data_aula
      `;

      const result = await db.query(query, [aluno_id, atividade_id, mes, ano]);
      
      // Calcular estatísticas
      const totalDias = result.rows.length;
      const diasPresente = result.rows.filter(f => f.presente).length;
      const percentualPresenca = totalDias > 0 ? (diasPresente / totalDias) * 100 : 0;

      res.json({
        success: true,
        data: {
          frequencias: result.rows,
          estatisticas: {
            totalDias,
            diasPresente,
            diasAusente: totalDias - diasPresente,
            percentualPresenca: Math.round(percentualPresenca * 100) / 100
          }
        }
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Listar alunos matriculados para registro de frequência
  async listarAlunosMatriculados(req, res) {
    try {
      const { atividade_id } = req.params;

      if (!atividade_id) {
        return res.status(400).json({
          success: false,
          message: 'ID da atividade é obrigatório'
        });
      }

      const query = `
        SELECT 
          a.id,
          a.nome,
          a.cpf,
          a.data_nascimento,
          m.id as matricula_id,
          m.data_matricula,
          m.status as status_matricula
        FROM alunos a
        INNER JOIN matriculas m ON a.id = m.aluno_id
        WHERE m.atividade_id = $1 
          AND m.status = 'ativa'
          AND a.ativo = true
        ORDER BY a.nome
      `;

      const result = await db.query(query, [atividade_id]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar alunos matriculados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Listar alunos matriculados em uma atividade
  async listarAlunosMatriculados(req, res) {
    try {
      const { atividade_id } = req.params;

      const query = `
        SELECT 
          a.id,
          a.nome,
          a.cpf,
          m.data_matricula
        FROM matriculas m
        JOIN alunos a ON m.aluno_id = a.id
        WHERE m.atividade_id = $1 
        AND m.status = 'ativa' 
        AND m.ativo = true
        AND a.ativo = true
        ORDER BY a.nome
      `;

      const result = await db.query(query, [atividade_id]);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao listar alunos matriculados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Exportar frequências para Excel/CSV
  async exportarFrequencias(req, res) {
    try {
      console.log('📊 Exportando lista de frequências...');
      
      const { formato = 'excel', data_inicio, data_fim, atividade_id, aluno_id, presente } = req.query;
      
      // Construir query com filtros
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

      // Buscar frequências
    const query = `
      SELECT 
          f.id,
        f.data_aula,
        f.presente,
        f.justificativa,
          f.observacoes,
          f.data_registro,
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
    `;

    const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma frequência encontrada para exportação'
        });
      }

      // Preparar dados para exportação
      const dados = result.rows.map(freq => ({
        'ID': freq.id,
        'Data da Aula': freq.data_aula ? new Date(freq.data_aula).toLocaleDateString('pt-BR') : '',
        'Aluno': freq.aluno_nome,
        'CPF do Aluno': freq.aluno_cpf || '',
        'Atividade': freq.atividade_nome,
        'Tipo da Atividade': freq.atividade_tipo,
        'Presente': freq.presente ? 'Sim' : 'Não',
        'Justificativa': freq.justificativa || '',
        'Observações': freq.observacoes || '',
        'Registrado por': freq.registrado_por_nome || '',
        'Data do Registro': new Date(freq.data_registro).toLocaleDateString('pt-BR')
      }));

      if (formato === 'csv') {
        // Exportar como CSV
        const csvData = [
          Object.keys(dados[0]).join(','),
          ...dados.map(row => Object.values(row).map(value => `"${value}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=frequencias_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvData);
      } else {
        // Exportar como Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dados);
        
        // Ajustar largura das colunas
        const colWidths = [
          { wch: 5 },   // ID
          { wch: 15 },  // Data da Aula
          { wch: 30 },  // Aluno
          { wch: 15 },  // CPF do Aluno
          { wch: 25 },  // Atividade
          { wch: 20 },  // Tipo da Atividade
          { wch: 8 },   // Presente
          { wch: 30 },  // Justificativa
          { wch: 30 },  // Observações
          { wch: 20 },  // Registrado por
          { wch: 15 }   // Data do Registro
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Frequências');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=frequencias_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);
      }

      console.log(`✅ ${dados.length} frequências exportadas com sucesso`);

    } catch (error) {
      console.error('❌ Erro ao exportar frequências:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar frequências'
      });
    }
  },

  // Importar frequências de planilha
  async importarFrequencias(req, res) {
    try {
      console.log('📥 Iniciando importação de frequências...');
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }

      const { substituir = false } = req.body;
      const filePath = req.file.path;
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      
      let dados = [];

      // Ler arquivo baseado na extensão
      if (fileExtension === 'csv') {
        // Ler CSV
        const results = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve())
            .on('error', reject);
        });
        dados = results;
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        // Ler Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        dados = XLSX.utils.sheet_to_json(worksheet);
      } else {
        // Limpar arquivo temporário
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: 'Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)'
        });
      }

      if (dados.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: 'Arquivo vazio ou sem dados válidos'
        });
      }

      console.log(`📋 ${dados.length} registros encontrados no arquivo`);

      // Mapear colunas do arquivo para campos do banco
      const mapearColuna = (row, colunas) => {
        for (const coluna of colunas) {
          if (row[coluna] !== undefined && row[coluna] !== null && row[coluna] !== '') {
            return row[coluna];
          }
        }
        return null;
      };

      const frequenciasProcessadas = [];
      const erros = [];
      let sucessos = 0;
      let atualizados = 0;

      // Processar cada linha
      for (let i = 0; i < dados.length; i++) {
        const row = dados[i];
        const linha = i + 2; // +2 porque começa do 0 e tem cabeçalho

        try {
          // Mapear campos
          const alunoNome = mapearColuna(row, ['Aluno', 'aluno', 'ALUNO', 'Nome do Aluno']);
          const atividadeNome = mapearColuna(row, ['Atividade', 'atividade', 'ATIVIDADE', 'Nome da Atividade']);
          const dataAula = mapearColuna(row, ['Data da Aula', 'Data Aula', 'data_aula', 'Data']);
          const presente = mapearColuna(row, ['Presente', 'presente', 'PRESENTE']);
          const justificativa = mapearColuna(row, ['Justificativa', 'justificativa', 'JUSTIFICATIVA']);
          const observacoes = mapearColuna(row, ['Observações', 'Observacoes', 'observacoes', 'OBSERVAÇÕES']);

          // Validações básicas
          if (!alunoNome) {
            erros.push(`Linha ${linha}: Nome do aluno é obrigatório`);
            continue;
          }

          if (!atividadeNome) {
            erros.push(`Linha ${linha}: Nome da atividade é obrigatório`);
            continue;
          }

          if (!dataAula) {
            erros.push(`Linha ${linha}: Data da aula é obrigatória`);
            continue;
          }

          // Processar data da aula
          let dataAulaProcessada = null;
          if (dataAula) {
            const data = new Date(dataAula);
            if (!isNaN(data.getTime())) {
              dataAulaProcessada = data.toISOString().split('T')[0];
            } else {
              erros.push(`Linha ${linha}: Data da aula inválida`);
              continue;
            }
          }

          // Processar presente
          let presenteProcessado = false;
          if (presente) {
            const presenteStr = presente.toString().toLowerCase();
            presenteProcessado = ['sim', 'true', '1', 's', 'yes'].includes(presenteStr);
          }

          // Buscar aluno por nome
          const aluno = await db.query(
            'SELECT id FROM alunos WHERE nome ILIKE $1 AND ativo = true',
            [alunoNome]
          );

          if (aluno.rows.length === 0) {
            erros.push(`Linha ${linha}: Aluno não encontrado (${alunoNome})`);
            continue;
          }

          // Buscar atividade por nome
          const atividade = await db.query(
            'SELECT id FROM atividades WHERE nome ILIKE $1 AND ativo = true',
            [atividadeNome]
          );

          if (atividade.rows.length === 0) {
            erros.push(`Linha ${linha}: Atividade não encontrada (${atividadeNome})`);
            continue;
          }

          const alunoId = aluno.rows[0].id;
          const atividadeId = atividade.rows[0].id;

          // Verificar se aluno está matriculado na atividade
          const matricula = await db.query(
            'SELECT id FROM matriculas WHERE aluno_id = $1 AND atividade_id = $2 AND status = $3 AND ativo = true',
            [alunoId, atividadeId, 'ativa']
          );

          if (matricula.rows.length === 0) {
            erros.push(`Linha ${linha}: Aluno não está matriculado na atividade (${alunoNome} - ${atividadeNome})`);
            continue;
          }

          // Verificar se frequência já existe
          const frequenciaExistente = await db.query(
            'SELECT id FROM frequencias WHERE aluno_id = $1 AND atividade_id = $2 AND data_aula = $3',
            [alunoId, atividadeId, dataAulaProcessada]
          );

          if (frequenciaExistente.rows.length > 0) {
            if (substituir === 'true') {
              // Atualizar frequência existente
              const updateQuery = `
                UPDATE frequencias SET 
                  presente = $1, justificativa = $2, observacoes = $3
                WHERE id = $4
              `;
              
              await db.query(updateQuery, [
                presenteProcessado, justificativa, observacoes, frequenciaExistente.rows[0].id
              ]);
              
              atualizados++;
              frequenciasProcessadas.push({ ...row, id: frequenciaExistente.rows[0].id, acao: 'atualizado' });
            } else {
              erros.push(`Linha ${linha}: Frequência já registrada para esta data (${alunoNome} - ${dataAulaProcessada})`);
              continue;
            }
          } else {
            // Inserir nova frequência
            const insertQuery = `
              INSERT INTO frequencias (
                aluno_id, atividade_id, data_aula, presente, justificativa, observacoes, registrado_por
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
            `;
            
            const result = await db.query(insertQuery, [
              alunoId, atividadeId, dataAulaProcessada, presenteProcessado, 
              justificativa, observacoes, req.user.id
            ]);
            
            sucessos++;
            frequenciasProcessadas.push({ ...row, id: result.rows[0].id, acao: 'criado' });
          }

        } catch (error) {
          console.error(`Erro ao processar linha ${linha}:`, error);
          erros.push(`Linha ${linha}: Erro interno - ${error.message}`);
        }
      }

      // Limpar arquivo temporário
      fs.unlinkSync(filePath);

      console.log(`✅ Importação concluída: ${sucessos} criadas, ${atualizados} atualizadas, ${erros.length} erros`);

    res.json({
      success: true,
        message: 'Importação concluída',
      data: {
          total: dados.length,
          criadas: sucessos,
          atualizadas: atualizados,
          erros: erros.length,
          detalhes: {
            sucessos: frequenciasProcessadas,
            erros: erros
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro na importação:', error);
      
      // Limpar arquivo temporário se existir
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Erro ao limpar arquivo temporário:', e);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro na importação de frequências'
      });
    }
  },

  // Download template de importação
  async downloadTemplate(req, res) {
    try {
      console.log('📋 Gerando template de importação de frequências...');
      
      const template = [
        {
          'Aluno': 'João Silva',
          'Atividade': 'Dança',
          'Data da Aula': '15/06/2025',
          'Presente': 'Sim',
          'Justificativa': '',
          'Observações': 'Aluno dedicado'
        },
        {
          'Aluno': 'Maria Santos',
          'Atividade': 'Natação',
          'Data da Aula': '15/06/2025',
          'Presente': 'Não',
          'Justificativa': 'Problema de saúde',
          'Observações': 'Justificada'
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(template);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 },  // Aluno
        { wch: 25 },  // Atividade
        { wch: 15 },  // Data da Aula
        { wch: 8 },   // Presente
        { wch: 30 },  // Justificativa
        { wch: 30 }   // Observações
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_importacao_frequencias.xlsx');
      res.send(buffer);

      console.log('✅ Template de frequências gerado com sucesso');

  } catch (error) {
      console.error('❌ Erro ao gerar template:', error);
    res.status(500).json({
      success: false,
        message: 'Erro ao gerar template'
      });
    }
  }
};

module.exports = frequenciasController; 