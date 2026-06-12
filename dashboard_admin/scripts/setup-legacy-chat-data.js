// Script para criar dados de exemplo das conversas legadas
// Execute este script para popular o Firestore com conversas baseadas nos pedidos existentes

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  Timestamp 
} = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus valores)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para criar mensagens de exemplo para um pedido
async function createLegacyMessagesForOrder(orderId, clientName, clientEmail, clientPhone) {
  const messagesCollection = `order_${orderId}_messages`
  
  const sampleMessages = [
    {
      clientId: `client_${orderId}`,
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      sender: 'user',
      content: `Olá! Preciso de informações sobre meu pedido ${orderId}.`,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2h atrás
      orderId: orderId,
      isRead: true
    },
    {
      clientId: 'support_system',
      clientName: 'Suporte',
      clientEmail: 'suporte@appservico.com',
      sender: 'support',
      content: `Olá ${clientName}! Vou verificar o status do seu pedido ${orderId} para você.`,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5)), // 5min depois
      orderId: orderId,
      isRead: true
    },
    {
      clientId: 'support_system',
      clientName: 'Suporte',
      clientEmail: 'suporte@appservico.com',
      sender: 'support',
      content: `Seu pedido ${orderId} está em andamento. O prestador foi notificado e deve chegar em breve.`,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1 + 1000 * 60 * 30)), // 30min depois
      orderId: orderId,
      isRead: true
    },
    {
      clientId: `client_${orderId}`,
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      sender: 'user',
      content: 'Obrigado pela informação! Posso acompanhar o progresso?',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1)), // 1h atrás
      orderId: orderId,
      isRead: false
    },
    {
      clientId: 'support_system',
      clientName: 'Suporte',
      clientEmail: 'suporte@appservico.com',
      sender: 'support',
      content: 'Claro! Você receberá atualizações por SMS e email. Também pode acompanhar pelo app.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)), // 30min atrás
      orderId: orderId,
      isRead: false
    }
  ]

  try {
    for (const message of sampleMessages) {
      await addDoc(collection(db, messagesCollection), message)
      console.log(`✅ Mensagem criada para ${messagesCollection}`)
    }
    return true
  } catch (error) {
    console.error(`❌ Erro ao criar mensagens para ${messagesCollection}:`, error)
    return false
  }
}

// Função para criar conversas de suporte geral
async function createSupportChatConversations() {
  const supportMessages = [
    {
      clientId: 'client_general_1',
      clientName: 'Maria Silva',
      clientEmail: 'maria@email.com',
      clientPhone: '(11) 99999-1111',
      sender: 'user',
      content: 'Olá! Gostaria de saber como funciona o sistema de avaliações.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 3)), // 3h atrás
      orderId: null,
      isRead: true
    },
    {
      clientId: 'support_system',
      clientName: 'Suporte',
      clientEmail: 'suporte@appservico.com',
      sender: 'support',
      content: 'Olá Maria! O sistema de avaliações funciona da seguinte forma...',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60 * 10)),
      orderId: null,
      isRead: true
    },
    {
      clientId: 'client_general_2',
      clientName: 'João Santos',
      clientEmail: 'joao@email.com',
      clientPhone: '(11) 99999-2222',
      sender: 'user',
      content: 'Como posso cancelar um pedido que já foi aceito?',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1)), // 1h atrás
      orderId: null,
      isRead: false
    },
    {
      clientId: 'support_system',
      clientName: 'Suporte',
      clientEmail: 'suporte@appservico.com',
      sender: 'support',
      content: 'Olá João! Para cancelar um pedido aceito, você pode...',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 45)), // 45min atrás
      orderId: null,
      isRead: false
    }
  ]

  try {
    for (const message of supportMessages) {
      await addDoc(collection(db, 'support_messages'), message)
      console.log(`✅ Mensagem de suporte criada`)
    }
    return true
  } catch (error) {
    console.error('❌ Erro ao criar mensagens de suporte:', error)
    return false
  }
}

// Função principal
async function createLegacyChatData() {
  try {
    console.log("🚀 Criando dados de conversas legadas...")

    // Buscar pedidos existentes
    console.log("📋 Buscando pedidos existentes...")
    const ordersSnapshot = await getDocs(collection(db, 'orders'))
    
    if (ordersSnapshot.empty) {
      console.log("⚠️  Nenhum pedido encontrado. Criando pedidos de exemplo...")
      
      // Criar alguns pedidos de exemplo
      const sampleOrders = [
        {
          clientId: 'client_1',
          clientName: 'Ana Costa',
          clientEmail: 'ana@email.com',
          phone: '(11) 99999-3333',
          address: 'Rua das Flores, 123',
          description: 'Serviço de limpeza residencial',
          isEmergency: false,
          status: 'in_progress',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 4)) // 4h atrás
        },
        {
          clientId: 'client_2',
          clientName: 'Pedro Ferreira',
          clientEmail: 'pedro@email.com',
          phone: '(11) 99999-4444',
          address: 'Av. Paulista, 1000',
          description: 'Reparo elétrico urgente',
          isEmergency: true,
          status: 'pending',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)) // 2h atrás
        },
        {
          clientId: 'client_3',
          clientName: 'Lucia Mendes',
          clientEmail: 'lucia@email.com',
          phone: '(11) 99999-5555',
          address: 'Rua Augusta, 500',
          description: 'Instalação de ar condicionado',
          isEmergency: false,
          status: 'completed',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24)) // 1 dia atrás
        }
      ]

      for (const order of sampleOrders) {
        const docRef = await addDoc(collection(db, 'orders'), order)
        console.log(`✅ Pedido de exemplo criado: ${docRef.id}`)
        
        // Criar mensagens para este pedido
        await createLegacyMessagesForOrder(
          docRef.id,
          order.clientName,
          order.clientEmail,
          order.phone
        )
      }
    } else {
      console.log(`📦 Encontrados ${ordersSnapshot.size} pedidos`)
      
      // Criar mensagens para pedidos existentes
      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data()
        console.log(`💬 Criando mensagens para pedido: ${doc.id}`)
        
        await createLegacyMessagesForOrder(
          doc.id,
          orderData.clientName || 'Cliente',
          orderData.clientEmail || 'cliente@email.com',
          orderData.phone || '(11) 99999-0000'
        )
      }
    }

    // Criar conversas de suporte geral
    console.log("🎧 Criando conversas de suporte geral...")
    await createSupportChatConversations()

    console.log("🎉 Dados de conversas legadas criados com sucesso!")
    console.log("📊 Resumo:")
    console.log(`   - Mensagens criadas para ${ordersSnapshot.size || 3} pedidos`)
    console.log(`   - Conversas de suporte geral criadas`)
    console.log("💡 Agora você pode ver as conversas históricas no sistema de monitoramento!")

  } catch (error) {
    console.error("❌ Erro ao criar dados de conversas legadas:", error)
  }
}

// Executar o script
createLegacyChatData();
