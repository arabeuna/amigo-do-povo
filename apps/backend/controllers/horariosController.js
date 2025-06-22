const db = require('../config/database');
const ExcelJS = require('exceljs');
const { stringify } = require('csv-stringify');

const horariosController = {
  // Listar horários de uma atividade
  listarHorarios: async (req, res) => {
    try {
      const { atividade_id } = req.params;
      const { dia_semana } = req.query;

      let query = `
        SELECT 
          h.id,
          h.atividade_id,
          h.dia_semana,
          h.horario_inicio,
          h.horario_fim,
          h.vagas_disponiveis,
          h.ativo,
          a.nome as atividade_nome,
          a.tipo as atividade_tipo
        FROM horarios_atividades h
        JOIN atividades a ON h.atividade_id = a.id
        WHERE h.ativo = true
      `;

      const params = [];

      if (atividade_id) {
        query += ` AND h.atividade_id = $${params.length + 1}`;
        params.push(atividade_id);
      }

      if (dia_semana) {
        query += ` AND h.dia_semana = $${params.length + 1}`;
        params.push(dia_semana);
      }

      query += ` ORDER BY h.dia_semana, h.horario_inicio`;

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: {
          horarios: result.rows,
          total: result.rows.length
        }
      });

    } catch (error) {
      console.error('Erro ao listar horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Buscar horário por ID
  buscarHorarioPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(`
        SELECT 
          h.*,
          a.nome as atividade_nome,
          a.tipo as atividade_tipo
        FROM horarios_atividades h
        JOIN atividades a ON h.atividade_id = a.id
        WHERE h.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horário não encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          horario: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Erro ao buscar horário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Criar novo horário
  criarHorario: async (req, res) => {
    try {
      const { atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis } = req.body;

      // Validações
      if (!atividade_id || !dia_semana || !horario_inicio || !horario_fim) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      if (dia_semana < 1 || dia_semana > 7) {
        return res.status(400).json({
          success: false,
          message: 'Dia da semana deve ser entre 1 (Segunda) e 7 (Domingo)'
        });
      }

      // Verificar se a atividade existe
      const atividadeCheck = await db.query('SELECT id FROM atividades WHERE id = $1', [atividade_id]);
      if (atividadeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      // Verificar se já existe horário para esta atividade, dia e horário
      const horarioExistente = await db.query(`
        SELECT id FROM horarios_atividades 
        WHERE atividade_id = $1 AND dia_semana = $2 AND horario_inicio = $3
      `, [atividade_id, dia_semana, horario_inicio]);

      if (horarioExistente.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um horário para esta atividade neste dia e horário'
        });
      }

      // Inserir horário
      const result = await db.query(`
        INSERT INTO horarios_atividades (atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis || 30]);

      res.status(201).json({
        success: true,
        message: 'Horário criado com sucesso',
        data: {
          horario: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Erro ao criar horário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Atualizar horário
  atualizarHorario: async (req, res) => {
    try {
      const { id } = req.params;
      const { dia_semana, horario_inicio, horario_fim, vagas_disponiveis, ativo } = req.body;

      // Verificar se o horário existe
      const horarioCheck = await db.query('SELECT id FROM horarios_atividades WHERE id = $1', [id]);
      if (horarioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horário não encontrado'
        });
      }

      // Construir query de atualização
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (dia_semana !== undefined) {
        if (dia_semana < 1 || dia_semana > 7) {
          return res.status(400).json({
            success: false,
            message: 'Dia da semana deve ser entre 1 (Segunda) e 7 (Domingo)'
          });
        }
        updates.push(`dia_semana = $${paramCount++}`);
        values.push(dia_semana);
      }

      if (horario_inicio !== undefined) {
        updates.push(`horario_inicio = $${paramCount++}`);
        values.push(horario_inicio);
      }

      if (horario_fim !== undefined) {
        updates.push(`horario_fim = $${paramCount++}`);
        values.push(horario_fim);
      }

      if (vagas_disponiveis !== undefined) {
        updates.push(`vagas_disponiveis = $${paramCount++}`);
        values.push(vagas_disponiveis);
      }

      if (ativo !== undefined) {
        updates.push(`ativo = $${paramCount++}`);
        values.push(ativo);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo foi fornecido para atualização'
        });
      }

      values.push(id);
      const query = `
        UPDATE horarios_atividades 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);

      res.json({
        success: true,
        message: 'Horário atualizado com sucesso',
        data: {
          horario: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Deletar horário
  deletarHorario: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se o horário existe
      const horarioCheck = await db.query('SELECT id FROM horarios_atividades WHERE id = $1', [id]);
      if (horarioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horário não encontrado'
        });
      }

      // Verificar se há matrículas ativas neste horário
      const matriculasCheck = await db.query(`
        SELECT COUNT(*) as total FROM matriculas 
        WHERE horario_id = $1 AND status = 'ativa'
      `, [id]);

      if (parseInt(matriculasCheck.rows[0].total) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar um horário que possui matrículas ativas'
        });
      }

      // Deletar horário
      await db.query('DELETE FROM horarios_atividades WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Horário deletado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar horário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Listar horários disponíveis para matrícula
  listarHorariosDisponiveis: async (req, res) => {
    try {
      const { atividade_id, dia_semana } = req.query;

      let query = `
        SELECT 
          h.id,
          h.atividade_id,
          h.dia_semana,
          h.horario_inicio,
          h.horario_fim,
          h.vagas_disponiveis,
          a.nome as atividade_nome,
          a.tipo as atividade_tipo,
          a.valor_mensalidade
        FROM horarios_atividades h
        JOIN atividades a ON h.atividade_id = a.id
        WHERE h.ativo = true AND h.vagas_disponiveis > 0
      `;

      const params = [];

      if (atividade_id) {
        query += ` AND h.atividade_id = $${params.length + 1}`;
        params.push(atividade_id);
      }

      if (dia_semana) {
        query += ` AND h.dia_semana = $${params.length + 1}`;
        params.push(dia_semana);
      }

      query += ` ORDER BY h.dia_semana, h.horario_inicio`;

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: {
          horarios: result.rows,
          total: result.rows.length
        }
      });

    } catch (error) {
      console.error('Erro ao listar horários disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Obter dias da semana
  getDiasSemana: async (req, res) => {
    try {
      const diasSemana = [
        { id: 1, nome: 'Segunda-feira', abreviacao: 'Seg' },
        { id: 2, nome: 'Terça-feira', abreviacao: 'Ter' },
        { id: 3, nome: 'Quarta-feira', abreviacao: 'Qua' },
        { id: 4, nome: 'Quinta-feira', abreviacao: 'Qui' },
        { id: 5, nome: 'Sexta-feira', abreviacao: 'Sex' },
        { id: 6, nome: 'Sábado', abreviacao: 'Sáb' },
        { id: 7, nome: 'Domingo', abreviacao: 'Dom' }
      ];

      res.json({
        success: true,
        data: {
          dias: diasSemana
        }
      });

    } catch (error) {
      console.error('Erro ao obter dias da semana:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Exportar horários para Excel
  exportarHorarios: async (req, res) => {
    try {
      const { formato = 'excel' } = req.query;
      
      // Buscar todos os horários com informações da atividade
      const result = await db.query(`
        SELECT 
          h.id,
          a.nome as atividade_nome,
          a.tipo as atividade_tipo,
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
          END as dia_semana_nome
        FROM horarios_atividades h
        JOIN atividades a ON h.atividade_id = a.id
        ORDER BY a.nome, h.dia_semana, h.horario_inicio
      `);

      if (formato === 'csv') {
        // Exportar como CSV
        const headers = [
          'ID', 'Atividade', 'Tipo', 'Dia da Semana', 'Dia (Número)', 
          'Horário Início', 'Horário Fim', 'Vagas Disponíveis', 'Ativo'
        ];

        const csvData = result.rows.map(row => [
          row.id,
          row.atividade_nome,
          row.atividade_tipo,
          row.dia_semana_nome,
          row.dia_semana,
          row.horario_inicio,
          row.horario_fim,
          row.vagas_disponiveis,
          row.ativo ? 'Sim' : 'Não'
        ]);

        stringify([headers, ...csvData], (err, output) => {
          if (err) {
            console.error('Erro ao gerar CSV:', err);
            return res.status(500).json({
              success: false,
              message: 'Erro ao gerar arquivo CSV'
            });
          }

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=horarios.csv');
          res.send(output);
        });
      } else {
        // Exportar como Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horários');

        // Definir colunas
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Atividade', key: 'atividade_nome', width: 30 },
          { header: 'Tipo', key: 'atividade_tipo', width: 20 },
          { header: 'Dia da Semana', key: 'dia_semana_nome', width: 15 },
          { header: 'Dia (Número)', key: 'dia_semana', width: 15 },
          { header: 'Horário Início', key: 'horario_inicio', width: 15 },
          { header: 'Horário Fim', key: 'horario_fim', width: 15 },
          { header: 'Vagas Disponíveis', key: 'vagas_disponiveis', width: 20 },
          { header: 'Ativo', key: 'ativo', width: 10 }
        ];

        // Adicionar dados
        result.rows.forEach(row => {
          worksheet.addRow({
            ...row,
            ativo: row.ativo ? 'Sim' : 'Não'
          });
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Configurar resposta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=horarios.xlsx');

        await workbook.xlsx.write(res);
        res.end();
      }

    } catch (error) {
      console.error('Erro ao exportar horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar horários'
      });
    }
  },

  // Download template para importação
  downloadTemplate: async (req, res) => {
    try {
      const { formato = 'excel' } = req.query;

      if (formato === 'csv') {
        // Template CSV
        const headers = [
          'atividade_id', 'atividade_nome', 'dia_semana', 'horario_inicio', 
          'horario_fim', 'vagas_disponiveis', 'ativo'
        ];

        const exampleData = [
          '1', 'Dança', '1', '08:00', '09:00', '30', 'true',
          '1', 'Dança', '3', '14:00', '15:00', '25', 'true',
          '2', 'Natação', '2', '10:00', '11:00', '20', 'true'
        ];

        stringify([headers, exampleData], (err, output) => {
          if (err) {
            console.error('Erro ao gerar template CSV:', err);
            return res.status(500).json({
              success: false,
              message: 'Erro ao gerar template CSV'
            });
          }

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=template_horarios.csv');
          res.send(output);
        });
      } else {
        // Template Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Horários');

        // Definir colunas
        worksheet.columns = [
          { header: 'atividade_id', key: 'atividade_id', width: 15 },
          { header: 'atividade_nome', key: 'atividade_nome', width: 30 },
          { header: 'dia_semana', key: 'dia_semana', width: 15 },
          { header: 'horario_inicio', key: 'horario_inicio', width: 15 },
          { header: 'horario_fim', key: 'horario_fim', width: 15 },
          { header: 'vagas_disponiveis', key: 'vagas_disponiveis', width: 20 },
          { header: 'ativo', key: 'ativo', width: 10 }
        ];

        // Adicionar dados de exemplo
        const exampleData = [
          { atividade_id: 1, atividade_nome: 'Dança', dia_semana: 1, horario_inicio: '08:00', horario_fim: '09:00', vagas_disponiveis: 30, ativo: 'true' },
          { atividade_id: 1, atividade_nome: 'Dança', dia_semana: 3, horario_inicio: '14:00', horario_fim: '15:00', vagas_disponiveis: 25, ativo: 'true' },
          { atividade_id: 2, atividade_nome: 'Natação', dia_semana: 2, horario_inicio: '10:00', horario_fim: '11:00', vagas_disponiveis: 20, ativo: 'true' }
        ];

        exampleData.forEach(row => {
          worksheet.addRow(row);
        });

        // Adicionar instruções
        worksheet.insertRow(1, ['INSTRUÇÕES:']);
        worksheet.insertRow(2, ['1. atividade_id: ID da atividade (obrigatório)']);
        worksheet.insertRow(3, ['2. atividade_nome: Nome da atividade (para referência)']);
        worksheet.insertRow(4, ['3. dia_semana: 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado, 7=Domingo']);
        worksheet.insertRow(5, ['4. horario_inicio: Formato HH:MM (ex: 08:00)']);
        worksheet.insertRow(6, ['5. horario_fim: Formato HH:MM (ex: 09:00)']);
        worksheet.insertRow(7, ['6. vagas_disponiveis: Número de vagas (padrão: 30)']);
        worksheet.insertRow(8, ['7. ativo: true/false (padrão: true)']);
        worksheet.insertRow(9, ['']);

        // Estilizar
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FF0000FF' } };
        worksheet.getRow(10).font = { bold: true };
        worksheet.getRow(10).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Configurar resposta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_horarios.xlsx');

        await workbook.xlsx.write(res);
        res.end();
      }

    } catch (error) {
      console.error('Erro ao gerar template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar template'
      });
    }
  },

  // Importar horários
  importarHorarios: async (req, res) => {
    try {
      const { substituir = 'false' } = req.query;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      const horarios = [];
      let linha = 1;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Pular cabeçalho

        const atividade_id = row.getCell(1).value;
        const atividade_nome = row.getCell(2).value;
        const dia_semana = row.getCell(3).value;
        const horario_inicio = row.getCell(4).value;
        const horario_fim = row.getCell(5).value;
        const vagas_disponiveis = row.getCell(6).value;
        const ativo = row.getCell(7).value;

        // Validações básicas
        if (!atividade_id || !dia_semana || !horario_inicio || !horario_fim) {
          throw new Error(`Linha ${linha}: Campos obrigatórios não preenchidos`);
        }

        if (dia_semana < 1 || dia_semana > 7) {
          throw new Error(`Linha ${linha}: Dia da semana deve ser entre 1 e 7`);
        }

        horarios.push({
          atividade_id: parseInt(atividade_id),
          atividade_nome,
          dia_semana: parseInt(dia_semana),
          horario_inicio: horario_inicio.toString(),
          horario_fim: horario_fim.toString(),
          vagas_disponiveis: vagas_disponiveis ? parseInt(vagas_disponiveis) : 30,
          ativo: ativo === 'true' || ativo === true
        });

        linha++;
      });

      // Iniciar transação
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        if (substituir === 'true') {
          // Deletar horários existentes
          await client.query('DELETE FROM horarios_atividades');
        }

        // Inserir novos horários
        let inseridos = 0;
        let atualizados = 0;

        for (const horario of horarios) {
          // Verificar se a atividade existe
          const atividadeCheck = await client.query(
            'SELECT id FROM atividades WHERE id = $1',
            [horario.atividade_id]
          );

          if (atividadeCheck.rows.length === 0) {
            throw new Error(`Atividade ID ${horario.atividade_id} não encontrada`);
          }

          // Verificar se já existe horário para esta atividade, dia e horário
          const horarioExistente = await client.query(`
            SELECT id FROM horarios_atividades 
            WHERE atividade_id = $1 AND dia_semana = $2 AND horario_inicio = $3
          `, [horario.atividade_id, horario.dia_semana, horario.horario_inicio]);

          if (horarioExistente.rows.length > 0) {
            // Atualizar horário existente
            await client.query(`
              UPDATE horarios_atividades 
              SET horario_fim = $1, vagas_disponiveis = $2, ativo = $3
              WHERE id = $4
            `, [horario.horario_fim, horario.vagas_disponiveis, horario.ativo, horarioExistente.rows[0].id]);
            atualizados++;
          } else {
            // Inserir novo horário
            await client.query(`
              INSERT INTO horarios_atividades (atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis, ativo)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [horario.atividade_id, horario.dia_semana, horario.horario_inicio, horario.horario_fim, horario.vagas_disponiveis, horario.ativo]);
            inseridos++;
          }
        }

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Importação concluída com sucesso',
          data: {
            total: horarios.length,
            inseridos,
            atualizados
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Erro ao importar horários:', error);
      res.status(500).json({
        success: false,
        message: `Erro ao importar horários: ${error.message}`
      });
    }
  }
};

module.exports = horariosController; 