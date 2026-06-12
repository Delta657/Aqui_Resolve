# 🔥 Configuração do Firebase Admin SDK

## Problema

Se você está recebendo o erro `Firebase Admin não inicializado`, significa que a variável `FIREBASE_SERVICE_ACCOUNT` não está configurada corretamente.

## Solução

### 1. Obter Service Account Key

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto: `aplicativoservico-143c2`
3. Vá em **Project Settings** (ícone de engrenagem)
4. Clique na aba **Service Accounts**
5. Clique em **Generate new private key**
6. Baixe o arquivo JSON

### 2. Configurar no .env.local

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```env
# Firebase Admin Service Account (JSON format as string)
# IMPORTANTE: Cole o conteúdo do JSON como uma única linha
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"aplicativoservico-143c2","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**⚠️ IMPORTANTE:**
- O JSON deve estar em uma única linha
- Mantenha as quebras de linha `\n` dentro das strings
- Não adicione aspas extras ao redor do JSON
- O JSON completo deve estar entre aspas duplas

### 3. Converter JSON para uma linha

Se você tem o arquivo JSON, pode converter usando:

**No PowerShell (Windows):**
```powershell
$json = Get-Content -Path "serviceAccountKey.json" -Raw
$jsonEscaped = $json -replace '"', '\"' -replace "`n", "`\n" -replace "`r", ""
Add-Content -Path ".env.local" -Value "FIREBASE_SERVICE_ACCOUNT=$jsonEscaped"
```

**No Linux/Mac:**
```bash
# Converter JSON para uma linha e escapar corretamente
cat serviceAccountKey.json | jq -c . | sed 's/"/\\"/g' >> .env.local
echo 'FIREBASE_SERVICE_ACCOUNT="'$(cat serviceAccountKey.json | jq -c .)'"' >> .env.local
```

### 4. Verificar Configuração

Após configurar, reinicie o servidor de desenvolvimento:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
pnpm dev
```

Você deve ver no console:
```
✅ Firebase Service Account carregado
✅ Firebase Admin SDK inicializado com sucesso
```

### 5. Testar

Tente criar ou alterar a senha de um usuário. O erro não deve mais aparecer.

## Troubleshooting

### Erro: "Firebase Admin não inicializado"

1. Verifique se o `.env.local` existe na raiz do projeto
2. Verifique se `FIREBASE_SERVICE_ACCOUNT` está definida
3. Verifique se o JSON está válido (sem quebras de linha extras)
4. Reinicie o servidor após alterar o `.env.local`

### Erro: "Erro ao parsear FIREBASE_SERVICE_ACCOUNT"

- O JSON está mal formatado
- Há caracteres especiais não escapados
- Use um validador JSON online para verificar

### Erro: "auth/user-not-found"

- O usuário não existe no Firebase Auth
- Verifique se o usuário foi criado corretamente

## Segurança

⚠️ **NUNCA** commite o arquivo `.env.local` no Git!
- O arquivo já deve estar no `.gitignore`
- O Service Account Key dá acesso total ao seu projeto Firebase
- Mantenha-o seguro e privado


