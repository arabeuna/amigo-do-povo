const jwt = require('jsonwebtoken');

// JWT Secret do Render (produção)
const JWT_SECRET = 'amigo_do_povo_jwt_secret_2024_super_secure_key_12345';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Token gerado para produção:');
console.log(token);
console.log('\n📋 Informações do token:');
console.log('User ID:', userData.userId);
console.log('Email:', userData.email);
console.log('Perfil:', userData.perfil);
console.log('Secret usado:', JWT_SECRET);
console.log('\n📝 Para usar no frontend:');
console.log('localStorage.setItem("token", "' + token + '");');
console.log('\n🔗 Para testar no curl:');
console.log('curl -H "Authorization: Bearer ' + token + '" https://amigo-do-povo.onrender.com/api/horarios'); 