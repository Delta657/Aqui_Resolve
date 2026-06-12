import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [],
    warning: 'Rota de imagens reais de teste desativada para evitar payloads artificiais.',
  })
}
