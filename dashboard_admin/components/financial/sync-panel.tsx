"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RefreshCw, Database, CheckCircle, AlertCircle, Loader2, Cloud, X, Sparkles, TrendingUp, Users, CreditCard } from "lucide-react"
import { usePagarmeSync } from "@/hooks/use-pagarme-firebase"
import { useEffect, useState } from "react"

export function SyncPanel() {
  const { syncAll, syncing, lastSync, getSyncStatus } = usePagarmeSync()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    getSyncStatus()
  }, [])

  const handleSync = async () => {
    const result = await syncAll()
    if (result.success) {
      setSyncResult(result.data)
      setShowSuccessModal(true)
    } else {
      setErrorMessage(result.error || "Erro desconhecido")
      setShowErrorModal(true)
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Sincronização Pagar.me ↔ Firebase
            </CardTitle>
            <CardDescription>
              Sincronize os dados do Pagar.me com o banco de dados local
            </CardDescription>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status da última sincronização */}
          {lastSync && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Pedidos</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{lastSync.orders || 0}</p>
                <p className="text-xs text-green-600">Sincronizados</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Cobranças</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{lastSync.charges || 0}</p>
                <p className="text-xs text-blue-600">Sincronizadas</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Clientes</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{lastSync.customers || 0}</p>
                <p className="text-xs text-purple-600">Sincronizados</p>
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Como funciona</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Os dados do Pagar.me são sincronizados com o Firebase</li>
              <li>• Webhooks atualizam automaticamente em tempo real</li>
              <li>• Você pode forçar uma sincronização manual aqui</li>
              <li>• Limite de 100 registros por sincronização</li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={getSyncStatus} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Status
            </Button>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Ver Logs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Modal de Sucesso - Popup Bonito */}
    {showSuccessModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-auto border-0 overflow-hidden">
          <div className="text-center space-y-6 p-6">
          {/* Ícone de sucesso animado */}
          <div className="mx-auto w-20 h-20 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="h-10 w-10 text-white animate-pulse" />
          </div>
          
          {/* Título */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Sincronização Concluída!
            </h3>
            <p className="text-muted-foreground">Os dados foram sincronizados com sucesso</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{syncResult?.orders || 0}</p>
              <p className="text-xs text-blue-600 font-medium">Pedidos</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{syncResult?.charges || 0}</p>
              <p className="text-xs text-green-600 font-medium">Cobranças</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{syncResult?.customers || 0}</p>
              <p className="text-xs text-purple-600 font-medium">Clientes</p>
            </div>
          </div>

            {/* Botão de fechar */}
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Perfeito!
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Erro */}
    {showErrorModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-auto border-0 overflow-hidden">
          <div className="text-center space-y-6 p-6">
          {/* Ícone de erro */}
          <div className="mx-auto w-20 h-20 bg-linear-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          
          {/* Título */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Ops! Algo deu errado</h3>
            <p className="text-muted-foreground">Não foi possível sincronizar os dados</p>
          </div>

          {/* Mensagem de erro */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowErrorModal(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowErrorModal(false)
                  handleSync()
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

