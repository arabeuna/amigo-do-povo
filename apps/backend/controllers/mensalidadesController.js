const { validationResult } = require('express-validator');
const db = require('../config/database');

const mensalidadesController = {
  // Listar mensalidades com filtros
  async listarMensalidades(req, res) {
    try {
      const { 
        pagina = 1, 
        limite = 10, 
        aluno_id,
        atividade_id,
        status,
        mes,
        ano
      } = req.query;

      const offset = (pagina - 1) * limite;
      let whereConditions = ['m.id IS NOT NULL'];
      let params = [];
      let paramIndex = 1;

      if (aluno_id) {
        whereConditions.push(`m.aluno_id = $${paramIndex}`);
        params.push(aluno_id);
        paramIndex++;
      }

      if (atividade_id) {
        whereConditions.push(`m.atividade_id = $${paramIndex}`);
        params.push(atividade_id);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`m.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (mes) {
        whereConditions.push(`m.mes = $${paramIndex}`);
        params.push(mes);
        paramIndex++;
      }

      if (ano) {
        whereConditions.push(`m.ano = $${paramIndex}`);
        params.push(ano);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para contar total de registros
      const countQuery = `
        SELECT COUNT(*) 
        FROM mensalidades m
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
          at.nome as atividade_nome,
          at.tipo as atividade_tipo
        FROM mensalidades m
        JOIN alunos a ON m.aluno_id = a.id
        JOIN atividades at ON m.atividade_id = at.id
        WHERE ${whereClause}
        ORDER BY m.ano DESC, m.mes DESC, a.nome
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limite, offset);
      const result = await db.query(query, params);

      res.json({
        success: true,
        data: {
          mensalidades: result.rows,
          paginacao: {
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            total,
            totalPaginas: Math.ceil(total / limite)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar mensalidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Buscar mensalidade por ID
  async buscarMensalidadePorId(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          m.*,
          a.nome as aluno_nome,
          a.cpf as aluno_cpf,
          at.nome as atividade_nome,
          at.tipo as atividade_tipo
        FROM mensalidades m
        JOIN alunos a ON m.aluno_id = a.id
        JOIN atividades at ON m.atividade_id = at.id
        WHERE m.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mensalidade não encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao buscar mensalidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Gerar mensalidades automaticamente
  async gerarMensalidades(req, res) {
    try {
      const { mes, ano } = req.body;

      if (!mes || !ano) {
        return res.status(400).json({
          success: false,
          message: 'Mês e ano são obrigatórios'
        });
      }

      // Buscar todas as matrículas ativas
      const matriculasQuery = `
        SELECT 
          m.aluno_id,
          m.atividade_id,
          at.valor_mensalidade
        FROM matriculas m
        JOIN atividades at ON m.atividade_id = at.id
        WHERE m.status = 'ativa' AND m.ativo = true
      `;

      const matriculas = await db.query(matriculasQuery);
      const mensalidadesGeradas = [];

      for (const matricula of matriculas.rows) {
        // Verificar se já existe mensalidade para este mês/ano
        const mensalidadeExistente = await db.query(
          'SELECT id FROM mensalidades WHERE aluno_id = $1 AND atividade_id = $2 AND mes = $3 AND ano = $4',
          [matricula.aluno_id, matricula.atividade_id, mes, ano]
        );

        if (mensalidadeExistente.rows.length === 0) {
          // Calcular data de vencimento (último dia do mês)
          const dataVencimento = new Date(ano, mes, 0);
          
          // Inserir mensalidade
          const insertQuery = `
            INSERT INTO mensalidades (
              aluno_id, atividade_id, mes, ano, valor, status, data_vencimento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;

          const result = await db.query(insertQuery, [
            matricula.aluno_id,
            matricula.atividade_id,
            mes,
            ano,
            matricula.valor_mensalidade || 0,
            'pendente',
            dataVencimento.toISOString().split('T')[0]
          ]);

          mensalidadesGeradas.push(result.rows[0]);
        }
      }

      res.json({
        success: true,
        message: `${mensalidadesGeradas.length} mensalidades geradas com sucesso`,
        data: {
          mensalidadesGeradas,
          total: mensalidadesGeradas.length
        }
      });

    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Registrar pagamento
  async registrarPagamento(req, res) {
    try {
      const { id } = req.params;
      const { data_pagamento, forma_pagamento, observacoes } = req.body;

      if (!data_pagamento) {
        return res.status(400).json({
          success: false,
          message: 'Data de pagamento é obrigatória'
        });
      }

      // Verificar se a mensalidade existe
      const mensalidade = await db.query(
        'SELECT * FROM mensalidades WHERE id = $1',
        [id]
      );

      if (mensalidade.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mensalidade não encontrada'
        });
      }

      if (mensalidade.rows[0].status === 'pago') {
        return res.status(400).json({
          success: false,
          message: 'Mensalidade já foi paga'
        });
      }

      // Atualizar mensalidade
      const updateQuery = `
        UPDATE mensalidades 
        SET 
          status = 'pago',
          data_pagamento = $1,
          forma_pagamento = $2,
          observacoes = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [
        data_pagamento,
        forma_pagamento,
        observacoes,
        id
      ]);

      res.json({
        success: true,
        message: 'Pagamento registrado com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Atualizar status de mensalidades vencidas
  async atualizarStatusVencidas(req, res) {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const updateQuery = `
        UPDATE mensalidades 
        SET status = 'atrasado'
        WHERE status = 'pendente' 
          AND data_vencimento < $1
      `;

      const result = await db.query(updateQuery, [hoje]);

      res.json({
        success: true,
        message: `${result.rowCount} mensalidades marcadas como atrasadas`,
        data: {
          mensalidadesAtualizadas: result.rowCount
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar status de mensalidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Relatório financeiro
  async relatorioFinanceiro(req, res) {
    try {
      const { mes, ano } = req.query;

      if (!mes || !ano) {
        return res.status(400).json({
          success: false,
          message: 'Mês e ano são obrigatórios'
        });
      }

      // Estatísticas gerais
      const statsQuery = `
        SELECT 
          COUNT(*) as total_mensalidades,
          COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagas,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'atrasado' THEN 1 END) as atrasadas,
          SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as valor_recebido,
          SUM(valor) as valor_total
        FROM mensalidades 
        WHERE mes = $1 AND ano = $2
      `;

      const stats = await db.query(statsQuery, [mes, ano]);

      // Mensalidades por atividade
      const porAtividadeQuery = `
        SELECT 
          at.nome as atividade_nome,
          COUNT(*) as total,
          COUNT(CASE WHEN m.status = 'pago' THEN 1 END) as pagas,
          SUM(CASE WHEN m.status = 'pago' THEN m.valor ELSE 0 END) as valor_recebido,
          SUM(m.valor) as valor_total
        FROM mensalidades m
        JOIN atividades at ON m.atividade_id = at.id
        WHERE m.mes = $1 AND m.ano = $2
        GROUP BY at.id, at.nome
        ORDER BY at.nome
      `;

      const porAtividade = await db.query(porAtividadeQuery, [mes, ano]);

      // Mensalidades atrasadas
      const atrasadasQuery = `
        SELECT 
          m.*,
          a.nome as aluno_nome,
          a.cpf as aluno_cpf,
          at.nome as atividade_nome
        FROM mensalidades m
        JOIN alunos a ON m.aluno_id = a.id
        JOIN atividades at ON m.atividade_id = at.id
        WHERE m.mes = $1 AND m.ano = $2 AND m.status = 'atrasado'
        ORDER BY a.nome
      `;

      const atrasadas = await db.query(atrasadasQuery, [mes, ano]);

      res.json({
        success: true,
        data: {
          estatisticas: stats.rows[0],
          porAtividade: porAtividade.rows,
          atrasadas: atrasadas.rows
        }
      });

    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Exportar mensalidades
  async exportarMensalidades(req, res) {
    try {
      const { formato = 'excel', ...filtros } = req.query;
      
      // Construir query com filtros
      let whereConditions = ['m.id IS NOT NULL'];
      let params = [];
      let paramIndex = 1;

      if (filtros.aluno_id) {
        whereConditions.push(`m.aluno_id = $${paramIndex}`);
        params.push(filtros.aluno_id);
        paramIndex++;
      }

      if (filtros.atividade_id) {
        whereConditions.push(`m.atividade_id = $${paramIndex}`);
        params.push(filtros.atividade_id);
        paramIndex++;
      }

      if (filtros.status) {
        whereConditions.push(`m.status = $${paramIndex}`);
        params.push(filtros.status);
        paramIndex++;
      }

      if (filtros.mes) {
        whereConditions.push(`m.mes = $${paramIndex}`);
        params.push(filtros.mes);
        paramIndex++;
      }

      if (filtros.ano) {
        whereConditions.push(`m.ano = $${paramIndex}`);
        params.push(filtros.ano);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          m.id,
          a.nome as aluno_nome,
          a.cpf as aluno_cpf,
          at.nome as atividade_nome,
          m.mes,
          m.ano,
          m.valor,
          m.status,
          m.data_vencimento,
          m.data_pagamento,
          m.forma_pagamento,
          m.observacoes,
          m.data_criacao
        FROM mensalidades m
        JOIN alunos a ON m.aluno_id = a.id
        JOIN atividades at ON m.atividade_id = at.id
        WHERE ${whereClause}
        ORDER BY m.ano DESC, m.mes DESC, a.nome
      `;

      const result = await db.query(query, params);
      
      // Preparar dados para exportação
      const dados = result.rows.map(row => ({
        'ID': row.id,
        'Aluno': row.aluno_nome,
        'CPF': row.aluno_cpf || '',
        'Atividade': row.atividade_nome,
        'Mês': row.mes,
        'Ano': row.ano,
        'Valor': row.valor,
        'Status': row.status,
        'Data Vencimento': row.data_vencimento ? new Date(row.data_vencimento).toLocaleDateString('pt-BR') : '',
        'Data Pagamento': row.data_pagamento ? new Date(row.data_pagamento).toLocaleDateString('pt-BR') : '',
        'Forma Pagamento': row.forma_pagamento || '',
        'Observações': row.observacoes || '',
        'Data Criação': new Date(row.data_criacao).toLocaleDateString('pt-BR')
      }));

      if (formato === 'csv') {
        const csv = require('csv-stringify/sync');
        const csvData = csv.stringify(dados, { header: true });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mensalidades_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvData);
      } else {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Mensalidades');

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
        res.setHeader('Content-Disposition', `attachment; filename=mensalidades_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        await workbook.xlsx.write(res);
      }

    } catch (error) {
      console.error('Erro ao exportar mensalidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar mensalidades'
      });
    }
  },

  // Download template para importação
  async downloadTemplate(req, res) {
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template Mensalidades');

      // Cabeçalhos do template
      const headers = [
        'Aluno (Nome ou CPF)',
        'Atividade (Nome)',
        'Mês (1-12)',
        'Ano',
        'Valor',
        'Status (pendente/pago/atrasado/cancelado)',
        'Data Vencimento (DD/MM/AAAA)',
        'Forma Pagamento',
        'Observações'
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
        'João Silva',
        'Dança',
        '6',
        '2025',
        '50.00',
        'pendente',
        '30/06/2025',
        'PIX',
        'Pagamento antecipado'
      ]);

      // Ajustar largura das colunas
      headers.forEach((header, index) => {
        worksheet.getColumn(index + 1).width = Math.max(header.length + 2, 20);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_mensalidades.xlsx');
      
      await workbook.xlsx.write(res);

    } catch (error) {
      console.error('Erro ao gerar template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar template'
      });
    }
  },

  // Importar mensalidades
  async importarMensalidades(req, res) {
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

      const mensalidades = [];
      const erros = [];

      // Processar linhas (pular cabeçalho)
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const rowData = row.values;

        if (!rowData[1]) continue; // Linha vazia

        try {
          const aluno = rowData[1]?.toString().trim();
          const atividade = rowData[2]?.toString().trim();
          const mes = parseInt(rowData[3]);
          const ano = parseInt(rowData[4]);
          const valor = parseFloat(rowData[5]) || 0;
          const status = rowData[6]?.toString().toLowerCase().trim();
          const dataVencimento = rowData[7]?.toString().trim();
          const formaPagamento = rowData[8]?.toString().trim();
          const observacoes = rowData[9]?.toString().trim();

          // Validações básicas
          if (!aluno || !atividade || !mes || !ano) {
            erros.push(`Linha ${i}: Dados obrigatórios faltando`);
            continue;
          }

          if (mes < 1 || mes > 12) {
            erros.push(`Linha ${i}: Mês inválido (deve ser 1-12)`);
            continue;
          }

          if (ano < 2020 || ano > 2030) {
            erros.push(`Linha ${i}: Ano inválido`);
            continue;
          }

          // Buscar aluno
          const alunoResult = await db.query(
            'SELECT id FROM alunos WHERE (nome ILIKE $1 OR cpf = $2) AND ativo = true',
            [aluno, aluno]
          );

          if (alunoResult.rows.length === 0) {
            erros.push(`Linha ${i}: Aluno não encontrado: ${aluno}`);
            continue;
          }

          // Buscar atividade
          const atividadeResult = await db.query(
            'SELECT id FROM atividades WHERE nome ILIKE $1 AND ativo = true',
            [atividade]
          );

          if (atividadeResult.rows.length === 0) {
            erros.push(`Linha ${i}: Atividade não encontrada: ${atividade}`);
            continue;
          }

          const alunoId = alunoResult.rows[0].id;
          const atividadeId = atividadeResult.rows[0].id;

          // Verificar se já existe mensalidade
          const mensalidadeExistente = await db.query(
            'SELECT id FROM mensalidades WHERE aluno_id = $1 AND atividade_id = $2 AND mes = $3 AND ano = $4',
            [alunoId, atividadeId, mes, ano]
          );

          if (mensalidadeExistente.rows.length > 0 && !substituir) {
            erros.push(`Linha ${i}: Mensalidade já existe para ${aluno} - ${atividade} (${mes}/${ano})`);
            continue;
          }

          // Processar data de vencimento
          let dataVencimentoProcessada = null;
          if (dataVencimento) {
            const [dia, mesData, anoData] = dataVencimento.split('/');
            dataVencimentoProcessada = new Date(anoData, mesData - 1, dia);
          }

          mensalidades.push({
            aluno_id: alunoId,
            atividade_id: atividadeId,
            mes,
            ano,
            valor,
            status: status || 'pendente',
            data_vencimento: dataVencimentoProcessada,
            forma_pagamento: formaPagamento,
            observacoes,
            substituir: mensalidadeExistente.rows.length > 0
          });

        } catch (error) {
          erros.push(`Linha ${i}: Erro ao processar linha - ${error.message}`);
        }
      }

      // Inserir/atualizar mensalidades
      let inseridas = 0;
      let atualizadas = 0;

      for (const mensalidade of mensalidades) {
        try {
          if (mensalidade.substituir) {
            // Atualizar mensalidade existente
            await db.query(`
              UPDATE mensalidades SET
                valor = $1,
                status = $2,
                data_vencimento = $3,
                forma_pagamento = $4,
                observacoes = $5
              WHERE aluno_id = $6 AND atividade_id = $7 AND mes = $8 AND ano = $9
            `, [
              mensalidade.valor,
              mensalidade.status,
              mensalidade.data_vencimento,
              mensalidade.forma_pagamento,
              mensalidade.observacoes,
              mensalidade.aluno_id,
              mensalidade.atividade_id,
              mensalidade.mes,
              mensalidade.ano
            ]);
            atualizadas++;
          } else {
            // Inserir nova mensalidade
            await db.query(`
              INSERT INTO mensalidades (
                aluno_id, atividade_id, mes, ano, valor, status, 
                data_vencimento, forma_pagamento, observacoes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              mensalidade.aluno_id,
              mensalidade.atividade_id,
              mensalidade.mes,
              mensalidade.ano,
              mensalidade.valor,
              mensalidade.status,
              mensalidade.data_vencimento,
              mensalidade.forma_pagamento,
              mensalidade.observacoes
            ]);
            inseridas++;
          }
        } catch (error) {
          erros.push(`Erro ao salvar mensalidade: ${error.message}`);
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
      console.error('Erro ao importar mensalidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao importar mensalidades'
      });
    }
  }
};

module.exports = mensalidadesController; 