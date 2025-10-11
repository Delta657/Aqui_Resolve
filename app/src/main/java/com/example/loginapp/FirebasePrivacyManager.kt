package com.example.loginapp

import android.content.Context
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import kotlinx.coroutines.tasks.await
import java.util.*

/**
 * Manager para gerenciar configurações de privacidade no Firebase
 */
class FirebasePrivacyManager(private val context: Context) {
    
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    companion object {
        private const val TAG = "FirebasePrivacyManager"
        private const val PRIVACY_COLLECTION = "privacy_settings"
    }
    
    /**
     * Dados de configuração de privacidade
     */
    data class PrivacySettings(
        val userId: String = "",
        val notificationsEnabled: Boolean = true,
        val dataSharingEnabled: Boolean = true,
        val locationEnabled: Boolean = false,
        val publicProfileEnabled: Boolean = false,
        val lastUpdated: Timestamp = Timestamp.now()
    )
    
    /**
     * Carrega as configurações de privacidade do usuário
     */
    suspend fun loadPrivacySettings(): Result<PrivacySettings> {
        return try {
            val user = auth.currentUser
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }
            
            val docRef = db.collection(PRIVACY_COLLECTION).document(user.uid)
            val snapshot = docRef.get().await()
            
            if (snapshot.exists()) {
                val settings = snapshot.toObject(PrivacySettings::class.java)
                if (settings != null) {
                    Log.d(TAG, "Configurações de privacidade carregadas")
                    Result.success(settings)
                } else {
                    Result.failure(Exception("Erro ao converter dados"))
                }
            } else {
                // Criar configurações padrão
                val defaultSettings = PrivacySettings(userId = user.uid)
                savePrivacySettings(defaultSettings)
                Log.d(TAG, "Configurações padrão criadas")
                Result.success(defaultSettings)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao carregar configurações: ${e.message}")
            Result.failure(e)
        }
    }
    
    /**
     * Salva as configurações de privacidade
     */
    suspend fun savePrivacySettings(settings: PrivacySettings): Result<Unit> {
        return try {
            val user = auth.currentUser
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }
            
            val updatedSettings = settings.copy(
                userId = user.uid,
                lastUpdated = Timestamp.now()
            )
            
            db.collection(PRIVACY_COLLECTION)
                .document(user.uid)
                .set(updatedSettings)
                .await()
            
            Log.d(TAG, "Configurações de privacidade salvas")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao salvar configurações: ${e.message}")
            Result.failure(e)
        }
    }
    
    /**
     * Atualiza uma configuração específica
     */
    suspend fun updatePrivacySetting(
        settingName: String,
        value: Boolean
    ): Result<Unit> {
        return try {
            val user = auth.currentUser
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }
            
            val updates = mapOf(
                settingName to value,
                "lastUpdated" to Timestamp.now()
            )
            
            db.collection(PRIVACY_COLLECTION)
                .document(user.uid)
                .update(updates)
                .await()
            
            Log.d(TAG, "Configuração $settingName atualizada para $value")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao atualizar configuração: ${e.message}")
            Result.failure(e)
        }
    }
    
    /**
     * Exporta dados do usuário
     */
    suspend fun exportUserData(): Result<String> {
        return try {
            val user = auth.currentUser
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }
            
            // Buscar dados do usuário
            val userData = db.collection("users").document(user.uid).get().await()
            val privacySettings = db.collection(PRIVACY_COLLECTION).document(user.uid).get().await()
            val orders = db.collection("orders").whereEqualTo("clientId", user.uid).get().await()
            
            // Criar JSON com dados exportados
            val exportData = mapOf(
                "exportDate" to Timestamp.now(),
                "userData" to userData.data,
                "privacySettings" to privacySettings.data,
                "orders" to orders.documents.map { it.data },
                "exportedBy" to "user_request"
            )
            
            // Salvar exportação no Firebase
            val exportId = db.collection("data_exports").document().id
            db.collection("data_exports")
                .document(exportId)
                .set(exportData)
                .await()
            
            Log.d(TAG, "Dados exportados com ID: $exportId")
            Result.success(exportId)
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao exportar dados: ${e.message}")
            Result.failure(e)
        }
    }
    
    /**
     * Exclui conta do usuário
     */
    suspend fun deleteUserAccount(): Result<Unit> {
        return try {
            val user = auth.currentUser
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }
            
            val userId = user.uid
            
            // 1. Excluir dados de privacidade
            db.collection(PRIVACY_COLLECTION).document(userId).delete().await()
            
            // 2. Excluir dados do usuário
            db.collection("users").document(userId).delete().await()
            
            // 3. Excluir pedidos do usuário
            val ordersSnapshot = db.collection("orders")
                .whereEqualTo("clientId", userId)
                .get()
                .await()
            
            val batch = db.batch()
            ordersSnapshot.documents.forEach { doc ->
                batch.delete(doc.reference)
            }
            batch.commit().await()
            
            // 4. Excluir exportações de dados
            val exportsSnapshot = db.collection("data_exports")
                .whereEqualTo("userData.uid", userId)
                .get()
                .await()
            
            val exportBatch = db.batch()
            exportsSnapshot.documents.forEach { doc ->
                exportBatch.delete(doc.reference)
            }
            exportBatch.commit().await()
            
            // 5. Excluir conta do Firebase Auth
            user.delete().await()
            
            Log.d(TAG, "Conta do usuário excluída com sucesso")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao excluir conta: ${e.message}")
            Result.failure(e)
        }
    }
    
    /**
     * Verifica se uma configuração está habilitada
     */
    suspend fun isSettingEnabled(settingName: String): Boolean {
        return try {
            val settings = loadPrivacySettings()
            if (settings.isSuccess) {
                when (settingName) {
                    "notifications_enabled" -> settings.getOrNull()?.notificationsEnabled ?: true
                    "data_sharing_enabled" -> settings.getOrNull()?.dataSharingEnabled ?: true
                    "location_enabled" -> settings.getOrNull()?.locationEnabled ?: false
                    "public_profile_enabled" -> settings.getOrNull()?.publicProfileEnabled ?: false
                    else -> false
                }
            } else {
                // Retornar valor padrão em caso de erro
                when (settingName) {
                    "notifications_enabled", "data_sharing_enabled" -> true
                    "location_enabled", "public_profile_enabled" -> false
                    else -> false
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar configuração: ${e.message}")
            false
        }
    }
}

