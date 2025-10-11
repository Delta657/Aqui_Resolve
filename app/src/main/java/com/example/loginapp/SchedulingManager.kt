package com.example.loginapp

import kotlinx.coroutines.delay
import java.util.*

/**
 * Gerenciador de Agendamento Inteligente
 * 
 * Gerencia:
 * - Agendamento de serviços
 * - Disponibilidade de prestadores
 * - Confirmação de horários
 * - Lembretes automáticos
 * - Reagendamento
 */
object SchedulingManager {
    
    // Dados simulados
    private val mockSchedules = mutableMapOf<String, ScheduleData>()
    private val mockProviderAvailability = mutableMapOf<String, ProviderAvailability>()
    private val mockReminders = mutableMapOf<String, ReminderData>()
    
    /**
     * Dados de agendamento
     */
    data class ScheduleData(
        val id: String,
        val orderId: String,
        val clientId: String,
        val clientName: String,
        val providerId: String,
        val providerName: String,
        val serviceType: String,
        val serviceNiche: String,
        val scheduledDate: Date,
        val estimatedDuration: Int, // em minutos
        val status: ScheduleStatus,
        val notes: String? = null,
        val confirmedByClient: Boolean = false,
        val confirmedByProvider: Boolean = false,
        val createdAt: Date = Date(),
        val updatedAt: Date = Date()
    )
    
    /**
     * Disponibilidade do prestador
     */
    data class ProviderAvailability(
        val providerId: String,
        val date: Date,
        val timeSlots: List<TimeSlot>,
        val isAvailable: Boolean = true,
        val maxServicesPerDay: Int = 5,
        val currentServices: Int = 0
    )
    
    /**
     * Slot de tempo
     */
    data class TimeSlot(
        val startTime: String, // formato "HH:mm"
        val endTime: String,   // formato "HH:mm"
        val isAvailable: Boolean = true,
        val serviceId: String? = null
    )
    
    /**
     * Lembrete
     */
    data class ReminderData(
        val id: String,
        val scheduleId: String,
        val userId: String,
        val reminderType: ReminderType,
        val scheduledTime: Date,
        val isSent: Boolean = false,
        val createdAt: Date = Date()
    )
    
    /**
     * Status do agendamento
     */
    enum class ScheduleStatus {
        PENDING,        // Aguardando confirmação
        CONFIRMED,      // Confirmado
        IN_PROGRESS,    // Em andamento
        COMPLETED,      // Concluído
        CANCELLED,      // Cancelado
        NO_SHOW,        // Cliente não compareceu
        RESCHEDULED     // Reagendado
    }
    
    /**
     * Tipo de lembrete
     */
    enum class ReminderType {
        SCHEDULE_CONFIRMATION, // Confirmação de agendamento
        DAY_BEFORE,           // 1 dia antes
        HOUR_BEFORE,          // 1 hora antes
        START_TIME,           // Horário de início
        FOLLOW_UP             // Acompanhamento pós-serviço
    }
    
    /**
     * Resultado de operação
     */
    sealed class SchedulingResult {
        object Success : SchedulingResult()
        data class Error(val message: String) : SchedulingResult()
        data class ScheduleCreated(val scheduleId: String) : SchedulingResult()
        data class AvailableSlots(val slots: List<TimeSlot>) : SchedulingResult()
    }
    
