package com.aquiresolve.app.models

import com.google.firebase.Timestamp

/**
 * Mensagem do chat Base ↔ Cliente (Central AquiResolve).
 *
 * Coleção: `client_chats/{clientId}/messages/{messageId}`.
 * Tipos: 'text', 'promotion', 'notice', 'order_update'.
 */
data class CentralChatMessage(
    val id: String = "",
    val text: String = "",
    val senderType: String = "client", // 'admin' | 'client'
    val senderId: String = "",
    val senderName: String = "",
    val type: String = "text",
    val relatedOrderId: String? = null,
    val broadcastId: String? = null,
    val readByClient: Boolean = false,
    val readByAdmin: Boolean = false,
    val createdAt: Timestamp? = null
) {
    val isFromAdmin: Boolean get() = senderType == "admin"

    companion object {
        const val TYPE_TEXT = "text"
        const val TYPE_PROMOTION = "promotion"
        const val TYPE_NOTICE = "notice"
        const val TYPE_ORDER_UPDATE = "order_update"
    }
}
