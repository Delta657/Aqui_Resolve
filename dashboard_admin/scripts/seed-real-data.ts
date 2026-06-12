import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore'

// Configuração do Firebase (usando a mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyDEqhKhvclyd-qfo2Hmxg2e44f0cF621CI",
  authDomain: "aplicativoservico-143c2.firebaseapp.com",
  projectId: "aplicativoservico-143c2",
  storageBucket: "aplicativoservico-143c2.firebasestorage.app",
  messagingSenderId: "183171649633",
  appId: "1:183171649633:web:2cb40dbbdc82847cf8da20",
  measurementId: "G-TSQBJSN34S"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Dados de exemplo para atividades
const sampleActivities = [
  {
    type: "order_completed",
    title: "Pedido #ORD001 concluído",
    description: "João Silva finalizou o serviço de limpeza residencial para Maria Santos",
    metadata: {
      orderId: "ORD001",
      providerId: "PROV001",
      clientId: "CLI001"
    },
    timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 minutos atrás
  },
  {
    type: "new_provider",
    title: "Novo prestador verificado",
    description: "Carlos Lima foi aprovado como prestador de serviços de manutenção",
    metadata: {
      providerId: "PROV002"
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutos atrás
  },
  {
    type: "payment_received",
    title: "Pagamento recebido",
    description: "R$ 150,00 recebido pelo pedido #ORD002",
    metadata: {
      orderId: "ORD002",
      amount: 150.00
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
  },
  {
    type: "new_order",
    title: "Novo pedido criado",
    description: "Pedido #ORD003 - Manutenção elétrica em São Paulo",
    metadata: {
      orderId: "ORD003",
      clientId: "CLI002"
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutos atrás
  },
  {
    type: "rating_received",
    title: "Avaliação 5 estrelas",
    description: "Cliente avaliou o serviço do pedido #ORD001 com 5 estrelas",
    metadata: {
      orderId: "ORD001",
      rating: 5,
      providerId: "PROV001"
    },
    timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hora atrás
  },
  {
    type: "new_client",
    title: "Novo cliente cadastrado",
    description: "Ana Costa se registrou no aplicativo",
    metadata: {
      clientId: "CLI003"
    },
    timestamp: new Date(Date.now() - 90 * 60 * 1000) // 1.5 horas atrás
  },
  {
    type: "order_cancelled",
    title: "Pedido #ORD004 cancelado",
    description: "Cliente cancelou o serviço de pintura",
    metadata: {
      orderId: "ORD004",
      clientId: "CLI004"
    },
    timestamp: new Date(Date.now() - 120 * 60 * 1000) // 2 horas atrás
  },
  {
    type: "message_received",
    title: "Nova mensagem",
    description: "Mensagem recebida do prestador Pedro Oliveira",
    metadata: {
      messageId: "MSG001",
      orderId: "ORD005"
    },
    timestamp: new Date(Date.now() - 150 * 60 * 1000) // 2.5 horas atrás
  }
]

// Dados de exemplo para pedidos
const sampleOrders = [
  {
    id: "ORD001",
    serviceType: "limpeza_residencial",
    status: "completed",
    clientId: "CLI001",
    clientName: "Maria Santos",
    providerId: "PROV001",
    providerName: "João Silva",
    totalAmount: 120.00,
    rating: 5,
    isEmergency: false,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    completedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutos atrás
    description: "Limpeza completa da casa"
  },
  {
    id: "ORD002",
    serviceType: "manutencao_eletrica",
    status: "completed",
    clientId: "CLI002",
    clientName: "Roberto Alves",
    providerId: "PROV002",
    providerName: "Carlos Lima",
    totalAmount: 150.00,
    rating: 4,
    isEmergency: false,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
    completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    description: "Reparo na instalação elétrica"
  },
  {
    id: "ORD003",
    serviceType: "manutencao_eletrica",
    status: "in_progress",
    clientId: "CLI002",
    clientName: "Roberto Alves",
    providerId: "PROV002",
    providerName: "Carlos Lima",
    totalAmount: 200.00,
    isEmergency: false,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutos atrás
    description: "Manutenção preventiva"
  },
  {
    id: "ORD004",
    serviceType: "pintura",
    status: "cancelled",
    clientId: "CLI004",
    clientName: "Fernanda Costa",
    providerId: "PROV003",
    providerName: "Pedro Oliveira",
    totalAmount: 300.00,
    isEmergency: false,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
    cancelledAt: new Date(Date.now() - 120 * 60 * 1000), // 2 horas atrás
    description: "Pintura interna da sala"
  },
  {
    id: "ORD005",
    serviceType: "limpeza_comercial",
    status: "pending",
    clientId: "CLI005",
    clientName: "Empresa ABC Ltda",
    providerId: null,
    totalAmount: 500.00,
    isEmergency: true,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    description: "Limpeza emergencial do escritório"
  },
  {
    id: "ORD006",
    serviceType: "manutencao_hidraulica",
    status: "accepted",
    clientId: "CLI001",
    clientName: "Maria Santos",
    providerId: "PROV004",
    providerName: "José Santos",
    totalAmount: 180.00,
    isEmergency: false,
    location: "São Paulo, SP",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    description: "Reparo no encanamento"
  }
]

async function seedData() {
  try {
    console.log('🌱 Iniciando seed de dados...')

    // Adicionar atividades
    console.log('📝 Adicionando atividades...')
    const activitiesRef = collection(db, 'activities')
    for (const activity of sampleActivities) {
      await addDoc(activitiesRef, {
        ...activity,
        timestamp: Timestamp.fromDate(activity.timestamp)
      })
    }
    console.log(`✅ ${sampleActivities.length} atividades adicionadas`)

    // Adicionar pedidos
    console.log('📦 Adicionando pedidos...')
    const ordersRef = collection(db, 'orders')
    for (const order of sampleOrders) {
      await addDoc(ordersRef, {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        completedAt: order.completedAt ? Timestamp.fromDate(order.completedAt) : null,
        cancelledAt: order.cancelledAt ? Timestamp.fromDate(order.cancelledAt) : null
      })
    }
    console.log(`✅ ${sampleOrders.length} pedidos adicionados`)

    console.log('🎉 Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  seedData().then(() => {
    console.log('✅ Script finalizado')
    process.exit(0)
  }).catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
}

export { seedData }
