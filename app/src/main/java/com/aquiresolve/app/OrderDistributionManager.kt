// TEMPORARIAMENTE COMENTADO PARA PERMITIR BUILD
/*
package com.aquiresolve.app

import android.util.Log
import com.aquiresolve.app.models.OrderData
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.util.*

/**
 * Gerenciador de Distribuição Inteligente de Pedidos
 * 
 * Gerencia:
 * - Distribuição automática de pedidos
 * - Sistema de filas
 * - Priorização por proximidade
 * - Matching inteligente
 * - Fallback para próximos prestadores
 */
object OrderDistributionManager {
    
    // Dados simulados
    private val orderQueues = mutableMapOf<String, OrderQueue>()
    private val providerAvailability = mutableMapOf<String, ProviderAvailability>()
    private val distributionHistory = mutableMapOf<String, DistributionRecord>()
    
    // Configurações
    private const val MAX_QUEUE_SIZE = 10 // Máximo de pedidos na fila por região
    private const val ASSIGNMENT_TIMEOUT_MINUTES = 30L // 30 minutos para aceitar
    private const val MAX_DISTANCE_KM = 50.0 // Máximo 50km de distância
    
    /**
     * Fila de pedidos por região
     */
    data class OrderQueue(
        val regionId: String,
        val orders: MutableList<QueuedOrder> = mutableListOf(),
        val createdAt: Date = Date(),
        val lastUpdated: Date = Date()
    )
    
    /**
     * Pedido na fila
     */
    data class QueuedOrder(
        val orderId: String,
        val orderData: com.aquiresolve.app.models.OrderData,
        val priority: Int, // 1 = mais alta, 10 = mais baixa
        val addedAt: Date = Date(),
        val assignedProviders: MutableList<String> = mutableListOf(), // IDs dos prestadores que receberam
        val status: QueueStatus = QueueStatus.WAITING
    )
    
    /**
     * Disponibilidade do prestador
     */
    data class ProviderAvailability(
        val providerId: String,
        val isOnline: Boolean = true,
        val maxDistance: Double = 25.0, // km
        val maxOrdersPerDay: Int = 5,
        val currentOrders: Int = 0,
        val lastActivity: Date = Date(),
        val rating: Double = 4.0,
        val responseTime: Long = 300000L // 5 minutos em ms
    )
    
    /**
     * Registro de distribuição
     */
    data class DistributionRecord(
        val orderId: String,
        val providerId: String,
        val distributedAt: Date = Date(),
        val acceptedAt: Date? = null,
        val rejectedAt: Date? = null,
        val reason: String? = null,
        val distance: Double = 0.0
    )
    
    /**
     * Status da fila
     */
    enum class QueueStatus {
        WAITING,        // Aguardando distribuição
        ASSIGNED,       // Atribuído a prestador
        ACCEPTED,       // Aceito pelo prestador
        REJECTED,       // Rejeitado pelo prestador
        EXPIRED,        // Expirado
        COMPLETED       // Concluído
    }
    
    /**
     * Resultado de distribuição
     */
    sealed class DistributionResult {
        object Success : DistributionResult()
        data class Error(val message: String) : DistributionResult()
        data class Assigned(val providerId: String, val distance: Double) : DistributionResult()
        data class Queued(val queuePosition: Int) : DistributionResult()
    }
    
    /**
     * Distribui um pedido para prestadores
     */
    suspend fun distributeOrder(order: com.aquiresolve.app.models.OrderData): DistributionResult {
        // delay(1000) // Simular processamento
        
        // Verificar se é serviço simples ou complexo
        return if (order.serviceType == "SIMPLE") {
            distributeSimpleOrder(order)
        } else {
            distributeComplexOrder(order)
        }
    }
    
