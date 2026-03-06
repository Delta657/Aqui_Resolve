package com.aquiresolve.app

import kotlinx.coroutines.delay
import java.util.*

/**
 * Gerenciador de Histórico de Serviços
 * 
 * Gerencia:
 * - Histórico de serviços para clientes
 * - Histórico de serviços para prestadores
 * - Estatísticas de serviços
 * - Relatórios de performance
 */
object ServiceHistoryManager {
    
    // Dados simulados
    private val mockServiceHistory = mutableMapOf<String, ServiceHistoryEntry>()
    private val mockServiceStats = mutableMapOf<String, ServiceStats>()
    
    /**
     * Entrada no histórico de serviços
     */
    data class ServiceHistoryEntry(
        val id: String,
        val orderId: String,
        val clientId: String,
        val clientName: String,
        val providerId: String,
        val providerName: String,
        val serviceType: String, // "SIMPLE" ou "COMPLEX"
        val serviceNiche: String,
        val description: String,
        val status: ServiceStatus,
        val amount: Double,
        val rating: Int? = null,
        val ratingComment: String? = null,
        val scheduledDate: Date? = null,
        val completedDate: Date? = null,
        val cancelledDate: Date? = null,
        val cancelledReason: String? = null,
        val createdAt: Date = Date(),
        val updatedAt: Date = Date()
    )
    
    /**
     * Status do serviço
     */
    enum class ServiceStatus {
        SCHEDULED,      // Agendado
        IN_PROGRESS,    // Em andamento
        COMPLETED,      // Concluído
        CANCELLED,      // Cancelado
        NO_SHOW,        // Cliente não compareceu
        DISPUTED        // Em disputa
    }
    
    /**
     * Estatísticas de serviços
     */
    data class ServiceStats(
        val userId: String,
        val isProvider: Boolean,
        val totalServices: Int,
        val completedServices: Int,
        val cancelledServices: Int,
        val totalRevenue: Double,
        val averageRating: Double,
        val totalRatings: Int,
        val favoriteNiche: String?,
        val lastServiceDate: Date?,
        val averageServiceTime: Long, // em minutos
        val lastUpdated: Date = Date()
    )
    
    /**
     * Resultado de operação
     */
    sealed class HistoryResult {
        object Success : HistoryResult()
        data class Error(val message: String) : HistoryResult()
        data class HistoryLoaded(val entries: List<ServiceHistoryEntry>) : HistoryResult()
        data class StatsLoaded(val stats: ServiceStats) : HistoryResult()
    }
    
    /**
     * Adiciona entrada ao histórico
     */
    suspend fun addServiceEntry(
        orderId: String,
        clientId: String,
        clientName: String,
        providerId: String,
        providerName: String,
        serviceType: String,
        serviceNiche: String,
        description: String,
        amount: Double,
        scheduledDate: Date? = null
    ): HistoryResult {
        delay(500) // Simular delay
        
        val entry = ServiceHistoryEntry(
            id = "history_${System.currentTimeMillis()}",
            orderId = orderId,
            clientId = clientId,
            clientName = clientName,
            providerId = providerId,
            providerName = providerName,
            serviceType = serviceType,
            serviceNiche = serviceNiche,
            description = description,
            status = ServiceStatus.SCHEDULED,
            amount = amount,
            scheduledDate = scheduledDate
        )
        
        mockServiceHistory[entry.id] = entry
        
        // Atualizar estatísticas
        updateServiceStats(clientId, false)
        updateServiceStats(providerId, true)
        
        return HistoryResult.Success
    }
    
    /**
     * Atualiza status do serviço
     */
    suspend fun updateServiceStatus(
        historyId: String,
        status: ServiceStatus,
        reason: String? = null
    ): HistoryResult {
        delay(300) // Simular delay
        
        val entry = mockServiceHistory[historyId]
            ?: return HistoryResult.Error("Entrada não encontrada")
        
        val updatedEntry = entry.copy(
            status = status,
            updatedAt = Date(),
            cancelledReason = if (status == ServiceStatus.CANCELLED) reason else null,
            completedDate = if (status == ServiceStatus.COMPLETED) Date() else entry.completedDate,
            cancelledDate = if (status == ServiceStatus.CANCELLED) Date() else entry.cancelledDate
        )
        
        mockServiceHistory[historyId] = updatedEntry
        
        // Atualizar estatísticas
        updateServiceStats(entry.clientId, false)
        updateServiceStats(entry.providerId, true)
        
        return HistoryResult.Success
    }
    
