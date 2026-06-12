#!/usr/bin/env node

/**
 * Script para configurar Firebase automaticamente
 * Execute: node scripts/setup-firebase.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, connectAuthEmulator } = require('firebase/auth');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDEqhKhvclyd-qfo2Hmxg2e44f0cF621CI",
  authDomain: "aplicativoservico-143c2.firebaseapp.com",
  projectId: "aplicativoservico-143c2",
  storageBucket: "aplicativoservico-143c2.firebasestorage.app",
  messagingSenderId: "183171649633",
  appId: "1:183171649633:web:2cb40dbbdc82847cf8da20",
  measurementId: "G-TSQBJSN34S"
};

async function setupFirebase() {
  try {
    console.log('🚀 Inicializando Firebase...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase inicializado com sucesso!');
    console.log('📊 Projeto:', firebaseConfig.projectId);
    
    // Testar conexão
    console.log('🔍 Testando conexão com Firestore...');
    
    // Verificar se as coleções existem
    const collections = ['users', 'orders', 'provider_verifications', 'saved_addresses'];
    
    for (const collectionName of collections) {
      try {
        const { collection, getDocs } = require('firebase/firestore');
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`✅ Coleção '${collectionName}': ${snapshot.size} documentos`);
      } catch (error) {
        console.log(`❌ Coleção '${collectionName}': Erro - ${error.message}`);
      }
    }
    
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse: https://console.firebase.google.com');
    console.log('2. Selecione o projeto: aplicativoservico-143c2');
    console.log('3. Vá em: Firestore Database > Rules');
    console.log('4. Cole as regras abaixo:');
    console.log('\n' + '='.repeat(60));
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PERMISSÃO TOTAL PARA DESENVOLVIMENTO
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
    `);
    console.log('='.repeat(60));
    console.log('\n5. Clique em "Publish"');
    console.log('\n🎉 Configuração concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar Firebase:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupFirebase();
}

module.exports = { setupFirebase };