    /**
     * Distribui pedido simples (atribuição direta)
     */
    private suspend fun distributeSimpleOrder(order: com.aquiresolve.app.models.OrderData): DistributionResult {
        // Encontrar prestadores disponíveis na região
        val availableProviders = findAvailableProviders(order.cep, order.serviceNiche)
        
        if (availableProviders.isEmpty()) {
            // Adicionar à fila se não há prestadores disponíveis
            return addToQueue(order, 1)
        }
        
        // Ordenar por proximidade e rating
        val sortedProviders = availableProviders.sortedWith(
            compareBy<ProviderAvailability> { 
                calculateDistance(order.cep, it.providerId) 
            }.thenByDescending { it.rating }
        )
        
        // Tentar distribuir para o primeiro prestador
        val bestProvider = sortedProviders.first()
        val distance = calculateDistance(order.cep, bestProvider.providerId)
        
        if (distance > bestProvider.maxDistance) {
            // Prestador muito longe, tentar próximo
            val nextProvider = sortedProviders.getOrNull(1)
            return if (nextProvider != null) {
                val nextDistance = calculateDistance(order.cep, nextProvider.providerId)
                if (nextDistance <= nextProvider.maxDistance) {
                    assignToProvider(order, nextProvider.providerId, nextDistance)
                } else {
                    addToQueue(order, 2)
                }
            } else {
                addToQueue(order, 2)
            }
        }
        
        return assignToProvider(order, bestProvider.providerId, distance)
    }
    
    /**
     * Distribui pedido complexo (disponível para múltiplos prestadores)
     */
    private suspend fun distributeComplexOrder(order: com.aquiresolve.app.models.OrderData): DistributionResult {
        // Encontrar todos os prestadores do nicho na região
        val availableProviders = findAvailableProviders(order.cep, order.serviceNiche)
        
        if (availableProviders.isEmpty()) {
            return addToQueue(order, 3)
        }
        
        // Notificar todos os prestadores disponíveis
        val notifiedProviders = mutableListOf<String>()
        
        availableProviders.forEach { provider ->
            val distance = calculateDistance(order.cep, provider.providerId)
            if (distance <= provider.maxDistance) {
                notifyProvider(order, provider.providerId, distance)
                notifiedProviders.add(provider.providerId)
            }
        }
        
        return if (notifiedProviders.isNotEmpty()) {
            DistributionResult.Success
        } else {
            addToQueue(order, 3)
        }
    }
    
    /**
     * Atribui pedido a um prestador específico
     */
    private suspend fun assignToProvider(
        order: com.aquiresolve.app.models.OrderData,
        providerId: String,
        distance: Double
    ): DistributionResult {
        // Criar registro de distribuição
        val record = DistributionRecord(
            orderId = order.id,
            providerId = providerId,
            distance = distance
        )
        distributionHistory[order.id] = record
        
        // TODO: NOTIFICAR PRESTADOR SOBRE NOVO PEDIDO
        notifyProvider(order, providerId, distance)
        
        // Atualizar disponibilidade do prestador
        updateProviderAvailability(providerId, order.id)
        
        return DistributionResult.Assigned(providerId, distance)
    }
    
    /**
     * Adiciona pedido à fila
     */
    private suspend fun addToQueue(
        order: com.aquiresolve.app.models.OrderData,
        priority: Int
    ): DistributionResult {
        val regionId = getRegionId(order.cep)
        val queue = orderQueues.getOrPut(regionId) { OrderQueue(regionId) }
        
        // Verificar se fila está cheia
        if (queue.orders.size >= MAX_QUEUE_SIZE) {
            return DistributionResult.Error("Fila de pedidos cheia para esta região")
        }
        
        val queuedOrder = QueuedOrder(
            orderId = order.id,
            orderData = order,
            priority = priority
        )
        
        queue.orders.add(queuedOrder)
        // queue.lastUpdated = Date() // TODO: Corrigir quando implementar data class mutável
        
        // TODO: NOTIFICAR ADMINISTRADORES SOBRE FILA
        notifyAdminsAboutQueue(regionId, queue.orders.size)
        
        return DistributionResult.Queued(queue.orders.size)
    }
    
