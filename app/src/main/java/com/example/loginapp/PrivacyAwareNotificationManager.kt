package com.example.loginapp

import android.content.Context
import android.util.Log
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

/**
 * Manager de notificações que respeita as configurações de privacidade
 */
class PrivacyAwareNotificationManager(private val context: Context) {
    
    private val privacyManager = FirebasePrivacyManager(context)
    private val scope = CoroutineScope(Dispatchers.Main)
    
    companion object {
        private const val TAG = "PrivacyNotificationManager"
    }
    
    /**
     * Verifica se as notificações estão habilitadas antes de enviar
     */
    suspend fun canSendNotification(): Boolean {
        return try {
            privacyManager.isSettingEnabled("notifications_enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar permissão de notificação: ${e.message}")
            false
        }
    }
    
    /**
     * Envia notificação apenas se permitido pelas configurações de privacidade
     */
    suspend fun sendNotificationIfAllowed(
        title: String,
        message: String,
        notificationType: String = "general"
    ): Boolean {
        return try {
            if (canSendNotification()) {
                // Aqui você implementaria o envio real da notificação
                Log.d(TAG, "Notificação enviada: $title - $message")
                true
            } else {
                Log.d(TAG, "Notificação bloqueada pelas configurações de privacidade")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar notificação: ${e.message}")
            false
        }
    }
    
    /**
     * Envia notificação de forma assíncrona
     */
    fun sendNotificationAsync(
        title: String,
        message: String,
        notificationType: String = "general"
    ) {
        scope.launch {
            sendNotificationIfAllowed(title, message, notificationType)
        }
    }
    
    /**
     * Verifica se o compartilhamento de dados está habilitado
     */
    suspend fun isDataSharingEnabled(): Boolean {
        return try {
            privacyManager.isSettingEnabled("data_sharing_enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar compartilhamento de dados: ${e.message}")
            false
        }
    }
    
    /**
     * Verifica se a localização está habilitada
     */
    suspend fun isLocationEnabled(): Boolean {
        return try {
            privacyManager.isSettingEnabled("location_enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar localização: ${e.message}")
            false
        }
    }
    
    /**
     * Verifica se o perfil público está habilitado
     */
    suspend fun isPublicProfileEnabled(): Boolean {
        return try {
            privacyManager.isSettingEnabled("public_profile_enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar perfil público: ${e.message}")
            false
        }
    }
}

