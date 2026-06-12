"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Lock, Mail, MessageCircle, Phone, User } from "lucide-react"
import { getCollection } from "@/lib/firestore"
import { toDateFromUnknown } from "@/lib/date-utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  sender: 'client' | 'support' | 'system'
  message: string
  timestamp: Date
  orderId?: string
}

interface SupportChatProps {
  orderId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

type MessageRecord = Record<string, unknown> & { id: string }

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const normalizeSender = (value: unknown): Message['sender'] => {
  const normalized = readString(value).toLowerCase()

  if (normalized.includes('support') || normalized.includes('admin') || normalized.includes('agent')) {
    return 'support'
  }

  if (normalized.includes('system')) {
    return 'system'
  }

  return 'client'
}

const normalizeMessage = (record: MessageRecord): Message | null => {
  const message =
    readString(record.message) ||
    readString(record.content) ||
    readString(record.text) ||
    readString(record.body)

  if (!message) {
    return null
  }

  return {
    id: record.id,
    sender: normalizeSender(record.sender ?? record.senderType ?? record.authorType ?? record.role),
    message,
    timestamp: toDateFromUnknown(
      record.timestamp ?? record.createdAt ?? record.created_at ?? record.sentAt,
      new Date(0)
    ),
    orderId:
      readString(record.orderId) ||
      readString(record.order_id) ||
      readString((record.order as Record<string, unknown> | undefined)?.id),
  }
}

export function ProfessionalSupportChat({
  orderId,
  clientName,
  clientEmail,
  clientPhone,
}: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        setError(null)

        const [supportMessages, chatMessages] = await Promise.all([
          getCollection('support_messages'),
          getCollection('chatMessages'),
        ])

        const normalized = [...supportMessages, ...chatMessages]
          .map((record) => normalizeMessage(record as MessageRecord))
          .filter((record): record is Message => Boolean(record))
          .filter((record) => !orderId || record.orderId === orderId)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        setMessages(normalized)
      } catch (currentError) {
        console.error('Erro ao carregar mensagens reais:', currentError)
        setError('Nao foi possivel carregar mensagens reais de suporte.')
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [orderId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const senderMeta = useMemo(
    () => ({
      client: { name: clientName || 'Cliente', color: 'bg-muted-foreground' },
      support: { name: 'Suporte', color: 'bg-orange-500' },
      system: { name: 'Sistema', color: 'bg-muted-foreground' },
    }),
    [clientName]
  )

  const formatTime = (timestamp: Date) =>
    timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="h-[600px] flex flex-col">
      <div className="bg-muted/50 border-b border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{clientName || 'Nao informado'}</p>
              <p className="text-xs text-muted-foreground">Cliente</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{clientEmail || 'Nao informado'}</p>
              <p className="text-xs text-muted-foreground">Email</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{clientPhone || 'Nao informado'}</p>
              <p className="text-xs text-muted-foreground">Telefone</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Carregando mensagens reais...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-sm text-center text-muted-foreground space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto text-orange-500" />
              <p className="font-medium text-foreground">Nenhuma mensagem real encontrada</p>
              <p className="text-sm">
                As colecoes de suporte/chat estao vazias no momento. O envio fica desabilitado ate existir um fluxo real
                de mensagens.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const meta = senderMeta[message.sender]

          return (
            <div
              key={message.id}
              className={`flex ${message.sender === 'support' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[70%] ${message.sender === 'support' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={meta.color}>
                    <MessageCircle className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'support'
                      ? 'bg-orange-500 text-white'
                      : message.sender === 'system'
                        ? 'bg-muted text-muted-foreground border border-border'
                        : 'bg-muted/500 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{meta.name}</span>
                    {message.orderId && <Badge variant="secondary" className="text-xs">{message.orderId}</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  <div className="mt-2 text-xs opacity-75">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center space-x-2">
          <Input disabled value="" placeholder="Envio desabilitado ate existir integracao real de chat" className="flex-1" />
          <Button disabled className="bg-orange-500 text-white">
            <Lock className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Historico em somente leitura</span>
          <Badge variant="outline">Sem automacao</Badge>
        </div>
      </div>
    </div>
  )
}
