const { validationResult } = require('express-validator');
const db = require('../config/database');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');

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
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query principal
    const query = `
      SELECT 
        a.*
      FROM alunos a 
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
        a.*
      FROM alunos a 
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
        a.nome as nome_atividade,
        a.tipo as tipo_atividade
      FROM matriculas m
      JOIN atividades a ON m.atividade_id = a.id
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

// Exportar alunos para Excel/CSV
const exportarAlunos = async (req, res) => {
  try {
    console.log('📊 Exportando lista de alunos...');
    
    const { formato = 'excel', ativo = true } = req.query;
    
    // Buscar todos os alunos
    const query = `
      SELECT 
        id,
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
        observacoes,
        ativo,
        data_criacao
      FROM alunos 
      WHERE ativo = $1
      ORDER BY nome
    `;

    const result = await db.query(query, [ativo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum aluno encontrado para exportação'
      });
    }

    // Preparar dados para exportação
    const dados = result.rows.map(aluno => ({
      'ID': aluno.id,
      'Nome': aluno.nome,
      'CPF': aluno.cpf || '',
      'RG': aluno.rg || '',
      'Data de Nascimento': aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '',
      'Sexo': aluno.sexo || '',
      'Telefone': aluno.telefone || '',
      'Celular': aluno.celular || '',
      'Email': aluno.email || '',
      'Endereço': aluno.endereco || '',
      'Bairro': aluno.bairro || '',
      'Cidade': aluno.cidade || '',
      'Estado': aluno.estado || '',
      'CEP': aluno.cep || '',
      'Observações': aluno.observacoes || '',
      'Ativo': aluno.ativo ? 'Sim' : 'Não',
      'Data de Cadastro': new Date(aluno.data_criacao).toLocaleDateString('pt-BR')
    }));

    if (formato === 'csv') {
      // Exportar como CSV
      const csvData = [
        Object.keys(dados[0]).join(','),
        ...dados.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=alunos_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);
    } else {
      // Exportar como Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dados);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 5 },   // ID
        { wch: 30 },  // Nome
        { wch: 15 },  // CPF
        { wch: 12 },  // RG
        { wch: 15 },  // Data Nascimento
        { wch: 8 },   // Sexo
        { wch: 15 },  // Telefone
        { wch: 15 },  // Celular
        { wch: 25 },  // Email
        { wch: 40 },  // Endereço
        { wch: 20 },  // Bairro
        { wch: 20 },  // Cidade
        { wch: 8 },   // Estado
        { wch: 10 },  // CEP
        { wch: 30 },  // Observações
        { wch: 8 },   // Ativo
        { wch: 15 }   // Data Cadastro
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=alunos_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    }

    console.log(`✅ ${dados.length} alunos exportados com sucesso`);

  } catch (error) {
    console.error('❌ Erro ao exportar alunos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar alunos'
    });
  }
};

// Importar alunos de planilha
const importarAlunos = async (req, res) => {
  try {
    console.log('📥 Iniciando importação de alunos...');
    
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

    const alunosProcessados = [];
    const erros = [];
    let sucessos = 0;
    let atualizados = 0;

    // Processar cada linha
    for (let i = 0; i < dados.length; i++) {
      const row = dados[i];
      const linha = i + 2; // +2 porque começa do 0 e tem cabeçalho

      try {
        // Mapear campos
        const nome = mapearColuna(row, ['Nome', 'nome', 'NOME']);
        const cpf = mapearColuna(row, ['CPF', 'cpf', 'CPF']);
        const rg = mapearColuna(row, ['RG', 'rg', 'RG']);
        const dataNascimento = mapearColuna(row, ['Data de Nascimento', 'Data Nascimento', 'data_nascimento', 'Data']);
        const sexo = mapearColuna(row, ['Sexo', 'sexo', 'SEXO']);
        const telefone = mapearColuna(row, ['Telefone', 'telefone', 'TELEFONE']);
        const celular = mapearColuna(row, ['Celular', 'celular', 'CELULAR']);
        const email = mapearColuna(row, ['Email', 'email', 'EMAIL']);
        const endereco = mapearColuna(row, ['Endereço', 'Endereco', 'endereco', 'ENDEREÇO']);
        const bairro = mapearColuna(row, ['Bairro', 'bairro', 'BAIRRO']);
        const cidade = mapearColuna(row, ['Cidade', 'cidade', 'CIDADE']);
        const estado = mapearColuna(row, ['Estado', 'estado', 'ESTADO']);
        const cep = mapearColuna(row, ['CEP', 'cep', 'CEP']);
        const observacoes = mapearColuna(row, ['Observações', 'Observacoes', 'observacoes', 'OBSERVAÇÕES']);

        // Validações básicas
        if (!nome) {
          erros.push(`Linha ${linha}: Nome é obrigatório`);
          continue;
        }

        // Processar data de nascimento
        let dataNascimentoProcessada = null;
        if (dataNascimento) {
          const data = new Date(dataNascimento);
          if (!isNaN(data.getTime())) {
            dataNascimentoProcessada = data.toISOString().split('T')[0];
          } else {
            erros.push(`Linha ${linha}: Data de nascimento inválida`);
            continue;
          }
        }

        // Processar CPF
        let cpfProcessado = null;
        if (cpf) {
          cpfProcessado = cpf.toString().replace(/\D/g, '');
          if (cpfProcessado.length !== 11) {
            erros.push(`Linha ${linha}: CPF inválido`);
            continue;
          }
        }

        // Verificar se aluno já existe (por CPF ou nome)
        let alunoExistente = null;
        if (cpfProcessado) {
          const existente = await db.query(
            'SELECT id, nome FROM alunos WHERE cpf = $1 AND ativo = true',
            [cpfProcessado]
          );
          if (existente.rows.length > 0) {
            alunoExistente = existente.rows[0];
          }
        }

        if (alunoExistente) {
          if (substituir === 'true') {
            // Atualizar aluno existente
            const updateQuery = `
              UPDATE alunos SET 
                nome = $1, rg = $2, data_nascimento = $3, sexo = $4, 
                telefone = $5, celular = $6, email = $7, endereco = $8, 
                bairro = $9, cidade = $10, estado = $11, cep = $12, 
                observacoes = $13
              WHERE id = $14
            `;
            
            await db.query(updateQuery, [
              nome, rg, dataNascimentoProcessada, sexo, telefone, celular, email,
              endereco, bairro, cidade, estado, cep, observacoes, alunoExistente.id
            ]);
            
            atualizados++;
            alunosProcessados.push({ ...row, id: alunoExistente.id, acao: 'atualizado' });
          } else {
            erros.push(`Linha ${linha}: CPF já cadastrado (${alunoExistente.nome})`);
            continue;
          }
        } else {
          // Inserir novo aluno
          const insertQuery = `
            INSERT INTO alunos (
              nome, cpf, rg, data_nascimento, sexo, telefone, celular, email,
              endereco, bairro, cidade, estado, cep, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
          `;
          
          const result = await db.query(insertQuery, [
            nome, cpfProcessado, rg, dataNascimentoProcessada, sexo, telefone, celular, email,
            endereco, bairro, cidade, estado, cep, observacoes
          ]);
          
          sucessos++;
          alunosProcessados.push({ ...row, id: result.rows[0].id, acao: 'criado' });
        }

      } catch (error) {
        console.error(`Erro ao processar linha ${linha}:`, error);
        erros.push(`Linha ${linha}: Erro interno - ${error.message}`);
      }
    }

    // Limpar arquivo temporário
    fs.unlinkSync(filePath);

    console.log(`✅ Importação concluída: ${sucessos} criados, ${atualizados} atualizados, ${erros.length} erros`);

    res.json({
      success: true,
      message: 'Importação concluída',
      data: {
        total: dados.length,
        criados: sucessos,
        atualizados: atualizados,
        erros: erros.length,
        detalhes: {
          sucessos: alunosProcessados,
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
      message: 'Erro na importação de alunos'
    });
  }
};

// Download template de importação
const downloadTemplate = async (req, res) => {
  try {
    console.log('📋 Gerando template de importação...');
    
    const template = [
      {
        'Nome': 'João Silva',
        'CPF': '12345678901',
        'RG': '1234567',
        'Data de Nascimento': '15/03/2000',
        'Sexo': 'M',
        'Telefone': '(11) 3333-3333',
        'Celular': '(11) 99999-9999',
        'Email': 'joao@email.com',
        'Endereço': 'Rua das Flores, 123',
        'Bairro': 'Centro',
        'Cidade': 'São Paulo',
        'Estado': 'SP',
        'CEP': '01234-567',
        'Observações': 'Aluno dedicado'
      },
      {
        'Nome': 'Maria Santos',
        'CPF': '98765432100',
        'RG': '7654321',
        'Data de Nascimento': '20/07/1995',
        'Sexo': 'F',
        'Telefone': '(11) 4444-4444',
        'Celular': '(11) 88888-8888',
        'Email': 'maria@email.com',
        'Endereço': 'Av. Principal, 456',
        'Bairro': 'Jardim',
        'Cidade': 'São Paulo',
        'Estado': 'SP',
        'CEP': '04567-890',
        'Observações': ''
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 },  // Nome
      { wch: 15 },  // CPF
      { wch: 12 },  // RG
      { wch: 15 },  // Data de Nascimento
      { wch: 8 },   // Sexo
      { wch: 15 },  // Telefone
      { wch: 15 },  // Celular
      { wch: 25 },  // Email
      { wch: 40 },  // Endereço
      { wch: 20 },  // Bairro
      { wch: 20 },  // Cidade
      { wch: 8 },   // Estado
      { wch: 10 },  // CEP
      { wch: 30 }   // Observações
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_importacao_alunos.xlsx');
    res.send(buffer);

    console.log('✅ Template gerado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao gerar template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar template'
    });
  }
};

module.exports = {
  listarAlunos,
  buscarAlunoPorId,
  criarAluno,
  atualizarAluno,
  deletarAluno,
  buscarMatriculasAluno,
  exportarAlunos,
  importarAlunos,
  downloadTemplate
}; 