export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderType: 'cliente' | 'prestador' | 'admin'
  /** Canal dentro do pedido; omitido = tráfego legado cliente↔prestador. */
  threadType?: "client_provider" | "client_base" | "provider_base" | "admin_internal"
  /** Regras de leitura no app; admin vê todas no dashboard. */
  visibility?: "public" | "admin_client" | "admin_provider" | "admin_only"
  content: string
  messageType: 'text' | 'image' | 'file' | 'location' | 'system'
  timestamp: Date
  isRead: boolean
  readBy: string[]
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    imageUrl?: string
    documentUrl?: string
    mediaUrl?: string
    attachmentUrl?: string
    location?: {
      lat: number
      lng: number
      address: string
    }
  }
  isDeleted?: boolean
  deletedAt?: Date
  deletedBy?: string
}

export interface ChatConversation {
  id: string
  clienteId: string
  clienteName: string
  clienteEmail: string
  clientePhone?: string
  prestadorId: string
  prestadorName: string
  prestadorEmail: string
  prestadorPhone?: string
  orderId?: string
  orderProtocol?: string
  status: 'active' | 'closed' | 'archived' | 'blocked'
  createdAt: Date
  updatedAt: Date
  lastMessage?: {
    content: string
    senderName: string
    timestamp: Date
    messageType: 'text' | 'image' | 'file' | 'location' | 'system'
  }
  unreadCount: {
    cliente: number
    prestador: number
    admin: number
  }
  tags?: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAdmin?: string
  notes?: string
  isMonitored: boolean
  monitoringLevel: 'normal' | 'high' | 'critical'
}

export interface ChatStats {
  totalConversations: number
  activeConversations: number
  closedConversations: number
  blockedConversations: number
  totalMessages: number
  unreadMessages: number
  averageResponseTime: number
  conversationsByPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  messagesByType: {
    text: number
    image: number
    file: number
    location: number
    system: number
  }
}

export interface ChatFilter {
  status?: 'active' | 'closed' | 'archived' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dateRange?: {
    start: Date
    end: Date
  }
  searchTerm?: string
  /** Busca por nome/telefone do prestador (quando houver no pedido). */
  providerSearch?: string
  /** Filtro por protocolo ou id curto do pedido. */
  protocolSearch?: string
  /** Filtro por status operacional do pedido (`serviceOperationalStatus`). */
  serviceOperationalStatus?: string
  assignedAdmin?: string
  monitoringLevel?: 'normal' | 'high' | 'critical'
  hasUnread?: boolean
}

export interface AdminAction {
  id: string
  chatId: string
  adminId: string
  adminName: string
  action: 'block' | 'unblock' | 'archive' | 'unarchive' | 'assign' | 'unassign' | 'priority_change' | 'note_add' | 'message_delete'
  details: string
  timestamp: Date
  metadata?: Record<string, any>
}
