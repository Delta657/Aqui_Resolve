import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Configuração do Firebase — usa acesso estático para Next injetar no build
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase
let app!: FirebaseApp;
let db!: Firestore;
let auth: Auth;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

try {
  // Inicializar Firebase
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  auth = getAuth(app);
  
  // Inicializar Storage com tratamento de erro
  try {
    // Verificar se storageBucket está configurado
    if (firebaseConfig.storageBucket) {
      storage = getStorage(app, firebaseConfig.storageBucket);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firebase Storage inicializado:', firebaseConfig.storageBucket);
      }
    } else {
      console.warn('⚠️ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET não configurado');
      // Tenta inicializar sem especificar bucket (usa o padrão do projeto)
      storage = getStorage(app);
    }
  } catch (storageError: any) {
    console.error('❌ Erro ao inicializar Firebase Storage:', {
      code: storageError?.code,
      message: storageError?.message
    });
    storage = null;
  }

  // Inicializar Analytics apenas no cliente
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && app) {
        try {
          analytics = getAnalytics(app);
        } catch (analyticsError) {
          console.warn('⚠️ Erro ao inicializar Analytics:', analyticsError);
          analytics = null;
        }
      }
    }).catch(() => {
      analytics = null;
    });
  }
} catch (error: any) {
  console.error('❌ Erro crítico ao inicializar Firebase:', {
    code: error?.code,
    message: error?.message
  });
  // Em caso de erro crítico, tenta continuar com valores null
  if (!app) {
    throw error; // Se não conseguiu inicializar o app, não pode continuar
  }
}

export { app, db, auth, storage, analytics };
