package com.aquiresolve.app

import android.util.Log
import com.aquiresolve.app.models.CentralChatMessage
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.tasks.await

/**
 * Acesso ao chat Base ↔ Cliente/Prestador (Central AquiResolve).
 *
 * O mesmo repositório atende as duas pontas conforme [isProvider]:
 *  - cliente  → coleção `client_chats/{uid}`,   senderType='client',   contador `unreadByClient`
 *  - prestador→ coleção `provider_chats/{uid}`,  senderType='provider', contador `unreadByProvider`
 *
 * As regras Firestore permitem em ambos:
 *  - read no doc e na subcoleção `messages` apenas se `isOwner(uid)`
 *  - create de mensagem apenas com o senderType da própria ponta e `senderId == auth.uid`
 *
 * A atualização da metadata (last*, contadores) é responsabilidade do painel
 * via Admin SDK; o app não escreve no doc do chat, só na subcoleção messages.
 */
class CentralChatRepository(private val isProvider: Boolean = false) {

    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()

    private val chatsCollection = if (isProvider) "provider_chats" else "client_chats"
    private val senderType = if (isProvider) "provider" else "client"
    private val unreadField = if (isProvider) "unreadByProvider" else "unreadByClient"
    private val readRole = if (isProvider) "provider" else "client"
    private val readApiPath = if (isProvider) "provider-chats" else "client-chats"

    companion object {
        private const val TAG = "CentralChatRepo"
        private const val MESSAGES_SUBCOLLECTION = "messages"
    }

    private fun chatRef(clientId: String) =
        db.collection(chatsCollection).document(clientId)

    /**
     * Listener em tempo real das mensagens do cliente, em ordem ascendente.
     * Devolve um [ListenerRegistration] que deve ser removido em `onStop`.
     */
    fun observeMessages(
        clientId: String,
        onUpdate: (List<CentralChatMessage>) -> Unit,
        onError: (Throwable) -> Unit = {}
    ): ListenerRegistration {
        return chatRef(clientId)
            .collection(MESSAGES_SUBCOLLECTION)
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Erro no listener de chat central: ${error.message}")
                    onError(error)
                    return@addSnapshotListener
                }
                val msgs = snapshot?.documents?.mapNotNull { doc ->
                    try {
                        CentralChatMessage(
                            id = doc.id,
                            text = doc.getString("text") ?: "",
                            senderType = doc.getString("senderType") ?: senderType,
                            senderId = doc.getString("senderId") ?: "",
                            senderName = doc.getString("senderName") ?: "",
                            type = doc.getString("type") ?: "text",
                            relatedOrderId = doc.getString("relatedOrderId"),
                            broadcastId = doc.getString("broadcastId"),
                            readByClient = doc.getBoolean("readByClient") ?: false,
                            readByAdmin = doc.getBoolean("readByAdmin") ?: false,
                            createdAt = doc.getTimestamp("createdAt")
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Falha ao deserializar mensagem ${doc.id}: ${e.message}")
                        null
                    }
                } ?: emptyList()
                onUpdate(msgs)
            }
    }

    /**
     * Cria uma mensagem da própria ponta (cliente ou prestador). Respeita as regras
     * Firestore: `senderType` da ponta correta e `senderId == auth.uid`.
     */
    suspend fun sendClientMessage(
        clientId: String,
        text: String,
        senderName: String
    ): Result<String> {
        if (auth.currentUser?.uid != clientId) {
            return Result.failure(IllegalStateException("Sessão não autenticada"))
        }
        val trimmed = text.trim()
        if (trimmed.isEmpty()) {
            return Result.failure(IllegalArgumentException("Mensagem vazia"))
        }
        if (trimmed.length > 2000) {
            return Result.failure(IllegalArgumentException("Mensagem acima de 2000 caracteres"))
        }
        return try {
            val msgRef = chatRef(clientId)
                .collection(MESSAGES_SUBCOLLECTION)
                .document()

            // ATENÇÃO: as regras restringem os campos permitidos no create.
            // Use FieldValue.serverTimestamp() pelo Firestore (a regra checa `createdAt`).
            msgRef.set(
                mapOf(
                    "text" to trimmed,
                    "senderType" to senderType,
                    "senderId" to clientId,
                    "senderName" to senderName,
                    "type" to CentralChatMessage.TYPE_TEXT,
                    "readByClient" to true,
                    "readByProvider" to true,
                    "readByAdmin" to false,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()

            Result.success(msgRef.id)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar mensagem do cliente: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Conta unread da ponta — observa o doc do chat (campo `unreadByClient` ou
     * `unreadByProvider`). Devolve [ListenerRegistration] para uso no badge da home.
     */
    fun observeUnreadByClient(
        clientId: String,
        onUpdate: (Int) -> Unit
    ): ListenerRegistration {
        return chatRef(clientId).addSnapshotListener { snap, error ->
            if (error != null) {
                Log.w(TAG, "Listener $unreadField erro: ${error.message}")
                onUpdate(0)
                return@addSnapshotListener
            }
            val count = (snap?.getLong(unreadField) ?: 0L).toInt()
            onUpdate(count)
        }
    }

    /**
     * Marca chat como lido via API route do painel (Admin SDK zera contador).
     * O app pode chamar o endpoint depois de abrir a tela.
     */
    suspend fun markReadByClient(clientId: String) {
        try {
            // Faz fetch direto ao endpoint do painel via OkHttp. O endpoint está
            // configurado em `BuildConfig.PANEL_BASE_URL` (se ausente, no-op).
            val url = BuildConfig.PANEL_BASE_URL.takeIf { it.isNotBlank() }
                ?: return
            val client = okhttp3.OkHttpClient()
            val req = okhttp3.Request.Builder()
                .url("$url/api/$readApiPath/$clientId/read?role=$readRole")
                .patch(okhttp3.RequestBody.create(null, ByteArray(0)))
                .build()
            client.newCall(req).execute().use { /* ignora corpo */ }
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao marcar como lido: ${e.message}")
        }
    }

    /**
     * Marca uma mensagem como lida pelo cliente — versão "best effort" pelo cliente:
     * só atualiza localmente; a contagem oficial em `unreadByClient` cai por chamada
     * de [markReadByClient] (Admin SDK).
     */
    @Suppress("unused")
    suspend fun bumpClientRead(clientId: String) {
        // No-op: o write em `client_chats/{uid}` é bloqueado pelas regras (só Admin SDK).
        // Mantido como ponto de extensão se um dia abrirmos a escrita.
        Timestamp.now()
    }
}
