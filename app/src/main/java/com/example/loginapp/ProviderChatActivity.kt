package com.example.loginapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.loginapp.adapters.ChatAdapter
import com.example.loginapp.databinding.ActivityProviderChatBinding
import com.example.loginapp.models.ChatMessage
import com.example.loginapp.models.MessageType
import com.example.loginapp.models.AttachmentType
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collectLatest
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

/**
 * ProviderChatActivity - Tela de chat específica para PRESTADORES
 * 
 * Interface diferenciada para prestadores:
 * - Design focado em produtividade
 * - Botões de ação específicos para prestadores
 * - Informações do cliente e serviço em destaque
 * - Opções de orçamento e agendamento
 */
class ProviderChatActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProviderChatBinding
    
    // Dados do chat
    private var orderId: String? = null
    private var clientId: String? = null
    private var clientName: String? = null
    private var clientPhoto: String? = null
    private var orderTitle: String? = null
    private var orderDescription: String? = null
    private var orderBudget: String? = null
    
    // Lista de mensagens
    private var messages = mutableListOf<ChatMessage>()
    private var isClientOnline = false
    private var isTyping = false
    
    // Adapter
    private lateinit var chatAdapter: ChatAdapter
    private val chatManager = FirebaseChatManager()
    private val db by lazy { com.google.firebase.firestore.FirebaseFirestore.getInstance() }
    private val auth by lazy { com.google.firebase.auth.FirebaseAuth.getInstance() }
    
    // Constantes para anexos
    companion object {
        private const val REQUEST_CAMERA = 1001
        private const val REQUEST_GALLERY = 1002
        private const val REQUEST_DOCUMENT = 1003
        private const val REQUEST_CAMERA_PERMISSION = 1004
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityProviderChatBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Obter dados da intent
        orderId = intent.getStringExtra("order_id")
        clientId = intent.getStringExtra("client_id")
        clientName = intent.getStringExtra("client_name")
        clientPhoto = intent.getStringExtra("client_photo")
        orderTitle = intent.getStringExtra("order_title")
        orderDescription = intent.getStringExtra("order_description")
        orderBudget = intent.getStringExtra("order_budget")
        
        if (orderId == null || clientId == null) {
            showErrorMessage("Dados do chat não encontrados")
            finish()
            return
        }
        
        setupUI()
        setupClickListeners()
        setupRecyclerView()
        setupMessageInput()
        loadChatData()

        // Presença: observar cliente e atualizar minha presença
        clientId?.let { observeUserPresence(it) }
    }

    /**
     * Configura a interface específica para prestadores
     */
    private fun setupUI() {
        // Status bar personalizada para prestadores
        window.statusBarColor = ContextCompat.getColor(this, R.color.secondary_color)
        
        // Configurar informações do cliente
        binding.tvClientName.text = clientName ?: "Cliente"
        binding.tvOrderTitle.text = orderTitle ?: "Serviço"
        binding.tvOrderDescription.text = orderDescription ?: "Descrição não disponível"
        binding.tvOrderBudget.text = "Orçamento: ${orderBudget ?: "A definir"}"
        
        // Status online/offline
        updateClientStatus(true)
        
        // Configurar foto do cliente (se disponível)
        if (!clientPhoto.isNullOrEmpty()) {
            // TODO: Carregar imagem com Glide
            binding.ivClientPhoto.visibility = View.VISIBLE
        } else {
            binding.ivClientPhoto.visibility = View.GONE
        }
        
        // Mostrar informações específicas do prestador
        binding.tvProviderInfo.text = "Você está atendendo este cliente"
    }

    /**
     * Configura os listeners específicos para prestadores
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão de informações do cliente
        binding.btnClientInfo.setOnClickListener {
            showClientInfoDialog()
        }
        
        // Botão de enviar orçamento
        binding.btnSendQuote.setOnClickListener {
            showQuoteDialog()
        }
        
        // Botão de agendar visita
        binding.btnScheduleVisit.setOnClickListener {
            showScheduleDialog()
        }
        
        // Botão de iniciar serviço
        binding.btnStartService.setOnClickListener {
            showStartServiceDialog()
        }
        
        // Botão de finalizar serviço
        binding.btnFinishService.setOnClickListener {
            showFinishServiceDialog()
        }
    }

    /**
     * Configura o RecyclerView para as mensagens
     */
    private fun setupRecyclerView() {
        chatAdapter = ChatAdapter(messages)
        binding.recyclerViewMessages.apply {
            layoutManager = LinearLayoutManager(this@ProviderChatActivity).apply {
                stackFromEnd = true
            }
            adapter = chatAdapter
        }
    }

    /**
     * Configura o input de mensagem
     */
    private fun setupMessageInput() {
        binding.etMessage.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                binding.btnSend.isEnabled = !s.isNullOrBlank()
            }
        })
        
        binding.btnSend.setOnClickListener {
            sendMessage()
        }
        
        binding.btnAttach.setOnClickListener {
            showAttachmentOptions()
        }
        
        // Botões de resposta rápida para prestadores
        binding.btnQuickResponse1.setOnClickListener {
            sendQuickResponse("Olá! Vou analisar seu pedido e retorno em breve.")
        }
        
        binding.btnQuickResponse2.setOnClickListener {
            sendQuickResponse("Posso fazer uma visita técnica para avaliar melhor o serviço?")
        }
        
        binding.btnQuickResponse3.setOnClickListener {
            sendQuickResponse("Qual seria o melhor horário para você?")
        }
    }

    /**
     * Carrega os dados do chat
     */
    private fun loadChatData() {
        loadMessagesFromFirestore()
    }

    /**
     * Adiciona mensagem de boas-vindas
     */
    private fun addWelcomeMessage() {
        val welcomeMessage = ChatMessage(
            id = "welcome_${System.currentTimeMillis()}",
            orderId = orderId ?: "unknown",
            senderId = "system",
            senderName = "Sistema",
            message = "Olá! Você está atendendo ${clientName ?: "o cliente"}. " +
                     "Use os botões de resposta rápida para agilizar o atendimento.",
            timestamp = Date(),
            type = MessageType.RECEIVED,
            isRead = true
        )
        
        messages.add(welcomeMessage)
        chatAdapter.notifyItemInserted(messages.size - 1)
        scrollToBottom()
    }

    /**
     * Envia uma mensagem
     */
    private fun sendMessage() {
        val messageText = binding.etMessage.text.toString().trim()
        if (messageText.isEmpty()) return
        
        val message = ChatMessage(
            id = "msg_${System.currentTimeMillis()}",
            orderId = orderId ?: "unknown",
            senderId = getCurrentUserId(),
            senderName = getCurrentUserName(),
            message = messageText,
            timestamp = Date(),
            type = MessageType.SENT,
            isRead = false
        )
        
        // Adicionar à lista local
        messages.add(message)
        chatAdapter.notifyItemInserted(messages.size - 1)
        scrollToBottom()
        
        // Limpar input
        binding.etMessage.text?.clear()
        
        // Enviar para o Firestore
        lifecycleScope.launch {
            val result = chatManager.sendMessage(
                FirebaseChatManager.ChatMessage(
                    orderId = orderId ?: "unknown",
                    senderId = getCurrentUserId(),
                    senderName = getCurrentUserName(),
                    senderType = "provider",
                    message = messageText
                )
            )
            if (result.isFailure) {
                showErrorMessage("Falha ao enviar mensagem: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    /**
     * Envia resposta rápida
     */
    private fun sendQuickResponse(response: String) {
        binding.etMessage.setText(response)
        sendMessage()
    }

    /**
     * Atualiza o status do cliente
     */
    private fun updateClientStatus(online: Boolean) {
        isClientOnline = online
        binding.tvClientStatus.text = if (online) "🟢 Online" else "🔴 Offline"
        binding.tvClientStatus.setTextColor(
            ContextCompat.getColor(this, if (online) R.color.success_color else R.color.error_color)
        )
    }

    override fun onResume() {
        super.onResume()
        updateOwnPresence(isOnline = true)
    }

    override fun onPause() {
        super.onPause()
        updateOwnPresence(isOnline = false)
    }

    private fun updateOwnPresence(isOnline: Boolean) {
        val current = auth.currentUser ?: return
        val now = com.google.firebase.Timestamp.now()
        val brt = formatBrt(now.toDate())
        val data = mapOf(
            "isOnline" to isOnline,
            "lastSeenAt" to now,
            "lastSeenAtBRT" to brt
        )
        db.collection("users").document(current.uid).set(data, com.google.firebase.firestore.SetOptions.merge())
    }

    private fun observeUserPresence(userId: String) {
        db.collection("users").document(userId)
            .addSnapshotListener { doc, _ ->
                val isOnline = doc?.getBoolean("isOnline") ?: false
                val lastSeenBrt = doc?.getString("lastSeenAtBRT")
                if (isOnline) {
                    binding.tvClientStatus.text = "🟢 Online"
                    binding.tvClientStatus.setTextColor(ContextCompat.getColor(this, R.color.success_color))
                } else {
                    val text = if (!lastSeenBrt.isNullOrEmpty()) "Visto às $lastSeenBrt" else "Offline"
                    binding.tvClientStatus.text = text
                    binding.tvClientStatus.setTextColor(ContextCompat.getColor(this, R.color.gray_500))
                }
            }
    }

    private fun formatBrt(date: java.util.Date): String {
        val fmt = java.text.SimpleDateFormat("dd/MM HH:mm", java.util.Locale("pt", "BR"))
        fmt.timeZone = java.util.TimeZone.getTimeZone("America/Sao_Paulo")
        return fmt.format(date)
    }

    /**
     * Mostra diálogo de informações do cliente
     */
    private fun showClientInfoDialog() {
        AlertDialog.Builder(this)
            .setTitle("Informações do Cliente")
            .setMessage("""
                Nome: ${clientName ?: "Não informado"}
                Status: ${if (isClientOnline) "Online" else "Offline"}
                Serviços solicitados: 5
                Avaliação média: ⭐⭐⭐⭐⭐ (4.9)
                
                Serviço atual:
                • ${orderTitle ?: "Serviço"}
                • ${orderDescription ?: "Descrição não disponível"}
                • Orçamento: ${orderBudget ?: "A definir"}
            """.trimIndent())
            .setPositiveButton("Ver Histórico") { _, _ ->
                // TODO: Abrir histórico do cliente
            }
            .setNegativeButton("Fechar", null)
            .show()
    }

    /**
     * Mostra diálogo de orçamento
     */
    private fun showQuoteDialog() {
        // TODO: Implementar tela de orçamento
        Toast.makeText(this, "Sistema de orçamento será implementado em breve", Toast.LENGTH_SHORT).show()
    }

    /**
     * Mostra diálogo de agendamento
     */
    private fun showScheduleDialog() {
        val options = arrayOf("Hoje", "Amanhã", "Esta semana", "Próxima semana", "Data específica")
        
        AlertDialog.Builder(this)
            .setTitle("Agendar Visita")
            .setItems(options) { _, which ->
                val option = options[which]
                // TODO: Implementar agendamento
                Toast.makeText(this, "Visita agendada: $option", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Mostra diálogo de iniciar serviço
     */
    private fun showStartServiceDialog() {
        AlertDialog.Builder(this)
            .setTitle("Iniciar Serviço")
            .setMessage("Tem certeza que deseja iniciar este serviço? O cliente será notificado.")
            .setPositiveButton("Sim, Iniciar") { _, _ ->
                startService()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Mostra diálogo de finalizar serviço
     */
    private fun showFinishServiceDialog() {
        AlertDialog.Builder(this)
            .setTitle("Finalizar Serviço")
            .setMessage("Tem certeza que deseja finalizar este serviço? Esta ação não pode ser desfeita.")
            .setPositiveButton("Sim, Finalizar") { _, _ ->
                finishService()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Inicia o serviço
     */
    private fun startService() {
        // TODO: Implementar início do serviço
        Toast.makeText(this, "Serviço iniciado! Cliente notificado.", Toast.LENGTH_SHORT).show()
    }

    /**
     * Finaliza o serviço
     */
    private fun finishService() {
        // TODO: Implementar finalização do serviço
        Toast.makeText(this, "Serviço finalizado com sucesso!", Toast.LENGTH_SHORT).show()
        
        // Voltar para a tela anterior
        finish()
    }

    /**
     * Mostra opções de anexo
     */
    private fun showAttachmentOptions() {
        val options = arrayOf("📷 Tirar Foto", "🖼️ Galeria", "📄 Documento", "📋 Orçamento", "📍 Localização")
        
        AlertDialog.Builder(this)
            .setTitle("Anexar Arquivo")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takePhoto()
                    1 -> selectFromGallery()
                    2 -> selectDocument()
                    3 -> attachQuote()
                    4 -> shareLocation()
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Rola para o final da lista
     */
    private fun scrollToBottom() {
        binding.recyclerViewMessages.post {
            val lastIndex = (messages.size - 1).coerceAtLeast(0)
            if (messages.isNotEmpty()) {
                binding.recyclerViewMessages.smoothScrollToPosition(lastIndex)
            }
        }
    }

    /**
     * Mostra mensagem de erro
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    // Métodos auxiliares (implementar conforme necessário)
    private fun getCurrentUserId(): String = FirebaseAuth.getInstance().currentUser?.uid ?: "provider_id"
    private fun getCurrentUserName(): String = FirebaseAuth.getInstance().currentUser?.displayName ?: "Prestador"
    private fun loadMessagesFromFirestore() {
        val oId = orderId ?: return
        lifecycleScope.launch {
            chatManager.getMessagesFlow(oId).collectLatest { remoteMessages ->
                val currentUserId = getCurrentUserId()
                messages.clear()
                messages.addAll(remoteMessages.map { rm ->
                    ChatMessage(
                        id = rm.id,
                        orderId = rm.orderId,
                        senderId = rm.senderId,
                        senderName = rm.senderName,
                        message = rm.message,
                        timestamp = rm.timestamp.toDate(),
                        // Exibir do ponto de vista do PRESTADOR
                        type = if (rm.senderType == "provider") MessageType.SENT else MessageType.RECEIVED,
                        isRead = rm.isRead
                    )
                })
                chatAdapter.notifyDataSetChanged()
                scrollToBottom()
                chatManager.markMessagesAsRead(oId, currentUserId)
            }
        }
    }
    private fun takePhoto() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA_PERMISSION)
            return
        }
        
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (intent.resolveActivity(packageManager) != null) {
            startActivityForResult(intent, REQUEST_CAMERA)
        } else {
            showErrorMessage("Câmera não disponível")
        }
    }
    
    private fun selectFromGallery() {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "image/*"
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        startActivityForResult(Intent.createChooser(intent, "Selecionar Imagem"), REQUEST_GALLERY)
    }
    
    private fun selectDocument() {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "*/*"
        startActivityForResult(Intent.createChooser(intent, "Selecionar Documento"), REQUEST_DOCUMENT)
    }
    
    private fun attachQuote() { /* TODO: Implementar */ }
    
    private fun shareLocation() {
        // TODO: Implementar compartilhamento de localização
        showErrorMessage("Funcionalidade de localização em desenvolvimento")
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (resultCode == RESULT_OK) {
            when (requestCode) {
                REQUEST_CAMERA -> {
                    val imageUri = data?.data
                    if (imageUri != null) {
                        uploadImageToChat(imageUri, "camera_${System.currentTimeMillis()}.jpg")
                    }
                }
                REQUEST_GALLERY -> {
                    val imageUri = data?.data
                    if (imageUri != null) {
                        val fileName = getFileNameFromUri(imageUri) ?: "gallery_${System.currentTimeMillis()}.jpg"
                        uploadImageToChat(imageUri, fileName)
                    }
                }
                REQUEST_DOCUMENT -> {
                    val documentUri = data?.data
                    if (documentUri != null) {
                        val fileName = getFileNameFromUri(documentUri) ?: "document_${System.currentTimeMillis()}"
                        uploadDocumentToChat(documentUri, fileName)
                    }
                }
            }
        }
    }
    
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                takePhoto()
            } else {
                showErrorMessage("Permissão da câmera negada")
            }
        }
    }
    
    private fun uploadImageToChat(imageUri: Uri, fileName: String) {
        lifecycleScope.launch {
            try {
                val imageManager = FirebaseImageManager()
                val uploadData = FirebaseImageManager.ImageUploadData(
                    uri = imageUri,
                    fileName = fileName,
                    folder = FirebaseImageManager.FOLDER_CHAT_IMAGES,
                    userId = getCurrentUserId(),
                    orderId = orderId ?: "unknown"
                )
                
                when (val result = imageManager.uploadImage(this@ProviderChatActivity, uploadData)) {
                    is FirebaseImageManager.UploadResult.Success -> {
                        // Enviar mensagem com imagem
                        val message = ChatMessage(
                            id = "img_${System.currentTimeMillis()}",
                            orderId = orderId ?: "unknown",
                            senderId = getCurrentUserId(),
                            senderName = getCurrentUserName(),
                            message = "📷 Imagem enviada",
                            timestamp = Date(),
                            type = MessageType.SENT,
                            isRead = false,
                            attachmentUrl = result.downloadUrl,
                            attachmentType = AttachmentType.IMAGE
                        )
                        
                        // Enviar para o Firebase
                        chatManager.sendMessage(
                            FirebaseChatManager.ChatMessage(
                                orderId = message.orderId,
                                senderId = message.senderId,
                                senderName = message.senderName,
                                senderType = "provider",
                                message = message.message,
                                imageUrl = message.attachmentUrl
                            )
                        )
                        
                        // Adicionar à lista local
                        messages.add(message)
                        chatAdapter.notifyItemInserted(messages.size - 1)
                        scrollToBottom()
                    }
                    is FirebaseImageManager.UploadResult.Error -> {
                        showErrorMessage("Erro ao enviar imagem: ${result.message}")
                    }
                    else -> {
                        // Progress já é tratado no callback
                    }
                }
            } catch (e: Exception) {
                showErrorMessage("Erro ao processar imagem: ${e.message}")
            }
        }
    }
    
    private fun uploadDocumentToChat(documentUri: Uri, fileName: String) {
        // TODO: Implementar upload de documentos
        showErrorMessage("Upload de documentos em desenvolvimento")
    }
    
    private fun getFileNameFromUri(uri: Uri): String? {
        return try {
            val cursor = contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIndex = it.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME)
                    if (nameIndex >= 0) it.getString(nameIndex) else null
                } else null
            }
        } catch (e: Exception) {
            null
        }
    }
}
