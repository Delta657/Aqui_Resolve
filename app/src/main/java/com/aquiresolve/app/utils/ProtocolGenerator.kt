package com.aquiresolve.app.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * Gerador de protocolos únicos para pedidos
 */
object ProtocolGenerator {
    
    private val dateFormatter = SimpleDateFormat("yyyyMMdd", Locale("pt", "BR"))
    private val timeFormatter = SimpleDateFormat("HHmmss", Locale("pt", "BR"))
    
    /**
     * Gera um protocolo único para um pedido
     * Formato: AR-YYYYMMDD-HHMMSS-XXXX
     * Onde:
     * - AR = Aqui Resolve (prefixo do app)
     * - YYYYMMDD = Data de criação
     * - HHMMSS = Hora de criação
     * - XXXX = Número sequencial do dia (4 dígitos)
     */
    fun generateProtocol(): String {
        val now = Date()
        val dateStr = dateFormatter.format(now)
        val timeStr = timeFormatter.format(now)
        
        // Gerar número sequencial baseado no timestamp
        val sequence = (System.currentTimeMillis() % 10000).toString().padStart(4, '0')
        
        return "AR-$dateStr-$timeStr-$sequence"
    }
    
    /**
     * Gera um protocolo com prefixo personalizado
     */
    fun generateProtocol(prefix: String): String {
        val now = Date()
        val dateStr = dateFormatter.format(now)
        val timeStr = timeFormatter.format(now)
        
        // Gerar número sequencial baseado no timestamp
        val sequence = (System.currentTimeMillis() % 10000).toString().padStart(4, '0')
        
        return "$prefix-$dateStr-$timeStr-$sequence"
    }
    
    /**
     * Valida se um protocolo está no formato correto
     */
    fun isValidProtocol(protocol: String): Boolean {
        val pattern = Regex("^[A-Z]{2,4}-\\d{8}-\\d{6}-\\d{4}$")
        return pattern.matches(protocol)
    }
    
    /**
     * Extrai a data de um protocolo
     */
    fun extractDateFromProtocol(protocol: String): Date? {
        return try {
            if (!isValidProtocol(protocol)) return null
            
            val parts = protocol.split("-")
            if (parts.size >= 2) {
                val dateStr = parts[1] // YYYYMMDD
                val dateFormatter = SimpleDateFormat("yyyyMMdd", Locale("pt", "BR"))
                dateFormatter.parse(dateStr)
            } else null
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Formata um protocolo para exibição
     * Ex: AR-20241201-143022-1234 -> AR-2024.12.01-14:30:22-1234
     */
    fun formatProtocolForDisplay(protocol: String): String {
        return try {
            if (!isValidProtocol(protocol)) return protocol
            
            val parts = protocol.split("-")
            if (parts.size >= 4) {
                val prefix = parts[0]
                val dateStr = parts[1] // YYYYMMDD
                val timeStr = parts[2] // HHMMSS
                val sequence = parts[3]
                
                // Formatar data: YYYYMMDD -> YYYY.MM.DD
                val formattedDate = "${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}"
                
                // Formatar hora: HHMMSS -> HH:MM:SS
                val formattedTime = "${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:${timeStr.substring(4, 6)}"
                
                "$prefix-$formattedDate-$formattedTime-$sequence"
            } else protocol
        } catch (e: Exception) {
            protocol
        }
    }
    
    /**
     * Gera um protocolo curto para exibição em listas
     * Ex: AR-20241201-143022-1234 -> AR-1234
     */
    fun getShortProtocol(protocol: String): String {
        return try {
            if (!isValidProtocol(protocol)) return protocol
            
            val parts = protocol.split("-")
            if (parts.size >= 4) {
                val prefix = parts[0]
                val sequence = parts[3]
                "$prefix-$sequence"
            } else protocol
        } catch (e: Exception) {
            protocol
        }
    }
}


