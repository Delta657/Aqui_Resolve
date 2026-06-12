const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Configuração do Firebase (usando as mesmas variáveis de ambiente)
const firebaseConfig = {
  apiKey: "AIzaSyBk8Qj9Qj9Qj9Qj9Qj9Qj9Qj9Qj9Qj9Qj9Q",
  authDomain: "appservico-12345.firebaseapp.com",
  projectId: "appservico-12345",
  storageBucket: "appservico-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugMessagesStructure() {
  console.log('🔍 Iniciando debug da estrutura das mensagens...\n');

  try {
    // 1. Verificar coleção orders
    console.log('📦 Verificando coleção orders...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    console.log(`   Total de pedidos: ${ordersSnapshot.size}`);
    
    if (ordersSnapshot.size > 0) {
      const firstOrder = ordersSnapshot.docs[0];
      console.log(`   Primeiro pedido ID: ${firstOrder.id}`);
      console.log(`   Dados do pedido:`, firstOrder.data());
      
      // 2. Verificar subcoleção messages do primeiro pedido
      console.log(`\n📨 Verificando subcoleção messages do pedido ${firstOrder.id}...`);
      try {
        const messagesSnapshot = await getDocs(collection(db, `orders/${firstOrder.id}/messages`));
        console.log(`   Total de mensagens: ${messagesSnapshot.size}`);
        
        if (messagesSnapshot.size > 0) {
          console.log('   Estrutura das mensagens:');
          messagesSnapshot.docs.forEach((doc, index) => {
            console.log(`   Mensagem ${index + 1}:`, {
              id: doc.id,
              data: doc.data()
            });
          });
        } else {
          console.log('   ❌ Nenhuma mensagem encontrada na subcoleção');
        }
      } catch (error) {
        console.log('   ❌ Erro ao acessar subcoleção messages:', error.message);
      }
    }

    // 3. Verificar outras coleções possíveis
    console.log('\n🔍 Verificando outras coleções...');
    
    const collections = ['messages', 'chatMessages', 'support_messages'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`   ${collectionName}: ${snapshot.size} documentos`);
        
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0];
          console.log(`     Primeiro documento:`, {
            id: firstDoc.id,
            data: firstDoc.data()
          });
        }
      } catch (error) {
        console.log(`   ❌ Erro ao acessar ${collectionName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugMessagesStructure()
  .then(() => {
    console.log('\n✅ Debug concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
