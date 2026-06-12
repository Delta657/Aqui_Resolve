import { getCollection, getDocument, getSubcollection } from "../firestore"
import { orderBy, where } from "firebase/firestore"
import type { OrderData } from "./firestore-analytics"
import type { ChatConversation, ChatMessage } from "@/types/chat"
import { normalizeMessageVisibility, normalizeThreadType } from "@/lib/chat/order-chat-schema"

export interface LegacyChatMessage {
  id: string
  sender: "user" | "support" | "system"
  content: string
  timestamp: Date
  orderId?: string
  isRead: boolean
  clientId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

export interface LegacyChatConversation {
  id: string
  orderId: string
  orderProtocol?: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  providerId?: string
  providerName?: string
  providerPhone?: string
  serviceOperationalStatus?: string
  status: "active" | "closed" | "archived" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: Date
  updatedAt: Date
  lastMessage?: {
    content: string
    senderName: string
    timestamp: Date
    messageType: "text" | "image" | "file" | "location" | "system"
  }
  unreadCount: {
    cliente: number
    prestador: number
    admin: number
  }
  assignedAdmin?: string
  notes?: string
  messageCount?: number
  source: "legacy" | "new"
  orderData?: OrderData | Record<string, any> | null
}

interface ConversationMonitoringRecord {
  id: string
  status?: LegacyChatConversation["status"]
  priority?: LegacyChatConversation["priority"]
  assignedAdmin?: string
  notes?: string
  updatedAt?: Date
}

const toDate = (value: unknown, fallback = new Date(0)): Date => {
  if (!value) {
    return fallback
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate()
  }

  const seconds = (value as { seconds?: number }).seconds
  if (typeof seconds === "number") {
    return new Date(seconds * 1000)
  }

  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

const normalizeMessageType = (value: unknown): ChatMessage["messageType"] => {
  switch (String(value || "text").toLowerCase()) {
    case "image":
      return "image"
    case "file":
      return "file"
    case "location":
      return "location"
    case "system":
      return "system"
    default:
      return "text"
  }
}

const normalizePriority = (value: unknown): LegacyChatConversation["priority"] => {
  switch (String(value || "medium").toLowerCase()) {
    case "low":
      return "low"
    case "high":
      return "high"
    case "urgent":
      return "urgent"
    default:
      return "medium"
  }
}

const normalizeStatus = (value: unknown): LegacyChatConversation["status"] => {
  switch (String(value || "active").toLowerCase()) {
    case "closed":
      return "closed"
    case "archived":
      return "archived"
    case "blocked":
      return "blocked"
    default:
      return "active"
  }
}

function extractOrderProviderContext(order: Record<string, unknown>) {
  const prestador =
    typeof order.prestador === "object" && order.prestador !== null ? (order.prestador as Record<string, unknown>) : {}
  const technician =
    typeof order.assignedTechnician === "object" && order.assignedTechnician !== null
      ? (order.assignedTechnician as Record<string, unknown>)
      : {}

  const providerIdRaw =
    order.providerId ?? order.assignedProviderId ?? prestador.uid ?? prestador.id ?? technician.id ?? technician.uid
  const providerId = typeof providerIdRaw === "string" && providerIdRaw.trim() ? providerIdRaw.trim() : undefined

  const providerNameRaw =
    order.providerName ?? prestador.nome ?? order.technicianName ?? technician.name ?? technician.nome
  const providerName = typeof providerNameRaw === "string" && providerNameRaw.trim() ? providerNameRaw.trim() : undefined

  const providerPhoneRaw =
    order.providerPhone ?? prestador.telefone ?? order.technicianPhone ?? technician.phone ?? prestador.phone
  const providerPhone = typeof providerPhoneRaw === "string" && providerPhoneRaw.trim() ? providerPhoneRaw.trim() : undefined

  const serviceOperationalStatus =
    typeof order.serviceOperationalStatus === "string" ? order.serviceOperationalStatus : undefined

  return { providerId, providerName, providerPhone, serviceOperationalStatus }
}

const normalizeMonitoringRecord = (raw: Record<string, unknown>): ConversationMonitoringRecord => ({
  id: String(raw.id || ""),
  status: raw.status ? normalizeStatus(raw.status) : undefined,
  priority: raw.priority ? normalizePriority(raw.priority) : undefined,
  assignedAdmin: typeof raw.assignedAdmin === "string" ? raw.assignedAdmin : undefined,
  notes: typeof raw.notes === "string" ? raw.notes : undefined,
  updatedAt: raw.updatedAt ? toDate(raw.updatedAt, new Date()) : undefined,
})

const mergeConversationMonitoring = (
  conversation: LegacyChatConversation,
  monitoring?: ConversationMonitoringRecord
): LegacyChatConversation => {
  if (!monitoring) {
    return conversation
  }

  return {
    ...conversation,
    status: monitoring.status || conversation.status,
    priority: monitoring.priority || conversation.priority,
    assignedAdmin: monitoring.assignedAdmin || conversation.assignedAdmin,
    notes: monitoring.notes || conversation.notes,
    updatedAt: monitoring.updatedAt && monitoring.updatedAt > conversation.updatedAt ? monitoring.updatedAt : conversation.updatedAt,
  }
}

export class ChatService {
  static async getNewConversations(): Promise<ChatConversation[]> {
    try {
      const conversations = await getCollection("chatConversations")

      return (conversations
        .filter((doc) => doc.clienteId || doc.clienteName || doc.orderId)
        .map((doc) => ({
          ...doc,
          createdAt: toDate(doc.createdAt, new Date()),
          updatedAt: toDate(doc.updatedAt, new Date()),
          lastMessage: doc.lastMessage
            ? {
                ...doc.lastMessage,
                timestamp: toDate((doc.lastMessage as Record<string, unknown>).timestamp, new Date()),
                messageType: normalizeMessageType((doc.lastMessage as Record<string, unknown>).messageType),
              }
            : undefined,
          unreadCount: doc.unreadCount || { cliente: 0, prestador: 0, admin: 0 },
          source: "new" as const,
        })) as unknown as ChatConversation[])
    } catch (error) {
      console.error("Erro ao buscar conversas do novo sistema:", error)
      return []
    }
  }

  static async getLegacyConversations(): Promise<LegacyChatConversation[]> {
    try {
      const orders = await getCollection("orders")
      const conversations: LegacyChatConversation[] = []

      for (const order of orders) {
        const messagesCollection = `order_${order.id}_messages`

        try {
          const messages = await getCollection(messagesCollection)
          const visibleMessages = messages.filter((message) => !message.isDeleted)
          if (visibleMessages.length === 0) {
            continue
          }

          const lastMessage = visibleMessages[visibleMessages.length - 1]
          const unreadCount = visibleMessages.filter((message) => !message.isRead).length

          conversations.push({
            id: `legacy_${order.id}`,
            orderId: order.id,
            clientId: order.clientId || order.id,
            clientName: order.clientName || "Cliente",
            clientEmail: order.clientEmail || "",
            clientPhone: order.phone || "",
            status: this.mapOrderStatusToChatStatus(order.status),
            priority: this.mapOrderPriorityToChatPriority(order.isEmergency ? "urgent" : "medium"),
            createdAt: toDate(order.createdAt, new Date()),
            updatedAt: toDate(lastMessage.timestamp ?? order.createdAt, new Date()),
            lastMessage: {
              content: lastMessage.content || "Mensagem sem texto",
              senderName: this.mapSenderToName(lastMessage.sender),
              timestamp: toDate(lastMessage.timestamp, new Date()),
              messageType: normalizeMessageType(lastMessage.messageType),
            },
            unreadCount: {
              cliente: 0,
              prestador: 0,
              admin: unreadCount,
            },
            messageCount: visibleMessages.length,
            source: "legacy",
            orderData: order,
          })
        } catch {
          continue
        }
      }

      return conversations
    } catch {
      return []
    }
  }

  static async getOrdersWithMessagesConversations(): Promise<LegacyChatConversation[]> {
    try {
      const orders = await getCollection("orders")
      const conversations: LegacyChatConversation[] = []

      for (const order of orders) {
        try {
          const messages = await getSubcollection("orders", order.id, "messages", orderBy("timestamp", "asc"))
          const visibleMessages = messages.filter((message) => !message.isDeleted)
          const lastMessage = visibleMessages[visibleMessages.length - 1]
          const orderRecord = order as Record<string, unknown>
          const providerCtx = extractOrderProviderContext(orderRecord)

          conversations.push({
            id: `orders_${order.id}`,
            orderId: order.id,
            orderProtocol: order.protocol || order.id,
            clientId: order.clientId || order.id,
            clientName: order.clientName || "Cliente",
            clientEmail: order.clientEmail || "",
            clientPhone: order.phone || "",
            ...providerCtx,
            status: this.mapOrderStatusToChatStatus(order.status || "active"),
            priority: order.isEmergency ? "urgent" : "medium",
            createdAt: toDate(order.createdAt, new Date()),
            updatedAt:
              visibleMessages.length > 0
                ? toDate(lastMessage.timestamp ?? lastMessage.createdAt ?? order.updatedAt ?? order.createdAt, new Date())
                : toDate(order.updatedAt ?? order.assignedAt ?? order.createdAt, new Date()),
            lastMessage:
              visibleMessages.length > 0
                ? {
                    content: lastMessage.message ?? lastMessage.content ?? "Mensagem sem texto",
                    senderName: lastMessage.senderName || lastMessage.clientName || "Cliente",
                    timestamp: toDate(lastMessage.timestamp ?? lastMessage.createdAt, new Date()),
                    messageType: normalizeMessageType(lastMessage.messageType),
                  }
                : {
                    content: `Pedido criado: ${order.description || "Servico solicitado"}`,
                    senderName: order.clientName || "Cliente",
                    timestamp: toDate(order.createdAt, new Date()),
                    messageType: "text",
                  },
            unreadCount: {
              cliente: 0,
              prestador: 0,
              admin: visibleMessages.filter((message) => !message.isRead).length,
            },
            messageCount: visibleMessages.length,
            source: "legacy",
            orderData: order,
          })
        } catch {
          const orderRecord = order as Record<string, unknown>
          const providerCtx = extractOrderProviderContext(orderRecord)

          conversations.push({
            id: `orders_${order.id}`,
            orderId: order.id,
            orderProtocol: order.protocol || order.id,
            clientId: order.clientId || order.id,
            clientName: order.clientName || "Cliente",
            clientEmail: order.clientEmail || "",
            clientPhone: order.phone || "",
            ...providerCtx,
            status: this.mapOrderStatusToChatStatus(order.status || "active"),
            priority: order.isEmergency ? "urgent" : "medium",
            createdAt: toDate(order.createdAt, new Date()),
            updatedAt: toDate(order.updatedAt ?? order.assignedAt ?? order.createdAt, new Date()),
            lastMessage: {
              content: `Pedido criado: ${order.description || "Servico solicitado"}`,
              senderName: order.clientName || "Cliente",
              timestamp: toDate(order.createdAt, new Date()),
              messageType: "text",
            },
            unreadCount: {
              cliente: 0,
              prestador: 0,
              admin: 0,
            },
            messageCount: 0,
            source: "legacy",
            orderData: order,
          })
        }
      }

      return conversations
    } catch {
      return []
    }
  }

  static async getSupportChatConversations(): Promise<LegacyChatConversation[]> {
    try {
      const supportMessages = await getCollection("support_messages")
      const conversations: LegacyChatConversation[] = []
      const messagesByOrder: Record<string, Record<string, unknown>[]> = {}

      supportMessages.forEach((message) => {
        if (message.isDeleted) {
          return
        }

        const orderId = message.orderId || "general"
        if (!messagesByOrder[orderId]) {
          messagesByOrder[orderId] = []
        }
        messagesByOrder[orderId].push(message)
      })

      for (const [orderId, messages] of Object.entries(messagesByOrder)) {
        if (messages.length === 0) {
          continue
        }

        const lastMessage = messages[messages.length - 1]
        const unreadCount = messages.filter((message) => !message.isRead).length

        let orderData = null
        if (orderId !== "general") {
          orderData = await getDocument("orders", orderId)
        }

        conversations.push({
          id: `support_${orderId}`,
          orderId: orderId === "general" ? "suporte-geral" : orderId,
          clientId: String(lastMessage.clientId || orderId),
          clientName: String(lastMessage.clientName || orderData?.clientName || "Cliente"),
          clientEmail: String(lastMessage.clientEmail || orderData?.clientEmail || ""),
          clientPhone: String(lastMessage.clientPhone || orderData?.phone || ""),
          status: "active",
          priority: unreadCount > 0 ? "high" : "medium",
          createdAt: toDate(messages[0].timestamp, new Date()),
          updatedAt: toDate(lastMessage.timestamp, new Date()),
          lastMessage: {
            content: String(lastMessage.content || "Mensagem sem texto"),
            senderName: this.mapSenderToName(String(lastMessage.sender || "user")),
            timestamp: toDate(lastMessage.timestamp, new Date()),
            messageType: "text",
          },
          unreadCount: {
            cliente: 0,
            prestador: 0,
            admin: unreadCount,
          },
          messageCount: messages.length,
          source: "legacy",
          orderData,
        })
      }

      return conversations
    } catch {
      return []
    }
  }

  static async getConversationMonitoringMap(): Promise<Map<string, ConversationMonitoringRecord>> {
    try {
      const monitoringDocs = await getCollection("chatMonitoring")
      return new Map(
        monitoringDocs.map((doc) => {
          const normalized = normalizeMonitoringRecord(doc as Record<string, unknown>)
          return [doc.id, { ...normalized, id: doc.id }]
        })
      )
    } catch {
      return new Map()
    }
  }

  static async getAllConversations(): Promise<LegacyChatConversation[]> {
    try {
      const [newConversations, legacyConversations, supportConversations, ordersWithMessages, monitoringMap] = await Promise.all([
        this.getNewConversations(),
        this.getLegacyConversations(),
        this.getSupportChatConversations(),
        this.getOrdersWithMessagesConversations(),
        this.getConversationMonitoringMap(),
      ])

      const convertedNewConversations: LegacyChatConversation[] = newConversations.map((conversation) => ({
        id: conversation.id,
        orderId: conversation.orderId || conversation.id,
        orderProtocol: conversation.orderProtocol,
        clientId: conversation.clienteId,
        clientName: conversation.clienteName,
        clientEmail: conversation.clienteEmail,
        clientPhone: conversation.clientePhone,
        status: conversation.status,
        priority: conversation.priority,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount,
        assignedAdmin: conversation.assignedAdmin,
        notes: conversation.notes,
        source: "new",
      }))

      const deduplicatedOrders = new Map<string, LegacyChatConversation>()
      for (const conversation of ordersWithMessages) {
        deduplicatedOrders.set(conversation.orderId, conversation)
      }

      const uniqueLegacy = legacyConversations.filter((conversation) => !deduplicatedOrders.has(conversation.orderId))

      const combined = [
        ...convertedNewConversations,
        ...uniqueLegacy,
        ...supportConversations,
        ...deduplicatedOrders.values(),
      ].map((conversation) => mergeConversationMonitoring(conversation, monitoringMap.get(conversation.id)))

      return combined.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    } catch (error) {
      console.error("Erro ao buscar todas as conversas:", error)
      return []
    }
  }

  static async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const newMessages = await getCollection(
        "chatMessages",
        where("chatId", "==", conversationId),
        orderBy("timestamp", "asc")
      )

      if (newMessages.length > 0) {
        return newMessages
          .filter((doc) => !doc.isDeleted)
          .map((doc) => ({
            ...doc,
            timestamp: toDate(doc.timestamp, new Date()),
            readBy: doc.readBy || [],
            metadata: doc.metadata || {},
          })) as ChatMessage[]
      }

      if (conversationId.startsWith("legacy_")) {
        const orderId = conversationId.replace("legacy_", "")
        const legacyMessages = await getCollection(`order_${orderId}_messages`)

        return legacyMessages
          .filter((doc) => !doc.isDeleted)
          .map((doc) => ({
            id: doc.id,
            chatId: conversationId,
            senderId: doc.clientId || "unknown",
            senderName: this.mapSenderToName(doc.sender),
            senderType: this.mapSenderToType(doc.sender),
            content: doc.content || "",
            messageType: normalizeMessageType(doc.messageType),
            timestamp: toDate(doc.timestamp, new Date()),
            isRead: doc.isRead || false,
            readBy: [],
            metadata: doc.metadata || {},
          })) as ChatMessage[]
      }

      if (conversationId.startsWith("support_")) {
        const orderId = conversationId.replace("support_", "")
        const supportMessages =
          orderId === "suporte-geral"
            ? await getCollection("support_messages", orderBy("timestamp", "asc"))
            : await getCollection(
                "support_messages",
                where("orderId", "==", orderId),
                orderBy("timestamp", "asc")
              )

        return supportMessages
          .filter((doc) => (orderId === "suporte-geral" ? !doc.orderId : true))
          .filter((doc) => !doc.isDeleted)
          .map((doc) => ({
            id: doc.id,
            chatId: conversationId,
            senderId: doc.clientId || "unknown",
            senderName: this.mapSenderToName(doc.sender),
            senderType: this.mapSenderToType(doc.sender),
            content: doc.content || "",
            messageType: normalizeMessageType(doc.messageType),
            timestamp: toDate(doc.timestamp, new Date()),
            isRead: doc.isRead || false,
            readBy: [],
            metadata: doc.metadata || {},
          })) as ChatMessage[]
      }

      if (conversationId.startsWith("orders_")) {
        const orderId = conversationId.replace("orders_", "")
        const messages = await getSubcollection("orders", orderId, "messages", orderBy("timestamp", "asc"))

        return messages
          .filter((doc) => !doc.isDeleted)
          .map((doc) => {
            const imageUrl = doc.imageUrl ?? doc.image_url ?? doc.mediaUrl ?? doc.attachmentUrl ?? doc.photoUrl ?? doc.metadata?.imageUrl
            const documentUrl = doc.documentUrl ?? doc.fileUrl ?? doc.metadata?.documentUrl
            const threadType = normalizeThreadType(doc.threadType ?? doc.channel)
            const visibility = normalizeMessageVisibility(doc.visibility, threadType)

            return {
              id: doc.id,
              chatId: conversationId,
              senderId: doc.senderId || doc.clientId || "unknown",
              senderName: doc.senderName || doc.clientName || "Cliente",
              senderType: this.mapSenderTypeFromFirestore(doc.senderType || doc.sender || "user"),
              content: doc.message ?? doc.content ?? "",
              messageType: normalizeMessageType(doc.messageType),
              timestamp: toDate(doc.timestamp ?? doc.createdAt, new Date()),
              isRead: doc.isRead ?? false,
              readBy: doc.readBy || [],
              metadata: { ...doc.metadata, imageUrl, documentUrl },
              threadType,
              visibility,
            }
          }) as ChatMessage[]
      }

      return []
    } catch {
      return []
    }
  }

