package com.aquiresolve.app

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.aquiresolve.app.databinding.ActivityForgotPasswordBinding
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private var isLoading = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupClickListeners()
    }

    private fun setupUI() {
        // Configurar status bar transparente
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        }
    }

    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            onBackPressed()
        }

        // Botão enviar instruções
        binding.btnSendRecovery.setOnClickListener {
            sendRecoveryEmail()
        }

        // Link voltar para login
        binding.tvBackToLogin.setOnClickListener {
            finish()
        }
    }

    private fun sendRecoveryEmail() {
        if (isLoading) return

        val email = binding.etEmail.text.toString().trim()

        // Validar email
        if (!validateEmail(email)) {
            return
        }

        setLoadingState(true)

        lifecycleScope.launch {
            try {
                val auth = FirebaseConfig.getAuth()
                auth.sendPasswordResetEmail(email)
                
                setLoadingState(false)
                showSuccessMessage()
                
            } catch (e: Exception) {
                setLoadingState(false)
                handleError(e.message ?: "Erro ao enviar email de recuperação")
            }
        }
    }

    private fun validateEmail(email: String): Boolean {
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email é obrigatório"
            binding.etEmail.requestFocus()
            return false
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Email inválido"
            binding.etEmail.requestFocus()
            return false
        }

        binding.tilEmail.error = null
        return true
    }

    private fun setLoadingState(loading: Boolean) {
        isLoading = loading

        binding.btnSendRecovery.apply {
            isEnabled = !loading
            text = if (loading) "Enviando..." else "Enviar Instruções"
        }

        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
    }

    private fun showSuccessMessage() {
        binding.cardRecovery.visibility = View.GONE
        binding.successLayout.visibility = View.VISIBLE
        
        Toast.makeText(this, "✅ Email de recuperação enviado com sucesso!", Toast.LENGTH_LONG).show()
    }

    private fun handleError(errorMessage: String) {
        when {
            errorMessage.contains("no user record") -> {
                binding.tilEmail.error = "Email não encontrado"
                binding.etEmail.requestFocus()
            }
            errorMessage.contains("network") -> {
                Toast.makeText(this, "❌ Erro de conexão. Verifique sua internet.", Toast.LENGTH_LONG).show()
            }
            else -> {
                Toast.makeText(this, "❌ $errorMessage", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onBackPressed() {
        super.onBackPressed()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
} 