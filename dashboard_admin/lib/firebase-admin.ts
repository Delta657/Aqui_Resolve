import * as admin from 'firebase-admin'

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
  try {
    console.log('🔍 FIREBASE_SERVICE_ACCOUNT length:', json.length, '| starts with:', JSON.stringify(json.slice(0, 20)))
    // dotenv com aspas duplas converte \n em newlines reais em todo o valor.
    // Newlines reais são whitespace JSON válido entre tokens, mas inválidos
    // dentro de string literals. Percorremos char a char para escapar apenas
    // os newlines que estão dentro de strings.
    let fixed = ''
    let inString = false
    let escaped = false
    for (const char of json) {
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
    const parsed = JSON.parse(fixed)
    // Firebase Admin exige newlines reais na private_key (formato PEM)
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Firebase Service Account carregado')
    }
    return parsed
  } catch (error) {
    console.error('❌ Erro ao parsear FIREBASE_SERVICE_ACCOUNT:', error)
    console.error('❌ Verifique se o JSON está válido e bem formatado')
    return null
  }
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


