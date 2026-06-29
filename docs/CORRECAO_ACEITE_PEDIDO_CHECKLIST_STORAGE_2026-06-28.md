# Correção — aceite de pedidos e fotos do checklist OS (2026-06-28)

## Problemas

1. O status legado `available` aparecia em alguns listeners/listas de pedidos, mas a tela de detalhes do prestador não oferecia o botão **Aceitar Pedido** para esse status. Resultado: o pedido podia aparecer como disponível e ainda assim não ter a ação correta na tela final.
2. A ação **Aceitar** da notificação de novo pedido apenas abria a tela de detalhes; não aceitava o pedido de fato.
3. A tela completa de pedidos do prestador podia voltar a exibir pedidos já recusados pelo próprio prestador.
4. O upload de fotos da OS falhava com `User does not have permission to access this object` quando o ruleset ativo do Firebase Storage não liberava corretamente as evidências em `checklists/{orderId}/...`.

## Correções aplicadas

- Adicionado `OrderData.STATUS_AVAILABLE = "available"` como compatibilidade explícita.
- `OrderDetailsActivity` agora trata `available` como status disponível para aceite.
- `ProviderOrdersActivity`, `OrdersTabFragment` e `ProviderOrdersFragment` passaram a incluir `available` nas consultas/filtros de pedidos disponíveis.
- `ProviderOrdersActivity` agora remove pedidos cujo `rejectedBy` contém o uid do prestador.
- Criado `AcceptOrderReceiver`: o botão **Aceitar** da notificação aceita o pedido em transação via `FirebaseOrderManager.acceptOrderAsProvider`, para o som do pedido e abre o detalhe do atendimento.
- Para múltiplos pedidos na mesma notificação, a ação muda para **Ver pedidos**, evitando aceitar um pedido arbitrário.
- `storage.rules` ganhou compatibilidade com `checklists/{orderId}/{phase}/{fileName}` além do caminho canônico `checklists/{orderId}/{fileName}`.

## Firebase

Deploy realizado em `aplicativoservico-143c2`:

```bash
npx -y firebase-tools@latest deploy --only storage,firestore:rules --project aplicativoservico-143c2 --non-interactive
```

Resultado: Storage rules compiladas e publicadas; Firestore rules recompiladas e liberadas. Os avisos de funções não usadas/nomes `request` são os avisos já conhecidos do projeto.

## Validação

```bash
./gradlew test
./gradlew assembleDebug
```

Ambos passaram. O APK debug atualizado foi gerado em:

```text
app/build/outputs/apk/debug/app-debug.apk
```

Tentativa de validação no Waydroid: o container iniciou, mas o Android não expôs os serviços `package`/`activity` e depois ficou sem ADB autorizado/saudável. Por isso a instalação no emulador local não foi concluída nesta rodada.