    /**
     * Adiciona avaliação ao serviço
     */
    suspend fun addServiceRating(
        historyId: String,
        rating: Int,
        comment: String? = null
    ): HistoryResult {
        delay(300) // Simular delay
        
        val entry = mockServiceHistory[historyId]
            ?: return HistoryResult.Error("Entrada não encontrada")
        
        if (entry.status != ServiceStatus.COMPLETED) {
            return HistoryResult.Error("Serviço deve estar concluído para ser avaliado")
        }
        
        val updatedEntry = entry.copy(
            rating = rating,
            ratingComment = comment,
            updatedAt = Date()
        )
        
        mockServiceHistory[historyId] = updatedEntry
        
        // Atualizar estatísticas
        updateServiceStats(entry.clientId, false)
        updateServiceStats(entry.providerId, true)
        
        return HistoryResult.Success
    }
    
    /**
     * Obtém histórico de serviços do usuário
     */
    suspend fun getUserServiceHistory(
        userId: String,
        isProvider: Boolean,
        status: ServiceStatus? = null,
        limit: Int = 50
    ): HistoryResult {
        delay(500) // Simular delay
        
        val entries = mockServiceHistory.values.filter { entry ->
            val isUserInvolved = if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
            
            isUserInvolved && (status == null || entry.status == status)
        }.sortedByDescending { it.createdAt }
        
        val limitedEntries = entries.take(limit)
        
        return HistoryResult.HistoryLoaded(limitedEntries)
    }
    
    /**
     * Obtém estatísticas de serviços do usuário
     */
    suspend fun getUserServiceStats(userId: String, isProvider: Boolean): HistoryResult {
        delay(300) // Simular delay
        
        val stats = mockServiceStats[userId]
            ?: createDefaultStats(userId, isProvider)
        
        return HistoryResult.StatsLoaded(stats)
    }
    
    /**
     * Busca serviços por termo
     */
    suspend fun searchServices(
        userId: String,
        isProvider: Boolean,
        query: String
    ): HistoryResult {
        delay(400) // Simular delay
        
        val entries = mockServiceHistory.values.filter { entry ->
            val isUserInvolved = if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
            
            isUserInvolved && (
                entry.description.contains(query, ignoreCase = true) ||
                entry.serviceNiche.contains(query, ignoreCase = true) ||
                entry.providerName.contains(query, ignoreCase = true) ||
                entry.clientName.contains(query, ignoreCase = true)
            )
        }.sortedByDescending { it.createdAt }
        
        return HistoryResult.HistoryLoaded(entries)
    }
    
    /**
     * Obtém serviços por nicho
     */
    suspend fun getServicesByNiche(
        userId: String,
        isProvider: Boolean,
        niche: String
    ): HistoryResult {
        delay(300) // Simular delay
        
        val entries = mockServiceHistory.values.filter { entry ->
            val isUserInvolved = if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
            
            isUserInvolved && entry.serviceNiche.equals(niche, ignoreCase = true)
        }.sortedByDescending { it.createdAt }
        
        return HistoryResult.HistoryLoaded(entries)
    }
    
    /**
     * Obtém serviços por período
     */
    suspend fun getServicesByPeriod(
        userId: String,
        isProvider: Boolean,
        startDate: Date,
        endDate: Date
    ): HistoryResult {
        delay(300) // Simular delay
        
        val entries = mockServiceHistory.values.filter { entry ->
            val isUserInvolved = if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
            
            isUserInvolved && entry.createdAt in startDate..endDate
        }.sortedByDescending { it.createdAt }
        
        return HistoryResult.HistoryLoaded(entries)
    }
    