    /**
     * Cria um agendamento
     */
    suspend fun createSchedule(
        orderId: String,
        clientId: String,
        clientName: String,
        providerId: String,
        providerName: String,
        serviceType: String,
        serviceNiche: String,
        preferredDate: Date,
        preferredTime: String,
        estimatedDuration: Int,
        notes: String? = null
    ): SchedulingResult {
        delay(1000) // Simular processamento
        
        // Verificar disponibilidade do prestador
        val availability = checkProviderAvailability(providerId, preferredDate, preferredTime, estimatedDuration)
        
        if (!availability) {
            return SchedulingResult.Error("Horário não disponível para o prestador")
        }
        
        // Criar agendamento
        val scheduleId = "schedule_${System.currentTimeMillis()}"
        val schedule = ScheduleData(
            id = scheduleId,
            orderId = orderId,
            clientId = clientId,
            clientName = clientName,
            providerId = providerId,
            providerName = providerName,
            serviceType = serviceType,
            serviceNiche = serviceNiche,
            scheduledDate = preferredDate,
            estimatedDuration = estimatedDuration,
            status = ScheduleStatus.PENDING,
            notes = notes
        )
        
        mockSchedules[scheduleId] = schedule
        
        // Bloquear horário na disponibilidade
        blockTimeSlot(providerId, preferredDate, preferredTime, estimatedDuration, scheduleId)
        
        // Criar lembretes
        createReminders(scheduleId, clientId, providerId, preferredDate)
        
        return SchedulingResult.ScheduleCreated(scheduleId)
    }
    
    /**
     * Confirma agendamento
     */
    suspend fun confirmSchedule(
        scheduleId: String,
        confirmedBy: String // "client" ou "provider"
    ): SchedulingResult {
        delay(500) // Simular processamento
        
        val schedule = mockSchedules[scheduleId]
            ?: return SchedulingResult.Error("Agendamento não encontrado")
        
        val updatedSchedule = when (confirmedBy) {
            "client" -> schedule.copy(
                confirmedByClient = true,
                status = if (schedule.confirmedByProvider) ScheduleStatus.CONFIRMED else ScheduleStatus.PENDING,
                updatedAt = Date()
            )
            "provider" -> schedule.copy(
                confirmedByProvider = true,
                status = if (schedule.confirmedByClient) ScheduleStatus.CONFIRMED else ScheduleStatus.PENDING,
                updatedAt = Date()
            )
            else -> return SchedulingResult.Error("Tipo de confirmação inválido")
        }
        
        mockSchedules[scheduleId] = updatedSchedule
        
        // TODO: NOTIFICAR OUTRA PARTE SOBRE CONFIRMAÇÃO
        notifyConfirmation(scheduleId, confirmedBy)
        
        return SchedulingResult.Success
    }
    
    /**
     * Cancela agendamento
     */
    suspend fun cancelSchedule(
        scheduleId: String,
        reason: String? = null
    ): SchedulingResult {
        delay(500) // Simular processamento
        
        val schedule = mockSchedules[scheduleId]
            ?: return SchedulingResult.Error("Agendamento não encontrado")
        
        val updatedSchedule = schedule.copy(
            status = ScheduleStatus.CANCELLED,
            updatedAt = Date()
        )
        
        mockSchedules[scheduleId] = updatedSchedule
        
        // Liberar horário na disponibilidade
        releaseTimeSlot(schedule.providerId, schedule.scheduledDate, schedule.id)
        
        // TODO: NOTIFICAR AMBAS AS PARTES SOBRE CANCELAMENTO
        notifyCancellation(scheduleId, reason)
        
        return SchedulingResult.Success
    }
    
    /**
     * Reagenda serviço
     */
    suspend fun rescheduleService(
        scheduleId: String,
        newDate: Date,
        newTime: String,
        reason: String? = null
    ): SchedulingResult {
        delay(1000) // Simular processamento
        
        val schedule = mockSchedules[scheduleId]
            ?: return SchedulingResult.Error("Agendamento não encontrado")
        
        // Verificar disponibilidade para nova data/hora
        val availability = checkProviderAvailability(
            schedule.providerId, 
            newDate, 
            newTime, 
            schedule.estimatedDuration
        )
        
        if (!availability) {
            return SchedulingResult.Error("Novo horário não disponível")
        }
        
        // Liberar horário antigo
        releaseTimeSlot(schedule.providerId, schedule.scheduledDate, schedule.id)
        
        // Bloquear novo horário
        blockTimeSlot(schedule.providerId, newDate, newTime, schedule.estimatedDuration, scheduleId)
        
        // Atualizar agendamento
        val updatedSchedule = schedule.copy(
            scheduledDate = newDate,
            status = ScheduleStatus.RESCHEDULED,
            updatedAt = Date()
        )
        
        mockSchedules[scheduleId] = updatedSchedule
        
        // TODO: NOTIFICAR AMBAS AS PARTES SOBRE REAGENDAMENTO
        notifyReschedule(scheduleId, newDate, newTime, reason)
        
        return SchedulingResult.Success
    }
    
