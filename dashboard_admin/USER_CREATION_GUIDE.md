# 👥 Guia de Criação de Usuários Administrativos

## 🎯 **Funcionalidade**
Sistema completo para criar usuários do zero e definir suas permissões de acesso ao painel administrativo.

## ✨ **Recursos Implementados**

### **1. Templates de Permissões Pré-definidos**
- **👑 Administrador Completo**: Acesso total ao sistema
- **👨‍💼 Gerente**: Acesso a gestão e relatórios
- **⚙️ Operador**: Acesso básico ao sistema
- **👁️ Visualizador**: Apenas visualização

### **2. Interface Intuitiva**
- **Seleção por Template**: Clique em um template para aplicar permissões automaticamente
- **Resumo Visual**: Veja quantas permissões estão ativas
- **Controles Rápidos**: Botões "Todas" e "Nenhuma" para seleção rápida
- **Permissões Individuais**: Ajuste cada permissão individualmente

### **3. Validação Inteligente**
- **Campos Obrigatórios**: Nome, email e senha são obrigatórios
- **Pelo Menos Uma Permissão**: Sistema exige que pelo menos uma permissão seja selecionada
- **Email Único**: Verifica se o email já existe antes de criar

### **4. Feedback Visual**
- **Contador de Permissões**: Mostra "X de Y" permissões selecionadas
- **Tags Coloridas**: Permissões ativas aparecem como tags laranja
- **Estados de Loading**: Botão mostra "Criando..." durante o processo
- **Mensagens de Erro/Sucesso**: Feedback claro sobre o resultado

## 🚀 **Como Usar**

### **Passo 1: Acessar a Página**
1. Vá para `/master` no dashboard
2. Clique em "Adicionar Usuário"

### **Passo 2: Preencher Dados Básicos**
- **Nome**: Nome completo do usuário
- **Email**: Email único (será usado para login)
- **Senha**: Senha segura para o usuário

### **Passo 3: Escolher Permissões**

#### **Opção A: Usar Template**
1. Clique em um dos templates disponíveis:
   - **Administrador Completo**: Acesso total
   - **Gerente**: Gestão e relatórios
   - **Operador**: Acesso básico
   - **Visualizador**: Apenas visualização

#### **Opção B: Personalizar**
1. Use os botões "Todas" ou "Nenhuma" para seleção rápida
2. Ajuste cada permissão individualmente:
   - ✅ **Dashboard**: Acesso ao painel principal
   - ✅ **Controle**: Módulo de controle
   - ✅ **Gestão de Usuários**: Gerenciar outros usuários
   - ✅ **Gestão de Pedidos**: Gerenciar pedidos
   - ✅ **Financeiro**: Acesso ao módulo financeiro
   - ✅ **Relatórios**: Visualizar relatórios
   - ✅ **Configurações**: Acessar configurações

### **Passo 4: Confirmar Criação**
1. Verifique o resumo das permissões selecionadas
2. Clique em "Adicionar"
3. Aguarde a confirmação de sucesso

## 🔧 **Permissões Disponíveis**

| Permissão | Descrição | Recomendado Para |
|-----------|-----------|------------------|
| **Dashboard** | Acesso ao painel principal | Todos os usuários |
| **Controle** | Módulo de controle operacional | Operadores, Gerentes |
| **Gestão de Usuários** | Criar/editar outros usuários | Administradores, Gerentes |
| **Gestão de Pedidos** | Gerenciar pedidos do sistema | Operadores, Gerentes |
| **Financeiro** | Acesso a dados financeiros | Gerentes, Administradores |
| **Relatórios** | Visualizar relatórios | Todos os usuários |
| **Configurações** | Configurar sistema | Administradores |

## 📱 **Responsividade**

A interface se adapta automaticamente a:
- 📱 **Mobile** (320px+): Layout em coluna única
- 📱 **Tablet** (768px+): Layout em 2 colunas
- 💻 **Desktop** (1024px+): Layout em 3-4 colunas

## ⚠️ **Importante**

1. **Email Único**: Cada usuário deve ter um email único
2. **Senha Segura**: Use senhas com pelo menos 6 caracteres
3. **Permissões**: Sempre selecione pelo menos uma permissão
4. **Firebase Admin**: Certifique-se de que o Firebase Admin está configurado

## 🔐 **Configuração Necessária**

Para o sistema funcionar, configure:
1. **Firebase Admin SDK** (veja `FIREBASE_ADMIN_SETUP.md`)
2. **Variáveis de Ambiente** no `.env.local`
3. **Regras do Firestore** para permitir escrita

## 🎉 **Resultado**

Após a criação, o usuário:
- ✅ Recebe credenciais de login (email + senha)
- ✅ Tem acesso apenas às permissões selecionadas
- ✅ Aparece na lista de usuários gerenciáveis
- ✅ Pode ter suas permissões editadas posteriormente
