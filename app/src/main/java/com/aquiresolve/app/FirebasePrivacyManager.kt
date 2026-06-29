package com.aquiresolve.app

import android.content.Context
import android.util.Log
import com.aquiresolve.app.utils.awaitCurrentUser
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.SetOptions
import com.google.firebase.Timestamp
import com.google.gson.GsonBuilder
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

/**
 * Manager para gerenciar configurações de privacidade no Firebase
 */
class FirebasePrivacyManager(private val context: Context) {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    // Cache curto do doc privacy_settings para evitar uma leitura no Firestore a CADA
    // chamada de isSettingEnabled/getSettingString. O handler de FCM consulta várias
    // chaves por notificação e a tela de notificações lê ~8 chaves ao abrir — sem cache
    // isso virava 8+ leituras do MESMO doc, adicionando latência (e risco offline).
    @Volatile private var cachedDoc: DocumentSnapshot? = null
    @Volatile private var cachedAtMs: Long = 0L
    private val cacheTtlMs = 3000L

    companion object {
        private const val TAG = "FirebasePrivacyManager"
        private const val PRIVACY_COLLECTION = "privacy_settings"
    }

    /**
     * Dados de configuração de privacidade.
     * @PropertyName garante mapeamento correto com chaves snake_case no Firestore.
     */
    data class PrivacySettings(
        @get:PropertyName("userId") val userId: String = "",
        @get:PropertyName("notifications_enabled") val notificationsEnabled: Boolean = true,
        @get:PropertyName("data_sharing_enabled") val dataSharingEnabled: Boolean = true,
        @get:PropertyName("location_enabled") val locationEnabled: Boolean = false,
        @get:PropertyName("public_profile_enabled") val publicProfileEnabled: Boolean = false,
        @get:PropertyName("lastUpdated") val lastUpdated: Timestamp = Timestamp.now()
    )

    private suspend fun settingsDoc(): DocumentSnapshot? {
        val now = System.currentTimeMillis()
        cachedDoc?.let { if (now - cachedAtMs < cacheTtlMs) return it }
        val user = auth.awaitCurrentUser() ?: return null
        val doc = db.collection(PRIVACY_COLLECTION).document(user.uid).get().await()
        cachedDoc = doc
        cachedAtMs = now
        return doc
    }

    private fun invalidateCache() {
        cachedDoc = null
        cachedAtMs = 0L
    }

    /**
     * Aplica a preferência de compartilhamento de dados ao Firebase Analytics.
     * `setAnalyticsCollectionEnabled` é persistido pelo próprio SDK entre sessões,
     * então o toggle passa a ter efeito REAL (antes nada lia esse flag).
     */
    fun applyDataSharingPreference(enabled: Boolean) {
        try {
            FirebaseAnalytics.getInstance(context).setAnalyticsCollectionEnabled(enabled)
            Log.d(TAG, "Analytics collection enabled=$enabled")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao aplicar preferência de Analytics: ${e.message}")
        }
    }