  private static mapOrderStatusToChatStatus(orderStatus: string): LegacyChatConversation["status"] {
    switch (String(orderStatus).toLowerCase()) {
      case "completed":
      case "closed":
        return "closed"
      case "cancelled":
      case "blocked":
        return "blocked"
      default:
        return "active"
    }
  }

  private static mapOrderPriorityToChatPriority(orderPriority: string): LegacyChatConversation["priority"] {
    return normalizePriority(orderPriority)
  }

  private static mapSenderToName(sender: string): string {
    switch (String(sender).toLowerCase()) {
      case "user":
      case "client":
      case "cliente":
        return "Cliente"
      case "support":
      case "admin":
        return "Admin"
      case "system":
        return "Sistema"
      case "provider":
      case "prestador":
        return "Prestador"
      default:
        return "Usuario"
    }
  }

  private static mapSenderToType(sender: string): ChatMessage["senderType"] {
    switch (String(sender).toLowerCase()) {
      case "user":
      case "client":
      case "cliente":
        return "cliente"
      case "support":
      case "admin":
      case "system":
      case "sistema":
        return "admin"
      case "provider":
      case "prestador":
        return "prestador"
      default:
        return "cliente"
    }
  }

  private static mapSenderTypeFromFirestore(senderType: string): ChatMessage["senderType"] {
    const normalized = String(senderType || "").toLowerCase()
    if (normalized === "client" || normalized === "cliente") return "cliente"
    if (normalized === "provider" || normalized === "prestador") return "prestador"
    if (normalized === "admin" || normalized === "support" || normalized === "system") return "admin"
    return this.mapSenderToType(senderType)
  }
}
