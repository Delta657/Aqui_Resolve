const { execSync } = require('child_process');

async function configureFirebaseOAuth() {
  try {
    console.log('🔧 Configurando domínio OAuth do Firebase...');
    
    // Lista de domínios para adicionar
    const domains = [
      'dashboard-admin-bay.vercel.app',
      'localhost:3000',
      '127.0.0.1:3000'
    ];
    
    console.log('📋 Domínios a serem configurados:');
    domains.forEach(domain => console.log(`  - ${domain}`));
    
    console.log('\n⚠️  CONFIGURAÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Acesse: https://console.firebase.google.com/project/aplicativoservico-143c2/authentication/settings');
    console.log('2. Vá para a aba "Authorized domains"');
    console.log('3. Clique em "Add domain"');
    console.log('4. Adicione os seguintes domínios:');
    domains.forEach(domain => console.log(`   - ${domain}`));
    console.log('5. Clique em "Done" para cada domínio');
    
    console.log('\n✅ Após configurar, o erro OAuth será resolvido!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar OAuth:', error.message);
  }
}

configureFirebaseOAuth();
