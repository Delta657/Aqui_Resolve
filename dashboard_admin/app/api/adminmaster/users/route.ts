import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { adminApp, getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin'

export async function GET(_req: NextRequest) {
  try {
    let db: admin.firestore.Firestore
    try {
      db = getAdminFirestore()
    } catch {
      return NextResponse.json({ success: false, error: 'Firebase Admin não inicializado' }, { status: 500 })
    }
    const snapshot = await db.collection('adminmaster').doc('master').collection('usuarios').get()
    const usuarios = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email ?? '',
      nome: doc.data().nome ?? '',
      permissoes: doc.data().permissoes ?? {},
    }))
    return NextResponse.json({ success: true, usuarios })
  } catch (error: any) {
    console.error('❌ Erro ao listar usuários master:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })

    let db: admin.firestore.Firestore
    try {
      db = getAdminFirestore()
    } catch {
      return NextResponse.json({ success: false, error: 'Firebase Admin não inicializado' }, { status: 500 })
    }

    const body = await req.json()
    await db.collection('adminmaster').doc('master').collection('usuarios').doc(id).update(body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar usuário master:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })

    let db: admin.firestore.Firestore
    try {
      db = getAdminFirestore()
    } catch {
      return NextResponse.json({ success: false, error: 'Firebase Admin não inicializado' }, { status: 500 })
    }

    await db.collection('adminmaster').doc('master').collection('usuarios').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro ao deletar usuário master:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Iniciando criação de usuário master...')
    console.log('🔍 Firebase Admin Status:', { 
      app: !!adminApp, 
      serviceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID 
    })
    
    const body = await req.json()
    const { nome, email, password, permissoes } = body || {}

    console.log('📝 Dados recebidos:', { nome, email, permissoes: Object.keys(permissoes || {}) })

    if (!nome || !email || !password || !permissoes) {
      console.error('❌ Dados inválidos:', { nome: !!nome, email: !!email, password: !!password, permissoes: !!permissoes })
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }

    let auth: admin.auth.Auth
    let db: admin.firestore.Firestore

    try {
      auth = getAdminAuth()
      db = getAdminFirestore()
      console.log('✅ Firebase Admin disponível, criando usuário...')
    } catch (error: any) {
      console.error('❌ Erro ao obter Firebase Admin:', error.message)
      console.error('❌ Verifique se FIREBASE_SERVICE_ACCOUNT está configurado no .env.local')
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase Admin não inicializado. Verifique se FIREBASE_SERVICE_ACCOUNT está configurado no .env.local' 
      }, { status: 500 })
    }

    // Verifica se o usuário já existe
    try {
      const existingUser = await auth.getUserByEmail(email)
      if (existingUser) {
        console.error('❌ Usuário já existe:', email)
        return NextResponse.json({ success: false, error: 'Usuário já existe com este email' }, { status: 400 })
      }
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.error('❌ Erro ao verificar usuário existente:', error)
        throw error
      }
      // Usuário não existe, continuar
    }

    // Cria usuário de autenticação
    console.log('👤 Criando usuário no Firebase Auth...')
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nome,
      emailVerified: false,
      disabled: false,
    })

    console.log('✅ Usuário criado no Auth:', userRecord.uid)

    // Salva permissões na subcoleção adminmaster/master/usuarios usando uid como id
    console.log('💾 Salvando permissões no Firestore...')
    const usuarioRef = db.collection('adminmaster').doc('master').collection('usuarios').doc(userRecord.uid)
    await usuarioRef.set({
      nome,
      email,
      permissoes,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('✅ Usuário master criado com sucesso!')
    return NextResponse.json({ success: true, uid: userRecord.uid })
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário master:', error)
    
    // Tratamento específico para erros comuns
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ success: false, error: 'Email já está em uso' }, { status: 400 })
    }
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 })
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({ success: false, error: 'Senha muito fraca' }, { status: 400 })
    }
    
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno' }, { status: 500 })
  }
}


