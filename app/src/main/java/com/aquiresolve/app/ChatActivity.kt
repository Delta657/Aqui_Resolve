package com.aquiresolve.app

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.aquiresolve.app.adapters.ChatAdapter
import com.aquiresolve.app.databinding.ActivityChatBinding
import com.aquiresolve.app.models.ChatMessage
import com.aquiresolve.app.models.MessageType
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

/**
 * ChatActivity - Tela de chat entre cliente e prestador
 * 
 * Funcionalidades:
 * - Chat em tempo real entre cliente e prestador
 * - Envio de mensagens de texto
 * - Anexo de imagens e arquivos
 * - Status online/offline
 * - Histórico de mensagens
 */
class ChatActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityChatBinding
    
    // Variáveis para controle de estado
    private var orderId: String? = null
    private var providerId: String? = null
    private var providerName: String? = null
    private var messages = mutableListOf<ChatMessage>()
    private var isProviderOnline = false
    
    // Adapter da lista
    private lateinit var chatAdapter: ChatAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Obter dados da intent
        orderId = intent.getStringExtra("order_id")
        providerId = intent.getStringExtra("provider_id")
        providerName = intent.getStringExtra("provider_name")
        
        if (orderId == null || providerId == null) {
            showErrorMessage("Dados do chat não encontrados")
            finish()
            return
        }
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        setupRecyclerView()
        setupMessageInput()
        
        // Carregar dados
        loadChatData()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
        
        // Configurar informações do prestador
        binding.tvProviderName.text = providerName ?: "Prestador"
        updateProviderStatus(true) // Simular online
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão mais opções
        binding.btnMore.setOnClickListener {
            showMoreOptionsDialog()
        }
        
        // Botão anexar
        binding.btnAttach.setOnClickListener {
            showAttachOptionsDialog()
        }
        
        // Botão enviar
        binding.btnSend.setOnClickListener {
            sendMessage()
        }
    }

    /**
     * Configura o RecyclerView
     */
    private fun setupRecyclerView() {
        binding.rvMessages.layoutManager = LinearLayoutManager(this).apply {
            stackFromEnd = true // Mensagens começam do final
        }
        
        chatAdapter = ChatAdapter(messages)
        binding.rvMessages.adapter = chatAdapter
    }

    /**
     * Configura o input de mensagem
     */
    private fun setupMessageInput() {
        binding.etMessage.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                updateSendButton(s?.isNotEmpty() == true)
            }
        })
    }

    /**
     * Atualiza o estado do botão enviar
     */
    private fun updateSendButton(enabled: Boolean) {
        binding.btnSend.isEnabled = enabled
        binding.btnSend.alpha = if (enabled) 1.0f else 0.5f
    }

    /**
     * Carrega os dados do chat
     */
    private fun loadChatData() {
        setLoadingState(true)
        
        lifecycleScope.launch {
            try {
                // TODO: Buscar mensagens do ChatManager
                // Por enquanto, vamos simular dados
                simulateChatData()
                
                setLoadingState(false)
                
            } catch (e: Exception) {
                setLoadingState(false)
                showErrorMessage("Erro ao carregar mensagens")
            }
        }
    }

    /**
     * Simula dados do chat para demonstração
     */
    private fun simulateChatData() {
        val currentTime = Date()
        
        messages.addAll(listOf(
            ChatMessage(
                id = "msg_1",
                orderId = orderId ?: "",
                senderId = providerId ?: "",
                senderName = providerName ?: "Prestador",
                message = "Olá! Vi seu pedido de troca de torneira. Posso fazer o serviço hoje mesmo.",
                type = MessageType.RECEIVED,
                timestamp = Date(currentTime.time - 3600000), // 1 hora atrás
                isRead = true
            ),
            ChatMessage(
                id = "msg_2",
                orderId = orderId ?: "",
                senderId = "client_1",
                senderName = "Você",
                message = "Perfeito! Que horas você pode vir?",
                type = MessageType.SENT,
                timestamp = Date(currentTime.time - 3500000), // 58 minutos atrás
                isRead = true
            ),
            ChatMessage(
                id = "msg_3",
                orderId = orderId ?: "",
                senderId = providerId ?: "",
                senderName = providerName ?: "Prestador",
                message = "Posso ir às 14h. Inclui material de qualidade e garantia de 6 meses.",
                type = MessageType.RECEIVED,
                timestamp = Date(currentTime.time - 3400000), // 56 minutos atrás
                isRead = true
            ),
            ChatMessage(
                id = "msg_4",
                orderId = orderId ?: "",
                senderId = "client_1",
                senderName = "Você",
                message = "Ótimo! Vou estar em casa. O endereço está correto no pedido?",
                type = MessageType.SENT,
                timestamp = Date(currentTime.time - 3300000), // 55 minutos atrás
                isRead = false
            )
        ))
        
        chatAdapter.notifyDataSetChanged()
        scrollToBottom()
    }

    /**
     * Envia uma mensagem
     */
    private fun sendMessage() {
        val messageText = binding.etMessage.text.toString().trim()
        
        if (messageText.isEmpty()) {
            return
        }
        
        // Criar nova mensagem
        val newMessage = ChatMessage(
            id = "msg_${System.currentTimeMillis()}",
            orderId = orderId ?: "",
            senderId = "client_1",
            senderName = "Você",
            message = messageText,
            type = MessageType.SENT,
            timestamp = Date(),
            isRead = false
        )
        
        // Adicionar à lista
        messages.add(newMessage)
        chatAdapter.notifyItemInserted(messages.size - 1)
        
        // Limpar campo de texto
        binding.etMessage.text?.clear()
        
        // Rolar para baixo
        scrollToBottom()
        
        // Simular resposta do prestador (apenas para demonstração)
        simulateProviderResponse()
    }

    /**
     * Simula resposta do prestador (apenas para demonstração)
     */
    private fun simulateProviderResponse() {
        lifecycleScope.launch {
            try {
                // Aguardar 2 segundos
                kotlinx.coroutines.delay(2000)
                
                val responses = listOf(
                    "Perfeito! Vou estar lá às 14h.",
                    "Sim, o endereço está correto. Vou levar todo o material necessário.",
                    "Tudo certo! Qualquer dúvida pode me chamar.",
                    "Cheguei no local. Posso subir?",
                    "Serviço concluído! Como ficou o resultado?"
                )
                
                val randomResponse = responses.random()
                
                val responseMessage = ChatMessage(
                    id = "msg_${System.currentTimeMillis()}",
                    orderId = orderId ?: "",
                    senderId = providerId ?: "",
                    senderName = providerName ?: "Prestador",
                    message = randomResponse,
                    type = MessageType.RECEIVED,
                    timestamp = Date(),
                    isRead = false
                )
                
                messages.add(responseMessage)
                chatAdapter.notifyItemInserted(messages.size - 1)
                scrollToBottom()
                
            } catch (e: Exception) {
                // Ignorar erro na simulação
            }
        }
    }

    /**
     * Rola a lista para o final
     */
    private fun scrollToBottom() {
        binding.rvMessages.post {
            binding.rvMessages.smoothScrollToPosition(messages.size)
        }
    }

    /**
     * Atualiza o status do prestador
     */
    private fun updateProviderStatus(online: Boolean) {
        isProviderOnline = online
        
        binding.tvProviderStatus.text = if (online) "Online" else "Offline"
        binding.tvProviderStatus.setTextColor(
            ContextCompat.getColor(
                this,
                if (online) R.color.green_500 else R.color.gray_500
            )
        )
    }

    /**
     * Mostra diálogo de mais opções
     */
    private fun showMoreOptionsDialog() {
        val options = arrayOf("Ver Perfil", "Ligar", "Compartilhar Conversa", "Limpar Chat")
        
        AlertDialog.Builder(this)
            .setTitle("Mais Opções")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> viewProviderProfile()
                    1 -> callProvider()
                    2 -> shareConversation()
                    3 -> clearChat()
                }
            }
            .show()
    }

    /**
     * Mostra diálogo de opções de anexo
     */
    private fun showAttachOptionsDialog() {
        val options = arrayOf("Foto", "Documento", "Localização")
        
        AlertDialog.Builder(this)
            .setTitle("Anexar")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> attachPhoto()
                    1 -> attachDocument()
                    2 -> attachLocation()
                }
            }
            .show()
    }

    /**
     * Ver perfil do prestador
     */
    private fun viewProviderProfile() {
        // TODO: Implementar navegação para perfil
        showToast("👤 Perfil do prestador em desenvolvimento")
    }

    /**
     * Ligar para o prestador
     */
    private fun callProvider() {
        // TODO: Implementar ligação
        showToast("📞 Funcionalidade de ligação em desenvolvimento")
    }

    /**
     * Compartilhar conversa
     */
    private fun shareConversation() {
        // TODO: Implementar compartilhamento
        showToast("📤 Funcionalidade de compartilhamento em desenvolvimento")
    }

    /**
     * Limpar chat
     */
    private fun clearChat() {
        AlertDialog.Builder(this)
            .setTitle("Limpar Chat")
            .setMessage("Tem certeza que deseja limpar todo o histórico de mensagens?")
            .setPositiveButton("Limpar") { _, _ ->
                messages.clear()
                chatAdapter.notifyDataSetChanged()
                showSuccessMessage("Chat limpo com sucesso")
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Anexar foto
     */
    private fun attachPhoto() {
        // TODO: INTEGRAR COM IMAGEMANAGER
        // Implementar seleção e upload de foto
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        
        try {
            startActivityForResult(Intent.createChooser(intent, "Selecionar Foto"), PHOTO_REQUEST_CODE)
        } catch (e: Exception) {
            showErrorMessage("Erro ao abrir galeria: ${e.message}")
        }
    }

    /**
     * Anexar documento
     */
    private fun attachDocument() {
        // TODO: INTEGRAR COM DOCUMENTMANAGER
        // Implementar seleção e upload de documento
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "*/*"
            addCategory(Intent.CATEGORY_OPENABLE)
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain"
            ))
        }
        
        try {
            startActivityForResult(Intent.createChooser(intent, "Selecionar Documento"), DOCUMENT_REQUEST_CODE)
        } catch (e: Exception) {
            showErrorMessage("Erro ao abrir documentos: ${e.message}")
        }
    }

    /**
     * Anexar localização
     */
    private fun attachLocation() {
        // TODO: INTEGRAR COM LOCATIONMANAGER
        // Implementar captura de localização atual
        showToast("📍 Capturando localização...")
        
        // Simular captura de localização
        lifecycleScope.launch {
            delay(1000)
            val locationMessage = ChatMessage(
                id = "location_${System.currentTimeMillis()}",
                orderId = orderId ?: "",
                senderId = LocalAuthManager.currentUser?.id ?: "",
                senderName = LocalAuthManager.currentUser?.fullName ?: "Você",
                message = "📍 Localização: -23.5505, -46.6333 (São Paulo, SP)",
                type = MessageType.SENT,
                timestamp = Date(),
                isRead = true,
                attachmentUrl = "geo:-23.5505,-46.6333",
                attachmentType = com.aquiresolve.app.models.AttachmentType.IMAGE
            )
            
            messages.add(locationMessage)
            chatAdapter.notifyItemInserted(messages.size - 1)
            binding.rvMessages.scrollToPosition(messages.size - 1)
            
            showSuccessMessage("📍 Localização anexada")
        }
    }
    
    companion object {
        private const val PHOTO_REQUEST_CODE = 1001
        private const val DOCUMENT_REQUEST_CODE = 1002
    }

    /**
     * Controla o estado de carregamento da interface
     */
    private fun setLoadingState(loading: Boolean) {
        binding.loadingState.visibility = if (loading) View.VISIBLE else View.GONE
    }

    /**
     * Exibe uma mensagem de sucesso
     */
    private fun showSuccessMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * Exibe uma mensagem de erro
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, "❌ $message", Toast.LENGTH_LONG).show()
    }

    /**
     * Exibe uma mensagem toast
     */
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
} 