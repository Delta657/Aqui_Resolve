import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [],
    warning: 'Rota de acesso direto desativada. Exponha apenas URLs reais assinadas do Storage.',
  })
}
