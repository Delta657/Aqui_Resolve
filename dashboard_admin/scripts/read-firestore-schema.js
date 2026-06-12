/* eslint-disable no-console */
const admin = require('firebase-admin')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('FIREBASE_SERVICE_ACCOUNT invalido (JSON mal formatado).')
    return null
  }
}

function initAdmin() {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT nao encontrado no .env.local')
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

function flattenKeys(obj, parent = '', out = new Set()) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return out
  }

  for (const [key, value] of Object.entries(obj)) {
    const full = parent ? `${parent}.${key}` : key
    out.add(full)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenKeys(value, full, out)
    }
  }

  return out
}

async function readCollectionSchema(db, collectionName, sampleLimit = 50) {
  const snapshot = await db.collection(collectionName).limit(sampleLimit).get()
  const fieldSet = new Set()

  snapshot.docs.forEach((doc) => {
    flattenKeys(doc.data(), '', fieldSet)
  })

  return {
    collection: collectionName,
    totalReadDocs: snapshot.size,
    fields: Array.from(fieldSet).sort(),
  }
}

async function main() {
  try {
    initAdmin()
    const db = admin.firestore()
    const collections = await db.listCollections()

    if (collections.length === 0) {
      console.log('Nenhuma colecao encontrada.')
      return
    }

    console.log(`Projeto: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nao informado'}`)
    console.log(`Colecoes encontradas: ${collections.length}\n`)

    for (const collectionRef of collections) {
      const result = await readCollectionSchema(db, collectionRef.id, 50)
      console.log(`- ${result.collection} (amostra lida: ${result.totalReadDocs})`)
      if (result.fields.length === 0) {
        console.log('  Campos: [nenhum documento na amostra]')
      } else {
        console.log(`  Campos: ${result.fields.join(', ')}`)
      }
      console.log('')
    }
  } catch (error) {
    console.error('Falha ao ler schema do Firestore (somente leitura):', error.message)
    process.exitCode = 1
  }
}

main()
