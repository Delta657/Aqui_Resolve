// Script para debugar conexão com Firestore
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc 
} = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus valores)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
  // Exemplo:
  // apiKey: "sua-api-key",
  // authDomain: "seu-projeto.firebaseapp.com",
  // projectId: "seu-projeto-id",
  // storageBucket: "seu-projeto.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "sua-app-id"
};

async function debugFirestore() {
  try {
    console.log("🔧 Inicializando Firebase...")
    
    if (!firebaseConfig.apiKey) {
      console.log("⚠️  Configuração do Firebase não encontrada!")
      console.log("📝 Adicione suas credenciais no arquivo scripts/debug-firestore.js")
      return
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("✅ Firebase inicializado com sucesso!")

    // Testar acesso à coleção orders
    console.log("\n🔍 Testando acesso à coleção 'orders'...")
    const ordersSnapshot = await getDocs(collection(db, 'orders'))
    console.log(`📦 Encontrados ${ordersSnapshot.size} pedidos na coleção 'orders'`)

    if (ordersSnapshot.empty) {
      console.log("⚠️  Nenhum pedido encontrado na coleção 'orders'")
      console.log("💡 Verifique se:")
      console.log("   - O nome da coleção está correto")
      console.log("   - Existem dados na coleção")
      console.log("   - As regras do Firestore permitem leitura")
    } else {
      console.log("\n📋 Primeiros 3 pedidos encontrados:")
      let count = 0
      for (const orderDoc of ordersSnapshot.docs) {
        if (count >= 3) break
        const orderData = orderDoc.data()
        console.log(`\n   Pedido ${count + 1}:`)
        console.log(`   - ID: ${orderDoc.id}`)
        console.log(`   - Cliente: ${orderData.clientName || 'N/A'}`)
        console.log(`   - Email: ${orderData.clientEmail || 'N/A'}`)
        console.log(`   - Status: ${orderData.status || 'N/A'}`)
        
        // Testar subcoleção messages
        try {
          console.log(`   - Testando subcoleção messages...`)
          const messagesSnapshot = await getDocs(collection(db, `orders/${orderDoc.id}/messages`))
          console.log(`   - Mensagens encontradas: ${messagesSnapshot.size}`)
        } catch (error) {
          console.log(`   - Erro ao acessar messages: ${error.message}`)
        }
        
        count++
      }
    }

    // Testar outras coleções
    const collectionsToTest = ['chatConversations', 'support_messages', 'messages']
    
    for (const collectionName of collectionsToTest) {
      try {
        console.log(`\n🔍 Testando coleção '${collectionName}'...`)
        const snapshot = await getDocs(collection(db, collectionName))
        console.log(`📊 ${collectionName}: ${snapshot.size} documentos`)
      } catch (error) {
        console.log(`❌ Erro ao acessar ${collectionName}: ${error.message}`)
      }
    }

    console.log("\n🎉 Debug concluído!")
    
  } catch (error) {
    console.error("❌ Erro no debug:", error)
    console.log("\n💡 Possíveis soluções:")
    console.log("   - Verificar configuração do Firebase")
    console.log("   - Verificar regras do Firestore")
    console.log("   - Verificar conexão com internet")
  }
}

// Executar o debug
debugFirestore();
