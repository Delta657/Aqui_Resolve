# 📚 Documentação técnica — AquiResolve

Índice da pasta `docs/`. Para a visão geral do projeto comece pelo
[`README.md`](../README.md) da raiz; para o guia mestre (arquitetura, decisões e
todos os fluxos) veja o [`CLAUDE.md`](../CLAUDE.md).

> Convenção dos nomes: `SISTEMA_*` descreve um subsistema; `CORRECAO_*`/`MELHORIAS_*`
> registram uma mudança (geralmente com data `AAAA-MM-DD`); planos de produto ficam em
> [`../novas-implementacoes/`](../novas-implementacoes/).

---

## 🚀 Comece aqui

| Doc | Sobre |
|---|---|
| [FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md) | Passo a passo de configuração do Firebase (Auth, regras, admin master) |
| [FIREBASE_IMPLEMENTATION.md](FIREBASE_IMPLEMENTATION.md) | Como o Firebase é usado em cada componente |
| [ARQUITETURA_PAGAMENTO_PRODUCAO.md](ARQUITETURA_PAGAMENTO_PRODUCAO.md) | Arquitetura do fluxo de pagamento em produção |

## ⚙️ Infraestrutura & configuração

| Doc | Sobre |
|---|---|
| [CONFIGURACAO_FIRESTORE_INDICES.md](CONFIGURACAO_FIRESTORE_INDICES.md) · [INDICES_FIRESTORE.md](INDICES_FIRESTORE.md) | Índices compostos do Firestore (quando criar, como evitar o erro 500) |
| [LOCALIZACAO_MAPAS.md](LOCALIZACAO_MAPAS.md) | Configuração de mapas e localização |
| [CHECKLIST_PRESTADOR_FIREBASE_RENDER.md](CHECKLIST_PRESTADOR_FIREBASE_RENDER.md) | Contrato do checklist mobile ↔ admin ↔ Firebase ↔ Render |
| [PLAY_CONSOLE_PRIVACIDADE.md](PLAY_CONSOLE_PRIVACIDADE.md) | Privacidade para a Play Store |
| [WEB_ADMIN_PROMPT.md](WEB_ADMIN_PROMPT.md) | Notas do painel web admin |

## 🧱 Subsistemas

| Doc | Sobre |
|---|---|
| [SISTEMA_CASHBACK_AQUICASH.md](SISTEMA_CASHBACK_AQUICASH.md) · [cashback-painel-admin.md](cashback-painel-admin.md) | Programa de fidelidade AquiCash (fases, tiers, combos) |
| [SISTEMA_CHECKLIST_OS.md](SISTEMA_CHECKLIST_OS.md) | Ordem de Serviço digital (checklist, fotos, assinatura) |
| [SISTEMA_CODIGO_VERIFICACAO.md](SISTEMA_CODIGO_VERIFICACAO.md) | Finalização do serviço por código do cliente |
| [SISTEMA_EXPIRACAO_PEDIDOS.md](SISTEMA_EXPIRACAO_PEDIDOS.md) | Expiração automática de pedidos não atendidos |
| [SISTEMA_LOCALIZACAO_PRESTADORES.md](SISTEMA_LOCALIZACAO_PRESTADORES.md) | Rastreamento ao vivo do prestador |
| [SISTEMA_IMAGENS.md](SISTEMA_IMAGENS.md) · [SISTEMA_IMAGENS_FIREBASE.md](SISTEMA_IMAGENS_FIREBASE.md) | Upload e exibição de imagens |
| [TABELA_PRECOS_SERVICOS.md](TABELA_PRECOS_SERVICOS.md) | Tabela de preços dos serviços |
| [MELHORIAS_SISTEMA_VERIFICACAO.md](MELHORIAS_SISTEMA_VERIFICACAO.md) | Verificação de prestadores |
| [TEMA_ESCURO_2026-06-24.md](TEMA_ESCURO_2026-06-24.md) | Tema escuro do app |

## 💳 Pagamentos (Pagar.me)

| Doc | Sobre |
|---|---|
| [SISTEMA_PAGAMENTO_PAGARME.md](SISTEMA_PAGAMENTO_PAGARME.md) · [SISTEMA_PAGAMENTO_PIX.md](SISTEMA_PAGAMENTO_PIX.md) | Fluxos de cartão e PIX |
| [VERIFICACAO_AUTOMATICA_PIX.md](VERIFICACAO_AUTOMATICA_PIX.md) | Confirmação automática do PIX (webhook/polling) |
| [ALTERACOES_SEGURANCA_PAGAMENTOS_2026-05-18.md](ALTERACOES_SEGURANCA_PAGAMENTOS_2026-05-18.md) | Endurecimento de segurança do pagamento |
| [CORRECAO_API_PAGARME_V5.md](CORRECAO_API_PAGARME_V5.md) · [CORRECAO_FLUXO_PAGAMENTO.md](CORRECAO_FLUXO_PAGAMENTO.md) · [CORRECAO_PAGAMENTOS_PAGARME_2026-06-27.md](CORRECAO_PAGAMENTOS_PAGARME_2026-06-27.md) | Correções da integração v5 (payload legado → v5) |
| [CORRECAO_PRECOS_SERVICOS.md](CORRECAO_PRECOS_SERVICOS.md) · [MELHORIAS_UX_PAGAMENTO.md](MELHORIAS_UX_PAGAMENTO.md) | Preços e UX do checkout |

