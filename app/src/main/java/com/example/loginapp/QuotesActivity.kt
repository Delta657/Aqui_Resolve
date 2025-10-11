package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.loginapp.adapters.QuotesAdapter
import com.example.loginapp.databinding.ActivityQuotesBinding
import com.example.loginapp.models.OrderData
import com.example.loginapp.models.QuoteData
import kotlinx.coroutines.launch
import android.widget.Toast

/**
 * QuotesActivity - Tela de cotações recebidas
 * 
 * Funcionalidades:
 * - Lista todas as cotações recebidas para um pedido
 * - Filtros por preço, avaliação, tempo
 * - Ações de aceitar/rejeitar cotações
 * - Visualização de perfil do prestador
 */
class QuotesActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityQuotesBinding
    
    // Variáveis para controle de estado
    private var orderId: String? = null
    private var order: OrderData? = null
    private var allQuotes = listOf<QuoteData>()
    private var filteredQuotes = listOf<QuoteData>()
    private var currentFilter = QuoteFilter.ALL
    
    // Adapter da lista
    private lateinit var quotesAdapter: QuotesAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityQuotesBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Obter dados da intent
        orderId = intent.getStringExtra("order_id")
        
        if (orderId == null) {
            showErrorMessage("Pedido não encontrado")
            finish()
            return
        }
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        setupRecyclerView()
        
        // Carregar dados
        loadQuotes()
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
        
        // Botão ordenar
        binding.btnSort.setOnClickListener {
            showSortDialog()
        }
        
        // Botão refresh no estado vazio
        binding.btnRefreshQuotes.setOnClickListener {
            loadQuotes()
        }
    }

    /**
     * Configura o RecyclerView
     */
    private fun setupRecyclerView() {
        binding.rvQuotes.layoutManager = LinearLayoutManager(this)
        
        quotesAdapter = QuotesAdapter(
            quotes = emptyList(),
            onQuoteClick = { quote -> onQuoteClick(quote) },
            onViewProfileClick = { quote -> onViewProfileClick(quote) },
            onAcceptClick = { quote -> onAcceptClick(quote) }
        )
        
        binding.rvQuotes.adapter = quotesAdapter
    }

    /**
     * Carrega as cotações do pedido
     */
    private fun loadQuotes() {
        // TODO: Implementar carregamento de cotações do Firebase
        showSuccessMessage("Carregando cotações...")
    }

    /**
     * Trata clique em uma cotação
     */
    private fun onQuoteClick(quote: QuoteData) {
        // TODO: Implementar visualização detalhada da cotação
        showSuccessMessage("Visualizando cotação...")
    }

    /**
     * Trata clique em ver perfil do prestador
     */
    private fun onViewProfileClick(quote: QuoteData) {
        // TODO: Implementar visualização do perfil do prestador
        showSuccessMessage("Visualizando perfil do prestador...")
    }

    /**
     * Trata aceitação de uma cotação
     */
    private fun onAcceptClick(quote: QuoteData) {
        // TODO: Implementar aceitação de cotação
        showSuccessMessage("Cotação aceita!")
    }

    /**
     * Mostra diálogo de ordenação
     */
    private fun showSortDialog() {
        // TODO: Implementar diálogo de ordenação
        showSuccessMessage("Ordenação em desenvolvimento...")
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
     * Enum para filtros de cotação
     */
    enum class QuoteFilter {
        ALL, LOWEST_PRICE, BEST_RATING, FASTEST_DELIVERY
    }
} 