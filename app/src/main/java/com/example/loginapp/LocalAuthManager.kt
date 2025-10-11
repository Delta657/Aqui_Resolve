
package com.example.loginapp

import kotlinx.coroutines.delay

/**
 * Gerenciador de autenticação local
 * 
 * Esta classe simula o comportamento do Firebase Authentication
 * sem depender de serviços externos. Ideal para desenvolvimento
 * e testes antes da integração com banco de dados.
 */
object LocalAuthManager {
    
    // Dados simulados de usuários (em produção, isso viria do banco)
    private val mockUsers = mutableMapOf<String, UserData>()
    private val mockProviders = mutableMapOf<String, ProviderData>()
    
    // Usuário atual logado
    var currentUser: UserData? = null
        private set
    var currentProvider: ProviderData? = null
        private set

    init {
        // Adicionar alguns usuários de teste
        mockUsers["teste@email.com"] = UserData(
            id = "user1",
            email = "teste@email.com",
            fullName = "Usuário Teste",
            password = "123456"
        )
        mockUsers["admin@email.com"] = UserData(
            id = "user2", 
            email = "admin@email.com",
            fullName = "Administrador",
            password = "admin123"
        )
        
        // Adicionar alguns prestadores de teste
        mockProviders["joao@email.com"] = ProviderData(
            id = "provider1",
            email = "joao@email.com",
            fullName = "João Silva",
            password = "123456",
            cpf = "12345678901",
            phone = "(11) 99999-9999",
            cep = "01234-567",
            address = "Rua das Flores, 123 - São Paulo/SP",
            services = listOf("Elétrica", "Hidráulica"),
            bank = "Banco do Brasil",
            agency = "1234",
            account = "12345-6",
            isVerified = true
        )
    }
    
    /**
     * Dados do usuário cliente
     */
    data class UserData(
        val id: String,
        val email: String,
        val fullName: String,
        val password: String,
        val userType: String = "client",
        val cpf: String? = null,
        val phone: String? = null,
        val cep: String? = null,
        val address: String? = null,
        val createdAt: Long = System.currentTimeMillis()
    )
    
    /**
     * Dados do prestador de serviço
     */
    data class ProviderData(
        val id: String,
        val email: String,
        val fullName: String,
        val password: String,
        val cpf: String,
        val phone: String,
        val cep: String,
        val address: String,
        val services: List<String>,
        val bank: String? = null, // Opcional - será preenchido posteriormente
        val agency: String? = null, // Opcional - será preenchido posteriormente
        val account: String? = null, // Opcional - será preenchido posteriormente
        val isVerified: Boolean = false,
        val createdAt: Long = System.currentTimeMillis()
    )
    
    /**
     * Resultado da autenticação
     */
    sealed class AuthResult {
        object Success : AuthResult()
        data class Error(val message: String) : AuthResult()
    }
    
    /**
     * Verifica se há um usuário logado
     */
    val isUserLoggedIn: Boolean
        get() = currentUser != null || currentProvider != null
    
    /**
     * Retorna o usuário atual
     */
    val user: UserData?
        get() = currentUser
    
    /**
     * Retorna o prestador atual
     */
    val provider: ProviderData?
        get() = currentProvider
    
    /**
     * Verifica se o usuário atual é um prestador
     */
    val isCurrentUserProvider: Boolean
        get() = currentProvider != null
    
    /**
     * Faz login com email e senha
     * 
     * DESENVOLVIMENTO: Aceita qualquer email e senha válidos
     */
    suspend fun signInWithEmailAndPassword(email: String, password: String): AuthResult {
        // Simular delay de rede
        delay(1000)
        
        // Verificar se o email é válido
        if (email.isEmpty() || !email.contains("@")) {
            return AuthResult.Error("Email inválido")
        }
        
        // Verificar se a senha tem pelo menos 1 caractere
        if (password.isEmpty()) {
            return AuthResult.Error("Senha é obrigatória")
        }
        
        // DESENVOLVIMENTO: Aceitar qualquer email e senha válidos
        // Primeiro verificar se é um prestador
        val existingProvider = mockProviders[email]
        if (existingProvider != null) {
            currentProvider = existingProvider
            return AuthResult.Success
        }
        
        // Depois verificar se é um usuário cliente
        val existingUser = mockUsers[email]
        if (existingUser != null) {
            currentUser = existingUser
        } else {
            // Criar um usuário temporário para o email fornecido
            val tempUser = UserData(
                id = "temp_${System.currentTimeMillis()}",
                email = email,
                fullName = email.split("@")[0].replaceFirstChar { it.uppercase() }, // Usar parte do email como nome
                password = password
            )
            currentUser = tempUser
        }
        
        return AuthResult.Success
    }
    
