# Correções nas Configurações (Privacidade/Conta) — 2026-06-28

Correção dos bugs encontrados na revisão das telas de configuração (cliente e
prestador compartilham `ProfileActivity` → `PrivacySettingsActivity` /
`NotificationSettingsActivity`).

---

## 1. "Exportar Dados" não exportava nada (recurso fake)

**Antes:** `FirebasePrivacyManager.exportUserData()` só gravava um doc na coleção
`data_exports` no Firestore. **Não havia download/arquivo/compartilhamento** — o
usuário nunca recebia os dados. O diálogo ainda prometia "download por 30 dias",
"2-5 MB", etc.

**Agora:** `exportUserData()` monta um **JSON real** (perfil, configurações de
privacidade e pedidos do usuário), sanitizando tipos do Firestore
(Timestamp/GeoPoint/etc.). A `PrivacySettingsActivity` salva esse JSON em
`cacheDir/aquiresolve_meus_dados.json` e abre o **menu de compartilhar** via
`FileProvider` (`${applicationId}.fileprovider`, já existente). Download real
(salvar no Drive, enviar por e-mail, etc.). Os diálogos falsos foram removidos.

## 2. Toggle "Compartilhamento de dados" não fazia nada

**Antes:** o único leitor de `data_sharing_enabled` era o
`PrivacyAwareNotificationManager`, que **nunca era instanciado** (código morto).
O switch salvava um flag sem efeito.

**Agora:** o toggle controla a **coleta do Firebase Analytics**
(`FirebaseAnalytics.setAnalyticsCollectionEnabled`, persistido pelo SDK entre
sessões). Aplicado ao alternar e ao abrir a tela (`applyDataSharingPreference`).

## 3. "Excluir Conta" — três bugs sérios

**Antes:**
- **3a.** Apagava os dados do Firestore **antes** de apagar a conta Auth; o
  `user.delete()` exige login recente e, se falhasse com `requires-recent-login`,
  os dados já tinham sido apagados e a conta Auth permanecia → estado inconsistente,
  sem reautenticação.
- **3b.** Apagava **todos os pedidos onde o usuário era `assignedProvider`** → um
  prestador, ao excluir a conta, destruía o **histórico de pedidos dos CLIENTES**.
- **3c.** Limpava a coleção `chats` (com `participants`), que não é a usada pelo
  app → no-op silencioso.

**Agora** (`deleteUserAccount(password)`):
- **Reautentica com a senha ANTES** de qualquer exclusão. Se a senha estiver
  errada, **nada é apagado** (acaba o `requires-recent-login` no meio do processo).
  A `PrivacySettingsActivity` pede `EXCLUIR` **+ senha** no diálogo.
- Apaga **só os dados do próprio usuário**: `privacy_settings`, `fcm_tokens`,
  `providers/{uid}`, **pedidos onde `clientId == uid`** (NÃO os de terceiros),
  imagens de perfil/documentos e `users/{uid}`. A conta Auth é apagada por último
  (já reautenticada).
- Removida a limpeza quebrada de `chats`.

### Regra Firestore reforçada (defesa em profundidade do 3b)
`orderDeleteAllowed` deixava o `assignedProvider` apagar o pedido. Removido — agora
**só o cliente dono (ou admin)** pode excluir um pedido. Nenhum fluxo do app deleta
pedido como prestador (verificado), então é seguro. **Escopo: Firebase (regras).**

## 4. Excesso de leituras no Firestore (latência)

`isSettingEnabled`/`getSettingString` faziam um `get()` no doc `privacy_settings` a
**cada** chamada (a tela de notificações lia o mesmo doc ~8× ao abrir; o handler de
FCM ~4-6× por notificação). Agora há um **cache curto (3s) do doc** com invalidação
em cada escrita → 1 leitura por janela, reduzindo latência do alerta (relevante com
app morto/offline).

---

## Publicação

| Plataforma | Mudou? | Ação |
|---|---|---|
| **GitHub** (Delta `main` + alvaro) | Sim | push |
| **Firebase** (regras) | Sim (3b/defesa) | deploy das regras |
| **Render / Vercel** | Não | sem mudança |
| **APK** | App (1,2,3,4) | **NÃO gerado** (a pedido) — efeito no app só após APK novo |

**Validação:** `compileDebugKotlin` = BUILD SUCCESSFUL. As correções de app (1-4)
valem quando o APK novo for gerado; a regra do Firestore (3b) vale **na hora** para
o app já instalado.
