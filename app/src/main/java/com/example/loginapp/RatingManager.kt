package com.example.loginapp

import kotlinx.coroutines.delay
import java.util.*

/**
 * Gerenciador de avaliações - Simula operações de banco de dados
 * 
 * Gerencia:
 * - Submissão de avaliações
 * - Cálculo de ratings médios
 * - Histórico de avaliações
 * - Estatísticas de prestadores
 */
object RatingManager {
    
    // Dados simulados
    private val mockRatings = mutableMapOf<String, RatingData>()
    private val mockProviderStats = mutableMapOf<String, ProviderStats>()
    
    /**
     * Dados de uma avaliação
     */
    data class RatingData(
        val id: String,
        val orderId: String,
        val providerId: String,
        val clientId: String,
        val clientName: String,
        val overallRating: Int,
        val qualityRating: Int,
        val punctualityRating: Int,
        val communicationRating: Int,
        val cleanlinessRating: Int,
        val comment: String?,
        val createdAt: Date = Date()
    )
    
    /**
     * Estatísticas de um prestador
     */
    data class ProviderStats(
        val providerId: String,
        val totalRatings: Int,
        val averageOverallRating: Double,
        val averageQualityRating: Double,
        val averagePunctualityRating: Double,
        val averageCommunicationRating: Double,
        val averageCleanlinessRating: Double,
        val totalComments: Int,
        val lastUpdated: Date = Date()
    )
    
    /**
     * Resultado de operação de avaliação
     */
    sealed class RatingResult {
        object Success : RatingResult()
        data class Error(val message: String) : RatingResult()
    }
    
    /**
     * Submete uma nova avaliação
     */
    suspend fun submitRating(
        orderId: String,
        providerId: String,
        overallRating: Int,
        qualityRating: Int = 0,
        punctualityRating: Int = 0,
        communicationRating: Int = 0,
        cleanlinessRating: Int = 0,
        comment: String? = null
    ): RatingResult {
        delay(1000) // Simular delay de rede
        
        val currentUser = LocalAuthManager.currentUser
        if (currentUser == null) {
            return RatingResult.Error("Usuário não autenticado")
        }
        
        // Validar rating
        if (overallRating < 1 || overallRating > 5) {
            return RatingResult.Error("Avaliação deve ser entre 1 e 5")
        }
        
        // Verificar se já existe avaliação para este pedido
        if (mockRatings.values.any { it.orderId == orderId }) {
            return RatingResult.Error("Este pedido já foi avaliado")
        }
        
        // Criar avaliação
        val rating = RatingData(
            id = "rating_${System.currentTimeMillis()}",
            orderId = orderId,
            providerId = providerId,
            clientId = currentUser.id,
            clientName = currentUser.fullName,
            overallRating = overallRating,
            qualityRating = qualityRating,
            punctualityRating = punctualityRating,
            communicationRating = communicationRating,
            cleanlinessRating = cleanlinessRating,
            comment = comment
        )
        
        // Salvar avaliação
        mockRatings[rating.id] = rating
        
        // Atualizar estatísticas do prestador
        updateProviderStats(providerId)
        
        return RatingResult.Success
    }
    
    /**
     * Obtém avaliações de um prestador
     */
    suspend fun getProviderRatings(providerId: String): List<RatingData> {
        delay(500) // Simular delay de rede
        
        return mockRatings.values
            .filter { it.providerId == providerId }
            .sortedByDescending { it.createdAt }
    }
    
    /**
     * Obtém estatísticas de um prestador
     */
    suspend fun getProviderStats(providerId: String): ProviderStats? {
        delay(300) // Simular delay de rede
        
        return mockProviderStats[providerId]
    }
    
    /**
     * Obtém avaliação de um pedido específico
     */
    suspend fun getOrderRating(orderId: String): RatingData? {
        delay(200) // Simular delay de rede
        
        return mockRatings.values.find { it.orderId == orderId }
    }
    
    /**
     * Atualiza as estatísticas de um prestador
     */
    private fun updateProviderStats(providerId: String) {
        val providerRatings = mockRatings.values.filter { it.providerId == providerId }
        
        if (providerRatings.isNotEmpty()) {
            val stats = ProviderStats(
                providerId = providerId,
                totalRatings = providerRatings.size,
                averageOverallRating = providerRatings.map { it.overallRating }.average(),
                averageQualityRating = providerRatings.map { it.qualityRating }.average(),
                averagePunctualityRating = providerRatings.map { it.punctualityRating }.average(),
                averageCommunicationRating = providerRatings.map { it.communicationRating }.average(),
                averageCleanlinessRating = providerRatings.map { it.cleanlinessRating }.average(),
                totalComments = providerRatings.count { !it.comment.isNullOrEmpty() }
            )
            
            mockProviderStats[providerId] = stats
        }
    }
    
    /**
     * Obtém avaliações recentes (últimas 10)
     */
    suspend fun getRecentRatings(): List<RatingData> {
        delay(300) // Simular delay de rede
        
        return mockRatings.values
            .sortedByDescending { it.createdAt }
            .take(10)
    }
    
    /**
     * Obtém avaliações com comentários
     */
    suspend fun getRatingsWithComments(providerId: String): List<RatingData> {
        delay(400) // Simular delay de rede
        
        return mockRatings.values
            .filter { 
                it.providerId == providerId && 
                !it.comment.isNullOrEmpty() 
            }
            .sortedByDescending { it.createdAt }
    }
    
    /**
     * Calcula rating médio de um prestador
     */
    suspend fun calculateAverageRating(providerId: String): Double {
        delay(200) // Simular delay de rede
        
        val ratings = mockRatings.values.filter { it.providerId == providerId }
        return if (ratings.isNotEmpty()) {
            ratings.map { it.overallRating }.average()
        } else {
            0.0
        }
    }
    
    /**
     * Obtém total de avaliações de um prestador
     */
    suspend fun getTotalRatings(providerId: String): Int {
        delay(100) // Simular delay de rede
        
        return mockRatings.values.count { it.providerId == providerId }
    }
    
    /**
     * Adiciona algumas avaliações de exemplo para demonstração
     */
    fun addSampleRatings() {
        val sampleRatings = listOf(
            RatingData(
                id = "sample_1",
                orderId = "order_123",
                providerId = "provider_1",
                clientId = "client_1",
                clientName = "Maria Silva",
                overallRating = 5,
                qualityRating = 5,
                punctualityRating = 5,
                communicationRating = 4,
                cleanlinessRating = 5,
                comment = "Excelente serviço! Muito profissional e pontual."
            ),
            RatingData(
                id = "sample_2",
                orderId = "order_124",
                providerId = "provider_1",
                clientId = "client_2",
                clientName = "João Santos",
                overallRating = 4,
                qualityRating = 4,
                punctualityRating = 5,
                communicationRating = 4,
                cleanlinessRating = 4,
                comment = "Bom trabalho, chegou no horário e resolveu o problema."
            ),
            RatingData(
                id = "sample_3",
                orderId = "order_125",
                providerId = "provider_1",
                clientId = "client_3",
                clientName = "Ana Costa",
                overallRating = 5,
                qualityRating = 5,
                punctualityRating = 4,
                communicationRating = 5,
                cleanlinessRating = 5,
                comment = "Super recomendo! Muito atencioso e competente."
            )
        )
        
        sampleRatings.forEach { rating ->
            mockRatings[rating.id] = rating
        }
        
        // Atualizar estatísticas
        updateProviderStats("provider_1")
    }
} 