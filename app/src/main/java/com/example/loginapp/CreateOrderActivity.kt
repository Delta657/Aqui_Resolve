package com.example.loginapp

import android.Manifest
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.example.loginapp.databinding.ActivityCreateOrderBinding
import com.example.loginapp.databinding.DialogAddAddressBinding
import com.example.loginapp.models.CreateOrderRequest
import com.example.loginapp.adapters.ImagesAdapter
import com.example.loginapp.utils.ImagePermissionHelper
import com.example.loginapp.utils.ProtocolGenerator
import com.example.loginapp.models.SavedAddress
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * CreateOrderActivity - Tela para criação de pedidos
 * 
 * Funcionalidades:
 * - Seleção de tipo e nicho de serviço
 * - Endereço do serviço
 * - Descrição detalhada do problema
 * - Anexo de imagens
 * - Opções de emergência e agendamento
 * - Envio do pedido para prestadores
 */
class CreateOrderActivity : AppCompatActivity() {

    // ViewBinding para acesso aos elementos da interface
    private lateinit var binding: ActivityCreateOrderBinding
    
    // Variáveis para controle de estado
    private var isLoading = false
    private var selectedImageUrls = mutableListOf<String>() // URLs após upload
    private var selectedImageUris = mutableListOf<Uri>() // URIs locais antes do upload
    private var selectedDate: Date? = null
    private var selectedTime: String? = null
    private lateinit var imageAdapter: ImagesAdapter
    private lateinit var permissionManager: com.example.loginapp.utils.ActivityPermissionManager
    private var selectedImages = mutableListOf<ImagesAdapter.ImageItem>()
    
    // Categoria efetiva selecionada nos cards (vinda da intent)
    private var effectiveCategory: String? = null
    
    // Variáveis para endereços salvos
    private var savedAddresses = mutableListOf<SavedAddress>()
    private var selectedSavedAddress: SavedAddress? = null
    private lateinit var addressAdapter: ArrayAdapter<String>
    
    // Formatadores de data e hora
    private val dateFormatter = SimpleDateFormat("dd/MM/yyyy", Locale("pt", "BR"))
    private val timeFormatter = SimpleDateFormat("HH:mm", Locale("pt", "BR"))
    
