// Script para criar dados de exemplo do sistema de chat
// Execute este script para popular o Firestore com dados de demonstração

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  Timestamp 
} = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus valores)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados de exemplo para conversas
const sampleConversations = [
  {
    clienteId: "cliente1",
    clienteName: "João Silva",
    clienteEmail: "joao@email.com",
    clientePhone: "(11) 99999-9999",
    prestadorId: "prestador1",
    prestadorName: "Maria Santos",
    prestadorEmail: "maria@email.com",
    prestadorPhone: "(11) 88888-8888",
    orderId: "pedido1",
    orderProtocol: "PED-2024-001",
    status: "active",
    priority: "high",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2h atrás
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 5)), // 5min atrás
    lastMessage: {
      content: "Obrigado pelo serviço! Ficou excelente.",
      senderName: "João Silva",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 5)),
      messageType: "text"
    },
    unreadCount: {
      cliente: 0,
      prestador: 0,
      admin: 1
    },
    tags: ["satisfeito", "qualidade"],
    assignedAdmin: null,
    notes: "",
    isMonitored: true,
    monitoringLevel: "high"
  },
  {
    clienteId: "cliente2",
    clienteName: "Ana Costa",
    clienteEmail: "ana@email.com",
    clientePhone: "(11) 77777-7777",
    prestadorId: "prestador2",
    prestadorName: "Carlos Oliveira",
    prestadorEmail: "carlos@email.com",
    prestadorPhone: "(11) 66666-6666",
    orderId: "pedido2",
    orderProtocol: "PED-2024-002",
    status: "active",
    priority: "urgent",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)), // 30min atrás
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 2)), // 2min atrás
    lastMessage: {
      content: "Estou muito insatisfeita com o serviço prestado.",
      senderName: "Ana Costa",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 2)),
      messageType: "text"
    },
    unreadCount: {
      cliente: 0,
      prestador: 1,
      admin: 2
    },
    tags: ["reclamação", "urgente"],
    assignedAdmin: "admin1",
    notes: "[2024-01-15 14:30] Admin: Cliente relatou problemas com o serviço. Investigar.",
    isMonitored: true,
    monitoringLevel: "critical"
  },
  {
    clienteId: "cliente3",
    clienteName: "Pedro Ferreira",
    clienteEmail: "pedro@email.com",
    clientePhone: "(11) 55555-5555",
    prestadorId: "prestador3",
    prestadorName: "Lucia Mendes",
    prestadorEmail: "lucia@email.com",
    prestadorPhone: "(11) 44444-4444",
    orderId: "pedido3",
    orderProtocol: "PED-2024-003",
    status: "closed",
    priority: "medium",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24)), // 1 dia atrás
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2h atrás
    lastMessage: {
      content: "Serviço concluído com sucesso!",
      senderName: "Lucia Mendes",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)),
      messageType: "text"
    },
    unreadCount: {
      cliente: 0,
      prestador: 0,
      admin: 0
    },
    tags: ["concluído", "sucesso"],
    assignedAdmin: null,
    notes: "",
    isMonitored: false,
    monitoringLevel: "normal"
  }
];

