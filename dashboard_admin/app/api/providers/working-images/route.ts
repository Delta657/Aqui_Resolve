import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [],
    warning: 'Rota de imagens de teste desativada para evitar dados ficticios em runtime.',
  })
}
