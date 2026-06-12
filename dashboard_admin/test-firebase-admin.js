// Teste de configuração do Firebase Admin
const { adminApp } = require('./lib/firebase-admin')

console.log('🔍 Testando Firebase Admin...')
console.log('Admin App:', adminApp ? '✅ Inicializado' : '❌ Não inicializado')

if (adminApp) {
  console.log('✅ Firebase Admin está funcionando!')
} else {
  console.log('❌ Firebase Admin não está configurado')
  console.log('📝 Verifique se FIREBASE_SERVICE_ACCOUNT está definido no .env.local')
}
