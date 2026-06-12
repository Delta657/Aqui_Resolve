import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [],
    firebaseWorking: false,
    warning: 'Rota auxiliar desativada. Use /api/providers ou /api/providers/firebase-admin para dados reais.',
  })
}