    /**
     * Carrega as configurações de privacidade do usuário
     */
    suspend fun loadPrivacySettings(): Result<PrivacySettings> {
        return try {
            val user = auth.awaitCurrentUser()
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
            val user = auth.awaitCurrentUser()
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
            invalidateCache()

            Log.d(TAG, "Configurações de privacidade salvas")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao salvar configurações: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Atualiza uma configuração específica (usa merge para criar doc se não existir)
     */
    suspend fun updatePrivacySetting(
        settingName: String,
        value: Boolean
    ): Result<Unit> {
        return try {
            val user = auth.awaitCurrentUser()
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }

            val updates = mapOf(
                settingName to value,
                "userId" to user.uid,
                "lastUpdated" to Timestamp.now()
            )

            db.collection(PRIVACY_COLLECTION)
                .document(user.uid)
                .set(updates, SetOptions.merge())
                .await()
            invalidateCache()

            // O toggle de compartilhamento de dados agora controla de fato a coleta do
            // Firebase Analytics (antes nenhum código lia data_sharing_enabled).
            if (settingName == "data_sharing_enabled") {
                applyDataSharingPreference(value)
            }

            Log.d(TAG, "Configuração $settingName atualizada para $value")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao atualizar configuração: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Atualiza uma configuração do tipo String (ex: horários)
     */
    suspend fun updatePrivacySettingString(
        settingName: String,
        value: String
    ): Result<Unit> {
        return try {
            val user = auth.awaitCurrentUser()
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }

            val updates = mapOf(
                settingName to value,
                "userId" to user.uid,
                "lastUpdated" to Timestamp.now()
            )

            db.collection(PRIVACY_COLLECTION)
                .document(user.uid)
                .set(updates, SetOptions.merge())
                .await()
            invalidateCache()

            Log.d(TAG, "Configuração $settingName atualizada para $value")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao atualizar configuração: ${e.message}")
            Result.failure(e)
        }
    }

    private fun isoFormat(date: Date): String =
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US).format(date)

    /**
     * Converte valores do Firestore (Timestamp/GeoPoint/DocumentReference/Blob, além de
     * Map/List aninhados) para tipos serializáveis em JSON.
     */
    private fun sanitizeForJson(value: Any?): Any? = when (value) {
        null -> null
        is Map<*, *> -> value.entries.associate { (k, v) -> k.toString() to sanitizeForJson(v) }
        is List<*> -> value.map { sanitizeForJson(it) }
        is Timestamp -> isoFormat(value.toDate())
        is Date -> isoFormat(value)
        is com.google.firebase.firestore.GeoPoint -> mapOf("lat" to value.latitude, "lng" to value.longitude)
        is com.google.firebase.firestore.DocumentReference -> value.path
        is com.google.firebase.firestore.Blob -> "<binary>"
        is Boolean, is Number, is String -> value
        else -> value.toString()
    }

    /**
     * Exporta os dados do usuário como JSON (portabilidade de dados — LGPD).
     * Retorna o CONTEÚDO JSON; a tela salva em arquivo e compartilha (download real).
     * Antes, isto só gravava um doc em `data_exports` que o usuário nunca conseguia baixar.
     */
    suspend fun exportUserData(): Result<String> {
        return try {
            val user = auth.awaitCurrentUser()
            if (user == null) {
                return Result.failure(Exception("Usuário não autenticado"))
            }

            val userId = user.uid
            val userData = db.collection("users").document(userId).get().await()
            val privacySettings = db.collection(PRIVACY_COLLECTION).document(userId).get().await()
            val orders = db.collection("orders").whereEqualTo("clientId", userId).get().await()

            val export = linkedMapOf(
                "exportDate" to isoFormat(Date()),
                "userId" to userId,
                "email" to (user.email ?: ""),
                "userData" to sanitizeForJson(userData.data),
                "privacySettings" to sanitizeForJson(privacySettings.data),
                "orders" to orders.documents.map { sanitizeForJson(it.data) }
            )

            val json = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(export)
            Log.d(TAG, "Exportação de dados gerada (${json.length} chars, ${orders.size()} pedidos)")
            Result.success(json)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao exportar dados: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Exclui a conta do usuário.
     *
     * Reautentica ANTES de qualquer exclusão (com a senha informada). Isso evita o bug
     * em que `user.delete()` falhava por `requires-recent-login` DEPOIS de todos os dados
     * já terem sido apagados (deixando a conta Auth órfã com os dados perdidos).
     *
     * Só apaga os dados do PRÓPRIO usuário. NÃO apaga pedidos onde ele é apenas
     * `assignedProvider` — esses pertencem ao cliente (apagá-los destruía o histórico
     * de terceiros).
     */
    suspend fun deleteUserAccount(password: String): Result<Unit> {
        return try {
            val user = auth.awaitCurrentUser()
                ?: return Result.failure(IllegalStateException("Usuário não autenticado"))

            val email = user.email
            if (email.isNullOrBlank()) {
                return Result.failure(IllegalStateException("Conta sem e-mail; não é possível confirmar a exclusão."))
            }
            if (password.isBlank()) {
                return Result.failure(IllegalStateException("Informe sua senha para confirmar a exclusão."))
            }

            // Reautenticação obrigatória — se falhar, NADA é apagado.
            try {
                user.reauthenticate(EmailAuthProvider.getCredential(email, password)).await()
            } catch (e: Exception) {
                Log.w(TAG, "Reautenticação falhou: ${e.message}")
                return Result.failure(IllegalStateException("Senha incorreta. A conta não foi excluída."))
            }

            val userId = user.uid

            suspend fun safeDelete(label: String, block: suspend () -> Unit) {
                try { block() } catch (e: Exception) { Log.w(TAG, "Falha ao excluir $label: ${e.message}") }
            }

            // 1. Configurações de privacidade
            safeDelete("privacy_settings") {
                db.collection(PRIVACY_COLLECTION).document(userId).delete().await()
            }
            // 2. Token FCM
            safeDelete("fcm_tokens") {
                db.collection("fcm_tokens").document(userId).delete().await()
            }
            // 3. Perfil de prestador (se existir)
            safeDelete("providers") {
                db.collection("providers").document(userId).delete().await()
            }
            // 4. Pedidos do usuário COMO CLIENTE (não toca em pedidos onde é só prestador atribuído)
            safeDelete("orders(client)") {
                val ordersSnapshot = db.collection("orders")
                    .whereEqualTo("clientId", userId)
                    .get()
                    .await()
                if (ordersSnapshot.documents.isNotEmpty()) {
                    val batch = db.batch()
                    ordersSnapshot.documents.forEach { batch.delete(it.reference) }
                    batch.commit().await()
                }
            }
            // 5. Imagens de perfil
            safeDelete("profile_images") {
                val storage = com.google.firebase.storage.FirebaseStorage.getInstance()
                storage.reference.child("profile_images/$userId").listAll().await()
                    .items.forEach { it.delete().await() }
            }
            // 6. Documentos
            safeDelete("documents") {
                val storage = com.google.firebase.storage.FirebaseStorage.getInstance()
                storage.reference.child("documents/$userId").listAll().await()
                    .items.forEach { it.delete().await() }
            }
            // 7. Doc do usuário (por último entre os dados)
            safeDelete("users") {
                db.collection("users").document(userId).delete().await()
            }

            // 8. Conta do Firebase Auth (já reautenticada — não cai em requires-recent-login)
            user.delete().await()

            Log.d(TAG, "Conta do usuário excluída com sucesso")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao excluir conta: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Verifica se uma configuração está habilitada.
     * Usa o cache curto do doc privacy_settings (settingsDoc) para não ler o Firestore
     * a cada chave consultada.
     */
    suspend fun isSettingEnabled(settingName: String): Boolean {
        return try {
            val doc = settingsDoc() ?: return getDefaultForSetting(settingName)
            if (doc.exists()) {
                when (val value = doc.get(settingName)) {
                    is Boolean -> value
                    else -> getDefaultForSetting(settingName)
                }
            } else {
                getDefaultForSetting(settingName)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar configuração: ${e.message}")
            getDefaultForSetting(settingName)
        }
    }

    /**
     * Obtém valor String de uma configuração (ex: quiet_hours_start)
     */
    suspend fun getSettingString(settingName: String, default: String = ""): String {
        return try {
            val doc = settingsDoc() ?: return default
            doc.getString(settingName) ?: default
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao obter configuração: ${e.message}")
            default
        }
    }

    private fun getDefaultForSetting(settingName: String): Boolean {
        return when (settingName) {
            "notifications_enabled", "notification_sound_enabled", "notification_vibration_enabled",
            "order_notifications_enabled", "chat_notifications_enabled", "payment_notifications_enabled",
            "data_sharing_enabled" -> true
            "quiet_hours_enabled", "location_enabled", "public_profile_enabled" -> false
            else -> false
        }
    }
}
