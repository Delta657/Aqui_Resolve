# Correção — Prestadores já aprovados aparecendo "Verificação em análise" (2026-06-29)

## Sintoma

Vários prestadores **já aprovados** continuavam vendo o banner **"⏳ Verificação em
análise"** na `ProviderHomeActivity`, mesmo estando verificados (podiam receber
pedidos, rastreamento ativo, etc.). O painel admin os listava como aprovados.

Caso reportado para diagnóstico: `utibaterias@gmail.com`
(uid `mmQSPJgodpMcOhjguVTTND2y1Gg2`).

## Causa raiz

O campo `providers/{uid}.verificationStatus` foi gravado historicamente com **três
valores diferentes** para a mesma situação ("aprovado"):

| Valor              | Qtde (de 49) | Origem                                                    |
|--------------------|--------------|-----------------------------------------------------------|
| `approved`         | 14           | Painel atual — `PATCH /api/providers/[id]/verify`         |
| `verified`         | 1            | App — `ProviderVerificationManager.approveVerification`   |
| `verificado` (PT)  | 34           | **Legado** — nenhum código atual grava esse valor         |

A maioria dos leitores do app **tolera todos os sinônimos** e funcionava certo:

- `ProviderVerificationManager.getVerificationStatus()` mapeia
  `verified / verificado / approved / aprovado` → `APPROVED`.
- `ProviderLocationService` / `ProviderLocationForegroundService`: aceitam
  `verified || verificado`.
- Backend `provider-notification-logic.js`: aceita `approved/verified/aprovado/verificado`.

**A única exceção era o banner da Home.** `ProviderHomeActivity.updateVerificationBanner()`
foi escrito à mão e só reconhecia a string **literal `"approved"`**:

```kotlin
when (status.lowercase()) {
    "approved" -> GONE                       // só esse escondia o banner
    "rejected" -> ...
    else       -> "Verificação em análise"   // verificado/verified caíam aqui
}
```

Resultado: os **35 prestadores** gravados como `verificado`/`verified` (verificados de
fato, `isVerified: true`) caíam no `else` e viam "em análise" para sempre — apesar de
o app, em todo o resto, tratá-los como aprovados.

## Correção

### 1. Banner tolerante (causa do bug visual) — `ProviderHomeActivity.kt`

`updateVerificationBanner()` passou a aceitar **a mesma lista de sinônimos** que o
`ProviderVerificationManager` já usava, garantindo que qualquer valor histórico
exiba o estado correto:

```kotlin
when (status.lowercase()) {
    "approved", "aprovado", "verified", "verificado" -> GONE
    "rejected", "rejeitado" -> // banner vermelho
    else -> // "Verificação em análise"
}
```

### 2. Writer padronizado — `ProviderVerificationManager.kt`

`approveVerification()` gravava `verificationStatus = "verified"`, divergindo do
painel (`"approved"`). Passou a gravar o **valor canônico único** + `isVerified`:

```kotlin
"verificationStatus" to "approved",
"isVerified" to true,
```

Assim, **toda nova aprovação** (app ou painel) usa o mesmo valor `"approved"`.

### 3. Normalização dos dados existentes (resolve o APK já instalado)

Script Admin SDK (rede de segurança com backup antes) converteu os 35 docs cujo
`verificationStatus` ∈ {`verified`, `verificado`, `aprovado`} para `approved` +
`isVerified: true`.

**Resultado:** `providers.verificationStatus` → **49/49 = `approved`**.

> Como o bug visual dependia só do valor no Firestore, a normalização **já corrige os
> aparelhos com o APK atual** — o banner some ao reabrir a Home. O APK novo (item 1)
> é a proteção definitiva caso algum valor divergente reapareça.

## Valor canônico (padrão a seguir daqui pra frente)

- **Gravar sempre `verificationStatus = "approved"`** (e `isVerified = true`) ao aprovar.
- **Ao ler**, tolerar os sinônimos legados (`verified/verificado/aprovado`) — nunca
  comparar só com `"approved"`. Espelhar `ProviderVerificationManager.kt`.
- `rejected` (com `rejectionReason`) para reprovado; ausência/`pending` para em análise.

## Arquivos alterados

- `app/src/main/java/com/aquiresolve/app/ProviderHomeActivity.kt` — banner tolerante.
- `app/src/main/java/com/aquiresolve/app/ProviderVerificationManager.kt` — grava `approved` + `isVerified`.

## Como reproduzir o diagnóstico

Listar a distribuição dos valores na coleção `providers` (Admin SDK / service account):

```js
const snap = await db.collection('providers').get();
const counts = {};
snap.forEach(d => { const v = d.data().verificationStatus ?? '(ausente)'; counts[v] = (counts[v]||0)+1; });
console.table(counts); // esperado pós-correção: { approved: <total> }
```

## APK

`./gradlew :app:assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk` (debug).
