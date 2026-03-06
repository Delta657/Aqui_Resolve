package com.aquiresolve.app.models

import com.google.firebase.Timestamp

/**
 * Modelo de dados para categorias de serviços
 */
data class ServiceCategory(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "",
    val color: String = "",
    val isActive: Boolean = true,
    val order: Int = 0,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)

/**
 * Modelo de dados para tipos de serviços
 */
data class ServiceType(
    val id: String = "",
    val categoryId: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "",
    val isComplex: Boolean = false, // Se requer cotações
    val estimatedPrice: Double = 0.0,
    val estimatedTime: String = "",
    val isActive: Boolean = true,
    val order: Int = 0,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)

/**
 * Modelo de dados para prestadores de serviços
 */
data class ServiceProvider(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val avatar: String = "",
    val rating: Double = 0.0,
    val totalReviews: Int = 0,
    val completedOrders: Int = 0,
    val categories: List<String> = emptyList(), // IDs das categorias que atende
    val serviceTypes: List<String> = emptyList(), // IDs dos tipos de serviço que oferece
    val isAvailable: Boolean = true,
    val isVerified: Boolean = false,
    val location: String = "",
    val bio: String = "",
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)

/**
 * Modelo de dados para avaliações de prestadores
 */
data class ProviderReview(
    val id: String = "",
    val providerId: String = "",
    val clientId: String = "",
    val clientName: String = "",
    val orderId: String = "",
    val rating: Int = 0,
    val comment: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

/**
 * Modelo de dados para cotações de serviços complexos
 */
data class ServiceQuote(
    val id: String = "",
    val orderId: String = "",
    val providerId: String = "",
    val providerName: String = "",
    val price: Double = 0.0,
    val description: String = "",
    val estimatedTime: String = "",
    val includesMaterial: Boolean = false,
    val warranty: String = "",
    val status: QuoteStatus = QuoteStatus.PENDING,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)



/**
 * Modelo de dados para favoritos do usuário
 */
data class UserFavorite(
    val id: String = "",
    val userId: String = "",
    val type: FavoriteType = FavoriteType.SERVICE,
    val itemId: String = "",
    val itemName: String = "",
    val itemDescription: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

/**
 * Tipo de favorito
 */
enum class FavoriteType {
    SERVICE,    // Tipo de serviço favorito
    PROVIDER    // Prestador favorito
}