    /**
     * Aceita pedido (prestador)
     */
    suspend fun acceptOrder(orderId: String, providerId: String): DistributionResult {
        // delay(500) // Simular processamento
        
        val record = distributionHistory[orderId]
            ?: return DistributionResult.Error("Pedido não encontrado")
        
        if (record.providerId != providerId) {
            return DistributionResult.Error("Pedido não foi atribuído a você")
        }
        
        // Atualizar registro
        val updatedRecord = record.copy(acceptedAt = Date())
        distributionHistory[orderId] = updatedRecord
        
        // Atualizar pedido no sistema
        // TODO: ATUALIZAR STATUS DO PEDIDO NO ORDERMANAGER
        updateOrderStatus(orderId, "ASSIGNED", providerId)
        
        // Remover da fila se estiver lá
        removeFromQueue(orderId)
        
        return DistributionResult.Success
    }
    
    /**
     * Rejeita pedido (prestador)
     */
    suspend fun rejectOrder(
        orderId: String, 
        providerId: String, 
        reason: String? = null
    ): DistributionResult {
        // delay(500) // Simular processamento
        
        val record = distributionHistory[orderId]
            ?: return DistributionResult.Error("Pedido não encontrado")
        
        if (record.providerId != providerId) {
            return DistributionResult.Error("Pedido não foi atribuído a você")
        }
        
        // Atualizar registro
        val updatedRecord = record.copy(
            rejectedAt = Date(),
            reason = reason
        )
        distributionHistory[orderId] = updatedRecord
        
        // Tentar distribuir para próximo prestador
        val order = getOrderById(orderId)
        if (order != null) {
            return redistributeOrder(order, providerId)
        }
        
        return DistributionResult.Success
    }
    
    /**
     * Redistribui pedido após rejeição
     */
    private suspend fun redistributeOrder(
        order: com.aquiresolve.app.models.OrderData,
        rejectedProviderId: String
    ): DistributionResult {
        // Encontrar próximos prestadores disponíveis
        val availableProviders = findAvailableProviders(order.cep, order.serviceNiche)
            .filter { it.providerId != rejectedProviderId }
        
        if (availableProviders.isEmpty()) {
            // Adicionar à fila se não há mais prestadores
            return addToQueue(order, 5)
        }
        
        // Ordenar por proximidade
        val sortedProviders = availableProviders.sortedBy { 
            calculateDistance(order.cep, it.providerId) 
        }
        
        // Tentar próximo prestador
        val nextProvider = sortedProviders.first()
        val distance = calculateDistance(order.cep, nextProvider.providerId)
        
        return assignToProvider(order, nextProvider.providerId, distance)
    }
    
    /**
     * Encontra prestadores disponíveis
     */
    private suspend fun findAvailableProviders(cep: String, serviceNiche: String): List<ProviderAvailability> {
        // delay(300) // Simular busca
        
        // TODO: BUSCAR PRESTADORES NO BANCO DE DADOS
        // Por enquanto, usar dados simulados
        return providerAvailability.values.filter { provider ->
            provider.isOnline &&
            provider.currentOrders < provider.maxOrdersPerDay &&
            isProviderInRegion(provider.providerId, cep) &&
            providerHasService(provider.providerId, serviceNiche)
        }
    }
    
    /**
     * Calcula distância entre CEPs (simulado)
     */
    private fun calculateDistance(cep1: String, providerId: String): Double {
        // TODO: IMPLEMENTAR CÁLCULO REAL DE DISTÂNCIA
        // Por enquanto, simular baseado nos CEPs
        val cep1Num = cep1.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 0
        val providerCep = getProviderCep(providerId)
        val cep2Num = providerCep.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 0
        
        val difference = kotlin.math.abs(cep1Num - cep2Num)
        return (difference / 1000.0) * 10 // Simular 10km por 1000 de diferença
    }
    
    /**
     * Obtém ID da região baseado no CEP
     */
    private fun getRegionId(cep: String): String {
        // TODO: IMPLEMENTAR LÓGICA REAL DE REGIÕES
        return cep.substring(0, 3) // Primeiros 3 dígitos
    }
    
    /**
     * Verifica se prestador está na região
     */
    private fun isProviderInRegion(providerId: String, cep: String): Boolean {
        // TODO: IMPLEMENTAR VERIFICAÇÃO REAL
        val providerCep = getProviderCep(providerId)
        return providerCep.startsWith(cep.substring(0, 3))
    }
    