## 🤖 Inteligência Artificial (Helô)

| Doc | Sobre |
|---|---|
| [HELO_ANALISE_DE_IMAGEM_2026-06-28.md](HELO_ANALISE_DE_IMAGEM_2026-06-28.md) | Helô analisa a foto do problema e sugere o serviço (Groq vision) |
| [../novas-implementacoes/06-assistente-ia-groq.md](../novas-implementacoes/06-assistente-ia-groq.md) · [06b](../novas-implementacoes/06b-assistente-ia-chat-v2.md) · [08](../novas-implementacoes/08-assistente-ia-painel-admin.md) | Planos do assistente (app v1/v2 e Copiloto do painel) |

## 🔔 Alerta sonoro de novos pedidos

| Doc | Sobre |
|---|---|
| [CORRECAO_SOM_NOVO_PEDIDO_2026-06-28.md](CORRECAO_SOM_NOVO_PEDIDO_2026-06-28.md) | **Causa‑raiz** do som que não tocava (FGS `dataSync` sem permissão na API 34+) |
| [CORRECAO_SOM_PEDIDO_NICHO_2026-06-28.md](CORRECAO_SOM_PEDIDO_NICHO_2026-06-28.md) | Notificação por nicho (pedido normal usa `serviceName`) |
| [CORRECAO_RECUSA_PEDIDO_E_SOM_2026-06-28.md](CORRECAO_RECUSA_PEDIDO_E_SOM_2026-06-28.md) | Recusa por‑prestador + parada do som no aceite |
| [SOM_PEDIDO_DISPONIBILIDADE_2026-06-28.md](SOM_PEDIDO_DISPONIBILIDADE_2026-06-28.md) | Tocar só para prestador disponível |

## 🛠 Correções & melhorias recentes (jun/2026)

| Doc | Sobre |
|---|---|
| [CORRECAO_CHAT_PRESTADOR_E_CONTA_ATIVA_2026-06-28.md](CORRECAO_CHAT_PRESTADOR_E_CONTA_ATIVA_2026-06-28.md) | Mensagem da Central caía na conta de cliente + reabrir na conta ativa |
| [CORRECAO_REEMBOLSO_2026-06-28.md](CORRECAO_REEMBOLSO_2026-06-28.md) | Notificação de reembolso (token correto) + estados no app |
| [CORRECAO_CONFIGURACOES_PRIVACIDADE_2026-06-28.md](CORRECAO_CONFIGURACOES_PRIVACIDADE_2026-06-28.md) | Abas de configuração (cliente/prestador) |
| [CORRECOES_PRESTADOR_2026-06-28.md](CORRECOES_PRESTADOR_2026-06-28.md) · [MELHORIAS_PAINEL_2026-06-28.md](MELHORIAS_PAINEL_2026-06-28.md) | Melhorias do prestador e do painel |
| [CORRECAO_CENTRAL_OPERACIONAL_2026-06-24.md](CORRECAO_CENTRAL_OPERACIONAL_2026-06-24.md) · [CORRECAO_COMBO_PARCEIRO_2026-06-24.md](CORRECAO_COMBO_PARCEIRO_2026-06-24.md) | Central operacional, combos e parceiros |
| [CORRECAO_PERMISSION_DENIED_PEDIDO_2026-06-15.md](CORRECAO_PERMISSION_DENIED_PEDIDO_2026-06-15.md) | `PERMISSION_DENIED` ao criar/atualizar pedido (regras) |
| [CORRECOES_BUGS_E2E_2026-06-23.md](CORRECOES_BUGS_E2E_2026-06-23.md) · [AUDITORIA_E_CORRECOES_2026-06-13.md](AUDITORIA_E_CORRECOES_2026-06-13.md) · [DETALHES_IMPLEMENTACAO_2026-06-13.md](DETALHES_IMPLEMENTACAO_2026-06-13.md) | Auditorias e correções E2E |

## ✅ QA & planos

| Doc | Sobre |
|---|---|
| [QA_PAINEL_ADMIN_2026-06-24.md](QA_PAINEL_ADMIN_2026-06-24.md) | QA do painel admin no navegador real |
| [PLANO_CHAT_BASE_CLIENTE.md](PLANO_CHAT_BASE_CLIENTE.md) | Plano do Chat Base ↔ Cliente |
| [../novas-implementacoes/00-roadmap-e-prioridades.md](../novas-implementacoes/00-roadmap-e-prioridades.md) | Roadmap e prioridades de produto |
