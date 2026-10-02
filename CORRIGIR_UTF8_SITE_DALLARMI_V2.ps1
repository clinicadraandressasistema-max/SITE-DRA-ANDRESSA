$ErrorActionPreference = "Stop"
Set-Location "C:\Projetos\SITE-DRA-ANDRESSA"

Write-Host ""
Write-Host "=== DALLARMI | CORRECAO GLOBAL UTF-8 V2 ===" -ForegroundColor Cyan
Write-Host "Este script usa Node.js para evitar o erro de parser do PowerShell." -ForegroundColor DarkGray

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path (Get-Location) ".backup-utf8-v2-$stamp"
$changedList = Join-Path $env:TEMP "dallarmi-utf8-changed-$stamp.txt"
$warningList = Join-Path $env:TEMP "dallarmi-utf8-warning-$stamp.txt"
$nodeScript = Join-Path $env:TEMP "dallarmi-utf8-fix-$stamp.mjs"

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

$env:DALLARMI_ROOT = (Get-Location).Path
$env:DALLARMI_BACKUP = $backupRoot
$env:DALLARMI_CHANGED = $changedList
$env:DALLARMI_WARNINGS = $warningList

$node = @'
import fs from "node:fs";
import path from "node:path";

const root = process.env.DALLARMI_ROOT;
const backupRoot = process.env.DALLARMI_BACKUP;
const changedFile = process.env.DALLARMI_CHANGED;
const warningFile = process.env.DALLARMI_WARNINGS;

const allowed = new Set([
  ".tsx", ".ts", ".css", ".html", ".json", ".js", ".mjs",
  ".md", ".txt", ".webmanifest"
]);

const roots = ["src", "public", "scripts"];
const files = [];

function shouldSkip(fullPath) {
  const normalized = fullPath.replaceAll("\\", "/").toLowerCase();
  return (
    normalized.includes("/node_modules/") ||
    normalized.includes("/dist/") ||
    normalized.includes("/.git/") ||
    normalized.includes("/.backup") ||
    normalized.includes(".backup-") ||
    normalized.endsWith(".bak") ||
    normalized.includes("/backup/")
  );
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldSkip(full)) continue;

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (allowed.has(ext)) files.push(full);
  }
}

for (const item of roots) walk(path.join(root, item));

const indexHtml = path.join(root, "index.html");
if (fs.existsSync(indexHtml)) files.push(indexHtml);

const decoder1252 = new TextDecoder("windows-1252");

function mojibakeOf(text) {
  return decoder1252.decode(Buffer.from(text, "utf8"));
}

const codePoints = [
  0x00E1,0x00E0,0x00E2,0x00E3,0x00E4,
  0x00C1,0x00C0,0x00C2,0x00C3,0x00C4,
  0x00E9,0x00E8,0x00EA,0x00EB,
  0x00C9,0x00C8,0x00CA,0x00CB,
  0x00ED,0x00EC,0x00EE,0x00EF,
  0x00CD,0x00CC,0x00CE,0x00CF,
  0x00F3,0x00F2,0x00F4,0x00F5,0x00F6,
  0x00D3,0x00D2,0x00D4,0x00D5,0x00D6,
  0x00FA,0x00F9,0x00FB,0x00FC,
  0x00DA,0x00D9,0x00DB,0x00DC,
  0x00E7,0x00C7,0x00F1,0x00D1,
  0x2014,0x2013,0x2018,0x2019,0x201C,0x201D,
  0x2026,0x2022,0x2192,0x2190,0x2713,0x2714,
  0x00D7,0x00BA,0x00AA,0x00B0,0x20AC
];

const replacements = [];

for (const cp of codePoints) {
  const good = String.fromCodePoint(cp);
  let bad = good;

  for (let level = 1; level <= 4; level++) {
    bad = mojibakeOf(bad);
    if (bad !== good) replacements.push([bad, good]);
  }
}

replacements.sort((a, b) => b[0].length - a[0].length);

function replaceAllLiteral(text, search, replacement) {
  if (!search || !text.includes(search)) return text;
  return text.split(search).join(replacement);
}

function repair(text) {
  let current = text.replace(/^\uFEFF/, "");

  for (let pass = 0; pass < 5; pass++) {
    const before = current;

    for (const [bad, good] of replacements) {
      current = replaceAllLiteral(current, bad, good);
    }

    current = replaceAllLiteral(current, "\u00C2\u00A0", " ");
    current = replaceAllLiteral(current, "\u00C2 ", " ");

    if (current === before) break;
  }

  return current;
}

