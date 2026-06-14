---
name: aquiresolve-emulador
description: Emular e testar o APK do AquiResolve neste PC via Waydroid (Android em container). Use sempre que precisar instalar o APK, abrir o app, navegar telas, validar UI (ex.: um serviço novo aparece, cor de texto, layout) ou tirar screenshot/extrair texto da tela. Cobre subir o Waydroid num weston aninhado (o desktop é X11), autorizar o adb sem clicar no diálogo, contornar FLAG_SECURE e dirigir login/telas por adb. Credenciais de teste em `.emulator-test-credentials` (gitignored).
---

# AquiResolve — Emular o app no PC (Waydroid)

Este PC roda **Waydroid** (Android 11 em container LXC, vendor MAINLINE). O desktop é **X11**
(`DISPLAY=:0`), e o Waydroid precisa de um compositor **Wayland** — por isso usamos o **weston**
aninhado dentro do X11. Tudo já está instalado: `weston` 13, `waydroid`, e o `adb` em
`~/Android/Sdk/platform-tools/`.

> **Atalho:** `bash .claude/skills/aquiresolve-emulador/start-emulator.sh` faz os passos 1–5
> sozinho e imprime `DEVICE=<ip>:5555`. Os passos abaixo explicam o que ele faz e como depurar.

## 0. Variáveis de ambiente (sempre exporte antes dos comandos waydroid/weston)
```bash
export DISPLAY=:0 XAUTHORITY=/home/acer/.Xauthority XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wl-wd
ADB=~/Android/Sdk/platform-tools/adb
```

## 1. Subir o compositor Wayland (weston) aninhado no X11
```bash
nohup weston --backend=x11 --socket=wl-wd --width=540 --height=1140 >/tmp/weston.log 2>&1 &
# espera o socket aparecer em /run/user/1000/wl-wd
```
Sem isso, `waydroid session start` fica RUNNING mas **não renderiza** e o `screencap`/UI não funciona.

## 2. Iniciar a sessão Waydroid e a UI
```bash
nohup waydroid session start  >/tmp/waydroid-session.log 2>&1 &   # vira Session: RUNNING
nohup waydroid show-full-ui   >/tmp/waydroid-ui.log 2>&1 &        # cria a superfície de render
```
Pegue o IP do container (varia a cada boot):
```bash
waydroid status            # linha "IP address: 192.168.240.x"
```

## 3. Autorizar o adb SEM clicar no diálogo RSA  ⚠️ gotcha
`waydroid shell` exige **root/sudo** (indisponível aqui). E ao conectar, o adb fica
`unauthorized` porque o diálogo RSA aparece dentro do Android e não dá pra clicar.
**Solução:** plantar a chave pública do adb no data dir do Waydroid (acessível como usuário):
```bash
[ -f ~/.android/adbkey.pub ] || $ADB keygen ~/.android/adbkey
cat ~/.android/adbkey.pub > ~/.local/share/waydroid/data/misc/adb/adb_keys
$ADB kill-server; $ADB connect <IP>:5555     # agora autentica → "device"
```

## 4. Instalar o APK e abrir
```bash
cd /home/acer/Documentos/app
./gradlew assembleDebug                       # gera app/build/outputs/apk/debug/app-debug.apk
$ADB -s <IP>:5555 install -r -d app/build/outputs/apk/debug/app-debug.apk
$ADB -s <IP>:5555 shell am start -n com.aquiresolve.app/.MainActivity
```
`MainActivity` é a única exportada (launcher). As demais (`ServicesActivity`,
`CreateOrderActivity`, etc.) têm `exported=false` — não dá pra abri-las direto por `am start`;
chegue nelas navegando pela UI.

## 5. Login (dirigindo a UI por adb)  ⚠️ gotchas
Credenciais em **`.emulator-test-credentials`** (raiz do repo, gitignored). Cliente:
`cliente.teste@aquiresolve.com` / `Cliente123456!`. Qualquer usuário Firebase Auth sem doc em
`/users` é tratado como **cliente** e cai na `ClientHomeActivity`. A sessão **persiste** entre
reinstalações (`checkAndRestoreSession`), então normalmente só precisa logar uma vez.

