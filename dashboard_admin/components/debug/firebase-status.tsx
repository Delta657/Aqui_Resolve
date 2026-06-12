"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface FirebaseStatus {
  url: string
  status: number | 'error'
  accessible: boolean
  error?: string
}

export function FirebaseStatus() {
  const [status, setStatus] = useState<FirebaseStatus[]>([])
  const [loading, setLoading] = useState(false)

  const testFirebaseAccess = async () => {
    setLoading(true)
    try {
      // Testar API principal
      const response = await fetch('/api/providers/proxy-images')
      const data = await response.json()
      
      // Testar URLs específicas
      const testResponse = await fetch('/api/test-storage-access')
      const testData = await testResponse.json()
      
      setStatus(testData.results || [])
      
      // Log do status principal
      console.log('📊 Status Principal:', {
        firebaseWorking: data.firebaseWorking,
        message: data.message,
        providersCount: data.providers?.length || 0
      })
      
    } catch (error) {
      console.error('Erro ao testar Firebase:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testFirebaseAccess()
  }, [])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Status do Firebase Storage
          </CardTitle>
          <Button
            onClick={testFirebaseAccess}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Testar Novamente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.length === 0 ? (
          <p className="text-muted-foreground">Testando acesso ao Firebase Storage...</p>
        ) : (
          status.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-mono break-all">{item.url}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status: {item.status} | Acessível: {item.accessible ? 'Sim' : 'Não'}
                </p>
                {item.error && (
                  <p className="text-xs text-red-500 mt-1">Erro: {item.error}</p>
                )}
              </div>
              <div className="ml-4">
                {item.accessible ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Funcionando
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Erro
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Como corrigir:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse: https://console.firebase.google.com/</li>
            <li>2. Selecione o projeto: aplicativoservico-143c2</li>
            <li>3. Vá em Storage → Rules</li>
            <li>4. Cole as regras do arquivo storage.rules</li>
            <li>5. Clique em &quot;Publish&quot;</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
