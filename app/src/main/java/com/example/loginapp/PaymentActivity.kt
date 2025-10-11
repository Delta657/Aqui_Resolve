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
import com.example.loginapp.databinding.ActivityPaymentBinding
import com.example.loginapp.models.PaymentData
import com.example.loginapp.models.TransactionData
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * PaymentActivity - Tela de pagamentos
 * 
 * Funcionalidades:
 * - Processamento de pagamentos
 * - Seleção de método de pagamento
 * - Histórico de transações
 * - Solicitação de reembolso
 * - Saques para prestadores
 */
class PaymentActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityPaymentBinding
    
    // Variáveis para controle de estado
    private var isLoading = false
    private var orderId: String? = null
    private var orderAmount: Double = 0.0
    private var selectedPaymentMethod: PaymentManager.PaymentMethod = PaymentManager.PaymentMethod.PIX
    private var paymentHistory = listOf<PaymentData>()
    private var transactionHistory = listOf<TransactionData>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityPaymentBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Obter dados da intent
        orderId = intent.getStringExtra("order_id")
        orderAmount = intent.getDoubleExtra("order_amount", 0.0)
        
        if (orderId == null || orderAmount <= 0) {
            showErrorMessage("Dados do pedido inválidos")
            finish()
            return
        }
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        
        // Carregar dados
        loadPaymentData()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
        
        // Configurar dados do pedido
        // binding.tvOrderAmount.text = "R$ %.2f".format(orderAmount).replace(".", ",")
        // binding.tvOrderId.text = "Pedido #${orderId?.substringAfter("order_")}"
        
        // Configurar métodos de pagamento
        setupPaymentMethods()
    }

    /**
     * Configura os métodos de pagamento
     */
    private fun setupPaymentMethods() {
        // Configurar seleção inicial
        binding.rgPaymentMethods.setOnCheckedChangeListener { _, checkedId ->
            selectedPaymentMethod = when (checkedId) {
                R.id.rbPix -> PaymentManager.PaymentMethod.PIX
                R.id.rbCreditCard -> PaymentManager.PaymentMethod.CREDIT_CARD
                R.id.rbDebitCard -> PaymentManager.PaymentMethod.DEBIT_CARD
                R.id.rbBankTransfer -> PaymentManager.PaymentMethod.BANK_TRANSFER
                else -> PaymentManager.PaymentMethod.PIX
            }
        }
        
        // Selecionar PIX por padrão
        binding.rbPix.isChecked = true
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão processar pagamento
        binding.btnProcessPayment.setOnClickListener {
            processPayment()
        }
        
        // Botão ver histórico
        binding.btnHistory.setOnClickListener {
            showPaymentHistory()
        }
        
        // Botão solicitar reembolso
        binding.btnRequestRefund.setOnClickListener {
            showRefundDialog()
        }
        
        // Botão solicitar saque (para prestadores)
        binding.btnWithdraw.setOnClickListener {
            showWithdrawalDialog()
        }
    }

    /**
     * Carrega dados de pagamento
     */
    private fun loadPaymentData() {
        val currentUser = LocalAuthManager.currentUser
        val currentProvider = LocalAuthManager.currentProvider
        
        if (currentUser == null && currentProvider == null) {
            showErrorMessage("Usuário não autenticado")
            return
        }
        
        val userId = currentUser?.id ?: currentProvider?.id ?: return
        val isProvider = currentProvider != null
        
        setLoadingState(true)
        
        lifecycleScope.launch {
            try {
                // Carregar histórico de pagamentos
                // paymentHistory = PaymentManager.getPaymentHistory(userId, isProvider)
                
                // Carregar histórico de transações
                // transactionHistory = PaymentManager.getTransactionHistory(userId)
                
                // Se for prestador, carregar saldo
                if (isProvider) {
                    val balance = PaymentManager.getProviderBalance(userId)
                    binding.tvBalance.text = "R$ %.2f".format(balance).replace(".", ",")
                    binding.cardBalance.visibility = View.VISIBLE
                } else {
                    binding.cardBalance.visibility = View.GONE
                }
                
                setLoadingState(false)
                
            } catch (e: Exception) {
                setLoadingState(false)
                showErrorMessage("Erro ao carregar dados de pagamento")
            }
        }
    }

    /**
     * Processa pagamento
     */
    private fun processPayment() {
        if (isLoading) return
        
        val currentUser = LocalAuthManager.currentUser
        if (currentUser == null) {
            showErrorMessage("Usuário não autenticado")
            return
        }
        
        // Verificar se é um pedido válido
        if (orderId == null || orderAmount <= 0) {
            showErrorMessage("Dados do pedido inválidos")
            return
        }
        
        // TODO: OBTER ID DO PRESTADOR DO PEDIDO
        // Por enquanto, usar um ID simulado
        val providerId = "provider_1"
        
        setLoadingState(true)
        
        lifecycleScope.launch {
            try {
                val result = PaymentManager.processPayment(
                    orderId = orderId!!,
                    clientId = currentUser.id,
                    providerId = providerId,
                    amount = orderAmount,
                    paymentMethod = selectedPaymentMethod
                )
                
                when (result) {
                    is PaymentManager.PaymentResult.Success -> {
                        showSuccessMessage("✅ Pagamento processado com sucesso!")
                    }
                    is PaymentManager.PaymentResult.PaymentCreated -> {
                        showSuccessMessage("✅ Pagamento processado com sucesso!")
                        showSuccessMessage("📧 Comprovante será enviado por email")
                        
                        // Navegar para tela de sucesso
                        // val intent = Intent(this@PaymentActivity, PaymentSuccessActivity::class.java)
                        // intent.putExtra("payment_id", result.paymentId)
                        // intent.putExtra("order_id", orderId)
                        // startActivity(intent)
                        // finish()
                        showToast("Tela de sucesso em desenvolvimento")
                    }
                    is PaymentManager.PaymentResult.Error -> {
                        showErrorMessage("❌ ${result.message}")
                    }
                }
                
            } catch (e: Exception) {
                showErrorMessage("❌ Erro ao processar pagamento: ${e.message}")
            } finally {
                setLoadingState(false)
            }
        }
    }

    /**
     * Mostra histórico de pagamentos
     */
    private fun showPaymentHistory() {
        if (paymentHistory.isEmpty()) {
            showToast("Nenhum pagamento encontrado")
            return
        }
        
        // val intent = Intent(this, PaymentHistoryActivity::class.java)
        // startActivity(intent)
        showToast("Tela de histórico em desenvolvimento")
    }

    /**
     * Mostra diálogo de reembolso
     */
    private fun showRefundDialog() {
        val currentUser = LocalAuthManager.currentUser
        if (currentUser == null) return
        
        // Buscar pagamentos do usuário
        // val userPayments = paymentHistory.filter { it.clientId == currentUser.id }
        val userPayments = emptyList<com.example.loginapp.models.PaymentData>()
        
        if (userPayments.isEmpty()) {
            showToast("Nenhum pagamento encontrado para reembolso")
            return
        }
        
        val paymentOptions = userPayments.map { payment ->
            "Pedido #${payment.orderId.substringAfter("order_")} - R$ %.2f".format(payment.amount).replace(".", ",")
        }.toTypedArray()
        
        AlertDialog.Builder(this)
            .setTitle("Solicitar Reembolso")
            .setItems(paymentOptions) { _, which ->
                val selectedPayment = userPayments[which]
                showRefundReasonDialog(selectedPayment)
            }
            .show()
    }

    /**
     * Mostra diálogo de motivo do reembolso
     */
    private fun showRefundReasonDialog(payment: com.example.loginapp.models.PaymentData) {
        val reasons = arrayOf(
            "Serviço não realizado",
            "Serviço de baixa qualidade",
            "Problema com agendamento",
            "Outro motivo"
        )
        
        AlertDialog.Builder(this)
            .setTitle("Motivo do Reembolso")
            .setItems(reasons) { _, which ->
                val reason = reasons[which]
                requestRefund(payment.id, reason)
            }
            .show()
    }

    /**
     * Solicita reembolso
     */
    private fun requestRefund(paymentId: String, reason: String) {
        setLoadingState(true)
        
        lifecycleScope.launch {
            try {
                val result = PaymentManager.requestRefund(paymentId, reason)
                
                when (result) {
                    is PaymentManager.PaymentResult.Success -> {
                        showSuccessMessage("✅ Reembolso solicitado com sucesso!")
                        showSuccessMessage("📧 Você será notificado sobre o status")
                        
                        // Recarregar dados
                        loadPaymentData()
                    }
                    is PaymentManager.PaymentResult.PaymentCreated -> {
                        showSuccessMessage("✅ Reembolso solicitado com sucesso!")
                    }
                    is PaymentManager.PaymentResult.Error -> {
                        showErrorMessage("❌ ${result.message}")
                    }
                }
                
            } catch (e: Exception) {
                showErrorMessage("❌ Erro ao solicitar reembolso")
            } finally {
                setLoadingState(false)
            }
        }
    }

    /**
     * Mostra diálogo de saque
     */
    private fun showWithdrawalDialog() {
        val currentProvider = LocalAuthManager.currentProvider
        if (currentProvider == null) {
            showErrorMessage("Apenas prestadores podem solicitar saques")
            return
        }
        
        lifecycleScope.launch {
            try {
                val balance = PaymentManager.getProviderBalance(currentProvider.id)
                
                if (balance < 50.0) {
                    showErrorMessage("Saldo mínimo para saque é R$ 50,00")
                    return@launch
                }
                
                // Mostrar diálogo de valor
                showWithdrawalAmountDialog(balance)
                
            } catch (e: Exception) {
                showErrorMessage("Erro ao verificar saldo")
            }
        }
    }

    /**
     * Mostra diálogo de valor do saque
     */
    private fun showWithdrawalAmountDialog(balance: Double) {
        val maxAmount = balance.coerceAtMost(1000.0) // Máximo R$ 1000 por saque
        
        AlertDialog.Builder(this)
            .setTitle("Solicitar Saque")
            .setMessage("Saldo disponível: R$ %.2f\nValor máximo por saque: R$ %.2f".format(balance, maxAmount).replace(".", ","))
            .setPositiveButton("Continuar") { _, _ ->
                // TODO: Implementar tela de configuração de valor
                showToast("Funcionalidade de saque em desenvolvimento")
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Controla o estado de carregamento da interface
     */
    private fun setLoadingState(loading: Boolean) {
        isLoading = loading
        
        binding.loadingState.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnProcessPayment.isEnabled = !loading
        binding.btnHistory.isEnabled = !loading
        binding.btnRequestRefund.isEnabled = !loading
        binding.btnWithdraw.isEnabled = !loading
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