# Correção: Pedidos Disponíveis não apareciam na Home do Prestador

**Data:** 2026-06-27  
**Arquivo modificado:** `app/src/main/java/com/aquiresolve/app/ProviderVerificationManager.kt`

---

## Problema

Na tela de início do prestador (`ProviderHomeActivity`), a seção "Pedidos Disponíveis" sempre mostrava "Seu perfil ainda não foi aprovado para receber pedidos.", mesmo quando o prestador já havia sido aprovado pelo painel admin.

## Causa Raiz

Inconsistência entre o valor gravado pelo painel admin e o valor esperado pelo app Android:

- **Painel Admin** (`/api/providers/[id]/verify`): grava `verificationStatus: 'approved'` no Firestore
- **App Android** (`ProviderVerificationManager.getVerificationStatus()`): só reconhecia `'verified'` e `'verificado'` como `APPROVED`

O banner de verificação na home (`updateVerificationBanner`) já reconhecia `'approved'` corretamente e sumia, dando a falsa impressão de que estava tudo certo. Mas a função `loadAvailableOrders()` usava `getVerificationStatus()` que retornava `PENDING` para `'approved'`, bloqueando a exibição dos pedidos.

## Correção

Adicionados `'approved'` e `'aprovado'` ao mapeamento em `ProviderVerificationManager.getVerificationStatus()`:

```kotlin
// Antes:
"verified", "verificado" -> VerificationStatus.APPROVED

// Depois:
"verified", "verificado", "approved", "aprovado" -> VerificationStatus.APPROVED
```

Isso também corrige o `refreshProviderLocationTracking()` que usava a mesma verificação.
