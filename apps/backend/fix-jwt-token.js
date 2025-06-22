const jwt = require('jsonwebtoken');

// JWT_SECRET que deve estar configurado no Render
const JWT_SECRET = 'your-secret-key';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token válido
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Token gerado para produção:');
console.log(token);
console.log('\n📋 Para usar no frontend:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\n✅ Token válido por 24 horas'); 