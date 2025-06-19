const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, senha } = req.body;

    // Buscar usuário pelo email
    const result = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    const usuario = result.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Retornar dados do usuário (sem senha) e token
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        usuario: usuarioSemSenha,
        token
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const registrar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { nome, email, senha, perfil } = req.body;

    // Verificar se email já existe
    const emailExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Criptografar senha
    const saltRounds = 12;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

    // Inserir novo usuário
    const result = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil, data_criacao',
      [nome, email, senhaCriptografada, perfil]
    );

    const novoUsuario = result.rows[0];

    // Gerar token JWT
    const token = jwt.sign(
      { userId: novoUsuario.id, email: novoUsuario.email, perfil: novoUsuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        usuario: novoUsuario,
        token
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const me = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        usuario: req.user
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const alterarSenha = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user.id;

    // Buscar usuário atual
    const result = await db.query(
      'SELECT senha FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const usuario = result.rows[0];

    // Verificar senha atual
    const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaAtualValida) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Criptografar nova senha
    const saltRounds = 12;
    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar senha
    await db.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [novaSenhaCriptografada, userId]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  login,
  registrar,
  me,
  alterarSenha
}; 