    /**
     * Obtém relatório de performance
     */
    suspend fun getPerformanceReport(
        userId: String,
        isProvider: Boolean,
        period: String = "month" // week, month, year
    ): PerformanceReport {
        delay(500) // Simular delay
        
        val endDate = Date()
        val startDate = when (period) {
            "week" -> Date(endDate.time - 7 * 24 * 60 * 60 * 1000L)
            "month" -> Date(endDate.time - 30 * 24 * 60 * 60 * 1000L)
            "year" -> Date(endDate.time - 365 * 24 * 60 * 60 * 1000L)
            else -> Date(endDate.time - 30 * 24 * 60 * 60 * 1000L)
        }
        
        val entries = mockServiceHistory.values.filter { entry ->
            val isUserInvolved = if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
            
            isUserInvolved && entry.createdAt in startDate..endDate
        }
        
        val completedServices = entries.filter { it.status == ServiceStatus.COMPLETED }
        val cancelledServices = entries.filter { it.status == ServiceStatus.CANCELLED }
        val totalRevenue = completedServices.sumOf { it.amount }
        val averageRating = completedServices.mapNotNull { it.rating }.average()
        
        return PerformanceReport(
            period = period,
            totalServices = entries.size,
            completedServices = completedServices.size,
            cancelledServices = cancelledServices.size,
            completionRate = if (entries.isNotEmpty()) {
                completedServices.size.toDouble() / entries.size
            } else 0.0,
            totalRevenue = totalRevenue,
            averageRating = averageRating,
            averageServiceTime = calculateAverageServiceTime(entries),
            topNiche = getTopNiche(entries),
            startDate = startDate,
            endDate = endDate
        )
    }
    
    /**
     * Relatório de performance
     */
    data class PerformanceReport(
        val period: String,
        val totalServices: Int,
        val completedServices: Int,
        val cancelledServices: Int,
        val completionRate: Double,
        val totalRevenue: Double,
        val averageRating: Double,
        val averageServiceTime: Long,
        val topNiche: String?,
        val startDate: Date,
        val endDate: Date
    )
    
    /**
     * Atualiza estatísticas do usuário
     */
    private fun updateServiceStats(userId: String, isProvider: Boolean) {
        val userEntries = mockServiceHistory.values.filter { entry ->
            if (isProvider) {
                entry.providerId == userId
            } else {
                entry.clientId == userId
            }
        }
        
        val completedServices = userEntries.filter { it.status == ServiceStatus.COMPLETED }
        val cancelledServices = userEntries.filter { it.status == ServiceStatus.CANCELLED }
        val totalRevenue = if (isProvider) {
            completedServices.sumOf { it.amount }
        } else 0.0
        val averageRating = completedServices.mapNotNull { it.rating }.average()
        val favoriteNiche = getTopNiche(userEntries)
        val lastServiceDate = userEntries.maxByOrNull { it.createdAt }?.createdAt
        val averageServiceTime = calculateAverageServiceTime(userEntries)
        
        val stats = ServiceStats(
            userId = userId,
            isProvider = isProvider,
            totalServices = userEntries.size,
            completedServices = completedServices.size,
            cancelledServices = cancelledServices.size,
            totalRevenue = totalRevenue,
            averageRating = averageRating,
            totalRatings = completedServices.count { it.rating != null },
            favoriteNiche = favoriteNiche,
            lastServiceDate = lastServiceDate,
            averageServiceTime = averageServiceTime
        )
        
        mockServiceStats[userId] = stats
    }
    
    /**
     * Cria estatísticas padrão
     */
    private fun createDefaultStats(userId: String, isProvider: Boolean): ServiceStats {
        return ServiceStats(
            userId = userId,
            isProvider = isProvider,
            totalServices = 0,
            completedServices = 0,
            cancelledServices = 0,
            totalRevenue = 0.0,
            averageRating = 0.0,
            totalRatings = 0,
            favoriteNiche = null,
            lastServiceDate = null,
            averageServiceTime = 0L
        )
    }
    
    /**
     * Calcula tempo médio de serviço
     */
    private fun calculateAverageServiceTime(entries: Collection<ServiceHistoryEntry>): Long {
        val completedEntries = entries.filter { 
            it.status == ServiceStatus.COMPLETED && 
            it.scheduledDate != null && 
            it.completedDate != null 
        }
        
        if (completedEntries.isEmpty()) return 0L
        
        val totalTime = completedEntries.sumOf { entry ->
            entry.completedDate!!.time - entry.scheduledDate!!.time
        }
        
        return totalTime / completedEntries.size / (1000 * 60) // Converter para minutos
    }
    
    /**
     * Obtém nicho mais frequente
     */
    private fun getTopNiche(entries: Collection<ServiceHistoryEntry>): String? {
        return entries.groupBy { it.serviceNiche }
            .maxByOrNull { it.value.size }
            ?.key
    }
} 