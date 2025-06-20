const fs = require('fs-extra');
const path = require('path');

async function copyFrontend() {
  try {
    const sourceDir = path.join(__dirname, 'apps', 'frontend', 'build');
    const targetDir = path.join(__dirname, 'apps', 'backend', 'frontend');
    
    // Criar diretório de destino se não existir
    await fs.ensureDir(targetDir);
    
    // Copiar arquivos
    await fs.copy(sourceDir, targetDir, { overwrite: true });
    
    console.log('✅ Frontend copiado com sucesso para apps/backend/frontend/');
  } catch (error) {
    console.error('❌ Erro ao copiar frontend:', error);
    process.exit(1);
  }
}

copyFrontend(); 