    /**
     * Verifica se prestador oferece o serviço
     */
    private fun providerHasService(providerId: String, serviceNiche: String): Boolean {
        // TODO: IMPLEMENTAR VERIFICAÇÃO REAL
        return true // Simulado
    }
    
    /**
     * Obtém CEP do prestador
     */
    private fun getProviderCep(providerId: String): String {
        // TODO: BUSCAR NO BANCO DE DADOS
        return "01234-567" // Simulado
    }
    
    /**
     * Obtém pedido por ID
     */
    private fun getOrderById(orderId: String): com.aquiresolve.app.models.OrderData? {
        // TODO: BUSCAR NO ORDERMANAGER
        return null // Simulado
    }
    
    /**
     * Remove pedido da fila
     */
    private fun removeFromQueue(orderId: String) {
        orderQueues.values.forEach { queue ->
            queue.orders.removeAll { it.orderId == orderId }
        }
    }
    
    /**
     * Atualiza disponibilidade do prestador
     */
    private fun updateProviderAvailability(providerId: String, orderId: String) {
        providerAvailability[providerId]?.let { availability ->
            val updated = availability.copy(
                currentOrders = availability.currentOrders + 1,
                lastActivity = Date()
            )
            providerAvailability[providerId] = updated
        }
    }
    
    /**
     * Atualiza status do pedido
     */
    private suspend fun updateOrderStatus(orderId: String, status: String, providerId: String) {
        // TODO: ATUALIZAR NO ORDERMANAGER
        println("Atualizando pedido $orderId para status $status com prestador $providerId")
    }
    
    /**
     * Notifica prestador sobre novo pedido
     */
    private suspend fun notifyProvider(
        order: com.aquiresolve.app.models.OrderData,
        providerId: String,
        distance: Double
    ) {
        // TODO: ENVIAR NOTIFICAÇÃO PUSH/EMAIL
        println("Notificando prestador $providerId sobre pedido ${order.id} a ${distance}km")
    }
    
    /**
     * Notifica administradores sobre fila
     */
    private fun notifyAdminsAboutQueue(regionId: String, queueSize: Int) {
        // TODO: ENVIAR NOTIFICAÇÃO PARA ADMINS
        println("Fila na região $regionId com $queueSize pedidos")
    }
    
    /**
     * Obtém estatísticas de distribuição
     */
    suspend fun getDistributionStats(): DistributionStats {
        // delay(300) // Simular delay
        
        val totalDistributed = distributionHistory.size
        val accepted = distributionHistory.values.count { it.acceptedAt != null }
        val rejected = distributionHistory.values.count { it.rejectedAt != null }
        val pending = totalDistributed - accepted - rejected
        
        val totalQueued = orderQueues.values.sumOf { it.orders.size }
        
        return DistributionStats(
            totalDistributed = totalDistributed,
            accepted = accepted,
            rejected = rejected,
            pending = pending,
            totalQueued = totalQueued,
            averageResponseTime = calculateAverageResponseTime()
        )
    }
    
    /**
     * Estatísticas de distribuição
     */
    data class DistributionStats(
        val totalDistributed: Int,
        val accepted: Int,
        val rejected: Int,
        val pending: Int,
        val totalQueued: Int,
        val averageResponseTime: Long
    )
    
    /**
     * Calcula tempo médio de resposta
     */
    private fun calculateAverageResponseTime(): Long {
        val acceptedRecords = distributionHistory.values.filter { it.acceptedAt != null }
        if (acceptedRecords.isEmpty()) return 0L
        
        val totalTime = acceptedRecords.sumOf { record ->
            record.acceptedAt!!.time - record.distributedAt.time
        }
        
        return totalTime / acceptedRecords.size
    }
    
    /**
     * Adiciona prestador à disponibilidade (para testes)
     */
    fun addProviderAvailability(providerId: String, availability: ProviderAvailability) {
        providerAvailability[providerId] = availability
    }
    
    /**
     * Remove prestador da disponibilidade
     */
    fun removeProviderAvailability(providerId: String) {
        providerAvailability.remove(providerId)
    }
    
    /**
     * Limpa dados de distribuição (para testes)
     */
    fun clearDistributionData() {
        orderQueues.clear()
        distributionHistory.clear()
    }
}
*/