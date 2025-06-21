const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Middleware de autenticação - iniciando...');
    console.log('📡 URL da requisição:', req.url);
    console.log('🔧 Método da requisição:', req.method);
    console.log('📋 Headers recebidos:', {
      authorization: req.header('Authorization') ? 'Presente' : 'Ausente',
      'content-type': req.header('Content-Type'),
      'user-agent': req.header('User-Agent')?.substring(0, 50) + '...'
    });
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🎫 Token recebido:', token ? 'Sim' : 'Não');
    if (token) {
      console.log('🎫 Token (primeiros 20 chars):', token.substring(0, 20) + '...');
      console.log('🎫 Token (últimos 20 chars):', '...' + token.substring(token.length - 20));
      console.log('🎫 Token length:', token.length);
    }
    
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso não fornecido' 
      });
    }

    console.log('🔑 JWT_SECRET definido:', process.env.JWT_SECRET ? 'Sim' : 'Não');
    if (process.env.JWT_SECRET) {
      console.log('🔑 JWT_SECRET (primeiros 10 chars):', process.env.JWT_SECRET.substring(0, 10) + '...');
      console.log('🔑 JWT_SECRET length:', process.env.JWT_SECRET.length);
    } else {
      console.log('❌ JWT_SECRET NÃO DEFINIDO!');
      return res.status(500).json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', { userId: decoded.userId, email: decoded.email });
    
    // Verificar se o usuário ainda existe e está ativo
    const result = await db.query(
      'SELECT id, nome, email, perfil FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.userId]
    );

    console.log('👤 Usuário encontrado no banco:', result.rows.length > 0);
    if (result.rows.length > 0) {
      console.log('👤 Dados do usuário:', result.rows[0]);
    }

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
    console.error('💥 Tipo do erro:', error.name);
    console.error('💥 Stack trace:', error.stack);
    
    if (error.name === 'JsonWebTokenError') {
      console.error('💥 Erro específico do JWT:', error.message);
    } else if (error.name === 'TokenExpiredError') {
      console.error('💥 Token expirado:', error.message);
    }
    
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