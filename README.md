# AquiResolve — Marketplace de Serviços

Aplicativo Android para conectar clientes a prestadores de serviços. Clientes encontram, contratam e pagam por serviços; prestadores gerenciam pedidos, agenda e recebimentos.

## Stack

| Tecnologia | Versão |
|---|---|
| Kotlin | 1.9.22 |
| Compile/Target SDK | 35 |
| Min SDK | 24 |
| Gradle | 8.13.2 |
| Firebase BOM | 32.7.0 |
| Retrofit | 2.9.0 |
| OkHttp | 4.12.0 |
| Glide | 4.16.0 |
| ZXing | 3.5.2 |
| OSMDroid | 6.1.18 |
| Material Design | 3 |
| Coroutines | 1.7.3 |

## Arquitetura

```
Activities → Managers → Firebase
```

- **Presentation:** ~40 Activities com ViewBinding + coroutines (`lifecycleScope`)
- **Managers:** Toda a lógica de negócio em classes separadas (Firebase e negócio)
- **Models:** Anotados com `@PropertyName` do Firestore
- **Adapters:** ~15 RecyclerView adapters

## Funcionalidades

### Autenticação
- Cadastro e login para **cliente** e **prestador** (fluxos separados)
- Recuperação de senha
- Firebase Authentication

### Pedidos
- Criação de pedidos com categorias de serviço
- Fluxo de status: `pending → distributing → assigned → in_progress → completed`
- Distribuição automática para prestadores disponíveis
- Código de verificação de 6 dígitos na conclusão
- Cancelamento com política de reembolso (5 min)

### Pagamentos (Pagar.me v5)
- **Cartão de crédito:** Validação Luhn, detecção de bandeira
- **PIX:** Geração de QR Code (ZXing), polling automático a cada 5s
- API em `https://aquiresolve.onrender.com/api/payments/`

### Chat
- Tempo real via Firestore listeners
- Bloqueio de acesso de 5 minutos após aceitação do pedido

### Localização
- Google Play Services (atualização a cada 5 min)
- Mapas via OSMDroid (OpenStreetMap)
- GeoPoint no Firestore

### Imagens
- Compressão para max 1MB / 1920x1080
- Firebase Storage
- Glide para carregamento
- PhotoView para zoom
- uCrop para recorte de avatar

### Notificações
- Firebase Cloud Messaging
- Múltiplos canais de notificação
- Privacidade na entrega

### Outros
- Agendamento de serviços (SchedulingManager)
- Avaliações (RatingManager)
- Histórico de serviços
- Documentos do prestador (upload e verificação)
- Gerenciamento de endereços

## Pré-requisitos

- Android Studio Hedgehog ou superior
- Android SDK 35
- JDK 17
- Conta Firebase com projeto configurado

## Configuração

1. Clone o repositório:
```bash
git clone git@github.com:alvaro209890/AquiResolve.git
```

2. Adicione o arquivo `app/google-services.json` do Firebase Console

3. (Opcional) Configure keystore de release em `keystore/upload-keystore.credentials.properties`

## Build

```bash
./gradlew assembleDebug          # APK debug
./gradlew installDebug           # Instalar em dispositivo
./gradlew assembleRelease        # APK release (minificado + ofuscado)
./gradlew bundleRelease          # AAB release (Play Store)
./gradlew lint                   # Verificações de lint
./gradlew test                   # Testes unitários
```

## Estrutura do Projeto

```
app/
├── src/main/java/com/aquiresolve/app/
│   ├── adapters/          # RecyclerView adapters
│   ├── api/               # Retrofit (Pagar.me)
│   ├── constants/         # Constantes (códigos de pagamento)
│   ├── models/            # Data classes Firestore
│   │   └── payment/       # Modelos de pagamento
│   ├── payment/           # Lógica Pagar.me
│   ├── utils/             # Helpers (permissões, código, formatação)
│   ├── *.kt               # Activities + Managers
│   └── AppApplication.kt # Application class
├── google-services.json   # Config Firebase
├── build.gradle           # Build do módulo
└── proguard-rules.pro     # Regras ProGuard
```

## Firebase

- **Projeto:** `aplicativoservico-143c2`
- **Firestore:** Regras em `firestore.rules`, índices em `firestore.indexes.json`
- **Storage:** Regras em `storage.rules`
- **Realtime Database:** Regras em `database.rules.json`

## Licença

MIT
