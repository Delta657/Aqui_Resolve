# Localização e Mapas — AquiResolve

Última atualização: 16/05/2026

Este documento descreve a arquitetura atual de localização/mapas do app AquiResolve, o que já foi corrigido, como validar em aparelho real e o que ainda pode ser melhorado antes de produção.

## 1. Visão geral

O AquiResolve usa localização para:

- Seleção do endereço do serviço pelo cliente em mapa.
- Cálculo de distância/rota entre prestador e cliente.
- Atualização da posição do prestador no Firestore.
- Acompanhamento do prestador pelo cliente durante pedidos.
- Elegibilidade para pedidos próximos.

Tecnologias usadas:

- **Fused Location Provider**: localização do aparelho Android.
- **Firestore**: persistência da localização do prestador.
- **OSMDroid/OpenStreetMap**: exibição dos mapas.
- **OSRM público**: cálculo de rota de carro.
- **Foreground Service Android**: rastreamento em background com notificação persistente.

## 2. Arquivos principais

### Android

- `app/src/main/java/com/aquiresolve/app/ProviderLocationForegroundService.kt`
  - Service real do Android para rastreamento contínuo.
  - Atualiza Firestore com latitude/longitude.
  - Exibe notificação persistente.

- `app/src/main/java/com/aquiresolve/app/ProviderDashboardActivity.kt`
  - Verifica se o prestador é aprovado.
  - Verifica permissão e GPS.
  - Inicia/para o `ProviderLocationForegroundService`.

- `app/src/main/java/com/aquiresolve/app/ProviderLocationService.kt`
  - Implementação legada/singleton de rastreamento.
  - Ainda existe no código, mas o dashboard passou a usar o Foreground Service real.

- `app/src/main/java/com/aquiresolve/app/OrderDetailsActivity.kt`
  - Mostra mapa do pedido.
  - Exibe marcador do cliente.
  - Exibe marcador do prestador.
  - Escuta localização do prestador via Firestore na visão do cliente.
  - Calcula rota via OSRM e usa linha reta como fallback.

- `app/src/main/java/com/aquiresolve/app/AddressMapPickerActivity.kt`
  - Tela de escolha de endereço no mapa.
  - Usa OSMDroid e MyLocation overlay.

- `app/src/main/java/com/aquiresolve/app/utils/LocationPermissionHelper.kt`
  - Helper de permissão de localização e GPS.

### Manifest

- `app/src/main/AndroidManifest.xml`
  - Permissões:
    - `ACCESS_FINE_LOCATION`
    - `ACCESS_COARSE_LOCATION`
    - `FOREGROUND_SERVICE`
    - `FOREGROUND_SERVICE_LOCATION`
    - `POST_NOTIFICATIONS`
  - Service declarado:

```xml
<service
    android:name=".ProviderLocationForegroundService"
    android:exported="false"
    android:foregroundServiceType="location" />
```

## 3. Dados salvos no Firestore

O prestador tem a localização atualizada em:

```text
users/{uid}
```

Campos atualizados:

- `coordinates`: `GeoPoint(latitude, longitude)`
- `latitude`: `Double`
- `longitude`: `Double`
- `accuracy`: precisão em metros
- `lastLocationUpdate`: `Timestamp`
- `locationEnabled`: `Boolean`

A visão do cliente lê:

```text
users/{assignedProvider}.latitude
users/{assignedProvider}.longitude
```

## 4. Fluxo de rastreamento do prestador

1. Prestador abre `ProviderDashboardActivity`.
2. App verifica se o usuário é prestador.
3. App verifica status de aprovação via `ProviderVerificationManager`.
4. App verifica permissão de localização.
5. App verifica se GPS/localização do aparelho está ativado.
6. Se tudo estiver OK, chama:

```kotlin
ProviderLocationForegroundService.start(this)
```

7. O service chama `startForeground()` com notificação persistente.
8. O service solicita updates ao Fused Location Provider.
9. Cada update salva localização no Firestore.
10. Ao parar, o app chama:

```kotlin
ProviderLocationForegroundService.stop(this)
```

11. O service remove callbacks, marca `locationEnabled=false`, remove foreground notification e para.

## 5. Fluxo de mapa do cliente

1. Cliente abre os detalhes de um pedido.
2. `OrderDetailsActivity` lê as coordenadas do cliente em `OrderData.coordinates`.
3. App coloca marcador em `Local do serviço`.
4. Se houver `assignedProvider`, escuta `users/{providerId}` com `addSnapshotListener`.
5. Quando latitude/longitude chegam, coloca/atualiza marcador do prestador.
6. A cada movimento relevante ou intervalo, recalcula rota via OSRM.
7. Se OSRM falhar, desenha linha reta como fallback.

## 6. Correções já aplicadas

### Fase Mapa 1

- `AddressMapPickerActivity`
  - Adicionado `hasLocationPermission()`.
  - Botão "Minha localização" não ativa GPS sem permissão.
  - `onDestroy()` limpa `MyLocationNewOverlay` e chama `map.onDetach()`.

