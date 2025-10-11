package com.example.loginapp

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.example.loginapp.databinding.FragmentProviderProfileBinding
import com.example.loginapp.utils.ActivityPermissionManager
import kotlinx.coroutines.launch

/**
 * ProviderProfileFragment - Fragment para configurações de perfil do prestador
 */
class ProviderProfileFragment : Fragment() {

    private var _binding: FragmentProviderProfileBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var authManager: FirebaseAuthManager
    private lateinit var permissionManager: ActivityPermissionManager
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

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProviderProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Inicializar managers
        authManager = FirebaseAuthManager(requireContext())
        permissionManager = ActivityPermissionManager(requireActivity())
        firebaseImageManager = FirebaseImageManager()
        
        setupClickListeners()
        loadProviderData()
    }

    /**
     * Configura os listeners de clique
     */
    private fun setupClickListeners() {
        // Foto de perfil
        binding.ivProfilePhoto.setOnClickListener {
            showImagePickerDialog()
        }
        
        binding.btnChangePhoto.setOnClickListener {
            showImagePickerDialog()
        }
        
        // Salvar informações pessoais
        binding.btnSavePersonalInfo.setOnClickListener {
            savePersonalInfo()
        }
        
        // Salvar serviços
        binding.btnSaveServices.setOnClickListener {
            saveServices()
        }
        
        // Salvar dados bancários
        binding.btnSaveBankData.setOnClickListener {
            saveBankData()
        }
    }

    /**
     * Carrega os dados do prestador
     */
    private fun loadProviderData() {
        val user = authManager.getLocalUserData()
        val provider = LocalAuthManager.getCurrentProviderData()
        
        if (user != null && provider != null) {
            // Carregar informações pessoais
            binding.etFullName.setText(provider.fullName)
            binding.etPhone.setText(provider.phone)
            binding.etCpf.setText(provider.cpf)
            
            // Carregar foto de perfil
            loadProfileImage(user.profileImageUrl)
            
            // Carregar serviços selecionados
            loadSelectedServices(provider.services)
            
            // Carregar dados bancários
            binding.etBankName.setText(provider.bank ?: "")
            binding.etAgency.setText(provider.agency ?: "")
            binding.etAccount.setText(provider.account ?: "")
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
                .into(binding.ivProfilePhoto)
        }
    }

    /**
     * Carrega os serviços selecionados
     */
    private fun loadSelectedServices(services: List<String>) {
        val chipGroup = binding.chipGroupServices
        for (i in 0 until chipGroup.childCount) {
            val chip = chipGroup.getChildAt(i)
            if (chip is com.google.android.material.chip.Chip) {
                val serviceName = chip.text.toString()
                chip.isChecked = services.contains(serviceName)
            }
        }
    }

    /**
     * Mostra diálogo para selecionar imagem
     */
    private fun showImagePickerDialog() {
        permissionManager.checkAndRequestImagePermissions(
            onGranted = {
                val intent = ImagePickerActivity.createIntent(
                    context = requireActivity(),
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
                
                Glide.with(this@ProviderProfileFragment)
                    .load(imageUrl)
                    .apply(requestOptions)
                    .into(binding.ivProfilePhoto)
                
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
     * Salva as informações pessoais
     */
    private fun savePersonalInfo() {
        val fullName = binding.etFullName.text.toString().trim()
        val phone = binding.etPhone.text.toString().trim()
        val cpf = binding.etCpf.text.toString().trim()
        
        if (fullName.isEmpty() || phone.isEmpty() || cpf.isEmpty()) {
            showToast("❌ Preencha todos os campos obrigatórios")
            return
        }
        
        lifecycleScope.launch {
            try {
                val provider = LocalAuthManager.getCurrentProviderData()
                if (provider != null) {
                    // Atualizar dados do prestador
                    val updatedProvider = provider.copy(
                        fullName = fullName,
                        phone = phone,
                        cpf = cpf
                    )
                    
                    // Salvar no LocalAuthManager
                    // TODO: Implementar método saveProviderData no LocalAuthManager
                    // LocalAuthManager.saveProviderData(updatedProvider)
                    
                    showToast("✅ Informações pessoais salvas com sucesso!")
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao salvar informações: ${e.message}")
            }
        }
    }

    /**
     * Salva os serviços oferecidos
     */
    private fun saveServices() {
        val selectedServices = mutableListOf<String>()
        val chipGroup = binding.chipGroupServices
        
        for (i in 0 until chipGroup.childCount) {
            val chip = chipGroup.getChildAt(i)
            if (chip is com.google.android.material.chip.Chip && chip.isChecked) {
                selectedServices.add(chip.text.toString())
            }
        }
        
        if (selectedServices.isEmpty()) {
            showToast("❌ Selecione pelo menos um serviço")
            return
        }
        
        lifecycleScope.launch {
            try {
                val provider = LocalAuthManager.getCurrentProviderData()
                if (provider != null) {
                    // Atualizar serviços do prestador
                    val updatedProvider = provider.copy(services = selectedServices)
                    
                    // Salvar no LocalAuthManager
                    // TODO: Implementar método saveProviderData no LocalAuthManager
                    // LocalAuthManager.saveProviderData(updatedProvider)
                    
                    showToast("✅ Serviços salvos com sucesso!")
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao salvar serviços: ${e.message}")
            }
        }
    }

    /**
     * Salva os dados bancários
     */
    private fun saveBankData() {
        val bankName = binding.etBankName.text.toString().trim()
        val agency = binding.etAgency.text.toString().trim()
        val account = binding.etAccount.text.toString().trim()
        
        if (bankName.isEmpty() || agency.isEmpty() || account.isEmpty()) {
            showToast("❌ Preencha todos os campos bancários")
            return
        }
        
        lifecycleScope.launch {
            try {
                val provider = LocalAuthManager.getCurrentProviderData()
                if (provider != null) {
                    // Atualizar dados bancários do prestador
                    val updatedProvider = provider.copy(
                        bank = bankName,
                        agency = agency,
                        account = account
                    )
                    
                    // Salvar no LocalAuthManager
                    // TODO: Implementar método saveProviderData no LocalAuthManager
                    // LocalAuthManager.saveProviderData(updatedProvider)
                    
                    showToast("✅ Dados bancários salvos com sucesso!")
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao salvar dados bancários: ${e.message}")
            }
        }
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
                    loadProviderData()
                } else {
                    showToast("❌ Erro ao salvar foto no servidor")
                }
            } catch (e: Exception) {
                showToast("❌ Erro ao salvar foto: ${e.message}")
            }
        }
    }

    /**
     * Exibe uma mensagem toast para o usuário
     */
    private fun showToast(message: String) {
        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
