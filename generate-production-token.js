// Script simples para gerar token JWT para produção
// Usando o JWT_SECRET correto do render.yaml

const JWT_SECRET = 'amigo_do_povo_jwt_secret_2024_super_secure_key_12345';

// Token já gerado com o JWT_SECRET correto
const productionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AYW1pZ29kb3Bvdm8uY29tIiwicGVyZmlsIjoiYWRtaW4iLCJpYXQiOjE3NTA2MDUwNzcsImV4cCI6MTc1MDY5MTQ3N30.5kZBWqshnHFmFJjYyjY5FAL9gWSqgRovVWN5Vj4i3n4';

console.log('🔑 Token para produção:');
console.log(productionToken);
console.log('\n📋 Informações:');
console.log('- JWT_SECRET usado:', JWT_SECRET);
console.log('- Expiração: 24h');
console.log('- Usuário: admin@amigodopovo.com');
console.log('- Perfil: admin');
console.log('\n✅ Token pronto para uso em produção!'); 