Fluxo de digitação que funciona (tela de login tem `etEmail`, `etPassword`, `btnLogin`):
```bash
D=<IP>:5555
# pegue os bounds reais por uiautomator (ver abaixo) e toque no centro de cada campo
$ADB -s $D shell input tap <x_email> <y_email>
$ADB -s $D shell input text 'cliente.teste@aquiresolve.com'
$ADB -s $D shell input tap <x_senha> <y_senha>     # CONFIRME que mudou o foco (dump) antes de digitar
$ADB -s $D shell input text 'Cliente123456!'
$ADB -s $D shell input tap <x_btn> <y_btn>
```
- **Gotcha:** se você não confirmar a troca de foco, o `input text` cai tudo no mesmo campo
  (email+senha concatenados). Sempre redumpe e cheque `focused="true"` no campo certo.
- Para limpar um campo: `input tap` no campo, `input keyevent KEYCODE_MOVE_END`, e repetir
  `input keyevent 67` (DEL/backspace) ~50x.

## 6. Ver a tela: screenshot vs. texto  ⚠️ FLAG_SECURE
Várias telas têm `FLAG_SECURE` (`MainActivity`/login, `PixPaymentActivity`, `PaymentActivity`,
`SignUpActivity`, `ClientSignUpActivity`, `ProviderSignUpActivity`) → o `screencap` retorna
**PNG vazio (0 byte)** nelas. **`ServicesActivity`, `CreateOrderActivity`, `ClientHomeActivity`
NÃO têm FLAG_SECURE** → screenshot funciona.

Screenshot (telas sem FLAG_SECURE):
```bash
$ADB -s $D shell screencap -p /sdcard/s.png && $ADB -s $D pull /sdcard/s.png /tmp/s.png
```
**Texto renderizado (funciona até com FLAG_SECURE)** — melhor para asserts automáticos, ex.
"o serviço Guincho aparece?":
```bash
$ADB -s $D shell uiautomator dump /sdcard/u.xml && $ADB -s $D pull /sdcard/u.xml /tmp/u.xml
python3 - <<'PY'
import re; xml=open('/tmp/u.xml').read()
nodes=re.findall(r'<node[^>]*?/>',xml)
def attr(n,a): m=re.search(a+r'="([^"]*)"',n); return m.group(1) if m else None
for n in nodes:
    t=attr(n,'text')
    if t: print(repr(t), '| id=', (attr(n,'resource-id') or '').split('/')[-1], '| bounds=', attr(n,'bounds'))
PY
```
Use os `bounds="[x1,y1][x2,y2]"` para calcular o centro `((x1+x2)//2,(y1+y2)//2)` e tocar.

## 7. Verificação típica — "serviço novo do painel aparece no app?"
1. Login como cliente → `ClientHomeActivity`.
2. Toque em **"Ver Serviços"** (`btnMakeOrder`) → `ServicesActivity` (grid carregado do
   Firestore `service_categories` via `CatalogRepository`).
3. `uiautomator dump` e procure o nome do nicho (ex.: `Guincho`).
4. Toque no card do nicho → `CreateOrderActivity`; abra o dropdown "Tipo de serviço" e confirme
   o serviço (lido de `catalog_services` via `CatalogServiceRepository`).
   - Requer estar **logado** (regras Firestore exigem `isSignedIn()` para ler o catálogo).

## 8. Parar / limpar
```bash
waydroid session stop
pkill -f 'weston --backend=x11 --socket=wl-wd'
```

## Notas
- O `IP` muda a cada boot do container — sempre pegue de `waydroid status`.
- Se o adb ficar `offline/unauthorized` após reboot do container, repita o passo 3 e
  `adb connect`.
- `screencap` vazio + tela não-secure? Garanta que o `weston`/`show-full-ui` estão de pé
  (passo 1–2) — sem superfície de render o framebuffer sai preto/vazio.
- Build do APK: ver `CLAUDE.md` §3 (`./gradlew assembleDebug`). Lembre de subir `versionCode`
  ao distribuir pra celular real (senão o Android recusa reinstalar por cima).
