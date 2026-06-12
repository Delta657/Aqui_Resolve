const { execSync } = require('child_process');

console.log('🚀 Aplicando regras do Firebase Storage...');

try {
  // Aplicar regras do Storage
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('✅ Regras do Firebase Storage aplicadas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao aplicar regras:', error.message);
  console.log('\n📋 Instruções manuais:');
  console.log('1. Acesse: https://console.firebase.google.com/');
  console.log('2. Selecione o projeto: aplicativoservico-143c2');
  console.log('3. Vá em Storage > Rules');
  console.log('4. Cole as regras do arquivo storage.rules');
  console.log('5. Clique em "Publish"');
}
