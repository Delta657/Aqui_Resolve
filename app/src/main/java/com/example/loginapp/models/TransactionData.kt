package com.example.loginapp.models

/**
 * Dados de transação
 */
data class TransactionData(
    val id: String,
    val paymentId: String,
    val amount: Double,
    val currency: String = "BRL",
    val type: TransactionType,
    val status: TransactionStatus,
    val description: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val processedAt: Long? = null,
    val gatewayResponse: String? = null
)

/**
 * Tipos de transação
 */
enum class TransactionType {
    PAYMENT,
    REFUND,
    WITHDRAWAL,
    FEE
}

/**
 * Status da transação
 */
enum class TransactionStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED
} 