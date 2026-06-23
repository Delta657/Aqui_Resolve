package com.aquiresolve.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.aquiresolve.app.databinding.ActivityAssistantBinding
import kotlinx.coroutines.launch

/**
 * Assistente AquiResolve (plano 06). O cliente descreve o problema em linguagem natural e a IA
 * (via proxy no backend — [AssistantClient]) identifica o nicho do catálogo e direciona para o
 * fluxo de pedido. A IA é conveniência: qualquer falha cai no fallback "Ver todos os serviços",
 * nunca bloqueando a contratação.
 */
class AssistantActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAssistantBinding
    private var lastDescription = ""

    companion object {
        /** Extra opcional: pré-preenche a descrição (ex.: vindo da busca sem resultado). */
        const val EXTRA_PREFILL = "prefill_description"
        // Abaixo deste valor a IA "não tem certeza" → ainda sugerimos, mas sem insistir.
        private const val CONFIDENCE_HINT = 0.35
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!FirebaseConfig.isInitialized()) {
            FirebaseConfig.initialize(this)
        }
        binding = ActivityAssistantBinding.inflate(layoutInflater)
        setContentView(binding.root)

        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
        logEvent("ia_assistente_open", null)

        binding.btnBack.setOnClickListener { finish() }
        binding.btnAsk.setOnClickListener { ask() }
        binding.btnSeeAll.setOnClickListener { openServices() }

        // Garante o catálogo de nichos em cache (a IA classifica DENTRO dessa lista).
        lifecycleScope.launch {
            try {
                CatalogRepository.load()
            } catch (_: Exception) {
            }
        }

        val prefill = intent.getStringExtra(EXTRA_PREFILL)?.trim().orEmpty()
        if (prefill.isNotEmpty()) {
            binding.etDescription.setText(prefill)
            binding.etDescription.setSelection(prefill.length)
            ask()
        }
    }

    private fun ask() {
        val description = binding.etDescription.text.toString().trim()
        if (description.length < 3) {
            binding.etDescription.error = "Descreva um pouco mais o que aconteceu"
            return
        }
        lastDescription = description
        hideKeyboard()
        showLoading(true)
        binding.resultCard.visibility = View.GONE

        lifecycleScope.launch {
            val niches = CatalogRepository.cachedNicheNames().ifEmpty {
                try {
                    CatalogRepository.load()
                } catch (_: Exception) {
                }
                CatalogRepository.cachedNicheNames()
            }

            if (niches.isEmpty()) {
                showLoading(false)
                showResult(message = "Não consegui carregar os serviços agora. Veja todos os serviços disponíveis.", niche = null)
                return@launch
            }

            val result = AssistantClient.classify(description, niches)
            showLoading(false)
            when (result) {
                is AssistantClient.Result.Ok -> {
                    val s = result.suggestion
                    logEvent("ia_nicho_sugerido", Bundle().apply {
                        putString("niche", s.niche ?: "null")
                        putDouble("confidence", s.confidence)
                    })
                    showResult(message = s.message, niche = s.niche, confidence = s.confidence)
                }
                is AssistantClient.Result.Error -> {
                    showResult(message = result.message, niche = null)
                }
            }
        }
    }

    private fun showResult(message: String, niche: String?, confidence: Double = 0.0) {
        binding.resultCard.visibility = View.VISIBLE
        binding.tvResultMessage.text = message

        if (niche != null) {
            binding.tvNicheChip.visibility = View.VISIBLE
            binding.tvNicheChip.text = niche
            binding.btnContinue.visibility = View.VISIBLE
            val cta = if (confidence in 0.0..CONFIDENCE_HINT) "Acho que é isso — continuar" else "Sim, continuar"
            binding.btnContinue.text = cta
            binding.btnContinue.setOnClickListener {
                logEvent("ia_sugestao_aceita", Bundle().apply { putString("niche", niche) })
                startActivity(
                    Intent(this, CreateOrderActivity::class.java)
                        .putExtra("service_category_name", niche)
                )
            }
        } else {
            binding.tvNicheChip.visibility = View.GONE
            binding.btnContinue.visibility = View.GONE
        }
    }

    private fun openServices() {
        val intent = Intent(this, ServicesActivity::class.java)
        if (lastDescription.isNotBlank()) intent.putExtra("search_query", lastDescription)
        startActivity(intent)
    }

    private fun showLoading(show: Boolean) {
        binding.loadingLayout.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnAsk.isEnabled = !show
    }

    private fun hideKeyboard() {
        try {
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(binding.etDescription.windowToken, 0)
        } catch (_: Exception) {
        }
    }

    private fun logEvent(name: String, params: Bundle?) {
        try {
            FirebaseConfig.getAnalytics()?.logEvent(name, params)
        } catch (_: Exception) {
        }
    }
}
