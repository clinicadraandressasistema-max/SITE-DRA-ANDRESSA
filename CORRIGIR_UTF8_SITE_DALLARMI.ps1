$ErrorActionPreference = "Stop"
Set-Location "C:\Projetos\SITE-DRA-ANDRESSA"

Write-Host "`n=== CORRECAO GLOBAL DE ACENTOS / UTF-8 ===" -ForegroundColor Cyan
Write-Host "O problema nao e a fonte visual: sao caracteres UTF-8 corrompidos (ex.: Ã, â€ etc.)." -ForegroundColor DarkGray

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = ".backup-utf8-$stamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

# Pastas e arquivos de texto que fazem parte do site.
$roots = @(".\src", ".\public", ".\scripts")
$extensions = @(".tsx",".ts",".css",".html",".json",".js",".mjs",".md",".txt",".webmanifest")
$files = New-Object System.Collections.Generic.List[System.IO.FileInfo]

foreach ($root in $roots) {
  if (Test-Path $root) {
    Get-ChildItem $root -Recurse -File | Where-Object {
      $extensions -contains $_.Extension.ToLower()
    } | ForEach-Object { $files.Add($_) }
  }
}

if (Test-Path ".\index.html") {
  $files.Add((Get-Item ".\index.html"))
}

# Remove qualquer arquivo dentro de backups, dist, node_modules ou .git por seguranca.
$files = $files | Where-Object {
  $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\\.git\\|\\\.backup'
} | Sort-Object FullName -Unique

# Caracteres corretos que costumam virar mojibake ao serem interpretados como Windows-1252.
$targets = @(
  "á","à","â","ã","ä","Á","À","Â","Ã","Ä",
  "é","è","ê","ë","É","È","Ê","Ë",
  "í","ì","î","ï","Í","Ì","Î","Ï",
  "ó","ò","ô","õ","ö","Ó","Ò","Ô","Õ","Ö",
  "ú","ù","û","ü","Ú","Ù","Û","Ü",
  "ç","Ç","ñ","Ñ",
  "—","–","‘","’","“","”","…","•","→","←","✓","×","º","ª","€"
)

$utf8 = [System.Text.Encoding]::UTF8
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Repair-Mojibake([string]$text) {
  $current = $text

  # Ate 4 passagens para corrigir inclusive texto duplamente corrompido.
  for ($pass = 0; $pass -lt 4; $pass++) {
    $before = $current

    foreach ($good in $targets) {
      $bytes = $utf8.GetBytes($good)
      $bad = $cp1252.GetString($bytes)

      if ($bad -ne $good -and $current.Contains($bad)) {
        $current = $current.Replace($bad, $good)
      }
    }

    # Casos comuns adicionais.
    $current = $current.Replace("Â ", " ")
    $current = $current.Replace("Â ", " ")
    $current = $current.Replace("ï»¿", "")
    $current = $current.Replace("âœ“", "✓")
    $current = $current.Replace("âœ”", "✔")
    $current = $current.Replace("â†’", "→")
    $current = $current.Replace("â†", "←")

    if ($current -eq $before) { break }
  }

  return $current
}

$changed = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
  $relative = Resolve-Path -Relative $file.FullName
  $original = [System.IO.File]::ReadAllText($file.FullName)
  $fixed = Repair-Mojibake $original

  if ($fixed -ne $original) {
    $backupPath = Join-Path $backupRoot ($relative.TrimStart(".\"))
    $backupDir = Split-Path $backupPath -Parent
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Copy-Item $file.FullName $backupPath -Force

    [System.IO.File]::WriteAllText($file.FullName, $fixed, $utf8NoBom)
    $changed.Add($relative.TrimStart(".\"))
    Write-Host "CORRIGIDO: $relative" -ForegroundColor Green
  }
}

Write-Host "`nArquivos corrigidos: $($changed.Count)" -ForegroundColor Cyan

# Verifica se ainda existem sequencias suspeitas.
$suspicious = New-Object System.Collections.Generic.List[string]
foreach ($file in $files) {
  $text = [System.IO.File]::ReadAllText($file.FullName)
  if ($text -match 'Ã.|Â.|â€|â†|ï¿½|�') {
    $suspicious.Add((Resolve-Path -Relative $file.FullName))
  }
}

if ($suspicious.Count -gt 0) {
  Write-Host "`nATENCAO: ainda existem sequencias suspeitas nestes arquivos:" -ForegroundColor Yellow
  $suspicious | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
  Write-Host "O script vai testar o build, mas NAO vai publicar automaticamente enquanto houver caracteres suspeitos." -ForegroundColor Yellow
}

Write-Host "`n=== TESTANDO BUILD ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host "`nBUILD COM ERRO. NADA FOI PUBLICADO." -ForegroundColor Red
  Write-Host "Backup de seguranca: $backupRoot" -ForegroundColor Yellow
  exit 1
}

if ($suspicious.Count -gt 0) {
  Write-Host "`nBUILD OK, MAS PUBLICACAO BLOQUEADA POR SEGURANCA." -ForegroundColor Yellow
  Write-Host "Me envie o print desta lista para eu corrigir os casos restantes." -ForegroundColor Yellow
  exit 2
}

if ($changed.Count -eq 0) {
  Write-Host "`nNenhum mojibake foi encontrado. O site ja esta limpo nos arquivos verificados." -ForegroundColor Green
  exit 0
}

Write-Host "`n=== PUBLICANDO SOMENTE OS ARQUIVOS CORRIGIDOS ===" -ForegroundColor Cyan

foreach ($path in $changed) {
  git add -- "$path"
}

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Corrige codificacao UTF-8 e acentuacao do site"
}

git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n============================================" -ForegroundColor Green
  Write-Host "UTF-8 CORRIGIDO E PUBLICADO COM SUCESSO!" -ForegroundColor Green
  Write-Host "============================================" -ForegroundColor Green
  Write-Host "Aguarde 1-3 minutos e use Ctrl+Shift+R no navegador." -ForegroundColor Yellow
  Write-Host "Backup local: $backupRoot" -ForegroundColor DarkGray
} else {
  Write-Host "`nO BUILD DEU CERTO, MAS O PUSH NAO FOI CONCLUIDO." -ForegroundColor Red
  Write-Host "As correcoes continuam salvas localmente." -ForegroundColor Yellow
}
