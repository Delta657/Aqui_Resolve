package com.aquiresolve.app

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.adapters.CentralChatAdapter
import com.aquiresolve.app.models.CentralChatMessage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Tela do PRESTADOR para a Central AquiResolve (Base ↔ Prestador).
 *
 * Espelha [ClientCentralChatActivity], mas lê/escreve em `provider_chats/{uid}` via
 * `CentralChatRepository(isProvider = true)`. Antes desta tela, a mensagem que o admin
 * mandava ao prestador caía na tela do CLIENTE (`client_chats`), por isso o prestador
 * "recebia na conta de cliente". Agora cada ponta tem sua própria caixa.
 *
 * Reaproveita o layout `activity_client_central_chat` (genérico).
 */
class ProviderCentralChatActivity : AppCompatActivity() {

    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val repository = CentralChatRepository(isProvider = true)
    private lateinit var adapter: CentralChatAdapter

    private lateinit var rvMessages: RecyclerView
    private lateinit var layoutEmpty: View
    private lateinit var progressBar: ProgressBar
    private lateinit var etMessage: EditText
    private lateinit var btnSend: ImageButton
    private lateinit var btnBack: ImageButton

    private var listener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_client_central_chat)

        rvMessages = findViewById(R.id.rvMessages)
        layoutEmpty = findViewById(R.id.layoutEmpty)
        progressBar = findViewById(R.id.progressBar)
        etMessage = findViewById(R.id.etMessage)
        btnSend = findViewById(R.id.btnSend)
        btnBack = findViewById(R.id.btnBack)

        adapter = CentralChatAdapter()
        rvMessages.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        rvMessages.adapter = adapter

        btnBack.setOnClickListener { finish() }
        btnSend.setOnClickListener { sendMessage() }

        observeMessages()
        markRead()
    }

    private fun observeMessages() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            Toast.makeText(this, "Sessão expirada — faça login novamente", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        progressBar.visibility = View.VISIBLE
        listener = repository.observeMessages(
            clientId = uid,
            onUpdate = { msgs -> renderMessages(msgs) },
            onError = { err ->
                progressBar.visibility = View.GONE
                Toast.makeText(this, "Erro: ${err.message}", Toast.LENGTH_SHORT).show()
            }
        )
    }

    private fun renderMessages(messages: List<CentralChatMessage>) {
        progressBar.visibility = View.GONE
        if (messages.isEmpty()) {
            layoutEmpty.visibility = View.VISIBLE
            rvMessages.visibility = View.GONE
        } else {
            layoutEmpty.visibility = View.GONE
            rvMessages.visibility = View.VISIBLE
            adapter.submit(messages)
            rvMessages.scrollToPosition(messages.size - 1)
        }
    }

    private fun sendMessage() {
        val uid = auth.currentUser?.uid ?: return
        val text = etMessage.text.toString().trim()
        if (text.isEmpty()) return

        val senderName = auth.currentUser?.displayName
            ?: auth.currentUser?.email?.substringBefore('@')
            ?: "Prestador"

        btnSend.isEnabled = false
        lifecycleScope.launch {
            val result = repository.sendClientMessage(uid, text, senderName)
            if (result.isSuccess) {
                etMessage.setText("")
            } else {
                Toast.makeText(
                    this@ProviderCentralChatActivity,
                    "❌ Erro ao enviar: ${result.exceptionOrNull()?.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
            btnSend.isEnabled = true
        }
    }

    private fun markRead() {
        val uid = auth.currentUser?.uid ?: return
        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                runCatching { repository.markReadByClient(uid) }
            }
        }
    }

    override fun onDestroy() {
        listener?.remove()
        listener = null
        super.onDestroy()
    }
}
