package com.aquiresolve.app

import android.content.Context
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await

class FirebaseNotificationManager(private val context: Context) {
    
    private val firestore: FirebaseFirestore = FirebaseConfig.getFirestore()
    private val messaging: FirebaseMessaging? = FirebaseConfig.getMessaging()
    
    data class NotificationData(
        val id: String = "",
        val userId: String = "",
        val title: String = "",
        val message: String = "",
        val type: String = "", // "order_update", "new_message", "payment", etc.
        val orderId: String? = null,
        val isRead: Boolean = false,
        val timestamp: com.google.firebase.Timestamp = com.google.firebase.Timestamp.now(),
        val data: Map<String, String> = emptyMap()
    )
    
    data class UserToken(
        val userId: String = "",
        val fcmToken: String = "",
        val deviceType: String = "android",
        val lastUpdated: com.google.firebase.Timestamp = com.google.firebase.Timestamp.now()
    )
    
    suspend fun saveUserToken(userId: String): Result<String> {
        return try {
            val token = if (messaging != null) {
                messaging.token.await()
            } else {
                "disabled_token_${System.currentTimeMillis()}"
            }
            
            val userToken = UserToken(
                userId = userId,
                fcmToken = token,
                deviceType = "android",
                lastUpdated = com.google.firebase.Timestamp.now()
            )
            
            val tokenMap = hashMapOf(
                "userId" to userToken.userId,
                "fcmToken" to userToken.fcmToken,
                "deviceType" to userToken.deviceType,
                "lastUpdated" to userToken.lastUpdated
            )
            
            firestore.collection("userTokens").document(userId).set(tokenMap).await()
            Result.success(token)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCurrentToken(): Result<String> {
        return try {
            val token = if (messaging != null) {
                messaging.token.await()
            } else {
                "disabled_token_${System.currentTimeMillis()}"
            }
            Result.success(token)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun saveNotification(notification: NotificationData): Result<String> {
        return try {
            val notificationMap = hashMapOf(
                "userId" to notification.userId,
                "title" to notification.title,
                "message" to notification.message,
                "type" to notification.type,
                "orderId" to notification.orderId,
                "isRead" to notification.isRead,
                "timestamp" to notification.timestamp,
                "data" to notification.data
            )
            
            val docRef = firestore.collection("notifications").add(notificationMap).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getNotificationsForUser(userId: String): Result<List<NotificationData>> {
        return try {
            val query = firestore.collection("notifications")
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
            
            val notifications = query.documents.mapNotNull { doc ->
                doc.toObject(NotificationData::class.java)?.copy(id = doc.id)
            }
            Result.success(notifications)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun markNotificationAsRead(notificationId: String): Result<Unit> {
        return try {
            firestore.collection("notifications").document(notificationId).update("isRead", true).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun markAllNotificationsAsRead(userId: String): Result<Unit> {
        return try {
            val query = firestore.collection("notifications")
                .whereEqualTo("userId", userId)
                .whereEqualTo("isRead", false)
                .get()
                .await()
            
            val batch = firestore.batch()
            for (document in query.documents) {
                batch.update(document.reference, "isRead", true)
            }
            batch.commit().await()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteNotification(notificationId: String): Result<Unit> {
        return try {
            firestore.collection("notifications").document(notificationId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteAllNotificationsForUser(userId: String): Result<Unit> {
        return try {
            val query = firestore.collection("notifications")
                .whereEqualTo("userId", userId)
                .get()
                .await()
            
            val batch = firestore.batch()
            for (document in query.documents) {
                batch.delete(document.reference)
            }
            batch.commit().await()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getUnreadNotificationCount(userId: String): Result<Int> {
        return try {
            val query = firestore.collection("notifications")
                .whereEqualTo("userId", userId)
                .whereEqualTo("isRead", false)
                .get()
                .await()
            
            Result.success(query.size())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createOrderUpdateNotification(
        userId: String,
        orderId: String,
        title: String,
        message: String
    ): Result<String> {
        val notification = NotificationData(
            userId = userId,
            title = title,
            message = message,
            type = "order_update",
            orderId = orderId,
            isRead = false,
            timestamp = com.google.firebase.Timestamp.now()
        )
        
        return saveNotification(notification)
    }
    
    suspend fun createNewMessageNotification(
        userId: String,
        orderId: String,
        senderName: String
    ): Result<String> {
        val notification = NotificationData(
            userId = userId,
            title = "Nova mensagem",
            message = "$senderName enviou uma nova mensagem",
            type = "new_message",
            orderId = orderId,
            isRead = false,
            timestamp = com.google.firebase.Timestamp.now()
        )
        
        return saveNotification(notification)
    }
    
    suspend fun createPaymentNotification(
        userId: String,
        orderId: String,
        amount: Double
    ): Result<String> {
        val notification = NotificationData(
            userId = userId,
            title = "Pagamento processado",
            message = "Pagamento de R$ $amount foi processado com sucesso",
            type = "payment",
            orderId = orderId,
            isRead = false,
            timestamp = com.google.firebase.Timestamp.now()
        )
        
        return saveNotification(notification)
    }
} 