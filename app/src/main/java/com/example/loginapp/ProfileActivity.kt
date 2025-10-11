package com.example.loginapp

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.example.loginapp.databinding.ActivityProfileBinding
import com.example.loginapp.utils.ImagePermissionHelper
import kotlinx.coroutines.launch

/**
 * ProfileActivity - Tela de perfil do usuário
 * 
 * Esta activity gerencia o perfil do usuário com:
 * - Informações pessoais
 * - Opção para se tornar prestador de serviço
 * - Configurações da conta
 * - Logout
 */
class ProfileActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityProfileBinding
    private lateinit var authManager: FirebaseAuthManager
    private lateinit var permissionManager: com.example.loginapp.utils.ActivityPermissionManager
    private lateinit var firebaseImageManager: FirebaseImageManager
    
    // Launcher para seleção de imagem
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val imageUrl = result.data?.getStringExtra(ImagePickerActivity.EXTRA_IMAGE_URL)
            if (imageUrl != null) {
                updateProfileImage(imageUrl)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar managers
        authManager = FirebaseAuthManager(this)
        permissionManager = com.example.loginapp.utils.ActivityPermissionManager(this)
        firebaseImageManager = FirebaseImageManager()
        
        // Inicializar ViewBinding
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Configurar a interface
        setupUI()
        setupClickListeners()
        loadUserData()
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão voltar da toolbar
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        // Avatar (para editar foto)
        binding.ivAvatar.setOnClickListener {
            showImagePickerDialog()
        }
        
        // Botão editar informações
        binding.ivEdit.setOnClickListener {
            showEditProfileDialog()
        }
        
        // Botão para se tornar prestador OU ir para dashboard (depende do userType)
        binding.btnBecomeProvider.setOnClickListener {
            handleBecomeProviderClick()
        }
        
        // Botão para upload de documentos (prestadores)
        binding.btnUploadDocuments.setOnClickListener {
            val intent = Intent(this, DocumentUploadActivity::class.java)
            startActivity(intent)
        }
        

        
        // Opções de configuração
        binding.llPersonalInfo.setOnClickListener {
            val intent = Intent(this, PersonalDataActivity::class.java)
            startActivity(intent)
        }
        
        binding.llNotifications.setOnClickListener {
            showNotificationsDialog()
        }
        
        binding.llPrivacy.setOnClickListener {
            showPrivacyDialog()
        }
        
        binding.llAddresses.setOnClickListener {
            val intent = Intent(this, AddressManagementActivity::class.java)
            startActivity(intent)
        }
        
        binding.llBankData.setOnClickListener {
            showBankDataDialog()
        }
        
        binding.llDashboard.setOnClickListener {
            val intent = Intent(this, UserDashboardActivity::class.java)
            startActivity(intent)
        }
        
        binding.llHelp.setOnClickListener {
            showHelpDialog()
        }
        
        // Botão de logout
        binding.btnLogout.setOnClickListener {
            showLogoutDialog()
        }
    }

    /**
     * Carrega os dados do usuário logado
     */
    private fun loadUserData() {
        val user = authManager.getLocalUserData()
        if (user != null) {
            // Log para debug
            android.util.Log.d("ProfileActivity", "=== CARREGANDO DADOS DO USUÁRIO ===")
            android.util.Log.d("ProfileActivity", "UID: ${user.uid}")
            android.util.Log.d("ProfileActivity", "Email: ${user.email}")
            android.util.Log.d("ProfileActivity", "Username: ${user.username}")
            android.util.Log.d("ProfileActivity", "UserType: ${user.userType}")
            android.util.Log.d("ProfileActivity", "USER_TYPE_PROVIDER: ${FirebaseAuthManager.USER_TYPE_PROVIDER}")
            android.util.Log.d("ProfileActivity", "É prestador? ${user.userType == FirebaseAuthManager.USER_TYPE_PROVIDER}")
            
            // Mostrar nome de usuário (que pode ser editado) e email real
            binding.tvUserName.text = user.username
            binding.tvUserEmail.text = user.email
            
            // Carregar imagem do perfil se existir
            loadProfileImage(user.profileImageUrl)
            
            // Verificar se é prestador de serviço
            val isProvider = user.userType == FirebaseAuthManager.USER_TYPE_PROVIDER
            if (isProvider) {
                android.util.Log.d("ProfileActivity", "✅ USUÁRIO É PRESTADOR - Configurando interface para prestador")
                binding.tvUserType.text = "Prestador"
                // Ocultar CTA de "Ir para área do Prestador" na aba do prestador
                binding.btnBecomeProvider.visibility = View.GONE
                binding.btnUploadDocuments.visibility = View.VISIBLE
                binding.llBankData.visibility = View.VISIBLE
                
                // Adicionar botão para voltar à conta de cliente
                addSwitchToClientButton()
            } else {
                android.util.Log.d("ProfileActivity", "✅ USUÁRIO É CLIENTE - Configurando interface para cliente")
                binding.tvUserType.text = "Cliente"
                binding.btnBecomeProvider.text = "Tornar-se Prestador de Serviços"
                binding.btnBecomeProvider.backgroundTintList = ContextCompat.getColorStateList(this, R.color.primary_color)
                binding.btnBecomeProvider.visibility = View.VISIBLE
                binding.btnUploadDocuments.visibility = View.GONE
                binding.llBankData.visibility = View.GONE
                
                // Remover botão de voltar à conta de cliente se existir
                removeSwitchToClientButton()

                // Se já possui perfil de prestador no Firestore, mostrar CTA de retorno à área do prestador
                lifecycleScope.launch {
                    try {
                        val hasProvider = FirebaseProviderManager().hasProviderProfile(user.uid)
                        if (hasProvider) {
                            binding.btnBecomeProvider.text = "Voltar para Conta de Prestador"
                            binding.btnBecomeProvider.backgroundTintList = ContextCompat.getColorStateList(this@ProfileActivity, R.color.secondary_color)
                        }
                    } catch (_: Exception) { }
                }
            }
        } else {
            android.util.Log.e("ProfileActivity", "❌ ERRO: Dados do usuário não encontrados")
        }
    }
    
    /**
     * Carrega a imagem do perfil
     */
    private fun loadProfileImage(imageUrl: String?) {
        if (!imageUrl.isNullOrEmpty()) {
            val requestOptions = RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
            
            Glide.with(this)
                .load(imageUrl)
                .apply(requestOptions)
                .into(binding.ivAvatar)
        }
    }

    /**
     * Mostra diálogo para selecionar imagem
     */
    private fun showImagePickerDialog() {
        permissionManager.checkAndRequestImagePermissions(
            onGranted = {
                val intent = ImagePickerActivity.createIntent(
                    context = this,
                    folder = FirebaseImageManager.FOLDER_PROFILE_IMAGES,
                    userId = authManager.getCurrentUser()?.uid,
                    orderId = null,
                    maxImages = 1
                )
                imagePickerLauncher.launch(intent)
            },
            onDenied = {
                showToast("Permissões necessárias para alterar foto do perfil")
            }
        )
    }

    /**
     * Atualiza a imagem do perfil
     */
    private fun updateProfileImage(imageUrl: String) {
        lifecycleScope.launch {
            try {
                // Carregar imagem com Glide
                val requestOptions = RequestOptions()
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .circleCrop()
                    .placeholder(R.drawable.ic_person)
                    .error(R.drawable.ic_person)
                
                Glide.with(this@ProfileActivity)
                    .load(imageUrl)
                    .apply(requestOptions)
                    .into(binding.ivAvatar)
                
                // Salvar URL da imagem no perfil do usuário
                val user = authManager.getCurrentUser()
                if (user != null) {
                    // Atualizar URL da imagem no Firestore
                    updateProfileImageInFirestore(user.uid, imageUrl)
                }
                
            } catch (e: Exception) {
                showToast("❌ Erro ao atualizar foto: ${e.message}")
            }
        }
    }

    /**
     * Mostra diálogo para editar perfil
     */
    private fun showEditProfileDialog() {
        val user = authManager.getLocalUserData()
        if (user == null) {
            showToast("❌ Erro ao carregar dados do usuário")
            return
        }
        
        // Verificar se pode editar o nome de usuário
        if (!authManager.canEditUsername(user.uid)) {
            val remainingDays = (user.lastUsernameEdit + (15 * 24 * 60 * 60 * 1000L) - System.currentTimeMillis()) / (24 * 60 * 60 * 1000L)
            showToast("⏰ Você pode editar seu nome de usuário em $remainingDays dias")
            return
        }
        
        // Criar diálogo de edição
        val editText = com.google.android.material.textfield.TextInputEditText(this).apply {
            hint = "Novo nome de usuário"
            setText(user.username)
            setSelection(text?.length ?: 0)
        }
        
        AlertDialog.Builder(this)
            .setTitle("Editar Nome de Usuário")
            .setMessage("Digite seu novo nome de usuário (3-20 caracteres, apenas letras, números, _ ou -)")
            .setView(editText)
            .setPositiveButton("Salvar") { _, _ ->
                val newUsername = editText.text.toString().trim()
                if (newUsername.isNotEmpty()) {
                    updateUsername(newUsername)
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    /**
     * Atualiza o nome de usuário
     */
    private fun updateUsername(newUsername: String) {
        val user = authManager.getLocalUserData()
        if (user == null) {
            showToast("❌ Erro ao carregar dados do usuário")
            return
        }
        
        // Validar nome de usuário
        if (!authManager.isValidUsername(newUsername)) {
            showToast("❌ Nome de usuário inválido")
            return
        }
        
        // Verificar se já existe
        lifecycleScope.launch {
            try {
                if (authManager.isUsernameTaken(newUsername)) {
                    showToast("❌ Nome de usuário já está em uso")
                    return@launch
                }
                
                // Atualizar no Firebase
                val result = authManager.updateUsername(user.uid, newUsername)
                if (result.isSuccess) {
                    showToast("✅ Nome de usuário atualizado com sucesso!")
                    loadUserData() // Recarregar dados
                } else {
                    showToast("❌ Erro ao atualizar nome de usuário")
                }
            } catch (e: Exception) {
                showToast("❌ Erro: ${e.message}")
            }
        }
    }

    /**
     * Mostra diálogo para se tornar prestador
     */
    private fun showBecomeProviderDialog() {
        val user = authManager.getLocalUserData()
        if (user != null && user.userType == FirebaseAuthManager.USER_TYPE_CLIENT) {
            AlertDialog.Builder(this)
                .setTitle("Tornar-se Prestador de Serviços")
                .setMessage("Deseja se tornar um prestador de serviços? Você poderá oferecer seus serviços e ganhar dinheiro.")
                .setPositiveButton("Sim") { _, _ ->
                    becomeProvider()
                }
                .setNegativeButton("Cancelar", null)
                .show()
        } else {
            showToast("🔧 Gerenciamento de serviços em desenvolvimento...")
            // TODO: Implementar gerenciamento de serviços
        }
    }

    /**
     * Converte o usuário em prestador de serviço
     */
    private fun becomeProvider() {
        val user = authManager.getLocalUserData()
        if (user != null) {
            // Simular conversão para prestador
            // Em um sistema real, isso seria salvo no banco
            showToast("✅ Agora você é um prestador de serviços!")
            loadUserData() // Recarregar dados
        }
    }

    /**
     * Mostra diálogo de informações pessoais
     */
    private fun showPersonalInfoDialog() {
        showToast("👤 Informações pessoais em desenvolvimento...")
        // TODO: Implementar tela de informações pessoais
    }

    /**
     * Mostra diálogo de notificações
     */
    private fun showNotificationsDialog() {
        val intent = Intent(this, NotificationSettingsActivity::class.java)
        startActivity(intent)
    }

    /**
     * Abre as configurações de privacidade
     */
    private fun showPrivacyDialog() {
        val intent = Intent(this, PrivacySettingsActivity::class.java)
        startActivity(intent)
    }

    /**
     * Mostra diálogo de dados bancários
     */
    private fun showBankDataDialog() {
        val user = authManager.getLocalUserData()
        if (user == null) {
            showToast("❌ Erro ao carregar dados do usuário")
            return
        }
        
        // Verificar se é prestador
        if (user.userType != FirebaseAuthManager.USER_TYPE_PROVIDER) {
            showToast("❌ Apenas prestadores podem acessar dados bancários")
            return
        }
        
        // Obter dados do prestador
        val provider = LocalAuthManager.getCurrentProviderData()
        if (provider == null) {
            showToast("❌ Dados do prestador não encontrados")
            return
        }
        
        // Verificar se já tem dados bancários
        val hasBankData = !provider.bank.isNullOrEmpty() && 
                         !provider.agency.isNullOrEmpty() && 
                         !provider.account.isNullOrEmpty()
        
        if (hasBankData) {
            // Mostrar dados bancários existentes
            showExistingBankData(provider)
        } else {
            // Mostrar opção para adicionar dados bancários
            showAddBankDataDialog()
        }
    }
    
    /**
     * Mostra dados bancários existentes
     */
    private fun showExistingBankData(provider: LocalAuthManager.ProviderData) {
        val message = "Dados Bancários:\n\n" +
                     "Banco: ${provider.bank}\n" +
                     "Agência: ${provider.agency}\n" +
                     "Conta: ${provider.account}\n\n" +
                     "Deseja editar estes dados?"
        
        AlertDialog.Builder(this)
            .setTitle("Dados Bancários")
            .setMessage(message)
            .setPositiveButton("Editar") { _, _ ->
                showEditBankDataDialog(provider)
            }
            .setNegativeButton("Fechar", null)
            .show()
    }
    
    /**
     * Mostra diálogo para adicionar dados bancários
     */
    private fun showAddBankDataDialog() {
        AlertDialog.Builder(this)
            .setTitle("Dados Bancários")
            .setMessage("Para receber pagamentos pelos seus serviços, você precisa cadastrar seus dados bancários.\n\n" +
                       "Deseja adicionar agora?")
            .setPositiveButton("Sim, adicionar") { _, _ ->
                showEditBankDataDialog(null)
            }
            .setNegativeButton("Depois", null)
            .show()
    }
    
    /**
     * Mostra diálogo para editar dados bancários
     */
    private fun showEditBankDataDialog(provider: LocalAuthManager.ProviderData?) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_bank_data, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setTitle("Dados Bancários")
            .setPositiveButton("Salvar") { _, _ ->
                // TODO: Implementar salvamento dos dados bancários
                showToast("✅ Dados bancários salvos com sucesso!")
            }
            .setNegativeButton("Cancelar", null)
            .create()
        
        // Preencher campos se já existirem dados
        if (provider != null) {
            // TODO: Preencher campos com dados existentes
        }
        
        dialog.show()
    }

    /**
     * Mostra diálogo de ajuda
     */
    private fun showHelpDialog() {
        showToast("❓ Ajuda e suporte em desenvolvimento...")
        // TODO: Implementar ajuda e suporte
    }

    /**
     * Mostra diálogo de logout
     */
    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle("Sair da Conta")
            .setMessage("Tem certeza que deseja sair da sua conta?")
            .setPositiveButton("Sim") { _, _ ->
                logout()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    /**
     * Faz logout do usuário
     */
    private fun logout() {
        // Fazer logout usando FirebaseAuthManager
        authManager.signOut()
        showToast("👋 Logout realizado com sucesso!")
        
        // Voltar para a tela de login
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    /**
     * Atualiza a URL da imagem no Firestore
     */
    private fun updateProfileImageInFirestore(userId: String, imageUrl: String) {
        lifecycleScope.launch {
            try {
                val result = authManager.updateUserProfileImage(userId, imageUrl)
                if (result.isSuccess) {
                    showToast("✅ Foto do perfil atualizada com sucesso!")
                    // Recarregar dados do usuário para atualizar a URL localmente
                    loadUserData()
                } else {
                    showToast("❌ Erro ao salvar foto no servidor")
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao salvar foto: ${e.message}")
            }
        }
    }

    /**
     * Adiciona botão para voltar à conta de cliente (apenas para prestadores)
     */
    private fun addSwitchToClientButton() {
        // Verificar se o botão já existe
        val existingButton = findViewById<com.google.android.material.button.MaterialButton>(999) // ID temporário
        if (existingButton != null) return
        
        // Criar botão dinamicamente
        val switchButton = com.google.android.material.button.MaterialButton(this).apply {
            id = 999 // ID temporário
            text = "Voltar para Conta Cliente"
            textSize = 14f
            setTextColor(ContextCompat.getColor(this@ProfileActivity, R.color.white))
            backgroundTintList = ContextCompat.getColorStateList(this@ProfileActivity, R.color.gray_600)
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(32, 16, 32, 16)
            }
            setOnClickListener {
                switchToClientAccount()
            }
        }
        
        // Adicionar o botão após o botão de prestador
        val parentLayout = binding.btnBecomeProvider.parent as android.widget.LinearLayout
        val providerButtonIndex = parentLayout.indexOfChild(binding.btnBecomeProvider)
        parentLayout.addView(switchButton, providerButtonIndex + 1)
    }
    
    /**
     * Remove o botão de voltar à conta de cliente
     */
    private fun removeSwitchToClientButton() {
        val switchButton = findViewById<com.google.android.material.button.MaterialButton>(999) // ID temporário
        if (switchButton != null) {
            val parentLayout = switchButton.parent as android.widget.LinearLayout
            parentLayout.removeView(switchButton)
        }
    }
    
    /**
     * Volta para a conta de cliente
     */
    private fun switchToClientAccount() {
        lifecycleScope.launch {
            try {
                val user = authManager.getLocalUserData()
                if (user != null) {
                    // Atualizar tipo de usuário para cliente
                    val updatedUser = user.copy(userType = FirebaseAuthManager.USER_TYPE_CLIENT)
                    val result = authManager.updateUserProfile(updatedUser)
                    if (!result.isSuccess) {
                        // Fallback offline: manter alternância local
                        authManager.cacheUserDataLocally(updatedUser)
                        showToast("⚠️ Sem conexão. Alternando para cliente localmente.")
                    }
                    showToast("✅ Conta alterada para Cliente")
                    
                    // Recarregar dados e atualizar interface
                    loadUserData()
                    
                    // Navegar para a tela principal do cliente (ClientHome)
                    val intent = Intent(this@ProfileActivity, ClientHomeActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
                        putExtra("show_switch_message", true)
                        putExtra("switch_message", "🎉 Agora você está na conta de Cliente!")
                        putExtra("can_switch_to_provider", true) // Indica que pode voltar para prestador
                    }
                    startActivity(intent)
                    finish()
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao alterar conta: ${e.message}")
            }
        }
    }

    /**
     * Exibe uma mensagem toast para o usuário
     * 
     * @param message Mensagem a ser exibida
     */
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    /**
     * Manipula o clique no botão para trocar perfil
     */
    private fun handleBecomeProviderClick() {
        val user = authManager.getLocalUserData()
        if (user == null) {
            android.util.Log.e("ProfileActivity", "❌ ERRO: Dados do usuário não encontrados no handleBecomeProviderClick")
            return
        }
        
        android.util.Log.d("ProfileActivity", "=== HANDLE BECOME PROVIDER CLICK ===")
        android.util.Log.d("ProfileActivity", "UserType: ${user.userType}")
        android.util.Log.d("ProfileActivity", "USER_TYPE_CLIENT: ${FirebaseAuthManager.USER_TYPE_CLIENT}")
        android.util.Log.d("ProfileActivity", "USER_TYPE_PROVIDER: ${FirebaseAuthManager.USER_TYPE_PROVIDER}")
        android.util.Log.d("ProfileActivity", "É cliente? ${user.userType == FirebaseAuthManager.USER_TYPE_CLIENT}")
        android.util.Log.d("ProfileActivity", "É prestador? ${user.userType == FirebaseAuthManager.USER_TYPE_PROVIDER}")
        
        if (user.userType == FirebaseAuthManager.USER_TYPE_CLIENT) {
            lifecycleScope.launch {
                // Se já tem perfil de prestador, apenas alterna e navega
                val hasProvider = try { FirebaseProviderManager().hasProviderProfile(user.uid) } catch (_: Exception) { false }
                if (hasProvider) {
                    // Atualizar tipo no Firestore e local, e ir para ProviderHome
                    val updatedUser = user.copy(userType = FirebaseAuthManager.USER_TYPE_PROVIDER)
                    val result = authManager.updateUserProfile(updatedUser)
                    if (!result.isSuccess) {
                        // Fallback offline: manter alternância local
                        authManager.cacheUserDataLocally(updatedUser)
                        showToast("⚠️ Sem conexão. Alternando para prestador localmente.")
                    }
                    val intent = Intent(this@ProfileActivity, ProviderHomeActivity::class.java).apply {
                        putExtra("show_switch_message", true)
                        putExtra("switch_message", "🎉 Agora você está na conta de Prestador!")
                    }
                    startActivity(intent)
                    finish()
                } else {
                    // Ir para cadastro de prestador
                    startProviderRegistration()
                }
            }
        } else {
            android.util.Log.d("ProfileActivity", "✅ USUÁRIO É PRESTADOR - Navegando para envio de documentos")
            val intent = Intent(this, DocumentUploadActivity::class.java)
            startActivity(intent)
        }
    }

    /**
     * Inicia o processo de registro de prestador
     */
    private fun startProviderRegistration() {
        val intent = Intent(this, ProviderSignUpActivity::class.java)
        intent.putExtra("from_profile", true) // Indica que veio do perfil
        startActivity(intent)
    }
    
    /**
     * Troca o perfil de prestador para cliente
     */
    private fun switchToClientProfile() {
        lifecycleScope.launch {
            try {
                val user = authManager.getLocalUserData()
                if (user != null) {
                    // Atualizar tipo de usuário para cliente
                    val updatedUser = user.copy(userType = FirebaseAuthManager.USER_TYPE_CLIENT)
                    
                    // Atualizar no Firebase
                    authManager.updateUserProfile(updatedUser)
                    
                    showToast("✅ Perfil alterado para Cliente")
                    loadUserData() // Recarregar dados
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao alterar perfil: ${e.message}")
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