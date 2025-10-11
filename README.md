# LoginApp - Aplicativo de Login e Cadastro

Um aplicativo Android moderno para autenticação de usuários com interface Material Design 3.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Tela de Login** com validação de campos
- **Tela de Cadastro** com validação completa
- **Recuperação de senha** (simulada)
- **Login social** (Google e Facebook - simulado)
- **Interface moderna** com Material Design 3
- **Validações locais** sem dependência de banco de dados
- **Animações e feedback visual**
- **Suporte a ViewBinding**

### 🔄 Em Desenvolvimento
- Integração com banco de dados (Supabase/Firebase)
- Tela principal após login
- Perfil do usuário
- Configurações da conta

## 📱 Screenshots

### Tela de Login
- Campos de email e senha com validação
- Botões de login social (Google/Facebook)
- Link para recuperação de senha
- Link para cadastro

### Tela de Cadastro
- Campos: nome completo, email, senha, confirmação de senha
- Checkbox para aceitar termos
- Botões de cadastro social
- Validações em tempo real

## 🛠️ Tecnologias Utilizadas

- **Kotlin** - Linguagem principal
- **Android SDK** - Framework Android
- **Material Design 3** - Design system
- **ViewBinding** - Binding de views
- **Coroutines** - Programação assíncrona
- **Lifecycle Components** - Gerenciamento de ciclo de vida

## 📋 Pré-requisitos

- Android Studio Arctic Fox ou superior
- Android SDK 24+
- Kotlin 1.9.10+

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/LoginApp.git
```

2. Abra o projeto no Android Studio

3. Sincronize o projeto (File > Sync Project with Gradle Files)

4. Execute o aplicativo em um emulador ou dispositivo físico

## 🧪 Testando o Aplicativo

### Usuários de Teste
O aplicativo inclui alguns usuários pré-cadastrados para teste:

- **Email:** `teste@email.com` | **Senha:** `123456`
- **Email:** `admin@email.com` | **Senha:** `admin123`

### Funcionalidades de Teste
- **Login local:** Use os usuários acima
- **Cadastro:** Crie novos usuários
- **Login social:** Simulação com delays
- **Recuperação de senha:** Simulação de envio de email

## 🏗️ Arquitetura

### Estrutura de Arquivos
```
app/src/main/java/com/example/loginapp/
├── MainActivity.kt           # Tela de login
├── SignUpActivity.kt         # Tela de cadastro
└── LocalAuthManager.kt       # Gerenciador de autenticação local

app/src/main/res/
├── layout/
│   ├── activity_main.xml     # Layout da tela de login
│   └── activity_signup.xml   # Layout da tela de cadastro
├── values/
│   ├── colors.xml           # Cores do tema
│   ├── strings.xml          # Strings do aplicativo
│   └── themes.xml           # Temas Material Design 3
└── drawable/
    └── *.xml                # Ícones e backgrounds
```

### Componentes Principais

#### LocalAuthManager
- Gerencia autenticação local sem banco de dados
- Simula comportamento do Firebase
- Inclui usuários de teste
- Suporte a login social simulado

#### MainActivity
- Interface de login
- Validação de campos
- Integração com LocalAuthManager
- Navegação para cadastro

#### SignUpActivity
- Interface de cadastro
- Validação completa de dados
- Criação de contas locais
- Navegação de volta para login

## 🎨 Design

### Material Design 3
- **Cores:** Paleta de cores moderna e acessível
- **Tipografia:** Hierarquia clara de textos
- **Componentes:** Cards, botões e campos Material Design
- **Animações:** Transições suaves e feedback visual

### Responsividade
- Suporte a diferentes tamanhos de tela
- Orientação portrait e landscape
- Adaptação a diferentes densidades de pixel

## 🔮 Próximos Passos

### Fase 1: Funcionalidades Básicas ✅
- [x] Interface de login
- [x] Interface de cadastro
- [x] Validações locais
- [x] Autenticação simulada

### Fase 2: Integração com Banco de Dados 🔄
- [ ] Configuração do Supabase/Firebase
- [ ] Migração de LocalAuthManager para banco real
- [ ] Implementação de login social real
- [ ] Sistema de verificação de email

### Fase 3: Funcionalidades Avançadas 📋
- [ ] Tela principal após login
- [ ] Perfil do usuário
- [ ] Configurações da conta
- [ ] Logout e gerenciamento de sessão

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma [issue](https://github.com/seu-usuario/LoginApp/issues) no GitHub.

---

**Desenvolvido com ❤️ para a comunidade Android**

