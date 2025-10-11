package com.example.loginapp

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.loginapp.adapters.DetailedOrdersAdapter
import com.example.loginapp.databinding.FragmentOrdersTabBinding
import com.example.loginapp.models.OrderData
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Fragment para gerenciar uma aba específica de pedidos
 */
class OrdersTabFragment : Fragment() {

    companion object {
        private const val ARG_TAB_TYPE = "tab_type"
        private const val ARG_IS_PROVIDER_CONTEXT = "is_provider_context"
        
        fun newInstance(tabType: TabType): OrdersTabFragment {
            return OrdersTabFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_TAB_TYPE, tabType.name)
                }
            }
        }
    }
    
    private var _binding: FragmentOrdersTabBinding? = null
    private val binding get() = _binding!!
    
    var tabType: TabType = TabType.IN_PROGRESS
    private var isProviderContext: Boolean = false
    private var orders = listOf<OrderData>()
    private lateinit var ordersAdapter: DetailedOrdersAdapter
    private val ordersViewModel: OrdersViewModel by lazy {
        androidx.lifecycle.ViewModelProvider(requireActivity())[OrdersViewModel::class.java]
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOrdersTabBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Obter tipo da aba dos argumentos
        arguments?.getString(ARG_TAB_TYPE)?.let { typeName ->
            tabType = TabType.valueOf(typeName)
        }
        // Obter contexto (provider vs cliente)
        isProviderContext = arguments?.getBoolean(ARG_IS_PROVIDER_CONTEXT, false) ?: false
        
        setupRecyclerView()
        setupClickListeners()
        setupEmptyState()

        // Observar pedidos do ViewModel compartilhado
        ordersViewModel.orders.observe(viewLifecycleOwner) { allOrders ->
            updateOrders(allOrders)
        }
    }
    
    private fun setupRecyclerView() {
        binding.rvOrders.layoutManager = LinearLayoutManager(requireContext())
        
        ordersAdapter = DetailedOrdersAdapter(
            context = requireContext(),
            orders = emptyList(),
            onOrderClick = { order -> onOrderClick(order) },
            onPrimaryActionClick = { order -> onPrimaryActionClick(order) },
            onSecondaryActionClick = { order -> onSecondaryActionClick(order) },
            isProviderContext = isProviderContext
        )
        
        binding.rvOrders.adapter = ordersAdapter
    }
    
    private fun setupClickListeners() {
        // Exibir botão "Novo Pedido" apenas no contexto de cliente
        binding.btnNewOrder.visibility = if (isProviderContext) View.GONE else View.VISIBLE
        binding.btnNewOrder.setOnClickListener {
            if (!isProviderContext) {
                val intent = Intent(requireContext(), CreateOrderActivity::class.java)
                startActivity(intent)
            }
        }
    }
    
    private fun setupEmptyState() {
        // Configurar mensagens específicas para cada aba
        when (tabType) {
            TabType.IN_PROGRESS -> {
                if (isProviderContext) {
                    binding.tvEmptyTitle.text = "Nenhum pedido aceito"
                    binding.tvEmptyMessage.text = "Aceite um pedido disponível para começar a atender."
                } else {
                    binding.tvEmptyTitle.text = "Nenhum pedido em andamento"
                    binding.tvEmptyMessage.text = "Você não tem pedidos sendo executados no momento."
                }
            }
            TabType.DISTRIBUTING -> {
                if (isProviderContext) {
                    binding.tvEmptyTitle.text = "Nenhum pedido disponível"
                    binding.tvEmptyMessage.text = "Novos pedidos aparecerão aqui para você aceitar."
                } else {
                    binding.tvEmptyTitle.text = "Nenhum pedido em distribuição"
                    binding.tvEmptyMessage.text = "Você não tem pedidos aguardando prestadores."
                }
            }
            TabType.COMPLETED -> {
                binding.tvEmptyTitle.text = "Nenhum pedido concluído"
                binding.tvEmptyMessage.text = "Você ainda não concluiu nenhum pedido."
            }
            TabType.CANCELLED -> {
                binding.tvEmptyTitle.text = "Nenhum pedido cancelado"
                binding.tvEmptyMessage.text = "Você não tem pedidos cancelados."
            }
        }
    }
    
    fun updateOrders(allOrders: List<OrderData>) {
        android.util.Log.d("OrdersTabFragment", "🔄 Atualizando aba: $tabType")
        android.util.Log.d("OrdersTabFragment", "📊 Total de pedidos recebidos: ${allOrders.size}")
        android.util.Log.d("OrdersTabFragment", "📋 Status dos pedidos recebidos: ${allOrders.map { it.status }}")
        
        // Filtrar pedidos baseado no tipo da aba
        orders = when (tabType) {
            TabType.IN_PROGRESS -> {
                val filtered = allOrders.filter { 
                    it.status == OrderData.STATUS_IN_PROGRESS || 
                    it.status == OrderData.STATUS_ASSIGNED 
                }
                android.util.Log.d("OrdersTabFragment", "🟢 Filtro IN_PROGRESS: ${filtered.size} pedidos")
                android.util.Log.d("OrdersTabFragment", "📋 Status filtrados: ${filtered.map { it.status }}")
                filtered
            }
            TabType.DISTRIBUTING -> {
                val filtered = allOrders.filter { 
                    it.status == OrderData.STATUS_DISTRIBUTING || 
                    it.status == OrderData.STATUS_PENDING 
                }
                android.util.Log.d("OrdersTabFragment", "🟡 Filtro DISTRIBUTING: ${filtered.size} pedidos")
                android.util.Log.d("OrdersTabFragment", "📋 Status filtrados: ${filtered.map { it.status }}")
                filtered
            }
            TabType.COMPLETED -> {
                val filtered = allOrders.filter { 
                    it.status == OrderData.STATUS_COMPLETED 
                }
                android.util.Log.d("OrdersTabFragment", "🟢 Filtro COMPLETED: ${filtered.size} pedidos")
                android.util.Log.d("OrdersTabFragment", "📋 Status filtrados: ${filtered.map { it.status }}")
                filtered
            }
            TabType.CANCELLED -> {
                val filtered = allOrders.filter { 
                    it.status == OrderData.STATUS_CANCELLED || 
                    it.status == OrderData.STATUS_EXPIRED 
                }
                android.util.Log.d("OrdersTabFragment", "🔴 Filtro CANCELLED: ${filtered.size} pedidos")
                android.util.Log.d("OrdersTabFragment", "📋 Status filtrados: ${filtered.map { it.status }}")
                filtered
            }
        }
        
        android.util.Log.d("OrdersTabFragment", "✅ Pedidos filtrados para aba $tabType: ${orders.size}")
        android.util.Log.d("OrdersTabFragment", "📋 IDs dos pedidos: ${orders.map { it.id }}")
        
        ordersAdapter.updateOrders(orders)
        updateUI()
        
        android.util.Log.d("OrdersTabFragment", "🎯 UI atualizada para aba $tabType - Empty: ${orders.isEmpty()}")
    }
    
    private fun updateUI() {
        if (orders.isEmpty()) {
            binding.emptyState.visibility = View.VISIBLE
            binding.rvOrders.visibility = View.GONE
        } else {
            binding.emptyState.visibility = View.GONE
            binding.rvOrders.visibility = View.VISIBLE
        }
    }
    
    fun setLoading(loading: Boolean) {
        binding.loadingState.visibility = if (loading) View.VISIBLE else View.GONE
        if (loading) {
            binding.rvOrders.visibility = View.GONE
            binding.emptyState.visibility = View.GONE
        }
    }
    
    private fun onOrderClick(order: OrderData) {
        // Cliente: se já estiver atribuído/em andamento, abrir chat direto com o prestador
        if (!isProviderContext && (order.status == OrderData.STATUS_ASSIGNED || order.status == OrderData.STATUS_IN_PROGRESS)) {
            val intent = Intent(requireContext(), ClientChatActivity::class.java)
            intent.putExtra("order_id", order.id)
            intent.putExtra("provider_id", order.assignedProvider)
            intent.putExtra("provider_name", order.assignedProviderName)
            intent.putExtra("order_title", order.serviceName.ifEmpty { order.description })
            startActivity(intent)
            return
        }

        val intent = Intent(requireContext(), OrderDetailsActivity::class.java)
        intent.putExtra("order_id", order.id)
        intent.putExtra("is_provider_view", isProviderContext)
        startActivity(intent)
    }
    
    private fun onPrimaryActionClick(order: OrderData) {
        if (isProviderContext) {
            when (order.status) {
                OrderData.STATUS_DISTRIBUTING, OrderData.STATUS_PENDING -> acceptOrder(order)
                OrderData.STATUS_ASSIGNED, OrderData.STATUS_IN_PROGRESS -> {
                    val intent = Intent(requireContext(), ProviderChatActivity::class.java)
                    intent.putExtra("order_id", order.id)
                    intent.putExtra("client_id", order.clientId)
                    intent.putExtra("client_name", order.clientName)
                    intent.putExtra("order_title", order.serviceName.ifEmpty { order.description })
                    startActivity(intent)
                }
                else -> onOrderClick(order)
            }
        } else {
            when (order.status) {
                OrderData.STATUS_ASSIGNED, OrderData.STATUS_IN_PROGRESS -> {
                    val intent = Intent(requireContext(), ClientChatActivity::class.java)
                    intent.putExtra("order_id", order.id)
                    intent.putExtra("provider_id", order.assignedProvider)
                    intent.putExtra("provider_name", order.assignedProviderName)
                    intent.putExtra("order_title", order.serviceName.ifEmpty { order.description })
                    startActivity(intent)
                }
                OrderData.STATUS_COMPLETED -> {
                    val intent = Intent(requireContext(), RatingActivity::class.java)
                    intent.putExtra("order_id", order.id)
                    startActivity(intent)
                }
                else -> onOrderClick(order)
            }
        }
    }

    private fun acceptOrder(order: OrderData) {
        lifecycleScope.launch {
            try {
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
                val current = auth.currentUser ?: run {
                    showToast("Usuário não autenticado")
                    return@launch
                }

                // Verificar estado atual e se ainda está disponível
                val docRef = db.collection("orders").document(order.id)
                val snapshot = docRef.get().await()
                if (!snapshot.exists()) {
                    showToast("Pedido não encontrado")
                    return@launch
                }
                val status = snapshot.getString("status") ?: OrderData.STATUS_DISTRIBUTING
                if (status != OrderData.STATUS_DISTRIBUTING && status != OrderData.STATUS_PENDING) {
                    showToast("Pedido indisponível para aceite")
                    return@launch
                }

                // Tentar atribuir ao prestador atual com condição (evitar corrida)
                com.google.firebase.firestore.FirebaseFirestore.getInstance().runTransaction { tx ->
                    val snap = tx.get(docRef)
                    val currentStatus = snap.getString("status") ?: OrderData.STATUS_DISTRIBUTING
                    val assigned = snap.getString("assignedProvider")
                    if ((currentStatus == OrderData.STATUS_DISTRIBUTING || currentStatus == OrderData.STATUS_PENDING) && assigned.isNullOrEmpty()) {
                        val providerName = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.displayName ?: "Prestador"
                        tx.update(docRef, mapOf(
                            "assignedProvider" to current.uid,
                            // Garantir persistência do nome do prestador que aceitou
                            "assignedProviderName" to providerName,
                            "status" to OrderData.STATUS_ASSIGNED,
                            "assignedAt" to com.google.firebase.Timestamp.now(),
                            "updatedAt" to com.google.firebase.Timestamp.now()
                        ))
                    } else {
                        throw IllegalStateException("Indisponível")
                    }
                }.await()

                showToast("✅ Pedido aceito com sucesso!")

            } catch (e: Exception) {
                showToast("❌ Não foi possível aceitar: ${e.message}")
            }
        }
    }
    
    private fun onSecondaryActionClick(order: OrderData) {
        onOrderClick(order)
    }
    
    /**
     * Mostra diálogo de cancelamento
     */
    private fun showCancelOrderDialog(order: OrderData) {
        val message = when (order.status) {
            "distributing" -> "Este pedido ainda está sendo distribuído para prestadores. Tem certeza que deseja cancelá-lo?"
            "pending" -> "Este pedido está aguardando resposta de prestadores. Tem certeza que deseja cancelá-lo?"
            "quotes_received" -> "Este pedido já recebeu cotações de prestadores. Tem certeza que deseja cancelá-lo?"
            "assigned" -> "Este pedido já foi atribuído a um prestador. Tem certeza que deseja cancelá-lo?"
            else -> "Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("❌ Cancelar Pedido")
            .setMessage(message)
            .setPositiveButton("Sim, Cancelar") { _, _ ->
                cancelOrder(order)
            }
            .setNegativeButton("Não, Manter") { dialog, _ ->
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
                // Cancelar o pedido no Firebase
                val orderManager = FirebaseOrderManager()
                val result = orderManager.cancelOrder(
                    orderId = order.id,
                    cancelledBy = "client",
                    reason = "Cancelado pelo cliente"
                )
                
                if (result.isSuccess) {
                    showToast("❌ Pedido cancelado com sucesso!")
                    // O ViewModel já observa mudanças automaticamente
                } else {
                    showToast("Erro ao cancelar pedido: ${result.exceptionOrNull()?.message}")
                }
                
            } catch (e: Exception) {
                showToast("Erro ao cancelar pedido: ${e.message}")
            }
        }
    }
    
    /**
     * Mostra uma mensagem toast
     */
    private fun showToast(message: String) {
        Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
    
    enum class TabType {
        IN_PROGRESS,    // Em Andamento
        DISTRIBUTING,   // Em Distribuição
        COMPLETED,      // Concluídos
        CANCELLED       // Cancelados
    }
}

