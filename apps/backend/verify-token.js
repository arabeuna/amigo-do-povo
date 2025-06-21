const jwt = require('jsonwebtoken');
require('dotenv').config();

// Token que está sendo usado no frontend
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AYW1pZ29kb3Bvdm8uY29tIiwicGVyZmlsIjoiYWRtaW4iLCJpYXQiOjE3NTA1MzE1NDIsImV4cCI6MTc1MDYxNzk0Mn0.CD0qMlc6tw9I5ZN3G4VFvoH9cKvjP4aUszYfCC1LfOI';

function verifyToken() {
  try {
    console.log('🔍 Verificando token...');
    console.log('📋 Token:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token válido!');
    console.log('📋 Dados decodificados:', decoded);
    
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    const timeLeft = exp - now;
    
    console.log('⏰ Tempo restante:', Math.floor(timeLeft / 60), 'minutos');
    
    if (timeLeft <= 0) {
      console.log('❌ Token expirado!');
    } else {
      console.log('✅ Token ainda válido');
    }
    
  } catch (error) {
    console.error('❌ Token inválido:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      console.log('❌ Token expirado em:', new Date(error.expiredAt));
    } else if (error.name === 'JsonWebTokenError') {
      console.log('❌ Token malformado ou JWT_SECRET incorreto');
    }
  }
}

verifyToken(); 