package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.loginapp.databinding.ActivityOrderDetailsBinding
import com.example.loginapp.models.OrderData
import com.example.loginapp.models.OrderStatus
import com.example.loginapp.utils.ProtocolGenerator
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*
import com.google.firebase.firestore.FirebaseFirestore

/**
 * OrderDetailsActivity - Tela de detalhes do pedido
 * 
 * Funcionalidades:
 * - Exibe todos os detalhes do pedido
 * - Mostra prestador atribuído (se houver)
 * - Lista cotações recebidas
 * - Ações específicas por status
 * - Navegação para chat
 */
class OrderDetailsActivity : AppCompatActivity() {

    companion object {
        private const val RATING_REQUEST_CODE = 1001
    }

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityOrderDetailsBinding
    
    // Variáveis para controle de estado
    private var orderId: String? = null
    private var order: OrderData? = null
    private var isProviderView = false
    
    // Firebase
    private val db = FirebaseFirestore.getInstance()
    private lateinit var orderManager: FirebaseOrderManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityOrderDetailsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Obter dados da intent
        orderId = intent.getStringExtra("order_id")
        isProviderView = intent.getBooleanExtra("is_provider_view", false)
        
        if (orderId == null) {
            showErrorMessage("Pedido não encontrado")
            finish()
            return
        }
        
