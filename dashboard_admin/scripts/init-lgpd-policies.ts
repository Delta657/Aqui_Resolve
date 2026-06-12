/**
 * Script para inicializar políticas de retenção LGPD
 * Execute: npx ts-node scripts/init-lgpd-policies.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null

if (!serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT não configurado')
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

const retentionPolicies = [
  {
    dataType: 'email',
    retentionPeriod: 365, // 1 ano após último uso
    anonymizeAfter: 730, // 2 anos
    deleteAfter: 1825, // 5 anos
    legalBasis: 'contrato',
    description: 'E-mail para comunicação e autenticação',
  },
  {
    dataType: 'telefone',
    retentionPeriod: 365,
    anonymizeAfter: 730,
    deleteAfter: 1825,
    legalBasis: 'contrato',
    description: 'Telefone para contato e comunicação',
  },
  {
    dataType: 'cpf',
    retentionPeriod: 1825, // 5 anos (obrigação fiscal)
    anonymizeAfter: 3650, // 10 anos
    deleteAfter: 5475, // 15 anos
    legalBasis: 'obrigacao_legal',
    description: 'CPF para identificação e obrigações fiscais',
  },
  {
    dataType: 'endereco',
    retentionPeriod: 365,
    anonymizeAfter: 730,
    deleteAfter: 1825,
    legalBasis: 'contrato',
    description: 'Endereço para prestação de serviços',
  },
  {
    dataType: 'dados_pedidos',
    retentionPeriod: 1825, // 5 anos (obrigação fiscal)
    anonymizeAfter: 3650,
    deleteAfter: 5475,
    legalBasis: 'obrigacao_legal',
    description: 'Dados de pedidos e transações',
  },
  {
    dataType: 'logs_acesso',
    retentionPeriod: 90, // 3 meses
    anonymizeAfter: 180, // 6 meses
    deleteAfter: 365,
    legalBasis: 'legitimo_interesse',
    description: 'Logs de acesso e segurança',
  },
]

async function initPolicies() {
  console.log('🔥 Inicializando políticas de retenção LGPD...')

  const batch = db.batch()
  const policiesRef = db.collection('lgpd_retention_policies')

  for (const policy of retentionPolicies) {
    const docRef = policiesRef.doc(policy.dataType)
    batch.set(docRef, {
      ...policy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log(`✅ Política criada: ${policy.dataType}`)
  }

  await batch.commit()
  console.log('✅ Todas as políticas foram criadas com sucesso!')
}

async function initConfig() {
  console.log('⚙️ Inicializando configuração LGPD...')

  const configRef = db.collection('lgpd_config').doc('main')
  await configRef.set({
    dpoName: 'Data Protection Officer',
    dpoEmail: 'dpo@aquiresolve.com',
    dpoPhone: '',
    privacyPolicyVersion: '1.0',
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
    dataRetentionEnabled: true,
    anonymizationEnabled: true,
    consentRequired: true,
    auditLogEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log('✅ Configuração LGPD criada!')
}

async function main() {
  try {
    await initPolicies()
    await initConfig()
    console.log('🎉 Inicialização LGPD concluída!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao inicializar LGPD:', error)
    process.exit(1)
  }
}

main()


