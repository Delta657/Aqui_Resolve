# Correções de bugs do teste E2E — 2026-06-23

Correção dos 5 bugs encontrados no teste E2E do app cliente (relatório completo em
`relatorio-testes-e2e/RELATORIO.md`). Todas as mudanças são no **app Android** (Kotlin);
não houve alteração no painel, backend ou regras do Firestore. Uma migração de dados foi
executada no Firestore (ver BUG-02).

| ID | Severidade | Arquivo(s) | Status |
|----|-----------|-----------|--------|
| BUG-01 | Médio | `FirebaseAuthManager.kt` | ✅ corrigido + validado ao vivo |
| BUG-02 | Médio* | `models/SavedAddress.kt` (+ migração Firestore) | ✅ corrigido + validado ao vivo |
| BUG-03 | Cosmético | `ClientHomeActivity.kt` | ✅ corrigido |
| BUG-04 | Baixo (UX) | `utils/ImagePermissionHelper.kt`, `CreateOrderActivity.kt` | ✅ corrigido + validado ao vivo |
| BUG-05 | Cosmético | `PaymentActivity.kt` | ✅ corrigido |

\* BUG-02 foi reclassificado de "baixo" para "médio": além dos warnings, o flag de endereço
padrão **não sobrevivia ao round-trip** (nunca funcionava de fato).

---

## BUG-01 — Unicidade de nome de usuário não era validada

**Sintoma:** no cadastro, o app verificava se o `username` já existia consultando a coleção
`users` **antes de autenticar**. As regras do Firestore exigem `isSignedIn()` para ler `users`,
então a consulta levava `PERMISSION_DENIED`. O erro era engolido (`catch → return true`), e o
cadastro prosseguia — ou seja, **usernames duplicados eram aceitos**.

**Correção** (`FirebaseAuthManager.signUp`): a verificação de unicidade foi movida para
**depois** de `createUserWithEmailAndPassword` (quando o usuário já está autenticado e a
consulta a `users` passa nas regras). Se o nome já estiver em uso, a conta recém-criada no
Authentication é **desfeita** (`user.delete()`) para não deixar conta órfã, e o cadastro
retorna falha com a mensagem apropriada.

**Validação ao vivo:** tentativa de cadastro com username `qateste0623` (já existente) e
e-mail novo → rejeitado (`"Username já em uso — desfazendo conta recém-criada"`), e a conta
órfã `qa.dup.0623@aquiresolve.com` foi removida do Auth (confirmado via Admin SDK; sem doc
em `users`).

---

## BUG-02 — Endereço padrão não sobrevivia ao round-trip (Firestore)

**Sintoma:** ao salvar/ler endereços apareciam warnings
`CustomClassMapper: No setter/field for shortAddress / default / fullAddress`. Causa raiz:

1. Os getters computados `getFullAddress()`/`getShortAddress()` eram serializados pelo
   Firestore como campos `fullAddress`/`shortAddress` (que o modelo não relê).
2. O boolean `isDefault` — apesar do `@PropertyName("isDefault")` no nível da propriedade —
   era escrito pelo getter Kotlin `isDefault()` como o campo **`default`** (convenção bean
   `isX` → `x`). Mas a leitura e as **queries** (`whereEqualTo("isDefault", true)`) usavam
   `isDefault`. Resultado: **o endereço marcado como padrão nunca era reconhecido** após
   recarregar.

**Correção** (`models/SavedAddress.kt`):
- `@Exclude` em `getFullAddress()` e `getShortAddress()` — não são mais serializados (são
  derivados dos demais campos).
- `isDefault` passou a usar os use-site targets `@get:PropertyName("isDefault")` +
  `@set:PropertyName("isDefault")` (padrão oficial Kotlin+Firestore), forçando o nome de
  campo `isDefault` tanto na **escrita** quanto na **leitura** — consistente com as queries.

**Migração de dados (Firestore):** os 75 documentos existentes em `saved_addresses` tinham só
o campo legado `default`. Rodou-se uma migração que copiou `default` → `isDefault`
(64 docs atualizados; a query `isDefault==true` passou a retornar 69, igual aos `default==true`),
para que endereços padrão **já cadastrados** continuem funcionando com o app corrigido. O
campo legado `default` foi mantido (inofensivo; some conforme os docs são reescritos pelo app
novo).

**Validação ao vivo:** marcar "Definir como Padrão" no app gravou `isDefault: true` no
Firestore (antes gravava `default`).

---

## BUG-03 — `Glide: Received null model` ao carregar foto de perfil

**Sintoma:** warnings do Glide no login/home quando o usuário não tem foto de perfil
(`profileImageUrl == null`), pois era chamado `.load(null)`.

**Correção** (`ClientHomeActivity.loadProfileImage`): quando não há URL, carrega-se o
placeholder `R.drawable.ic_person` diretamente em vez de `load(null)`.

---

## BUG-04 — "Galeria" pedia permissão de CÂMERA

**Sintoma:** ao escolher **"Galeria"** no diálogo de anexar imagem do pedido, o app
solicitava a permissão de **CÂMERA** (além de fotos). Galeria só precisa de leitura de mídia.
Causa: `checkAndRequestImagePermissions` exigia `ALL_PERMISSIONS = [CAMERA, READ_MEDIA_IMAGES]`.

**Correção** (`utils/ImagePermissionHelper.kt` + `CreateOrderActivity.kt`):
- Novo conjunto `GALLERY_PERMISSIONS = [READ_MEDIA_IMAGES]` + métodos
  `hasGalleryPermissions` / `checkAndRequestGalleryPermissions` (só-galeria).
- `CreateOrderActivity.selectFromGallery()` passou a usar o caminho só-galeria. A câmera
  continua com o seu próprio pedido de permissão em `takePhoto()`.

**Validação ao vivo:** com a permissão de câmera revogada, escolher "Galeria" pediu apenas
"access photos and videos" (sem câmera); a galeria abriu e `CAMERA` permaneceu `granted=false`.

---

## BUG-05 — Texto impreciso no diálogo de cancelar pagamento

**Sintoma:** o diálogo "⚠️ Cancelar Pagamento?" dizia *"seu pedido NÃO será criado"*, mas
nesse ponto o pedido já existe como rascunho (`awaiting_payment`) — ele é cancelado/removido
ao sair.

**Correção** (`PaymentActivity.onBackPressed`): mensagem reescrita para
*"Se você sair agora, o pedido não será confirmado e será cancelado. Para concluir o pedido,
é necessário efetuar o pagamento."*

---

## Como gerar o APK com as correções

```bash
./gradlew :app:assembleDebug      # ou bundleRelease para a Play Store
```

As correções de BUG-01/03/04/05 e a parte de leitura do BUG-02 valem para qualquer instalação
do APK novo. A migração do Firestore (BUG-02) já foi aplicada em produção.
