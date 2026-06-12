const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

async function testUsersIntegration() {
  try {
    console.log('🔍 Testando integração com dados reais do Firestore...\n');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Buscar todos os usuários
    console.log('📊 Buscando todos os usuários...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`✅ Total de usuários encontrados: ${allUsers.length}\n`);
    
    // Filtrar clientes (userType: 'client')
    const clients = allUsers.filter(user => user.userType === 'client');
    console.log(`👥 Clientes encontrados: ${clients.length}`);
    
    if (clients.length > 0) {
      console.log('📋 Exemplo de cliente:');
      const client = clients[0];
      console.log(`   - ID: ${client.id}`);
      console.log(`   - Nome: ${client.fullName || client.name || 'N/A'}`);
      console.log(`   - Email: ${client.email || 'N/A'}`);
      console.log(`   - UserType: ${client.userType}`);
      console.log(`   - Ativo: ${client.isActive !== false ? 'Sim' : 'Não'}`);
      console.log(`   - Verificado: ${client.isVerified ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${client.createdAt?.toDate?.() || 'N/A'}\n`);
    }
    
    // Filtrar prestadores (userType: 'provider')
    const providers = allUsers.filter(user => user.userType === 'provider');
    console.log(`🔧 Prestadores encontrados: ${providers.length}`);
    
    if (providers.length > 0) {
      console.log('📋 Exemplo de prestador:');
      const provider = providers[0];
      console.log(`   - ID: ${provider.id}`);
      console.log(`   - Nome: ${provider.fullName || provider.name || 'N/A'}`);
      console.log(`   - Email: ${provider.email || 'N/A'}`);
      console.log(`   - UserType: ${provider.userType}`);
      console.log(`   - Ativo: ${provider.isActive !== false ? 'Sim' : 'Não'}`);
      console.log(`   - Verificado: ${provider.verificado ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${provider.createdAt?.toDate?.() || 'N/A'}\n`);
    }
    
    // Estatísticas gerais
    const activeUsers = allUsers.filter(user => user.isActive !== false).length;
    const blockedUsers = allUsers.filter(user => user.isActive === false).length;
    const verifiedUsers = allUsers.filter(user => user.verificado || user.isVerified).length;
    
    console.log('📈 Estatísticas gerais:');
    console.log(`   - Total de usuários: ${allUsers.length}`);
    console.log(`   - Usuários ativos: ${activeUsers}`);
    console.log(`   - Usuários bloqueados: ${blockedUsers}`);
    console.log(`   - Usuários verificados: ${verifiedUsers}`);
    console.log(`   - Clientes: ${clients.length}`);
    console.log(`   - Prestadores: ${providers.length}\n`);
    
    // Verificar estrutura dos dados
    console.log('🔍 Verificando estrutura dos dados...');
    const sampleUser = allUsers[0];
    if (sampleUser) {
      console.log('📋 Campos disponíveis no primeiro usuário:');
      Object.keys(sampleUser).forEach(key => {
        const value = sampleUser[key];
        const type = typeof value;
        console.log(`   - ${key}: ${type} (${value})`);
      });
    }
    
    console.log('\n✅ Teste de integração concluído com sucesso!');
    console.log('🎉 As páginas de clientes e prestadores agora devem mostrar dados reais do Firestore.');
    
  } catch (error) {
    console.error('❌ Erro ao testar integração:', error);
    console.error('💡 Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente.');
  }
}

// Executar teste
testUsersIntegration();
