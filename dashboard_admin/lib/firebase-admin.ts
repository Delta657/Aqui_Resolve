import * as admin from 'firebase-admin'

function escapeNewlinesInsideJsonStrings(value: string) {
  let fixed = ''
  let inString = false
  let escaped = false

  for (const char of value) {
    if (escaped) {
      fixed += char
      escaped = false
    } else if (char === '\\' && inString) {
      fixed += char
      escaped = true
    } else if (char === '"') {
      inString = !inString
      fixed += char
    } else if (char === '\n' && inString) {
      fixed += '\\n'
    } else {
      fixed += char
    }
  }

  return fixed
}

const getServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!json) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT não configurado')
      console.warn('⚠️ Para configurar, adicione a variável FIREBASE_SERVICE_ACCOUNT no .env.local')
      console.warn('⚠️ Formato: FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}')
    }
    return null
  }

  const trimmed = json.trim()
  const candidates = [trimmed]

  if (trimmed.includes('\\"')) {
    candidates.push(trimmed.replace(/\\"/g, '"'))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(escapeNewlinesInsideJsonStrings(candidate))

      if (!parsed || typeof parsed !== 'object') {
        continue
      }

      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firebase Service Account carregado')
      }

      return parsed
    } catch {
      // Tenta o proximo formato suportado.
    }
  }

  console.error('❌ Erro ao parsear FIREBASE_SERVICE_ACCOUNT')
  console.error('❌ Verifique se o JSON está válido e bem formatado')
  return null
}

// Inicializar Firebase Admin apenas uma vez
if (!admin.apps.length) {
  const serviceAccount = getServiceAccount()
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'aplicativoservico-143c2.appspot.com',
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firebase Admin SDK inicializado com sucesso')
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase Admin SDK:', error)
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Firebase Admin SDK não inicializado - sem service account')
    }
  }
}

// Exportar app e helpers
export const adminApp = admin.apps.length > 0 ? admin.app() : null
export const adminStorage = adminApp ? adminApp.storage().bucket() : null

// Helper para obter auth
export const getAdminAuth = () => {
  if (!adminApp) {
    throw new Error('Firebase Admin não inicializado. Verifique se FIREBASE_SERVICE_ACCOUNT está configurado.')
  }
  return admin.auth(adminApp)
}

// Helper para obter firestore
export const getAdminFirestore = () => {
  if (!adminApp) {
    throw new Error('Firebase Admin não inicializado. Verifique se FIREBASE_SERVICE_ACCOUNT está configurado.')
  }
  return admin.firestore(adminApp)
}

if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Firebase Admin Status:', {
    app: !!adminApp,
    storage: !!adminStorage,
    serviceAccount: !!getServiceAccount()
  })
}