        // Inicializar managers
        orderManager = FirebaseOrderManager()
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        
        // Carregar dados do pedido
        loadOrderDetails()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
    }
    
    /**
     * Teste temporário para verificar visibilidade do botão
     */
    private fun testButtonVisibility() {
        // Garantir que o botão tenha texto visível
        binding.btnSecondaryAction.text = "Cancelar Pedido"
        binding.btnSecondaryAction.setTextColor(ContextCompat.getColor(this, R.color.error_red))
        binding.btnSecondaryAction.visibility = View.VISIBLE
        
        android.util.Log.d("OrderDetails", "Teste: Texto do botão = ${binding.btnSecondaryAction.text}")
        android.util.Log.d("OrderDetails", "Teste: Visibilidade = ${binding.btnSecondaryAction.visibility}")
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
        
        // Botão contatar prestador
        binding.btnContactProvider.setOnClickListener {
            openChat()
        }
        
        // Botão de ação principal
        binding.btnPrimaryAction.setOnClickListener {
            handlePrimaryAction()
        }
        
        // Botão de ação secundária
        binding.btnSecondaryAction.setOnClickListener {
            handleSecondaryAction()
        }
    }

    /**
     * Carrega os detalhes do pedido do Firebase
     */
    private fun loadOrderDetails() {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                val result = orderManager.getOrderById(orderId!!)
                
                if (result.isSuccess) {
                    val orderData = result.getOrNull()
                    if (orderData != null) {
                        order = orderData
                        updateUI(orderData)
                    } else {
                        showErrorMessage("Pedido não encontrado")
                        finish()
                    }
                } else {
                    showErrorMessage("Erro ao carregar pedido: ${result.exceptionOrNull()?.message}")
                    finish()
                }
                
            } catch (e: Exception) {
                showErrorMessage("Erro ao carregar pedido: ${e.message}")
                finish()
            } finally {
                showLoading(false)
            }
        }
    }

    /**
     * Atualiza a interface com os dados do pedido
     */
    private fun updateUI(order: OrderData) {
        // Configurar ícone do serviço
        setServiceIcon(order.serviceName)
        
        // Configurar dados básicos
        binding.tvServiceNiche.text = order.serviceName
        binding.tvDescription.text = order.description
        binding.tvAddress.text = order.address
        
        // Configurar data
        val dateFormat = SimpleDateFormat("dd/MM/yyyy 'às' HH:mm", Locale("pt", "BR"))
        binding.tvOrderDate.text = dateFormat.format(order.createdAt.toDate())
        
        // Configurar protocolo
        if (order.protocol.isNotEmpty()) {
            binding.tvOrderProtocol.text = "Protocolo: ${ProtocolGenerator.formatProtocolForDisplay(order.protocol)}"
            binding.tvOrderProtocol.visibility = View.VISIBLE
        } else {
            binding.tvOrderProtocol.visibility = View.GONE
        }
        
        // Configurar status
        setStatusInfo(order.status)
        
        // Configurar preço
        setPriceInfo(order)
        
        // Configurar badges
        setBadges(order)

        // Se cancelado, exibir cartão com informações de cancelamento
        if (order.status == "cancelled" || order.status == "expired") {
            binding.cardCancellationInfo.visibility = View.VISIBLE
            val dateFormat = SimpleDateFormat("dd/MM/yyyy 'às' HH:mm", Locale("pt", "BR"))
            val cancelledAtText = order.cancelledAt?.toDate()?.let { dateFormat.format(it) } ?: "--"
            val cancelledByText = when (order.cancelledBy) { "client" -> "Cliente"; "provider" -> "Prestador"; else -> "Indisponível" }
            binding.tvCancelledAt.text = "Cancelado em $cancelledAtText"
            binding.tvCancelledBy.text = "Por: $cancelledByText"
            binding.tvCancellationReason.text = order.cancellationReason?.ifEmpty { "Sem motivo informado" } ?: "Sem motivo informado"
        } else {
            binding.cardCancellationInfo.visibility = View.GONE
        }
        
        // Configurar complemento
        if (order.complement != null && order.complement.isNotEmpty()) {
            binding.tvComplement.text = order.complement
            binding.tvComplement.visibility = View.VISIBLE
        }
        
        // Configurar imagens
        if (order.images.isNotEmpty()) {
            binding.cardImages.visibility = View.VISIBLE
            // TODO: Implementar adapter de imagens
        }
        
        // Configurar prestador (se atribuído)
        if (!order.assignedProviderName.isNullOrEmpty()) {
            binding.cardProvider.visibility = View.VISIBLE
            binding.tvProviderName.text = order.assignedProviderName
            binding.tvProviderRating.text = "⭐ Prestador Atribuído"
        } else {
            binding.cardProvider.visibility = View.VISIBLE
            binding.tvProviderName.text = when (order.status) {
                "distributing" -> "Não atribuído"
                "pending" -> "Não atribuído"
                "cancelled" -> "Cancelado"
                "expired" -> "Expirado"
                else -> "Não atribuído"
            }
            binding.tvProviderRating.text = "⏳ Em distribuição"
        }
        
        // Configurar botões de ação
        setActionButtons(order)

        // Exibir botão de chat quando o pedido estiver atribuído ou em andamento
        val canChat = order.status == OrderData.STATUS_ASSIGNED || order.status == OrderData.STATUS_IN_PROGRESS
        binding.btnContactProvider.visibility = if (canChat) View.VISIBLE else View.GONE
        binding.btnContactProvider.text = if (isProviderView) "Chat com Cliente" else "Chat com Prestador"
    }

    /**
     * Define o ícone baseado no nicho de serviço
     */
    private fun setServiceIcon(serviceNiche: String) {
        val iconRes = when (serviceNiche.lowercase()) {
            "elétrica" -> R.drawable.ic_electrician
            "hidráulica" -> R.drawable.ic_plumber
            "pintura" -> R.drawable.ic_painter
            "limpeza" -> R.drawable.ic_cleaning
            "jardinagem" -> R.drawable.ic_gardening
            "marcenaria" -> R.drawable.ic_carpentry
            "informática" -> R.drawable.ic_it
            "mudanças" -> R.drawable.ic_moving
            else -> R.drawable.ic_services
        }
        binding.ivServiceIcon.setImageResource(iconRes)
    }

    /**
     * Define as informações de status
     */
    private fun setStatusInfo(status: String) {
        val (text, backgroundRes) = when (status) {
            "pending" -> "PENDENTE" to R.drawable.status_pending_background
            "quotes_received" -> "COTAÇÕES" to R.drawable.status_pending_background
            "assigned" -> "ATRIBUIDO" to R.drawable.status_pending_background
            "in_progress" -> "EM ANDAMENTO" to R.drawable.status_pending_background
            "completed" -> "CONCLUÍDO" to R.drawable.status_pending_background
            "cancelled" -> "CANCELADO" to R.drawable.status_pending_background
            "expired" -> "EXPIRADO" to R.drawable.status_pending_background
            else -> "PENDENTE" to R.drawable.status_pending_background
        }
        
        binding.tvStatus.text = text
        binding.tvStatus.setBackgroundResource(backgroundRes)
    }

    /**
     * Define as informações de preço
     */
    private fun setPriceInfo(order: OrderData) {
        when {
            order.estimatedPrice > 0 -> {
                binding.tvPrice.text = "R$ %.2f".format(order.estimatedPrice).replace(".", ",")
            }
            else -> {
                binding.tvPrice.text = "Aguardando"
            }
        }
    }

    /**
     * Define os badges
     */
    private fun setBadges(order: OrderData) {
        // Badge de emergência
        binding.tvEmergency.visibility = View.GONE
        
        // Badge de tipo de serviço
        binding.tvServiceType.text = if (order.serviceType == "SIMPLE") "💰 PREÇO FIXO" else "📋 ORÇAMENTO"
    }

    /**
     * Define os botões de ação
     */
    private fun setActionButtons(order: OrderData) {
        val (primaryText, secondaryText) = if (isProviderView) {
            when (order.status) {
                "distributing", "pending" -> "Aceitar Pedido" to "Ver Detalhes"
                "assigned" -> "Chat" to "Iniciar Serviço"
                "in_progress" -> "Chat" to "Confirmar Conclusão"
                "completed" -> "Ver Detalhes" to "—"
                "cancelled", "expired" -> "Ver Detalhes" to "—"
                else -> "Ver Detalhes" to "—"
            }
        } else {
            when (order.status) {
                "distributing" -> {
                    "⏳ Em Distribuição" to "Cancelar Pedido"
                }
                "pending" -> {
                    if (order.serviceType == "SIMPLE") {
                        "Aguardando Prestador" to "Cancelar Pedido"
                    } else {
                        "Aguardando Cotações" to "Cancelar Pedido"
                    }
                }
                "quotes_received" -> "Ver Cotações" to "Cancelar Pedido"
                "assigned" -> "Iniciar Serviço" to "Cancelar Pedido"
                "in_progress" -> "Confirmar Conclusão" to "Reportar Problema"
                "completed" -> "Avaliar Serviço" to "Solicitar Revisão"
                "cancelled" -> "Ver Detalhes" to "Criar Novo Pedido"
                "expired" -> "Ver Detalhes" to "Criar Novo Pedido"
                else -> "Ver Detalhes" to "Cancelar Pedido"
            }
        }
        
        // Definir textos dos botões
        binding.btnPrimaryAction.text = primaryText
        binding.btnSecondaryAction.text = secondaryText
        
        // Debug: verificar se o texto foi definido
        android.util.Log.d("OrderDetails", "Texto do botão secundário: ${binding.btnSecondaryAction.text}")
        
        // Garantir que o texto seja sempre visível
        binding.btnSecondaryAction.setTextColor(ContextCompat.getColor(this, R.color.error_red))
        
        // Configurar visibilidade e estado dos botões
        if (isProviderView) {
            when (order.status) {
                "distributing", "pending", "assigned", "in_progress", "completed", "cancelled", "expired" -> {
                    binding.btnPrimaryAction.isEnabled = true
                    binding.btnSecondaryAction.isEnabled = true
                }
            }
        } else {
            when (order.status) {
                "distributing" -> {
                    binding.btnPrimaryAction.isEnabled = false // Em distribuição, não há ação primária
                    binding.btnSecondaryAction.isEnabled = true // Sempre pode cancelar
                }
                "pending" -> {
                    binding.btnPrimaryAction.isEnabled = false
                    binding.btnSecondaryAction.isEnabled = true
                }
                "completed" -> {
                    binding.btnPrimaryAction.isEnabled = true
                    binding.btnSecondaryAction.isEnabled = true
                    // Para pedidos concluídos, usar cor verde
                    binding.btnSecondaryAction.setStrokeColorResource(R.color.secondary_color)
                    binding.btnSecondaryAction.setTextColor(ContextCompat.getColor(this, R.color.secondary_color))
                }
                "cancelled", "expired" -> {
                    binding.btnPrimaryAction.isEnabled = true
                    binding.btnSecondaryAction.isEnabled = true
                    // Para pedidos cancelados, usar cor laranja
                    binding.btnSecondaryAction.setStrokeColorResource(R.color.primary_color)
                    binding.btnSecondaryAction.setTextColor(ContextCompat.getColor(this, R.color.primary_color))
                }
                else -> {
                    binding.btnPrimaryAction.isEnabled = true
                    binding.btnSecondaryAction.isEnabled = true
                    // Para outros status, manter vermelho (padrão)
                }
            }
        }
    }

    /**
     * Trata a ação principal do botão
     */
    private fun handlePrimaryAction() {
        order?.let { order ->
            if (isProviderView) {
                when (order.status) {
                    "distributing", "pending" -> acceptOrderAsProvider(order)
                    "assigned", "in_progress" -> openChat()
                    else -> showToast("Ação não disponível")
                }
            } else {
                when (order.status) {
                    "quotes_received" -> openQuotesScreen(order.id)
                    "assigned" -> startService(order)
                    "in_progress" -> confirmCompletion(order, actor = "client")
                    "completed" -> openRatingScreen(order.id)
                    else -> showToast("Ação não disponível para este status")
                }
            }
        }
    }

    /**
     * Trata a ação secundária do botão
     */
    private fun handleSecondaryAction() {
        order?.let { order ->
            if (isProviderView) {
                // Prestador: sempre "Ver detalhes" (sem cancelar do cliente)
                showToast("Abrindo detalhes...")
            } else {
                when (order.status) {
                    "distributing", "pending", "quotes_received", "assigned" -> showCancelOrderDialog(order)
                    "in_progress" -> showReportProblemDialog(order)
                    "completed" -> showRequestRevisionDialog(order)
                    "cancelled", "expired" -> createNewOrder()
                    else -> showCancelOrderDialog(order)
                }
            }
        }
    }

    private fun acceptOrderAsProvider(order: OrderData) {
        lifecycleScope.launch {
            try {
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
                val current = auth.currentUser ?: run {
                    showToast("Usuário não autenticado")
                    return@launch
                }
                val docRef = db.collection("orders").document(order.id)
                com.google.firebase.firestore.FirebaseFirestore.getInstance().runTransaction { tx ->
                    val snap = tx.get(docRef)
                    val currentStatus = snap.getString("status") ?: OrderData.STATUS_DISTRIBUTING
                    val assigned = snap.getString("assignedProvider")
                    if ((currentStatus == OrderData.STATUS_DISTRIBUTING || currentStatus == OrderData.STATUS_PENDING) && assigned.isNullOrEmpty()) {
                        val providerName = auth.currentUser?.displayName ?: "Prestador"
                        tx.update(docRef, mapOf(
                            "assignedProvider" to current.uid,
                            "assignedProviderName" to providerName,
                            "status" to OrderData.STATUS_ASSIGNED,
                            "assignedAt" to com.google.firebase.Timestamp.now(),
                            "updatedAt" to com.google.firebase.Timestamp.now()
                        ))
                    } else {
                        throw IllegalStateException("Indisponível")
                    }
                }.await()
                showSuccessMessage("✅ Pedido aceito com sucesso!")
                loadOrderDetails()
            } catch (e: Exception) {
                showErrorMessage("❌ Não foi possível aceitar: ${'$'}{e.message}")
            }
        }
    }

    /**
     * Abre a tela de cotações
     */
    private fun openQuotesScreen(orderId: String) {
        // val intent = Intent(this, QuotesActivity::class.java)
        // intent.putExtra("order_id", orderId)
        // startActivity(intent)
        showToast("💰 Tela de cotações em desenvolvimento")
    }

    /**
     * Abre a tela de avaliação
     */
    private fun openRatingScreen(orderId: String) {
        val intent = Intent(this, RatingActivity::class.java).apply {
            putExtra("order_id", orderId)
            putExtra("provider_id", order?.assignedProvider)
            putExtra("provider_name", "Prestador") // TODO: Buscar nome do prestador
        }
        startActivityForResult(intent, RATING_REQUEST_CODE)
    }

    /**
     * Inicia o serviço
     */
    private fun startService(order: OrderData) {
        lifecycleScope.launch {
            try {
                val result = orderManager.startService(order.id)
                if (result.isSuccess) {
                    showSuccessMessage("🚀 Serviço iniciado!")
                } else {
                    showErrorMessage(result.exceptionOrNull()?.message ?: "Falha ao iniciar serviço")
                }
                loadOrderDetails() // Recarregar dados
            } catch (e: Exception) {
                showErrorMessage("Erro ao iniciar serviço")
            }
        }
    }

    /**
     * Conclui o serviço
     */
    private fun confirmCompletion(order: OrderData, actor: String) {
        lifecycleScope.launch {
            try {
                val result = orderManager.confirmCompletion(order.id, actor)
                if (result.isSuccess) {
                    if (actor == "client") {
                        showSuccessMessage("✅ Sua confirmação foi registrada. Aguarde a confirmação do prestador.")
                    } else {
                        showSuccessMessage("✅ Confirmação do prestador registrada.")
                    }
                } else {
                    showErrorMessage(result.exceptionOrNull()?.message ?: "Falha ao confirmar conclusão")
                }
                loadOrderDetails()
            } catch (e: Exception) {
                showErrorMessage("Erro ao confirmar conclusão")
            }
        }
    }

    /**
     * Abre o chat
     */
    private fun openChat() {
        order?.let { order ->
            if (isProviderView) {
                // Prestador conversa com o cliente
                val intent = Intent(this, ProviderChatActivity::class.java)
                intent.putExtra("order_id", order.id)
                intent.putExtra("client_id", order.clientId)
                intent.putExtra("client_name", order.clientName)
                intent.putExtra("order_title", order.serviceName)
                intent.putExtra("order_description", order.description)
                startActivity(intent)
            } else {
                // Cliente conversa com o prestador
                val intent = Intent(this, ClientChatActivity::class.java)
                intent.putExtra("order_id", order.id)
                intent.putExtra("provider_id", order.assignedProvider)
                intent.putExtra("provider_name", order.assignedProviderName)
                intent.putExtra("order_title", order.serviceName)
                startActivity(intent)
            }
        }
    }

    /**
     * Mostra diálogo de cancelamento
     */
    private fun showCancelOrderDialog(order: OrderData) {
        val statusText = when (order.status) {
            "distributing" -> "em distribuição"
            "pending" -> "pendente"
            "quotes_received" -> "com cotações recebidas"
            "assigned" -> "atribuído a um prestador"
            else -> "neste status"
        }
        
        val message = when (order.status) {
            "distributing" -> "Este pedido ainda está sendo distribuído para prestadores. Tem certeza que deseja cancelá-lo?"
            "pending" -> "Este pedido está aguardando resposta de prestadores. Tem certeza que deseja cancelá-lo?"
            "quotes_received" -> "Este pedido já recebeu cotações de prestadores. Tem certeza que deseja cancelá-lo?"
            "assigned" -> "Este pedido já foi atribuído a um prestador. Tem certeza que deseja cancelá-lo?"
            else -> "Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        }
        
        AlertDialog.Builder(this)
            .setTitle("❌ Cancelar Pedido")
            .setMessage(message)
            .setPositiveButton("Sim, Cancelar") { _, _ ->
                cancelOrder(order)
            }
            .setNegativeButton("Não, Manter") { dialog, _ ->
                dialog.dismiss()
            }
            .setNeutralButton("Mais Informações") { _, _ ->
                showCancelInfoDialog(order)
            }
            .show()
    }
    
    /**
     * Mostra informações adicionais sobre o cancelamento
     */
    private fun showCancelInfoDialog(order: OrderData) {
        val info = when (order.status) {
            "distributing" -> "• O pedido será removido da lista de distribuição\n• Nenhum prestador será notificado\n• Você pode criar um novo pedido a qualquer momento"
            "pending" -> "• O pedido será removido da lista de pendentes\n• Prestadores que já viram o pedido serão notificados\n• Você pode criar um novo pedido a qualquer momento"
            "quotes_received" -> "• Todas as cotações serão perdidas\n• Prestadores serão notificados do cancelamento\n• Você pode criar um novo pedido a qualquer momento"
            "assigned" -> "• O prestador será notificado do cancelamento\n• Pode haver taxas de cancelamento\n• Você pode criar um novo pedido a qualquer momento"
            else -> "• O pedido será marcado como cancelado\n• Você pode criar um novo pedido a qualquer momento"
        }
        
        AlertDialog.Builder(this)
            .setTitle("ℹ️ Informações sobre Cancelamento")
            .setMessage(info)
            .setPositiveButton("Entendi") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    /**
     * Cancela o pedido
     */
    private fun cancelOrder(order: OrderData) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                // Cancelar o pedido no Firebase
                val result = orderManager.cancelOrder(
                    orderId = order.id,
                    cancelledBy = "client",
                    reason = "Cancelado pelo cliente"
                )
                
                if (result.isSuccess) {
                    showSuccessMessage("❌ Pedido cancelado com sucesso!")
                    // Recarregar dados para atualizar a interface
                    loadOrderDetails()
                } else {
                    showErrorMessage("Erro ao cancelar pedido: ${result.exceptionOrNull()?.message}")
                }
                
            } catch (e: Exception) {
                showErrorMessage("Erro ao cancelar pedido: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }

    /**
     * Mostra diálogo de reportar problema
     */
    private fun showReportProblemDialog(order: OrderData) {
        // TODO: Implementar diálogo de reportar problema
        showToast("📝 Funcionalidade de reportar problema em desenvolvimento")
    }

    /**
     * Mostra diálogo de solicitar revisão
     */
    private fun showRequestRevisionDialog(order: OrderData) {
        // TODO: Implementar diálogo de solicitar revisão
        showToast("🔄 Funcionalidade de solicitar revisão em desenvolvimento")
    }

    /**
     * Cria novo pedido
     */
    private fun createNewOrder() {
        val intent = Intent(this, CreateOrderActivity::class.java)
        startActivity(intent)
        finish()
    }

    /**
     * Mostra diálogo de mais opções
     */
    private fun showMoreOptionsDialog() {
        val options = arrayOf("Compartilhar", "Imprimir", "Exportar")
        
        AlertDialog.Builder(this)
            .setTitle("Mais Opções")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> shareOrder()
                    1 -> printOrder()
                    2 -> exportOrder()
                }
            }
            .show()
    }

    /**
     * Compartilha o pedido
     */
    private fun shareOrder() {
        // TODO: Implementar compartilhamento
        showToast("📤 Funcionalidade de compartilhamento em desenvolvimento")
    }

    /**
     * Imprime o pedido
     */
    private fun printOrder() {
        // TODO: Implementar impressão
        showToast("🖨️ Funcionalidade de impressão em desenvolvimento")
    }

    /**
     * Exporta o pedido
     */
    private fun exportOrder() {
        // TODO: Implementar exportação
        showToast("📄 Funcionalidade de exportação em desenvolvimento")
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
    
    /**
     * Controla o estado de carregamento
     */
    private fun showLoading(loading: Boolean) {
        if (loading) {
            binding.loadingState.visibility = View.VISIBLE
            binding.contentLayout.visibility = View.GONE
        } else {
            binding.loadingState.visibility = View.GONE
            binding.contentLayout.visibility = View.VISIBLE
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == RATING_REQUEST_CODE) {
            if (resultCode == RESULT_OK) {
                showToast("✅ Avaliação enviada com sucesso!")
                // Atualizar a interface se necessário
                loadOrderDetails()
            }
        }
    }
} 