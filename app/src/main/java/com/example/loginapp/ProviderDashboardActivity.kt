package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.loginapp.adapters.ProviderDashboardPagerAdapter
import com.example.loginapp.databinding.ActivityProviderDashboardBinding
import com.google.android.material.tabs.TabLayoutMediator

/**
 * ProviderDashboardActivity - Dashboard do prestador de serviços
 * 
 * Esta activity gerencia:
 * - Lista de pedidos disponíveis para o prestador
 * - Aceitar ou recusar pedidos
 * - Visualizar detalhes dos pedidos
 * - Gerenciar status dos serviços
 */
class ProviderDashboardActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityProviderDashboardBinding
    private lateinit var authManager: FirebaseAuthManager
    private lateinit var pagerAdapter: ProviderDashboardPagerAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar managers
        authManager = FirebaseAuthManager(this)
        
        // Inicializar ViewBinding
        binding = ActivityProviderDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Configurar a interface
        setupUI()
        setupViewPager()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        supportActionBar?.title = "Dashboard Prestador"
        
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
    }

    /**
     * Configura o ViewPager2 com as abas
     */
    private fun setupViewPager() {
        pagerAdapter = ProviderDashboardPagerAdapter(this)
        binding.viewPager.adapter = pagerAdapter
        
        // Configurar as abas
        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            when (position) {
                0 -> tab.text = "Pedidos"
                1 -> tab.text = "Perfil"
            }
        }.attach()
        
        // Verificar se há uma aba padrão especificada
        val defaultTab = intent.getIntExtra("default_tab", 0)
        if (defaultTab in 0..1) {
            binding.viewPager.currentItem = defaultTab
        }
        
        // Verificar se há mensagem de boas-vindas
        val showWelcomeMessage = intent.getBooleanExtra("show_welcome_message", false)
        if (showWelcomeMessage) {
            val welcomeMessage = intent.getStringExtra("welcome_message") ?: "Bem-vindo!"
            showToast(welcomeMessage)
        }
    }


    /**
     * Exibe uma mensagem toast para o usuário
     */
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    /**
     * Limpa os recursos quando a activity é destruída
     */
    override fun onDestroy() {
        super.onDestroy()
        // Limpar recursos se necessário
    }
}