function unresolved(text) {
  if (text.includes("\uFFFD")) return true;

  for (const [bad] of replacements) {
    if (bad.length > 1 && text.includes(bad)) return true;
  }

  return false;
}

const changed = [];
const warnings = [];

for (const file of [...new Set(files)]) {
  let original;
  try {
    original = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const fixed = repair(original);

  if (fixed !== original) {
    const relative = path.relative(root, file);
    const backupPath = path.join(backupRoot, relative);

    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(file, backupPath);
    fs.writeFileSync(file, fixed, "utf8");

    changed.push(relative);
  }

  const finalText = fixed;
  if (unresolved(finalText)) {
    warnings.push(path.relative(root, file));
  }
}

fs.writeFileSync(changedFile, changed.join("\n"), "utf8");
fs.writeFileSync(warningFile, [...new Set(warnings)].join("\n"), "utf8");

console.log("");
console.log("Arquivos corrigidos:", changed.length);
for (const item of changed) console.log("  OK  " + item);

if (warnings.length) {
  console.log("");
  console.log("Arquivos com sequencias ainda suspeitas:", warnings.length);
  for (const item of [...new Set(warnings)]) console.log("  !!  " + item);
}
'@

[System.IO.File]::WriteAllText($nodeScript, $node, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host "=== 1. CORRIGINDO TEXTOS ===" -ForegroundColor Cyan
node $nodeScript

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "A correcao de texto falhou. Nada foi publicado." -ForegroundColor Red
  Remove-Item $nodeScript -Force -ErrorAction SilentlyContinue
  exit 1
}

$changed = @()
if (Test-Path $changedList) {
  $changed = @(Get-Content $changedList | Where-Object { $_.Trim() -ne "" })
}

$warnings = @()
if (Test-Path $warningList) {
  $warnings = @(Get-Content $warningList | Where-Object { $_.Trim() -ne "" })
}

Write-Host ""
Write-Host "=== 2. TESTANDO BUILD ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "BUILD COM ERRO. NADA FOI PUBLICADO." -ForegroundColor Red
  Write-Host "Backup dos arquivos alterados: $backupRoot" -ForegroundColor Yellow
  Remove-Item $nodeScript,$changedList,$warningList -Force -ErrorAction SilentlyContinue
  exit 1
}

if ($warnings.Count -gt 0) {
  Write-Host ""
  Write-Host "BUILD OK, MAS A PUBLICACAO FOI BLOQUEADA POR SEGURANCA." -ForegroundColor Yellow
  Write-Host "Ainda existem sequencias suspeitas em:" -ForegroundColor Yellow
  foreach ($item in $warnings) {
    Write-Host " - $item" -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "Me envie um print desta lista. Nao rode git add nem git push." -ForegroundColor Yellow
  Remove-Item $nodeScript,$changedList,$warningList -Force -ErrorAction SilentlyContinue
  exit 2
}

if ($changed.Count -eq 0) {
  Write-Host ""
  Write-Host "BUILD OK. Nenhum texto corrompido foi encontrado nos arquivos ativos." -ForegroundColor Green
  Remove-Item $nodeScript,$changedList,$warningList -Force -ErrorAction SilentlyContinue
  exit 0
}

Write-Host ""
Write-Host "=== 3. PUBLICANDO SOMENTE AS CORRECOES UTF-8 ===" -ForegroundColor Cyan

foreach ($item in $changed) {
  git add -- "$item"
}

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Corrige acentuacao e codificacao UTF-8 do site"
}

git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "==============================================" -ForegroundColor Green
  Write-Host "UTF-8 CORRIGIDO E PUBLICADO COM SUCESSO!" -ForegroundColor Green
  Write-Host "==============================================" -ForegroundColor Green
  Write-Host "Aguarde 1-3 minutos e use Ctrl+Shift+R." -ForegroundColor Yellow
  Write-Host "Backup local: $backupRoot" -ForegroundColor DarkGray
} else {
  Write-Host ""
  Write-Host "O BUILD DEU CERTO, MAS O PUSH NAO FOI CONCLUIDO." -ForegroundColor Red
  Write-Host "As correcoes ficaram salvas localmente." -ForegroundColor Yellow
}

Remove-Item $nodeScript,$changedList,$warningList -Force -ErrorAction SilentlyContinue
