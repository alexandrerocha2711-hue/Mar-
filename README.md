# MARÉ — arquivos de tema

Primeiro commit. Todos os arquivos são **prefixados `mare-`** e nenhum arquivo do
tema base é tocado — a atualização do tema não vai sobrescrever nada daqui.

---

## Onde cada arquivo vai

```
assets/mare-tokens.css              → paleta oficial e tokens
assets/mare-carrinho.js             → Cart AJAX API com repintura por `sections=`
snippets/mare-preco.liquid          → preço, parcelamento, preço por dose
sections/mare-hero-sabores.liquid   → hero explorador de sabores (home)
sections/mare-barra-frete.liquid    → barra de progresso escalonada (drawer/carrinho)
```

Copie mantendo a estrutura de pastas. A Shopify rejeita arquivo fora dela.

---

## 1. Carregar os assets

No `layout/theme.liquid`, antes de `</head>`:

```liquid
{{ 'mare-tokens.css' | asset_url | stylesheet_tag }}
<script src="{{ 'mare-carrinho.js' | asset_url }}" defer></script>
```

As fontes (Fredoka 600 + Instrument Sans 400/600) devem ser carregadas pelo tema
base ou por `@font-face` próprio. Não use `@import` — bloqueia o render.

---

## 2. Contrato de tags

As coleções da loja são **inteligentes, por tag**. Um produto sem a tag certa
não aparece na coleção — não existe curadoria manual.

| Tag | Coleção |
|---|---|
| `sabor` | Sabores |
| `momento-manha` | De manhã |
| `momento-meio-do-dia` | No meio do dia |
| `momento-fim-da-tarde` | No fim da tarde |
| `kit` | Kits |

Os três SKUs já estão com as quatro primeiras tags.

> **Decisão em aberto:** hoje os três sabores carregam os três momentos, porque o
> brandbook não mapeia sabor → momento. Isso torna as coleções de momento
> *editoriais* (três portas de entrada com a mesma vitrine) em vez de *filtros*.
> Se a intenção for filtrar, cada sabor precisa de um momento primário.

---

## 3. Metafields a criar

Nenhum existe ainda. Sem eles os arquivos **degradam sem quebrar** — o preço por
dose e o descritor simplesmente não aparecem.

Admin → Configurações → Metafields e metaobjetos → Produtos:

| Namespace e chave | Tipo | Para quê |
|---|---|---|
| `mare.doses` | Inteiro | Preço por dose. **Sem isso a linha não aparece.** |
| `mare.descritor` | Lista de texto (linha única) | As três palavras de sabor |
| `mare.cor` | Cor | Fundo do card e do hero por SKU |

Valores prontos para colar:

| Produto | `mare.descritor` | `mare.cor` |
|---|---|---|
| Pitaya com Morango | doce, floral, vibrante | `#E8156B` |
| Morango com Limão | cítrico, doce, redondo | `#FF9500` |
| Melancia | fresco, leve, suave | `#FF5436` |

As cores vêm da prancha 31: cada pouch tem a sua. Os descritores são propostos —
aprove ou troque, mas mantenha três palavras sensoriais e **nenhuma menção a
efeito no corpo**.

`mare.doses` ficou em branco de propósito: ninguém informou a gramatura nem o
rendimento do pouch, e preço por dose errado é preço anunciado errado.

---

## 4. Ordem de montagem no editor

1. **Home** → adicionar *Hero sabores*, apontar para a coleção **Sabores**
2. **Carrinho / drawer** → adicionar *Barra de frete*
3. Conferir no celular, em 4G, nas duas orientações

Os degraus da barra vêm em centavos: `19900` = R$ 199,00. O padrão está em
frete grátis a R$ 199 e mixer a R$ 299, com o terceiro degrau desligado.

---

## 5. O que estes arquivos deliberadamente NÃO fazem

- **Não adicionam brinde nem aplicam desconto.** A barra comunica o degrau; quem
  adiciona o mixer e desconta é uma **Discount Function**, que roda no servidor e
  vale também no checkout. Item empurrado por JavaScript pode ser removido pelo
  cliente e vira inconsistência de preço.
- **Não têm seletor de assinatura.** Não existe selling plan na loja ainda. O
  seletor entra quando o app de assinatura criar os planos.
- **Não escrevem preço em lugar nenhum.** Todo número sai de `variant.price`.

---

## 6. Antes de publicar

- [ ] Confirmar no admin que o `compareAtPrice` de R$ 149,90 gravou nos três SKUs
- [ ] Subir as fotos dos pouches e definir a imagem destacada
- [ ] Criar os metafields acima
- [ ] Gateway com Pix, cartão parcelado e boleto — testado com transação real
- [ ] Rodapé com razão social, CNPJ, endereço e SAC
- [ ] Políticas: privacidade, trocas, envio, termos
- [ ] Direito de arrependimento de 7 dias, claro e ostensivo
- [ ] Definir a data de término do preço de lançamento e honrar os R$ 149,90
      depois dela — comparativo que nunca é praticado é âncora falsa
- [ ] LCP mobile abaixo de 2,0 s medido em campo
