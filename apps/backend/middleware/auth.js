const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso não fornecido' 
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET NÃO DEFINIDO!');
      return res.status(500).json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe e está ativo
    const result = await db.query(
      'SELECT id, nome, email, perfil FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado ou inativo' 
      });
    }

    req.user = result.rows[0];
    next();
    
  } catch (error) {
    console.error('💥 Erro na autenticação:', error.message);
    
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

const authorize = (...perfis) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Permissão insuficiente.' 
      });
    }

    next();
  };
};

module.exports = { auth, authorize }; 