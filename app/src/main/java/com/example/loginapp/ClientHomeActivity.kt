package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.loginapp.databinding.ActivityClientHomeBinding

/**
 * ClientHomeActivity - Tela principal para clientes
 * 
 * Interface específica para clientes com:
 * - Barra de pesquisa de serviços
 * - Categorias de serviços disponíveis
 * - Histórico de pedidos
 * - Perfil do cliente
 * - Notificações de prestadores
 */
class ClientHomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityClientHomeBinding
    private lateinit var authManager: FirebaseAuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Garantir Firebase inicializado ao abrir diretamente esta Activity
        if (!FirebaseConfig.isInitialized()) {
            FirebaseConfig.initialize(this)
        }

        binding = ActivityClientHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        authManager = FirebaseAuthManager(this)
        
        setupUI()
        setupClickListeners()
        loadClientData()
    }

    /**
     * Configura a interface específica para clientes
     */
    private fun setupUI() {
        // Status bar personalizada para clientes
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
        
        // Configurar título específico para clientes
        binding.tvWelcome.text = "Olá! Que tipo de serviço você precisa?"
        binding.tvCategoriesTitle.text = "Serviços Disponíveis"
        binding.tvRecentOrders.text = "Seus Pedidos Recentes"
    }

    /**
     * Configura os listeners específicos para clientes
     */
    private fun setupClickListeners() {
        // Barra de pesquisa
        binding.etSearch.setOnEditorActionListener { _, _, _ ->
            performSearch()
            true
        }
        
        // Botão de filtro
        binding.ivFilter.setOnClickListener {
            showFilterDialog()
        }
        
        // Botão de notificações
        binding.btnNotifications.setOnClickListener {
            showNotifications()
        }
        
        // Botão de perfil
        binding.btnProfile.setOnClickListener {
            navigateToProfile()
        }
        
        // Categorias de serviços
        binding.cardElectrician.setOnClickListener {
            navigateToCreateOrder("Elétrica")
        }
        
        binding.cardPlumber.setOnClickListener {
            navigateToCreateOrder("Hidráulica")
        }
        
        binding.cardPainter.setOnClickListener {
            navigateToCreateOrder("Pintura")
        }
        
        binding.cardCleaning.setOnClickListener {
            navigateToCreateOrder("Limpeza")
        }
        
        binding.cardGardening.setOnClickListener {
            navigateToCreateOrder("Jardinagem")
        }
        
        binding.cardMore.setOnClickListener {
            showAllCategories()
        }
        
        // Navegação inferior específica para clientes
        binding.bottomNavigation.setOnItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.navigation_home -> {
                    // Já estamos na home
                    true
                }
                R.id.navigation_orders -> {
                    val intent = Intent(this, ClientOrdersActivity::class.java)
                    startActivity(intent)
                    true
                }
                R.id.navigation_services -> {
                    val intent = Intent(this, ServicesActivity::class.java)
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
    }

    /**
     * Carrega dados do cliente
     */
    private fun loadClientData() {
        val user = authManager.getLocalUserData() ?: return
        // Se já é prestador, ajustar CTA para voltar para área do prestador no Profile
        // A lógica de exibir "voltar para prestador" está centralizada em ProfileActivity
    }

    /**
     * Realiza busca de serviços
     */
    private fun performSearch() {
        val searchQuery = binding.etSearch.text.toString().trim()
        if (searchQuery.isNotEmpty()) {
            // TODO: Implementar busca real
            showToast("🔍 Buscando por: $searchQuery")
        }
    }

    /**
     * Mostra diálogo de filtros
     */
    private fun showFilterDialog() {
        showToast("🔧 Filtros em desenvolvimento...")
    }

    /**
     * Mostra notificações
     */
    private fun showNotifications() {
        showToast("🔔 Notificações em desenvolvimento...")
    }

    /**
     * Navega para o perfil
     */
    private fun navigateToProfile() {
        val intent = Intent(this, ProfileActivity::class.java)
        startActivity(intent)
    }

    /**
     * Navega para criar pedido
     */
    private fun navigateToCreateOrder(serviceType: String) {
        val intent = Intent(this, CreateOrderActivity::class.java).apply {
            putExtra("service_category_name", serviceType)
        }
        startActivity(intent)
    }

    /**
     * Mostra todas as categorias
     */
    private fun showAllCategories() {
        val intent = Intent(this, ServicesActivity::class.java)
        startActivity(intent)
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
