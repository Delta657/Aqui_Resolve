#!/usr/bin/env node

const { setupAdminMaster } = require('./setup-admin-master.js')

console.log('🚀 Iniciando configuração do AdminMaster...')
console.log('')

setupAdminMaster()
  .then(() => {
    console.log('')
    console.log('🎉 Configuração concluída com sucesso!')
    console.log('')
    console.log('📋 Próximos passos:')
    console.log('1. Acesse /master no seu navegador')
    console.log('2. Faça login com: master@aquiresolve.com / admin123')
    console.log('3. Configure usuários e permissões')
    console.log('4. Altere a senha padrão em produção!')
    console.log('')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro na configuração:', error)
    process.exit(1)
  })
