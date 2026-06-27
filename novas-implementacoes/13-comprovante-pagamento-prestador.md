# 13 — Comprovante de Pagamento a Prestadores

**Data:** 2026-06-27
**Status:** Implementado

## Resumo

Sistema completo de anexo de comprovantes (PDF/imagem) aos pagamentos de prestadores. Após confirmar um pagamento no painel, o admin pode anexar o comprovante bancário diretamente no Firebase Storage.

---

## Fluxo

```
Admin clica "Pagar" no prestador
    ↓
Preenche valor, método (PIX/TED/DOC/transferência), descrição
    ↓
Clica "Confirmar Pagamento"
    ↓
API POST /api/financial/providers/payment processa (já existia):
  - Transação atômica Firestore
  - Alocação FIFO por pedido
  - Cria documento em provider_payments/{id}
    ↓
Diálogo mostra: "Pagamento registrado — anexe o comprovante"
    ↓
Admin arrasta/seleciona PDF ou imagem
    ↓
API POST /api/financial/providers/payment/{id}/receipt:
  - Upload para Firebase Storage (provider_payments/{id}/comprovantes/)
  - Signed URL (7 dias)
  - Atualiza documento com array receipts[]
    ↓
Comprovante visível com opções: Visualizar / Remover
    ↓
"Concluir" fecha o diálogo
```

---

## Arquivos criados/modificados

### APIs

| Arquivo | Método | Descrição |
|---|---|---|
| `app/api/financial/providers/payment/[id]/receipt/route.ts` | POST | Upload de comprovante (multipart) |
| `app/api/financial/providers/payment/[id]/route.ts` | GET | Detalhes do pagamento (com receipts) |

### Componentes

| Arquivo | Descrição |
|---|---|
| `components/financeiro/receipt-upload.tsx` | Drop zone com drag-drop, preview de imagem, validação de tipo/tamanho |

### Modificações

| Arquivo | Alteração |
|---|---|
| `app/dashboard/financeiro/faturamento/page.tsx` | Diálogo de pagamento agora tem 2 passos: confirmar → anexar comprovante |

---

## Armazenamento Firebase

### Storage

```
provider_payments/{paymentId}/comprovantes/{timestamp}_{filename}
```

- **Tipos aceitos:** PDF, PNG, JPEG, WebP
- **Tamanho máximo:** 10 MB
- **URLs:** Signed URLs (7 dias) — admin acessa via painel
- **Metadados:** paymentId, originalName, uploadedBy, uploadedByEmail

### Firestore

Documento `provider_payments/{paymentId}` ganha campos:

```typescript
{
  receipts: ReceiptData[]   // array de comprovantes
  hasReceipt: boolean
  lastReceiptAt: string      // ISO timestamp
  updatedAt: Timestamp
}

ReceiptData = {
  fileName: string
  storagePath: string
  contentType: string
  size: number
  uploadedAt: string
  uploadedBy: string          // uid do admin
  uploadedByEmail: string
}
```

---

## Segurança

- **API requer permissão `operarFinanceiro`**
- **Upload via Admin SDK** — service account credentials, bypassa regras Storage
- **Validação server-side:** tipo MIME, tamanho máximo 10 MB
- **Sanitização de nome:** caracteres não-alfanuméricos substituídos por `_`
- **Signed URLs:** acesso temporário (7 dias), não expõe arquivos publicamente

---

## Componente ReceiptUpload

Estados do componente:

| Estado | Visual |
|---|---|
| **Drop zone** | Área pontilhada "Arraste ou clique para anexar" |
| **Drag over** | Borda primary, scale(1.02), fundo highlight |
| **Arquivo selecionado** | Card com preview (imagem) ou ícone (PDF), nome, tamanho, botões Enviar/Cancelar |
| **Enviando** | Loader "Enviando..." |
| **Erro** | Banner vermelho com mensagem |
| **Sucesso** | Banner verde "Comprovante anexado" com botões Visualizar/Remover |

---

## Build

```bash
npx next build  # compila sem erros
```

## Deploy

Vercel automático (push no main).
Firebase Storage bucket: `aplicativoservico-143c2.appspot.com`