    /**
     * Cria uma nova conta de cliente
     */
    suspend fun createUserWithEmailAndPassword(
        email: String, 
        password: String, 
        fullName: String
    ): AuthResult {
        // Simular delay de rede
        delay(1500)
        
        return when {
            email.isEmpty() || !email.contains("@") -> AuthResult.Error("Email inválido")
            password.length < 1 -> AuthResult.Error("Senha deve ter pelo menos 1 caractere")
            fullName.isEmpty() -> AuthResult.Error("Nome é obrigatório")
            mockUsers.containsKey(email) -> AuthResult.Error("Email já está em uso")
            mockProviders.containsKey(email) -> AuthResult.Error("Email já está em uso por um prestador")
            else -> {
                val newUser = UserData(
                    id = "user_${System.currentTimeMillis()}",
                    email = email,
                    fullName = fullName,
                    password = password
                )
                
                mockUsers[email] = newUser
                currentUser = newUser
                AuthResult.Success
            }
        }
    }
    
    /**
     * Cria uma nova conta de prestador
     */
    suspend fun createProviderAccount(
        fullName: String,
        cpf: String,
        email: String,
        phone: String,
        password: String,
        cep: String,
        address: String,
        services: List<String>,
        bank: String,
        agency: String,
        account: String
    ): AuthResult {
        // Simular delay de rede
        delay(2000)
        
        return when {
            email.isEmpty() || !email.contains("@") -> AuthResult.Error("Email inválido")
            fullName.isEmpty() -> AuthResult.Error("Nome é obrigatório")
            cpf.isEmpty() -> AuthResult.Error("CPF é obrigatório")
            phone.isEmpty() -> AuthResult.Error("Telefone é obrigatório")
            cep.isEmpty() -> AuthResult.Error("CEP é obrigatório")
            address.isEmpty() -> AuthResult.Error("Endereço é obrigatório")
            services.isEmpty() -> AuthResult.Error("Selecione pelo menos um serviço")
            // Campos de banco são opcionais - serão preenchidos posteriormente
            mockUsers.containsKey(email) -> AuthResult.Error("Email já está em uso por um cliente")
            mockProviders.containsKey(email) -> AuthResult.Error("Email já está em uso")
            mockProviders.values.any { it.cpf == cpf } -> AuthResult.Error("CPF já cadastrado")
            else -> {
                val newProvider = ProviderData(
                    id = "provider_${System.currentTimeMillis()}",
                    email = email,
                    fullName = fullName,
                    password = password,
                    cpf = cpf,
                    phone = phone,
                    cep = cep,
                    address = address,
                    services = services,
                    bank = if (bank.isNotEmpty()) bank else null,
                    agency = if (agency.isNotEmpty()) agency else null,
                    account = if (account.isNotEmpty()) account else null,
                    isVerified = false
                )
                
                mockProviders[email] = newProvider
                currentProvider = newProvider
                AuthResult.Success
            }
        }
    }
    
    /**
     * Cria uma nova conta de cliente
     */
    suspend fun createClientAccount(
        fullName: String,
        cpf: String,
        email: String,
        phone: String,
        password: String,
        cep: String,
        address: String
    ): AuthResult {
        // Simular delay de rede
        delay(1500)
        
        return when {
            email.isEmpty() || !email.contains("@") -> AuthResult.Error("Email inválido")
            fullName.isEmpty() -> AuthResult.Error("Nome é obrigatório")
            phone.isEmpty() -> AuthResult.Error("Telefone é obrigatório")
            cep.isEmpty() -> AuthResult.Error("CEP é obrigatório")
            address.isEmpty() -> AuthResult.Error("Endereço é obrigatório")
            mockUsers.containsKey(email) -> AuthResult.Error("Email já está em uso")
            mockProviders.containsKey(email) -> AuthResult.Error("Email já está em uso por um prestador")
            cpf.isNotEmpty() && mockUsers.values.any { it.cpf == cpf } -> AuthResult.Error("CPF já cadastrado")
            else -> {
                val newUser = UserData(
                    id = "client_${System.currentTimeMillis()}",
                    email = email,
                    fullName = fullName,
                    password = password,
                    cpf = if (cpf.isNotEmpty()) cpf else null,
                    phone = phone,
                    cep = cep,
                    address = address
                )
                
                mockUsers[email] = newUser
                currentUser = newUser
                AuthResult.Success
            }
        }
    }
    
