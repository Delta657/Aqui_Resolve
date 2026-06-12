// Script para testar a configuração do Firebase
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do Firebase...\n');

// Verificar se existe .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado');
  
  // Ler e verificar variáveis
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_SERVICE_ACCOUNT'
  ];
  
  console.log('\n📋 Verificando variáveis de ambiente:');
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    const hasVar = lines.some(line => line.startsWith(varName + '='));
    if (hasVar) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`❌ ${varName} - AUSENTE`);
      allVarsPresent = false;
    }
  });
  
  if (allVarsPresent) {
    console.log('\n🎉 Todas as variáveis estão configuradas!');
    console.log('📝 Próximo passo: Execute "npm run dev" e teste a criação de usuários');
  } else {
    console.log('\n⚠️ Algumas variáveis estão ausentes');
    console.log('📝 Siga as instruções em FIREBASE_CONFIG_SETUP.md');
  }
  
} else {
  console.log('❌ Arquivo .env.local não encontrado');
  console.log('📝 Crie o arquivo .env.local seguindo as instruções em FIREBASE_CONFIG_SETUP.md');
}

console.log('\n🔗 Links úteis:');
console.log('- Firebase Console: https://console.firebase.google.com');
console.log('- Projeto: aplicativoservico-143c2');
console.log('- Service Accounts: Project Settings > Service Accounts');
