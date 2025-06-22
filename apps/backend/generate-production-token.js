const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuração para produção (mesma do render.yaml)
const JWT_SECRET = 'amigo_do_povo_jwt_secret_2024_super_secure_key_12345';
const JWT_EXPIRES_IN = '24h';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

console.log('🔑 Token gerado para produção:');
console.log('📋 JWT_SECRET usado:', JWT_SECRET);
console.log('👤 Dados do usuário:', userData);
console.log('⏰ Expira em:', JWT_EXPIRES_IN);
console.log('\n🎫 TOKEN:');
console.log(token);
console.log('\n📝 Para usar no frontend:');
console.log('localStorage.setItem("token", "' + token + '");');
console.log('\n🔗 Para testar no curl:');
console.log('curl -H "Authorization: Bearer ' + token + '" https://amigo-do-povo.onrender.com/api/horarios'); 