// Dados de exemplo para mensagens
const sampleMessages = [
  // Conversa 1
  {
    chatId: "chat1",
    senderId: "cliente1",
    senderName: "João Silva",
    senderType: "cliente",
    content: "Olá! Preciso de um serviço de limpeza para minha casa.",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)),
    isRead: true,
    readBy: ["prestador1", "admin1"],
    metadata: {}
  },
  {
    chatId: "chat1",
    senderId: "prestador1",
    senderName: "Maria Santos",
    senderType: "prestador",
    content: "Olá João! Ficarei feliz em ajudar. Quando você gostaria de agendar?",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5)),
    isRead: true,
    readBy: ["cliente1"],
    metadata: {}
  },
  {
    chatId: "chat1",
    senderId: "cliente1",
    senderName: "João Silva",
    senderType: "cliente",
    content: "Que tal amanhã às 14h?",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 10)),
    isRead: true,
    readBy: ["prestador1"],
    metadata: {}
  },
  {
    chatId: "chat1",
    senderId: "prestador1",
    senderName: "Maria Santos",
    senderType: "prestador",
    content: "Perfeito! Confirmado para amanhã às 14h. Enviarei meu endereço por aqui.",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 15)),
    isRead: true,
    readBy: ["cliente1"],
    metadata: {}
  },
  {
    chatId: "chat1",
    senderId: "prestador1",
    senderName: "Maria Santos",
    senderType: "prestador",
    content: "Rua das Flores, 123 - Centro",
    messageType: "location",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 20)),
    isRead: true,
    readBy: ["cliente1"],
    metadata: {
      location: {
        lat: -23.5505,
        lng: -46.6333,
        address: "Rua das Flores, 123 - Centro"
      }
    }
  },
  {
    chatId: "chat1",
    senderId: "cliente1",
    senderName: "João Silva",
    senderType: "cliente",
    content: "Obrigado pelo serviço! Ficou excelente.",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 5)),
    isRead: true,
    readBy: ["prestador1"],
    metadata: {}
  },

  // Conversa 2 (Urgente)
  {
    chatId: "chat2",
    senderId: "cliente2",
    senderName: "Ana Costa",
    senderType: "cliente",
    content: "Boa tarde, preciso urgentemente de um encanador.",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)),
    isRead: true,
    readBy: ["prestador2", "admin1"],
    metadata: {}
  },
  {
    chatId: "chat2",
    senderId: "prestador2",
    senderName: "Carlos Oliveira",
    senderType: "prestador",
    content: "Olá Ana! Estou disponível. Qual é o problema?",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 25)),
    isRead: true,
    readBy: ["cliente2"],
    metadata: {}
  },
  {
    chatId: "chat2",
    senderId: "cliente2",
    senderName: "Ana Costa",
    senderType: "cliente",
    content: "Minha torneira está vazando muito e está alagando a cozinha!",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 20)),
    isRead: true,
    readBy: ["prestador2"],
    metadata: {}
  },
  {
    chatId: "chat2",
    senderId: "prestador2",
    senderName: "Carlos Oliveira",
    senderType: "prestador",
    content: "Entendo a urgência! Posso estar aí em 30 minutos. Onde você mora?",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 15)),
    isRead: true,
    readBy: ["cliente2"],
    metadata: {}
  },
  {
    chatId: "chat2",
    senderId: "cliente2",
    senderName: "Ana Costa",
    senderType: "cliente",
    content: "Estou muito insatisfeita com o serviço prestado.",
    messageType: "text",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 2)),
    isRead: false,
    readBy: [],
    metadata: {}
  }
];

// Dados de exemplo para ações administrativas
const sampleAdminActions = [
  {
    chatId: "chat2",
    adminId: "admin1",
    adminName: "Administrador",
    action: "priority_change",
    details: "Prioridade alterada de 'Média' para 'Urgente'",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 25)),
    metadata: { oldPriority: "medium", newPriority: "urgent" }
  },
  {
    chatId: "chat2",
    adminId: "admin1",
    adminName: "Administrador",
    action: "note_add",
    details: "Cliente relatou problemas com o serviço. Investigar.",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 20)),
    metadata: {}
  },
  {
    chatId: "chat2",
    adminId: "admin1",
    adminName: "Administrador",
    action: "assign",
    details: "Conversa atribuída para investigação",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 15)),
    metadata: { assignedTo: "admin1" }
  }
];

// Função para criar os dados
async function createSampleData() {
  try {
    console.log("🚀 Criando dados de exemplo para o sistema de chat...");

    // Criar conversas
    console.log("📝 Criando conversas...");
    for (const conversation of sampleConversations) {
      const docRef = await addDoc(collection(db, "chatConversations"), conversation);
      console.log(`✅ Conversa criada com ID: ${docRef.id}`);
    }

    // Criar mensagens
    console.log("💬 Criando mensagens...");
    for (const message of sampleMessages) {
      const docRef = await addDoc(collection(db, "chatMessages"), message);
      console.log(`✅ Mensagem criada com ID: ${docRef.id}`);
    }

    // Criar ações administrativas
    console.log("🔧 Criando ações administrativas...");
    for (const action of sampleAdminActions) {
      const docRef = await addDoc(collection(db, "adminActions"), action);
      console.log(`✅ Ação administrativa criada com ID: ${docRef.id}`);
    }

    console.log("🎉 Dados de exemplo criados com sucesso!");
    console.log("📊 Resumo:");
    console.log(`   - ${sampleConversations.length} conversas`);
    console.log(`   - ${sampleMessages.length} mensagens`);
    console.log(`   - ${sampleAdminActions.length} ações administrativas`);

  } catch (error) {
    console.error("❌ Erro ao criar dados de exemplo:", error);
  }
}

// Executar o script
createSampleData();