    // Launcher para seleção de imagens (agora só seleciona, não faz upload)
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { handleSelectedImageUri(it) }
    }

    // Launcher para gerenciar endereços e atualizar lista ao retornar
    private val manageAddressesLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { _ ->
        // Sempre recarrega os endereços ao voltar da tela de gerenciamento
        loadSavedAddresses()
    }
    
    // Constantes para câmera
    companion object {
        private const val REQUEST_CAMERA = 1001
        private const val REQUEST_CAMERA_PERMISSION = 1002
    }
    


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar ViewBinding
        binding = ActivityCreateOrderBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Pré-selecionar categoria vinda da tela de serviços (ANTES de configurar spinners)
        val selectedCategoryName = intent.getStringExtra("service_category_name")
        val selectedCategoryId = intent.getStringExtra("service_niche")
        effectiveCategory = when {
            !selectedCategoryName.isNullOrEmpty() -> selectedCategoryName
            !selectedCategoryId.isNullOrEmpty() -> mapCategoryIdToName(selectedCategoryId!!)
            else -> null
        }

        // Configurar a interface
        setupUI()
        setupClickListeners()
        setupSpinners()
        
        // Aplicar formatação automática (CEP foi removido na simplificação)
        
        // Carregar endereços salvos
        loadSavedAddresses()
        
        if (!effectiveCategory.isNullOrEmpty()) {
            binding.spinnerServiceNiche.setText(effectiveCategory)
            setupServiceTypesForNiche(effectiveCategory!!)
            // Abrir a lista de tipos automaticamente para facilitar a seleção
            binding.spinnerServiceType.post { binding.spinnerServiceType.showDropDown() }
        }
    }

    /**
     * Configura os elementos da interface do usuário
     */
    private fun setupUI() {
        // Configurar a status bar
        window.statusBarColor = ContextCompat.getColor(this, android.R.color.transparent)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        }
        
        // Configurar RecyclerView de imagens
        binding.rvImages.layoutManager = GridLayoutManager(this, 3)
        setupImageAdapter()
        
        // Inicializar permission manager
        permissionManager = com.example.loginapp.utils.ActivityPermissionManager(this)
        
        // Configurar foco inicial
        binding.spinnerServiceType.requestFocus()
    }

    /**
     * Configura os listeners de clique para todos os elementos interativos
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão adicionar imagem
        binding.btnAddImage.setOnClickListener {
            openImagePicker()
        }
        
        // Botão enviar pedido
        binding.btnSubmitOrder.setOnClickListener {
            submitOrder()
        }
        
        // Botão salvar rascunho
        binding.btnSaveDraft.setOnClickListener {
            saveDraft()
        }
        
        // Campos de data e hora
        binding.etPreferredDate.setOnClickListener {
            showDatePicker()
        }
        
        // Botão gerenciar endereços
        binding.btnManageAddresses.setOnClickListener {
            openAddressManagement()
        }
        
        // Botão salvar endereço
        binding.btnAddNewAddress.setOnClickListener {
            openAddressManagement()
        }
        
        // Listener para seleção de endereço salvo
        binding.actvSavedAddress.setOnItemClickListener { _, _, position, _ ->
            selectSavedAddress(position)
        }
        
        
        binding.etPreferredTime.setOnClickListener {
            showTimePicker()
        }
    }

    /**
     * Configura os spinners de seleção de serviços
     */
    private fun setupSpinners() {
        // Se vier categoria da intent, ocultar nicho e configurar tipos
        val currentCategory = effectiveCategory
        if (!currentCategory.isNullOrEmpty()) {
            binding.tilServiceNiche.visibility = View.GONE
            setupServiceTypesForNiche(currentCategory)
        } else {
            // Sem categoria pré-definida: exibir controle para o usuário escolher o nicho
            binding.tilServiceNiche.visibility = View.VISIBLE
            setupNicheSpinner()
            // Inicialmente, tipos vazios até o usuário escolher um nicho
            setupServiceTypesForNiche("")
        }
    }

    /**
     * Configura o spinner de nichos quando a Activity é aberta sem pré-seleção
     */
    private fun setupNicheSpinner() {
        val niches = getAllNiches()
        val nicheAdapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, niches)
        binding.spinnerServiceNiche.setAdapter(nicheAdapter)

        // Mostrar sugestões ao focar
        binding.spinnerServiceNiche.threshold = 0
        binding.spinnerServiceNiche.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.spinnerServiceNiche.showDropDown()
        }

        // Ao selecionar um nicho, atualizar tipos e guardar categoria efetiva
        binding.spinnerServiceNiche.setOnItemClickListener { _, _, position, _ ->
            val selected = niches[position]
            effectiveCategory = selected
            setupServiceTypesForNiche(selected)
            // Abrir tipos logo após escolher o nicho para agilizar
            binding.spinnerServiceType.post { binding.spinnerServiceType.showDropDown() }
        }
    }

    /**
     * Lista de nichos suportados
     */
    private fun getAllNiches(): List<String> {
        return listOf(
            "Elétrica",
            "Hidráulica",
            "Instalação",
            "Pintura",
            "Jardinagem",
            "Limpeza",
            "Caixa d'água",
            "Desentupimento manual",
            "Desentupimento com maquinário até 2 m",
            "Caça-vazamentos",
            "Estofados",
            "Ar condicionado",
            "Eletrodomésticos",
            "Chaveiro residencial",
            "Serviços automotivos",
            "Montagem de móveis",
            "Faxina",
            "Troca de bateria automotiva"
        )
    }

    /**
     * Configura os tipos de serviço baseados no nicho selecionado
     */
    private fun setupServiceTypesForNiche(niche: String) {
        val serviceTypes = when (niche) {
            "Elétrica" -> listOf(
                "Instalação de lâmpadas",
                "Instalação de tomadas",
                "Troca de disjuntor",
                "Instalação de chuveiro",
                "Instalação de resistência",
                "Instalação de luminárias",
                "Instalação de interruptores",
                "Instalação de spots",
                "Revisão Elétrica (até 7 pontos)"
            )
            "Hidráulica" -> listOf(
                "Troca de torneiras",
                "Troca de rabicho",
                "Troca de sifões",
                "Troca de registros",
                "Troca de Filtros",
                "troca de reparos de registros",
                "Troca de reparos de torneiras",
                "Troca kit de caixa acoplada",
                "Reparos de descarga de parede",
                "Revisão hidráulica até 7 pontos",
                "Vazamentos",
                "troca de torneira monobloco"
            )
            "Instalação" -> listOf(
                "Instalação de Suporte de tv",
                "Instalação de ventilador de teto",
                "Instalação de máquina de lavar",
                "Instalação de Lava louça",
                "Instalação de Fogão Cooktop",
                "Instalação de Purificador",
                "Conversão de gás para fogão cooktop"
            )
            "Pintura" -> listOf(
                "Pintura de parede interna",
                "Pintura de teto",
                "Pintura de porta",
                "Pintura de janela",
                "Retoques gerais"
            )
            "Jardinagem" -> listOf(
                "Corte de grama",
                "Poda de arbustos",
                "Limpeza de jardim",
                "Adubação",
                "Plantio de mudas"
            )
            "Limpeza" -> listOf(
                "Limpeza residencial básica",
                "Limpeza pós-obra",
                "Limpeza pesada",
                "Limpeza de vidros",
                "Organização"
            )
            "Caixa d'água" -> listOf(
                "Limpeza de caixa d’água de 1000 litros",
                "Limpeza de caixa d’água de 2000 litros",
                "Limpeza de caixa d’água de 3000 litros",
                "Limpeza de caixa d’água de 4000 litros",
                "Limpeza de caixa d’água de 5000 litros",
                "Troca de boia"
            )
            "Desentupimento manual" -> listOf(
                "Desentupimento de pia",
                "Desentupimento ralo",
                "Desentupimento vaso"
            )
            "Desentupimento com maquinário até 2 m" -> listOf(
                "Desentupimento de pia",
                "Desentupimento ralo",
                "Desentupimento vaso"
            )
            "Caça-vazamentos" -> listOf(
                "Selecione a necessidade no descritivo"
            )
            "Estofados" -> listOf(
                "Limpeza de sofá 2 lugares",
                "Limpeza de sofá 3 lugares",
                "Limpeza de sofá 4 lugares",
                "Limpeza de sofá retrátil",
                "Limpeza de sofá de canto",
                "Limpeza de poltronas estofadas",
                "Limpeza de cadeiras estofadas",
                "Limpeza de tapetes (até 2 m)",
                "Limpeza de cadeiras estofadas",
                "Limpeza de carpetes pequenos (até 2 m)",
                "Higienização de colchões Casal",
                "Colchão solteiro",
                "Colchão king",
                "Colchão queen",
                "Impermeabilização"
            )
            "Ar condicionado" -> listOf(
                "Instalação de ar condicionado",
                "Manutenção preventiva",
                "Limpeza e profunda (filtros e serpentinas)",
                "Recarga de gás"
            )
            "Eletrodomésticos" -> listOf(
                "Conserto de micro-ondas",
                "Reparo de fogão e forno",
                "Reparo de pequenos eletrodomésticos",
                "Instalação de eletrodomésticos"
            )
            "Chaveiro residencial" -> listOf(
                "Abertura de portas residencial",
                "Ajuste de fechaduras",
                "Extração de chave"
            )
            "Serviços automotivos" -> listOf(
                "Abertura de portas de veículos",
                "Extração de chaves quebradas",
                "Remendo de pneu",
                "Remendo de pneu Caminhonete, SUV e vans",
                "Troca de pneu no local",
                "Troca de pneu Caminhonete, SUV e vans",
                "Pane seca (entrega de combustível)",
                "Partida elétrica",
                "Troca de palhetas de limpador",
                "Troca de lâmpadas automotivas",
                "Troca de óleo e filtro domiciliar",
                "Higienização de ar-condicionado automotivo"
            )
            "Montagem de móveis" -> listOf(
                "guarda roupas",
                "cama",
                "mesa",
                "Cômoda",
                "armário",
                "Escrivaninha",
                "prateleiras",
                "Objetos de cozinha",
                "Objetos de banheiro"
            )
            "Faxina" -> listOf(
                "Faxina Básica (apt pequeno 1 a 2 quartos)",
                "Faxina completa (apt/casa média 2 a 3 quartos)",
                "Faxina pesada (casa grande, pós-obra, mudança)",
                "Faxina expressa (só manutenção)"
            )
            "Troca de bateria automotiva" -> listOf(
                "Bateria 45/ 50 e 60 amperes",
                "Bateria 70 e 75 amperes",
                "Bateria 80 e 90 amperes",
                "Bateria 60 amperes",
                "Bateria 72 amperes",
                "Bateria 80 amperes"
            )
            // Adicionais para completar todos os nichos
            "Desentupimento manual" -> listOf(
                "Desentupimento de pia",
                "Desentupimento de ralo",
                "Desentupimento de vaso"
            )
            "Desentupimento com maquinário até 2 m" -> listOf(
                "Desentupimento de pia",
                "Desentupimento de ralo",
                "Desentupimento de vaso"
            )
            "Caça-vazamentos" -> listOf(
                "Caça-vazamento em tubulação",
                "Caça-vazamento em parede",
                "Caça-vazamento em laje",
                "Selecione a necessidade no descritivo"
            )
            else -> listOf("Selecione um nicho primeiro")
        }
        
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, serviceTypes)
        binding.spinnerServiceType.setAdapter(adapter)
        
        // Limpar seleção atual
        binding.spinnerServiceType.setText("")
    }

    private fun mapCategoryIdToName(categoryId: String): String {
        return when (categoryId) {
            "eletrica" -> "Elétrica"
            "hidraulica" -> "Hidráulica"
            "instalacao" -> "Instalação"
            "caixa_dagua" -> "Caixa d'água"
            "desentupimento_manual" -> "Desentupimento manual"
            "desentupimento_maquinario_2m" -> "Desentupimento com maquinário até 2 m"
            "caca_vazamentos" -> "Caça-vazamentos"
            "estofados" -> "Estofados"
            "ar_condicionado" -> "Ar condicionado"
            "eletrodomesticos" -> "Eletrodomésticos"
            "chaveiro_residencial" -> "Chaveiro residencial"
            "servicos_automotivos" -> "Serviços automotivos"
            "montagem_moveis" -> "Montagem de móveis"
            "faxina" -> "Faxina"
            "troca_bateria_automotiva" -> "Troca de bateria automotiva"
            else -> categoryId
        }
    }

    /**
     * Abre o seletor de imagens
     */
    private fun openImagePicker() {
        if (selectedImageUris.size >= 5) {
            showErrorMessage("Máximo de 5 imagens permitido")
            return
        }
        
        // Mostrar opções de câmera e galeria
        val options = arrayOf("📷 Tirar Foto", "🖼️ Galeria")
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Adicionar Imagem")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takePhoto()
                    1 -> selectFromGallery()
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    private fun takePhoto() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA_PERMISSION)
            return
        }
        
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (intent.resolveActivity(packageManager) != null) {
            startActivityForResult(intent, REQUEST_CAMERA)
        } else {
            showErrorMessage("Câmera não disponível")
        }
    }
    
    private fun selectFromGallery() {
        // Verificar permissões e abrir seletor de imagens
        permissionManager.checkAndRequestImagePermissions(
            onGranted = {
                imagePickerLauncher.launch("image/*")
            },
            onDenied = {
                showErrorMessage("Permissões necessárias para adicionar imagens")
            }
        )
    }

    /**
     * Gera ou recupera um ID de rascunho de pedido para salvar imagens em "Pedidos/{orderId}".
     * Quando o pedido for efetivamente criado, essas imagens já estarão vinculadas ao ID.
     */
    private suspend fun ensureDraftOrderId(): String {
        val prefs = getSharedPreferences("draft_order_prefs", MODE_PRIVATE)
        val existing = prefs.getString("draft_order_id", null)
        if (!existing.isNullOrEmpty()) return existing

        val currentUser = FirebaseAuth.getInstance().currentUser
        val db = FirebaseFirestore.getInstance()
        val draftData = hashMapOf(
            "clientId" to (currentUser?.uid ?: ""),
            "status" to "draft",
            "createdAt" to com.google.firebase.Timestamp.now(),
            "updatedAt" to com.google.firebase.Timestamp.now()
        )
        val docRef = db.collection("orders").add(draftData).await()
        val draftId = docRef.id
        prefs.edit().putString("draft_order_id", draftId).apply()
        return draftId
    }

    /**
     * Processa URI da imagem selecionada (sem upload ainda)
     */
    private fun handleSelectedImageUri(uri: Uri) {
        selectedImageUris.add(uri)
        
        // Obter nome do arquivo
        val fileName = try {
            val cursor = contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (nameIndex != -1) it.getString(nameIndex) else "image.jpg"
                } else "image.jpg"
            } ?: "image.jpg"
        } catch (e: Exception) {
            "image.jpg"
        }
        
        // Adicionar imagem ao adapter visual
        val imageItem = ImagesAdapter.ImageItem(
            uri = uri,
            type = ImagesAdapter.ImageType.SERVICE,
            fileName = fileName,
            fileSize = 0L,
            isCompressed = false
        )
        selectedImages.add(imageItem)
        imageAdapter.notifyItemInserted(selectedImages.size - 1)
        
        // Tornar o RecyclerView visível
        binding.rvImages.visibility = View.VISIBLE
        
        showSuccessMessage("Imagem adicionada! Será enviada ao finalizar o pedido")
    }

    /**
     * Mostra o seletor de data
     */
    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        
        val datePickerDialog = DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                calendar.set(year, month, dayOfMonth)
                selectedDate = calendar.time
                binding.etPreferredDate.setText(dateFormatter.format(selectedDate!!))
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        
        // Data mínima: hoje
        datePickerDialog.datePicker.minDate = System.currentTimeMillis()
        
        datePickerDialog.show()
    }

    /**
     * Mostra o seletor de hora
     */
    private fun showTimePicker() {
        val calendar = Calendar.getInstance()
        
        val timePickerDialog = TimePickerDialog(
            this,
            { _, hourOfDay, minute ->
                calendar.set(Calendar.HOUR_OF_DAY, hourOfDay)
                calendar.set(Calendar.MINUTE, minute)
                selectedTime = timeFormatter.format(calendar.time)
                binding.etPreferredTime.setText(selectedTime)
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true // 24h format
        )
        
        timePickerDialog.show()
    }

    /**
     * Envia o pedido
     */
    private fun submitOrder() {
        if (isLoading) return
        
        // Obter dados dos campos
        val serviceType = binding.spinnerServiceType.text.toString()
        val serviceNiche = binding.spinnerServiceNiche.text.toString().ifEmpty {
            // Usar categoria efetiva da intent quando o campo está oculto
            intent.getStringExtra("service_category_name") ?: ""
        }
        val description = binding.etDescription.text.toString().trim()
        
        // Verificar se um endereço foi selecionado
        if (selectedSavedAddress == null) {
            showErrorMessage("Selecione um endereço ou cadastre um novo")
            return
        }
        
        val cep = selectedSavedAddress!!.zipCode
        val address = selectedSavedAddress!!.address
        val complement = selectedSavedAddress!!.complement
        
        // Limpar erros
        clearErrors()
        
        // Validar campos
        if (!validateInputs(serviceType, serviceNiche, description)) {
            return
        }
        
        // Mostrar estado de carregamento
        setLoadingState(true)
        
        // Criar request
        val request = CreateOrderRequest(
            serviceType = serviceType,
            serviceNiche = serviceNiche,
            description = description,
            images = selectedImageUrls, // URLs das imagens do Firebase Storage
            cep = cep,
            address = address,
            complement = if (complement.isNotEmpty()) complement else null,
            preferredDate = selectedDate,
            preferredTime = selectedTime
        )
        
        // Enviar pedido
        createOrder(request)
    }

    /**
     * Valida os campos de entrada
     */
    private fun validateInputs(
        serviceType: String,
        serviceNiche: String,
        description: String
    ): Boolean {
        var isValid = true
        
        // Validar nicho de serviço
        // Nicho é selecionado nos cards; aqui não é obrigatório se veio pela intent
        if (serviceNiche.isEmpty()) {
            // apenas aviso suave no log; não bloquear envio
            android.util.Log.w("CreateOrder", "Nicho vazio; prosseguindo com apenas o tipo")
        }
        
        // Validar tipo de serviço
        if (serviceType.isEmpty()) {
            binding.tilServiceType.error = "Selecione o tipo de serviço"
            isValid = false
        }
        
        // Validação especial para "Outros"
        val isOtherService = serviceType == "Outros"
        
        // Validar descrição
        if (description.isEmpty()) {
            binding.tilDescription.error = "Descrição é obrigatória"
            isValid = false
        } else if (isOtherService && description.length < 50) {
            binding.tilDescription.error = "Para serviços personalizados, a descrição deve ter pelo menos 50 caracteres"
            isValid = false
        } else if (!isOtherService && description.length < 20) {
            binding.tilDescription.error = "Descrição deve ter pelo menos 20 caracteres"
            isValid = false
        }
        
        // Validar imagens para "Outros"
        if (isOtherService && selectedImages.isEmpty()) {
            showErrorMessage("Para serviços personalizados, é obrigatório anexar pelo menos uma foto")
            isValid = false
        }
        
        
        return isValid
    }

    /**
     * Cria o pedido no Firebase (versão simplificada para teste)
     */
    private fun createOrder(request: CreateOrderRequest) {
        lifecycleScope.launch {
            try {
                val currentUser = FirebaseAuth.getInstance().currentUser
                if (currentUser == null) {
                    setLoadingState(false)
                    showErrorMessage("❌ Usuário não autenticado")
                    return@launch
                }
                
                // Buscar dados do usuário do Firestore
                val userDoc = FirebaseFirestore.getInstance()
                    .collection("users")
                    .document(currentUser.uid)
                    .get()
                    .await()
                
                val userData = userDoc.data
                val userName = userData?.get("fullName") as? String ?: "Usuário"
                val userEmail = currentUser.email ?: ""
                
                // Criar dados básicos do pedido
                val protocol = ProtocolGenerator.generateProtocol()
                
                val db = FirebaseFirestore.getInstance()
                
                // Criar pedido primeiro
                val orderRef = db.collection("orders").add(mapOf(
                    "clientId" to currentUser.uid,
                    "clientName" to userName,
                    "clientEmail" to userEmail,
                    "protocol" to protocol,
                    "serviceType" to request.serviceType,
                    "serviceName" to request.serviceNiche,
                    "description" to request.description,
                    "address" to request.address,
                    "zipCode" to request.cep,
                    "complement" to (request.complement ?: ""),
                    "status" to "distributing",
                    "distributionStartedAt" to com.google.firebase.Timestamp.now(),
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "updatedAt" to com.google.firebase.Timestamp.now()
                )).await()
                
                val orderId = orderRef.id
                
                // Fazer upload das imagens agora
                if (selectedImageUris.isNotEmpty()) {
                    val imageManager = FirebaseImageManager()
                    val uploadedUrls = mutableListOf<String>()
                    
                    selectedImageUris.forEachIndexed { index, uri ->
                        val uploadData = FirebaseImageManager.ImageUploadData(
                            uri = uri,
                            fileName = selectedImages.getOrNull(index)?.fileName ?: "image_$index.jpg",
                            folder = FirebaseImageManager.FOLDER_PEDIDOS,
                            userId = currentUser.uid,
                            orderId = orderId
                        )
                        
                        when (val result = imageManager.uploadImage(this@CreateOrderActivity, uploadData)) {
                            is FirebaseImageManager.UploadResult.Success -> {
                                uploadedUrls.add(result.downloadUrl)
                            }
                            else -> {
                                android.util.Log.e("CreateOrder", "Erro ao fazer upload da imagem ${index + 1}")
                            }
                        }
                    }
                    
                    // Atualizar pedido com URLs das imagens
                    if (uploadedUrls.isNotEmpty()) {
                        db.collection("orders").document(orderId)
                            .update("images", uploadedUrls)
                            .await()
                    }
                }
                
                // Limpar rascunho se existir
                getSharedPreferences("draft_order_prefs", MODE_PRIVATE)
                    .edit().remove("draft_order_id").apply()
                
                setLoadingState(false)
                
                showSuccessMessage("✅ Pedido criado com sucesso!")
                showSuccessMessage("📋 Protocolo: $protocol")
                showSuccessMessage("🔄 Equipe administrativa será notificada")
                
                // Redirecionar para tela de pedidos após 3 segundos
                binding.root.postDelayed({
                    val intent = Intent(this@CreateOrderActivity, ClientOrdersActivity::class.java)
                    startActivity(intent)
                    finish()
                }, 3000)
                
            } catch (e: Exception) {
                setLoadingState(false)
                showErrorMessage("❌ Erro ao enviar pedido: ${e.message}")
            }
        }
    }

    /**
     * Salva rascunho do pedido
     */
    private fun saveDraft() {
        // TODO: Implementar salvamento de rascunho
        showSuccessMessage("📝 Rascunho salvo")
    }

    /**
     * Configura o adapter de imagens
     */
    private fun setupImageAdapter() {
        imageAdapter = ImagesAdapter(
            images = selectedImages,
            onImageClick = { imageItem, position ->
                // Abrir preview da imagem
                openImagePreview(selectedImageUrls[position], position)
            },
            onRemoveClick = { imageItem, position ->
                selectedImages.removeAt(position)
                selectedImageUris.removeAt(position)
                imageAdapter.notifyItemRemoved(position)
                
                // Ocultar RecyclerView se não houver mais imagens
                if (selectedImages.isEmpty()) {
                    binding.rvImages.visibility = View.GONE
                }
                
                showToast("🗑️ Imagem removida")
            }
        )
        binding.rvImages.adapter = imageAdapter
        
        // Inicialmente oculto
        binding.rvImages.visibility = View.GONE
    }

    /**
     * Processa uma imagem selecionada
     */
    private fun processSelectedImage(uri: Uri) {
        lifecycleScope.launch {
            try {
                // Mostrar loading
                binding.progressBar.visibility = View.VISIBLE
                
                // Processar imagem
                val result = ImageManager.processImage(this@CreateOrderActivity, uri)
                
                when (result) {
                    is ImageManager.ProcessResult.Success -> {
                        val imageItem = ImagesAdapter.ImageItem(
                            uri = result.processedImage.originalUri,
                            type = ImagesAdapter.ImageType.SERVICE,
                            fileName = result.processedImage.fileName,
                            fileSize = result.processedImage.originalSize,
                            isCompressed = result.processedImage.isCompressed
                        )
                        
                        selectedImages.add(imageItem)
                        imageAdapter.notifyItemInserted(selectedImages.size - 1)
                        
                        showToast("✅ Imagem adicionada com sucesso!")
                    }
                    is ImageManager.ProcessResult.Error -> {
                        showToast("❌ ${result.message}")
                    }
                }
                
            } catch (e: Exception) {
                showToast("❌ Erro ao processar imagem: ${e.message}")
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    /**
     * Remove uma imagem da lista (método auxiliar - já tratado no adapter)
     */
    private fun removeImage(position: Int) {
        if (position in 0 until selectedImageUris.size) {
            selectedImageUris.removeAt(position)
            selectedImages.removeAt(position)
            imageAdapter.notifyItemRemoved(position)
            
            if (selectedImages.isEmpty()) {
                binding.rvImages.visibility = View.GONE
            }
            
            showToast("🗑️ Imagem removida")
        }
    }

    /**
     * Abre preview da imagem
     */
    private fun openImagePreview(imageUrl: String, position: Int) {
        if (position in 0 until selectedImageUris.size) {
            val intent = Intent(this, ImagePreviewActivity::class.java).apply {
                putStringArrayListExtra("image_urls", ArrayList(selectedImageUris.map { it.toString() }))
                putExtra("current_position", position)
            }
            startActivity(intent)
        }
    }

    /**
     * Limpa todos os erros dos campos
     */
    private fun clearErrors() {
        binding.tilServiceType.error = null
        binding.tilServiceNiche.error = null
        binding.tilDescription.error = null
    }

    /**
     * Controla o estado de carregamento da interface
     */
    private fun setLoadingState(loading: Boolean) {
        isLoading = loading
        
        // Atualizar botões
        binding.btnSubmitOrder.apply {
            isEnabled = !loading
            text = if (loading) "Enviando..." else "Enviar Pedido"
        }
        
        binding.btnSaveDraft.isEnabled = !loading
        binding.btnAddImage.isEnabled = !loading
        binding.btnManageAddresses.isEnabled = !loading
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
     * Abre a tela de gerenciamento de endereços
     */
    private fun openAddressManagement() {
        val intent = Intent(this, AddressManagementActivity::class.java)
        manageAddressesLauncher.launch(intent)
    }
    
    /**
     * Carrega os endereços salvos do usuário
     */
    private fun loadSavedAddresses() {
        lifecycleScope.launch {
            android.util.Log.d("CreateOrder", "🔄 Carregando endereços salvos...")
            val result = FirebaseAddressManager().getUserAddresses()
            if (result.isSuccess) {
                savedAddresses.clear()
                val addresses = result.getOrNull() ?: emptyList()
                savedAddresses.addAll(addresses)
                android.util.Log.d("CreateOrder", "✅ Endereços carregados: ${addresses.size}")
                setupAddressAdapter()
            } else {
                android.util.Log.e("CreateOrder", "❌ Erro ao carregar endereços: ${result.exceptionOrNull()?.message}")
                showErrorMessage("Erro ao carregar endereços: ${result.exceptionOrNull()?.message}")
            }
        }
    }
    
    /**
     * Configura o adapter para o dropdown de endereços salvos
     */
    private fun setupAddressAdapter() {
        val addressNames = savedAddresses.map { "${it.name} - ${it.getShortAddress()}" }
        android.util.Log.d("CreateOrder", "🔧 Configurando adapter com ${addressNames.size} endereços")
        addressNames.forEach { android.util.Log.d("CreateOrder", "📍 Endereço: $it") }
        addressAdapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, addressNames)
        binding.actvSavedAddress.setAdapter(addressAdapter)
        android.util.Log.d("CreateOrder", "✅ Adapter configurado no AutoCompleteTextView")

        // Mostrar dropdown ao focar e permitir seleção imediata
        binding.actvSavedAddress.threshold = 0
        binding.actvSavedAddress.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.actvSavedAddress.showDropDown()
        }

        // Pré-selecionar endereço padrão (ou o primeiro) para evitar campo vazio
        if (savedAddresses.isNotEmpty()) {
            val defaultIndex = savedAddresses.indexOfFirst { it.isDefault }
            val indexToSelect = if (defaultIndex >= 0) defaultIndex else 0
            selectSavedAddress(indexToSelect)
        } else {
            // Limpa seleção se não houver endereços
            selectedSavedAddress = null
            binding.actvSavedAddress.setText("")
        }
    }
    
    /**
     * Seleciona um endereço salvo
     */
    private fun selectSavedAddress(position: Int) {
        if (position < savedAddresses.size) {
            selectedSavedAddress = savedAddresses[position]
            val address = savedAddresses[position]
            
            // Atualizar o texto do AutoCompleteTextView
            binding.actvSavedAddress.setText("${address.name} - ${address.getShortAddress()}")
        }
    }
    
    /**
     * Processa resultado da câmera
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (resultCode == RESULT_OK) {
            when (requestCode) {
                REQUEST_CAMERA -> {
                    val imageUri = data?.data
                    if (imageUri != null) {
                        handleSelectedImageUri(imageUri)
                    }
                }
            }
        }
    }
    
    /**
     * Processa permissões da câmera
     */
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                takePhoto()
            } else {
                showErrorMessage("Permissão da câmera negada")
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