- `OrderDetailsActivity`
  - Evita múltiplos overlays de toque no mapa.
  - Reaproveita `OkHttpClient` para chamadas OSRM.

### Fase Mapa 2

- Criado `ProviderLocationForegroundService`.
- Service declarado no Manifest com `foregroundServiceType="location"`.
- `ProviderDashboardActivity` integrado ao foreground service.
- Texto de permissão atualizado para mencionar rastreamento em segundo plano com notificação.
- `locationEnabled=false` passa a ser atualizado antes de parar o service.

## 7. Validação já feita

Comando executado:

```bash
export ANDROID_HOME=/home/server/Android/Sdk
./gradlew assembleDebug
```

Resultado:

```text
BUILD SUCCESSFUL
```

## 8. Checklist de teste em aparelho real

### Permissões

- [ ] Instalar APK em Android 10+.
- [ ] Entrar como prestador aprovado.
- [ ] Conceder permissão de localização.
- [ ] Em Android 13+, conceder permissão de notificações.
- [ ] Confirmar que GPS/localização do aparelho está ligado.

### Foreground Service

- [ ] Abrir dashboard do prestador.
- [ ] Confirmar notificação persistente: "AquiResolve compartilhando localização".
- [ ] Minimizar o app.
- [ ] Confirmar que a notificação continua visível.
- [ ] No Firestore, verificar atualização em `users/{uid}`.
- [ ] Fechar/sair do dashboard e confirmar `locationEnabled=false`.

### Cliente acompanhando prestador

- [ ] Criar pedido com coordenadas.
- [ ] Atribuir/aceitar pedido com prestador.
- [ ] Abrir detalhes do pedido como cliente.
- [ ] Confirmar marcador do local do serviço.
- [ ] Confirmar marcador do prestador.
- [ ] Mover o aparelho do prestador.
- [ ] Confirmar atualização do marcador e distância/rota.

### Mapa de endereço

- [ ] Abrir seleção de endereço no mapa.
- [ ] Negar permissão e tocar em "Minha localização".
- [ ] Confirmar que o app pede permissão ou mostra fluxo seguro, sem crash.
- [ ] Tocar no mapa e salvar ponto.
- [ ] Reabrir a tela várias vezes e verificar que não há travamento ou vazamento aparente.

## 9. Pontos que ainda faltam/atenção

### 9.1 Permissão de notificação Android 13+

O Manifest tem `POST_NOTIFICATIONS` e há fluxos que solicitam essa permissão em `MainActivity`, `NotificationSettingsActivity`, `PrivacySettingsActivity` e `PermissionHelper`.

Atenção:

- Ainda precisa teste real em Android 13+ para garantir que a permissão foi solicitada antes do prestador iniciar rastreamento.
- Se o usuário negar notificações, o foreground service ainda pode funcionar, mas a notificação pode ter visibilidade limitada para o usuário.

Recomendação:

- No dashboard do prestador, antes de iniciar localização, exibir explicação clara caso notificações estejam negadas e direcionar para ativação.

### 9.2 Controle de disponibilidade do prestador

Hoje o dashboard inicia rastreamento para prestador aprovado com permissão/GPS.

Recomendação de produto:

- Rastrear apenas quando o prestador estiver marcado como disponível ou com pedido ativo.
- Evita consumo de bateria e reduz coleta de dados desnecessária.

### 9.3 Classe legada `ProviderLocationService`

A classe antiga ainda existe.

Status:

- Não foi removida porque pode haver referência futura ou fluxo antigo.
- `ProviderDashboardActivity` já usa `ProviderLocationForegroundService`.

Recomendação:

- Após teste real, remover ou migrar funções úteis (`enableLocation`, `disableLocation`) para um manager/service único.

### 9.4 OSRM público

O OSRM público (`router.project-osrm.org`) não tem SLA para produção.

Recomendação:

- Manter fallback de linha reta.
- Se o app crescer, usar proxy/backend próprio ou provedor com SLA.

### 9.5 Background Location (`ACCESS_BACKGROUND_LOCATION`)

O app **não solicita** `ACCESS_BACKGROUND_LOCATION`.

Motivo:

- O rastreamento foi implementado via Foreground Service com notificação persistente, que é o caminho menos invasivo e mais aceitável para Play Console.
- Solicitar background location aumenta a exigência de revisão do Google Play.

Atenção:

- O service deve ser iniciado enquanto o app está em foreground.
- Testar em Android 11+ com app minimizado para confirmar comportamento no aparelho alvo.

## 10. Estado atual

Status técnico atual:

- Compila.
- Tem foreground service real.
- Manifest coerente.
- OSMDroid com lifecycle cleanup nas telas revisadas.
- Rota tem fallback.

Status de produção:

- Pronto para teste real em aparelho.
- Ainda falta validar permissão de notificação Android 13+ e decidir regra de produto para quando rastrear.
