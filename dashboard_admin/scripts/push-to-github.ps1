# ============================================================
# SUBIR PROJETO PRO GITHUB
# ============================================================
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1
#   OU pelo npm: pnpm run push:github
#   OU dê duplo-clique em push-to-github.bat
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot + "\.."
Set-Location $projectRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUBIR PRO GITHUB - Dashboard Admin" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Remover index.lock se existir
Write-Host "[1/5] Verificando lock do Git..." -ForegroundColor Yellow
if (Test-Path .git\index.lock) {
    Remove-Item -Force .git\index.lock
    Write-Host "      index.lock removido." -ForegroundColor Green
} else {
    Write-Host "      OK." -ForegroundColor Gray
}

# 2. Build do projeto (cmd evita que avisos do Node ex: API_KEY interrompam o script)
Write-Host "`n[2/5] Executando build..." -ForegroundColor Yellow
cmd /c "pnpm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERRO: Build falhou. Corrija os erros antes de subir." -ForegroundColor Red
    exit 1
}
Write-Host "      Build concluido com sucesso." -ForegroundColor Green

# 3. Status do Git
Write-Host "`n[3/5] Status do repositório..." -ForegroundColor Yellow
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "      Nenhuma alteracao pendente. Nada para subir." -ForegroundColor Gray
    exit 0
}
Write-Host $status -ForegroundColor Gray

# 4. Adicionar e commit
Write-Host "`n[4/5] Adicionando arquivos e commitando..." -ForegroundColor Yellow
git add .
$commitMsg = ($args -join " ").Trim()
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "chore: atualizacao do projeto $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git commit -m "$commitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Commit cancelado ou sem alteracoes." -ForegroundColor Yellow
    exit 0
}
Write-Host "      Commit realizado." -ForegroundColor Green

# 5. Push para GitHub
Write-Host "`n[5/5] Enviando para GitHub..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERRO: Push falhou. Verifique sua conexao e credenciais." -ForegroundColor Red
    exit 1
}

Write-Host "`n*** Concluido com sucesso! ***`n" -ForegroundColor Green
