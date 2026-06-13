# Prompt para o Próximo Agente

Copie e cole este prompt completo para o próximo agente de IA iniciar os trabalhos:

---

## PROMPT

Você vai dar continuidade ao desenvolvimento do **AquiResolve**, um marketplace de serviços domésticos/profissionais. O projeto está em `/home/acer/Documentos/app/` e já tem código funcional. Preciso que você leia a documentação de continuidade primeiro e depois inicie o desenvolvimento.

**Leia estes arquivos obrigatoriamente antes de fazer qualquer coisa:**
1. `/home/acer/Documentos/app/Continuidade_com_codex/00_ESTADO_ATUAL.md`
2. `/home/acer/Documentos/app/Continuidade_com_codex/01_O_QUE_FALTA.md`
3. `/home/acer/Documentos/app/Continuidade_com_codex/02_ARQUITETURA_TECNICA.md`
4. `/home/acer/Documentos/app/Continuidade_com_codex/03_TESTES_PARA_FAZER.md`
5. `/home/acer/Documentos/app/Continuidade_com_codex/04_CONVENCOES_E_ARMADILHAS.md`
6. `/home/acer/Documentos/app/CLAUDE.md` (instruções do projeto para IA)

**Estrutura do projeto:**
- `app/` → Android app (Kotlin)
- `dashboard_admin/` → painel admin Next.js 15
- `backend/` → backend pagamentos Node.js (Render.com)
- `firestore.rules` → regras de segurança Firebase (na raiz)

**Regra de git:** commit direto em `main` (sem PR). Push em `main` → deploy automático Vercel.

**Arquivos que NUNCA devem ir ao GitHub:**
- `dashboard_admin/.env.local`
- `app/google-services.json`
- `app/keystore/`
- `backend/.env`

---

### Tarefa inicial: implementar o fluxo de conclusão obrigatório do pedido

O item de maior prioridade é o **#1 da lista "O que falta"**: hoje o prestador pode marcar um pedido como concluído sem passar pelo checklist → fotos → assinaturas. Isso precisa ser bloqueado.

**O que deve fazer:**

1. **No app Android** (`app/src/main/java/com/aquiresolve/app/`):
   - Em `ProviderOrdersActivity.kt` (ou `OrderDetailsActivity.kt`): quando o prestador clica "concluir serviço", forçar navegação para `ChecklistActivity` em vez de marcar direto como `completed`
   - O fluxo deve ser: `ChecklistActivity` → `PhotoEvidenceActivity` → `DigitalSignatureActivity` → tela de confirmação
   - Na tela de confirmação: gravar `providerCompletionConfirmed = true` no Firestore
   - Após isso, o cliente deve receber uma notificação e também confirmar (`clientCompletionConfirmed = true`)
   - Só depois de AMBAS as confirmações o `status` vai para `completed` (via Firestore rule ou via Admin SDK no painel)

2. **No Firestore** (ou Admin SDK no painel):
   - A mudança para `completed` pode ser feita: (a) pelo próprio app quando ambos confirmam, ou (b) por um Cloud Function que observa `providerCompletionConfirmed AND clientCompletionConfirmed`
   - **Recomendado:** deixar o app atualizar `status = completed` quando ambos confirmaram (mais simples, sem Cloud Functions)

3. **Teste:**
   - Após implementar, verifique que um prestador NÃO consegue marcar `completed` sem completar o checklist, fotos e assinatura
   - Use o Firestore Console para verificar os campos

4. **Commit e push** para `main` ao final.

---

### Segunda tarefa: tela de avaliação pós-conclusão

Após o pedido ir para `completed`, o cliente deve ser direcionado automaticamente para `RatingActivity` (o arquivo já existe em `app/src/main/java/com/aquiresolve/app/RatingActivity.kt`).

- Em `ClientOrdersActivity.kt` ou onde o cliente confirma a conclusão: após gravar `clientCompletionConfirmed = true`, navegar para `RatingActivity` com `orderId`
- `RatingActivity` deve salvar no Firestore: `rating` (1-5), `review` (texto), `ratedAt`
- Após salvar, atualizar média de avaliação do prestador em `providers/{uid}.rating`

---

### Referências rápidas de código relevante

**Checklist já implementado:**
- `app/src/main/java/com/aquiresolve/app/ChecklistActivity.kt`
- `app/src/main/java/com/aquiresolve/app/models/OsChecklistData.kt`
- `app/src/main/java/com/aquiresolve/app/FirebaseChecklistManager.kt`

**Fotos:**
- `app/src/main/java/com/aquiresolve/app/PhotoEvidenceActivity.kt`

**Assinaturas:**
- `app/src/main/java/com/aquiresolve/app/DigitalSignatureActivity.kt`

**Avaliação (esqueleto):**
- `app/src/main/java/com/aquiresolve/app/RatingActivity.kt`

**Pedidos do prestador:**
- `app/src/main/java/com/aquiresolve/app/ProviderOrdersActivity.kt`
- `app/src/main/java/com/aquiresolve/app/OrderDetailsActivity.kt`

**Fluxo de status:**
```
awaiting_payment → pending → distributing → assigned → in_progress → completed
                                                                   └→ cancelled
```

**Firebase project:** `aplicativoservico-143c2`
**Repositório:** `https://github.com/alvaro209890/AquiResolve`

---

Após ler toda a documentação, confirme o que entendeu e me pergunte se tiver dúvidas antes de começar a implementar.
