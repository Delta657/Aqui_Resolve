import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Inicializando setup do AdminMaster...')

    let db: FirebaseFirestore.Firestore
    try {
      db = getAdminFirestore()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin SDK não inicializado. Configure FIREBASE_SERVICE_ACCOUNT.' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim() : 'master@aquiresolve.com'
    const senha = typeof body?.senha === 'string' && body.senha ? body.senha : 'admin123'
    const nome = typeof body?.nome === 'string' && body.nome.trim() ? body.nome.trim() : 'Administrador Master'

    console.log('👑 Configurando AdminMaster...')

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS)

    const adminMasterData = {
      email,
      senhaHash,
      nome,
      permissoes: {
        dashboard: true,
        controle: true,
        gestaoUsuarios: true,
        gestaoPedidos: true,
        financeiro: true,
        relatorios: true,
        configuracoes: true,
      },
      criadoEm: new Date().toISOString(),
      ativo: true,
    }

    await db.collection('adminmaster').doc('master').set(adminMasterData)
    console.log('✅ AdminMaster configurado com sucesso!')

    await db
      .collection('adminmaster')
      .doc('master')
      .collection('configuracoes')
      .doc('sistema')
      .set({
        versao: '1.0.0',
        ultimaAtualizacao: new Date().toISOString(),
        configuracoes: {
          maxUsuarios: 100,
          sessaoTimeout: 3600,
          logAtividades: true,
          notificacoes: true,
        },
      })

    await db
      .collection('adminmaster')
      .doc('master')
      .collection('logs')
      .add({
        tipo: 'sistema',
        acao: 'setup_inicial',
        descricao: 'Sistema AdminMaster configurado com sucesso',
        timestamp: new Date().toISOString(),
        usuario: 'sistema',
      })

    return NextResponse.json({
      success: true,
      message: 'AdminMaster configurado com sucesso!',
      data: {
        adminMaster: { email, nome },
      },
    })
  } catch (error) {
    console.error('❌ Erro ao configurar AdminMaster:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para configurar o AdminMaster',
    endpoint: '/api/setup-adminmaster',
    method: 'POST',
    body: { email: 'opcional', senha: 'opcional', nome: 'opcional' },
  })
}
