package com.aquiresolve.app.models

import java.util.Date

/**
 * Modelo para mensagens de chat
 */
data class ChatMessage(
    val id: String,
    val orderId: String,
    val senderId: String,
    val senderName: String,
    val message: String,
    val type: MessageType,
    val timestamp: Date,
    val isRead: Boolean,
    val attachmentUrl: String? = null,
    val attachmentType: AttachmentType? = null
)

/**
 * Enum para tipos de mensagem
 */
enum class MessageType {
    SENT, RECEIVED
}

/**
 * Enum para tipos de anexo
 */
enum class AttachmentType {
    IMAGE, DOCUMENT, LOCATION, AUDIO, VIDEO
} 