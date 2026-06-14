#!/usr/bin/env bash
# Sobe o Waydroid dentro de um weston aninhado (desktop é X11), autoriza o adb
# e imprime o serial do device. Idempotente: pode rodar de novo sem quebrar.
# Uso:  bash start-emulator.sh        → deixa pronto e imprime DEVICE=IP:5555
set -u

export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-/home/acer/.Xauthority}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/1000}"
export WAYLAND_DISPLAY=wl-wd
ADB="$HOME/Android/Sdk/platform-tools/adb"
WD_SOCK="$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY"
WD_ADBKEYS="$HOME/.local/share/waydroid/data/misc/adb/adb_keys"

log(){ echo ">> $*"; }

# 1) Compositor Wayland aninhado (weston) ----------------------------------------
if [ ! -S "$WD_SOCK" ]; then
  log "iniciando weston (socket $WAYLAND_DISPLAY)…"
  nohup weston --backend=x11 --socket="$WAYLAND_DISPLAY" --width=540 --height=1140 \
    >/tmp/weston.log 2>&1 &
  for i in $(seq 1 15); do [ -S "$WD_SOCK" ] && break; sleep 1; done
fi
[ -S "$WD_SOCK" ] || { echo "ERRO: weston não criou o socket. Veja /tmp/weston.log"; exit 1; }

# 2) Sessão Waydroid -------------------------------------------------------------
if ! waydroid status 2>/dev/null | grep -q "Session:.*RUNNING"; then
  log "iniciando sessão Waydroid…"
  nohup waydroid session start >/tmp/waydroid-session.log 2>&1 &
  for i in $(seq 1 30); do waydroid status 2>/dev/null | grep -q "Session:.*RUNNING" && break; sleep 2; done
fi
nohup waydroid show-full-ui >/tmp/waydroid-ui.log 2>&1 &

# 3) Espera o IP do container ----------------------------------------------------
IP=""
for i in $(seq 1 30); do
  IP=$(waydroid status 2>/dev/null | awk -F'\t' '/IP address/{print $2}')
  [ -n "$IP" ] && [ "$IP" != "UNKNOWN" ] && break
  sleep 3
done
[ -n "$IP" ] && [ "$IP" != "UNKNOWN" ] || { echo "ERRO: Waydroid não obteve IP."; exit 1; }
log "IP do Waydroid: $IP"

# 4) Pré-autoriza o adb (sem precisar clicar no diálogo RSA) ----------------------
[ -f "$HOME/.android/adbkey.pub" ] || "$ADB" keygen "$HOME/.android/adbkey" >/dev/null 2>&1
mkdir -p "$(dirname "$WD_ADBKEYS")" 2>/dev/null
cat "$HOME/.android/adbkey.pub" > "$WD_ADBKEYS" 2>/dev/null && log "chave adb autorizada"

# 5) Conecta o adb e espera boot completo ----------------------------------------
"$ADB" kill-server >/dev/null 2>&1; "$ADB" start-server >/dev/null 2>&1
"$ADB" connect "$IP:5555" >/dev/null 2>&1
for i in $(seq 1 20); do
  BC=$("$ADB" -s "$IP:5555" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  [ "$BC" = "1" ] && break; sleep 3
done
"$ADB" devices | grep -q "$IP:5555.*device" || { echo "ERRO: adb não autorizou ($IP:5555)."; exit 1; }

echo
echo "DEVICE=$IP:5555"
echo "Pronto. Ex.: $ADB -s $IP:5555 install -r -d caminho/app-debug.apk"
