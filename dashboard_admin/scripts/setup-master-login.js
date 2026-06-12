#!/usr/bin/env node
/**
 * Script para criar o login master no Firestore (documento adminmaster/master).
 * Usa bcrypt para hash da senha. Credenciais: master@aquiresolve.com / admin123
 *
 * Uso (na raiz do projeto):
 *   pnpm run setup:master
 *
 * Variáveis do Firebase: use .env.local ou .env, ou puxe do Vercel:
 *   npx vercel env pull .env.local
 */

const path = require('path')
const fs = require('fs')

// Carregar .env.local ou .env sem depender do pacote dotenv (KEY=VALUE, ignora #)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  })
}

const root = path.resolve(__dirname, '..')
loadEnvFile(path.join(root, '.env.local'))
loadEnvFile(path.join(root, '.env'))

const { initializeApp } = require('firebase/app')
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore')
const bcrypt = require('bcryptjs')

const BCRYPT_ROUNDS = 10

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function setupMasterLogin() {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ]

  const missingVars = requiredVars.filter((key) => !process.env[key])
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente do Firebase ausentes:')
    missingVars.forEach((v) => console.error('   -', v))
    console.error('\n💡 Configure .env.local ou .env na raiz do projeto.')
    process.exit(1)
  }

  console.log('🔥 Conectando ao Firebase...')
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  const adminMasterRef = doc(db, 'adminmaster', 'master')
  const existing = await getDoc(adminMasterRef)
  if (existing.exists()) {
    console.log('⚠️  Documento adminmaster/master já existe.')
    console.log('   Para redefinir a senha, delete o documento no Firestore e rode o script novamente.')
    console.log('   Ou altere a senha pela área master após fazer login.')
    process.exit(0)
  }

  console.log('🔐 Gerando hash da senha com bcrypt...')
  const senhaHash = await bcrypt.hash('admin123', BCRYPT_ROUNDS)

  const adminMasterData = {
    email: 'master@aquiresolve.com',
    senhaHash,
    nome: 'Administrador Master',
    permissoes: {
      dashboard: true,
      controle: true,
      gestaoUsuarios: true,
      gestaoPedidos: true,
      financeiro: true,
      relatorios: true,
      configuracoes: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  console.log('👑 Criando documento adminmaster/master...')
  await setDoc(adminMasterRef, adminMasterData)

  console.log('✅ Login master criado com sucesso!')
  console.log('')
  console.log('🔐 Credenciais:')
  console.log('   📧 Email: master@aquiresolve.com')
  console.log('   🔑 Senha: admin123')
  console.log('')
  console.log('🌐 Acesse /master no dashboard para fazer login.')
  console.log('⚠️  Em produção, altere a senha após o primeiro acesso.')
}

setupMasterLogin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro:', err.message)
    if (err.code === 'permission-denied') {
      console.error('   Verifique as regras do Firestore.')
    } else if (err.code === 'unavailable') {
      console.error('   Verifique conexão e credenciais do Firebase.')
    }
    process.exit(1)
  })