    /**
     * Obtém horários disponíveis do prestador
     */
    suspend fun getAvailableSlots(
        providerId: String,
        date: Date,
        serviceDuration: Int
    ): SchedulingResult {
        delay(300) // Simular processamento
        
        val availability = mockProviderAvailability["${providerId}_${date.time}"]
            ?: createDefaultAvailability(providerId, date)
        
        val availableSlots = availability.timeSlots.filter { slot ->
            slot.isAvailable && isSlotLongEnough(slot, serviceDuration)
        }
        
        return SchedulingResult.AvailableSlots(availableSlots)
    }
    
    /**
     * Obtém agendamentos do usuário
     */
    suspend fun getUserSchedules(
        userId: String,
        isProvider: Boolean,
        status: ScheduleStatus? = null
    ): List<ScheduleData> {
        delay(300) // Simular processamento
        
        return mockSchedules.values.filter { schedule ->
            val isUserInvolved = if (isProvider) {
                schedule.providerId == userId
            } else {
                schedule.clientId == userId
            }
            
            isUserInvolved && (status == null || schedule.status == status)
        }.sortedBy { it.scheduledDate }
    }
    
    /**
     * Obtém agendamento por ID
     */
    suspend fun getScheduleById(scheduleId: String): ScheduleData? {
        delay(200) // Simular processamento
        
        return mockSchedules[scheduleId]
    }
    
    /**
     * Verifica disponibilidade do prestador
     */
    private fun checkProviderAvailability(
        providerId: String,
        date: Date,
        time: String,
        duration: Int
    ): Boolean {
        val normalized = normalizeDate(date)
        val availability = mockProviderAvailability["${providerId}_${normalized.time}"]
            ?: return true // Se não há registro, considerar disponível
        
        if (!availability.isAvailable) return false
        if (availability.currentServices >= availability.maxServicesPerDay) return false
        
        val timeSlot = availability.timeSlots.find { slot ->
            slot.startTime <= time && slot.endTime >= addMinutesToTime(time, duration)
        }
        
        return timeSlot?.isAvailable == true
    }
    
    /**
     * Bloqueia slot de tempo
     */
    private fun blockTimeSlot(
        providerId: String,
        date: Date,
        time: String,
        duration: Int,
        serviceId: String
    ) {
        val normalized = normalizeDate(date)
        val key = "${providerId}_${normalized.time}"
        val availability = mockProviderAvailability[key]
            ?: createDefaultAvailability(providerId, normalized)
        
        val updatedTimeSlots = availability.timeSlots.map { slot ->
            if (slot.startTime <= time && slot.endTime >= addMinutesToTime(time, duration)) {
                slot.copy(isAvailable = false, serviceId = serviceId)
            } else {
                slot
            }
        }
        
        val updatedAvailability = availability.copy(
            timeSlots = updatedTimeSlots,
            currentServices = availability.currentServices + 1
        )
        
        mockProviderAvailability[key] = updatedAvailability
    }
    
