const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./config/database');
require('dotenv').config();

// JWT_SECRET usado em produção (do render.yaml)
const JWT_SECRET = 'amigo_do_povo_jwt_secret_2024_super_secure_key_12345';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token válido por 24 horas
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Token de produção gerado:');
console.log(token);
console.log('\n📋 Token decodificado:');
console.log(JSON.stringify(jwt.decode(token), null, 2));
console.log('\n⏰ Expira em: 24 horas');
console.log('\n📋 JWT_SECRET usado:', JWT_SECRET);

async function generateNewToken() {
  try {
    console.log('🔧 Gerando novo token para usuário admin...');
    
    // Verificar se o usuário admin existe
    const result = await db.query(
      'SELECT id, nome, email, perfil FROM usuarios WHERE email = $1 AND ativo = true',
      ['admin@amigodopovo.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    const usuario = result.rows[0];
    console.log('✅ Usuário encontrado:', usuario);

    // Gerar novo token
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        perfil: usuario.perfil 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('🎫 Novo token gerado com sucesso!');
    console.log('📋 Token (primeiros 50 chars):', token.substring(0, 50) + '...');
    console.log('📋 Token (últimos 50 chars):', '...' + token.substring(token.length - 50));
    console.log('📋 Token length:', token.length);
    
    // Decodificar para verificar
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 Token decodificado:', decoded);
    
    console.log('\n📝 Para usar este token:');
    console.log('1. Abra o DevTools do navegador (F12)');
    console.log('2. Vá na aba Console');
    console.log('3. Execute o comando:');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log('4. Recarregue a página');
    
  } catch (error) {
    console.error('💥 Erro ao gerar token:', error);
  } finally {
    process.exit(0);
  }
}

generateNewToken(); 