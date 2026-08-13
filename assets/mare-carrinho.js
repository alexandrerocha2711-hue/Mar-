/* ==========================================================================
   MARÉ — carrinho
   Adiciona ao carrinho e repinta as sections com o HTML que o SERVIDOR
   devolveu. Nada é recalculado no navegador. O parâmetro `sections` da Cart
   AJAX API é o que torna isso possível.

   Regras da plataforma respeitadas: IIFE, sem framework, defer, e melhoria
   progressiva (se falhar, o <form> HTML ainda envia).
   ========================================================================== */

(function () {
  'use strict';

  var SECOES = ['mare-barra-frete'];

  function alvo(nome) {
    return document.getElementById('shopify-section-' + nome);
  }

  function repintar(sections) {
    if (!sections) return;
    SECOES.forEach(function (nome) {
      var el = alvo(nome);
      var html = sections[nome];
      if (!el || !html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var novo = doc.getElementById('shopify-section-' + nome);
      if (novo) el.innerHTML = novo.innerHTML;
    });
  }

  function avisar(nome, detalhe) {
    document.dispatchEvent(new CustomEvent('mare:' + nome, { detail: detalhe }));
  }

  function raiz() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  async function adicionar(itens) {
    var resposta = await fetch(raiz() + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        items: itens,
        sections: SECOES.join(','),
        sections_url: window.location.pathname
      })
    });

    var dados = await resposta.json();

    if (!resposta.ok) {
      avisar('carrinho:erro', dados);
      throw new Error(dados.description || 'Não foi possível adicionar ao carrinho.');
    }

    repintar(dados.sections);
    avisar('carrinho:atualizado', dados);
    return dados;
  }

  async function alterar(linha, quantidade) {
    var resposta = await fetch(raiz() + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        line: linha,
        quantity: quantidade,
        sections: SECOES.join(','),
        sections_url: window.location.pathname
      })
    });

    var dados = await resposta.json();
    if (!resposta.ok) {
      avisar('carrinho:erro', dados);
      throw new Error(dados.description || 'Não foi possível atualizar o carrinho.');
    }

    repintar(dados.sections);
    avisar('carrinho:atualizado', dados);
    return dados;
  }

  /* Compra rápida: intercepta form[data-mare-quick-add].
     Sem o script, o form envia normalmente. */
  document.addEventListener('submit', function (evento) {
    var form = evento.target;
    if (!form.matches || !form.matches('form[data-mare-quick-add]')) return;

    evento.preventDefault();

    var botao = form.querySelector('[type="submit"]');
    var rotuloOriginal = botao ? botao.textContent : null;
    var id = form.querySelector('[name="id"]');
    if (!id) return;

    var plano = form.querySelector('[name="selling_plan"]');
    var item = { id: Number(id.value), quantity: 1 };
    if (plano && plano.value) item.selling_plan = Number(plano.value);

    if (botao) { botao.disabled = true; botao.textContent = 'Adicionando…'; }

    adicionar([item])
      .then(function () { if (botao) botao.textContent = 'Na sacola'; })
      .catch(function (erro) {
        if (botao) botao.textContent = rotuloOriginal;
        console.error('[MARÉ]', erro);
      })
      .finally(function () {
        if (!botao) return;
        setTimeout(function () {
          botao.disabled = false;
          botao.textContent = rotuloOriginal;
        }, 2000);
      });
  });

  window.MareCarrinho = { adicionar: adicionar, alterar: alterar, secoes: SECOES };
})();
