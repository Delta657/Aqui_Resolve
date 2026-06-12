import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Testar acesso ao Firebase Storage
    const testUrls = [
      "https://firebasestorage.googleapis.com/v0/b/aplicativoservico-143c2.appspot.com/o/Documentos%2Fzxyg0HWXZ8TWHEp1DTutmjA7BBz1%2F1759591584119_Naruto_Uzumaki_%28Parte_I_-_HD%29.png?alt=media"
    ]
    
    const results = []
    
    for (const url of testUrls) {
      try {
        // Usar GET com Range para checagem leve
        const response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
        results.push({
          url,
          status: response.status,
          accessible: response.status === 200 || response.status === 206,
          headers: Object.fromEntries(response.headers.entries())
        })
      } catch (error: any) {
        results.push({
          url,
          status: 'error',
          accessible: false,
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      message: "Teste de acesso ao Firebase Storage concluído",
      results,
      workingUrls: results.filter(r => r.accessible).map(r => r.url)
    })
    
  } catch (error: any) {
    console.error('Erro ao testar acesso ao Storage:', error)
    return NextResponse.json({ 
      error: "Erro ao realizar teste de acesso",
      details: error.message 
    }, { status: 500 })
  }
}