    /**
     * Libera slot de tempo
     */
    private fun releaseTimeSlot(providerId: String, date: Date, serviceId: String) {
        val normalized = normalizeDate(date)
        val key = "${providerId}_${normalized.time}"
        val availability = mockProviderAvailability[key] ?: return
        
        val updatedTimeSlots = availability.timeSlots.map { slot ->
            if (slot.serviceId == serviceId) {
                slot.copy(isAvailable = true, serviceId = null)
            } else {
                slot
            }
        }
        
        val updatedAvailability = availability.copy(
            timeSlots = updatedTimeSlots,
            currentServices = (availability.currentServices - 1).coerceAtLeast(0)
        )
        
        mockProviderAvailability[key] = updatedAvailability
    }
    
    /**
     * Cria disponibilidade padrão
     */
    private fun createDefaultAvailability(providerId: String, date: Date): ProviderAvailability {
        val normalized = normalizeDate(date)
        val timeSlots = (8..18).map { hour ->
            TimeSlot(
                startTime = String.format("%02d:00", hour),
                endTime = String.format("%02d:00", hour + 1)
            )
        }
        
        return ProviderAvailability(
            providerId = providerId,
            date = normalized,
            timeSlots = timeSlots
        )
    }
    
    /**
     * Verifica se slot é longo o suficiente
     */
    private fun isSlotLongEnough(slot: TimeSlot, requiredDuration: Int): Boolean {
        val startMinutes = timeToMinutes(slot.startTime)
        val endMinutes = timeToMinutes(slot.endTime)
        val slotDuration = endMinutes - startMinutes
        
        return slotDuration >= requiredDuration
    }
    
    /**
     * Adiciona minutos a um horário
     */
    private fun addMinutesToTime(time: String, minutes: Int): String {
        val totalMinutes = timeToMinutes(time) + minutes
        val hours = totalMinutes / 60
        val mins = totalMinutes % 60
        return String.format("%02d:%02d", hours, mins)
    }
    
    /**
     * Converte horário para minutos
     */
    private fun timeToMinutes(time: String): Int {
        val parts = time.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }
    
    private fun normalizeDate(date: Date): Date {
        val cal = Calendar.getInstance()
        cal.time = date
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }
    
    /**
     * Cria lembretes para o agendamento
     */
    private fun createReminders(scheduleId: String, clientId: String, providerId: String, scheduledDate: Date) {
        val reminderTypes = listOf(
            ReminderType.DAY_BEFORE,
            ReminderType.HOUR_BEFORE,
            ReminderType.START_TIME
        )
        
        reminderTypes.forEach { type ->
            val reminderTime = calculateReminderTime(scheduledDate, type)
            val reminder = ReminderData(
                id = "reminder_${System.currentTimeMillis()}",
                scheduleId = scheduleId,
                userId = clientId, // Por padrão, lembrete para cliente
                reminderType = type,
                scheduledTime = reminderTime
            )
            
            mockReminders[reminder.id] = reminder
        }
    }
    
    /**
     * Calcula horário do lembrete
     */
    private fun calculateReminderTime(scheduledDate: Date, type: ReminderType): Date {
        val calendar = Calendar.getInstance()
        calendar.time = scheduledDate
        
        when (type) {
            ReminderType.DAY_BEFORE -> calendar.add(Calendar.DAY_OF_MONTH, -1)
            ReminderType.HOUR_BEFORE -> calendar.add(Calendar.HOUR_OF_DAY, -1)
            ReminderType.START_TIME -> { /* Mesmo horário */ }
            else -> calendar.add(Calendar.HOUR_OF_DAY, -1)
        }
        
        return calendar.time
    }
    
    // TODO: IMPLEMENTAR NOTIFICAÇÕES
    private fun notifyConfirmation(scheduleId: String, confirmedBy: String) {
        println("Agendamento $scheduleId confirmado por $confirmedBy")
    }
    
    private fun notifyCancellation(scheduleId: String, reason: String?) {
        println("Agendamento $scheduleId cancelado: $reason")
    }
    
    private fun notifyReschedule(scheduleId: String, newDate: Date, newTime: String, reason: String?) {
        println("Agendamento $scheduleId reagendado para $newDate $newTime: $reason")
    }
} 