    /**
     * Faz logout
     */
    fun signOut() {
        currentUser = null
        currentProvider = null
    }
    
    /**
     * Envia email de recuperação de senha (simulado)
     */
    suspend fun sendPasswordResetEmail(email: String): AuthResult {
        // Simular delay de rede
        delay(800)
        
        // DESENVOLVIMENTO: Aceitar qualquer email válido
        return if (email.isNotEmpty() && email.contains("@")) {
            AuthResult.Success
        } else {
            AuthResult.Error("Email inválido")
        }
    }
    
    /**
     * Simula login com Google
     */
    suspend fun signInWithGoogle(): AuthResult {
        // Simular delay de rede
        delay(1200)
        
        // Simular sucesso ocasional (70% de chance)
        return if (System.currentTimeMillis() % 10 < 7) {
            val googleUser = UserData(
                id = "google_${System.currentTimeMillis()}",
                email = "usuario.google@gmail.com",
                fullName = "Usuário Google",
                password = ""
            )
            currentUser = googleUser
            AuthResult.Success
        } else {
            AuthResult.Error("Falha na autenticação com Google")
        }
    }
    
    /**
     * Simula login com Facebook
     */
    suspend fun signInWithFacebook(): AuthResult {
        // Simular delay de rede
        delay(1200)
        
        // Simular sucesso ocasional (60% de chance)
        return if (System.currentTimeMillis() % 10 < 6) {
            val facebookUser = UserData(
                id = "facebook_${System.currentTimeMillis()}",
                email = "usuario.facebook@facebook.com",
                fullName = "Usuário Facebook",
                password = ""
            )
            currentUser = facebookUser
            AuthResult.Success
        } else {
            AuthResult.Error("Falha na autenticação com Facebook")
        }
    }
    
    /**
     * Busca prestadores por região e serviço
     */
    suspend fun findProvidersByRegionAndService(cep: String, service: String): List<ProviderData> {
        // Simular delay de rede
        delay(500)
        
        return mockProviders.values.filter { provider ->
            // Simular busca por região (primeiros 5 dígitos do CEP)
            val providerCepPrefix = provider.cep.take(5)
            val searchCepPrefix = cep.take(5)
            
            providerCepPrefix == searchCepPrefix && 
            provider.services.contains(service) &&
            provider.isVerified
        }
    }
    
    /**
     * Busca todos os prestadores verificados
     */
    suspend fun getAllVerifiedProviders(): List<ProviderData> {
        // Simular delay de rede
        delay(300)
        
        return mockProviders.values.filter { it.isVerified }
    }
    
    /**
     * Obtém prestador por ID
     */
    fun getProviderById(id: String): ProviderData? {
        return mockProviders.values.find { it.id == id }
    }
    
    /**
     * Obtém prestador por email
     */
    fun getProviderByEmail(email: String): ProviderData? {
        return mockProviders[email]
    }
    
    /**
     * Atualiza dados do prestador
     */
    suspend fun updateProvider(provider: ProviderData): AuthResult {
        delay(500)
        
        return if (mockProviders.containsKey(provider.email)) {
            mockProviders[provider.email] = provider
            if (currentProvider?.id == provider.id) {
                currentProvider = provider
            }
            AuthResult.Success
        } else {
            AuthResult.Error("Prestador não encontrado")
        }
    }
    
    /**
     * Verifica se o prestador está logado
     */
    fun isProviderLoggedIn(): Boolean {
        return currentProvider != null
    }
    
    /**
     * Obtém o prestador atual
     */
    fun getCurrentProviderData(): ProviderData? {
        return currentProvider
    }

} 