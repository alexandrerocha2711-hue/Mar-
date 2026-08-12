#!/usr/bin/env bash
# =============================================================================
# MARÉ — preparar o repositório de tema
#
# POR QUE ESTE SCRIPT EXISTE
# A integração GitHub da Shopify espera um TEMA COMPLETO no repositório.
# Commitar só os 5 arquivos `mare-` num repo vazio e conectar não funciona:
# sem layout/theme.liquid, templates/, config/ e locales/ não existe tema, e a
# Shopify recusa ou cria um tema quebrado.
#
# Ordem correta: tema base primeiro, arquivos MARÉ por cima.
#
# USO
#   1. Baixe os 5 arquivos do chat e coloque-os numa pasta `mare-theme/`
#      ao lado deste script, mantendo a estrutura assets/ sections/ snippets/
#   2. bash mare-instalar.sh
#   3. git push -u origin main
# =============================================================================

set -euo pipefail

LOJA="mare-190393.myshopify.com"
ORIGEM="mare-theme"

info() { printf '\n\033[1;35m▸ %s\033[0m\n' "$1"; }
erro() { printf '\n\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# --- 0. Pré-requisitos ------------------------------------------------------
command -v git >/dev/null || erro "git não encontrado."
command -v shopify >/dev/null || erro "Shopify CLI não encontrada. Instale com: npm install -g @shopify/cli"
[ -d .git ] || erro "Rode este script DENTRO do repositório clonado."
[ -d "$ORIGEM" ] || erro "Pasta '$ORIGEM/' não encontrada. Baixe os arquivos do chat primeiro."

for f in \
  "$ORIGEM/assets/mare-tokens.css" \
  "$ORIGEM/assets/mare-carrinho.js" \
  "$ORIGEM/snippets/mare-preco.liquid" \
  "$ORIGEM/sections/mare-hero-sabores.liquid" \
  "$ORIGEM/sections/mare-barra-frete.liquid"
do
  [ -f "$f" ] || erro "Faltando: $f"
done
info "Pré-requisitos OK."

# --- 1. Tema base -----------------------------------------------------------
# Baixa o tema publicado da loja. É ele que torna o repositório um tema válido.
if [ -f layout/theme.liquid ]; then
  info "Tema base já presente. Pulando o download."
else
  info "Baixando o tema base de $LOJA (vai abrir o navegador para autenticar)…"
  shopify theme pull --store "$LOJA" --path . --live
  [ -f layout/theme.liquid ] || erro "layout/theme.liquid não veio. O download falhou."
fi

# --- 2. Arquivos MARÉ por cima ---------------------------------------------
info "Copiando os arquivos MARÉ…"
mkdir -p assets sections snippets
cp "$ORIGEM/assets/"*        assets/
cp "$ORIGEM/sections/"*      sections/
cp "$ORIGEM/snippets/"*      snippets/
[ -f "$ORIGEM/README.md" ] && cp "$ORIGEM/README.md" README.md

# Nenhum arquivo do tema base pode ter sido sobrescrito: tudo é prefixado.
NAO_PREFIXADO=$(cd "$ORIGEM" && find assets sections snippets -type f \
  ! -name 'mare-*' 2>/dev/null || true)
[ -z "$NAO_PREFIXADO" ] || erro "Arquivo sem prefixo mare- detectado:
$NAO_PREFIXADO
Isso sobrescreveria o tema base na próxima atualização."
info "Todos os arquivos estão prefixados. Tema base intacto."

# --- 3. Validação -----------------------------------------------------------
info "Rodando Theme Check…"
if shopify theme check; then
  info "Theme Check passou."
else
  printf '\n\033[1;33m! Theme Check apontou problemas acima.\033[0m\n'
  printf '  Erros são bloqueio. Avisos herdados do tema base podem seguir.\n'
  read -r -p "  Continuar mesmo assim? [s/N] " R
  [[ "${R:-N}" =~ ^[SsYy]$ ]] || erro "Interrompido."
fi

# --- 4. Higiene do repositório ---------------------------------------------
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'IGN'
.shopify/
node_modules/
.env
.env.*
*.log
.DS_Store
IGN
  info ".gitignore criado."
fi

# Nada de segredo no tema. Verificação simples, mas pega o caso comum.
if grep -rInE '(shpat_|shpca_|shppa_|SHOPIFY_[A-Z_]*(SECRET|TOKEN|KEY)\s*=)' \
   --include='*.liquid' --include='*.js' --include='*.json' . 2>/dev/null; then
  erro "Possível token/segredo nos arquivos acima. Remova antes de commitar."
fi
info "Nenhum segredo aparente."

# --- 5. Commit --------------------------------------------------------------
git add -A
if git diff --cached --quiet; then
  info "Nada novo para commitar."
else
  git commit -m "feat(tema): tema base + componentes MARÉ

- assets/mare-tokens.css        paleta oficial do Brandbook 2026
- assets/mare-carrinho.js       Cart AJAX API com repintura via sections=
- snippets/mare-preco.liquid    preço, parcelamento e preço por dose
- sections/mare-hero-sabores    hero explorador de sabores
- sections/mare-barra-frete     barra de progresso escalonada"
  info "Commit criado."
fi

cat <<'FIM'

─────────────────────────────────────────────────────────────
PRÓXIMOS PASSOS

  1. git push -u origin main

  2. No admin: Loja virtual → Temas → Adicionar tema
     → Conectar do GitHub → escolher o repositório e a branch

  3. NÃO publique direto. Pré-visualize, teste no celular em 4G,
     e só então publique.

  4. Deixe o repositório PRIVADO. Público não me deu acesso de
     escrita e expõe a lógica inteira da loja. A integração da
     Shopify funciona normalmente em repositório privado.
─────────────────────────────────────────────────────────────
FIM
