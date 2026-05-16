# Política de Privacidade — Publicação para Play Console

Última atualização: 16/05/2026

Este documento explica como publicar a página de Política de Privacidade criada em `web/` e usar a URL no Google Play Console.

## 1. Onde está o site

Arquivos criados:

```text
web/index.html
web/styles.css
web/README.md
```

Conteúdo principal:

- Coleta de dados de cadastro.
- Dados de pedidos, chat, avaliações e suporte.
- Pagamentos via Pagar.me.
- Firebase/Auth/Firestore/Storage/FCM.
- Localização precisa/aproximada.
- Rastreamento do prestador em segundo plano com foreground service.
- Mapas via OSMDroid/OpenStreetMap e rotas via OSRM.
- Direitos do usuário/LGPD.
- Contato via WhatsApp.

## 2. Exigência do Play Console

O Play Console exige uma URL pública e acessível sem login.

A URL deve:

- Abrir no navegador sem autenticação.
- Não ser arquivo local.
- Não exigir senha.
- Estar disponível em domínio público HTTPS.
- Conter a política de privacidade do app.
- Ser compatível com o que o app declara em "Segurança dos dados".

## 3. Opções de hospedagem

### Opção A — GitHub Pages

Boa para começar rápido.

Passos:

1. Ir no GitHub do repositório.
2. Abrir `Settings`.
3. Abrir `Pages`.
4. Em `Build and deployment`, selecionar branch `main`.
5. Selecionar pasta `/web` se disponível.
6. Salvar.
7. Usar a URL gerada pelo GitHub Pages.

Exemplo esperado:

```text
https://alvaro209890.github.io/AquiResolve/
```

Observação: dependendo da configuração do GitHub Pages, pode ser necessário mover o conteúdo para `/docs` ou configurar uma action. Se `/web` não aparecer como opção, usar Firebase Hosting/Vercel/Netlify.

### Opção B — Firebase Hosting

Boa se quiser manter tudo no ecossistema Firebase.

Exemplo de `firebase.json` para publicar apenas `web/`:

```json
{
  "hosting": {
    "public": "web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

Deploy:

```bash
firebase deploy --only hosting
```

### Opção C — Vercel/Netlify/Cloudflare Pages

Configuração simples:

- Framework: nenhum/static.
- Root/public directory: `web`.
- Build command: vazio.
- Output directory: `web`.

## 4. Onde inserir no Play Console

No Play Console:

```text
Conteúdo do app → Política de Privacidade
```

Colar a URL pública da página.

Também revisar:

```text
Conteúdo do app → Segurança dos dados
```

A declaração deve ser coerente com a política:

- Localização: coletada e compartilhada operacionalmente entre cliente/prestador durante pedido.
- Informações pessoais: nome, email, telefone e dados de perfil.
- Fotos/vídeos ou arquivos: imagens anexadas a pedidos/documentos, se aplicável.
- Informações financeiras: processadas via Pagar.me/intermediador.
- Mensagens: chat do pedido.
- IDs do dispositivo/tokens: notificações e segurança.

## 5. Checklist antes de enviar para análise

- [ ] Página pública abre em janela anônima.
- [ ] URL usa HTTPS.
- [ ] Página menciona localização em segundo plano/foreground service.
- [ ] Página menciona pagamentos/intermediador.
- [ ] Página menciona Firebase/Google Cloud.
- [ ] Página tem contato do responsável.
- [ ] Play Console usa a mesma URL.
- [ ] Formulário "Segurança dos dados" bate com a política.
- [ ] APK/AAB tem política de permissões consistente com o texto.

## 6. URL pendente

Ainda falta escolher onde hospedar e gerar a URL pública final.

Depois de publicar, registrar aqui:

```text
URL da Política de Privacidade: PENDENTE
```
