package com.aquiresolve.app.utils

import android.content.Context
import android.content.SharedPreferences
import java.util.concurrent.TimeUnit

/**
 * Gerenciador de edição de nomes de usuário
 * 
 * Controla quando o usuário pode editar seu nome (a cada 15 dias)
 */
class UsernameEditManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences("username_edit_prefs", Context.MODE_PRIVATE)
    
    companion object {
        private const val KEY_LAST_EDIT_TIME = "last_username_edit_time"
        private const val KEY_USER_ID = "user_id"
        private const val EDIT_COOLDOWN_DAYS = 15L // 15 dias
    }
    
    /**
     * Verifica se o usuário pode editar seu nome de usuário
     * 
     * @param userId ID do usuário
     * @return true se pode editar, false caso contrário
     */
    fun canEditUsername(userId: String): Boolean {
        val lastEditTime = prefs.getLong(KEY_LAST_EDIT_TIME, 0L)
        val savedUserId = prefs.getString(KEY_USER_ID, "")
        
        // Se é um usuário diferente, permitir edição
        if (savedUserId != userId) {
            return true
        }
        
        // Se nunca editou, permitir
        if (lastEditTime == 0L) {
            return true
        }
        
        // Calcular se já passaram 15 dias
        val currentTime = System.currentTimeMillis()
        val timeDiff = currentTime - lastEditTime
        val daysDiff = TimeUnit.MILLISECONDS.toDays(timeDiff)
        
        return daysDiff >= EDIT_COOLDOWN_DAYS
    }
    
    /**
     * Registra que o usuário editou seu nome
     * 
     * @param userId ID do usuário
     */
    fun recordUsernameEdit(userId: String) {
        prefs.edit().apply {
            putLong(KEY_LAST_EDIT_TIME, System.currentTimeMillis())
            putString(KEY_USER_ID, userId)
        }.apply()
    }
    
    /**
     * Obtém o tempo restante até a próxima edição permitida
     * 
     * @param userId ID do usuário
     * @return Tempo restante em dias, ou 0 se pode editar agora
     */
    fun getRemainingDays(userId: String): Long {
        if (canEditUsername(userId)) {
            return 0L
        }
        
        val lastEditTime = prefs.getLong(KEY_LAST_EDIT_TIME, 0L)
        val currentTime = System.currentTimeMillis()
        val timeDiff = currentTime - lastEditTime
        val daysDiff = TimeUnit.MILLISECONDS.toDays(timeDiff)
        
        return EDIT_COOLDOWN_DAYS - daysDiff
    }
    
    /**
     * Obtém a data da última edição
     * 
     * @return Data da última edição em milissegundos, ou 0 se nunca editou
     */
    fun getLastEditTime(): Long {
        return prefs.getLong(KEY_LAST_EDIT_TIME, 0L)
    }
    
    /**
     * Reseta o histórico de edição (útil para testes)
     */
    fun resetEditHistory() {
        prefs.edit().clear().apply()
    }
    
    /**
     * Formata o tempo restante em uma mensagem amigável
     * 
     * @param userId ID do usuário
     * @return Mensagem formatada
     */
    fun getFormattedRemainingTime(userId: String): String {
        val remainingDays = getRemainingDays(userId)
        
        return when {
            remainingDays == 0L -> "Pode editar agora"
            remainingDays == 1L -> "Pode editar amanhã"
            remainingDays < 7L -> "Pode editar em $remainingDays dias"
            else -> {
                val weeks = remainingDays / 7
                val days = remainingDays % 7
                when {
                    days == 0L -> "Pode editar em $weeks semanas"
                    else -> "Pode editar em $weeks semanas e $days dias"
                }
            }
        }
    }
}
