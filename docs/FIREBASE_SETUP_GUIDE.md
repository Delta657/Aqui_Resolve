# Firebase Setup Guide - Resolver Erro CONFIGURATION_NOT_FOUND

## Problema Atual
O erro `CONFIGURATION_NOT_FOUND` está ocorrendo porque o arquivo `google-services.json` contém valores placeholder em vez dos valores reais do seu projeto Firebase.

## Solução Completa

### 1. Acessar Firebase Console
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Selecione o projeto `gasprojeto-b6797` (ou crie um novo se necessário)

### 2. Configurar Authentication
1. No menu lateral, clique em **Authentication**
2. Clique em **Get started**
3. Na aba **Sign-in method**, habilite:
   - **Email/Password** (já deve estar habilitado)
   - **Google** (opcional, para login social)
4. Clique em **Save**

### 3. Configurar Android App
1. No menu lateral, clique em **Project settings** (ícone de engrenagem)
2. Na aba **General**, role até **Your apps**
3. Clique em **Add app** → **Android**
4. Configure:
   - **Android package name**: `com.example.loginapp`
   - **App nickname**: `AppServiço` (opcional)
   - **Debug signing certificate SHA-1**: (opcional por enquanto)
5. Clique em **Register app**

### 4. Baixar google-services.json
1. Após registrar o app, o Firebase irá gerar um arquivo `google-services.json`
2. Baixe este arquivo
3. Substitua o arquivo atual em `app/google-services.json` pelo novo arquivo

### 5. Verificar Configuração
O novo arquivo `google-services.json` deve ter uma estrutura similar a esta:

```json
{
  "project_info": {
    "project_number": "700301197838",
    "project_id": "gasprojeto-b6797",
    "storage_bucket": "gasprojeto-b6797.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:700301197838:android:1234567890abcdef",
        "android_client_info": {
          "package_name": "com.example.loginapp"
        }
      },
      "oauth_client": [
        {
          "client_id": "700301197838-abcdefghijklmnop.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyAmQn-FP2RRvq8T7r7wvtzqKPIKiH1A6SE"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "700301197838-abcdefghijklmnop.apps.googleusercontent.com",
              "client_type": 3
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

### 6. Configurar Firestore Database
1. No menu lateral, clique em **Firestore Database**
2. Clique em **Create database**
3. Escolha **Start in test mode** (para desenvolvimento)
4. Escolha a localização mais próxima (ex: `us-central1`)
5. Clique em **Done**

### 7. Configurar Storage
1. No menu lateral, clique em **Storage**
2. Clique em **Get started**
3. Escolha **Start in test mode**
4. Escolha a localização mais próxima
5. Clique em **Done**

### 8. Configurar Cloud Messaging
1. No menu lateral, clique em **Cloud Messaging**
2. O FCM já deve estar habilitado automaticamente

### 9. Testar a Aplicação
1. Limpe e recompile o projeto:
   ```bash
   ./gradlew clean
   ./gradlew build
   ```
2. Execute o app no emulador/dispositivo
3. Teste o login com as credenciais admin:
   - Email: `aquiresolveservico123@gmail.com`
   - Senha: `jocimar123`

## Estrutura do Firestore

Após configurar, o Firestore deve ter as seguintes coleções:

### Coleção: `users`
```json
{
  "userId": {
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "phone": "+5511999999999",
    "userType": "client", // ou "provider"
    "createdAt": "2024-01-01T00:00:00Z",
    "profileImageUrl": "https://...",
    "isActive": true
  }
}
```

### Coleção: `orders`
```json
{
  "orderId": {
    "clientId": "userId",
    "providerId": "providerUserId",
    "title": "Título do Serviço",
    "description": "Descrição detalhada",
    "category": "Limpeza",
    "budget": 150.0,
    "status": "pending", // pending, accepted, in_progress, completed, cancelled
    "location": {
      "address": "Rua Example, 123",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "images": ["url1", "url2"],
    "documents": ["url1"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Coleção: `messages`
```json
{
  "messageId": {
    "orderId": "orderId",
    "senderId": "userId",
    "receiverId": "providerUserId",
    "message": "Olá, gostaria de mais informações",
    "timestamp": "2024-01-01T00:00:00Z",
    "isRead": false
  }
}
```

### Coleção: `notifications`
```json
{
  "notificationId": {
    "userId": "userId",
    "title": "Novo Pedido",
    "message": "Você recebeu um novo pedido de serviço",
    "type": "new_order",
    "orderId": "orderId",
    "isRead": false,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Regras de Segurança Versionadas

As regras reais do projeto agora ficam versionadas na raiz do repositório:

- `firestore.rules`
- `storage.rules`
- `database.rules.json`
- `firebase.json`

Esses arquivos já refletem os caminhos e coleções realmente usados pelo app:

- Firestore: `users`, `providers`, `orders`, `orders/{orderId}/messages`, `notifications`, `carts`, `privacy_settings`, `provider_documents`, `userTokens`, coleções de catálogo e legados compatíveis.
- Storage: `profile_images`, `Documentos`, `documents`, `provider_documents`, `selfies`, `Selfie`, `Pedidos`, `order_images`, `chats`, além de caminhos legados como `profiles/` e `orders/{orderId}/images`.
- Realtime Database: `presence/{uid}` para status online/offline do chat.

Observação importante:

- As regras foram endurecidas com foco em compatibilidade máxima.
- Algumas coleções continuam legíveis para usuários autenticados (`orders`, `users`, `providers`) porque o app atual faz consultas amplas e misturou dados públicos/privados no mesmo documento.
- Para um hardening total sem exposição residual, será necessário refatorar o schema e algumas queries do app.

## Deploy das Regras

Depois de autenticar no Firebase CLI, publique as regras com:

```bash
firebase deploy --project <PROJECT_ID> --only firestore:rules,storage,database
```

Se quiser validar a configuração local antes do deploy:

```bash
firebase use <PROJECT_ID>
firebase deploy --only firestore:rules,storage,database
```

O arquivo `firebase.json` já aponta para:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `database.rules.json`

## Recomendação de Rollout

1. Publique as regras em um projeto de teste primeiro.
2. Valide login, criação de pedido, upload de imagens, chat, notificações, carrinho e upload de documentos.
3. Só depois replique no projeto principal.
4. Se algum fluxo administrativo for feito pelo app cliente, mova-o para backend/Admin SDK antes de endurecer ainda mais as regras.

## Próximos Passos

1. Siga o guia acima para configurar corretamente o Firebase
2. Substitua o arquivo `google-services.json` pelo arquivo correto do Firebase Console
3. Teste a aplicação novamente
4. Se ainda houver problemas, verifique os logs do Android Studio para mais detalhes

## Contato

Se precisar de ajuda adicional, verifique:
- Logs do Android Studio (Logcat)
- Console do Firebase para erros
- Configuração da rede/internet no dispositivo/emulador 
