# 🔥 Configuração do Firebase - Resolução do Problema

## ❌ **Problema Atual**
O sistema carrega mas não consegue criar usuários porque o Firebase Admin SDK não está configurado.

## ✅ **Solução**

### **1. Criar arquivo .env.local**

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEqhKhvclyd-qfo2Hmxg2e44f0cF621CI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aplicativoservico-143c2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aplicativoservico-143c2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aplicativoservico-143c2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=183171649633
NEXT_PUBLIC_FIREBASE_APP_ID=1:183171649633:web:2cb40dbbdc82847cf8da20
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TSQBJSN34S

# Firebase Admin Service Account (JSON format as string)
# IMPORTANTE: Substitua pelo seu Service Account Key do Firebase Console
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"aplicativoservico-143c2","private_key_id":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@aplicativoservico-143c2.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40aplicativoservico-143c2.iam.gserviceaccount.com"}

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### **2. Obter Service Account Key**

1. **Acesse**: https://console.firebase.google.com
2. **Selecione o projeto**: `aplicativoservico-143c2`
3. **Vá em**: Project Settings > Service Accounts
4. **Clique em**: "Generate new private key"
5. **Baixe o arquivo JSON**
6. **Copie o conteúdo do JSON** e substitua a variável `FIREBASE_SERVICE_ACCOUNT`

### **3. Configurar Regras do Firestore**

1. **No Firebase Console**: Firestore Database > Rules
2. **Substitua por**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PERMISSÃO TOTAL PARA DESENVOLVIMENTO
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Regras específicas para a coleção adminmaster
    match /adminmaster/{document} {
      allow read, write: if true;
      
      // Subcoleção de usuários
      match /usuarios/{usuarioId} {
        allow read, write: if true;
      }
    }
  }
}
```

3. **Clique em "Publish"**

### **4. Testar a Configuração**

Após configurar, execute:

```bash
npm run dev
```

### **5. Verificar Logs**

No console do navegador, você deve ver:
- ✅ Firebase Service Account carregado
- ✅ Firebase Admin SDK inicializado com sucesso

### **6. Testar Criação de Usuário**

1. Acesse `/master`
2. Clique em "Adicionar Usuário"
3. Preencha os dados
4. Selecione as permissões
5. Clique em "Adicionar"

### **7. Troubleshooting**

Se ainda houver erro:

1. **Verifique se o JSON está válido**:
   ```bash
   echo $FIREBASE_SERVICE_ACCOUNT | jq .
   ```

2. **Verifique se as APIs estão habilitadas**:
   - Firestore API
   - Authentication API
   - Cloud Functions API

3. **Verifique as permissões do Service Account**:
   - Editor ou Owner do projeto
   - Firebase Admin SDK Service Agent

### **8. Para Produção**

Em produção, configure as variáveis de ambiente no Vercel:
- Vá em Project Settings > Environment Variables
- Adicione todas as variáveis do .env.local

## 🎯 **Resultado Esperado**

Após a configuração:
- ✅ Usuários serão criados no Firebase Auth
- ✅ Permissões serão salvas no Firestore
- ✅ Sistema funcionará completamente
- ✅ Interface responsiva funcionando
