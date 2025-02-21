#!/bin/bash
set -e

# Adiciona o caminho do Bun ao PATH dentro do script
export PATH="$HOME/.bun/bin:$PATH"

ln -s /usr/local/bin/bun /usr/local/bin/bunx

bunx pnpm run build
