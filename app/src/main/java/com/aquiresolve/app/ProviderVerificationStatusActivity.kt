package com.aquiresolve.app

import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.aquiresolve.app.databinding.ActivityProviderVerificationStatusBinding
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Locale

class ProviderVerificationStatusActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProviderVerificationStatusBinding
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("pt", "BR"))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProviderVerificationStatusBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Status de Verificação"
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.swipeRefresh.setOnRefreshListener { loadStatus() }
        loadStatus()
    }

    private fun loadStatus() {
        val uid = auth.currentUser?.uid ?: return
        binding.swipeRefresh.isRefreshing = true

        lifecycleScope.launch {
            try {
                val providerDoc = db.collection("providers").document(uid).get().await()
                val status = providerDoc.getString("verificationStatus") ?: "pending"
                val rejectionReason = providerDoc.getString("rejectionReason")
                val verificationNotes = providerDoc.getString("verificationNotes")

                renderStatus(status, rejectionReason, verificationNotes)

                // Histórico de revisões
                val historySnap = db.collection("provider_verifications")
                    .whereEqualTo("providerId", uid)
                    .orderBy("reviewedAt", Query.Direction.DESCENDING)
                    .limit(10)
                    .get().await()

                renderHistory(historySnap.documents)

            } catch (e: Exception) {
                Toast.makeText(this@ProviderVerificationStatusActivity,
                    "Erro ao carregar status: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun renderStatus(status: String, rejectionReason: String?, notes: String?) {
        when (status.lowercase()) {
            "approved" -> {
                binding.tvStatusIcon.text = "✅"
                binding.tvStatusTitle.text = "Verificação Aprovada"
                binding.tvStatusDescription.text =
                    "Parabéns! Seu perfil foi aprovado. Você pode receber pedidos normalmente."
                binding.cardStatus.setCardBackgroundColor(
                    ContextCompat.getColor(this, android.R.color.holo_green_light).let {
                        android.graphics.Color.argb(25, 76, 175, 80)
                    }
                )
                binding.cardStatus.strokeColor = ContextCompat.getColor(this, R.color.success_color)
            }
            "rejected" -> {
                binding.tvStatusIcon.text = "❌"
                binding.tvStatusTitle.text = "Verificação Reprovada"
                binding.tvStatusDescription.text =
                    if (!rejectionReason.isNullOrBlank()) rejectionReason
                    else "Seus documentos foram reprovados. Entre em contato com o suporte."
                binding.cardStatus.setCardBackgroundColor(
                    android.graphics.Color.argb(25, 211, 47, 47)
                )
                binding.cardStatus.strokeColor = ContextCompat.getColor(this, R.color.error_color)
            }
            else -> {
                binding.tvStatusIcon.text = "⏳"
                binding.tvStatusTitle.text = "Verificação em Análise"
                binding.tvStatusDescription.text =
                    "Seus documentos estão sendo analisados pela equipe AquiResolve. Isso pode levar até 2 dias úteis."
                binding.cardStatus.strokeColor =
                    ContextCompat.getColor(this, android.R.color.holo_orange_light)
            }
        }

        if (!notes.isNullOrBlank()) {
            binding.tvNotes.visibility = View.VISIBLE
            binding.tvNotes.text = "Obs: $notes"
        }
    }

    private fun renderHistory(docs: List<com.google.firebase.firestore.DocumentSnapshot>) {
        binding.containerHistory.removeAllViews()
        if (docs.isEmpty()) {
            binding.containerHistory.visibility = View.GONE
            binding.tvHistoryLabel.visibility = View.GONE
            return
        }

        binding.tvHistoryLabel.visibility = View.VISIBLE
        binding.containerHistory.visibility = View.VISIBLE

        for (doc in docs) {
            val s = doc.getString("status") ?: "pending"
            val reason = doc.getString("rejectionReason")
            val ts = doc.getTimestamp("reviewedAt")?.toDate()?.let { sdf.format(it) } ?: "—"

            val item = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, 8, 0, 8)
            }

            val icon = when (s.lowercase()) {
                "approved" -> "✅ Aprovado"
                "rejected" -> "❌ Reprovado"
                else -> "⏳ Pendente"
            }

            val title = TextView(this).apply {
                text = "$icon · $ts"
                textSize = 13f
                setTextColor(ContextCompat.getColor(this@ProviderVerificationStatusActivity, R.color.text_primary))
            }
            item.addView(title)

            if (!reason.isNullOrBlank()) {
                val sub = TextView(this).apply {
                    text = reason
                    textSize = 12f
                    setTextColor(ContextCompat.getColor(this@ProviderVerificationStatusActivity, R.color.text_secondary))
                    setPadding(0, 4, 0, 0)
                }
                item.addView(sub)
            }

            binding.containerHistory.addView(item)

            // Divider
            val divider = View(this).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 1
                ).also { it.setMargins(0, 4, 0, 4) }
                setBackgroundColor(ContextCompat.getColor(this@ProviderVerificationStatusActivity,
                    android.R.color.darker_gray))
                alpha = 0.2f
            }
            binding.containerHistory.addView(divider)
        }
    }
}
