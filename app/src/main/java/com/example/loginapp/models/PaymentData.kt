package com.example.loginapp.models

/**
 * Dados de pagamento
 */
data class PaymentData(
    val id: String,
    val orderId: String,
    val amount: Double,
    val currency: String = "BRL",
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val createdAt: Long = System.currentTimeMillis(),
    val processedAt: Long? = null,
    val transactionId: String? = null,
    val description: String? = null
)

/**
 * Métodos de pagamento disponíveis
 */
enum class PaymentMethod {
    PIX,
    CREDIT_CARD,
    DEBIT_CARD,
    BANK_TRANSFER
}

/**
 * Status do pagamento
 */
enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED
} 