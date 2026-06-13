package com.aquiresolve.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.aquiresolve.app.databinding.ActivityChecklistBinding
import com.aquiresolve.app.models.OsChecklistData
import com.google.firebase.Timestamp
import kotlinx.coroutines.launch

class ChecklistActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChecklistBinding
    private lateinit var checklistManager: FirebaseChecklistManager
    private var orderId: String? = null
    private var isProviderView = false
    private var existingChecklist: OsChecklistData? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChecklistBinding.inflate(layoutInflater)
        setContentView(binding.root)

        orderId = intent.getStringExtra("order_id")
        isProviderView = intent.getBooleanExtra("is_provider_view", false)

        if (orderId == null) {
            Toast.makeText(this, "Pedido não encontrado", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        window.statusBarColor = ContextCompat.getColor(this, R.color.secondary_color)
        checklistManager = FirebaseChecklistManager()

        setupClickListeners()
        loadExistingChecklist()
    }

    private fun loadExistingChecklist() {
        lifecycleScope.launch {
            val result = checklistManager.getChecklist(orderId!!)
            if (result.isSuccess) {
                existingChecklist = result.getOrNull()
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        binding.btnNext.setOnClickListener {
            if (validateStep1()) {
                saveChecklist()
            }
        }

        binding.btnSaveDraft.setOnClickListener {
            saveDraft()
        }
    }

    private fun validateStep1(): Boolean {
        if (binding.etExecutionDescription.text?.toString()?.trim().isNullOrEmpty()) {
            Toast.makeText(this, "Preencha a descrição detalhada do serviço realizado", Toast.LENGTH_LONG).show()
            binding.etExecutionDescription.error = "Campo obrigatório"
            return false
        }

        if (binding.rgProblemResolution.checkedRadioButtonId == -1) {
            Toast.makeText(this, "Selecione se o problema foi solucionado", Toast.LENGTH_LONG).show()
            return false
        }

        if (!binding.cbDeclarationAccepted.isChecked) {
            Toast.makeText(this, "Confirme a declaração de veracidade das informações", Toast.LENGTH_LONG).show()
            return false
        }

        return true
    }

    private fun collectAnswers(): Map<String, Boolean?> {
        return mapOf(
            "clientPresent" to binding.cbClientPresent.isChecked,
            "serviceMatches" to binding.cbServiceMatches.isChecked,
            "visibleDamage" to binding.cbVisibleDamage.isChecked,
            "materialAvailable" to binding.cbMaterialAvailable.isChecked,
            "clientObservations" to binding.cbClientObservations.isChecked,
            "executedAsRequested" to binding.cbExecutedAsRequested.isChecked,
            "additionalService" to binding.cbAdditionalService.isChecked,
            "partsReplaced" to binding.cbPartsReplaced.isChecked,
            "valueChanged" to binding.cbValueChanged.isChecked,
            "serviceCompleted" to binding.cbServiceCompleted.isChecked,
            "cleanAfterService" to binding.cbCleanAfterService.isChecked,
            "declarationAccepted" to binding.cbDeclarationAccepted.isChecked
        )
    }

    private fun getProblemResolution(): String {
        return when (binding.rgProblemResolution.checkedRadioButtonId) {
            R.id.rbResolved -> "resolved"
            R.id.rbReturnNeeded -> "return_needed"
            R.id.rbNotResolved -> "not_resolved"
            else -> ""
        }
    }

    private fun saveChecklist() {
        lifecycleScope.launch {
            try {
                val answers = collectAnswers()
                val description = binding.etExecutionDescription.text?.toString()?.trim() ?: ""
                val preExistingDamages = binding.etPreExistingDamages.text?.toString()?.trim() ?: ""
                val problemResolution = getProblemResolution()

                val result = checklistManager.saveChecklistAnswers(
                    orderId!!, answers, description, preExistingDamages, problemResolution
                )

                if (result.isSuccess) {
                    val intent = Intent(this@ChecklistActivity, PhotoEvidenceActivity::class.java).apply {
                        putExtra("order_id", orderId)
                        putExtra("is_provider_view", isProviderView)
                    }
                    startActivity(intent)
                } else {
                    Toast.makeText(this@ChecklistActivity, "Erro ao salvar checklist", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ChecklistActivity, "Erro: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun saveDraft() {
        lifecycleScope.launch {
            try {
                val answers = collectAnswers()
                val description = binding.etExecutionDescription.text?.toString()?.trim() ?: ""
                val preExistingDamages = binding.etPreExistingDamages.text?.toString()?.trim() ?: ""
                val problemResolution = getProblemResolution()

                val currentChecklist = existingChecklist
                val checklist = if (currentChecklist != null) {
                    currentChecklist.copy(
                        clientPresent = answers["clientPresent"],
                        serviceMatches = answers["serviceMatches"],
                        visibleDamage = answers["visibleDamage"],
                        materialAvailable = answers["materialAvailable"],
                        clientObservations = answers["clientObservations"],
                        executedAsRequested = answers["executedAsRequested"],
                        additionalService = answers["additionalService"],
                        partsReplaced = answers["partsReplaced"],
                        valueChanged = answers["valueChanged"],
                        serviceCompleted = answers["serviceCompleted"],
                        cleanAfterService = answers["cleanAfterService"],
                        preExistingDamages = preExistingDamages,
                        problemResolution = problemResolution,
                        declarationAccepted = answers["declarationAccepted"],
                        executionDescription = description,
                        updatedAt = Timestamp.now()
                    )
                } else {
                    OsChecklistData(
                        orderId = orderId!!,
                        status = OsChecklistData.STATUS_CHECKLIST_PENDING,
                        clientPresent = answers["clientPresent"],
                        serviceMatches = answers["serviceMatches"],
                        visibleDamage = answers["visibleDamage"],
                        materialAvailable = answers["materialAvailable"],
                        clientObservations = answers["clientObservations"],
                        executedAsRequested = answers["executedAsRequested"],
                        additionalService = answers["additionalService"],
                        partsReplaced = answers["partsReplaced"],
                        valueChanged = answers["valueChanged"],
                        serviceCompleted = answers["serviceCompleted"],
                        cleanAfterService = answers["cleanAfterService"],
                        preExistingDamages = preExistingDamages,
                        problemResolution = problemResolution,
                        declarationAccepted = answers["declarationAccepted"],
                        executionDescription = description,
                        createdAt = Timestamp.now(),
                        updatedAt = Timestamp.now()
                    )
                }

                checklistManager.createOrUpdateChecklist(checklist)
                Toast.makeText(this@ChecklistActivity, "Rascunho salvo!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@ChecklistActivity, "Erro ao salvar rascunho", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
