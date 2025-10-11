package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.loginapp.databinding.ActivityProviderHomeBinding

/**
 * ProviderHomeActivity - Tela principal para prestadores
 * 
 * Interface específica para prestadores com:
 * - Dashboard de pedidos
 * - Estatísticas de trabalho
 * - Pedidos disponíveis
 * - Histórico de serviços
 * - Configurações de disponibilidade
 */
class ProviderHomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProviderHomeBinding
    private lateinit var authManager: FirebaseAuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityProviderHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        authManager = FirebaseAuthManager(this)
        
        setupUI()
        setupClickListeners()
        loadProviderData()
    }

    /**
     * Configura a interface específica para prestadores
     */
    private fun setupUI() {
        // Status bar personalizada para prestadores
        window.statusBarColor = ContextCompat.getColor(this, R.color.secondary_color)
        
        // Configurar título específico para prestadores
        binding.tvWelcome.text = "Bem-vindo de volta!"
        binding.tvDashboardTitle.text = "Dashboard"
        binding.tvAvailableOrders.text = "Pedidos Disponíveis"
    }

    /**
     * Configura os listeners específicos para prestadores
     */
    private fun setupClickListeners() {
        // Barra de pesquisa de pedidos
        binding.etSearch.setOnEditorActionListener { _, _, _ ->
            performSearch()
            true
        }
        
        // Botão de filtro
        binding.ivFilter.setOnClickListener {
            showFilterDialog()
        }
        
        // Botão de disponibilidade
        binding.btnAvailability.setOnClickListener {
            toggleAvailability()
        }
        
        // Botão de ver todos os pedidos
        binding.btnViewAllOrders.setOnClickListener {
            val intent = Intent(this, ProviderOrdersActivity::class.java)
            startActivity(intent)
        }
        
        // Botão de ver orçamentos
        binding.btnViewQuotes.setOnClickListener {
            // val intent = Intent(this, QuotesActivity::class.java)
            // startActivity(intent)
            showToast("💰 Tela de orçamentos em desenvolvimento")
        }
        
        // Navegação inferior específica para prestadores
        binding.bottomNavigation.menu.clear()
        binding.bottomNavigation.inflateMenu(R.menu.bottom_nav_menu_provider)
        binding.bottomNavigation.setOnItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.navigation_home -> {
                    // Já estamos na home
                    true
                }
                R.id.navigation_orders -> {
                    // Ir para lista de pedidos do prestador
                    val intent = Intent(this, ProviderOrdersActivity::class.java)
                    startActivity(intent)
                    true
                }
                R.id.navigation_profile -> {
                    val intent = Intent(this, ProfileActivity::class.java)
                    startActivity(intent)
                    true
                }
                else -> false
            }
        }
        
        // Botão de notificações
        binding.btnNotifications.setOnClickListener {
            showNotifications()
        }
        
        // Botão de configurações
        binding.btnSettings.setOnClickListener {
            showSettings()
        }
    }

    /**
     * Carrega os dados do prestador
     */
    private fun loadProviderData() {
        val user = authManager.getLocalUserData()
        if (user != null) {
            val firstName = user.fullName.ifEmpty { user.username }.trim().split(" ").firstOrNull() ?: "Prestador"
            binding.tvWelcome.text = "Bem-vindo de volta, $firstName!"
        }
        
        // TODO: Carregar estatísticas do prestador
        loadProviderStats()
        
        // TODO: Carregar pedidos disponíveis
        loadAvailableOrders()
    }

    /**
     * Carrega as estatísticas do prestador
     */
    private fun loadProviderStats() {
        // TODO: Carregar estatísticas do Firestore
        binding.tvCompletedServices.text = "127"
        binding.tvActiveOrders.text = "3"
        binding.tvRating.text = "4.8"
        binding.tvEarnings.text = "R$ 2.450"
    }

    /**
     * Carrega os pedidos disponíveis
     */
    private fun loadAvailableOrders() {
        // TODO: Implementar carregamento de pedidos do Firestore
        // Por enquanto, mostra mensagem de exemplo
        binding.tvNoAvailableOrders.text = "Nenhum pedido disponível no momento."
    }

    /**
     * Executa a pesquisa de pedidos
     */
    private fun performSearch() {
        val query = binding.etSearch.text.toString().trim()
        if (query.isNotEmpty()) {
            showToast("🔍 Pesquisando por: $query")
            // TODO: Implementar pesquisa real
        }
    }

    /**
     * Mostra o diálogo de filtros
     */
    private fun showFilterDialog() {
        showToast("🔧 Filtros em desenvolvimento...")
        // TODO: Implementar filtros específicos para prestadores
    }

    /**
     * Alterna a disponibilidade do prestador
     */
    private fun toggleAvailability() {
        // TODO: Implementar toggle de disponibilidade
        val isAvailable = binding.btnAvailability.text.toString().contains("Disponível")
        if (isAvailable) {
            binding.btnAvailability.text = "🔴 Indisponível"
            binding.btnAvailability.setBackgroundColor(ContextCompat.getColor(this, R.color.error_color))
            showToast("Você está agora indisponível")
        } else {
            binding.btnAvailability.text = "🟢 Disponível"
            binding.btnAvailability.setBackgroundColor(ContextCompat.getColor(this, R.color.success_color))
            showToast("Você está agora disponível")
        }
    }

    /**
     * Mostra notificações
     */
    private fun showNotifications() {
        showToast("🔔 Notificações em desenvolvimento...")
        // TODO: Implementar tela de notificações
    }

    /**
     * Mostra configurações
     */
    private fun showSettings() {
        showToast("⚙️ Configurações em desenvolvimento...")
        // TODO: Implementar tela de configurações
    }

    /**
     * Exibe uma mensagem toast
     */
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        // Limpar recursos se necessário
    }
}
