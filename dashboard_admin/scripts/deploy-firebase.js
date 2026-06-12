#!/usr/bin/env node

/**
 * Script para fazer deploy das regras do Firebase
 * Execute: node scripts/deploy-firebase.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployFirebaseRules() {
  try {
    console.log('🚀 Iniciando deploy das regras do Firebase...');
    
    // Verificar se o Firebase CLI está instalado
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      console.log('✅ Firebase CLI encontrado');
    } catch (error) {
      console.log('❌ Firebase CLI não encontrado');
      console.log('📦 Instale com: npm install -g firebase-tools');
      process.exit(1);
    }
    
    // Verificar se está logado
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      console.log('✅ Usuário logado no Firebase');
    } catch (error) {
      console.log('❌ Usuário não logado');
      console.log('🔐 Execute: firebase login');
      process.exit(1);
    }
    
    // Fazer deploy das regras
    console.log('📤 Fazendo deploy das regras...');
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    
    console.log('✅ Deploy concluído com sucesso!');
    console.log('🎉 Regras do Firestore atualizadas');
    
  } catch (error) {
    console.error('❌ Erro no deploy:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  deployFirebaseRules();
}

module.exports = { deployFirebaseRules };
