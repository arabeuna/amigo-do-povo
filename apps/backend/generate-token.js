const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./config/database');
require('dotenv').config();

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