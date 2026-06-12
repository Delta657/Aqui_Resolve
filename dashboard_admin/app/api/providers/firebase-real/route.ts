import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [],
    firebaseWorking: false,
    warning: 'Rota de teste desativada. Consulte apenas rotas reais de documentos do provider.',
  })
}
