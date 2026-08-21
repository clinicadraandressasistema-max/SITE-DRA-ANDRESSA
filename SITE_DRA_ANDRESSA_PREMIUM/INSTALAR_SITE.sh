#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$TARGET_DIR/site_backup_$STAMP"

if [[ "$PACKAGE_DIR" == "$TARGET_DIR" ]]; then
  echo "Execute este instalador a partir da raiz do seu repositório, mantendo a pasta do pacote dentro dele."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
for item in src public .github scripts package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json wrangler.jsonc .env.example .gitignore README.md; do
  if [[ -e "$TARGET_DIR/$item" ]]; then
    cp -a "$TARGET_DIR/$item" "$BACKUP_DIR/" 2>/dev/null || true
  fi
done

echo "Backup criado em: $(basename "$BACKUP_DIR")"

for item in src public .github scripts package.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json wrangler.jsonc .env.example .gitignore README.md; do
  rm -rf "$TARGET_DIR/$item"
  cp -a "$PACKAGE_DIR/$item" "$TARGET_DIR/$item"
done

echo "Arquivos instalados."
echo "Agora execute: npm install && npm run build"
