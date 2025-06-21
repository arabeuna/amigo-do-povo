const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do banco de dados
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'amigo_do_povo',
  user: process.env.DB_USER || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(poolConfig);

// Carregar configurações
const getConfiguracoes = async (req, res) => {
  try {
    console.log('📋 Carregando configurações do sistema...');
    
    // Configurações padrão do sistema
    const configuracoes = {
      nome_instituicao: 'Associação Amigo do Povo',
      endereco: '',
      telefone: '',
      email: '',
      cnpj: '',
      logo_url: '',
      tema: 'light',
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    };

    // Configurações de segurança padrão
    const seguranca = {
      sessao_timeout: 30,
      max_tentativas_login: 5,
      bloqueio_temporario: 15,
      requisitos_senha: {
        minimo_caracteres: 8,
        maiusculas: true,
        minusculas: true,
        numeros: true,
        caracteres_especiais: true
      }
    };

    // Configurações de backup padrão
    const backup = {
      backup_automatico: true,
      frequencia_backup: 'diario',
      retencao_backups: 30,
      backup_banco: true,
      backup_arquivos: true
    };

    // TODO: Carregar configurações do banco de dados quando implementar tabela de configurações
    
    res.json({
      success: true,
      configuracoes,
      seguranca,
      backup
    });

  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar perfil do usuário
const atualizarPerfil = async (req, res) => {
  try {
    console.log('👤 Atualizando perfil do usuário...');
    const { nome, email, senha_atual, nova_senha } = req.body;
    const userId = req.user.id;

    // Validar dados obrigatórios
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email são obrigatórios'
      });
    }

    // Verificar se o email já existe para outro usuário
    const emailCheck = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso por outro usuário'
      });
    }

    // Se uma nova senha foi fornecida, validar senha atual
    if (nova_senha) {
      if (!senha_atual) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual é obrigatória para alterar a senha'
        });
      }

      // Verificar senha atual
      const userCheck = await pool.query(
        'SELECT senha FROM usuarios WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const senhaValida = await bcrypt.compare(senha_atual, userCheck.rows[0].senha);
      
      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Validar nova senha
      if (nova_senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter pelo menos 6 caracteres'
        });
      }

      // Criptografar nova senha
      const saltRounds = 12;
      const senhaCriptografada = await bcrypt.hash(nova_senha, saltRounds);

      // Atualizar usuário com nova senha
      const result = await pool.query(
        'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4 RETURNING id, nome, email, perfil',
        [nome, email, senhaCriptografada, userId]
      );

      console.log('✅ Perfil atualizado com nova senha');
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        usuario: result.rows[0]
      });

    } else {
      // Atualizar apenas nome e email
      const result = await pool.query(
        'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, perfil',
        [nome, email, userId]
      );

      console.log('✅ Perfil atualizado');
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        usuario: result.rows[0]
      });
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Salvar configurações do sistema
const salvarConfiguracoesSistema = async (req, res) => {
  try {
    console.log('⚙️ Salvando configurações do sistema...');
    const configuracoes = req.body;

    // Validar dados obrigatórios
    if (!configuracoes.nome_instituicao) {
      return res.status(400).json({
        success: false,
        message: 'Nome da instituição é obrigatório'
      });
    }

    // TODO: Implementar salvamento em tabela de configurações
    // Por enquanto, apenas retorna sucesso
    console.log('✅ Configurações do sistema salvas (simulado)');
    
    res.json({
      success: true,
      message: 'Configurações do sistema salvas com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar configurações do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Salvar configurações de segurança
const salvarConfiguracoesSeguranca = async (req, res) => {
  try {
    console.log('🔒 Salvando configurações de segurança...');
    const seguranca = req.body;

    // Validar dados
    if (seguranca.sessao_timeout < 5 || seguranca.sessao_timeout > 480) {
      return res.status(400).json({
        success: false,
        message: 'Timeout da sessão deve estar entre 5 e 480 minutos'
      });
    }

    if (seguranca.max_tentativas_login < 3 || seguranca.max_tentativas_login > 10) {
      return res.status(400).json({
        success: false,
        message: 'Máximo de tentativas deve estar entre 3 e 10'
      });
    }

    if (seguranca.bloqueio_temporario < 5 || seguranca.bloqueio_temporario > 60) {
      return res.status(400).json({
        success: false,
        message: 'Tempo de bloqueio deve estar entre 5 e 60 minutos'
      });
    }

    // TODO: Implementar salvamento em tabela de configurações
    console.log('✅ Configurações de segurança salvas (simulado)');
    
    res.json({
      success: true,
      message: 'Configurações de segurança salvas com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar configurações de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Salvar configurações de backup
const salvarConfiguracoesBackup = async (req, res) => {
  try {
    console.log('💾 Salvando configurações de backup...');
    const backup = req.body;

    // Validar dados
    if (backup.retencao_backups < 1 || backup.retencao_backups > 365) {
      return res.status(400).json({
        success: false,
        message: 'Retenção de backups deve estar entre 1 e 365 dias'
      });
    }

    // TODO: Implementar salvamento em tabela de configurações
    console.log('✅ Configurações de backup salvas (simulado)');
    
    res.json({
      success: true,
      message: 'Configurações de backup salvas com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar configurações de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Iniciar backup manual
const iniciarBackupManual = async (req, res) => {
  try {
    console.log('🔄 Iniciando backup manual...');
    
    // TODO: Implementar lógica real de backup
    // Por enquanto, simula o processo
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Backup manual iniciado (simulado)');
    
    res.json({
      success: true,
      message: 'Backup iniciado com sucesso',
      backup_id: Date.now().toString()
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar backup'
    });
  }
};

// Restaurar backup
const restaurarBackup = async (req, res) => {
  try {
    console.log('🔄 Restaurando backup...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo de backup é obrigatório'
      });
    }

    // TODO: Implementar lógica real de restauração
    // Por enquanto, simula o processo
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Backup restaurado (simulado)');
    
    res.json({
      success: true,
      message: 'Backup restaurado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar backup'
    });
  }
};

// Obter status do backup
const getStatusBackup = async (req, res) => {
  try {
    console.log('📊 Obtendo status do backup...');
    
    // TODO: Implementar verificação real do status
    // Por enquanto, retorna dados simulados
    
    const status = {
      ultimo_backup: null,
      status: 'nao_realizado',
      tamanho: null,
      proximo_backup: null,
      backups_disponiveis: []
    };
    
    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ Erro ao obter status do backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do backup'
    });
  }
};

module.exports = {
  getConfiguracoes,
  atualizarPerfil,
  salvarConfiguracoesSistema,
  salvarConfiguracoesSeguranca,
  salvarConfiguracoesBackup,
  iniciarBackupManual,
  restaurarBackup,
  getStatusBackup
}; 