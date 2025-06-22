const jwt = require('jsonwebtoken');

// Configurações de produção (mesmas do render.yaml)
const JWT_SECRET = 'amigo_do_povo_jwt_secret_2024_super_secure_key_12345';
const JWT_EXPIRES_IN = '24h';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token
const token = jwt.sign(userData, JWT_SECRET, { 
  expiresIn: JWT_EXPIRES_IN 
});

console.log('🔑 Token gerado para produção:');
console.log(token);
console.log('\n📋 Informações do token:');
console.log('- Secret usado:', JWT_SECRET);
console.log('- Expiração:', JWT_EXPIRES_IN);
console.log('- Dados do usuário:', userData);

// Verificar se o token é válido
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token válido!');
  console.log('- Decodificado:', decoded);
} catch (error) {
  console.log('\n❌ Token inválido:', error.message);
} 