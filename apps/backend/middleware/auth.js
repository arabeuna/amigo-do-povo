const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Middleware de autenticação - iniciando...');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🎫 Token recebido:', token ? 'Sim' : 'Não');
    
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso não fornecido' 
      });
    }

    console.log('🔑 JWT_SECRET definido:', process.env.JWT_SECRET ? 'Sim' : 'Não');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', { userId: decoded.userId, email: decoded.email });
    
    // Verificar se o usuário ainda existe e está ativo
    const result = await db.query(
      'SELECT id, nome, email, perfil FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.userId]
    );

    console.log('👤 Usuário encontrado no banco:', result.rows.length > 0);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado ou inativo');
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado ou inativo' 
      });
    }

    req.user = result.rows[0];
    console.log('✅ Autenticação bem-sucedida para:', req.user.email);
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