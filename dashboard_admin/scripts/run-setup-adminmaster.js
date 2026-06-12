#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Executando setup do AdminMaster...');
console.log('📋 Verificando variáveis de ambiente...');

// Verificar se as variáveis estão definidas
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente ausentes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.log('\n💡 Configure as variáveis no arquivo .env.local ou no Vercel');
  console.log('📝 Exemplo de .env.local:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id');
  process.exit(1);
}

console.log('✅ Todas as variáveis de ambiente estão configuradas');

// Executar o script de setup
const scriptPath = path.join(__dirname, 'setup-adminmaster-vercel.js');
const child = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao executar setup:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Avisos:', stderr);
  }
  
  console.log(stdout);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('🌐 Acesse /master para gerenciar usuários e permissões');
    console.log('🔧 Acesse /setup-adminmaster para configurar via interface web');
  } else {
    console.error(`❌ Setup falhou com código ${code}`);
  }
});
