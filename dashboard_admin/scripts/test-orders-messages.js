// Script para testar e popular mensagens na estrutura correta
// orders/{orderId}/messages

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  doc,
  Timestamp 
} = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus valores)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testOrdersAndMessages() {
  try {
    console.log("🔍 Testando estrutura do Firestore...")

    // Buscar todos os pedidos
    const ordersSnapshot = await getDocs(collection(db, 'orders'))
    console.log(`📦 Encontrados ${ordersSnapshot.size} pedidos`)

    if (ordersSnapshot.empty) {
      console.log("⚠️  Nenhum pedido encontrado!")
      return
    }

    // Para cada pedido, verificar se tem subcoleção messages
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data()
      console.log(`\n📋 Pedido: ${orderDoc.id}`)
      console.log(`   Cliente: ${orderData.clientName}`)
      console.log(`   Email: ${orderData.clientEmail}`)
      
      try {
        // Verificar subcoleção messages
        const messagesSnapshot = await getDocs(collection(db, `orders/${orderDoc.id}/messages`))
        console.log(`   💬 Mensagens: ${messagesSnapshot.size}`)
        
        if (messagesSnapshot.size === 0) {
          console.log(`   ➕ Criando mensagens de exemplo...`)
          
          // Criar mensagens de exemplo
          const sampleMessages = [
            {
              senderId: orderData.clientId,
              senderName: orderData.clientName,
              senderType: 'cliente',
              content: `Olá! Preciso de informações sobre meu pedido ${orderDoc.id}.`,
              messageType: 'text',
              timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2h atrás
              isRead: true,
              readBy: ['admin'],
              metadata: {}
            },
            {
              senderId: 'support_system',
              senderName: 'Suporte',
              senderType: 'admin',
              content: `Olá ${orderData.clientName}! Vou verificar o status do seu pedido para você.`,
              messageType: 'text',
              timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5)), // 5min depois
              isRead: true,
              readBy: [orderData.clientId],
              metadata: {}
            },
            {
              senderId: 'support_system',
              senderName: 'Suporte',
              senderType: 'admin',
              content: `Seu pedido ${orderDoc.id} está em andamento. O prestador foi notificado.`,
              messageType: 'text',
              timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1)), // 1h atrás
              isRead: false,
              readBy: [],
              metadata: {}
            }
          ]

          for (const message of sampleMessages) {
            await addDoc(collection(db, `orders/${orderDoc.id}/messages`), message)
            console.log(`   ✅ Mensagem criada`)
          }
        } else {
          // Mostrar mensagens existentes
          messagesSnapshot.forEach(doc => {
            const msgData = doc.data()
            console.log(`   📝 ${msgData.senderName}: ${msgData.content?.substring(0, 50)}...`)
          })
        }
      } catch (error) {
        console.log(`   ❌ Erro ao acessar mensagens: ${error.message}`)
      }
    }

    console.log("\n🎉 Teste concluído!")
    console.log("💡 Agora você pode acessar o sistema de chat e ver as conversas!")

  } catch (error) {
    console.error("❌ Erro no teste:", error)
  }
}

// Executar o teste
testOrdersAndMessages();
