package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.loginapp.adapters.OrdersViewPagerAdapter
import com.example.loginapp.databinding.ActivityProviderOrdersBinding
import com.example.loginapp.models.OrderData
import com.google.android.material.tabs.TabLayoutMediator
import kotlinx.coroutines.launch
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * ProviderOrdersActivity - Tela de pedidos disponíveis para prestadores
 * 
 * Funcionalidades:
 * - Lista pedidos disponíveis para o prestador organizados em 4 abas
 * - Estatísticas de pedidos
 * - Ações de aceitar/enviar cotação
 */
class ProviderOrdersActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityProviderOrdersBinding
    
    // Variáveis para controle de estado
    private var isLoading = false
    private var allOrders = listOf<OrderData>()
    
    // Firebase
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private lateinit var authManager: FirebaseAuthManager
    
    // ViewPager e Adapter
    private lateinit var viewPagerAdapter: OrdersViewPagerAdapter
    private val fragments = mutableListOf<OrdersTabFragment>()
    private val ordersViewModel: OrdersViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityProviderOrdersBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inicializar managers
        authManager = FirebaseAuthManager(this)
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        setupViewPager()
        
        // Carregar dados
        loadOrders()
        
        // Configurar listener em tempo real
        setupRealtimeListener()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão refresh
        binding.btnRefresh.setOnClickListener {
            loadOrders()
        }
    }

    /**
     * Configura o ViewPager2 e TabLayout
     */
    private fun setupViewPager() {
        // Configurar ViewPager2
        viewPagerAdapter = OrdersViewPagerAdapter(this, isProviderContext = true)
        binding.viewPager.adapter = viewPagerAdapter
        
        // Configurar TabLayout
        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            // Prestador: 0 Disponíveis, 1 Aceitos, 2 Concluídos
            tab.text = when (position) {
                0 -> "Disponíveis"
                1 -> "Aceitos"
                2 -> "Concluídos"
                else -> ""
            }
        }.attach()
        
        // Obter referências dos fragments após a configuração
        // Atualizar fragments via ViewModel (substitui coleta manual por tag)
        binding.viewPager.post {
            ordersViewModel.setOrders(allOrders)
        }
    }

    /**
     * Carrega os pedidos disponíveis para o prestador
     */
    private fun loadOrders() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showErrorMessage("Usuário não autenticado")
            return
        }
        
        android.util.Log.d("ProviderOrders", "🔄 Carregando pedidos para prestador: ${currentUser.uid}")
        setLoadingState(true)
        
        lifecycleScope.launch {
            try {
                // Verificar se o usuário é prestador
                val userData = authManager.getLocalUserData()
                if (userData?.userType != FirebaseAuthManager.USER_TYPE_PROVIDER) {
                    showErrorMessage("Acesso restrito a prestadores")
                    return@launch
                }
                
                // Verificar status de verificação do prestador
                val verificationManager = ProviderVerificationManager()
                val verificationStatus = verificationManager.getVerificationStatus(currentUser.uid)
                // A PARTIR DE AGORA: NÃO BLOQUEAR MAIS O ACESSO POR FALTA DE APROVAÇÃO
                // Apenas informar ao usuário que a verificação não está aprovada, mas continuar carregando os pedidos
                if (verificationStatus == null || verificationStatus.status != ProviderVerificationManager.VerificationStatus.APPROVED) {
                    showSuccessMessage("⚠️ Sua verificação ainda não está aprovada. Você pode visualizar/aceitar pedidos assim mesmo.")
                }
                // Buscar pedidos atribuídos AO prestador + pedidos disponíveis (distributing/pending)
                val assignedSnap = db.collection("orders")
                    .whereEqualTo("assignedProvider", currentUser.uid)
                    .get()
                    .await()

                val availableSnap = db.collection("orders")
                    .whereIn("status", listOf(
                        OrderData.STATUS_DISTRIBUTING,
                        OrderData.STATUS_PENDING
                    ))
                    .get()
                    .await()
                
                val assignedOrders = assignedSnap.documents.mapNotNull { doc ->
                    try {
                        val order = doc.toObject(OrderData::class.java)?.copy(id = doc.id)
                        android.util.Log.d("ProviderOrders", "📄 Pedido carregado: ${order?.id} - Status: ${order?.status}")
                        order
                    } catch (e: Exception) {
                        android.util.Log.e("ProviderOrders", "❌ Erro ao carregar pedido ${doc.id}: ${e.message}")
                        null
                    }
                }

                val availableOrders = availableSnap.documents.mapNotNull { doc ->
                    try {
                        doc.toObject(OrderData::class.java)?.copy(id = doc.id)
                    } catch (e: Exception) { null }
                }

                // Merge e dedup por id
                val merged = (assignedOrders + availableOrders)
                allOrders = merged.distinctBy { it.id }
                
                android.util.Log.d("ProviderOrders", "✅ Total de pedidos carregados: ${allOrders.size}")
                android.util.Log.d("ProviderOrders", "📊 Status dos pedidos: ${allOrders.map { it.status }}")
                
                updateStatistics()
                ordersViewModel.setOrders(allOrders)
                setLoadingState(false)
                
                // Mostrar mensagem de sucesso se houver pedidos
                if (allOrders.isNotEmpty()) {
                    showSuccessMessage("📋 ${allOrders.size} pedido(s) carregado(s)")
                }
                
            } catch (e: Exception) {
                android.util.Log.e("ProviderOrders", "❌ Erro ao carregar pedidos: ${e.message}")
                android.util.Log.e("ProviderOrders", "Stack trace: ${e.stackTraceToString()}")
                setLoadingState(false)
                showErrorMessage("Erro ao carregar pedidos: ${e.message}")
            }
        }
    }

    /**
     * Atualiza as estatísticas
     */
    private fun updateStatistics() {
        val availableOrders = allOrders.count { 
            it.status == OrderData.STATUS_DISTRIBUTING || 
            it.status == OrderData.STATUS_PENDING
        }

        val acceptedOrders = allOrders.count { 
            it.status == OrderData.STATUS_ASSIGNED || 
            it.status == OrderData.STATUS_IN_PROGRESS
        }
        
        val completedOrders = allOrders.count { 
            it.status == OrderData.STATUS_COMPLETED 
        }

        binding.tvActiveOrders.text = acceptedOrders.toString()
        binding.tvCompletedOrders.text = completedOrders.toString()
        binding.tvTotalOrders.text = (acceptedOrders + completedOrders).toString()

        // Caso exista um campo dedicado para disponíveis no layout, poderemos atribuir aqui no futuro.
    }

    /**
     * Atualiza todos os fragments com os novos dados
     */
    private fun updateAllFragments() {
        fragments.forEach { fragment ->
            fragment.updateOrders(allOrders)
        }
    }

    /**
     * Mostra mensagem quando documentos estão pendentes
     */
    private fun showDocumentsPendingMessage(status: ProviderVerificationManager.VerificationStatus?) {
        setLoadingState(false)
        
        val message = when (status) {
            ProviderVerificationManager.VerificationStatus.PENDING -> {
                "📋 Para visualizar pedidos disponíveis, você precisa enviar seus documentos para verificação.\n\n" +
                "📄 Documentos necessários:\n" +
                "• Foto do rosto (selfie)\n" +
                "• RG (frente e verso) OU CNH (frente e verso)\n\n" +
                "⏱️ Após o envio, aguarde a aprovação da administração."
            }
            ProviderVerificationManager.VerificationStatus.UNDER_REVIEW -> {
                "⏳ Seus documentos estão sendo analisados pela administração.\n\n" +
                "📧 Você será notificado sobre o resultado em até 48 horas.\n\n" +
                "✅ Após a aprovação, você poderá visualizar e aceitar pedidos."
            }
            ProviderVerificationManager.VerificationStatus.REJECTED -> {
                "❌ Seus documentos foram rejeitados.\n\n" +
                "📋 Verifique as observações e envie novos documentos.\n\n" +
                "🔄 Após a correção, aguarde nova análise."
            }
            ProviderVerificationManager.VerificationStatus.EXPIRED -> {
                "⏰ Sua verificação expirou.\n\n" +
                "📄 É necessário enviar novos documentos para verificação.\n\n" +
                "🔄 Após o envio, aguarde a aprovação."
            }
            else -> {
                "📋 Para visualizar pedidos disponíveis, você precisa enviar seus documentos para verificação.\n\n" +
                "📄 Documentos necessários:\n" +
                "• Foto do rosto (selfie)\n" +
                "• RG (frente e verso) OU CNH (frente e verso)\n\n" +
                "⏱️ Após o envio, aguarde a aprovação da administração."
            }
        }
        
        // Mostrar mensagem no layout
        binding.apply {
            layoutEmptyMessage.visibility = View.VISIBLE
            tvEmptyMessage.text = message
            viewPager.visibility = View.GONE
            tabLayout.visibility = View.GONE
            
            // Botão para ir para upload de documentos
            btnUploadDocuments.visibility = View.VISIBLE
            btnUploadDocuments.setOnClickListener {
                val intent = Intent(this@ProviderOrdersActivity, DocumentUploadActivity::class.java)
                startActivity(intent)
            }
        }
    }

    /**
     * Configura listener em tempo real para atualizações
     */
    private fun setupRealtimeListener() {
        val currentUser = auth.currentUser ?: return

        // Listener 1: pedidos atribuídos ao prestador
        db.collection("orders")
            .whereEqualTo("assignedProvider", currentUser.uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("ProviderOrders", "❌ Erro no listener (assigned): ${error.message}")
                    return@addSnapshotListener
                }

                lifecycleScope.launch {
                    val assigned = snapshot?.documents?.mapNotNull { doc ->
                        try { doc.toObject(OrderData::class.java)?.copy(id = doc.id) } catch (_: Exception) { null }
                    } ?: emptyList()

                    // Listener 2: pedidos disponíveis (distributing/pending)
                    db.collection("orders")
                        .whereIn("status", listOf(
                            OrderData.STATUS_DISTRIBUTING,
                            OrderData.STATUS_PENDING
                        ))
                        .addSnapshotListener { availSnap, availErr ->
                            if (availErr != null) {
                                android.util.Log.e("ProviderOrders", "❌ Erro no listener (available): ${availErr.message}")
                                return@addSnapshotListener
                            }

                            lifecycleScope.launch {
                                val available = availSnap?.documents?.mapNotNull { doc ->
                                    try { doc.toObject(OrderData::class.java)?.copy(id = doc.id) } catch (_: Exception) { null }
                                } ?: emptyList()

                                allOrders = (assigned + available).distinctBy { it.id }
                                updateStatistics()
                                ordersViewModel.setOrders(allOrders)
                                android.util.Log.d("ProviderOrders", "🔄 Realtime merge: ${allOrders.size} pedidos")
                            }
                        }
                }
            }
    }

    /**
     * Define o estado de carregamento
     */
    private fun setLoadingState(loading: Boolean) {
        isLoading = loading
        fragments.forEach { fragment ->
            fragment.setLoading(loading)
        }
    }

    /**
     * Mostra mensagem de erro
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * Mostra mensagem de sucesso
     */
    private fun showSuccessMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    /**
     * Mostra mensagem de documentos pendentes
     */
    private fun showDocumentsPendingMessage(status: String) {
        setLoadingState(false)
        
        val message = when (status) {
            "pending" -> "⏳ Seus documentos estão sendo analisados pela equipe administrativa. Você receberá uma notificação quando forem aprovados."
            "rejected" -> "❌ Seus documentos foram rejeitados. Por favor, envie novamente documentos válidos e legíveis."
            else -> "📋 Envie seus documentos para começar a receber pedidos."
        }
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Documentos Pendentes")
            .setMessage(message)
            .setPositiveButton("Enviar Documentos") { _, _ ->
                val intent = Intent(this, ProviderDocumentUploadActivity::class.java)
                startActivity(intent)
            }
            .setNegativeButton("Fechar", null)
            .show()
    }
} 