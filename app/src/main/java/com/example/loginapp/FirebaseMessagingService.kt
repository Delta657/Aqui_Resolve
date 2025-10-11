package com.example.loginapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class FirebaseMessagingService : FirebaseMessagingService() {
    
    companion object {
        private const val CHANNEL_ID = "default_channel"
        private const val CHANNEL_NAME = "Default Channel"
        private const val CHANNEL_DESCRIPTION = "Canal padrão para notificações"
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Enviar token para o servidor
        sendRegistrationToServer(token)
        // Se houver usuário logado, salvar token no Firestore
        try {
            val auth = FirebaseConfig.getAuth()
            val currentUser = auth.currentUser
            if (currentUser != null) {
                val notificationManager = FirebaseNotificationManager(this)
                CoroutineScope(Dispatchers.IO).launch {
                    notificationManager.saveUserToken(currentUser.uid)
                }
            }
        } catch (_: Exception) {
            // ignorar erros silenciosamente
        }
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        // Verificar se a mensagem contém dados
        remoteMessage.data.isNotEmpty().let {
            // Processar dados da mensagem
            val title = remoteMessage.data["title"] ?: "Nova notificação"
            val message = remoteMessage.data["message"] ?: "Você tem uma nova notificação"
            val orderId = remoteMessage.data["orderId"]
            
            // Enviar notificação
            sendNotification(title, message, orderId)
        }
        
        // Verificar se a mensagem contém notificação
        remoteMessage.notification?.let { notification ->
            val title = notification.title ?: "Nova notificação"
            val message = notification.body ?: "Você tem uma nova notificação"
            
            // Enviar notificação
            sendNotification(title, message, null)
        }
    }
    
    private fun sendRegistrationToServer(token: String) {
        // Aqui você pode implementar o envio do token para seu servidor
        // Por enquanto, vamos apenas salvar localmente
        val prefs = getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
    }
    
    private fun sendNotification(title: String, message: String, orderId: String?) {
        val intent = if (orderId != null) {
            // Abrir detalhes do pedido se houver orderId
            Intent(this, OrderDetailsActivity::class.java).apply {
                putExtra("orderId", orderId)
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
        } else {
            // Abrir a tela principal
            Intent(this, HomeActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notifications)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Criar canal de notificação para Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESCRIPTION
            }
            notificationManager.createNotificationChannel(channel)
        }
        
        // Enviar notificação
        notificationManager.notify(0, notificationBuilder.build())
    }
} 