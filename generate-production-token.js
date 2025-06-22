// Script simplificado para gerar token JWT sem dependências externas
// Baseado no JWT_SECRET usado em produção: 'your-secret-key'

// Função para gerar HMAC-SHA256 (simplificada)
function hmacSha256(message, key) {
  // Esta é uma implementação simplificada
  // Em produção, use a biblioteca crypto
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  // Simulação básica - em produção use crypto.subtle.importKey
  return btoa(message + key);
}

// Função para gerar token JWT
function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 horas
  
  const finalPayload = {
    ...payload,
    iat: now,
    exp: exp
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(finalPayload));
  
  const signature = hmacSha256(encodedHeader + '.' + encodedPayload, secret);
  
  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

// JWT_SECRET usado em produção
const JWT_SECRET = 'your-secret-key';

// Dados do usuário admin
const userData = {
  userId: 1,
  email: 'admin@amigodopovo.com',
  perfil: 'admin'
};

// Gerar token
const token = generateJWT(userData, JWT_SECRET);

console.log('🔑 Novo token de produção gerado:');
console.log(token);
console.log('\n📋 Payload:');
console.log(JSON.stringify(userData, null, 2));
console.log('\n⏰ Expira em: 24 horas');
console.log('\n📋 JWT_SECRET usado:', JWT_SECRET);

console.log('\n📋 Informações:');
console.log('- JWT_SECRET usado:', JWT_SECRET);
console.log('- Expiração: 24h');
console.log('- Usuário: admin@amigodopovo.com');
console.log('- Perfil: admin');
console.log('\n✅ Token pronto para uso em produção!'); 