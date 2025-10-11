package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.loginapp.databinding.ActivityProviderSignupBinding
import com.google.android.material.chip.Chip
import kotlinx.coroutines.launch
import androidx.appcompat.app.AlertDialog
import com.example.loginapp.R
import com.example.loginapp.models.SavedAddress
import com.google.firebase.firestore.GeoPoint

/**
 * ProviderSignUpActivity - Tela de cadastro de prestadores de serviço
 * 
 * Esta activity gerencia o cadastro de prestadores com:
 * - Informações pessoais obrigatórias
 * - Endereço com CEP
 * - Seleção de nichos de serviços
 * - Dados bancários
 * - Validações específicas para prestadores
 */
class ProviderSignUpActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityProviderSignupBinding
    
    // Variáveis para controle de estado
    private var isLoading = false
    private val selectedServices = mutableSetOf<String>()
    private var isFromProfile = false // Indica se veio do perfil do cliente
    private lateinit var authManager: FirebaseAuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityProviderSignupBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inicializar managers
        authManager = FirebaseAuthManager(this)
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        setupServiceChips()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar para ser transparente
        window.statusBarColor = ContextCompat.getColor(this, android.R.color.transparent)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        }
        
        // Configurar foco inicial no campo de nome
        binding.etFullName.requestFocus()
        
        // Aplicar formatação automática
        com.example.loginapp.utils.TextFormatter.applyCepFormatting(binding.etCep)
        com.example.loginapp.utils.TextFormatter.applyCpfFormatting(binding.etCpf)
        com.example.loginapp.utils.TextFormatter.applyPhoneFormatting(binding.etPhone)
        
        // Configurar spinner de estados
        setupStateSpinner()
    }

    /**
     * Configura o spinner de estados
     */
    private fun setupStateSpinner() {
        val states = com.example.loginapp.utils.BrazilianStates.getFormattedStates()
        val adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, states)
        binding.spinnerState.setAdapter(adapter)
        
        // Configurar para mostrar a lista ao clicar
        binding.spinnerState.setOnClickListener {
            binding.spinnerState.showDropDown()
        }
        
        // Listener para quando um estado for selecionado
        binding.spinnerState.setOnItemClickListener { _, _, position, _ ->
            val selectedState = states[position]
            // Extrair apenas a sigla (primeiros 2 caracteres)
            val stateCode = selectedState.substring(0, 2)
            android.util.Log.d("ProviderSignUp", "Estado selecionado: $selectedState (Código: $stateCode)")
        }
        
        // Configurar threshold para mostrar sugestões
        binding.spinnerState.threshold = 1
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão de cadastro
        binding.btnSignUp.setOnClickListener {
            performSignUp()
        }
        
        // Link para voltar ao login
        binding.tvSignIn.setOnClickListener {
            finish()
        }
        
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    /**
     * Configura os chips de serviços
     */
    private fun setupServiceChips() {
        // Para o novo layout, os serviços são inseridos manualmente
        // Esta função pode ser expandida no futuro
    }

    /**
     * Executa o processo de cadastro
     */
    private fun performSignUp() {
        // Verificar se já está processando um cadastro
        if (isLoading) return
        
        android.util.Log.d("ProviderSignUp", "=== INICIANDO PROCESSO DE CADASTRO ===")
        
        // Obter dados dos campos
        val fullName = binding.etFullName.text?.toString()?.trim() ?: ""
        val phone = binding.etPhone.text?.toString()?.trim() ?: ""
        val cpf = binding.etCpf.text?.toString()?.trim() ?: ""
        val cep = binding.etCep.text?.toString()?.trim() ?: ""
        val street = binding.etStreet.text?.toString()?.trim() ?: ""
        val number = binding.etNumber.text?.toString()?.trim() ?: ""
        val complement = binding.etComplement.text?.toString()?.trim()
        val city = binding.etCity.text?.toString()?.trim() ?: ""
        val state = binding.spinnerState.text?.toString()?.trim() ?: ""
        val termsAccepted = binding.cbTerms.isChecked
        
        // Obter dados do usuário logado
        val currentUser = authManager.getLocalUserData()
        if (currentUser == null) {
            showToast("❌ Usuário não encontrado. Faça login novamente.")
            return
        }
        
        android.util.Log.d("ProviderSignUp", "Dados coletados:")
        android.util.Log.d("ProviderSignUp", "- Email: ${currentUser.email}")
        android.util.Log.d("ProviderSignUp", "- Termos aceitos: $termsAccepted")
        
        // Validar dados de entrada
        if (!validateInputs(termsAccepted) ||
            !validateProviderDetails(fullName, phone, cpf, cep, street, number, city, state)) {
            android.util.Log.e("ProviderSignUp", "❌ VALIDAÇÃO FALHOU - Dados inválidos")
            return
        }
        
        android.util.Log.d("ProviderSignUp", "✅ VALIDAÇÃO PASSOU - Dados válidos")
        
        // Limpar erros anteriores
        clearErrors()
        
        // Iniciar processo de cadastro
        setLoadingState(true)
        android.util.Log.d("ProviderSignUp", "🔄 INICIANDO CRIAÇÃO DE CONTA...")
        
        // Extrair sigla do estado se necessário
        val stateCode = if (state.contains(" - ")) {
            state.substring(0, 2) // Extrair sigla do formato "SP - São Paulo"
        } else {
            state
        }
        
        // Criar conta de prestador
        val selectedServices = getSelectedServices()
        createProviderAccountFull(
            email = currentUser.email,
            password = "", // Não precisamos da senha
            fullName = fullName,
            phone = phone,
            cpf = cpf,
            address = FirebaseProviderManager.Address(
                cep = cep,
                street = street,
                number = number,
                complement = complement,
                city = city,
                state = stateCode
            ),
            bank = FirebaseProviderManager.BankInfo(
                bankName = "",
                agency = "",
                account = ""
            ),
            services = selectedServices
        )
    }

    private fun getSelectedServices(): List<String> {
        val chips = mutableListOf<String>()
        val group = binding.chipGroupServices
        for (i in 0 until group.childCount) {
            val view = group.getChildAt(i)
            if (view is com.google.android.material.chip.Chip && view.isChecked) {
                chips.add(view.text.toString())
            }
        }
        return chips
    }

    /**
     * Valida os campos de entrada
     */
    private fun validateInputs(termsAccepted: Boolean): Boolean {
        var isValid = true
        
        // Validar termos
        if (!termsAccepted) {
            showErrorMessage("Você deve aceitar os termos de uso")
            isValid = false
        }
        
        return isValid
    }

    /**
     * Valida CPF (formato básico)
     */
    private fun isValidCpf(cpf: String): Boolean {
        return com.example.loginapp.utils.TextFormatter.isValidCpf(cpf)
    }

    /**
     * Cria conta de prestador
     */
    private fun createProviderAccountFull(
        email: String,
        password: String,
        fullName: String,
        phone: String,
        cpf: String,
        address: FirebaseProviderManager.Address,
        bank: FirebaseProviderManager.BankInfo,
        services: List<String>
    ) {
        lifecycleScope.launch {
            try {
                // Garantir usuário logado
                val currentUser = authManager.getLocalUserData()
                if (currentUser == null) {
                    setLoadingState(false)
                    showErrorMessage("❌ Usuário não encontrado. Faça login novamente.")
                    return@launch
                }

                // 1) Salvar/atualizar perfil do prestador no Firestore
                val providerManager = FirebaseProviderManager()
                val providerProfile = FirebaseProviderManager.ProviderProfile(
                    uid = currentUser.uid,
                    email = email,
                    fullName = fullName.ifEmpty { currentUser.fullName.ifEmpty { "Prestador de Serviços" } },
                    phone = phone.ifEmpty { currentUser.phone },
                    cpf = cpf,
                    address = address,
                    bank = bank,
                    services = services,
                    verificationStatus = "pending",
                    profileImageUrl = currentUser.profileImageUrl
                )

                val providerResult = providerManager.updateProfile(providerProfile)
                if (providerResult is FirebaseProviderManager.ProviderResult.Error) {
                    setLoadingState(false)
                    handleSignUpError(providerResult.message)
                    return@launch
                }

                // 2) Atualizar userType do usuário para PROVIDER no Firestore e local
                val updatedUserData = currentUser.copy(
                    fullName = providerProfile.fullName,
                    phone = providerProfile.phone,
                    userType = FirebaseAuthManager.USER_TYPE_PROVIDER
                )
                val updateUserResult = authManager.updateUserProfile(updatedUserData)
                if (updateUserResult.isFailure) {
                    setLoadingState(false)
                    handleSignUpError("Erro ao atualizar tipo de usuário")
                    return@launch
                }

                // 3) Salvar endereço como SavedAddress (best-effort)
                saveProviderAddressAsSavedAddress(address, providerProfile.fullName)

                setLoadingState(false)

                // 4) Redirecionar para a tela de envio de documentos (fluxo de verificação)
                showSuccessMessage("✅ Conta de prestador criada! Envie seus documentos para ativação.")
                
                // Aguardar um pouco antes de navegar para evitar crash
                binding.root.postDelayed({
                    navigateToDocumentUpload()
                }, 1000)
                
            } catch (e: Exception) {
                setLoadingState(false)
                showErrorMessage("❌ Erro ao criar conta de prestador")
            }
        }
    }

    private fun validateProviderDetails(
        fullName: String,
        phone: String,
        cpf: String,
        cep: String,
        street: String,
        number: String,
        city: String,
        state: String
    ): Boolean {
        var ok = true
        if (fullName.isEmpty()) { binding.tilFullName.error = "Nome é obrigatório"; ok = false }
        if (!isValidCpf(cpf)) { binding.tilCpf.error = "CPF inválido"; ok = false }
        if (phone.length < 8) { binding.tilPhone.error = "Telefone inválido"; ok = false }
        if (cep.length < 8) { binding.tilCep.error = "CEP inválido"; ok = false }
        if (street.isEmpty()) { binding.tilStreet.error = "Endereço é obrigatório"; ok = false }
        if (number.isEmpty()) { binding.tilNumber.error = "Número é obrigatório"; ok = false }
        if (city.isEmpty()) { binding.tilCity.error = "Cidade é obrigatória"; ok = false }
        // Validar estado (extrair sigla se necessário)
        val stateCode = if (state.contains(" - ")) {
            state.substring(0, 2) // Extrair sigla do formato "SP - São Paulo"
        } else {
            state
        }
        if (stateCode.isEmpty() || !com.example.loginapp.utils.BrazilianStates.isValidStateCode(stateCode)) { 
            binding.tilState.error = "Selecione um estado válido"; ok = false 
        }
        return ok
    }

    /**
     * Mostra diálogo de sucesso profissional
     */
    private fun showSuccessDialog(email: String) {
        // Opcional: manter diálogo para feedback visual, mas redirecionar para ProviderHome
        val dialogView = layoutInflater.inflate(R.layout.dialog_success_signup, null)
        val dialog = AlertDialog.Builder(this, R.style.SuccessDialogTheme)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        dialog.window?.attributes?.windowAnimations = R.style.DialogAnimation
        dialog.show()

        dialogView.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnContinue).setOnClickListener {
            dialog.dismiss()
            navigateToDocumentUpload()
        }

        dialogView.findViewById<android.widget.TextView>(R.id.tvEmail).text = email
    }


    /**
     * Navega para a tela de envio de documentos
     */
    private fun navigateToDocumentUpload() {
        try {
            val intent = Intent(this, DocumentUploadActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        } catch (e: Exception) {
            android.util.Log.e("ProviderSignUp", "Erro ao navegar para DocumentUpload: ${e.message}")
            // Fallback: ir para ProviderHome
            val intent = Intent(this, ProviderHomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }


    /**
     * Trata erros de cadastro
     */
    private fun handleSignUpError(errorMessage: String) {
        showErrorMessage("❌ $errorMessage")
    }

    /**
     * Limpa todos os erros dos campos
     */
    private fun clearErrors() {
        // Não há mais campos de email e senha para limpar
    }

    /**
     * Controla o estado de carregamento da interface
     */
    private fun setLoadingState(loading: Boolean) {
        isLoading = loading
        
        // Atualizar botão de cadastro
        binding.btnSignUp.apply {
            isEnabled = !loading
            text = if (loading) "Criando conta..." else "Criar Conta"
        }
        
        // Desabilitar outros elementos durante o carregamento
        binding.tvSignIn.isEnabled = !loading
    }

    /**
     * Exibe uma mensagem de sucesso
     */
    private fun showSuccessMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * Exibe uma mensagem de erro
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * Exibe uma mensagem toast
     */
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    /**
     * Salva o endereço do prestador como um SavedAddress
     */
    private fun saveProviderAddressAsSavedAddress(
        address: FirebaseProviderManager.Address,
        fullName: String
    ) {
        lifecycleScope.launch {
            try {
                val savedAddress = SavedAddress(
                    name = "Endereço Principal - $fullName",
                    address = "${address.street}, ${address.number}",
                    complement = address.complement ?: "",
                    neighborhood = "", // Pode ser preenchido se necessário
                    city = address.city,
                    state = address.state,
                    zipCode = address.cep,
                    coordinates = address.coordinates?.let { 
                        GeoPoint(it["latitude"] ?: 0.0, it["longitude"] ?: 0.0) 
                    },
                    isDefault = true // Endereço principal do prestador
                )
                
                val result = FirebaseAddressManager().saveAddress(savedAddress)
                if (result.isSuccess) {
                    android.util.Log.d("ProviderSignUp", "✅ Endereço salvo como SavedAddress: ${result.getOrNull()}")
                } else {
                    android.util.Log.e("ProviderSignUp", "❌ Erro ao salvar endereço: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                android.util.Log.e("ProviderSignUp", "❌ Erro ao salvar endereço: ${e.message}")
            }
        }
    }

    /**
     * Limpa os recursos quando a activity é destruída
     */
    override fun onDestroy() {
        super.onDestroy()
        // Limpar recursos se necessário
    }
} 